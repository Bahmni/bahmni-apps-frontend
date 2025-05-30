import { Coding } from 'fhir/r4';
import { AllergenType } from '@types/concepts';

export const CERTAINITY_CONCEPTS: Coding[] = [
  {
    code: 'confirmed',
    display: 'CERTAINITY_CONFIRMED',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
  {
    code: 'provisional',
    display: 'CERTAINITY_PROVISIONAL',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
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

export const ALLERGY_REACTION: Coding = {
  code: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  display: 'reaction',
  system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-type',
};

export const ALLERGY_SEVERITY = {
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
};
