import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { initializeAuditListener } from '../globalAuditListener';
import { useAuditListenerInitialization } from '../useAuditListenerInitialization';

jest.mock('../globalAuditListener', () => ({
  initializeAuditListener: jest.fn(),
}));

const mockInitializeAuditListener =
  initializeAuditListener as jest.MockedFunction<
    typeof initializeAuditListener
  >;

describe('useAuditListenerInitialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers the listener on mount and removes it on unmount', () => {
    const cleanup = jest.fn();
    mockInitializeAuditListener.mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useAuditListenerInitialization());

    expect(mockInitializeAuditListener).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('does not leak a listener when StrictMode double-invokes the mount effect', () => {
    const cleanups: jest.Mock[] = [];
    mockInitializeAuditListener.mockImplementation(() => {
      const cleanup = jest.fn();
      cleanups.push(cleanup);
      return cleanup;
    });

    renderHook(() => useAuditListenerInitialization(), {
      wrapper: StrictMode,
    });

    // StrictMode double-invokes the mount effect in development, so initializeAuditListener runs more than once.
    expect(cleanups.length).toBeGreaterThan(1);
    // Exactly one listener should remain the "live" one; every other
    // invocation belongs to an effect instance StrictMode already
    // cleaned up, and must be cleaned up immediately or it leaks.
    const cleanedUpCount = cleanups.filter(
      (cleanup) => cleanup.mock.calls.length > 0,
    ).length;
    expect(cleanedUpCount).toBe(cleanups.length - 1);
  });
});
