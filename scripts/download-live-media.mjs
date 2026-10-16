import fs from "node:fs";
import path from "node:path";

const IMAGES_TO_DOWNLOAD = [
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/IMG_2786.jpeg",
    dest: "public/images/content/garden-awards-plaque.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/2O8A6013-1-scaled.jpeg",
    dest: "public/images/content/plant-sale-old-schoolhouse.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/2O8A6569-scaled.jpeg",
    dest: "public/images/content/executive-committee.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_0683-scaled.jpeg",
    dest: "public/images/content/saugatuck-beautification.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_8860-scaled.jpeg",
    dest: "public/images/content/local-garden-award.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_0553.jpg",
    dest: "public/images/content/member-garden-award.jpg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_2460-scaled.jpeg",
    dest: "public/images/content/6th-grade-workshop.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/2O8A5775-scaled.jpeg",
    dest: "public/images/content/new-member-gathering.jpeg",
  },
  // Gallery images
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_8850-scaled.jpeg",
    dest: "public/images/gallery/garden-walk-2025.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_8847-scaled.jpeg",
    dest: "public/images/gallery/garden-awards.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_1057-scaled.jpeg",
    dest: "public/images/gallery/new-members-party.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_9644-scaled.jpeg",
    dest: "public/images/gallery/plant-sale-perennials.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_6993-scaled.jpeg",
    dest: "public/images/gallery/community-beautification-pots.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_8649-scaled.jpeg",
    dest: "public/images/gallery/educational-programs.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/2O8A6034-scaled.jpeg",
    dest: "public/images/gallery/volunteers-watering.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/2O8A5981-scaled.jpeg",
    dest: "public/images/gallery/garden-walk-tourists.jpeg",
  },
  {
    url: "https://saugatuckdouglasgardenclub.com/wp-content/uploads/DSC_6994-scaled.jpeg",
    dest: "public/images/gallery/downtown-planters.jpeg",
  },
];

async function downloadImages() {
  console.log("Starting download of live images from saugatuckdouglasgardenclub.com...");

  for (const item of IMAGES_TO_DOWNLOAD) {
    const fullDest = path.join(process.cwd(), item.dest);
    fs.mkdirSync(path.dirname(fullDest), { recursive: true });

    if (fs.existsSync(fullDest) && fs.statSync(fullDest).size > 1000) {
      console.log(`[skip] Already exists: ${item.dest}`);
      continue;
    }

    try {
      console.log(`[downloading] ${item.url} -> ${item.dest}`);
      const res = await fetch(item.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        console.warn(`[failed] HTTP ${res.status} for ${item.url}`);
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(fullDest, buffer);
      console.log(`[saved] ${item.dest} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`[error] Could not download ${item.url}:`, err.message);
    }
  }

  console.log("Image download process completed.");
}

downloadImages();
