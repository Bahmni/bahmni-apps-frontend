import { get } from '../api';
import { logAuditEvent } from '../auditLogService';
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
} from './utils';

/**
 * Searches for patients using the Bahmni Lucene search API
 * @param searchTerm - The search term (patient ID or name)
 * @returns Promise resolving to patient search response
 */
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

  // Add alternate phone number config as a separate parameter
  params.append(
    'patientSearchResultsConfig',
    PATIENT_SEARCH_CONFIG.ALTERNATE_PHONE_NUMBER,
  );

  const url = `${PATIENT_SEARCH_BASE_URL}?${params.toString()}`;

  try {
    const response = await get<PatientSearchResponse>(url);

    // Log the search event for audit purposes
    await logAuditEvent(
      undefined, // No specific patient UUID for search
      'PATIENT_SEARCH',
      {
        searchTerm: trimmedSearchTerm,
        resultCount: response.totalCount,
        searchType: 'COMBINED_ID_NAME',
      },
    );

    return response;
  } catch (error) {
    // Log failed search attempt
    await logAuditEvent(undefined, 'PATIENT_SEARCH_FAILED', {
      searchTerm: trimmedSearchTerm,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Searches for patients and returns formatted results
 * @param searchTerm - The search term (patient ID or name)
 * @param t - Translation function for date formatting
 * @returns Promise resolving to formatted patient search results
 */
export async function searchPatientsFormatted(
  searchTerm: string,
  t: (key: string) => string,
): Promise<FormattedPatientSearchResult[]> {
  const response = await searchPatients(searchTerm);
  return formatPatientSearchResults(response.pageOfResults, t);
}

/**
 * Gets patient search results with total count
 * @param searchTerm - The search term (patient ID or name)
 * @param t - Translation function for date formatting
 * @returns Promise resolving to search results with metadata
 */
export async function getPatientSearchResults(
  searchTerm: string,
  t: (key: string) => string,
): Promise<{
  results: FormattedPatientSearchResult[];
  totalCount: number;
}> {
  const response = await searchPatients(searchTerm);
  const formattedResults = formatPatientSearchResults(
    response.pageOfResults,
    t,
  );

  return {
    results: formattedResults,
    totalCount: response.totalCount,
  };
}
