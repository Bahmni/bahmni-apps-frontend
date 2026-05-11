import imageCompression from 'browser-image-compression';

import {
  DEFAULT_PHOTO_HEIGHT_PX,
  DEFAULT_PHOTO_MAX_FILE_SIZE_KB,
  DEFAULT_PHOTO_WIDTH_PX,
} from '../../../constants/app';
import {
  base64FromDataUrl,
  captureWithSizeConstraint,
  dataUrlByteSize,
  resolvePhotoConfig,
} from '../utils';
import type { CaptureFn } from '../utils';

jest.mock('browser-image-compression', () => {
  const fn: jest.Mock & { getDataUrlFromFile?: jest.Mock } = jest.fn();
  fn.getDataUrlFromFile = jest.fn();
  return { __esModule: true, default: fn };
});

const DEFAULT_MAX_FILE_SIZE_BYTES = DEFAULT_PHOTO_MAX_FILE_SIZE_KB * 1024;

const mockCompress = imageCompression as unknown as jest.Mock;
const mockGetDataUrl = (
  imageCompression as unknown as { getDataUrlFromFile: jest.Mock }
).getDataUrlFromFile;

const makeDataUrlOfBytes = (bytes: number): string => {
  // dataUrlByteSize returns floor(base64.length * 0.75) - padding
  // Choose base64 length so that floor(L * 0.75) - 0 == bytes
  // → L = ceil(bytes / 0.75), no padding
  const base64Length = Math.ceil(bytes / 0.75);
  const base64 = 'A'.repeat(base64Length);
  return `data:image/jpeg;base64,${base64}`;
};

describe('resolvePhotoConfig', () => {
  it('returns fixed mode with all defaults when config is undefined', () => {
    const result = resolvePhotoConfig(undefined);
    expect(result).toEqual({
      mode: 'fixed',
      widthPx: DEFAULT_PHOTO_WIDTH_PX,
      heightPx: DEFAULT_PHOTO_HEIGHT_PX,
      maxFileSizeBytes: DEFAULT_MAX_FILE_SIZE_BYTES,
    });
  });

  it('returns fixed mode with all defaults when config is empty', () => {
    expect(resolvePhotoConfig({})).toEqual({
      mode: 'fixed',
      widthPx: DEFAULT_PHOTO_WIDTH_PX,
      heightPx: DEFAULT_PHOTO_HEIGHT_PX,
      maxFileSizeBytes: DEFAULT_MAX_FILE_SIZE_BYTES,
    });
  });

  it('returns fixed mode using provided widthPx/heightPx and default size', () => {
    expect(resolvePhotoConfig({ widthPx: 400, heightPx: 540 })).toEqual({
      mode: 'fixed',
      widthPx: 400,
      heightPx: 540,
      maxFileSizeBytes: DEFAULT_MAX_FILE_SIZE_BYTES,
    });
  });

  it('falls back individual fields to defaults when only one is provided', () => {
    expect(resolvePhotoConfig({ widthPx: 400 })).toEqual({
      mode: 'fixed',
      widthPx: 400,
      heightPx: DEFAULT_PHOTO_HEIGHT_PX,
      maxFileSizeBytes: DEFAULT_MAX_FILE_SIZE_BYTES,
    });
  });

  it('converts maxFileSizeKb to bytes', () => {
    const result = resolvePhotoConfig({ maxFileSizeKb: 250 });
    expect(result).toMatchObject({ maxFileSizeBytes: 250 * 1024 });
  });

  it('returns variable mode when all four dim fields are provided', () => {
    const result = resolvePhotoConfig({
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      maxFileSizeKb: 500,
    });
    expect(result).toEqual({
      mode: 'variable',
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      maxFileSizeBytes: 500 * 1024,
    });
  });

  it('uses default maxFileSizeKb in variable mode when not provided', () => {
    const result = resolvePhotoConfig({
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
    });
    expect(result).toEqual({
      mode: 'variable',
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      maxFileSizeBytes: DEFAULT_MAX_FILE_SIZE_BYTES,
    });
  });

  it('falls back to fixed mode if any variable-mode dim field is missing (defensive — schema should reject earlier)', () => {
    const result = resolvePhotoConfig({
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      // missing maxHeightPx
      maxFileSizeKb: 500,
    });
    expect(result.mode).toBe('fixed');
  });

  it('prefers variable mode when both fixed and variable fields are present', () => {
    const result = resolvePhotoConfig({
      widthPx: 400,
      heightPx: 540,
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      maxFileSizeKb: 500,
    });
    expect(result.mode).toBe('variable');
  });
});

