import { useEffect } from 'react';
import { CONSULTATION_START_EVENT } from './constants';
import type { ConsultationEventPayload } from './models';

export const useSubscribeConsultationStart = (
  callback: (payload: ConsultationEventPayload) => void,
) => {
  useEffect(() => {
    const handler = (event: Event) =>
      callback((event as CustomEvent<ConsultationEventPayload>).detail);

    globalThis.addEventListener(CONSULTATION_START_EVENT, handler);
    return () =>
      globalThis.removeEventListener(CONSULTATION_START_EVENT, handler);
  }, [callback]);
};
