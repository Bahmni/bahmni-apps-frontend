import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const ENCOUNTER_TYPE_BY_NAME_URL = (name: string) =>
  `${OPENMRS_REST_V1}/encountertype?q=${encodeURIComponent(name)}&v=custom:(uuid,name)`;

export const PATIENT_VISITS_URL = (
  patientUUID: string,
  locationUuid?: string,
) =>
  OPENMRS_FHIR_R4 +
  `/Encounter?subject:Patient=${patientUUID}&_tag=visit&_sort=-_lastUpdated` +
  (locationUuid ? `&location=${locationUuid}` : '');

export const PATIENT_ENCOUNTERS_URL = (
  patientUUID: string,
  count: number = 100,
  offset: number = 0,
) =>
  OPENMRS_FHIR_R4 +
  `/Encounter?subject:Patient=${patientUUID}&_sort=-_lastUpdated&_count=${count}&_getpagesoffset=${offset}`;

export const FHIR_ENCOUNTER_URL = OPENMRS_FHIR_R4 + '/Encounter';

export const BAHMNI_ENCOUNTER_URL = (
  encounterUUID: string,
  includeAll: boolean = false,
) =>
  `${OPENMRS_REST_V1}/bahmnicore/bahmniencounter/${encounterUUID}?includeAll=${includeAll}`;

export const CONSULTATION_BUNDLE_URL = OPENMRS_FHIR_R4 + '/ConsultationBundle';
