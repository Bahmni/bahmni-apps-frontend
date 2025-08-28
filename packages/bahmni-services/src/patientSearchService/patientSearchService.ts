import { get } from '../api';
import {
  PATIENT_SEARCH_BASE_URL,
  PATIENT_SEARCH_CONFIG,
  PATIENT_SEARCH_DEFAULTS,
} from './constants';
import { PatientSearchResponse, FormattedPatientSearchResult } from './models';
import {
  formatPatientSearchResults,
  getUuidFromUserLocationCookie,
  isValidSearchTerm,
  sortPatientsByIdentifierAscending,
} from './utils';

export async function searchPatients(
  searchTerm: string,
): Promise<PatientSearchResponse> {
  const loginLocationUuid = getUuidFromUserLocationCookie();

  if (!loginLocationUuid) {
    throw new Error('Login location UUID not found in cookie');
  }

  if (!isValidSearchTerm(searchTerm)) {
    throw new Error('Search term cannot be empty');
  }

  const trimmedSearchTerm = searchTerm.trim();

  const params = new URLSearchParams({
    filterOnAllIdentifiers:
      PATIENT_SEARCH_DEFAULTS.FILTER_ON_ALL_IDENTIFIERS.toString(),
    q: trimmedSearchTerm,
    identifier: trimmedSearchTerm,
    loginLocationUuid,
    patientSearchResultsConfig: PATIENT_SEARCH_CONFIG.PHONE_NUMBER,
  });

  params.append(
    'patientSearchResultsConfig',
    PATIENT_SEARCH_CONFIG.ALTERNATE_PHONE_NUMBER,
  );

  const url = `${PATIENT_SEARCH_BASE_URL}?${params.toString()}`;
  return get<PatientSearchResponse>(url);
}

export async function getPatientSearchResults(
  searchTerm: string,
  t: (key: string) => string,
): Promise<FormattedPatientSearchResult[]> {
  const response = await searchPatients(searchTerm);
  const sortedResults = sortPatientsByIdentifierAscending(
    response.pageOfResults,
  );
  return formatPatientSearchResults(sortedResults, t);
}
