'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Images, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WaterMeterPhotoPickerProps {
  photoFile: File | null;
  onPhotoFileChange: (file: File | null) => void;
  onPhotoSelected?: () => void;
  roundedClassName?: string;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
}

export function WaterMeterPhotoPicker({
  photoFile,
  onPhotoFileChange,
  onPhotoSelected,
  roundedClassName = 'rounded-2xl',
}: WaterMeterPhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch((error) => {
      console.error('Play water meter camera preview error:', error);
      setCameraError('相机预览打开失败，请使用系统拍照入口。');
    });
  }, [stream]);

  useEffect(() => {
    return () => stopStream(stream);
  }, [stream]);

  const closeCamera = useCallback(() => {
    stopStream(stream);
    setStream(null);
    setCameraOpen(false);
    setCameraLoading(false);
  }, [stream]);

  const handleSelectedFile = (file: File | null) => {
    if (file) {
      onPhotoFileChange(file);
      onPhotoSelected?.();
    }
  };

  const openCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    setCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setCameraOpen(true);
    } catch (error) {
      console.error('Open water meter camera error:', error);
      setCameraError('无法直接打开相机，已切换到系统拍照入口。');
      cameraInputRef.current?.click();
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('当前浏览器无法生成照片，请使用相册选择。');
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const blob = await canvasToBlob(canvas);
    if (!blob) {
      setCameraError('拍照失败，请重试。');
      return;
    }

    handleSelectedFile(new File([blob], `water_meter_${Date.now()}.jpg`, { type: 'image/jpeg' }));
    closeCamera();
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className={cn('h-11 border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800', roundedClassName)}
          onClick={() => void openCamera()}
          disabled={cameraLoading}
        >
          {cameraLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          打开相机拍照
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn('h-11 text-sm font-medium text-slate-700', roundedClassName)}
          onClick={() => albumInputRef.current?.click()}
        >
          <Images className="mr-2 h-4 w-4" />
          相册选择
        </Button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          handleSelectedFile(event.target.files?.[0] || null);
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          handleSelectedFile(event.target.files?.[0] || null);
          event.currentTarget.value = '';
        }}
      />

      {cameraError && <p className="text-xs text-orange-600">{cameraError}</p>}
      {photoFile && (
        <div className={cn('flex items-center justify-between gap-3 bg-slate-50 px-3 py-2 text-xs text-slate-600', roundedClassName)}>
          <span className="min-w-0 truncate">已选择：{photoFile.name}</span>
          <button type="button" className="shrink-0 text-slate-500" onClick={() => onPhotoFileChange(null)} aria-label="移除照片">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-base font-semibold">相机拍照</div>
            <button type="button" className="rounded-full bg-white/10 p-2" onClick={closeCamera} aria-label="关闭相机">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 bg-black">
            <video ref={videoRef} className="h-full w-full object-contain" autoPlay muted playsInline />
          </div>
          <div className="grid grid-cols-2 gap-3 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
            <Button type="button" variant="outline" className="h-12 rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={closeCamera}>
              取消
            </Button>
            <Button type="button" className="h-12 rounded-2xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => void capturePhoto()}>
              拍照使用
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
