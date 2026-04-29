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
  
  // Always try to compress if it's an image or video
  if (file.type.startsWith("image/")) {
    if (file.size <= targetSizeBytes * 0.5) return file; // Already small enough
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          let quality = 0.6; // Start even lower for aggressive document compression

          const compress = () => {
            // Downscale aggressively for large archival documents
            // If target is small (< 0.5MB), use even smaller dimensions
            const maxDimension = targetSizeMB < 0.5 ? 1200 : 1600;
            if (width > maxDimension || height > maxDimension) {
              const scale = maxDimension / Math.max(width, height);
              width *= scale;
              height *= scale;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            // Improve text legibility in compressed documents by using slightly higher initial sharpening
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
            }
            
            canvas.toBlob((blob) => {
              if (blob && blob.size > targetSizeBytes && (quality > 0.05 || width > 300)) {
                if (quality > 0.15) quality -= 0.1;
                else if (quality > 0.05) quality -= 0.02;
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
  
  // Enhanced video compression logic
  if (file.type.startsWith("video/")) {
    console.log(`Compressing video: ${formatBytes(file.size)} target: ${targetSizeMB}MB`);
    try {
      const videoBlob = await new Promise<Blob>((resolve) => {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
        
        video.onloadedmetadata = () => {
          // Calculate bitrate to fit target size
          const duration = Math.max(video.duration || 1, 1);
          // Target slightly under the limit to be safe
          const targetBits = targetSizeBytes * 0.9 * 8; 
          const bitsPerSecond = Math.max(150000, Math.floor(targetBits / duration));

          // Downscale to mobile-friendly resolution for huge savings
          const maxW = 480; 
          const scale = Math.min(1, maxW / (video.videoWidth || maxW));
          const width = Math.max(160, Math.floor((video.videoWidth || maxW) * scale));
          const height = Math.max(90, Math.floor((video.videoHeight || (maxW * 9) / 16) * scale));
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          
          if (!ctx || !('captureStream' in canvas)) {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
            return;
          }

          // @ts-ignore
          const stream = canvas.captureStream(20); // 20 FPS for smoothness
          const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
            ? "video/webm;codecs=vp8"
            : "video/webm";
          
          const chunks: BlobPart[] = [];
          const recorder = new MediaRecorder(stream, { 
            mimeType, 
            videoBitsPerSecond: bitsPerSecond 
          });

          let raf: number;
          const draw = () => {
            if (!video.paused && !video.ended) {
              ctx.drawImage(video, 0, 0, width, height);
              raf = requestAnimationFrame(draw);
            }
          };

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };
          
          recorder.onstop = () => {
            cancelAnimationFrame(raf);
            URL.revokeObjectURL(objectUrl);
            const out = new Blob(chunks, { type: mimeType });
            console.log(`Video compression finished: ${formatBytes(out.size)}`);
            resolve(out.size > 0 ? out : file);
          };

          video.onended = () => recorder.stop();
          recorder.start();
          video.play().then(() => {
            draw();
          }).catch((err) => {
            console.error("Video play failed during compression:", err);
            recorder.stop();
          });
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
        };
      });
      return videoBlob;
    } catch (err) {
      console.error("Video compression failed:", err);
      return file;
    }
  }

  // Enhanced PDF Compression via Rasterization
  const fileName = (file as File).name || 'Upload';
  const isPdf = file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  
  if (isPdf) {
    console.log(`Compressing PDF: ${formatBytes(file.size)} target: ${targetSizeMB}MB`);
    try {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        console.warn("pdfjsLib not available. Cannot compress PDF.");
        return file;
      }
      
      // Load jsPDF dynamically if not present
      if (!(window as any).jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      const jsPDF = (window as any).jspdf.jsPDF;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let newPdf: any = null;
      
      // To prevent memory crashes, limit to 200 pages max for compression
      const pageLimit = Math.min(pdf.numPages, 200);
      
      for (let i = 1; i <= pageLimit; i++) {
         const page = await pdf.getPage(i);
         const viewport = page.getViewport({ scale: 1.5 });
         
         const maxDim = targetSizeMB < 0.5 ? 900 : 1400;
         const scale = Math.min(1, maxDim / Math.max(viewport.width, viewport.height));
         const scaledViewport = page.getViewport({ scale: viewport.scale * scale });
         
         const canvas = document.createElement("canvas");
         canvas.width = scaledViewport.width;
         canvas.height = scaledViewport.height;
         const ctx = canvas.getContext("2d");
         if (!ctx) continue;
         
         // White background for PDFs with transparent background
         ctx.fillStyle = "white";
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         
         await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
         
         const quality = targetSizeMB < 0.5 ? 0.5 : 0.7;
         const imgData = canvas.toDataURL("image/jpeg", quality);
         
         const orientation = scaledViewport.width > scaledViewport.height ? "l" : "p";
         if (!newPdf) {
           newPdf = new jsPDF({ orientation, unit: "px", format: [scaledViewport.width, scaledViewport.height] });
           newPdf.addImage(imgData, "JPEG", 0, 0, scaledViewport.width, scaledViewport.height);
         } else {
           newPdf.addPage([scaledViewport.width, scaledViewport.height], orientation);
           newPdf.addImage(imgData, "JPEG", 0, 0, scaledViewport.width, scaledViewport.height);
         }
      }
      
      if (newPdf) {
        const outBlob = newPdf.output("blob");
        console.log(`PDF compression finished: ${formatBytes(outBlob.size)}`);
        if (outBlob.size < file.size) {
          return new File([outBlob], fileName, { type: "application/pdf" });
        }
      }
      return file;
    } catch (err) {
      console.error("PDF compression failed:", err);
      return file;
    }
  }

  // Fallback for non-compressible formats
  if (file.size > targetSizeBytes) {
    console.warn(`File ${fileName} (${formatBytes(file.size)}) exceeds recommended size and cannot be natively compressed.`);
  }
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
