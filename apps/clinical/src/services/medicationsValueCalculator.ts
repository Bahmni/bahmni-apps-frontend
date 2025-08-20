import { Medication } from 'fhir/r4';
import { Concept } from '../models/encounterConcepts';
import { DurationUnitOption } from '../models/medication';
import { DrugFormDefault, Frequency } from '../models/medicationConfig';

export const getDefaultRoute = (
  medication: Medication,
  drugFormDefaults: Record<string, DrugFormDefault>,
  routes: Concept[],
): Concept | undefined => {
  const drugForm = getDrugFormName(medication);
  if (!drugForm) {
    return undefined;
  }
  const routeName = drugFormDefaults[drugForm]?.route;
  if (!routeName) {
    return undefined;
  }
  return routes.find((route) => route.name === routeName);
};

export const getDefaultDosingUnit = (
  medication: Medication,
  drugFormDefaults: Record<string, DrugFormDefault>,
  dosingUnits: Concept[],
): Concept | undefined => {
  const drugForm = getDrugFormName(medication);
  if (!drugForm) {
    return undefined;
  }
  const dosingUnitName = drugFormDefaults[drugForm]?.doseUnits;
  if (!dosingUnitName) {
    return undefined;
  }
  return dosingUnits.find((unit) => unit.name === dosingUnitName);
};

export const calculateTotalQuantity = (
  dosage: number,
  frequency: Frequency | null,
  duration: number,
  durationUnit: DurationUnitOption | null,
): number => {
  if (frequency && isImmediateFrequency(frequency)) {
    return dosage;
  } else if (
    dosage <= 0 ||
    duration <= 0 ||
    !durationUnit ||
    !frequency?.frequencyPerDay ||
    frequency.frequencyPerDay === 0
  ) {
    return 0;
  }
  const frequencyMultiplier = frequency.frequencyPerDay;
  const durationMultiplier = duration * durationUnit.daysMultiplier;
  const result = Math.ceil(dosage * frequencyMultiplier * durationMultiplier);
  return result !== 0 && result < dosage ? dosage : result;
};

const getDrugFormName = (medication: Medication): string | undefined => {
  const medicationForm = medication?.form;
  if (!medicationForm?.text) {
    return undefined;
  }
  return medicationForm.text;
};

export const isImmediateFrequency = (frequency: Frequency): boolean => {
  return frequency.uuid === '0';
};
