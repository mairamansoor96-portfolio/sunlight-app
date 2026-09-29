import { describe, expect, it } from "vitest";
import { ImageLoadError, MAX_BYTES, fitWithin, validateFile } from "@/lib/loadImage";

describe("validateFile", () => {
  it.each(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif", "", "application/octet-stream"])(
    "lets %j through to the decoder",
    (type) => {
      expect(() => validateFile({ type, size: 1000 })).not.toThrow();
    },
  );

  it("rejects files that say they're not images", () => {
    expect(() => validateFile({ type: "application/pdf", size: 1000 })).toThrow(ImageLoadError);
  });

  it("rejects files over the size limit", () => {
    expect(() => validateFile({ type: "image/png", size: MAX_BYTES + 1 })).toThrow(/over 20 MB/);
  });
});

describe("fitWithin", () => {
  it("leaves a phone screenshot alone", () => {
    expect(fitWithin(1170, 2532)).toEqual({ width: 1170, height: 2532 });
  });

  it("scales a large photo to the longest-side cap", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 3000, height: 2250 });
  });
});
