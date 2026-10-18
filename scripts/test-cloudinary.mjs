import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function test() {
  try {
    console.log("Testing Cloudinary connection for cloud:", process.env.CLOUDINARY_CLOUD_NAME);
    const result = await cloudinary.api.ping();
    console.log("Cloudinary ping result:", result);

    const rootFolders = await cloudinary.api.root_folders();
    console.log("Root folders:", rootFolders);
  } catch (err) {
    console.error("Cloudinary error:", err);
  }
}

test();