describe('dataUrlByteSize', () => {
  it('returns 0 for empty data url', () => {
    expect(dataUrlByteSize('')).toBe(0);
  });

  it('returns 0 when there is no comma', () => {
    expect(dataUrlByteSize('not-a-data-url')).toBe(0);
  });

  it('computes size for a 4-char base64 (3 bytes)', () => {
    expect(dataUrlByteSize('data:image/jpeg;base64,QUJD')).toBe(3); // "ABC"
  });

  it('accounts for one padding character', () => {
    // "AB" → "QUI=" — 4 base64 chars, 1 padding → 2 bytes
    expect(dataUrlByteSize('data:image/jpeg;base64,QUI=')).toBe(2);
  });

  it('accounts for two padding characters', () => {
    // "A" → "QQ==" — 4 base64 chars, 2 padding → 1 byte
    expect(dataUrlByteSize('data:image/jpeg;base64,QQ==')).toBe(1);
  });

  it('handles helper that creates known-size data urls', () => {
    expect(dataUrlByteSize(makeDataUrlOfBytes(1000))).toBe(1000);
    expect(dataUrlByteSize(makeDataUrlOfBytes(50000))).toBe(50000);
  });
});

describe('base64FromDataUrl', () => {
  it('strips the data: prefix and returns the base64 payload', () => {
    expect(base64FromDataUrl('data:image/jpeg;base64,QUJD')).toBe('QUJD');
  });

  it('returns empty string for empty input', () => {
    expect(base64FromDataUrl('')).toBe('');
  });

  it('returns empty string when there is no comma', () => {
    expect(base64FromDataUrl('not-a-data-url')).toBe('');
  });
});

describe('captureWithSizeConstraint - variable mode', () => {
  it('returns the max-size capture when it already fits the budget', async () => {
    const capture: CaptureFn = jest.fn(
      (w, h) => makeDataUrlOfBytes((w! * h!) / 100), // small payload
    );
    const cfg = {
      mode: 'variable' as const,
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      maxFileSizeBytes: 100 * 1024,
    };

    const result = await captureWithSizeConstraint(capture, cfg);

    expect(capture).toHaveBeenCalledWith(600, 810, 1);
    expect(result).toBeDefined();
    expect(dataUrlByteSize(result!)).toBeLessThanOrEqual(100 * 1024);
  });

  it('always uses quality 1 across all capture calls', async () => {
    const capture: CaptureFn = jest.fn(
      (w, h) => makeDataUrlOfBytes(w! * h! * 2), // big payload — forces search
    );
    const cfg = {
      mode: 'variable' as const,
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      maxFileSizeBytes: 50 * 1024,
    };

    await captureWithSizeConstraint(capture, cfg);

    // Every call to capture should pass quality === 1
    const calls = (capture as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call[2]).toBe(1);
    }
  });

  it('binary-searches dimensions to find the largest that fits', async () => {
    // Capture returns payload proportional to w * h.
    // Set budget such that only smaller dimensions fit.
    const bytesPerPixel = 4;
    const capture: CaptureFn = jest.fn((w, h) =>
      makeDataUrlOfBytes(w! * h! * bytesPerPixel),
    );
    const cfg = {
      mode: 'variable' as const,
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      // Budget that fits roughly width=300 (300*405*4 ≈ 486k)
      maxFileSizeBytes: 500 * 1024,
    };

    const result = await captureWithSizeConstraint(capture, cfg);

    expect(result).toBeDefined();
    const finalSize = dataUrlByteSize(result!);
    expect(finalSize).toBeLessThanOrEqual(500 * 1024);
  });

  it('falls back to (minW, minH) when even max search step does not fit', async () => {
    // Capture always returns oversized payload — nothing fits the budget
    const capture: CaptureFn = jest.fn(() =>
      makeDataUrlOfBytes(10 * 1024 * 1024),
    );
    const cfg = {
      mode: 'variable' as const,
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      maxFileSizeBytes: 50 * 1024,
    };

    const result = await captureWithSizeConstraint(capture, cfg);

    // Final fallback call should be at min dims with quality 1
    expect(capture).toHaveBeenLastCalledWith(100, 135, 1);
    expect(result).toBeDefined();
  });

  it('returns undefined if capture never returns a data url', async () => {
    const capture: CaptureFn = jest.fn(() => undefined);
    const cfg = {
      mode: 'variable' as const,
      minWidthPx: 100,
      maxWidthPx: 600,
      minHeightPx: 135,
      maxHeightPx: 810,
      maxFileSizeBytes: 50 * 1024,
    };

    const result = await captureWithSizeConstraint(capture, cfg);
    expect(result).toBeUndefined();
  });
});

