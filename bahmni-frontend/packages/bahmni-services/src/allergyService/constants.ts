import { OPENMRS_FHIR_R4 } from '../constants/app';
import { Coding } from 'fhir/r4';
import { AllergenType } from './models';

export const PATIENT_ALLERGY_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/AllergyIntolerance?patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;

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
