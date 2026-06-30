'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Droplets,
  Gauge,
  Home,
  Images,
  Loader2,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { WaterMeterRecord, WaterMeterRoomOption } from '@/types/water-meter';
import { chinaToday } from '@/lib/china-time';

const today = chinaToday;

function displayNumber(value?: number | null) {
  return value === null || value === undefined ? '-' : String(value);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
        <span className="text-blue-600">{icon}</span>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function WaterMeterPage() {
  const [rooms, setRooms] = useState<WaterMeterRoomOption[]>([]);
  const [roomNo, setRoomNo] = useState('');
  const [readingDate, setReadingDate] = useState(today());
  const [currentReading, setCurrentReading] = useState('');
  const [unitPrice, setUnitPrice] = useState('6.48');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [remark, setRemark] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingRegisteredRooms, setLoadingRegisteredRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const readingMonth = useMemo(() => (readingDate && /^\d{4}-\d{2}/.test(readingDate) ? readingDate.slice(0, 7) : today().slice(0, 7)), [readingDate]);
  const [registeredRoomNos, setRegisteredRoomNos] = useState<string[]>([]);
  const registeredRoomSet = useMemo(() => new Set(registeredRoomNos), [registeredRoomNos]);
  const availableRoomsCount = useMemo(() => rooms.filter((room) => !registeredRoomSet.has(room.roomNo)).length, [registeredRoomSet, rooms]);
  const selectedRoom = useMemo(() => rooms.find((room) => room.roomNo === roomNo) || null, [roomNo, rooms]);
  const currentReadingNumber = Number(currentReading);
  const unitPriceNumber = unitPrice.trim() ? Number(unitPrice) : null;
  const usageAmount = selectedRoom?.latestReading !== null && selectedRoom?.latestReading !== undefined && Number.isFinite(currentReadingNumber)
    ? round2(currentReadingNumber - selectedRoom.latestReading)
    : null;
  const feeAmount = usageAmount !== null && unitPriceNumber !== null && Number.isFinite(unitPriceNumber)
    ? round2(usageAmount * unitPriceNumber)
    : null;

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch('/api/water-meter/rooms', { cache: 'no-store' });
      const result = await response.json().catch(() => ({})) as {
        success?: boolean;
        rooms?: WaterMeterRoomOption[];
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || '获取房号失败');
      }

      setRooms(result.rooms || []);
    } catch (error) {
      alert(error instanceof Error ? error.message : '获取房号失败');
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const loadRegisteredRooms = useCallback(async (month: string) => {
    if (!month) return;
    setLoadingRegisteredRooms(true);
    try {
      const params = new URLSearchParams({ month });
      const response = await fetch(`/api/water-meter?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json().catch(() => ({})) as {
        success?: boolean;
        records?: WaterMeterRecord[];
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || '获取本月已登记房号失败');
      }

      setRegisteredRoomNos(Array.from(new Set((result.records || []).map((record) => record.roomNo))));
    } catch (error) {
      setRegisteredRoomNos([]);
      alert(error instanceof Error ? error.message : '获取本月已登记房号失败');
    } finally {
      setLoadingRegisteredRooms(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    void loadRegisteredRooms(readingMonth);
  }, [loadRegisteredRooms, readingMonth]);

  useEffect(() => {
    if (roomNo && registeredRoomSet.has(roomNo)) {
      setRoomNo('');
    }
  }, [registeredRoomSet, roomNo]);

  const resetForm = () => {
    setRoomNo('');
    setReadingDate(today());
    setCurrentReading('');
    setUnitPrice('6.48');
    setPhotoFile(null);
    setRemark('');
  };

  const submit = async () => {
    if (!roomNo) {
      alert('请选择房号');
      return;
    }
    if (registeredRoomSet.has(roomNo)) {
      alert(`${roomNo} 已经登记过 ${readingMonth} 的水表，请选择其他房号`);
      setRoomNo('');
      return;
    }
    if (!readingDate) {
      alert('请选择登记日期');
      return;
    }
    if (!currentReading.trim() || !Number.isFinite(currentReadingNumber) || currentReadingNumber < 0) {
      alert('请填写正确的本次水表读数');
      return;
    }
    if (usageAmount !== null && usageAmount < 0) {
      alert(`本次读数不能小于上次读数 ${selectedRoom?.latestReading}`);
      return;
    }
    if (unitPrice.trim() && (!Number.isFinite(unitPriceNumber) || Number(unitPriceNumber) < 0)) {
      alert('请填写正确的水费单价');
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('roomNo', roomNo);
      body.append('readingDate', readingDate);
      body.append('currentReading', currentReading.trim());
      body.append('unitPrice', unitPrice.trim() || '6.48');
      body.append('remark', remark.trim());
      if (photoFile) body.append('photo', photoFile);
      const response = await fetch('/api/water-meter', {
        method: 'POST',
        body,
      });
      const result = await response.json().catch(() => ({})) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || '提交水表登记失败');
      }

      setRegisteredRoomNos((current) => Array.from(new Set([...current, roomNo])));
      setSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : '提交水表登记失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-950">
        <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[430px] flex-col justify-center">
          <div className="rounded-lg border border-slate-100 bg-white px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <CheckCircle2 className="h-11 w-11 text-blue-600" />
            </div>
            <h1 className="mt-6 text-xl font-semibold text-slate-950">水表登记成功</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              后台行政管理可以查看和导出本次水表记录。
            </p>
            <Button
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                resetForm();
                setSubmitted(false);
                window.location.reload();
              }}
            >
              继续添加水表
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-50 pb-[calc(88px+env(safe-area-inset-bottom))] text-slate-950">
      <div className="mx-auto w-full max-w-[430px]">
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur">
          <div className="flex items-center justify-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            <h1 className="text-base font-semibold">水费登记</h1>
          </div>
        </header>

        <div className="p-4">
          <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Gauge className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold">添加水表</h2>
            </div>
            <div className="space-y-4 p-4">
              <Field label="房号" required icon={<Home className="h-4 w-4" />}>
                <Select value={roomNo} onValueChange={setRoomNo} disabled={loadingRooms || loadingRegisteredRooms || availableRoomsCount === 0}>
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue placeholder={loadingRooms || loadingRegisteredRooms ? '正在加载房号...' : availableRoomsCount === 0 ? '本月房号已全部登记' : '请选择房号'} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => {
                      const registered = registeredRoomSet.has(room.roomNo);
                      return (
                      <SelectItem key={room.roomNo} value={room.roomNo} disabled={registered}>
                        <span className="flex w-full items-center justify-between gap-4">
                          <span>{room.roomNo}</span>
                          {registered && <span className="text-xs text-slate-400">已登记</span>}
                        </span>
                      </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {registeredRoomNos.length > 0 && (
                  <p className="text-xs text-slate-500">{readingMonth} 已登记 {registeredRoomNos.length} 个房号，已登记房号不可重复选择。</p>
                )}
              </Field>

              {selectedRoom && (
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-blue-50 p-3 text-sm">
                  <div>
                    <p className="text-slate-500">上次读数</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{selectedRoom.latestReadingText || displayNumber(selectedRoom.latestReading)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">上次日期</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{selectedRoom.latestReadingDate || '-'}</p>
                  </div>
                </div>
              )}

              <Field label="登记日期" required icon={<CalendarDays className="h-4 w-4" />}>
                <Input type="date" value={readingDate} onChange={(event) => setReadingDate(event.target.value)} className="h-11 text-base" />
              </Field>

              <Field label="本次水表读数" required icon={<Gauge className="h-4 w-4" />}>
                <Input
                  value={currentReading}
                  onChange={(event) => setCurrentReading(event.target.value)}
                  placeholder="请输入当前水表读数"
                  inputMode="decimal"
                  className="h-11 text-base"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <p className="text-slate-500">本次用水量</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{usageAmount === null || usageAmount < 0 ? '-' : usageAmount}</p>
                </div>
                <div>
                  <p className="text-slate-500">水费金额</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{feeAmount === null || feeAmount < 0 ? '-' : `¥${feeAmount}`}</p>
                </div>
              </div>

              <Field label="水费单价" icon={<Droplets className="h-4 w-4" />}>
                <Input
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  placeholder="可选，例如：4.2"
                  inputMode="decimal"
                  className="h-11 text-base"
                />
              </Field>

              <Field label="登记人" icon={<UserRound className="h-4 w-4" />}>
                <Input value="系统自动记录当前登录人" disabled className="h-11 text-base" />
              </Field>

              <Field label="水表照片" icon={<Droplets className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 active:bg-blue-100">
                    <Camera className="h-4 w-4" />
                    拍照上传
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                    />
                  </label>
                  <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 active:bg-slate-50">
                    <Images className="h-4 w-4" />
                    相册选择
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {photoFile && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="min-w-0 truncate">已选择：{photoFile.name}</span>
                    <button type="button" className="shrink-0 text-slate-500" onClick={() => setPhotoFile(null)} aria-label="移除照片">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </Field>

              <Field label="备注" icon={<Droplets className="h-4 w-4" />}>
                <Textarea value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="可选" className="min-h-24 text-base" />
              </Field>

              {!loadingRooms && rooms.length === 0 && (
                <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                  暂无房号，请先在后台行政管理里添加房号。
                </div>
              )}
              {!loadingRooms && rooms.length > 0 && availableRoomsCount === 0 && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  {readingMonth} 的房号已全部登记完成。
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto w-full max-w-[430px]">
          <Button className="mobile-submit-button h-12 w-full bg-blue-600 text-base hover:bg-blue-700" onClick={submit} disabled={submitting || loadingRooms || loadingRegisteredRooms || availableRoomsCount === 0}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            添加水表
          </Button>
        </div>
      </div>
    </main>
  );
}
