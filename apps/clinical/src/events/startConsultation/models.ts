import type { Encounter, Resource } from 'fhir/r4';

export interface ConsultationEventContext {
  encounterType?: string;
  encounter?: Encounter;
  basedOn?: Resource;
  formName?: string;
  directFormMode?: boolean;
  isVisitActive?: boolean;
  [key: string]: unknown;
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
  patientUuid?: string;
  // Legacy flat fields kept for backward compat during transition
  [key: string]: unknown;
}

// Keep for backward compat in internal usage - alias
export type EncounterSessionStartContext = ConsultationEventPayload;
