import type { AllergyInputEntry } from '../../models/allergy';

export interface EncounterSessionStartContext {
  encounterType?: string;
  preloadedAllergies?: AllergyInputEntry[];
  /** Input control key to show exclusively (+ encounterDetails). Aligns with BAH-4593 pattern. */
  editOnly?: string;
  /** Translation key for the ConsultationPad panel title when in edit mode. */
  editTitle?: string;
  [key: string]: unknown;
}
