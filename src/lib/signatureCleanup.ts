export type SignatureCleanupOptions = {
  /** Pixels brighter than this are considered "paper" and become fully transparent. */
  whiteThreshold?: number;
  /** Extra padding (in px) around the detected ink bounds when cropping. */
  cropPadding?: number;
};

/**
 * Turns a scanned signature on white paper into a transparent PNG data URL.
 * - Removes near-white pixels (paper)
 * - Converts remaining ink to black with alpha based on darkness
 * - Crops tightly around the ink
 */
export async function cleanupSignatureToTransparentPng(
  src: string,
  opts: SignatureCleanupOptions = {}
): Promise<string> {
  const whiteThreshold = opts.whiteThreshold ?? 245;
  const cropPadding = opts.cropPadding ?? 8;

  const img = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.drawImage(img, 0, 0);

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;

  // Pass 1: remove paper + map ink to black with alpha based on darkness.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue;

      // perceived brightness (simple average is fine here)
      const v = (r + g + b) / 3;

      // Convert to alpha: darker pixels => higher alpha.
      // v >= whiteThreshold => alpha 0 (fully transparent)
      const alpha = Math.max(0, Math.min(255, (whiteThreshold - v) * 2));

      if (alpha <= 1) {
        data[i + 3] = 0;
        continue;
      }

      // Make ink black (crisp) while preserving antialias via alpha.
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = alpha;

      if (alpha > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // If we failed to detect bounds, fall back to full canvas.
  if (minX >= maxX || minY >= maxY) {
    return canvas.toDataURL("image/png");
  }

  // Crop tightly around ink bounds.
  const pad = cropPadding;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
  const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;

  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Canvas 2D context not available (output)");

  outCtx.clearRect(0, 0, cropW, cropH);
  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return out.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // same-origin for bundled assets; safe even if not required
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
