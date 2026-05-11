import { renderHook, act } from '@testing-library/react';
import { useCamera } from '../useCamera';

describe('useCamera', () => {
  let mockStream: MediaStream;
  let mockGetUserMedia: jest.Mock;

  beforeEach(() => {
    mockStream = {
      getTracks: jest
        .fn()
        .mockReturnValue([{ stop: jest.fn() }, { stop: jest.fn() }]),
    } as unknown as MediaStream;

    mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });

    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn(),
    })) as any;

    HTMLCanvasElement.prototype.toDataURL = jest.fn(
      () => 'data:image/jpeg;base64,mockImageData',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should request camera access with correct constraints', async () => {
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'user' },
    });
  });

  it('should handle camera permission errors', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
    const { result } = renderHook(() => useCamera());

    await expect(
      act(async () => {
        await result.current.start();
      }),
    ).rejects.toThrow('Permission denied');
  });

  it('should stop all media stream tracks', async () => {
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    const tracks = mockStream.getTracks();

    act(() => {
      result.current.stop();
    });

    tracks.forEach((track: MediaStreamTrack) => {
      expect(track.stop).toHaveBeenCalled();
    });
  });

  it('should handle stop when no stream exists', () => {
    const { result } = renderHook(() => useCamera());

    expect(() => {
      act(() => {
        result.current.stop();
      });
    }).not.toThrow();
  });

  it('should cleanup stream on unmount', async () => {
    const { result, unmount } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    const tracks = mockStream.getTracks();
    unmount();

    tracks.forEach((track: MediaStreamTrack) => {
      expect(track.stop).toHaveBeenCalled();
    });
  });

  it('should capture image from video element', () => {
    const { result } = renderHook(() => useCamera());

    result.current.videoRef.current = {
      videoWidth: 640,
      videoHeight: 480,
    } as HTMLVideoElement;

    const capturedImage = result.current.capture();

    expect(capturedImage).toBeDefined();
    expect(typeof capturedImage).toBe('string');
    expect(capturedImage?.startsWith('data:image/jpeg')).toBe(true);
  });

  it('should return undefined when video ref is null', () => {
    const { result } = renderHook(() => useCamera());

    const capturedImage = result.current.capture();

    expect(capturedImage).toBeUndefined();
  });

  it('should return undefined when video has zero dimensions', () => {
    const { result } = renderHook(() => useCamera());

    result.current.videoRef.current = {
      videoWidth: 0,
      videoHeight: 0,
    } as HTMLVideoElement;

    expect(result.current.capture()).toBeUndefined();
  });

  it('should pass the quality argument to toDataURL', () => {
    const toDataURLMock = jest.fn(() => 'data:image/jpeg;base64,mockImageData');
    HTMLCanvasElement.prototype.toDataURL = toDataURLMock;

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = {
      videoWidth: 640,
      videoHeight: 480,
    } as HTMLVideoElement;

    result.current.capture(undefined, undefined, 0.7);

    expect(toDataURLMock).toHaveBeenCalledWith('image/jpeg', 0.7);
  });

  it('should center-crop the video frame to the target aspect ratio when video is wider', () => {
    const drawImage = jest.fn();
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage,
    })) as any;

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = {
      videoWidth: 1280,
      videoHeight: 720,
    } as HTMLVideoElement;

    // Target aspect 1:1.35 (portrait, narrower than 16:9 video)
    result.current.capture(600, 810);

    // Source: keep video height, crop width = 720 / (810/600) = 533
    // srcX = (1280 - 533) / 2 = 374 (rounded)
    // srcY = 0
    expect(drawImage).toHaveBeenCalledTimes(1);
    const args = drawImage.mock.calls[0];
    expect(args[0]).toBe(result.current.videoRef.current);
    expect(args[1]).toBeGreaterThan(0); // srcX (left crop)
    expect(args[2]).toBe(0); // srcY (no vertical crop)
    expect(args[3]).toBeLessThan(1280); // srcW (cropped)
    expect(args[4]).toBe(720); // srcH (full height)
    expect(args[5]).toBe(0); // destX
    expect(args[6]).toBe(0); // destY
    expect(args[7]).toBe(600); // destW
    expect(args[8]).toBe(810); // destH
  });

  it('should center-crop the video frame to the target aspect ratio when video is taller', () => {
    const drawImage = jest.fn();
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage,
    })) as any;

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = {
      videoWidth: 480,
      videoHeight: 800,
    } as HTMLVideoElement;

    // Target landscape (wider than video)
    result.current.capture(800, 600);

    // Source: keep video width, crop top/bottom
    expect(drawImage).toHaveBeenCalledTimes(1);
    const args = drawImage.mock.calls[0];
    expect(args[1]).toBe(0); // srcX (no horizontal crop)
    expect(args[2]).toBeGreaterThan(0); // srcY (top crop)
    expect(args[3]).toBe(480); // srcW (full width)
    expect(args[4]).toBeLessThan(800); // srcH (cropped)
    expect(args[7]).toBe(800); // destW
    expect(args[8]).toBe(600); // destH
  });

  it('should use video native dimensions when no target dimensions are provided', () => {
    const drawImage = jest.fn();
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage,
    })) as any;

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = {
      videoWidth: 1280,
      videoHeight: 720,
    } as HTMLVideoElement;

    result.current.capture();

    // No target dims → drawImage(video, 0, 0) signature (3 args)
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawImage.mock.calls[0]).toHaveLength(3);
  });
});
