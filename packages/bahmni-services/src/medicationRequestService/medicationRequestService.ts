import {
  Bundle,
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';
import { get } from '../api';
import {
  MEDICATION_ORDERS_METADATA_URL,
  MEDICATIONS_SEARCH_URL,
  PATIENT_MEDICATION_RESOURCE_URL,
  VACCINES_URL,
} from './constants';
import {
  MedicationOrdersMetadataResponse,
  MedicationRequest,
  MedicationStatus,
} from './models';

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
export async function getPatientMedicationBundle(
  patientUUID: string,
  code?: string[],
  encounterUuids?: string[],
): Promise<Bundle> {
  let encounterUuidsString: string | undefined;

  if (encounterUuids && encounterUuids.length > 0) {
    encounterUuidsString = encounterUuids.join(',');
  }

  let codeString: string | undefined;
  if (code && code.length > 0) {
    codeString = code.join(',');
  }

  const url = PATIENT_MEDICATION_RESOURCE_URL(
    patientUUID,
    codeString,
    encounterUuidsString,
  );
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
  if (route && Array.isArray(route.coding) && route.coding[0]?.display) {
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
function getAdditionalInstructions(
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

/**
 * Helper to get notes
 */
function getInstructions(
  dosageInstruction: FhirMedicationRequest['dosageInstruction'],
): string {
  try {
    const text = dosageInstruction?.[0]?.text;
    if (!text) return '';
    const parsed = JSON.parse(text);
    return parsed.instructions ?? '';
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

function getNote(note: FhirMedicationRequest['note']): string {
  if (!note || note.length === 0) return '';
  // Join all note texts with a space separator
  return note
    .map((n) => n.text)
    .filter(Boolean)
    .join(' ');
}
/**
 * Formats FHIR medication requests into a more user-friendly format
 * @param bundle - The FHIR bundle containing medication requests
 * @returns An array of formatted medication objects
 */
function formatMedications(bundle: Bundle): MedicationRequest[] {
  // Extract medication requests from bundle entries
  const medications =
    bundle.entry?.map((entry) => entry.resource as FhirMedicationRequest) ?? [];

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
      isImmediate: isImmediateMedication(medication),
      quantity: getQuantity(medication.dispenseRequest!),
      startDate: isImmediateMedication(medication)
        ? medication.authoredOn!
        : (medication.dosageInstruction?.[0]?.timing?.event?.[0] ?? ''),
      orderDate: medication.authoredOn!,
      orderedBy: medicationRequester.display!,
      instructions: getInstructions(medication.dosageInstruction),
      additionalInstructions: getAdditionalInstructions(
        medication.dosageInstruction,
      ),
      note: getNote(medication.note),
    };
  });
}

const isImmediateMedication = (medication: FhirMedicationRequest): boolean => {
  return (
    medication.priority === 'stat' ||
    medication.dosageInstruction?.[0]?.timing?.code?.text === 'Immediately' ||
    false
  );
};

/**
 * Fetches and formats medications for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of medications
 */
export async function getPatientMedications(
  patientUUID: string,
  code?: string[],
  encounterUuids?: string[],
): Promise<MedicationRequest[]> {
  const bundle = await getPatientMedicationBundle(
    patientUUID,
    code,
    encounterUuids,
  );
  // TODO : Move formatting logic to widgets package
  return formatMedications(bundle);
}

/**
 * Fetches medication orders metadata including dose units, routes, duration units, etc.
 * @returns Promise resolving to medication orders metadata
 */
export async function fetchMedicationOrdersMetadata(): Promise<MedicationOrdersMetadataResponse> {
  return await get<MedicationOrdersMetadataResponse>(
    MEDICATION_ORDERS_METADATA_URL,
  );
}

/**
 * Searches for medications by search term
 * @param searchTerm - The term to search for in medication names
 * @param count - Maximum number of results to return (default: 20)
 * @returns Promise resolving to a Bundle containing medications
 */
export async function searchMedications(
  searchTerm: string,
  count: number = 20,
): Promise<Bundle<Medication>> {
  return await get<Bundle<Medication>>(
    MEDICATIONS_SEARCH_URL(searchTerm, count),
  );
}

/**
 * Fetches vaccines from the FHIR Medication endpoint filtered by CVX code system
 * @returns Promise resolving to a Bundle containing vaccine medications
 */
export async function getVaccinations(): Promise<Bundle<Medication>> {
  return await get<Bundle<Medication>>(VACCINES_URL);
}
