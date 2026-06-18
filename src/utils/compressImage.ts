/**
 * Client-side image compression utility.
 * Compresses images using Canvas API before upload to reduce bandwidth and storage.
 */

interface CompressOptions {
  /** Max width or height in px (default: 1920) */
  maxDimension?: number;
  /** JPEG quality 0–1 (default: 0.82) */
  quality?: number;
  /** Output MIME type (default: image/webp with jpeg fallback) */
  type?: string;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxDimension: 1920,
  quality: 0.82,
  type: "image/webp",
};

/**
 * Check if the browser supports WebP encoding
 */
function supportsWebP(): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

/**
 * Compress an image File, returning a smaller Blob.
 * - Resizes to fit within maxDimension (preserving aspect ratio)
 * - Converts to WebP (or JPEG fallback) at the given quality
 * - Skips compression if the file is already small enough (<200KB)
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<{ blob: Blob; extension: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip tiny files
  if (file.size < 200 * 1024) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    return { blob: file, extension: ext };
  }

  // Determine output format
  const outputType = opts.type === "image/webp" && !supportsWebP()
    ? "image/jpeg"
    : opts.type;
  const extension = outputType === "image/webp" ? "webp" : "jpg";

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    img.onload = () => {
      try {
        let { width, height } = img;

        // Scale down if needed
        if (width > opts.maxDimension || height > opts.maxDimension) {
          const ratio = Math.min(
            opts.maxDimension / width,
            opts.maxDimension / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ blob: file, extension: file.name.split(".").pop() || "jpg" });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              resolve({ blob: file, extension: file.name.split(".").pop() || "jpg" });
              return;
            }
            // If compressed is somehow larger, return original
            if (blob.size >= file.size) {
              resolve({ blob: file, extension: file.name.split(".").pop() || "jpg" });
              return;
            }
            resolve({ blob, extension });
          },
          outputType,
          opts.quality
        );
      } catch {
        cleanup();
        resolve({ blob: file, extension: file.name.split(".").pop() || "jpg" });
      }
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Failed to load image for compression"));
    };
    img.src = objectUrl;
  });
}
