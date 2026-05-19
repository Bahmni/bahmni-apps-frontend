/**
 * Privilege configuration for consultation pad controls
 * Each privilege key maps to an array of required OpenMRS privilege names
 * This array-based structure allows multiple privileges per feature and easy extensibility
 */
export const CONSULTATION_PAD_PRIVILEGES = {
  ENCOUNTER: ['Add Encounters'],
  ALLERGIES: ['Add Allergies'],
  /**
   * BAH-4652: Gates the Edit button on BOTH the Allergies and Conditions
   * display widgets (single privilege per the locked decision in the
   * BAH-4652 discovery doc).
   */
  EDIT_ALLERGIES: ['Edit Allergies'],
  CONDITIONS_AND_DIAGNOSES: ['Add Diagnoses'],
  INVESTIGATIONS: ['Add Orders'],
  MEDICATIONS: ['Add Orders'],
  OBSERVATIONS: ['Add Observations'],
  VACCINATIONS: ['Add Orders'],
};
