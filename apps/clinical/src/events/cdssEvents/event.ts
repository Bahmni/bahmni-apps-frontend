import { CDSS_CHECK_EVENT, CDSS_RESULTS_EVENT } from './constants';
import type { CDSSCheckEventDetail, CDSSResultsEventDetail } from './models';

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
