import { Coding } from 'fhir/r4';
import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';
import type { AllergenType } from './models';

export const PATIENT_ALLERGY_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/AllergyIntolerance?patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;

/**
 * OpenMRS REST allergy endpoint. Pass allergyUUID to update an existing record.
 *
 * Needed because fhir2's AllergyIntoleranceTranslator never reads
 * `code.text`, so a free-text (non-coded) allergen cannot be saved over FHIR.
 */
export const PATIENT_ALLERGY_SAVE_URL = (
  patientUUID: string,
  allergyUUID?: string,
) =>
  OPENMRS_REST_V1 +
  `/patient/${patientUUID}/allergy` +
  (allergyUUID ? `/${allergyUUID}` : '');

/**
 * CIEL "Other, Non-Coded" concept uuid — used only as the default value
 * before `fetchOtherNonCodedAllergenUUID()` (allergyService.ts) resolves the
 * install's actual `allergy.concept.otherNonCoded` global property, or if
 * that fetch fails. Like the severity concept UUIDs below, this is
 * configurable per install, so it must not be treated as guaranteed stable —
 * `isNonCodedAllergen()` prefers the resolved value once available.
 */
export const OTHER_NON_CODED_ALLERGEN_UUID =
  '5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

/** Global property holding the install's actual Other, Non-Coded concept uuid. */
export const OTHER_NON_CODED_ALLERGEN_GLOBAL_PROPERTY =
  'allergy.concept.otherNonCoded';

/**
 * Global properties holding the OpenMRS severity concept UUID for each FHIR
 * severity code used in ALLERGY_SEVERITY_CONCEPTS. The REST allergy API needs
 * the concept UUID, not the FHIR code.
 *
 * These concept UUIDs are configurable per install (that's the whole point of
 * the global property), so they must be read from the backend rather than
 * hardcoded — see fetchAllergySeverityConceptUUIDs in allergyService.ts.
 */
export const ALLERGY_SEVERITY_GLOBAL_PROPERTY: Record<string, string> = {
  mild: 'allergy.concept.severity.mild',
  moderate: 'allergy.concept.severity.moderate',
  severe: 'allergy.concept.severity.severe',
};

export const ALLERGY_SEVERITY_CONCEPTS: Coding[] = [
  {
    code: 'mild',
    display: 'SEVERITY_MILD',
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
  },
  {
    code: 'moderate',
    display: 'SEVERITY_MODERATE',
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
  },
  {
    code: 'severe',
    display: 'SEVERITY_SEVERE',
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
  },
];

export const ALLERGEN_TYPES: Record<
  Uppercase<AllergenType>,
  {
    code: string;
    display: AllergenType;
    system: string;
  }
> = {
  FOOD: {
    code: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    display: 'food',
    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-type',
  },
  MEDICATION: {
    code: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    display: 'medication',
    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-type',
  },
  ENVIRONMENT: {
    code: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    display: 'environment',
    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-type',
  },
};

export const ALLERGY_REACTION = {
  code: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  display: 'reaction',
  system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-type',
};
