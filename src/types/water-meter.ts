export interface WaterMeterRoomOption {
  roomNo: string;
  capacity: number;
  latestReading: number | null;
  latestReadingText: string | null;
  latestReadingDate: string | null;
}

export interface WaterMeterRecord {
  id: number;
  roomNo: string;
  readingDate: string;
  previousReading: number | null;
  previousReadingText: string | null;
  currentReading: number;
  currentReadingText: string;
  usageAmount: number | null;
  unitPrice: number | null;
  feeAmount: number | null;
  recorderUserId: number | null;
  recorderName: string | null;
  photoUrl: string | null;
  photoName: string | null;
  remark: string | null;
  createdAt: string;
}
