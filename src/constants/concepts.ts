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
