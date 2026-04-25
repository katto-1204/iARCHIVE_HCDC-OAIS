import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Compresses an image or document to a target size (default 0.6MB for Base64 fit)
 */
export async function compressFile(file: File | Blob, targetSizeMB = 0.6): Promise<Blob | File> {
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  if (file.size <= targetSizeBytes) return file;

  // Only compress images for now
  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          let quality = 0.7; // Start lower than 0.8

          const compress = () => {
            // Downscale if too large
            if (width > 2000 || height > 2000) {
              width *= 0.7;
              height *= 0.7;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob && blob.size > targetSizeBytes && (quality > 0.1 || width > 400)) {
                if (quality > 0.2) quality -= 0.1;
                else { width *= 0.7; height *= 0.7; }
                compress();
              } else {
                resolve(blob || file);
              }
            }, "image/jpeg", quality);
          };
          compress();
        };
      };
      reader.readAsDataURL(file);
    });
  }
  
  // For PDFs or other files, we can't easily compress on frontend
  // We'll just return the original and hope for the best, or log a warning
  const fileName = (file as File).name || 'Upload';
  console.warn(`File ${fileName} is ${formatBytes(file.size)} and cannot be compressed. Firestore 1MB limit may be exceeded.`);
  return file;
}

/**
 * Converts a File or Blob to a Base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
