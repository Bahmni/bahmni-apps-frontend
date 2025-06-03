import { get } from './api';
import { PATIENT_ALLERGY_RESOURCE_URL } from '@constants/app';
import {
  FhirAllergyIntolerance,
  FhirAllergyIntoleranceBundle,
  FormattedAllergy,
} from '@types/allergy';
import { getFormattedError } from '@utils/common';
import notificationService from './notificationService';
import { searchFHIRConcepts } from './conceptService';
import { ALLERGEN_TYPES, ALLERGY_REACTION } from '@constants/concepts';
import { AllergenConcept, AllergenType } from '@types/concepts';
import { Coding } from 'fhir/r4';

interface RawAllergenConcepts {
  medication?: Coding[];
  food?: Coding[];
  environment?: Coding[];
}

/**
 * Extracts and formats allergen concepts from FHIR Concept data
 * @param concepts - FHIR Coding data
 * @param type - Allergen type identifier
 * @returns Formatted allergen concepts
 */
const extractSetMembers = (
  concepts: Coding[],
  type: AllergenType,
): AllergenConcept[] => {
  return concepts.map((concept) => ({
    uuid: concept.code || '',
    display: concept.display || '',
    type,
  }));
};

/**
 * Formats raw allergen concepts into a unified array with type information
 * @param rawConcepts - Object containing allergen concepts grouped by type
 * @returns Array of formatted allergen concepts with type information
 */
export const formatAllergenConcepts = (
  rawConcepts: RawAllergenConcepts,
): AllergenConcept[] => [
  ...extractSetMembers(
    rawConcepts.medication || [],
    ALLERGEN_TYPES.MEDICATION.display,
  ),
  ...extractSetMembers(rawConcepts.food || [], ALLERGEN_TYPES.FOOD.display),
  ...extractSetMembers(
    rawConcepts.environment || [],
    ALLERGEN_TYPES.ENVIRONMENT.display,
  ),
];

/**
 * Fetches and formats allergen concepts from FHIR ValueSets
 * @returns Promise resolving to an array of formatted allergen concepts
 */
/**
 * Fetches and formats allergen concepts from FHIR ValueSets
 * @param medicationUuid - Optional UUID for medication allergen concepts
 * @param foodUuid - Optional UUID for food allergen concepts
 * @param environmentUuid - Optional UUID for environment allergen concepts
 * @returns Promise resolving to an array of formatted allergen concepts
 */
export const fetchAndFormatAllergenConcepts = async (
  medicationUuid?: string,
  foodUuid?: string,
  environmentUuid?: string,
): Promise<AllergenConcept[]> => {
  // Use provided UUIDs or fallback to constants
  const medicationCode = medicationUuid || ALLERGEN_TYPES.MEDICATION.code;
  const foodCode = foodUuid || ALLERGEN_TYPES.FOOD.code;
  const environmentCode = environmentUuid || ALLERGEN_TYPES.ENVIRONMENT.code;

  // Get ValueSets for each allergen type
  const [medicationValueSet, foodValueSet, environmentValueSet] =
    await Promise.all([
      searchFHIRConcepts(medicationCode),
      searchFHIRConcepts(foodCode),
      searchFHIRConcepts(environmentCode),
    ]);

  // Extract concepts from the ValueSets
  const rawConcepts: RawAllergenConcepts = {
    medication: medicationValueSet.compose?.include[0]?.concept || [],
    food: foodValueSet.compose?.include[0]?.concept || [],
    environment: environmentValueSet.compose?.include[0]?.concept || [],
  };

  return formatAllergenConcepts(rawConcepts);
};

/**
 * Fetches and formats reaction concepts from FHIR ValueSet
 * @param reactionUuid - Optional UUID for reaction concepts
 * @returns Promise resolving to an array of formatted reaction concepts
 */
export const fetchReactionConcepts = async (
  reactionUuid?: string,
): Promise<Coding[]> => {
  const reactionCode = reactionUuid || ALLERGY_REACTION.code;
  const reactionValueSet = await searchFHIRConcepts(reactionCode);
  return reactionValueSet.compose?.include[0]?.concept || [];
};
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
      const allergySeverity = allergy.reaction?.[0]?.severity || 'Unknown';
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
        severity: allergySeverity,
        note: allergy.note?.map((note) => note.text),
      };
    });
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}
