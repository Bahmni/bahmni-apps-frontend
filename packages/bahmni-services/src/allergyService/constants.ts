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
 * CIEL "Other, Non-Coded" concept — a member of the drug, food and environment
 * allergen sets, so it appears in the allergen search as "Other non-coded".
 * OpenMRS treats an allergy on it as non-coded and its AllergyValidator then
 * requires a free-text allergen name.
 *
 * Mirrors the backend global property `allergy.concept.otherNonCoded`.
 */
export const OTHER_NON_CODED_ALLERGEN_UUID =
  '5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

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
