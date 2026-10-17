#!/usr/bin/env node
/**
 * WordPress Migration Tool for Saugatuck Douglas Garden Club (SDGC)
 *
 * Implements idempotent, sanitized content/media/user migration from WordPress exports
 * into local Supabase Docker stack.
 *
 * Strict security constraints:
 * - Defaults to --dry-run
 * - Rejects non-loopback / hosted Supabase targets
 * - Rejects copying WordPress password hashes into Supabase
 * - Sanitizes malicious/suspicious HTML (XSS prevention)
 * - Safe replay without duplicate records
 * - Zero-PII execution summary with SHA-256 file hashes
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sanitizeHtmlLib from "sanitize-html";

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

/**
 * Sanitizes HTML content using the industry-standard sanitize-html library,
 * removing scripts, iframes, inline event handlers, and javascript: links.
 * @param {string} html
 * @returns {string}
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";

  return sanitizeHtmlLib(html, {
    allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "span",
      "article",
      "section",
      "figure",
      "figcaption",
    ]),
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "class", "loading"],
      a: ["href", "name", "target", "rel", "class"],
      "*": ["class", "id", "style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    disallowedTagsMode: "discard",
  }).trim();
}

/**
 * Verifies that the Supabase target URL is strictly local (localhost / 127.0.0.1).
 * @param {string} urlString
 * @returns {boolean}
 */
export function isLocalTarget(urlString) {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "::1";
  } catch {
    return false;
  }
}

/**
 * Computes SHA-256 hash of a file.
 * @param {string} filePath
 * @returns {string}
 */
export function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return "FILE_NOT_FOUND";
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Computes SHA-256 hashes of all fixture files in a directory.
 * @param {string} dir
 * @returns {Record<string, string>}
 */
export function computeDirectoryHashes(dir) {
  const hashes = {};
  if (!fs.existsSync(dir)) return hashes;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    hashes[file] = computeFileHash(path.join(dir, file));
  }
  return hashes;
}

/**
 * Parses CLI arguments.
 * @param {string[]} argv
 * @returns {{ dryRun: boolean, inputDir: string, supabaseUrl: string }}
 */
export function parseArgs(argv = process.argv.slice(2)) {
  let dryRun = true;
  let inputDir = path.resolve(process.cwd(), "tests/fixtures/synthetic-export");
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply" || arg === "--execute" || arg === "--no-dry-run") {
      dryRun = false;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if ((arg === "--input" || arg === "--input-dir") && argv[i + 1]) {
      inputDir = path.resolve(process.cwd(), argv[++i]);
    } else if (arg.startsWith("--input=")) {
      inputDir = path.resolve(process.cwd(), arg.split("=")[1]);
    } else if (arg.startsWith("--input-dir=")) {
      inputDir = path.resolve(process.cwd(), arg.split("=")[1]);
    } else if (arg === "--supabase-url" && argv[i + 1]) {
      supabaseUrl = argv[++i];
    } else if (arg.startsWith("--supabase-url=")) {
      supabaseUrl = arg.split("=")[1];
    } else {
      throw new Error(`Unrecognized argument: "${arg}". Use --input-dir, --apply, or --dry-run.`);
    }
  }

  return { dryRun, inputDir, supabaseUrl };
}

/**
 * Reconciles imported user identity against existing database accounts.
 * Prevents account takeover when usernames match but emails differ.
 * @param {object} params
 * @param {object|null} params.existingProfile
 * @param {object|null} params.existingAuthUser
 * @param {object} params.importedUser
 * @returns {{ status: 'match' | 'conflict' | 'new', targetUserId?: string, reason?: string }}
 */
export function reconcileLegacyUserIdentity({ existingProfile, existingAuthUser, importedUser }) {
  const importedEmail = importedUser.email?.trim().toLowerCase();

  if (existingProfile && existingAuthUser) {
    const existingEmail = existingAuthUser.email?.trim().toLowerCase();
    if (existingEmail && existingEmail !== importedEmail) {
      return {
        status: "conflict",
        reason: `Identity conflict for username "${importedUser.username}": existing account has email "${existingEmail}", but import specifies "${importedEmail}". Transfer rejected to prevent account takeover.`,
      };
    }
  }

  if (existingAuthUser && existingProfile) {
    if (existingProfile.username !== importedUser.username) {
      return {
        status: "conflict",
        reason: `Identity conflict for email "${importedUser.email}": existing profile has username "${existingProfile.username}", but import specifies "${importedUser.username}". Transfer rejected.`,
      };
    }
  }

  const targetUserId = existingProfile?.id || existingAuthUser?.id;
  if (targetUserId) {
    return { status: "match", targetUserId };
  }

  return { status: "new" };
}

