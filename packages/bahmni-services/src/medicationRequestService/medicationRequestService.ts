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
  PATIENT_MEDICATION_RESOURCE_URL_WITH_INCLUDE,
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
 * Fetches medications for a patient with optional Medication resource inclusion
 * @param patientUUID - Patient UUID
 * @param code - Optional medication codes to filter by
 * @param encounterUuids - Optional encounter UUIDs
 * @param includeRelated - Include related Medication resources (larger payload). Default: false
 * @returns Bundle containing medications
 */
export async function getPatientMedicationBundle(
  patientUUID: string,
  code?: string[],
  encounterUuids?: string[],
  includeRelated: boolean = false,
): Promise<Bundle> {
  let encounterUuidsString: string | undefined;

  if (encounterUuids && encounterUuids.length > 0) {
    encounterUuidsString = encounterUuids.join(',');
  }

  let codeString: string | undefined;
  if (code && code.length > 0) {
    codeString = code.join(',');
  }

  const urlBuilder = includeRelated
    ? PATIENT_MEDICATION_RESOURCE_URL_WITH_INCLUDE
    : PATIENT_MEDICATION_RESOURCE_URL;

  const url = urlBuilder(patientUUID, codeString, encounterUuidsString);
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
 * Helper to get medication name from multiple sources
 * Checks in order of preference:
 * 1. medicationReference.display (most direct)
 * 2. Medication resource from Bundle entries (via _include)
 * 3. Medication resource from contained array
 */
function getMedicationName(
  medicationReference: FhirMedicationRequest['medicationReference'],
  medicationRequest: FhirMedicationRequest,
  medicationMap: Map<string, Medication>,
): string {
  // First try the reference display
  if (medicationReference?.display) {
    return medicationReference.display;
  }

  // Try to find from Bundle entries (via _include)
  if (medicationReference?.reference) {
    const refId = medicationReference.reference.split('/').pop();
    if (refId) {
      const bundleMedication = medicationMap.get(refId);
      if (bundleMedication?.code?.text) {
        return bundleMedication.code.text;
      }
    }
  }

  // Try contained Medication resource
  const containedMedication = medicationRequest.contained?.find(
    (r) => r.resourceType === 'Medication',
  ) as Medication | undefined;

  if (containedMedication?.code?.text) {
    return containedMedication.code.text;
  }

  // Last resort - use reference ID if available
  if (medicationReference?.reference) {
    return medicationReference.reference;
  }

  return 'Medication';
}

/**
 * Helper to get dose form from referenced Medication resource
 * Checks three locations in order of preference:
 * 1. Medication resource included in Bundle (via _include parameter)
 * 2. Medication resource contained in MedicationRequest
 * 3. Form from medicationReference if available
 */
function getDoseFormFromReference(
  medicationReference: FhirMedicationRequest['medicationReference'],
  medicationRequest: FhirMedicationRequest,
  medicationMap: Map<string, Medication>,
): string {
  // Try to find the medication in the Bundle entries (from _include)
  if (medicationReference?.reference) {
    const refId = medicationReference.reference.split('/').pop();
    if (refId) {
      const bundleMedication = medicationMap.get(refId);
      if (bundleMedication?.form) {
        return (
          bundleMedication.form.text ??
          bundleMedication.form.coding?.[0]?.display ??
          ''
        );
      }
    }
  }

  // Fall back to contained Medication resource
  const containedMedication = medicationRequest.contained?.find(
    (r) => r.resourceType === 'Medication',
  ) as Medication | undefined;

  if (containedMedication?.form) {
    return (
      containedMedication.form.text ??
      containedMedication.form.coding?.[0]?.display ??
      ''
    );
  }

  return '';
}
/**
 * Formats FHIR medication requests into a more user-friendly format
 * @param bundle - The FHIR bundle containing medication requests
 * @returns An array of formatted medication objects
 */
function formatMedications(bundle: Bundle): MedicationRequest[] {
  // Extract ONLY MedicationRequest entries from the bundle
  // When using _include=MedicationRequest:medication, the Bundle also contains
  // Medication resources that should NOT be treated as MedicationRequests
  const medicationRequests =
    bundle.entry
      ?.filter((entry) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resource = entry.resource as any;
        return resource?.resourceType === 'MedicationRequest' && !!resource?.id;
      })
      .map((entry) => entry.resource as FhirMedicationRequest) ?? [];

  // Create a map of medications by ID for quick lookup (includes both entries and contained)
  const medicationMap = new Map<string, Medication>();
  bundle.entry?.forEach((entry) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resource = entry.resource as any;
    if (resource.resourceType === 'Medication') {
      medicationMap.set(resource.id, resource as Medication);
    }
  });

  return medicationRequests.map((medication) => {
    const medicationReference = medication.medicationReference;
    const medicationRequester = medication.requester;
    const status = mapMedicationStatus(medication);

    // Get medication name from multiple sources (reference, Bundle, or contained)
    const name = getMedicationName(
      medicationReference,
      medication,
      medicationMap,
    );

    // Get dose form from referenced medication or contained resources
    const doseForm = getDoseFormFromReference(
      medicationReference,
      medication,
      medicationMap,
    );

    return {
      id: medication.id!,
      name: name,
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
      orderedBy: medicationRequester?.display ?? 'Unknown',
      instructions: getInstructions(medication.dosageInstruction),
      additionalInstructions: getAdditionalInstructions(
        medication.dosageInstruction,
      ),
      note: getNote(medication.note),
      doseForm: doseForm,
      fhirResource: medication,
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
 * @param code - Optional medication codes to filter by
 * @param encounterUuids - Optional encounter UUIDs to filter by
 * @param includeRelated - If true, includes related Medication resources in the response.
 *                         WARNING: This increases payload size significantly.
 *                         Use only when medication details are needed immediately to avoid
 *                         redundant API calls. Default: false
 * @returns Promise resolving to an array of medications
 */
export async function getPatientMedications(
  patientUUID: string,
  code?: string[],
  encounterUuids?: string[],
  includeRelated: boolean = false,
): Promise<MedicationRequest[]> {
  const bundle = await getPatientMedicationBundle(
    patientUUID,
    code,
    encounterUuids,
    includeRelated,
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
