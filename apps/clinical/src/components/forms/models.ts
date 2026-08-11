import { type CDSCard } from '@bahmni/services';
import type { BundleEntry, Reference } from 'fhir/r4';
import type { EncounterSessionStartContext } from '../../events/startConsultation';
import type { InputControl as ClinicalInputControlConfig } from '../../providers/clinicalConfig/models';

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
  updateItemCDSCards?: (itemId: string, cards: CDSCard[]) => void;
  hasCriticalCDSCards?: () => boolean;
  /**
   * Optional direct submit handler. When present, the ConsultationPad calls this
   * instead of including the form's data in the consultation bundle.
   * Used for forms that call dedicated FHIR operations (e.g., $stop).
   */
  onDirectSubmit?: (encounterUuid?: string) => Promise<void>;
}

export interface EncounterContext {
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  consultationDate: Date;
  statDurationInMilliseconds?: number;
}
