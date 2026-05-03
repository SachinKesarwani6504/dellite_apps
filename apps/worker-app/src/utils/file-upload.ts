import type { UploadPreviewFile } from '@/types/file-upload';

export function isPdfFile(file: UploadPreviewFile) {
  return Boolean(
    file.type?.toLowerCase().includes('pdf')
    || file.name.toLowerCase().endsWith('.pdf'),
  );
}

export function isImageFile(file: UploadPreviewFile) {
  if (file.type?.toLowerCase().startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|heic)$/i.test(file.name);
}
