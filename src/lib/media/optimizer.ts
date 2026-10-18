import sharp from "sharp";

export interface OptimizationResult {
  optimizedBuffer: Buffer;
  thumbnailBuffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Optimizes an uploaded image using Sharp.
 * Converts to modern WebP with max 1920px main dimension and generates a 400px thumbnail.
 */
export async function optimizeImage(
  inputBuffer: Buffer | Uint8Array,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    thumbnailMaxDim?: number;
  } = {},
): Promise<OptimizationResult> {
  const maxWidth = options.maxWidth ?? 1920;
  const maxHeight = options.maxHeight ?? 1920;
  const quality = options.quality ?? 82;
  const thumbnailMaxDim = options.thumbnailMaxDim ?? 400;

  // Generate main optimized WebP
  const optimizedBuffer = await sharp(inputBuffer)
    .rotate() // Auto-orient based on EXIF
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer();

  const optimizedInfo = await sharp(optimizedBuffer).metadata();

  // Generate thumbnail WebP
  const thumbnailBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: thumbnailMaxDim,
      height: thumbnailMaxDim,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 75, effort: 3 })
    .toBuffer();

  return {
    optimizedBuffer,
    thumbnailBuffer,
    width: optimizedInfo.width || 1200,
    height: optimizedInfo.height || 800,
    mimeType: "image/webp",
    sizeBytes: optimizedBuffer.length,
  };
}
