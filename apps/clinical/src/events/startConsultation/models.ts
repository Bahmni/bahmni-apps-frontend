import type { Encounter, Resource } from 'fhir/r4';

export interface ConsultationEventContext {
  encounterType?: string;
  encounter?: Encounter;
  basedOn?: Resource;
  formName?: string;
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

export type EncounterSessionStartContext = ConsultationEventPayload;
