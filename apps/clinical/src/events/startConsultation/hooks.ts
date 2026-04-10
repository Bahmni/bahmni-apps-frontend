import { useEffect } from 'react';
import { CONSULTATION_START_EVENT } from './constants';
import { ConsultationStartEvent } from './models';

export const useSubscribeConsultationStart = (
  callback: (payload: ConsultationStartEvent) => void,
) => {
  useEffect(() => {
    const handler = (event: Event) =>
      callback((event as CustomEvent<ConsultationStartEvent>).detail);

    globalThis.addEventListener(CONSULTATION_START_EVENT, handler);
    return () =>
      globalThis.removeEventListener(CONSULTATION_START_EVENT, handler);
  }, [callback]);
};
