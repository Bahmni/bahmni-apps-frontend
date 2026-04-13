/**
 * Privilege configuration for consultation pad controls
 * Each privilege key maps to an array of required OpenMRS privilege names
 * This array-based structure allows multiple privileges per feature and easy extensibility
 */
export const CONSULTATION_PAD_PRIVILEGES = {
  ENCOUNTER: ['Add Encounters'],
  ALLERGIES: ['Add Allergies'],
  CONDITIONS_AND_DIAGNOSES: ['Add Diagnoses'],
  INVESTIGATIONS: ['Add Orders'],
  MEDICATIONS: ['Add Orders'],
  OBSERVATIONS: ['Add Observations'],
  VACCINATIONS: ['Add Orders'],
};
