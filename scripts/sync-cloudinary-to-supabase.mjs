import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const manifest = JSON.parse(fs.readFileSync("scripts/cloudinary-manifest.json", "utf8"));
const assets = manifest.assets;

async function sync() {
  console.log("=== Syncing Cloudinary URLs to Supabase ===");

  // 1. Update media_assets
  const { data: mediaRows, error: mediaErr } = await supabase
    .from("media_assets")
    .select("id, storage_path");
  if (mediaErr) {
    console.error("Error fetching media_assets:", mediaErr);
  } else if (mediaRows) {
    for (const row of mediaRows) {
      const cUrl = assets[row.storage_path];
      if (cUrl) {
        const { error: updateErr } = await supabase
          .from("media_assets")
          .update({ storage_path: cUrl })
          .eq("id", row.id);
        if (updateErr) {
          console.error(`Error updating media_asset ${row.id}:`, updateErr.message);
        } else {
          console.log(`Updated media_asset ${row.id} -> ${cUrl}`);
        }
      }
    }
  }

  // 2. Update events featured_image
  const { data: eventRows, error: eventErr } = await supabase
    .from("events")
    .select("id, slug, featured_image");
  if (eventErr) {
    console.error("Error fetching events:", eventErr);
  } else if (eventRows) {
    for (const ev of eventRows) {
      if (ev.featured_image && assets[ev.featured_image]) {
        const cUrl = assets[ev.featured_image];
        const { error: updateErr } = await supabase
          .from("events")
          .update({ featured_image: cUrl })
          .eq("id", ev.id);
        if (updateErr) {
          console.error(`Error updating event ${ev.slug}:`, updateErr.message);
        } else {
          console.log(`Updated event ${ev.slug} -> ${cUrl}`);
        }
      }
    }
  }

  console.log("Sync complete!");
}

sync().catch(console.error);
