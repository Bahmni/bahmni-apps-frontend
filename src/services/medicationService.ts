import { MEDICATION_RESOURCE_URL } from '@constants/app';
import { MedicationOrder , FhirMedicationRequest} from '@types/medication';
import { Bundle } from 'fhir/r4';
import { get } from './api';
// import or define FhirMedicationRequest if needed 

/** Fetches the FHIR MedicationRequest bundle for a patient */
async function getPatientMedicationBundle(patientUuid: string): Promise<Bundle> {
  const url = MEDICATION_RESOURCE_URL(patientUuid);
  return await get<Bundle>(url);
}

/** Builds a map of referenced resources from the bundle */
function buildResourceMap(bundle: any) {
  const map: { [reference: string]: any } = {};
  (bundle.entry || []).forEach((entry: any) => {
    if (entry.resource && entry.resource.resourceType && entry.resource.id) {
      map[`${entry.resource.resourceType}/${entry.resource.id}`] = entry.resource;
    }
  });
  return map;
}

/** Helper to get drug form from Medication resource */
function getDrugForm(medicationResource?: any): string {
  return (
    medicationResource?.form?.coding?.[0]?.display ||
    medicationResource?.form?.text ||
    ''
  );
}

/** Helper to get provider name from Practitioner resource */
function getProviderName(practitionerResource?: any): string {
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

function getDose(dosageInstruction?: any[]): string {
  const dose = dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity;
  if (dose?.value && dose?.unit) return `${dose.value} ${dose.unit}`;
  if (dose?.value) return `${dose.value}`;
  return '';
}

function getFrequency(dosageInstruction?: any[]): string {
  const repeat = dosageInstruction?.[0]?.timing?.repeat;
  if (repeat?.frequency && repeat?.period && repeat?.periodUnit) {
    return `${repeat.frequency} / ${repeat.period}${repeat.periodUnit}`;
  }
  return dosageInstruction?.[0]?.text || '';
}

function getRoute(dosageInstruction?: any[]): string {
  const route = dosageInstruction?.[0]?.route;
  if (route?.text) return route.text;
  if (route?.coding?.[0]?.display) return route.coding[0].display;
  return '';
}

function getDuration(med: FhirMedicationRequest): string {
  const duration = med.dispenseRequest?.expectedSupplyDuration;
  if (duration?.value && duration?.unit) return `${duration.value} ${duration.unit}`;
  return '';
}

function getPriority(dosageInstruction?: any[]): string {
  const ext = dosageInstruction?.[0]?.extension;
  if (!ext) return '';
  if (ext.find((e: any) => e.valueCode === 'STAT')) return 'STAT';
  if (ext.find((e: any) => e.valueCode === 'PRN')) return 'PRN';
  return '';
}

function getNotes(med: FhirMedicationRequest): string {
  if (med.note && med.note.length) return med.note.map(n => n.text).join('; ');
  return '';
}

function getStatus(med: FhirMedicationRequest): string {
  switch (med.status) {
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'stopped':
      return 'stopped';
    case 'draft':
    case 'on-hold':
      return 'scheduled';
    default:
      return med.status || '';
  }
}

function isActive(status: string): boolean {
  return status === 'active';
}

function isScheduled(status: string): boolean {
  return status === 'scheduled' || status === 'draft' || status === 'on-hold';
}

/** Formats the bundle into MedicationOrder[] */
function formatMedications(bundle: any): MedicationOrder[] {
  const resourceMap = buildResourceMap(bundle);
  const meds: FhirMedicationRequest[] = (bundle.entry || [])
    .filter((entry: any) => entry.resource.resourceType === 'MedicationRequest')
    .map((entry: any) => entry.resource);

  return meds.map((medicine) => {
    const medicationResource = medicine.medication
      ? resourceMap[medicine.medicationReference?.reference || '']
      : undefined; 
    const practitionerResource = medicine.requester?.reference
      ? resourceMap[medicine.requester.reference]
      : undefined;

    const status = getStatus(medicine);

    return {
      id: medicine.id ?? '',
      name: medicine.medicationReference.display ?? '',
      form: getDrugForm(medicationResource),
      dose: getDose(medicine.dosageInstruction),
      frequency: getFrequency(medicine.dosageInstruction),
      route: getRoute(medicine.dosageInstruction),
      duration: getDuration(medicine),
      status,
      priority: getPriority(medicine.dosageInstruction),
      startDate: medicine.dispenseRequest?.validityPeriod?.start ?? '',
      orderDate: medicine.authoredOn ?? '',
      orderedBy: getProviderName(practitionerResource) || medicine.requester?.display || '',
      notes: getNotes(medicine),
      isActive: isActive(status),
      isScheduled: isScheduled(status),
    };
  });
}

/** Fetches and formats medications for a patient */
export async function getPatientMedications(patientUuid: string): Promise<MedicationOrder[]> {
  const bundle = await getPatientMedicationBundle(patientUuid);
  return formatMedications(bundle);
}