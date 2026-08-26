import type { Encounter } from 'fhir/r4';
import type { AllergyInputEntry } from '../../models/allergy';

export interface EncounterSessionStartContext {
  encounterType?: string;
  preloadedAllergies?: AllergyInputEntry[];
  /** Input control key to show exclusively (+ encounterDetails). Aligns with BAH-4593 pattern. */
  editOnly?: string;
  /** Translation key for the ConsultationPad panel title when in edit mode. */
  editTitle?: string;
  /** Source encounter UUID for edit or copyover flows. */
  sourceEncounterUuid?: string;
  activeEncounter?: Encounter | null;
  [key: string]: unknown;
}
