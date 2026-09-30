import type { AllergyIntolerance, Bundle, Coding, ValueSet } from 'fhir/r4';
import { get, post } from '../api';
import { APP_PROPERTY_URL } from '../applicationConfigService/constants';
import { searchFHIRConcepts } from '../conceptService';
import {
  PATIENT_ALLERGY_RESOURCE_URL,
  PATIENT_ALLERGY_SAVE_URL,
  ALLERGEN_TYPES,
  ALLERGY_REACTION,
  ALLERGY_SEVERITY_GLOBAL_PROPERTY,
} from './constants';
import {
  AllergenConcept,
  AllergenType,
  FormattedAllergy,
  SaveAllergyRequest,
  SaveAllergyResponse,
} from './models';

/**
 * Extended Coding interface to include inactive property
 */
interface ExtendedCoding extends Coding {
  inactive?: boolean;
}

/**
 * Filters out inactive concepts from FHIR Coding array
 * @param concepts - Array of FHIR Coding objects
 * @returns Filtered array with only active concepts
 */
const filterInactiveConcepts = (
  concepts: ExtendedCoding[],
): ExtendedCoding[] => {
  return concepts.filter((concept) => concept.inactive !== true);
};

/**
 * Maps a FHIR Coding to AllergenConcept with specified type
 * @param concept - FHIR Coding object
 * @param type - Allergen type
 * @returns AllergenConcept object
 */
const mapToAllergenConcept = (
  concept: ExtendedCoding,
  type: AllergenType,
): AllergenConcept => ({
  uuid: concept.code ?? '',
  display: concept.display ?? '',
  type,
});

/**
 * Extracts and formats allergen concepts from ValueSet expansion
 * @param valueSet - FHIR ValueSet
 * @param type - Allergen type
 * @returns Array of formatted allergen concepts
 */
const extractAllergenConceptsFromValueSet = (
  valueSet: ValueSet,
  type: AllergenType,
): AllergenConcept[] => {
  const concepts = (valueSet.expansion?.contains ?? []) as ExtendedCoding[];
  const filteredConcepts = filterInactiveConcepts(concepts);
  return filteredConcepts.map((concept) => mapToAllergenConcept(concept, type));
};

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
  const medicationCode = medicationUuid ?? ALLERGEN_TYPES.MEDICATION.code;
  const foodCode = foodUuid ?? ALLERGEN_TYPES.FOOD.code;
  const environmentCode = environmentUuid ?? ALLERGEN_TYPES.ENVIRONMENT.code;

  // Get ValueSets for each allergen type
  const [medicationValueSet, foodValueSet, environmentValueSet] =
    await Promise.all([
      searchFHIRConcepts(medicationCode),
      searchFHIRConcepts(foodCode),
      searchFHIRConcepts(environmentCode),
    ]);

  // Extract and combine all allergen concepts
  return [
    ...extractAllergenConceptsFromValueSet(
      medicationValueSet,
      ALLERGEN_TYPES.MEDICATION.display,
    ),
    ...extractAllergenConceptsFromValueSet(
      foodValueSet,
      ALLERGEN_TYPES.FOOD.display,
    ),
    ...extractAllergenConceptsFromValueSet(
      environmentValueSet,
      ALLERGEN_TYPES.ENVIRONMENT.display,
    ),
  ];
};

/**
 * Fetches and formats reaction concepts from FHIR ValueSet
 * @param reactionUuid - Optional UUID for reaction concepts
 * @returns Promise resolving to an array of formatted reaction concepts
 */
export const fetchReactionConcepts = async (
  reactionUuid?: string,
): Promise<Coding[]> => {
  const reactionCode = reactionUuid ?? ALLERGY_REACTION.code;
  const reactionValueSet = await searchFHIRConcepts(reactionCode);
  return reactionValueSet.compose?.include[0]?.concept ?? [];
};
/**
 * Fetches allergies for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle
 */
export async function getPatientAllergiesBundle(
  patientUUID: string,
): Promise<Bundle> {
  return await get<Bundle>(`${PATIENT_ALLERGY_RESOURCE_URL(patientUUID)}`);
}

/**
 * Fetches and transforms allergies for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of AllergyIntolerance
 */
export async function getAllergies(
  patientUUID: string,
): Promise<AllergyIntolerance[]> {
  const fhirAllergyBundle = await getPatientAllergiesBundle(patientUUID);
  return (
    fhirAllergyBundle.entry?.map(
      (entry) => entry.resource as AllergyIntolerance,
    ) ?? []
  );
}

