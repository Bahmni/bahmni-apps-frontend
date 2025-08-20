import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const FHIR_VALUESET_URL = (uuid: string) =>
  OPENMRS_FHIR_R4 + `/ValueSet/${uuid}/$expand`;
export const FHIR_VALUESET_FILTER_EXPAND_URL = (filter: string) =>
  OPENMRS_FHIR_R4 + `/ValueSet/$expand?filter=${encodeURIComponent(filter)}`;
export const CONCEPT_SEARCH_URL = (
  term: string,
  limit: number,
  locale: string,
) =>
  OPENMRS_REST_V1 +
  `/bahmni/terminologies/concepts?limit=${limit}&locale=${locale}&term=${term}`;
