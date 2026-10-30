import {
  get,
  OPENMRS_FHIR_R4,
  OPENMRS_REST_V1,
  searchConceptByName,
} from '@bahmni/services';
import type { DispositionType } from '../stores/dispositionStore';

const DISPOSITION_CONCEPT_NAME = 'Disposition';
const DISPOSITION_CUSTOM_VIEW =
  'custom:(uuid,name,answers:(uuid,name,mappings))';
const EMRAPI_MAPPING_SOURCE = 'org.openmrs.module.emrapi';

const ADMISSION_STATUS_ATTRIBUTE_TYPE = 'Admission Status';
const ADMISSION_STATUS_VALUES = {
  ADMITTED: 'Admitted',
  DISCHARGED: 'Discharged',
} as const;

const DISPOSITION_VALUE = {
  ADMIT: 'ADMIT',
  DISCHARGE: 'DISCHARGE',
  TRANSFER: 'TRANSFER',
  UNDO_DISCHARGE: 'UNDO_DISCHARGE',
} as const;

export type AdmissionStatus =
  (typeof ADMISSION_STATUS_VALUES)[keyof typeof ADMISSION_STATUS_VALUES];

interface VisitAttribute {
  attributeType?: { name?: string };
  value?: string;
  voided?: boolean;
}

interface VisitWithAttributes {
  attributes?: VisitAttribute[];
}

interface DispositionConceptMapping {
  display?: string;
}

interface DispositionAnswerConcept {
  uuid: string;
  name?: { name: string };
  mappings?: DispositionConceptMapping[];
}

interface DispositionConceptData {
  uuid?: string;
  answers?: DispositionAnswerConcept[];
}

const getMappingCode = (concept: DispositionAnswerConcept): string => {
  if (!concept.mappings) return '';
  for (const mapping of concept.mappings) {
    const [source, code] = (mapping.display ?? '').split(':');
    if (source?.trim() === EMRAPI_MAPPING_SOURCE) {
      return (code ?? '').trim();
    }
  }
  return '';
};

export const fetchDispositionTypes = async (): Promise<DispositionType[]> => {
  const concept = (await searchConceptByName(
    DISPOSITION_CONCEPT_NAME,
    DISPOSITION_CUSTOM_VIEW,
  )) as DispositionConceptData | null;

  const answers = concept?.answers ?? [];

  return answers.map((answer) => {
    const code = getMappingCode(answer);
    return {
      value: code || answer.uuid,
      label: answer.name?.name ?? '',
      conceptUuid: answer.uuid,
    };
  });
};

/**
 * Fetches the visit's "Admission Status" attribute (set by the ADMISSION/DISCHARGE
 * encounter save path) used to drive which disposition options are valid next.
 */
export const fetchAdmissionStatus = async (
  visitUuid: string,
): Promise<AdmissionStatus | null> => {
  const url = `${OPENMRS_REST_V1}/visit/${visitUuid}?v=custom:(attributes:(attributeType:(name),value,voided))`;
  const visit = await get<VisitWithAttributes>(url);

  const admissionStatusAttribute = visit.attributes?.find(
    (attribute) =>
      !attribute.voided &&
      attribute.attributeType?.name === ADMISSION_STATUS_ATTRIBUTE_TYPE,
  );

  const value = admissionStatusAttribute?.value;
  if (value === ADMISSION_STATUS_VALUES.ADMITTED) return value;
  if (value === ADMISSION_STATUS_VALUES.DISCHARGED) return value;
  return null;
};

/**
 * Filters disposition types by concept mapping code (the `value` fetched from the
 * concept's emrapi mapping, kept consistent with fetchDispositionTypes), based on the
 * visit's current admission state:
 * - No admission status yet → only Admit is valid
 * - Admitted → Discharge or Transfer are valid
 * - Discharged → only Undo Discharge is valid
 */
export const filterDispositionTypesByAdmissionStatus = (
  dispositionTypes: DispositionType[],
  admissionStatus: AdmissionStatus | null,
): DispositionType[] => {
  const allowedValues: string[] =
    admissionStatus === ADMISSION_STATUS_VALUES.ADMITTED
      ? [DISPOSITION_VALUE.DISCHARGE, DISPOSITION_VALUE.TRANSFER]
      : admissionStatus === ADMISSION_STATUS_VALUES.DISCHARGED
        ? [DISPOSITION_VALUE.UNDO_DISCHARGE]
        : [DISPOSITION_VALUE.ADMIT];

  return dispositionTypes.filter((type) => allowedValues.includes(type.value));
};

interface ServiceRequestBundle {
  entry?: {
    resource?: {
      authoredOn?: string;
      status?: string;
      code?: { coding?: { code?: string }[] };
    };
  }[];
}

const VOIDED_SERVICE_REQUEST_STATUS = 'entered-in-error';

/**
 * Mirrors the backend's "superseded" rule (ServiceRequestValidatorImpl): a disposition
 * order is still active only if no other disposition order (of any kind) was placed
 * after it in the same visit. The new ServiceRequest-only flow never creates the
 * ADMISSION/DISCHARGE/TRANSFER encounter-type flip that used to signal "fulfilled", so
 * the order timeline itself is the only reliable signal - e.g. Discharge -> Undo
 * Discharge -> Discharge again must be allowed, since the Undo Discharge order moved
 * past the first Discharge.
 */
export const fetchHasActiveOrderForConcept = async (
  patientUuid: string,
  targetConceptUuid: string,
  allDispositionConceptUuids: string[],
  visitStartDate: string,
): Promise<boolean> => {
  const url = `${OPENMRS_FHIR_R4}/ServiceRequest?patient=${patientUuid}`;
  const bundle = await get<ServiceRequestBundle>(url);

  const visitStart = new Date(visitStartDate).getTime();
  const conceptUuidSet = new Set(allDispositionConceptUuids);

  const relevantOrders = (bundle.entry ?? [])
    .map((entry) => ({
      authoredOn: entry.resource?.authoredOn,
      status: entry.resource?.status,
      conceptUuid: entry.resource?.code?.coding?.[0]?.code,
    }))
    .filter(
      (order) =>
        !!order.authoredOn &&
        order.status !== VOIDED_SERVICE_REQUEST_STATUS &&
        !!order.conceptUuid &&
        conceptUuidSet.has(order.conceptUuid) &&
        new Date(order.authoredOn).getTime() >= visitStart,
    );

  if (relevantOrders.length === 0) {
    return false;
  }

  const latestAuthoredOn = Math.max(
    ...relevantOrders.map((order) => new Date(order.authoredOn!).getTime()),
  );

  return relevantOrders.some(
    (order) =>
      order.conceptUuid === targetConceptUuid &&
      new Date(order.authoredOn!).getTime() === latestAuthoredOn,
  );
};