/**
 * Formats a FHIR allergy into a more user-friendly format
 * @param allergies - The FHIR allergy array to format
 * @returns A formatted allergy object array
 */
export function formatAllergies(
  allergies: AllergyIntolerance[],
): FormattedAllergy[] {
  return allergies.map((allergy) => {
    const statusDisplay =
      allergy.clinicalStatus?.coding?.[0]?.display ?? 'Unknown';
    const allergySeverity = allergy.reaction?.[0]?.severity ?? 'Unknown';

    // The FHIR resource id is unique per record; the allergen concept code
    // is not — every "Other, Non-Coded" allergy shares the same concept uuid,
    // so using it as `id` collapses those rows together wherever `id` is used
    // as a table/React key (SortableDataTable keys and maps rows by `id`).
    const conceptCode = allergy.code?.coding?.[0]?.code ?? 'unknown';

    return {
      id: allergy.id ?? conceptCode,
      resourceId: allergy.id,
      display: allergy.code?.text ?? '',
      category: allergy.category,
      criticality: allergy.criticality,
      status: statusDisplay,
      recordedDate: allergy.recordedDate!,
      recorder: allergy.recorder?.display,
      reactions: allergy.reaction?.map((reaction) => {
        // Deduplicate manifestation entries by text to prevent backend-appended
        // duplicates from showing multiple times in the AllergiesTable display.
        const seenTexts = new Set<string>();
        const unique = reaction.manifestation.filter((m) => {
          const key = m.text ?? m.coding?.[0]?.display ?? '';
          if (!key || seenTexts.has(key)) return false;
          seenTexts.add(key);
          return true;
        });
        return {
          manifestation: unique.map((m) => m.text ?? ''),
          manifestationCodings: unique.flatMap((m) => m.coding ?? []),
          severity: reaction.severity,
        };
      }),
      severity: allergySeverity,
      note: allergy.note?.map((note) => note.text),
    } as FormattedAllergy;
  });
}

/**
 * Fetches and formats allergies for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FormattedAllergy
 */
export async function getFormattedAllergies(
  patientUUID: string,
): Promise<FormattedAllergy[]> {
  const allergies = await getAllergies(patientUUID);
  return formatAllergies(allergies);
}

let severityConceptUUIDCache: Record<string, string> | null = null;

/**
 * Resolves the OpenMRS severity concept UUIDs for mild/moderate/severe from
 * this install's `allergy.concept.severity.*` global properties.
 *
 * These are configurable per install, so they must be read from the backend
 * rather than hardcoded — a hardcoded UUID that doesn't exist in a given
 * install's dictionary makes the REST allergy API reject the save with a 400
 * (ConversionException), not a graceful fallback.
 */
export async function fetchAllergySeverityConceptUUIDs(): Promise<
  Record<string, string>
> {
  if (severityConceptUUIDCache) return severityConceptUUIDCache;

  const entries = await Promise.all(
    Object.entries(ALLERGY_SEVERITY_GLOBAL_PROPERTY).map(
      async ([severityCode, property]) => {
        const uuid = await get<string>(APP_PROPERTY_URL(property));
        if (!uuid) {
          throw new Error('ALLERGY_SEVERITY_CONCEPT_MISSING');
        }
        return [severityCode, uuid] as const;
      },
    ),
  );

  severityConceptUUIDCache = Object.fromEntries(entries);
  return severityConceptUUIDCache;
}

/**
 * Saves an allergy through the OpenMRS REST allergy API.
 *
 * Used for allergies on the Other, Non-Coded concept: they need a free-text
 * `nonCodedAllergen`, which fhir2's translator never reads from the FHIR
 * resource, so the EncounterBundle path cannot persist them.
 *
 * @param patientUUID - The UUID of the patient
 * @param allergy - The allergy payload in OpenMRS REST format
 * @param allergyUUID - Existing allergy UUID; updates in place when given
 */
export async function saveAllergy(
  patientUUID: string,
  allergy: SaveAllergyRequest,
  allergyUUID?: string,
): Promise<SaveAllergyResponse> {
  return await post<SaveAllergyResponse>(
    PATIENT_ALLERGY_SAVE_URL(patientUUID, allergyUUID),
    allergy,
  );
}
