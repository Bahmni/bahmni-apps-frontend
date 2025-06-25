import { get } from './api';
import { PATIENT_MEDICATION_RESOURCE_URL } from '@constants/app';
import { MedicationRequest, MedicationStatus } from '@types/medicationRequest';
import { Bundle, MedicationRequest as FhirMedicationRequest } from 'fhir/r4';

/**
 * Maps FHIR medication request statuses to canonical MedicationStatus values
 */
const mapMedicationStatus = (
  medicationRequest: FhirMedicationRequest,
): MedicationStatus => {
  const status = medicationRequest.status;

  switch (status) {
    case 'active':
      return MedicationStatus.Active;
    case 'on-hold':
      return MedicationStatus.OnHold;
    case 'cancelled':
      return MedicationStatus.Cancelled;
    case 'completed':
      return MedicationStatus.Completed;
    case 'entered-in-error':
      return MedicationStatus.EnteredInError;
    case 'stopped':
      return MedicationStatus.Stopped;
    case 'draft':
      return MedicationStatus.Draft;
    case 'unknown':
      return MedicationStatus.Unknown;
  }
};

/**
 * Fetches medications for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing medications
 */
async function getPatientMedicationBundle(
  patientUUID: string,
): Promise<Bundle> {
  const url = PATIENT_MEDICATION_RESOURCE_URL(patientUUID);
  return await get<Bundle>(url);
}

/**
 * Helper to get dose
 */
function getDose(
  dosageInstruction: FhirMedicationRequest['dosageInstruction'],
): { value: number; unit: string } {
  const doseQuantity = dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity;
  return {
    value: doseQuantity?.value ?? 0,
    unit: doseQuantity?.unit ?? '',
  };
}

/**
 * Helper to get frequency
 */
function getFrequency(
  dosageInstruction: FhirMedicationRequest['dosageInstruction'],
): string {
  return dosageInstruction?.[0]?.timing?.code?.coding?.[0]?.display ?? '';
}

/**
 * Helper to get route
 */
function getRoute(
  dosageInstruction: FhirMedicationRequest['dosageInstruction'],
): string {
  const route = dosageInstruction?.[0]?.route;
  if (
    route &&
    Array.isArray(route.coding) &&
    route.coding[0] &&
    route.coding[0].display
  ) {
    return route.coding[0].display;
  }
  return '';
}

/**
 * Helper to get duration
 */
function getDuration(
  dosageInstruction: FhirMedicationRequest['dosageInstruction'],
): {
  duration: number;
  durationUnit: string;
} {
  const repeat = dosageInstruction?.[0]?.timing?.repeat;
  const durationUnit = repeat?.durationUnit;

  return {
    duration: repeat?.duration ?? 0,
    durationUnit: durationUnit ?? '',
  };
}

/**
 * Helper to get notes
 */
function getNotes(
  dosageInstruction: FhirMedicationRequest['dosageInstruction'],
): string {
  try {
    const text = dosageInstruction?.[0]?.text;
    if (!text) return '';
    const parsed = JSON.parse(text);
    return parsed.additionalInstructions ?? '';
  } catch {
    return '';
  }
}

function getQuantity(
  dispenseRequest: FhirMedicationRequest['dispenseRequest'],
) {
  const quantity = dispenseRequest?.quantity;
  return {
    value: quantity?.value ?? 0,
    unit: quantity?.unit ?? '',
  };
}
/**
 * Formats FHIR medication requests into a more user-friendly format
 * @param bundle - The FHIR bundle containing medication requests
 * @returns An array of formatted medication objects
 */
function formatMedications(bundle: Bundle): MedicationRequest[] {
  // Extract medication requests from bundle entries
  const medications =
    bundle.entry?.map((entry) => entry.resource as FhirMedicationRequest) || [];

  return medications.map((medication) => {
    const medicationReference = medication.medicationReference!;
    const medicationRequester = medication.requester!;

    const status = mapMedicationStatus(medication);

    return {
      id: medication.id!,
      name: medicationReference.display!,
      dose: getDose(medication.dosageInstruction),
      asNeeded: medication.dosageInstruction?.[0]?.asNeededBoolean ?? false,
      frequency: getFrequency(medication.dosageInstruction),
      route: getRoute(medication.dosageInstruction),
      duration: getDuration(medication.dosageInstruction),
      status,
      priority: medication.priority ?? '',
      isImmediate:
        medication.dosageInstruction?.[0]?.timing?.code?.text ===
          'Immediately' || false,
      quantity: getQuantity(medication.dispenseRequest!),
      startDate: medication.dispenseRequest!.validityPeriod!.start!,
      orderDate: medication.authoredOn!,
      orderedBy: medicationRequester.display!,
      notes: getNotes(medication.dosageInstruction),
    };
  });
}

/**
 * Fetches and formats medications for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of medications
 */
export async function getPatientMedications(
  patientUUID: string,
): Promise<MedicationRequest[]> {
  const bundle = await getPatientMedicationBundle(patientUUID);
  return formatMedications(bundle);
}
