/**
 * Privilege configuration for consultation pad controls
 * Each privilege key maps to an array of required OpenMRS privilege names
 * This array-based structure allows multiple privileges per feature and easy extensibility
 */
export const CONSULTATION_PAD_PRIVILEGES = {
  ADD_VISITS: ['Add Visits'],
  ENCOUNTER: ['Add Encounters'],
  ALLERGIES: ['Add Allergies'],
  EDIT_ALLERGIES: ['Edit Allergies'],
  EDIT_OBSERVATIONS: ['Edit Observations'],
  CONDITIONS_AND_DIAGNOSES: ['Add Diagnoses'],
  INVESTIGATIONS: ['Add Orders'],
  MEDICATIONS: ['Add Orders'],
  OBSERVATIONS: ['Add Observations'],
  VACCINATIONS: ['Add Orders'],
};
