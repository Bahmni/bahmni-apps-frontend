import {
  calculateAge,
  getMedicationRequestsForWorklist,
  getServiceRequestsForWorklist,
} from '@bahmni/services';
import {
  Bundle,
  MedicationRequest as FhirMedicationRequest,
  Patient,
  Resource,
  ServiceRequest,
} from 'fhir/r4';
import moment from 'moment';
import { FHIR_TASK_STATUS_TO_UI_STATUS } from '../constants/orderStatusMappings';
import {
  FhirAnnotation,
  FhirReference,
  Order,
  PatientOrderRow,
} from '../models/orderFulfillment';
import { ORDER_PRIORITY } from '../models/ordersConfig';

/**
 * Bahmni-namespaced ServiceRequest extensions populated server-side by
 * BahmniServiceRequestTranslatorImpl#mapTaskFields, from the linked FHIR Task. Reading these
 * lets the worklist render owner/status/notes off a single ServiceRequest fetch - no separate
 * Task search is needed for these order types (unlike Drug Orders, see below).
 */
const FHIR_EXT_SERVICE_REQUEST_TASK_OWNER =
  'http://fhir.bahmni.org/ext/service-request/task-owner';
const FHIR_EXT_SERVICE_REQUEST_ORDER_STATUS =
  'http://fhir.bahmni.org/ext/service-request/order-status';
const FHIR_EXT_SERVICE_REQUEST_TASK_NOTE =
  'http://fhir.bahmni.org/ext/service-request/task-note';

/** ServiceRequest.category codes registered in OrderTypeCategoryMapping (backend). */
export enum FhirOrderCategory {
  Radiology = 'imaging',
  Lab = 'laboratory',
  Rehab = 'rehabilitation',
  ProstheticsOrthotics = 'prosthetics-orthotics',
  SpeechTherapy = 'speech-therapy',
}

type FhirWorklistConfig =
  | { resourceType: 'ServiceRequest'; category: FhirOrderCategory }
  | { resourceType: 'MedicationRequest'; careSetting: 'OPD' | 'IPD' };

/**
 * Maps the legacy SQL global-property name (still used as the tab identifier in
 * openmrs/apps/orders/v2/extension.json) to how that tab should now be fetched over FHIR.
 * Kept keyed by the existing searchHandler string so no config-repo change is required.
 */
export const SEARCH_HANDLER_TO_FHIR_CONFIG: Record<string, FhirWorklistConfig> =
  {
    'emrapi.sqlSearch.v2.patientsHasPendingOrders': {
      resourceType: 'ServiceRequest',
      category: FhirOrderCategory.Radiology,
    },
    'emrapi.sqlSearch.v2.patientsHasPendingLabOrders': {
      resourceType: 'ServiceRequest',
      category: FhirOrderCategory.Lab,
    },
    'emrapi.sqlSearch.v2.patientsHasPendingDrugOrders': {
      resourceType: 'MedicationRequest',
      careSetting: 'OPD',
    },
    'emrapi.sqlSearch.v2.patientsHasPendingIPDDrugOrders': {
      resourceType: 'MedicationRequest',
      careSetting: 'IPD',
    },
    'emrapi.sqlSearch.v2.patientsHasPendingRehabOrders': {
      resourceType: 'ServiceRequest',
      category: FhirOrderCategory.Rehab,
    },
    'emrapi.sqlSearch.v2.patientsHasPendingP&OOrders': {
      resourceType: 'ServiceRequest',
      category: FhirOrderCategory.ProstheticsOrthotics,
    },
    'emrapi.sqlSearch.v2.patientsHasPendingSpeechTherapyOrders': {
      resourceType: 'ServiceRequest',
      category: FhirOrderCategory.SpeechTherapy,
    },
  };

const referenceIdFrom = (reference?: string): string =>
  reference ? reference.split('/').pop()! : '';

/**
 * FHIR priority (asap/stat/routine/urgent/...) mapped to ORDER_PRIORITY, falling back to
 * ROUTINE for any value outside our known set instead of passing an unvalidated cast through.
 */
const toOrderPriority = (priority?: string): ORDER_PRIORITY => {
  const upper = priority?.toUpperCase();
  return upper && upper in ORDER_PRIORITY
    ? ORDER_PRIORITY[upper as keyof typeof ORDER_PRIORITY]
    : ORDER_PRIORITY.ROUTINE;
};

