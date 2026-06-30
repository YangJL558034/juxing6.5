import { NextRequest, NextResponse } from 'next/server';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/database';
import { verifyToken, type User } from '@/lib/auth';
import { parseWaterMeterRow, round2, type WaterMeterDbRow } from '@/lib/water-meter-records';

export const runtime = 'nodejs';

const DEFAULT_WATER_UNIT_PRICE = 6.48;
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'water-meter');

interface WaterMeterInput {
  roomNo: string;
  readingDate: string;
  currentReading: number;
  currentReadingText: string;
  unitPrice: number;
  recorderUserId: number;
  recorderName: string;
  photoUrl: string | null;
  photoName: string | null;
  remark: string;
}

class WaterMeterRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function requireUser(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

function listRecords(searchParams: URLSearchParams) {
  const roomNo = searchParams.get('roomNo')?.trim();
  const month = searchParams.get('month')?.trim();
  const dateFrom = searchParams.get('dateFrom')?.trim();
  const dateTo = searchParams.get('dateTo')?.trim();

  const where: string[] = [];
  const params: unknown[] = [];

  if (roomNo && roomNo !== 'all') {
    where.push('room_no = ?');
    params.push(roomNo);
  }
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    where.push('reading_date LIKE ?');
    params.push(`${month}-%`);
  }
  if (dateFrom) {
    where.push('reading_date >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    where.push('reading_date <= ?');
    params.push(dateTo);
  }

  const rows = db.prepare(`
    SELECT *
    FROM water_meter_records
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY reading_date DESC, id DESC
  `).all(...params) as WaterMeterDbRow[];

  return rows.map(parseWaterMeterRow);
}

function getField(source: Record<string, unknown> | FormData, name: string) {
  if (source instanceof FormData) {
    const value = source.get(name);
    return typeof value === 'string' ? value : '';
  }
  return String(source[name] ?? '');
}

function getUpload(source: Record<string, unknown> | FormData) {
  if (!(source instanceof FormData)) return null;
  const value = source.get('photo') || source.get('file');
  return value instanceof File && value.size > 0 ? value : null;
}

async function savePhoto(file: File) {
  const ext = path.extname(file.name || '').toLowerCase() || '.jpg';
  const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
  if (!allowedExtensions.has(ext) && !allowedTypes.has(file.type)) {
    throw new WaterMeterRequestError('Only image files can be uploaded.');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new WaterMeterRequestError('Photo size cannot exceed 20MB.');
  }

  await mkdir(uploadDir, { recursive: true });
  const fileName = `water_meter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return {
    photoUrl: `/uploads/water-meter/${fileName}`,
    photoName: file.name || fileName,
  };
}

async function deleteUploadedPhoto(photoUrl?: string | null) {
  if (!photoUrl || !photoUrl.startsWith('/uploads/water-meter/')) return;
  const fileName = path.basename(photoUrl);
  await unlink(path.join(uploadDir, fileName)).catch(() => undefined);
}

async function parseInput(
  source: Record<string, unknown> | FormData,
  user: User,
  existing?: WaterMeterDbRow,
): Promise<WaterMeterInput> {
  const roomNo = getField(source, 'roomNo').trim();
  const readingDate = getField(source, 'readingDate').trim();
  const currentReadingText = getField(source, 'currentReading').trim();
  const currentReading = Number(currentReadingText);
  const unitPriceValue = getField(source, 'unitPrice').trim();
  const unitPrice = unitPriceValue ? Number(unitPriceValue) : DEFAULT_WATER_UNIT_PRICE;
  const remark = getField(source, 'remark').trim();
  const removePhoto = getField(source, 'removePhoto').trim() === '1';
  const upload = getUpload(source);

  if (!roomNo) {
    throw new WaterMeterRequestError('Please select a room.');
  }
  if (!readingDate) {
    throw new WaterMeterRequestError('Please select a reading date.');
  }
  if (!currentReadingText || !/^\d+(?:\.\d+)?$/.test(currentReadingText) || !Number.isFinite(currentReading) || currentReading < 0) {
    throw new WaterMeterRequestError('Please enter a valid current reading.');
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new WaterMeterRequestError('Please enter a valid unit price.');
  }

  const room = db.prepare('SELECT room_no FROM dormitory_rooms WHERE room_no = ?').get(roomNo) as { room_no: string } | undefined;
  if (!room) {
    throw new WaterMeterRequestError('Room does not exist.');
  }

  let photoUrl = existing?.photo_url || null;
  let photoName = existing?.photo_name || null;
  if (removePhoto) {
    photoUrl = null;
    photoName = null;
  }
  if (upload) {
    const saved = await savePhoto(upload);
    photoUrl = saved.photoUrl;
    photoName = saved.photoName;
  }

  return {
    roomNo,
    readingDate,
    currentReading,
    currentReadingText,
    unitPrice,
    recorderUserId: user.id,
    recorderName: user.name || user.username,
    photoUrl,
    photoName,
    remark,
  };
}

async function readBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    return request.formData();
  }
  return request.json() as Promise<Record<string, unknown>>;
}

function getWaterMeterId(source: Record<string, unknown> | FormData) {
  const id = Number(getField(source, 'id'));
  if (!Number.isInteger(id) || id <= 0) {
    throw new WaterMeterRequestError('Missing water meter record ID.');
  }
  return id;
}

function assertRoomMonthAvailable(roomNo: string, readingDate: string, excludeId?: number) {
  const month = readingDate.slice(0, 7);
  const params: unknown[] = [roomNo, `${month}-%`];
  if (excludeId) {
    params.push(excludeId);
  }
  const existing = db.prepare(`
    SELECT id
    FROM water_meter_records
    WHERE room_no = ?
      AND reading_date LIKE ?
      ${excludeId ? 'AND id <> ?' : ''}
    LIMIT 1
  `).get(...params) as { id: number } | undefined;

  if (existing) {
    throw new WaterMeterRequestError(`房号 ${roomNo} 已经登记过 ${month} 的水表。`);
  }
}

function recalculateRoomRecords(roomNo: string) {
  const rows = db.prepare(`
    SELECT *
    FROM water_meter_records
    WHERE room_no = ?
    ORDER BY reading_date ASC, id ASC
  `).all(roomNo) as WaterMeterDbRow[];

  let previousReading: number | null = null;
  let previousReadingText: string | null = null;

  for (const row of rows) {
    const currentReading = Number(row.current_reading);
    if (!Number.isFinite(currentReading)) {
      throw new WaterMeterRequestError(`Invalid reading in room ${roomNo}.`);
    }
    if (previousReading !== null && currentReading < previousReading) {
      throw new WaterMeterRequestError(`Room ${roomNo} reading on ${row.reading_date} cannot be less than previous reading ${previousReading}.`);
    }

    const usageAmount = previousReading === null ? null : round2(currentReading - previousReading);
    const unitPrice = row.unit_price === null ? DEFAULT_WATER_UNIT_PRICE : Number(row.unit_price);
    const feeAmount = usageAmount === null ? null : round2(usageAmount * unitPrice);

    db.prepare(`
      UPDATE water_meter_records
      SET previous_reading = ?,
          previous_reading_text = ?,
          unit_price = ?,
          usage_amount = ?,
          fee_amount = ?
      WHERE id = ?
    `).run(previousReading, previousReadingText, unitPrice, usageAmount, feeAmount, row.id);

    previousReading = currentReading;
    previousReadingText = row.current_reading_text || String(row.current_reading);
  }
}

function createRecord(input: WaterMeterInput) {
  return db.transaction(() => {
    assertRoomMonthAvailable(input.roomNo, input.readingDate);

    const result = db.prepare(`
      INSERT INTO water_meter_records (
        room_no, reading_date, previous_reading, previous_reading_text, current_reading, current_reading_text,
        usage_amount, unit_price, fee_amount, recorder_user_id, recorder_name, photo_url, photo_name, remark
      ) VALUES (?, ?, NULL, NULL, ?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?)
    `).run(
      input.roomNo,
      input.readingDate,
      input.currentReading,
      input.currentReadingText,
      input.unitPrice,
      input.recorderUserId,
      input.recorderName,
      input.photoUrl,
      input.photoName,
      input.remark || null,
    );

    recalculateRoomRecords(input.roomNo);
    return db.prepare('SELECT * FROM water_meter_records WHERE id = ?').get(result.lastInsertRowid) as WaterMeterDbRow;
  })();
}

function updateRecord(id: number, input: WaterMeterInput) {
  return db.transaction(() => {
    const existing = db.prepare('SELECT * FROM water_meter_records WHERE id = ?').get(id) as WaterMeterDbRow | undefined;
    if (!existing) {
      throw new WaterMeterRequestError('Water meter record does not exist.', 404);
    }
    assertRoomMonthAvailable(input.roomNo, input.readingDate, id);

    db.prepare(`
      UPDATE water_meter_records
      SET room_no = ?,
          reading_date = ?,
          current_reading = ?,
          current_reading_text = ?,
          unit_price = ?,
          recorder_user_id = ?,
          recorder_name = ?,
          photo_url = ?,
          photo_name = ?,
          remark = ?
      WHERE id = ?
    `).run(
      input.roomNo,
      input.readingDate,
      input.currentReading,
      input.currentReadingText,
      input.unitPrice,
      input.recorderUserId,
      input.recorderName,
      input.photoUrl,
      input.photoName,
      input.remark || null,
      id,
    );

    recalculateRoomRecords(existing.room_no);
    if (existing.room_no !== input.roomNo) {
      recalculateRoomRecords(input.roomNo);
    }

    return db.prepare('SELECT * FROM water_meter_records WHERE id = ?').get(id) as WaterMeterDbRow;
  })();
}

function deleteRecord(id: number) {
  return db.transaction(() => {
    const existing = db.prepare('SELECT * FROM water_meter_records WHERE id = ?').get(id) as WaterMeterDbRow | undefined;
    if (!existing) {
      throw new WaterMeterRequestError('Water meter record does not exist.', 404);
    }

    db.prepare('DELETE FROM water_meter_records WHERE id = ?').run(id);
    recalculateRoomRecords(existing.room_no);
    return existing;
  })();
}

function jsonError(error: unknown, fallback: string) {
  if (error instanceof WaterMeterRequestError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const records = listRecords(searchParams);
    const totalUsage = round2(records.reduce((sum, record) => sum + (record.usageAmount || 0), 0));
    const totalFee = round2(records.reduce((sum, record) => sum + (record.feeAmount || 0), 0));

    return NextResponse.json({ success: true, records, summary: { total: records.length, totalUsage, totalFee } });
  } catch (error) {
    console.error('Get water meter records error:', error);
    return jsonError(error, 'Failed to get water meter records.');
  }
}

export async function POST(request: NextRequest) {
  let savedPhotoUrl: string | null = null;
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const body = await readBody(request);
    const input = await parseInput(body, user);
    savedPhotoUrl = input.photoUrl;
    const row = createRecord(input);
    return NextResponse.json({ success: true, record: parseWaterMeterRow(row), message: 'Water meter record saved.' });
  } catch (error) {
    await deleteUploadedPhoto(savedPhotoUrl);
    console.error('Create water meter record error:', error);
    return jsonError(error, 'Failed to save water meter record.');
  }
}

export async function PUT(request: NextRequest) {
  let savedPhotoUrl: string | null = null;
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await readBody(request);
    const id = getWaterMeterId(body);
    const existing = db.prepare('SELECT * FROM water_meter_records WHERE id = ?').get(id) as WaterMeterDbRow | undefined;
    if (!existing) {
      throw new WaterMeterRequestError('Water meter record does not exist.', 404);
    }

    const input = await parseInput(body, user, existing);
    savedPhotoUrl = input.photoUrl && input.photoUrl !== existing.photo_url ? input.photoUrl : null;
    const row = updateRecord(id, input);
    if (existing.photo_url && existing.photo_url !== input.photoUrl) {
      await deleteUploadedPhoto(existing.photo_url);
    }
    return NextResponse.json({ success: true, record: parseWaterMeterRow(row), message: 'Water meter record updated.' });
  } catch (error) {
    await deleteUploadedPhoto(savedPhotoUrl);
    console.error('Update water meter record error:', error);
    return jsonError(error, 'Failed to update water meter record.');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await readBody(request);
    const id = getWaterMeterId(body);
    const deleted = deleteRecord(id);
    await deleteUploadedPhoto(deleted.photo_url);
    return NextResponse.json({ success: true, message: 'Water meter record deleted.' });
  } catch (error) {
    console.error('Delete water meter record error:', error);
    return jsonError(error, 'Failed to delete water meter record.');
  }
}
