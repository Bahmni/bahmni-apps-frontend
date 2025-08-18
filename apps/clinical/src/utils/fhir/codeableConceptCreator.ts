import { CodeableConcept, Coding } from 'fhir/r4';
import { isStringEmpty } from '@bahmni-frontend/bahmni-services';

export const createCodeableConcept = (
  coding?: Coding[],
  displayText?: string,
): CodeableConcept => {
  const concept: CodeableConcept = {
    coding: coding,
  };
  if (!isStringEmpty(displayText)) {
    concept.text = displayText;
  }
  return concept;
};

export const createCoding = (
  code: string,
  systemURL?: string,
  display?: string,
): Coding => {
  const coding: Coding = {
    code: code,
  };
  if (!isStringEmpty(systemURL)) {
    coding.system = systemURL;
  }
  if (!isStringEmpty(display)) {
    coding.display = display;
  }

  return coding;
};