const toFhirReference = (ref?: {
  reference?: string;
  display?: string;
}): FhirReference | null => {
  if (!ref?.reference) return null;
  return { reference: ref.reference, display: ref.display ?? '' };
};

function indexByResourceType<T extends Resource>(
  bundle: Bundle<Resource> | undefined,
  resourceType: T['resourceType'],
): Map<string, T> {
  const map = new Map<string, T>();
  bundle?.entry?.forEach((entry) => {
    const resource = entry.resource;
    if (resource?.resourceType === resourceType && resource.id) {
      map.set(resource.id, resource as T);
    }
  });
  return map;
}

function calculatePatientDetails(patient?: Patient) {
  const age = patient?.birthDate
    ? calculateAge(moment(patient.birthDate).format('YYYY-MM-DD'))
    : undefined;
  const { years, months, days } = age ?? { years: 0, months: 0, days: 0 };
  const name = patient?.name?.[0];
  return {
    reference: patient?.id ? `Patient/${patient.id}` : undefined,
    name: name
      ? `${name.given?.join(' ') ?? ''} ${name.family ?? ''}`.trim()
      : '',
    identifier: patient?.identifier?.[0]?.value ?? '',
    dateOfBirth: patient?.birthDate
      ? moment(patient.birthDate).format('DD MMM YYYY')
      : undefined,
    gender: patient?.gender,
    age: age ? `${years} years ${months} months ${days} days` : undefined,
  };
}

function serviceRequestToOrder(serviceRequest: ServiceRequest): Order {
  const ownerExtension = serviceRequest.extension?.find(
    (ext) => ext.url === FHIR_EXT_SERVICE_REQUEST_TASK_OWNER,
  );
  const statusExtension = serviceRequest.extension?.find(
    (ext) => ext.url === FHIR_EXT_SERVICE_REQUEST_ORDER_STATUS,
  );
  const taskNoteExtension = serviceRequest.extension?.find(
    (ext) => ext.url === FHIR_EXT_SERVICE_REQUEST_TASK_NOTE,
  );

  const taskStatus = statusExtension?.valueString?.toLowerCase();
  const notes: FhirAnnotation[] = taskNoteExtension?.valueAnnotation?.text
    ? [{ text: taskNoteExtension.valueAnnotation.text }]
    : [];

  return {
    id: serviceRequest.id!,
    patientUuid: referenceIdFrom(serviceRequest.subject?.reference),
    orderName:
      serviceRequest.code?.coding?.[0]?.display ??
      serviceRequest.code?.text ??
      '',
    priority: toOrderPriority(serviceRequest.priority),
    provider: toFhirReference(serviceRequest.requester),
    dateTime: serviceRequest.authoredOn
      ? moment(serviceRequest.authoredOn).format('DD MMM YY hh:mm A')
      : '',
    providerComments: serviceRequest.note?.[0]?.text ?? '',
    status: taskStatus
      ? (FHIR_TASK_STATUS_TO_UI_STATUS[taskStatus] ?? 'New')
      : 'New',
    owner: ownerExtension?.valueReference
      ? toFhirReference(ownerExtension.valueReference)
      : null,
    note: notes,
  };
}

/**
 * Drug Order (OPD/IPD) tabs render via `ordersTableColumnHeadersCustom` (identifier +
 * patientName only, non-expandable), so status/owner/notes/priority are never displayed for
 * these tabs today - Task data is intentionally not fetched, these fields just default below.
 */
function medicationRequestToOrder(
  medicationRequest: FhirMedicationRequest,
): Order {
  return {
    id: medicationRequest.id!,
    patientUuid: referenceIdFrom(medicationRequest.subject?.reference),
    orderName:
      medicationRequest.medicationCodeableConcept?.coding?.[0]?.display ??
      medicationRequest.medicationCodeableConcept?.text ??
      medicationRequest.medicationReference?.display ??
      '',
    priority: ORDER_PRIORITY.ROUTINE,
    provider: toFhirReference(medicationRequest.requester),
    dateTime: medicationRequest.authoredOn
      ? moment(medicationRequest.authoredOn).format('DD MMM YY hh:mm A')
      : '',
    providerComments: medicationRequest.note?.[0]?.text ?? '',
    status: 'New',
    owner: null,
    note: [],
  };
}

