import {
  Bundle,
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';
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

export interface ActiveMedicationBundleResult {
  activeMedications: FhirMedicationRequest[];
  medicationMap: Record<string, Medication>;
}

/**
 * Extract active/on-hold MedicationRequest entries and build a Medication
 * lookup map from a FHIR Bundle that uses _include to embed Medication resources.
 */
export function getActiveMedicationsFromBundle(
  bundle: Bundle | undefined,
): ActiveMedicationBundleResult {
  if (!bundle) return { activeMedications: [], medicationMap: {} };

  const requests: FhirMedicationRequest[] = [];
  const medications: Record<string, Medication> = {};

  if (bundle.entry && Array.isArray(bundle.entry)) {
    bundle.entry.forEach((entry) => {
      if (!entry?.resource) return;

      if (entry.resource.resourceType === 'MedicationRequest') {
        const med = entry.resource as FhirMedicationRequest;
        const status = med.status?.toLowerCase();
        if (status === 'active' || status === 'on-hold') {
          requests.push(med);
        }
      } else if (entry.resource.resourceType === 'Medication') {
        if (entry.resource.id) {
          medications[entry.resource.id] = entry.resource as Medication;
        }
      }
    });
  }

  return { activeMedications: requests, medicationMap: medications };
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
