import { type CDSCard } from '@bahmni/services';
import type { BundleEntry, Reference } from 'fhir/r4';
import type { EncounterSessionStartContext } from '../../events/startConsultation';
import type { InputControl as ClinicalInputControlConfig } from '../../providers/clinicalConfig/models';

export interface SubmissionResult {
  updatedConcepts: Map<string, string>;
  patientUUID: string;
  encounterTypeName: string;
}

export interface InputControl {
  key: string;
  encounterTypes?: string[];
  privilege?: string[];
  onActionTriggered?: boolean;
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
  /**
   * Only consulted when onDirectSubmit is also defined. A control with
   * onDirectSubmit but no hasBundleData is assumed to have moved all its data
   * to the direct-submit path and will NOT contribute to the bundle.
   */
  hasBundleData?: () => boolean;
  updateItemCDSCards?: (itemId: string, cards: CDSCard[]) => void;
  hasCriticalCDSCards?: () => boolean;
  onDirectSubmit?: () => Promise<void>;
  onSubmitSuccess?: (result: SubmissionResult) => void;
}

export interface EncounterContext {
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  consultationDate: Date;
  statDurationInMilliseconds?: number;
}
