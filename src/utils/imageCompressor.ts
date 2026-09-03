/**
 * Laboratory Logo & Asset Image Compressor
 * Resizes and compresses image uploads into compact, high-clarity base64 data URLs
 * optimized for web headers, mobile displays, and high-DPI PDF rendering while
 * staying well under Firestore's 1MB document limit (typically 10KB - 45KB).
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeBytes?: number; // e.g. 150KB (150 * 1024)
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 360,
  maxHeight: 180,
  quality: 0.85,
  maxSizeBytes: 120 * 1024, // 120 KB max limit
};

/**
 * Checks if a canvas has transparent pixels
 */
function hasAlphaChannel(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] < 250) {
        return true;
      }
    }
  } catch {
    // If getImageData fails (e.g. security), assume true
    return true;
  }
  return false;
}

/**
 * Compresses an image File or Blob into a lightweight, high-DPI data URL.
 */
export async function compressImageFile(
  file: File | Blob,
  customOptions?: ImageCompressionOptions
): Promise<string> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  return new Promise((resolve, reject) => {
    // If it's a small SVG (< 80KB), return as is or read text
    if (file.type === 'image/svg+xml' && file.size < 80 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result as string;
        resolve(res);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const maxW = options.maxWidth;
          const maxH = options.maxHeight;

          // Calculate aspect ratio preserving dimensions
          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Ensure minimum valid dimensions
          width = Math.max(1, width);
          height = Math.max(1, height);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not obtain canvas 2D rendering context'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Check if transparency exists
          const isTransparent = hasAlphaChannel(ctx, width, height);
          const mimeType = isTransparent ? 'image/png' : 'image/jpeg';
          let quality = options.quality;

          let dataUrl = canvas.toDataURL(mimeType, quality);

          // Iterative reduction if size still exceeds maxSizeBytes
          if (dataUrl.length > options.maxSizeBytes) {
            if (!isTransparent) {
              // Reduce JPEG quality progressively
              while (dataUrl.length > options.maxSizeBytes && quality > 0.4) {
                quality -= 0.15;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
              }
            } else {
              // Scale down canvas further for PNGs
              const scaleDown = 0.75;
              canvas.width = Math.max(1, Math.round(width * scaleDown));
              canvas.height = Math.max(1, Math.round(height * scaleDown));
              const ctx2 = canvas.getContext('2d');
              if (ctx2) {
                ctx2.imageSmoothingEnabled = true;
                ctx2.imageSmoothingQuality = 'high';
                ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
                dataUrl = canvas.toDataURL('image/png');
              }
            }
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => {
        reject(new Error('Failed to decode image data for compression: ' + err));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an existing base64 data URL if it exceeds safe thresholds (e.g. > 150KB).
 */
export async function optimizeBase64DataUrl(
  dataUrl?: string | null,
  maxSizeBytes: number = 120 * 1024
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl || '';
  }

  // If already under threshold, return as is
  if (dataUrl.length <= maxSizeBytes) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const maxW = 360;
        const maxH = 180;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const isTransparent = hasAlphaChannel(ctx, width, height);
        const mimeType = isTransparent ? 'image/png' : 'image/jpeg';
        const compressed = canvas.toDataURL(mimeType, 0.82);

        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      // If failed to load img, fallback
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
