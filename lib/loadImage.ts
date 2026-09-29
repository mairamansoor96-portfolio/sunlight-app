/**
 * Decode an uploaded screenshot into pixels, entirely in the browser.
 * Nothing is uploaded or stored (SPEC.md → Overview).
 */

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_BYTES = 20 * 1024 * 1024;
/** Longest side after downscaling. A 3× phone screenshot (1170×2532) fits untouched. */
export const MAX_SIDE = 3000;

export class ImageLoadError extends Error {}

export function validateFile(file: { type: string; size: number }): void {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    throw new ImageLoadError("That isn't a PNG, JPEG or WebP. Screenshots usually are. Try another file.");
  }
  if (file.size > MAX_BYTES) {
    throw new ImageLoadError("That file is over 20 MB. Try a regular screenshot rather than a full-page export.");
  }
}

export function fitWithin(width: number, height: number, maxSide = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function loadImageFile(file: File): Promise<ImageData> {
  validateFile(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageLoadError("Couldn't read that image. It may be damaged. Try taking the screenshot again.");
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ImageLoadError("Your browser couldn't open a canvas to process the image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return ctx.getImageData(0, 0, width, height);
}
