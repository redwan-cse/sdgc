import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { optimizeImage } from "@/lib/media/optimizer";

describe("Media Optimizer Utility", () => {
  it("compresses and converts an image to WebP with dimension limits", async () => {
    // Create a synthetic 2400x1600 red PNG image
    const testImage = await sharp({
      create: {
        width: 2400,
        height: 1600,
        channels: 3,
        background: { r: 210, g: 80, b: 60 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeImage(testImage);

    // Main image should be resized down to max 1920px width
    expect(result.width).toBeLessThanOrEqual(1920);
    expect(result.height).toBeLessThanOrEqual(1920);
    expect(result.mimeType).toBe("image/webp");
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.optimizedBuffer.length).toBe(result.sizeBytes);

    // Thumbnail should be under 400px
    const thumbMetadata = await sharp(result.thumbnailBuffer).metadata();
    expect(thumbMetadata.width).toBeLessThanOrEqual(400);
    expect(thumbMetadata.height).toBeLessThanOrEqual(400);
    expect(thumbMetadata.format).toBe("webp");
  });
});
