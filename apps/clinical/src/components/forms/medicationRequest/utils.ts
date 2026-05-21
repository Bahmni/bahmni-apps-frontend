import {
  resolveComboBoxItems,
  MedicationFrequency as Frequency,
} from '@bahmni/services';
import { BundleEntry, Medication, Reference } from 'fhir/r4';
import { Concept } from '../../../models/encounterConcepts';
import {
  DurationUnitOption,
  MedicationFilterResult,
  MedicationInputEntry,
} from '../../../models/medication';
import {
  DrugFormDefault,
  MedicationConfig,
} from '../../../models/medicationConfig';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import { getMedicationDisplay } from '../../../services/medicationService';
import { createBundleEntry } from '../../../utils/fhir/consultationBundleCreator';
import { createMedicationRequestResource } from '../../../utils/fhir/medicationRequestResourceCreator';
import {
  createEncounterReferenceFromString,
  createPractitionerReference,
} from '../../../utils/fhir/referenceCreator';
import { DURATION_UNIT_OPTIONS } from './constants';

export function findAttr(
  name: string,
  attributes: InputControlAttributes[] | undefined,
): InputControlAttributes | undefined {
  return attributes?.find((a) => a.name === name);
}

export function applyDefaultInstruction(
  attributes: InputControlAttributes[],
  medicationConfig: MedicationConfig,
  instruction: Concept | null | undefined,
  id: string,
  updateInstruction: (id: string, value: Concept) => void,
): void {
  const defaultValue = findAttr('instruction', attributes)?.default;
  if (!medicationConfig?.dosingInstructions?.length || !defaultValue) {
    return;
  }
  if (!instruction) {
    const defaultInstruction = medicationConfig.dosingInstructions.find(
      (item) => item.name === defaultValue,
    );
    if (defaultInstruction) {
      updateInstruction(id, defaultInstruction);
    }
  }
}

export function applyDefaultDurationUnit(
  attributes: InputControlAttributes[],
  durationUnit: DurationUnitOption | null | undefined,
  id: string,
  updateDurationUnit: (id: string, value: DurationUnitOption | null) => void,
): void {
  const defaultValue = findAttr('durationUnit', attributes)?.default;
  if (!defaultValue) {
    return;
  }
  if (!durationUnit) {
    const defaultDurationUnit = DURATION_UNIT_OPTIONS.find(
      (item) => item.code === defaultValue,
    );
    if (defaultDurationUnit) {
      updateDurationUnit(id, defaultDurationUnit);
    }
  }
}

export function applyDefaultDosage(
  attributes: InputControlAttributes[],
  dosage: number,
  id: string,
  updateDosage: (id: string, value: number) => void,
): void {
  const defaultValue = findAttr('dosage', attributes)?.default;
  if (defaultValue === undefined || dosage !== 0) return;
  updateDosage(id, Number(defaultValue));
}

export function applyDefaultFrequency(
  attributes: InputControlAttributes[],
  medicationConfig: MedicationConfig,
  frequency: Frequency | null | undefined,
  id: string,
  updateFrequency: (id: string, value: Frequency | null) => void,
): void {
  const defaultValue = findAttr('frequency', attributes)?.default;
  if (!medicationConfig?.frequencies?.length || !defaultValue || frequency)
    return;
  const defaultFrequency = medicationConfig.frequencies.find(
    (item) => item.name === defaultValue && !isImmediateFrequency(item),
  );
  if (defaultFrequency) updateFrequency(id, defaultFrequency);
}

const toSentinel = (message: string): MedicationFilterResult => ({
  displayName: message,
  disabled: false,
});

export function getMedicationRequestComboBoxItems(
  searchTerm: string,
  medicationResults: Medication[] | undefined,
  isLoading: boolean,
  isError: boolean,
  messages: { loading: string; error: string; empty: string },
): MedicationFilterResult[] {
  if (!searchTerm.trim()) return [];
  const items = (medicationResults ?? []).map((item) => ({
    medication: item,
    displayName: getMedicationDisplay(item),
    disabled: false,
  }));
  return resolveComboBoxItems(isLoading, isError, items, toSentinel, messages);
}

export function getVaccinationComboBoxItems(
  searchTerm: string,
  vaccinationResults: Medication[],
  isLoading: boolean,
  isError: boolean,
  messages: { loading: string; error: string; empty: string },
): MedicationFilterResult[] {
  if (!searchTerm.trim()) return [];
  const filtered = vaccinationResults
    .filter((item) =>
      getMedicationDisplay(item)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    )
    .map((item) => ({
      medication: item,
      displayName: getMedicationDisplay(item),
      disabled: false,
    }));
  return resolveComboBoxItems(
    isLoading,
    isError,
    filtered,
    toSentinel,
    messages,
  );
}

export interface CreateMedicationRequestBundleEntriesParams {
  selectedMedicationRequests: MedicationInputEntry[];
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  statDurationInMilliseconds?: number;
}

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

export function createMedicationRequestEntries({
  selectedMedicationRequests,
  encounterSubject,
  encounterReference,
  practitionerUUID,
  statDurationInMilliseconds,
}: CreateMedicationRequestBundleEntriesParams): BundleEntry[] {
  const medicationRequestEntries: BundleEntry[] = [];
  for (const medication of selectedMedicationRequests) {
    const medicationResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const medicationResource = createMedicationRequestResource(
      medication,
      encounterSubject,
      createEncounterReferenceFromString(encounterReference),
      createPractitionerReference(practitionerUUID),
      statDurationInMilliseconds,
    );

    const medicationRequestEntry = createBundleEntry(
      medicationResourceURL,
      medicationResource,
      'POST',
    );

    medicationRequestEntries.push(medicationRequestEntry);
  }
  return medicationRequestEntries;
}
