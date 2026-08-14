import type { AllergyInputEntry } from '../../models/allergy';

export interface EncounterSessionStartContext {
  encounterType?: string;
  preloadedAllergies?: AllergyInputEntry[];
  /** Input control key to show exclusively (+ encounterDetails). Aligns with BAH-4593 pattern. */
  editOnly?: string;
  /** Translation key for the ConsultationPad panel title when in edit mode. */
  editTitle?: string;
  /** UUID of the encounter being edited (used by edit flows for all input controls). */
  editEncounterUuid?: string;
  [key: string]: unknown;
}
