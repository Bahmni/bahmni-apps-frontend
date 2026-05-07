import type { BundleEntry, Reference } from 'fhir/r4';

export interface InputControl {
  key: string;
  encounterTypes?: string[];
  privilege?: string[];
  component: React.ComponentType;
  reset: () => void;
  validate: () => boolean;
  hasData: () => boolean;
  subscribe: (cb: () => void) => () => void;
  createBundleEntries?: (ctx: EncounterContext) => BundleEntry[];
}

export interface EncounterContext {
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  consultationDate: Date;
  statDurationInMilliseconds?: number;
}