function groupByPatient(
  orders: Order[],
  patientsById: Map<string, Patient>,
): PatientOrderRow[] {
  const byPatient = new Map<string, Order[]>();
  orders.forEach((order) => {
    const existing = byPatient.get(order.patientUuid) ?? [];
    existing.push(order);
    byPatient.set(order.patientUuid, existing);
  });

  return Array.from(byPatient.entries()).map(([patientUuid, patientOrders]) => {
    const patient = patientsById.get(patientUuid);
    const details = calculatePatientDetails(patient);
    let urgentCount = 0;
    let recentOrdersCount = 0;
    const ordersWithPatient = patientOrders.map((order) => {
      if (order.priority === ORDER_PRIORITY.STAT) urgentCount += 1;
      if (order.status === 'New') recentOrdersCount += 1;
      return {
        ...order,
        patient: {
          reference: details.reference,
          dateOfBirth: details.dateOfBirth,
          gender: details.gender,
          age: details.age,
        },
      };
    });

    return {
      id: patientUuid,
      patientName: details.name,
      identifier: details.identifier,
      recentOrdersCount,
      totalOrdersCount: ordersWithPatient.length,
      urgentCount,
      orders: ordersWithPatient,
      isExpandable: true,
      hasBeenAdmitted: false,
    };
  });
}

async function fetchServiceRequestOrders(
  category: FhirOrderCategory,
  locationUuid: string,
): Promise<PatientOrderRow[]> {
  const bundle = await getServiceRequestsForWorklist<Resource>(
    category,
    locationUuid,
  );
  const serviceRequests = (bundle.entry ?? [])
    .map((entry) => entry.resource)
    .filter(
      (resource): resource is ServiceRequest =>
        resource?.resourceType === 'ServiceRequest',
    );
  const patientsById = indexByResourceType<Patient>(bundle, 'Patient');

  const orders = serviceRequests.map(serviceRequestToOrder);
  return groupByPatient(orders, patientsById);
}

/**
 * Bahmni-namespaced MedicationRequest extension exposing the order's visit "Admission Status"
 * attribute (populated server-side by BahmniMedicationRequestTranslatorImpl#getAdmissionStatus).
 * FHIR's Encounter.class is NOT a substitute for this - it's a Location-to-class mapping
 * unrelated to visit admission status, and is unconfigured/defaults to "AMB" in this deployment.
 */
const FHIR_EXT_MEDICATION_REQUEST_ADMISSION_STATUS =
  'http://fhir.bahmni.org/ext/medication-request/admission-status';

const ADMITTED_VISIT_ATTRIBUTE_VALUES = ['Admitted', 'Discharged'];

/**
 * Drug Orders (OPD/IPD) split by the visit admission-status extension, mirroring the SQL
 * `va.value_reference in ('Admitted', 'Discharged')` check exactly.
 */
function medicationRequestIsInpatient(
  medicationRequest: FhirMedicationRequest,
): boolean {
  const admissionStatus = medicationRequest.extension?.find(
    (ext) => ext.url === FHIR_EXT_MEDICATION_REQUEST_ADMISSION_STATUS,
  )?.valueString;
  return (
    !!admissionStatus &&
    ADMITTED_VISIT_ATTRIBUTE_VALUES.includes(admissionStatus)
  );
}

async function fetchMedicationRequestOrders(
  careSetting: 'OPD' | 'IPD',
  locationUuid: string,
): Promise<PatientOrderRow[]> {
  const bundle = await getMedicationRequestsForWorklist(locationUuid);
  const allMedicationRequests = (bundle.entry ?? [])
    .map((entry) => entry.resource)
    .filter(
      (resource): resource is FhirMedicationRequest =>
        resource?.resourceType === 'MedicationRequest',
    );
  const patientsById = indexByResourceType<Patient>(bundle, 'Patient');

  const medicationRequests = allMedicationRequests.filter(
    (medicationRequest) => {
      const isInpatient = medicationRequestIsInpatient(medicationRequest);
      return careSetting === 'IPD' ? isInpatient : !isInpatient;
    },
  );

  const orders = medicationRequests.map(medicationRequestToOrder);
  return groupByPatient(orders, patientsById);
}

export async function fetchOrdersViaFhir(
  searchHandler: string,
  locationUuid: string,
): Promise<PatientOrderRow[]> {
  const config = SEARCH_HANDLER_TO_FHIR_CONFIG[searchHandler];
  if (!config) {
    throw new Error(
      `No FHIR mapping configured for searchHandler "${searchHandler}"`,
    );
  }

  if (config.resourceType === 'ServiceRequest') {
    return fetchServiceRequestOrders(config.category, locationUuid);
  }
  return fetchMedicationRequestOrders(config.careSetting, locationUuid);
}
