import { useEffect } from 'react';
import { CDSS_CHECK_EVENT, CDSS_RESULTS_EVENT } from './constants';
import type { CDSSCheckEventDetail, CDSSResultsEventDetail } from './models';

export const useCDSSCheckListener = (
  handler: (detail: CDSSCheckEventDetail) => void,
): void => {
  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<CDSSCheckEventDetail>;
      handler(customEvent.detail);
    };

    globalThis.addEventListener(CDSS_CHECK_EVENT, listener);
    return () => globalThis.removeEventListener(CDSS_CHECK_EVENT, listener);
  }, [handler]);
};

export const useCDSSResultsListener = (
  handler: (detail: CDSSResultsEventDetail) => void,
): void => {
  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<CDSSResultsEventDetail>;
      handler(customEvent.detail);
    };

    globalThis.addEventListener(CDSS_RESULTS_EVENT, listener);
    return () => globalThis.removeEventListener(CDSS_RESULTS_EVENT, listener);
  }, [handler]);
};
