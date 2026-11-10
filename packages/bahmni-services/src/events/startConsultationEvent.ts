import type { Encounter, Resource } from 'fhir/r4';
import { useEffect } from 'react';

export const CONSULTATION_START_EVENT = 'startConsultation';

export type ConsultationEncounter = Partial<Encounter> &
  Pick<Encounter, 'resourceType'>;

export interface ConsultationEventContext {
  encounterType?: string;
  encounter?: ConsultationEncounter;
  basedOn?: Resource;
  formName?: string | null;
  directFormMode?: boolean;
  isVisitActive?: boolean;
}

export interface ConsultationEventAction {
  type: 'create' | 'update' | 'delete';
  resourceType?: string;
  resources?: Resource[];
}

export interface ConsultationEventPayload {
  context?: ConsultationEventContext;
  action?: ConsultationEventAction;
  activeEncounter?: Encounter | null;
}

export const dispatchConsultationStart = (
  payload: ConsultationEventPayload = {},
): void => {
  globalThis.dispatchEvent(
    new CustomEvent(CONSULTATION_START_EVENT, { detail: payload }),
  );
};

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
