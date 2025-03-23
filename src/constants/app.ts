export const hostUrl = localStorage.getItem('host')
  ? 'https://' + localStorage.getItem('host')
  : '';

const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';
export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}?_summary=data`;
