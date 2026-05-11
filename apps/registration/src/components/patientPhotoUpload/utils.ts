import imageCompression from 'browser-image-compression';

import {
  DEFAULT_PHOTO_HEIGHT_PX,
  DEFAULT_PHOTO_MAX_FILE_SIZE_KB,
  DEFAULT_PHOTO_WIDTH_PX,
} from '../../constants/app';
import type { PatientPhotoConfig } from '../../providers/registrationConfig/models';

export type CaptureFn = (
  width?: number,
  height?: number,
  quality?: number,
) => string | undefined;

export type ResolvedPhotoConfig =
  | {
      mode: 'fixed';
      widthPx: number;
      heightPx: number;
      maxFileSizeBytes: number;
    }
  | {
      mode: 'variable';
      minWidthPx: number;
      maxWidthPx: number;
      minHeightPx: number;
      maxHeightPx: number;
      maxFileSizeBytes: number;
    };

const hasAllVariableFields = (config?: PatientPhotoConfig): boolean =>
  config?.minWidthPx != null &&
  config?.maxWidthPx != null &&
  config?.minHeightPx != null &&
  config?.maxHeightPx != null;

export const resolvePhotoConfig = (
  config?: PatientPhotoConfig,
): ResolvedPhotoConfig => {
  const maxFileSizeBytes =
    (config?.maxFileSizeKb ?? DEFAULT_PHOTO_MAX_FILE_SIZE_KB) * 1024;
  if (hasAllVariableFields(config)) {
    return {
      mode: 'variable',
      minWidthPx: config!.minWidthPx!,
      maxWidthPx: config!.maxWidthPx!,
      minHeightPx: config!.minHeightPx!,
      maxHeightPx: config!.maxHeightPx!,
      maxFileSizeBytes,
    };
  }
  return {
    mode: 'fixed',
    widthPx: config?.widthPx ?? DEFAULT_PHOTO_WIDTH_PX,
    heightPx: config?.heightPx ?? DEFAULT_PHOTO_HEIGHT_PX,
    maxFileSizeBytes,
  };
};

export const dataUrlByteSize = (dataUrl: string): number => {
  const base64 = dataUrl.split(',')[1] ?? '';
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor(base64.length * 0.75) - padding;
};

export const toJpegDataUrl = (
  img: HTMLImageElement,
  quality = 1,
): string | undefined => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
};

export const base64FromDataUrl = (dataUrl: string): string =>
  dataUrl.split(',')[1] || '';

export const fileToObjectUrl = (file: File): string =>
  URL.createObjectURL(file);

export const revokeObjectUrl = (url?: string): void => {
  if (url) URL.revokeObjectURL(url);
};

const dataUrlToFile = async (dataUrl: string): Promise<File> => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
};

const captureFixedQualitySearch = async (
  capture: CaptureFn,
  cfg: Extract<ResolvedPhotoConfig, { mode: 'fixed' }>,
): Promise<string | undefined> => {
  const { widthPx, heightPx, maxFileSizeBytes } = cfg;
  const raw = capture(widthPx, heightPx, 1);
  if (!raw) return undefined;

  const file = await dataUrlToFile(raw);
  const compressed = await imageCompression(file, {
    maxSizeMB: maxFileSizeBytes / (1024 * 1024),
    maxWidthOrHeight: Math.max(widthPx, heightPx),
    fileType: 'image/jpeg',
    initialQuality: 1,
    useWebWorker: true,
  });
  return imageCompression.getDataUrlFromFile(compressed);
};

const captureVariableDimensionSearch = (
  capture: CaptureFn,
  cfg: Extract<ResolvedPhotoConfig, { mode: 'variable' }>,
): string | undefined => {
  const { minWidthPx, maxWidthPx, minHeightPx, maxHeightPx, maxFileSizeBytes } =
    cfg;

  const full = capture(maxWidthPx, maxHeightPx, 1);
  if (full && dataUrlByteSize(full) <= maxFileSizeBytes) return full;

  let lo = 0;
  let hi = 100;
  let best: string | undefined;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const t = mid / 100;
    const w = Math.round(minWidthPx + t * (maxWidthPx - minWidthPx));
    const h = Math.round(minHeightPx + t * (maxHeightPx - minHeightPx));
    const url = capture(w, h, 1);
    if (!url) break;
    if (dataUrlByteSize(url) <= maxFileSizeBytes) {
      best = url;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best ?? capture(minWidthPx, minHeightPx, 1);
};

export const captureWithSizeConstraint = async (
  capture: CaptureFn,
  cfg: ResolvedPhotoConfig,
): Promise<string | undefined> =>
  cfg.mode === 'fixed'
    ? captureFixedQualitySearch(capture, cfg)
    : captureVariableDimensionSearch(capture, cfg);
