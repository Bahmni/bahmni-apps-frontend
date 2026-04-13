import type { BundleEntry, Reference } from 'fhir/r4';

export type FormKey =
  | 'encounterDetails'
  | 'allergies'
  | 'investigations'
  | 'conditionsAndDiagnoses'
  | 'medications'
  | 'vaccinations'
  | 'observationForms';

export interface BundleContext {
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  consultationDate: Date;
  statDurationInMilliseconds?: number;
}

export interface FormRegistry {
  key: FormKey;
  encounterTypes?: string[];
  privilege?: string[];
  component: React.ComponentType;
  reset: () => void;
  validate: () => boolean;
  hasData: () => boolean;
  subscribe: (cb: () => void) => () => void;
  createBundleEntries?: (ctx: BundleContext) => BundleEntry[];
}
