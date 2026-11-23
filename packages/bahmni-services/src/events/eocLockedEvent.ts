import { useEffect } from 'react';

export const EOC_LOCKED_EVENT = 'eocLocked';

export const dispatchEocLocked = (): void => {
  globalThis.dispatchEvent(new CustomEvent(EOC_LOCKED_EVENT));
};

export const useSubscribeEocLocked = (callback: () => void) => {
  useEffect(() => {
    const handler = () => callback();

    globalThis.addEventListener(EOC_LOCKED_EVENT, handler);
    return () => globalThis.removeEventListener(EOC_LOCKED_EVENT, handler);
  }, [callback]);
};
