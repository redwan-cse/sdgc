import { cloudinaryManifest } from "./cloudinary-manifest";

const assetMap: Record<string, string> =
  (cloudinaryManifest.assets as Record<string, string>) || {};

export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) {
    return "";
  }

  // Already a full remote URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Normalize leading slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Check static uploaded manifest mapping first
  if (assetMap[normalizedPath]) {
    return assetMap[normalizedPath];
  }

  // Try checking with /images prefix if missing
  const withImagesPrefix = normalizedPath.startsWith("/images/")
    ? normalizedPath
    : `/images${normalizedPath}`;
  if (assetMap[withImagesPrefix]) {
    return assetMap[withImagesPrefix];
  }

  // Fallback to Cloudinary dynamic URL construction
  const isCloudinary =
    process.env.STORAGE_PROVIDER === "cloudinary" ||
    process.env.NEXT_PUBLIC_STORAGE_PROVIDER === "cloudinary" ||
    Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) ||
    Boolean(process.env.CLOUDINARY_CLOUD_NAME);

  if (isCloudinary) {
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      cloudinaryManifest.cloudName ||
      "p4wempwi";
    const folder =
      process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ||
      process.env.CLOUDINARY_FOLDER ||
      cloudinaryManifest.folder ||
      "sdgc-web";

    let clean = normalizedPath.replace(/^\/images\//, "").replace(/^\/+/, "");
    if (!clean.startsWith(`${folder}/`)) {
      clean = `${folder}/${clean}`;
    }
    return `https://res.cloudinary.com/${cloudName}/image/upload/${clean}`;
  }

  return normalizedPath;
}
