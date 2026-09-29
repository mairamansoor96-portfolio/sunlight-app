/**
 * Decode an uploaded screenshot into pixels, entirely in the browser.
 * Nothing is uploaded or stored (SPEC.md → Overview).
 *
 * Phones are loose about file types: iPhone photos are often HEIC, and gallery
 * or cloud pickers can hand over files with no MIME type at all. So we accept
 * anything that might be an image and let the browser's decoder decide.
 */

/** For the file input. `image/*` also makes phones open the photo gallery. */
export const ACCEPT = "image/*";
export const MAX_BYTES = 20 * 1024 * 1024;
/** Longest side after downscaling. A 3× phone screenshot (1170×2532) fits untouched. */
export const MAX_SIDE = 3000;

export class ImageLoadError extends Error {}

/** Types that mean "unknown" rather than "not an image". */
const UNKNOWN_TYPES = new Set(["", "application/octet-stream"]);

export function validateFile(file: { type: string; size: number }): void {
  // Unknown types are common on phones; only reject files that say they're something else.
  if (!UNKNOWN_TYPES.has(file.type) && !file.type.startsWith("image/")) {
    throw new ImageLoadError("That isn't an image. Try a screenshot or a photo of a screen.");
  }
  if (file.size > MAX_BYTES) {
    throw new ImageLoadError("That file is over 20 MB. Try a regular screenshot rather than a full-page export.");
  }
}

export function fitWithin(width: number, height: number, maxSide = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decodeWithBitmap(file: Blob): Promise<Decoded> {
  const bitmap = await createImageBitmap(file);
  return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
}

/** Fallback: `<img>` decodes formats createImageBitmap may not, such as HEIC in Safari. */
async function decodeWithImg(file: Blob): Promise<Decoded> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
}

export async function loadImageFile(file: File): Promise<ImageData> {
  validateFile(file);
  let decoded: Decoded;
  try {
    decoded = await decodeWithBitmap(file).catch(() => decodeWithImg(file));
  } catch {
    throw new ImageLoadError(
      "Couldn't open that image. Your browser may not support its format. Try a PNG or JPEG screenshot.",
    );
  }
  try {
    const { width, height } = fitWithin(decoded.width, decoded.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new ImageLoadError("Your browser couldn't open a canvas to process the image.");
    ctx.drawImage(decoded.source, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  } finally {
    decoded.release();
  }
}
