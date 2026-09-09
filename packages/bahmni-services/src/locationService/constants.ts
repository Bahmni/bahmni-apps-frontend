import { OPENMRS_REST_V1, OPENMRS_FHIR_R4 } from '../constants/app';

export const LOCATION_BY_TAG_URL = (tag: string) =>
  `${OPENMRS_REST_V1}/location?operator=ALL&s=byTags&tags=${encodeURIComponent(tag)}&v=custom:(uuid,display,childLocations:(uuid,display,retired))`;

export const FHIR_LOCATION_BY_TAG_URL = (tag: string) =>
  `${OPENMRS_FHIR_R4}/Location?_tag=${encodeURIComponent(tag)}`;
