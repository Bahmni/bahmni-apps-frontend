const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';
export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}?_summary=data`;
export const PATIENT_CONDITION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Condition?patient=${patientUUID}`;
export const PATIENT_ALLERGY_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/AllergyIntolerance?patient=${patientUUID}`;

export const loginPath = '/bahmni/home/index.html#/login';
