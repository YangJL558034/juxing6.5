import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSafeWaterMeterPhotoFileName, getWaterMeterPhotoCandidatePaths, getWaterMeterPhotoMime } from '@/lib/water-meter-photo-storage';

export const runtime = 'nodejs';

async function requireUser(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest, context: { params: Promise<{ fileName: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { fileName } = await context.params;
    const safeName = getSafeWaterMeterPhotoFileName(fileName);
    if (!safeName) {
      return NextResponse.json({ success: false, error: 'Invalid photo name.' }, { status: 400 });
    }

    let file: Buffer | null = null;
    for (const filePath of getWaterMeterPhotoCandidatePaths(safeName)) {
      file = await readFile(filePath).catch(() => null);
      if (file) break;
    }
    if (!file) {
      return NextResponse.json({ success: false, error: 'Photo not found.' }, { status: 404 });
    }

    const body = new ArrayBuffer(file.byteLength);
    new Uint8Array(body).set(file);
    const contentType = getWaterMeterPhotoMime(safeName);
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Get water meter photo error:', error);
    return NextResponse.json({ success: false, error: 'Photo not found.' }, { status: 404 });
  }
}
