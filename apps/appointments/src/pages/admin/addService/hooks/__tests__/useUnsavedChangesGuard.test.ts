import { act, renderHook } from '@testing-library/react';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';

const isOnGuardEntry = () =>
  !!(window.history.state as Record<string, unknown> | null)
    ?.unsavedChangesGuard;

const dispatchBeforeUnload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe('useUnsavedChangesGuard', () => {
  let backSpy: jest.SpyInstance;

  beforeEach(() => {
    window.history.replaceState(null, '');
    backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});
  });

  afterEach(() => {
    backSpy.mockRestore();
  });

  it('should not push a guard entry or block unload while the form is pristine', () => {
    const onBrowserBack = jest.fn();
    renderHook(() => useUnsavedChangesGuard(false, onBrowserBack));

    expect(isOnGuardEntry()).toBe(false);
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it('should push a guard entry and block unload while the form is dirty', () => {
    renderHook(() => useUnsavedChangesGuard(true, jest.fn()));

    expect(isOnGuardEntry()).toBe(true);
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
  });

  it('should call onBrowserBack and re-arm the guard when the browser Back button is pressed', () => {
    const onBrowserBack = jest.fn();
    renderHook(() => useUnsavedChangesGuard(true, onBrowserBack));

    act(() => {
      window.history.replaceState(null, '');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(onBrowserBack).toHaveBeenCalledTimes(1);
    expect(isOnGuardEntry()).toBe(true);
  });

  it('should remove the guard entry when the form becomes pristine again', () => {
    const { rerender } = renderHook(
      ({ isDirty }) => useUnsavedChangesGuard(isDirty, jest.fn()),
      { initialProps: { isDirty: true } },
    );

    rerender({ isDirty: false });

    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it('should disarm both guards and report the guard entry when leaving on purpose', () => {
    const onBrowserBack = jest.fn();
    const navigateAway = jest.fn();
    const { result, unmount } = renderHook(() =>
      useUnsavedChangesGuard(true, onBrowserBack),
    );

    act(() => result.current.leave(navigateAway));

    expect(navigateAway).toHaveBeenCalledWith(true);
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(onBrowserBack).not.toHaveBeenCalled();

    unmount();
    expect(backSpy).not.toHaveBeenCalled();
  });
});
