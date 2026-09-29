/**
 * Small previews of the user's screenshot for the condition picker.
 * Area-averaged downscale, so thin text becomes grey rather than aliasing away.
 */

import type { PixelBuffer } from "./simulations";

export function downscale(src: PixelBuffer, targetWidth: number): PixelBuffer {
  const scale = Math.min(1, targetWidth / src.width);
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const out = new Uint8ClampedArray(w * h * 4);
  const sx = src.width / w;
  const sy = src.height / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * src.width + xx) * 4;
          r += src.data[i];
          g += src.data[i + 1];
          b += src.data[i + 2];
          a += src.data[i + 3];
        }
      }
      const n = (y1 - y0) * (x1 - x0);
      out.set([r / n, g / n, b / n, a / n], (y * w + x) * 4);
    }
  }
  return { width: w, height: h, data: out };
}
