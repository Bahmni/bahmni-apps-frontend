import { resolveComboBoxItems } from '@bahmni/services';
import { BundleEntry, Medication, Reference } from 'fhir/r4';
import {
  MedicationFilterResult,
  MedicationInputEntry,
} from '../../../models/medication';
import { getMedicationDisplay } from '../../../services/medicationService';
import { createBundleEntry } from '../../../utils/fhir/consultationBundleCreator';
import { createMedicationRequestResource } from '../../../utils/fhir/medicationRequestResourceCreator';
import {
  createEncounterReferenceFromString,
  createPractitionerReference,
} from '../../../utils/fhir/referenceCreator';

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
