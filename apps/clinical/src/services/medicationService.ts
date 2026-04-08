import { Bundle, Medication } from 'fhir/r4';
import {
  FHIR_MEDICATION_EXTENSION_URL,
  FHIR_MEDICATION_NAME_EXTENSION_URL,
} from '../constants/fhir';

export function getMedicationsFromBundle(
  bundle: Bundle<Medication>,
): Medication[] {
  const medications: Medication[] = [];
  bundle.entry?.map((entry) => {
    if (entry.resource) {
      medications.push(entry.resource);
    }
  });
  return medications;
}

export function getMedicationDisplay(medication: Medication): string {
  const medicationExtensions = medication.extension?.find(
    (ext) => ext.url === FHIR_MEDICATION_EXTENSION_URL,
  );
  const codeName = medication.code?.text;
  const drugNameExtension = medicationExtensions?.extension?.find(
    (ext) => ext.url === FHIR_MEDICATION_NAME_EXTENSION_URL,
  );
  const medicationForm = medication.form?.text;

  let displayName = drugNameExtension?.valueString;
  if (displayName && medicationForm) {
    displayName += ` (${medicationForm})` + `- ${codeName}`;
  }
  return displayName ?? 'Unknown Medication Name';
}
