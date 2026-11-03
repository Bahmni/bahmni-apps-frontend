import { type CDSCard, type ConsultationEventPayload } from '@bahmni/services';
import type { BundleEntry, Reference } from 'fhir/r4';
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
  /** When set, the control only appears for these action types (e.g. ['delete'] for stopMedications) and is hidden in a plain consultation. */
  handledActionTypes?: ('create' | 'update' | 'delete')[];
  /** FHIR resource types this control is the target for when an action names a resource. */
  handledResourceTypes?: string[];
  /**
   * Narrows controls sharing a resource type by the target resource's status
   * (e.g. ['not-done'] for the immunization waiver). A control that declares
   * none is the generic target; an explicit match takes precedence over it.
   */
  handledResourceStatuses?: string[];
  inputControlConfig?: ClinicalInputControlConfig;
  component: React.ComponentType<{
    encounterSessionStartContext?: ConsultationEventPayload;
    inputControlConfig?: ClinicalInputControlConfig;
  }>;
  reset: () => void;
  validate: () => boolean;
  hasData: () => boolean;
  subscribe: (cb: () => void) => () => void;
  createBundleEntries?: (ctx: EncounterContext) => BundleEntry[];
  prepareBundleEntries?: () => Promise<void>;
  getSubmissionWarning?: () => { title: string; message: string } | undefined;
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
