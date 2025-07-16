import { Bundle, Medication } from 'fhir/r4';
import {
  MEDICATION_ORDERS_METADATA_URL,
  MEDICATIONS_SEARCH_URL,
} from '@constants/app';
import {
  FHIR_MEDICATION_EXTENSION_URL,
  FHIR_MEDICATION_NAME_EXTENSION_URL,
} from '@constants/fhir';
import { MedicationOrdersMetadataResponse } from '@types/medicationConfig';
import { get } from './api';

export async function fetchMedicationOrdersMetadata(): Promise<MedicationOrdersMetadataResponse> {
  return await get<MedicationOrdersMetadataResponse>(
    MEDICATION_ORDERS_METADATA_URL,
  );
}

export async function searchMedications(
  searchTerm: string,
  count: number = 20,
): Promise<Bundle<Medication>> {
  return await get<Bundle<Medication>>(
    MEDICATIONS_SEARCH_URL(searchTerm, count),
  );
}

export function getMedicationDisplay(medication: Medication): string {
  const medicationExtensions = medication.extension?.find(
    (ext) => ext.url === FHIR_MEDICATION_EXTENSION_URL,
  );

  const drugNameExtension = medicationExtensions?.extension?.find(
    (ext) => ext.url === FHIR_MEDICATION_NAME_EXTENSION_URL,
  );
  const medicationForm = medication.form?.text;

  let displayName = drugNameExtension?.valueString;
  if (displayName && medicationForm) {
    displayName += ` (${medicationForm})`;
  }
  return displayName ?? 'Unknown Medication Name';
}
