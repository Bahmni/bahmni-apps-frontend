import { CONSULTATION_START_EVENT } from './constants';
import { EncounterSessionStartContext } from './models';

export const dispatchConsultationStart = (
  payload: EncounterSessionStartContext,
): void => {
  const event = new CustomEvent(CONSULTATION_START_EVENT, {
    detail: payload,
  });
  globalThis.dispatchEvent(event);
};
