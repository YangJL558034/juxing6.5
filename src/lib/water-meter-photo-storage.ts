import path from 'path';
import { buildWaterMeterPhotoUrl, getWaterMeterPhotoFileName } from '@/lib/water-meter-photos';

export const waterMeterUploadDir = process.env.WATER_METER_UPLOAD_DIR
  ? path.resolve(process.env.WATER_METER_UPLOAD_DIR)
  : path.join(process.cwd(), 'data', 'uploads', 'water-meter');

export const legacyWaterMeterUploadDir = path.join(process.cwd(), 'public', 'uploads', 'water-meter');

export function getSafeWaterMeterPhotoFileName(fileName: string) {
  const safeName = path.basename(fileName);
  if (!safeName || safeName !== fileName || safeName.includes('..')) {
    return null;
  }
  return safeName;
}

export function getWaterMeterPhotoPath(fileName: string) {
  const safeName = getSafeWaterMeterPhotoFileName(fileName);
  if (!safeName) return null;
  return path.join(waterMeterUploadDir, safeName);
}

export function getWaterMeterPhotoCandidatePaths(fileName: string) {
  const safeName = getSafeWaterMeterPhotoFileName(fileName);
  if (!safeName) return [];
  return [
    path.join(waterMeterUploadDir, safeName),
    path.join(legacyWaterMeterUploadDir, safeName),
  ];
}

export function getWaterMeterPhotoPathFromUrl(photoUrl?: string | null) {
  const fileName = getWaterMeterPhotoFileName(photoUrl);
  return fileName ? getWaterMeterPhotoPath(fileName) : null;
}

export function getWaterMeterPhotoCandidatePathsFromUrl(photoUrl?: string | null) {
  const fileName = getWaterMeterPhotoFileName(photoUrl);
  return fileName ? getWaterMeterPhotoCandidatePaths(fileName) : [];
}

export function getWaterMeterPhotoMime(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic') return 'image/heic';
  return 'image/jpeg';
}

export { buildWaterMeterPhotoUrl };
