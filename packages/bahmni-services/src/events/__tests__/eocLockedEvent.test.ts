import { renderHook } from '@testing-library/react';
import {
  dispatchEocLocked,
  EOC_LOCKED_EVENT,
  useSubscribeEocLocked,
} from '../eocLockedEvent';

describe('eocLockedEvent', () => {
  it('dispatches the EOC_LOCKED_EVENT on the global object', () => {
    const listener = jest.fn();
    globalThis.addEventListener(EOC_LOCKED_EVENT, listener);

    dispatchEocLocked();

    expect(listener).toHaveBeenCalledTimes(1);
    globalThis.removeEventListener(EOC_LOCKED_EVENT, listener);
  });

  it('calls the subscriber when the event is dispatched', () => {
    const callback = jest.fn();
    renderHook(() => useSubscribeEocLocked(callback));

    dispatchEocLocked();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('stops calling the subscriber after unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useSubscribeEocLocked(callback));

    unmount();
    dispatchEocLocked();

    expect(callback).not.toHaveBeenCalled();
  });
});
