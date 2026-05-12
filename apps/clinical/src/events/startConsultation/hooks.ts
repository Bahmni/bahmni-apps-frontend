import { useEffect } from 'react';
import { CONSULTATION_START_EVENT } from './constants';
import { EncounterSessionStartContext } from './models';

export const useSubscribeConsultationStart = (
  callback: (payload: EncounterSessionStartContext) => void,
) => {
  useEffect(() => {
    const handler = (event: Event) =>
      callback((event as CustomEvent<EncounterSessionStartContext>).detail);

    globalThis.addEventListener(CONSULTATION_START_EVENT, handler);
    return () =>
      globalThis.removeEventListener(CONSULTATION_START_EVENT, handler);
  }, [callback]);
};
