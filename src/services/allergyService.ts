import { get } from './api';
import { PATIENT_ALLERGY_RESOURCE_URL } from '@constants/app';
import {
  FhirAllergyIntolerance,
  FhirAllergyIntoleranceBundle,
  FormattedAllergy,
} from '@types/allergy';
import { getFormattedError } from '@utils/common';
import notificationService from './notificationService';

/**
 * Fetches allergies for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirAllergyIntoleranceBundle
 */
export async function getPatientAllergiesBundle(
  patientUUID: string,
): Promise<FhirAllergyIntoleranceBundle> {
  return await get<FhirAllergyIntoleranceBundle>(
    `${PATIENT_ALLERGY_RESOURCE_URL(patientUUID)}`,
  );
}

/**
 * Fetches and transforms allergies for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirAllergyIntolerance
 */
export async function getAllergies(
  patientUUID: string,
): Promise<FhirAllergyIntolerance[]> {
  try {
    const fhirAllergyBundle = await getPatientAllergiesBundle(patientUUID);
    return fhirAllergyBundle.entry?.map((entry) => entry.resource) || [];
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Formats a FHIR allergy into a more user-friendly format
 * @param allergies - The FHIR allergy array to format
 * @returns A formatted allergy object array
 */
export function formatAllergies(
  allergies: FhirAllergyIntolerance[],
): FormattedAllergy[] {
  try {
    return allergies.map((allergy) => {
      const status = allergy.clinicalStatus.coding[0]?.display || 'Unknown';

      return {
        id: allergy.id,
        display: allergy.code.text,
        category: allergy.category,
        criticality: allergy.criticality,
        status,
        recordedDate: allergy.recordedDate,
        recorder: allergy.recorder?.display,
        reactions: allergy.reaction?.map((reaction) => ({
          manifestation: reaction.manifestation.map(
            (manifestation) => manifestation.coding[0].display,
          ),
          severity: reaction.severity,
        })),
        note: allergy.note?.map((note) => note.text),
      };
    });
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}
