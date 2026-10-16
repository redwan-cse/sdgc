import fs from "node:fs";
import path from "node:path";

const manifestPath = path.join(process.cwd(), "scripts/wp-media-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("Manifest not found!");
  process.exit(1);
}

const items = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

// Destination folder: public/images/wordpress/
const targetDir = path.join(process.cwd(), "public/images/wordpress");
fs.mkdirSync(targetDir, { recursive: true });

async function downloadItem(item) {
  const url = item.source_url;
  const filename = path.basename(new URL(url).pathname);
  const dest = path.join(targetDir, filename);

  // Skip if already downloaded and valid
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    return { status: "cached", filename, bytes: fs.statSync(dest).size };
  }

  try {
    const res = await fetch(url, { headers: { "User-Agent": userAgent } });
    if (!res.ok) {
      return { status: "failed", filename, code: res.status };
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    return { status: "downloaded", filename, bytes: buffer.length };
  } catch (err) {
    return { status: "error", filename, error: err.message };
  }
}

async function run() {
  console.log(
    `Starting download of ${items.length} WordPress media assets into public/images/wordpress/...`,
  );

  const concurrency = 6;
  const results = [];
  const queue = [...items];

  async function worker(workerId) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const res = await downloadItem(item);
      results.push(res);
      if (res.status === "downloaded") {
        console.log(
          `[W${workerId}] Downloaded: ${res.filename} (${(res.bytes / 1024).toFixed(1)} KB)`,
        );
      } else if (res.status === "cached") {
        // silent
      } else {
        console.warn(
          `[W${workerId}] ${res.status}: ${res.filename} ${res.code || res.error || ""}`,
        );
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  const downloaded = results.filter((r) => r.status === "downloaded").length;
  const cached = results.filter((r) => r.status === "cached").length;
  const failed = results.filter((r) => r.status === "failed" || r.status === "error").length;

  console.log(`\nCompleted! Downloaded: ${downloaded}, Cached: ${cached}, Failed: ${failed}`);

  // Create an organized gallery catalogue
  const galleryItems = items
    .filter((item) => item.mime_type.startsWith("image/"))
    .map((item) => {
      const filename = path.basename(new URL(item.source_url).pathname);
      const isGardenWalk =
        filename.toLowerCase().includes("gardenwalk") ||
        item.title.toLowerCase().includes("garden") ||
        item.title.toLowerCase().includes("walk");
      return {
        id: item.id,
        title: item.title,
        filename,
        src: `/images/wordpress/${filename}`,
        date: item.date,
        width: item.width,
        height: item.height,
        alt: item.alt_text || item.title || "Saugatuck Douglas Garden Club",
        category: isGardenWalk ? "Garden Walk" : "Club Events & Projects",
      };
    });

  fs.writeFileSync(
    path.join(process.cwd(), "public/images/wordpress/media-index.json"),
    JSON.stringify(galleryItems, null, 2),
  );
  console.log(
    `Wrote public/images/wordpress/media-index.json with ${galleryItems.length} indexed images.`,
  );
}

run();
