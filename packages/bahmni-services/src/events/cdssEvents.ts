import { useEffect, useRef } from 'react';
import type { CDSCard, CDSSRule } from '../cdssService';

export const CDSS_CHECK_EVENT = 'cdss:check';
export const CDSS_RESULTS_EVENT = 'cdss:results';

export interface CDSSCheckEventDetail {
  controlKey: string;
  itemId: string;
  rules: CDSSRule[];
}

export interface CDSSResultsEventDetail {
  cards: CDSCard[];
  triggerItemId: string;
  controlKey: string;
}

export const dispatchCDSSCheck = (payload: CDSSCheckEventDetail): void => {
  const event = new CustomEvent(CDSS_CHECK_EVENT, {
    detail: payload,
  });
  globalThis.dispatchEvent(event);
};

export const dispatchCDSSResults = (payload: CDSSResultsEventDetail): void => {
  const event = new CustomEvent(CDSS_RESULTS_EVENT, {
    detail: payload,
  });
  globalThis.dispatchEvent(event);
};

export const useCDSSCheckListener = (
  callback: (payload: CDSSCheckEventDetail) => void,
): void => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<CDSSCheckEventDetail>;
      callbackRef.current(customEvent.detail);
    };

    globalThis.addEventListener(CDSS_CHECK_EVENT, handler);
    return () => {
      globalThis.removeEventListener(CDSS_CHECK_EVENT, handler);
    };
  }, []);
};

export const useCDSSResultsListener = (
  callback: (payload: CDSSResultsEventDetail) => void,
): void => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<CDSSResultsEventDetail>;
      callbackRef.current(customEvent.detail);
    };

    globalThis.addEventListener(CDSS_RESULTS_EVENT, handler);
    return () => {
      globalThis.removeEventListener(CDSS_RESULTS_EVENT, handler);
    };
  }, []);
};
