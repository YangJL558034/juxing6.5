export const WATER_METER_PHOTO_API_PREFIX = '/api/water-meter/photo/';
export const WATER_METER_LEGACY_UPLOAD_PREFIX = '/uploads/water-meter/';

export function getWaterMeterPhotoFileName(photoUrl?: string | null) {
  if (!photoUrl) return null;

  try {
    const pathname = photoUrl.startsWith('http://') || photoUrl.startsWith('https://')
      ? new URL(photoUrl).pathname
      : photoUrl;

    if (pathname.startsWith(WATER_METER_PHOTO_API_PREFIX)) {
      return decodeURIComponent(pathname.slice(WATER_METER_PHOTO_API_PREFIX.length).split('/')[0] || '');
    }
    if (pathname.startsWith(WATER_METER_LEGACY_UPLOAD_PREFIX)) {
      return decodeURIComponent(pathname.slice(WATER_METER_LEGACY_UPLOAD_PREFIX.length).split('/')[0] || '');
    }
  } catch {
    return null;
  }

  return null;
}

export function buildWaterMeterPhotoUrl(fileName: string) {
  return `${WATER_METER_PHOTO_API_PREFIX}${encodeURIComponent(fileName)}`;
}

export function normalizeWaterMeterPhotoUrl(photoUrl?: string | null) {
  const fileName = getWaterMeterPhotoFileName(photoUrl);
  return fileName ? buildWaterMeterPhotoUrl(fileName) : photoUrl || null;
}
