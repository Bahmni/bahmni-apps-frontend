import type { BundleEntry, Reference } from 'fhir/r4';

export type InputControlKey =
  | 'encounterDetails'
  | 'allergies'
  | 'investigations'
  | 'conditionsAndDiagnoses'
  | 'medications'
  | 'vaccinations'
  | 'immunizationHistory'
  | 'observationForms';

export interface EncounterContext {
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  consultationDate: Date;
  statDurationInMilliseconds?: number;
}

export interface EncounterInputControl {
  key: InputControlKey;
  encounterTypes?: string[];
  privilege?: string[];
  component: React.ComponentType;
  reset: () => void;
  validate: () => boolean;
  hasData: () => boolean;
  subscribe: (cb: () => void) => () => void;
  createBundleEntries?: (ctx: EncounterContext) => BundleEntry[];
}
