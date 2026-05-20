import type { AllergyInputEntry } from '../../models/allergy';

export interface EncounterSessionStartContext {
  encounterType?: string;
  preloadedAllergies?: AllergyInputEntry[];
  /** When set, ConsultationPad shows ONLY these input control keys (plus encounterDetails). */
  activeForms?: string[];
  [key: string]: unknown;
}
