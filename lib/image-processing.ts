import sharp from "sharp";
import { config } from "./config";

export interface ProcessedImage {
  buffer: Buffer;
  base64: string;
  metadata: {
    original_width: number | undefined;
    original_height: number | undefined;
    processed_size_kb: number;
    format: string;
  };
}

export async function preprocessImage(buffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const MAX_DIM = config.limits.maxImageDimension;

  let processed = image.rotate(); // Auto-orient from EXIF

  if (
    (metadata.width && metadata.width > MAX_DIM) ||
    (metadata.height && metadata.height > MAX_DIM)
  ) {
    processed = processed.resize(MAX_DIM, MAX_DIM, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  processed = processed.normalize().jpeg({ quality: 85 });

  const outputBuffer = await processed.toBuffer();

  return {
    buffer: outputBuffer,
    base64: outputBuffer.toString("base64"),
    metadata: {
      original_width: metadata.width,
      original_height: metadata.height,
      processed_size_kb: Math.round(outputBuffer.length / 1024),
      format: "jpeg",
    },
  };
}

export function validateUpload(file: {
  type: string;
  size: number;
}): { valid: true } | { valid: false; error: string } {
  if (!config.allowedImageTypes.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. Use JPG, PNG, TIFF, or WebP.",
    };
  }
  if (file.size > config.limits.maxFileSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum ${config.limits.maxFileSizeMb}MB.`,
    };
  }
  return { valid: true };
}