describe('captureWithSizeConstraint - fixed mode', () => {
  beforeEach(() => {
    mockCompress.mockReset();
    mockGetDataUrl.mockReset();

    // Polyfill fetch for dataUrlToFile (jsdom may not have it)
    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' })),
      }),
    ) as unknown as typeof fetch;
  });

  it('forwards the right options to imageCompression', async () => {
    const capture: CaptureFn = jest.fn(() => 'data:image/jpeg;base64,QUJD');
    const compressedFile = new File(['compressed'], 'photo.jpg', {
      type: 'image/jpeg',
    });
    mockCompress.mockResolvedValue(compressedFile);
    mockGetDataUrl.mockResolvedValue('data:image/jpeg;base64,RVNVTFQ=');

    const cfg = {
      mode: 'fixed' as const,
      widthPx: DEFAULT_PHOTO_WIDTH_PX,
      heightPx: DEFAULT_PHOTO_HEIGHT_PX,
      maxFileSizeBytes: DEFAULT_MAX_FILE_SIZE_BYTES,
    };

    const result = await captureWithSizeConstraint(capture, cfg);

    expect(capture).toHaveBeenCalledWith(
      DEFAULT_PHOTO_WIDTH_PX,
      DEFAULT_PHOTO_HEIGHT_PX,
      1,
    );
    expect(mockCompress).toHaveBeenCalledTimes(1);
    const opts = mockCompress.mock.calls[0][1];
    expect(opts).toMatchObject({
      maxSizeMB: DEFAULT_PHOTO_MAX_FILE_SIZE_KB / 1024,
      maxWidthOrHeight: Math.max(
        DEFAULT_PHOTO_WIDTH_PX,
        DEFAULT_PHOTO_HEIGHT_PX,
      ),
      fileType: 'image/jpeg',
      initialQuality: 1,
      useWebWorker: true,
    });
    expect(result).toBe('data:image/jpeg;base64,RVNVTFQ=');
  });

  it('returns undefined when capture returns undefined', async () => {
    const capture: CaptureFn = jest.fn(() => undefined);
    const cfg = {
      mode: 'fixed' as const,
      widthPx: DEFAULT_PHOTO_WIDTH_PX,
      heightPx: DEFAULT_PHOTO_HEIGHT_PX,
      maxFileSizeBytes: DEFAULT_MAX_FILE_SIZE_BYTES,
    };

    const result = await captureWithSizeConstraint(capture, cfg);
    expect(result).toBeUndefined();
    expect(mockCompress).not.toHaveBeenCalled();
  });
});
