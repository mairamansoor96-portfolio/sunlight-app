"use client";

import { useEffect, useRef } from "react";

/** Paints an ImageData onto a canvas at its native resolution; CSS scales it. */
export function PixelCanvas({ image, label }: { image: ImageData; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d")?.putImageData(image, 0, 0);
  }, [image]);

  return (
    <canvas
      ref={ref}
      className="pixel-canvas"
      width={image.width}
      height={image.height}
      role="img"
      aria-label={label}
    />
  );
}
