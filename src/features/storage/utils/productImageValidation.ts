import type { SaveProductMediaItem } from '@/types/storage';

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES = 300 * 1024;
export const PRODUCT_IMAGE_WARNING_SIZE_BYTES = 1 * 1024 * 1024; // 1MB — umbral para warning

export const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const ALLOWED_PRODUCT_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'jfif', 'png', 'webp']);

export const PRODUCT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.jfif,.png,.webp';

export const PRODUCT_IMAGE_FORMATS_LABEL = 'JPG, JPEG, JFIF, PNG o WEBP';

export function estimatePayloadSize(files: SaveProductMediaItem[]): number {
  // texto del form: ~2KB fijo
  let total = 2048;
  for (const item of files) {
    if (item.type === 'file') {
      // base64 ≈ 1.37× el tamaño original
      total += Math.round(item.file.size * 1.37);
    }
  }
  return total;
}

export function validateProductImageFile(
  file: File,
  maxSizeBytes = MAX_PRODUCT_IMAGE_SIZE_BYTES,
): string | null {
  if (file.size === 0) {
    return 'Archivo no válido o vacío';
  }

  if (file.size > maxSizeBytes) {
    return maxSizeBytes === MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES
      ? 'La imagen comprimida excede el tamaño máximo permitido (300KB)'
      : 'La imagen excede el tamaño máximo permitido (5MB)';
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (
    !ALLOWED_PRODUCT_IMAGE_MIME_TYPES.has(file.type) ||
    !ALLOWED_PRODUCT_IMAGE_EXTENSIONS.has(extension)
  ) {
    return `Formato de imagen no permitido. Usá ${PRODUCT_IMAGE_FORMATS_LABEL}.`;
  }

  return null;
}
