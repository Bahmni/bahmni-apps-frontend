import { CONSULTATION_START_EVENT } from './constants';
import { ConsultationStartEvent } from './models';

export const dispatchConsultationStart = (
  payload: ConsultationStartEvent,
): void => {
  const event = new CustomEvent(CONSULTATION_START_EVENT, {
    detail: payload,
  });
  globalThis.dispatchEvent(event);
};
