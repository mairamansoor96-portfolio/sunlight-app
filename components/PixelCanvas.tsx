"use client";

import { useEffect, useRef } from "react";
import type { PixelBuffer } from "@/lib/simulations";

interface Props {
  image: PixelBuffer;
  /** Accessible description. Omit for decorative copies, which are hidden from assistive tech. */
  label?: string;
  className?: string;
}

/** Paints pixels onto a canvas at their native resolution; CSS scales it. */
export function PixelCanvas({ image, label, className = "pixel-canvas" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = image.width;
    canvas.height = image.height;
    const data = image instanceof ImageData ? image : new ImageData(image.data as ImageDataArray, image.width, image.height);
    canvas.getContext("2d")?.putImageData(data, 0, 0);
  }, [image]);

  return (
    <canvas
      ref={ref}
      className={className}
      width={image.width}
      height={image.height}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    />
  );
}
