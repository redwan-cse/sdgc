import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const baseImagesDir = path.resolve("public/images");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".ico"]);

function getFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat?.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (supportedExtensions.has(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

async function uploadFileWithRetry(filePath, folder, retries = 3) {
  const _filename = path.basename(filePath);
  const _nameWithoutExt = path.parse(filePath).name;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        resource_type: "image",
      });
      return {
        success: true,
        filePath,
        publicId: res.public_id,
        secureUrl: res.secure_url,
        bytes: res.bytes,
      };
    } catch (err) {
      if (attempt === retries) {
        return {
          success: false,
          filePath,
          error: err.message,
        };
      }
      // Backoff
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function main() {
  console.log("=== SDGC Cloudinary Asset Sync ===");
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("Target Dedicated Folder: sdgc-web");

  const files = getFilesRecursively(baseImagesDir);
  console.log(`Found ${files.length} images to upload.\n`);

  const results = [];
  const concurrency = 6;
  let index = 0;

  async function worker(_workerId) {
    while (index < files.length) {
      const currentIndex = index++;
      const file = files[currentIndex];
      const relPath = path.relative(baseImagesDir, file);
      const relDir = path.dirname(relPath).replace(/\\/g, "/");
      const targetFolder = relDir === "." ? "sdgc-web" : `sdgc-web/${relDir}`;

      const res = await uploadFileWithRetry(file, targetFolder);
      results.push(res);
      const statusIcon = res.success ? "✓" : "✗";
      console.log(
        `[${results.length}/${files.length}] ${statusIcon} ${relPath} -> ${res.publicId || res.error}`,
      );
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log("\n=== Upload Summary ===");
  console.log(`Successfully uploaded: ${succeeded.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.error("Failed uploads:", failed);
  }

  // Save manifest
  const manifest = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: "sdgc-web",
    uploadedAt: new Date().toISOString(),
    totalAssets: succeeded.length,
    assets: succeeded.reduce((acc, curr) => {
      const rel = path.relative(path.resolve("public"), curr.filePath).replace(/\\/g, "/");
      acc[`/${rel}`] = curr.secureUrl;
      return acc;
    }, {}),
  };

  fs.writeFileSync("scripts/cloudinary-manifest.json", JSON.stringify(manifest, null, 2));
  console.log("Saved manifest to scripts/cloudinary-manifest.json");
}

main().catch(console.error);
