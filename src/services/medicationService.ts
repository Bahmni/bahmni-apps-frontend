import { get } from './api';
import { PATIENT_MEDICATION_RESOURCE_URL } from '@constants/app';
import { FormattedMedication, MedicationStatus } from '@types/medication';
import { getFormattedError } from '@utils/common';
import notificationService from './notificationService';
import { Bundle, MedicationRequest, Medication, Practitioner } from 'fhir/r4';

/**
 * Maps a FHIR medication request status to MedicationStatus enum
 */
const mapMedicationStatus = (medicationRequest: MedicationRequest): MedicationStatus => {
  const status = medicationRequest.status;
  switch (status) {
    case 'active':
      return MedicationStatus.Active;
    case 'completed':
      return MedicationStatus.Completed;
    case 'stopped':
      return MedicationStatus.Stopped;
    case 'draft':
    case 'on-hold':
      return MedicationStatus.Scheduled;
    default:
      return MedicationStatus.Scheduled;
  }
};

/**
 * Fetches medications for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing medications
 */
async function getPatientMedicationBundle(patientUUID: string): Promise<Bundle> {
  const url = PATIENT_MEDICATION_RESOURCE_URL(patientUUID);
  return await get<Bundle>(url);
}

/**
 * Builds a map of referenced resources from the bundle
 */
function buildResourceMap(bundle: Bundle) {
  const map: { [reference: string]: any } = {};
  (bundle.entry || []).forEach((entry) => {
    if (entry.resource && entry.resource.resourceType && (entry.resource as any).id) {
      map[`${entry.resource.resourceType}/${(entry.resource as any).id}`] = entry.resource;
    }
  });
  return map;
}

/**
 * Helper to get drug form from Medication resource
 */
function getDrugForm(medicationResource?: Medication): string {
  return (
    medicationResource?.form?.coding?.[0]?.display ||
    medicationResource?.form?.text ||
    ''
  );
}

/**
 * Helper to get provider name from Practitioner resource
 */
function getProviderName(practitionerResource?: Practitioner): string {
  if (!practitionerResource) return '';
  if (practitionerResource.name && practitionerResource.name.length > 0) {
    const name = practitionerResource.name[0];
    return (
      name.text ||
      [name.given?.join(' '), name.family].filter(Boolean).join(' ')
    );
  }
  return '';
}

/**
 * Helper to get dose
 */
function getDose(dosageInstruction?: MedicationRequest['dosageInstruction']): string {
  const dose = dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity;
  if (dose?.value && dose?.unit) return `${dose.value} ${dose.unit}`;
  if (dose?.value) return `${dose.value}`;
  return '';
}

/**
 * Helper to get frequency
 */
function getFrequency(dosageInstruction?: MedicationRequest['dosageInstruction']): string {
  const repeat = dosageInstruction?.[0]?.timing?.repeat;
  if (repeat?.frequency && repeat?.period && repeat?.periodUnit) {
    return `${repeat.frequency} / ${repeat.period}${repeat.periodUnit}`;
  }
  return dosageInstruction?.[0]?.text || '';
}

/**
 * Helper to get route
 */
function getRoute(dosageInstruction?: MedicationRequest['dosageInstruction']): string {
  const route = dosageInstruction?.[0]?.route;
  if (route?.text) return route.text;
  if (route?.coding?.[0]?.display) return route.coding[0].display;
  return '';
}

/**
 * Helper to get duration
 */
function getDuration(med: MedicationRequest): string {
  const duration = med.dispenseRequest?.expectedSupplyDuration;
  if (duration?.value && duration?.unit) return `${duration.value} ${duration.unit}`;
  return '';
}

/**
 * Helper to get priority
 */
function getPriority(dosageInstruction?: MedicationRequest['dosageInstruction']): string {
  const ext = dosageInstruction?.[0]?.extension;
  if (!ext) return '';
  if (ext.find((e: any) => e.valueCode === 'STAT')) return 'STAT';
  if (ext.find((e: any) => e.valueCode === 'PRN')) return 'PRN';
  return '';
}

/**
 * Helper to get notes
 */
function getNotes(med: MedicationRequest): string {
  if (med.note && med.note.length) return med.note.map(n => n.text).join('; ');
  return '';
}

/**
 * Helper to check if medication is active
 */
function isActive(status: MedicationStatus): boolean {
  return status === MedicationStatus.Active;
}

/**
 * Helper to check if medication is scheduled
 */
function isScheduled(status: MedicationStatus): boolean {
  return status === MedicationStatus.Scheduled;
}

/**
 * Validates that a medication request has all required fields
 * @param medication - The FHIR MedicationRequest resource to validate
 * @returns true if valid, false otherwise
 */
const isValidMedication = (medication: MedicationRequest): boolean => {
  return !!(medication.id && medication.status);
};

/**
 * Formats FHIR medication requests into a more user-friendly format
 * @param bundle - The FHIR bundle containing medication requests
 * @returns An array of formatted medication objects
 */
function formatMedications(bundle: Bundle): FormattedMedication[] {
  try {
    // Extract medication requests from bundle entries
    const medications =
      bundle.entry
        ?.filter((entry) => entry.resource?.resourceType === 'MedicationRequest')
        .map((entry) => entry.resource as MedicationRequest) || [];

    const resourceMap = buildResourceMap(bundle);

    return medications.map((med) => {
      if (!isValidMedication(med)) {
        throw new Error('Incomplete medication data');
      }

      const medicationResource = (med.medicationReference as any)?.reference
        ? resourceMap[(med.medicationReference as any).reference]
        : undefined;
      const practitionerResource = med.requester?.reference
        ? resourceMap[med.requester.reference]
        : undefined;

      const status = mapMedicationStatus(med);

      return {
        id: med.id as string,
        name: (med.medicationReference as any)?.display ?? '',
        form: getDrugForm(medicationResource),
        dose: getDose(med.dosageInstruction),
        frequency: getFrequency(med.dosageInstruction),
        route: getRoute(med.dosageInstruction),
        duration: getDuration(med),
        status,
        priority: getPriority(med.dosageInstruction),
        startDate: med.dispenseRequest?.validityPeriod?.start ?? '',
        orderDate: med.authoredOn ?? '',
        orderedBy: getProviderName(practitionerResource) || med.requester?.display || '',
        notes: getNotes(med),
        isActive: isActive(status),
        isScheduled: isScheduled(status),
      };
    });
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Fetches and formats medications for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of medications
 */
export async function getPatientMedications(patientUUID: string): Promise<FormattedMedication[]> {
  try {
    const bundle = await getPatientMedicationBundle(patientUUID);
    return formatMedications(bundle);
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}
