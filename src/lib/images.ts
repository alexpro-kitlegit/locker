// Photo handling for the prototype: read a file, shrink it, and run KitLegit's upload checks
// (kitlegit-web UploadStep validatePhoto). Blur detection is left out of the prototype.

export interface ReadPhoto {
  thumb: string;
  width: number;
  height: number;
  dark: boolean;
}

export async function readPhoto(file: File, max = 360): Promise<ReadPhoto> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // KitLegit treats a photo as blank/dark when most pixels are very dark or very bright.
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let extreme = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 20 || lum > 245) extreme++;
    }
    const dark = extreme / (data.length / 4) >= 0.9;

    return { thumb: canvas.toDataURL("image/jpeg", 0.7), width: img.width, height: img.height, dark };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** KitLegit's per-file checks, in its order. Returns the warning to show, or null if the photo is fine. */
export function validatePhoto(file: File, read: ReadPhoto | null): string | null {
  if (!file.type.startsWith("image/")) return "File is not an image.";
  if (file.size > 20 * 1024 * 1024) return "Photo is too large (max 20MB).";
  if (!read) return "File is not an image.";
  if (read.dark)
    return "The uploaded image appears to have no visible content. For accurate verification, please provide a clear and detailed photo of the item.";
  if (file.size < 40 * 1024) return "This photo looks like a thumbnail. Please upload the original full-size image.";
  if (Math.min(read.width, read.height) < 400)
    return "This photo is too small. Please upload the original full-size image (minimum 400px).";
  return null;
}
