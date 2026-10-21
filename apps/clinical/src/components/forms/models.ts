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
  /** Action types that this control handles exclusively (e.g. ['delete'] for stopMedications). */
  handledActionTypes?: ('create' | 'update' | 'delete')[];
  /** FHIR resource types this control handles (e.g. ['MedicationRequest'] for stopMedications). */
  handledResourceTypes?: string[];
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
   * to the direct-submit path and will NOT contribute to the bundle. May
   * return a promise if answering requires resolving install-specific
   * config first; consultationPad awaits it before building the bundle.
   */
  hasBundleData?: () => boolean | Promise<boolean>;
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
