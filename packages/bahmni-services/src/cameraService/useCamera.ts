import { useRef, useEffect, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const capture = useCallback(
    (targetWidth?: number, targetHeight?: number, quality = 1) => {
      const video = videoRef.current;
      if (!video) return undefined;
      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;
      if (!vw || !vh) return undefined;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      if (targetWidth && targetHeight) {
        const targetAspect = targetWidth / targetHeight;
        const videoAspect = vw / vh;
        let srcX = 0,
          srcY = 0,
          srcW = vw,
          srcH = vh;
        if (videoAspect > targetAspect) {
          srcW = Math.round(vh * targetAspect);
          srcX = Math.round((vw - srcW) / 2);
        } else {
          srcH = Math.round(vw / targetAspect);
          srcY = Math.round((vh - srcH) / 2);
        }
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(
          video,
          srcX,
          srcY,
          srcW,
          srcH,
          0,
          0,
          targetWidth,
          targetHeight,
        );
      } else {
        canvas.width = vw;
        canvas.height = vh;
        ctx.drawImage(video, 0, 0);
      }
      return canvas.toDataURL('image/jpeg', quality);
    },
    [],
  );

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { videoRef, start, stop, capture };
}
