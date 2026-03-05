export const ORDERS_BASE_URL = '/openmrs/ws/rest/v1/';
export const FETCH_ORDERS_URL = `${ORDERS_BASE_URL}bahmnicore/sql`;
export const PROVIDER_ENDPOINT_PATTERN =
  '/provider?v=custom:(id,name,uuid)&attrName=practitioner_type&attrValue=';

export const TAB_PRACTITIONER_TYPE_MAP: Record<string, string> = {
  'Radiology Order': 'Radiology%20Technologist',
  'Rehab Order': 'Physiotherapist',
  'P&O Order': 'PandO%20Technician',
  'Speech Therapy Order': 'Speech%20Therapist',
};
