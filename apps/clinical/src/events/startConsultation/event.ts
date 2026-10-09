import { CONSULTATION_START_EVENT } from './constants';
import type { ConsultationEventPayload } from './models';

export const dispatchConsultationStart = (
  payload: ConsultationEventPayload = {},
): void => {
  const event = new CustomEvent(CONSULTATION_START_EVENT, {
    detail: payload,
  });
  globalThis.dispatchEvent(event);
};
