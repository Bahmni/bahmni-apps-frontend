import type { BundleEntry, Reference } from 'fhir/r4';
import type { EncounterSessionStartContext } from '../../events/startConsultation';
import type { InputControl as ClinicalInputControlConfig } from '../../providers/clinicalConfig/models';

export interface InputControl {
  key: string;
  encounterTypes?: string[];
  privilege?: string[];
  inputControlConfig?: ClinicalInputControlConfig;
  component: React.ComponentType<{
    encounterSessionStartContext?: EncounterSessionStartContext;
    inputControlConfig?: ClinicalInputControlConfig;
  }>;
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
