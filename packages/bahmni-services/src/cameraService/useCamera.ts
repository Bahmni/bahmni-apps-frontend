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

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 0;
    canvas.height = video.videoHeight || 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 1);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { videoRef, start, stop, capture };
}
