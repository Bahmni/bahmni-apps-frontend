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
});