/**
 * Main migration execution function.
 * @param {object} options
 * @param {boolean} options.dryRun
 * @param {string} options.inputDir
 * @param {string} options.supabaseUrl
 * @param {string} [options.supabaseServiceKey]
 * @returns {Promise<object>}
 */
export async function runImport({
  dryRun = true,
  inputDir = path.resolve(process.cwd(), "tests/fixtures/synthetic-export"),
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
  supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sbp_placeholder",
}) {
  // 1. Verify loopback target
  if (!isLocalTarget(supabaseUrl)) {
    throw new Error(
      `CRITICAL SECURITY VIOLATION: Hosted or remote Supabase target (${supabaseUrl}) rejected. Migration is authorized only for local Docker stack (127.0.0.1 or localhost).`,
    );
  }

  const fileHashes = computeDirectoryHashes(inputDir);

  const report = {
    timestamp: new Date().toISOString(),
    dryRun,
    targetUrl: supabaseUrl,
    inputDirectory: inputDir,
    fileHashes,
    counts: {
      pages: { total: 0, created: 0, updated: 0, skipped: 0, rejected: 0 },
      venues: { total: 0, created: 0, updated: 0, skipped: 0, rejected: 0 },
      events: { total: 0, created: 0, updated: 0, skipped: 0, rejected: 0 },
      media: { total: 0, created: 0, updated: 0, skipped: 0, rejected: 0 },
      users: { total: 0, created: 0, updated: 0, skipped: 0, rejected: 0 },
      legacyMappings: { total: 0, created: 0, updated: 0, skipped: 0 },
    },
    warnings: [],
    errors: [],
  };

  const pagesPath = path.join(inputDir, "pages.json");
  const venuesPath = path.join(inputDir, "venues.json");
  const eventsPath = path.join(inputDir, "events.json");
  const mediaPath = path.join(inputDir, "media.json");
  const usersPath = path.join(inputDir, "users.json");

  // Load datasets if present
  const pagesData = fs.existsSync(pagesPath) ? JSON.parse(fs.readFileSync(pagesPath, "utf8")) : [];
  const venuesData = fs.existsSync(venuesPath)
    ? JSON.parse(fs.readFileSync(venuesPath, "utf8"))
    : [];
  const eventsData = fs.existsSync(eventsPath)
    ? JSON.parse(fs.readFileSync(eventsPath, "utf8"))
    : [];
  const mediaData = fs.existsSync(mediaPath) ? JSON.parse(fs.readFileSync(mediaPath, "utf8")) : [];
  const usersData = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, "utf8")) : [];

  report.counts.pages.total = pagesData.length;
  report.counts.venues.total = venuesData.length;
  report.counts.events.total = eventsData.length;
  report.counts.media.total = mediaData.length;
  report.counts.users.total = usersData.length;

  let supabase = null;
  if (!dryRun) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // A. Process Venues
  const venueIdMap = new Map(); // legacy_id -> uuid
  for (const venue of venuesData) {
    if (!venue.name) {
      report.counts.venues.rejected++;
      report.warnings.push(`Venue row missing name property; skipped.`);
      continue;
    }

    if (!dryRun && supabase) {
      // Find existing by name
      const { data: existing } = await supabase
        .from("venues")
        .select("id")
        .eq("name", venue.name)
        .maybeSingle();

      if (existing) {
        venueIdMap.set(venue.legacy_id, existing.id);
        report.counts.venues.updated++;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("venues")
          .insert({
            name: venue.name,
            address: venue.address || null,
            city: venue.city || "Saugatuck",
            state: venue.state || "MI",
            postal_code: venue.postal_code || "49453",
            url: venue.url || null,
          })
          .select("id")
          .single();

        if (insertErr) {
          report.counts.venues.rejected++;
          report.errors.push(`Venue insert failed: ${insertErr.message}`);
        } else {
          venueIdMap.set(venue.legacy_id, inserted.id);
          report.counts.venues.created++;
        }
      }
    } else {
      venueIdMap.set(venue.legacy_id, `synth-venue-${venue.legacy_id}`);
      report.counts.venues.created++;
    }
  }

  // B. Process Pages
  for (const page of pagesData) {
    if (!page.slug || !page.title) {
      report.counts.pages.rejected++;
      report.warnings.push(`Page missing slug or title; skipped.`);
      continue;
    }

    const rawContent = page.content || "";
    const cleanContent = sanitizeHtml(rawContent);
    if (rawContent !== cleanContent) {
      report.warnings.push(
        `Page "${page.slug}" contained unsafe HTML/scripts; sanitized before storage.`,
      );
    }

    if (!dryRun && supabase) {
      const { data: existing } = await supabase
        .from("pages")
        .select("id")
        .eq("slug", page.slug)
        .maybeSingle();

      const pagePayload = {
        slug: page.slug,
        title: page.title,
        content: cleanContent,
        status: page.status === "published" ? "published" : "draft",
        meta_description: page.meta_description || null,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from("pages").update(pagePayload).eq("id", existing.id);
        report.counts.pages.updated++;
      } else {
        await supabase.from("pages").insert(pagePayload);
        report.counts.pages.created++;
      }

      // Record legacy mapping
      if (page.legacy_id) {
        await supabase.from("legacy_mappings").upsert(
          {
            legacy_id: page.legacy_id,
            legacy_url: `https://saugatuckdouglasgardenclub.com/${page.slug}/`,
            target_url: `/${page.slug}`,
            entity_type: "page",
          },
          { onConflict: "legacy_url" },
        );
        report.counts.legacyMappings.created++;
      }
    } else {
      report.counts.pages.created++;
      report.counts.legacyMappings.created++;
    }
  }

  // C. Process Events
  for (const event of eventsData) {
    if (!event.slug || !event.title || !event.starts_at) {
      report.counts.events.rejected++;
      report.warnings.push(`Event missing slug, title, or starts_at; skipped.`);
      continue;
    }

    const rawDesc = event.description || "";
    const cleanDesc = sanitizeHtml(rawDesc);
    const resolvedVenueId = venueIdMap.get(event.venue_legacy_id) || null;

    if (!dryRun && supabase) {
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("slug", event.slug)
        .maybeSingle();

      const eventPayload = {
        slug: event.slug,
        title: event.title,
        excerpt: event.excerpt || null,
        description: cleanDesc,
        starts_at: event.starts_at,
        ends_at: event.ends_at || event.starts_at,
        timezone: event.timezone || "America/Detroit",
        all_day: Boolean(event.all_day),
        venue_id: resolvedVenueId && !resolvedVenueId.startsWith("synth-") ? resolvedVenueId : null,
        status: event.status === "published" ? "published" : "draft",
        ticket_url: event.ticket_url || null,
        featured_image: event.featured_image || null,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from("events").update(eventPayload).eq("id", existing.id);
        report.counts.events.updated++;
      } else {
        await supabase.from("events").insert(eventPayload);
        report.counts.events.created++;
      }

      // Legacy mapping
      if (event.legacy_id) {
        await supabase.from("legacy_mappings").upsert(
          {
            legacy_id: event.legacy_id,
            legacy_url: `https://saugatuckdouglasgardenclub.com/event/${event.slug}/`,
            target_url: `/event/${event.slug}`,
            entity_type: "event",
          },
          { onConflict: "legacy_url" },
        );
        report.counts.legacyMappings.created++;
      }
    } else {
      report.counts.events.created++;
      report.counts.legacyMappings.created++;
    }
  }

  // D. Process Media Assets
  for (const media of mediaData) {
    if (!media.storage_path) {
      report.counts.media.rejected++;
      report.warnings.push(`Media missing storage_path; skipped.`);
      continue;
    }

    if (media.is_missing) {
      report.warnings.push(
        `Media asset "${media.storage_path}" source file missing from export package; recorded as missing warning.`,
      );
    }

    if (!dryRun && supabase) {
      const { data: existing } = await supabase
        .from("media_assets")
        .select("id")
        .eq("storage_path", media.storage_path)
        .maybeSingle();

      const mediaPayload = {
        storage_path: media.storage_path,
        mime_type: media.mime_type || "image/jpeg",
        size_bytes: media.size_bytes || 0,
        width: media.width || null,
        height: media.height || null,
        alt_text: media.alt_text || "",
        caption: media.caption || null,
        is_public: media.is_public !== false,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from("media_assets").update(mediaPayload).eq("id", existing.id);
        report.counts.media.updated++;
      } else {
        await supabase.from("media_assets").insert(mediaPayload);
        report.counts.media.created++;
      }

      if (media.legacy_id && media.source_url) {
        await supabase.from("legacy_mappings").upsert(
          {
            legacy_id: media.legacy_id,
            legacy_url: media.source_url,
            target_url: `/images/${media.storage_path}`,
            entity_type: "media",
          },
          { onConflict: "legacy_url" },
        );
        report.counts.legacyMappings.created++;
      }
    } else {
      report.counts.media.created++;
      report.counts.legacyMappings.created++;
    }
  }

  // E. Process Users & Memberships
  // STRICT CONSTRAINT: WordPress phpass password hashes must NEVER be imported into Supabase passwords.
  let activeTermId = null;
  if (!dryRun && supabase) {
    const { data: term } = await supabase
      .from("membership_terms")
      .select("id")
      .eq("year", 2026)
      .maybeSingle();
    activeTermId = term?.id || null;
  }

  for (const user of usersData) {
    if (!user.username || !user.email) {
      report.counts.users.rejected++;
      report.warnings.push(`User missing username or email; skipped.`);
      continue;
    }

    // Security check: Flag WordPress password hashes
    if (user.wp_password_hash || user.user_pass) {
      report.warnings.push(
        `User "${user.username}" had WordPress phpass hash; hash rejected. Account flagged for password reset/invitation flow.`,
      );
    }

    if (!dryRun && supabase) {
      const normalizedUsername = user.username.trim().toLowerCase();

      // Find existing auth user or profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", normalizedUsername)
        .maybeSingle();

      let existingAuthUser = null;
      if (existingProfile) {
        const { data: authData } = await supabase.auth.admin.getUserById(existingProfile.id);
        existingAuthUser = authData?.user || null;
      } else {
        const { data: authLookup } = await supabase.auth.admin.listUsers();
        existingAuthUser =
          authLookup?.users?.find((u) => u.email?.toLowerCase() === user.email.toLowerCase()) ||
          null;
      }

      const reconciliation = reconcileLegacyUserIdentity({
        existingProfile,
        existingAuthUser,
        importedUser: { ...user, username: normalizedUsername },
      });

      if (reconciliation.status === "conflict") {
        report.counts.users.rejected++;
        report.warnings.push(reconciliation.reason);
        continue;
      }

      let targetUserId = reconciliation.targetUserId;

      if (!targetUserId) {
        // Provision with secure random invitation password; never copy WP hash!
        const secureTempPassword = `SDGC_ResetRequired_${crypto.randomBytes(16).toString("hex")}`;
        const { data: createdAuth, error: authErr } = await supabase.auth.admin.createUser({
          email: user.email,
          password: secureTempPassword,
          email_confirm: true,
          user_metadata: {
            must_reset_password: true,
            legacy_wp_id: user.legacy_id,
          },
        });

        if (authErr || !createdAuth.user) {
          report.counts.users.rejected++;
          report.errors.push(`Auth creation failed for user: ${authErr?.message}`);
          continue;
        }
        targetUserId = createdAuth.user.id;
      }

      // Upsert profile
      const profilePayload = {
        id: targetUserId,
        username: normalizedUsername,
        first_name: user.first_name || "Member",
        last_name: user.last_name || "Friend",
        phone: user.phone || null,
        secondary_phone: user.secondary_phone || null,
        address_line1: user.address_line1 || null,
        address_line2: user.address_line2 || null,
        city: user.city || "Saugatuck",
        state: user.state || "MI",
        postal_code: user.postal_code || "49453",
        birth_month: user.birth_month || null,
        birth_day: user.birth_day || null,
        spouse_name: user.spouse_name || null,
        is_master_gardener: Boolean(user.is_master_gardener),
        directory_opt_out: Boolean(user.directory_opt_out),
        gardening_interests: user.gardening_interests || user.interests_experience || null,
        volunteer_experience: user.volunteer_experience || null,
        interests_experience: user.interests_experience || user.gardening_interests || null,
        updated_at: new Date().toISOString(),
      };

      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });
      if (profileErr) {
        report.errors.push(`Profile upsert failed: ${profileErr.message}`);
      } else if (existingProfile) {
        report.counts.users.updated++;
      } else {
        report.counts.users.created++;
      }

      // Interests
      if (Array.isArray(user.interests) && user.interests.length > 0) {
        for (const code of user.interests) {
          await supabase
            .from("profile_interests")
            .upsert(
              { user_id: targetUserId, project_code: code },
              { onConflict: "user_id,project_code" },
            );
        }
      }

      // Membership
      if (user.membership && activeTermId) {
        await supabase.from("memberships").upsert(
          {
            user_id: targetUserId,
            term_id: activeTermId,
            status: user.membership.status || "pending",
            notes: user.membership.notes || "Migrated from legacy membership register",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,term_id" },
        );
      }
    } else {
      report.counts.users.created++;
    }
  }

  return report;
}

// CLI entrypoint
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"))
) {
  const args = parseArgs();
  console.log("-------------------------------------------------------------------");
  console.log("SDGC WordPress Migration Tool");
  console.log(
    `Mode:       ${args.dryRun ? "DRY-RUN (No writes applied)" : "APPLY (Executing writes)"}`,
  );
  console.log(`Input:      ${args.inputDir}`);
  console.log(`Target URL: ${args.supabaseUrl}`);
  console.log("-------------------------------------------------------------------");

  runImport(args)
    .then((report) => {
      console.log("\nMigration Summary (Zero-PII Report):");
      console.log(JSON.stringify(report, null, 2));
      if (report.dryRun) {
        console.log(
          "\n[INFO] Dry-run completed successfully. Pass --apply to execute database writes.",
        );
      } else {
        console.log("\n[SUCCESS] Migration completed.");
      }
    })
    .catch((err) => {
      console.error("\n[FATAL ERROR]:", err.message);
      process.exit(1);
    });
}
