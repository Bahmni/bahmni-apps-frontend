import { get } from '../../api';
import { logAuditEvent } from '../../auditLogService';
import {
  searchPatients,
  searchPatientsFormatted,
  getPatientSearchResults,
} from '../patientSearchService';
import {
  PATIENT_SEARCH_BASE_URL,
  PATIENT_SEARCH_CONFIG,
  PATIENT_SEARCH_DEFAULTS,
} from '../constants';
import {
  sortPatientsByIdentifierAscending,
  getUuidFromUserLocationCookie,
} from '../utils';
import {
  mockPatientSearchResponse,
  mockEmptyPatientSearchResponse,
  mockPatientSearchResultsForIdentifierSorting,
  mockPatientSearchResponseForIdentifierSorting,
  mockPatientSearchResponseWithPartialMatches,
  mockPatientSearchResponseWithCaseVariations,
  mockSinglePatientSearchResponse,
  mockPatientSearchResponseForPercentSearch,
} from '../__mocks__/mocks';


jest.mock('../../api');
jest.mock('../../auditLogService');
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getUuidFromUserLocationCookie: jest.fn(),
}));

describe('PatientSearchService', () => {
  const mockSearchTerm = 'John Doe';
  const mockLoginLocationUuid = 'location-123';
  const mockTranslationFunction = jest.fn((key: string) => key);
  const mockError = new Error('API Error');

  beforeEach(() => {
    jest.clearAllMocks();
    (getUuidFromUserLocationCookie as jest.Mock).mockReturnValue(
      mockLoginLocationUuid,
    );
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);
  });

  describe('searchPatients', () => {
    it('should search patients successfully', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponse);

      const result = await searchPatients(mockSearchTerm);

      expect(getUuidFromUserLocationCookie).toHaveBeenCalled();
      expect(get).toHaveBeenCalledWith(
        expect.stringContaining(PATIENT_SEARCH_BASE_URL),
      );
      expect(result).toEqual(mockPatientSearchResponse);
      expect(logAuditEvent).toHaveBeenCalledWith(
        undefined,
        'PATIENT_SEARCH',
        expect.objectContaining({
          searchTerm: mockSearchTerm,
          resultCount: mockPatientSearchResponse.totalCount,
          searchType: 'COMBINED_ID_NAME',
        }),
      );
    });

    it('should throw error when login location UUID is not found', async () => {
      (getUuidFromUserLocationCookie as jest.Mock).mockReturnValue(null);

      await expect(searchPatients(mockSearchTerm)).rejects.toThrow(
        'Login location UUID not found in cookie',
      );
    });

    it('should throw error when search term is empty or whitespace', async () => {
      await expect(searchPatients('')).rejects.toThrow(
        'Search term cannot be empty',
      );
      await expect(searchPatients('   ')).rejects.toThrow(
        'Search term cannot be empty',
      );
    });

    it('should trim search term before processing', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponse);
      const searchTermWithSpaces = '  John Doe  ';

      await searchPatients(searchTermWithSpaces);

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('q=John+Doe'),
      );
      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('identifier=John+Doe'),
      );
    });

    it('should handle special characters in search term', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponse);
      const specialCharSearchTerm = 'John@Doe#123';

      await searchPatients(specialCharSearchTerm);

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('q=John%40Doe%23123'),
      );
    });

    it('should handle percent sign search term', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponseForPercentSearch);

      await searchPatients('%');

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('q=%25'),
      );
      expect(logAuditEvent).toHaveBeenCalledWith(
        undefined,
        'PATIENT_SEARCH',
        expect.objectContaining({
          searchTerm: '%',
          searchType: 'COMBINED_ID_NAME',
        }),
      );
    });

    it('should include correct URL parameters', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponse);

      await searchPatients(mockSearchTerm);

      const expectedParams = new URLSearchParams({
        filterOnAllIdentifiers:
          PATIENT_SEARCH_DEFAULTS.FILTER_ON_ALL_IDENTIFIERS.toString(),
        q: mockSearchTerm,
        identifier: mockSearchTerm,
        loginLocationUuid: mockLoginLocationUuid,
        patientSearchResultsConfig: PATIENT_SEARCH_CONFIG.PHONE_NUMBER,
      });
      expectedParams.append(
        'patientSearchResultsConfig',
        PATIENT_SEARCH_CONFIG.ALTERNATE_PHONE_NUMBER,
      );

      expect(get).toHaveBeenCalledWith(
        `${PATIENT_SEARCH_BASE_URL}?${expectedParams.toString()}`,
      );
    });

    it('should handle API errors and log failed search attempt', async () => {
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(searchPatients(mockSearchTerm)).rejects.toThrow(mockError);

      expect(logAuditEvent).toHaveBeenCalledWith(
        undefined,
        'PATIENT_SEARCH_FAILED',
        expect.objectContaining({
          searchTerm: mockSearchTerm,
          error: mockError.message,
        }),
      );
    });
  });

  describe('searchPatientsFormatted', () => {
    it('should return formatted patient search results', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponse);

      const result = await searchPatientsFormatted(
        mockSearchTerm,
        mockTranslationFunction,
      );

      expect(result).toHaveLength(mockPatientSearchResponse.pageOfResults.length);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('patientId');
      expect(result[0]).toHaveProperty('fullName');
      expect(result[0]).toHaveProperty('gender');
      expect(result[0]).toHaveProperty('age');
      expect(result[0]).toHaveProperty('registrationDate');
      expect(result[0]).toHaveProperty('uuid');
    });

    it('should handle empty search results', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyPatientSearchResponse);

      const result = await searchPatientsFormatted(
        mockSearchTerm,
        mockTranslationFunction,
      );

      expect(result).toEqual([]);
    });

    it('should sort results in ascending identifier order', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponseForIdentifierSorting);

      const result = await searchPatientsFormatted(
        mockSearchTerm,
        mockTranslationFunction,
      );

      expect(result).toHaveLength(6);
      expect(result[0].patientId).toBe('ABC200');
      expect(result[1].patientId).toBe('ABC20000');
      expect(result[2].patientId).toBe('ABC200000');
      expect(result[3].patientId).toBe('ABC2000001');
      expect(result[4].patientId).toBe('DEF456');
      expect(result[5].patientId).toBe('XYZ123ABC200');
    });

    it('should handle API errors properly', async () => {
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        searchPatientsFormatted(mockSearchTerm, mockTranslationFunction)
      ).rejects.toThrow(mockError);
    });
  });

  describe('getPatientSearchResults', () => {
    it('should return search results with total count', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponse);

      const result = await getPatientSearchResults(
        mockSearchTerm,
        mockTranslationFunction,
      );

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('totalCount');
      expect(result.totalCount).toBe(mockPatientSearchResponse.totalCount);
      expect(result.results).toHaveLength(
        mockPatientSearchResponse.pageOfResults.length,
      );
    });

    it('should handle empty search results with zero count', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyPatientSearchResponse);

      const result = await getPatientSearchResults(
        mockSearchTerm,
        mockTranslationFunction,
      );

      expect(result.totalCount).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should handle API errors and propagate them', async () => {
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        getPatientSearchResults(mockSearchTerm, mockTranslationFunction)
      ).rejects.toThrow(mockError);
    });
  });

  describe('Patient Search Results Sorting by Identifier Ascending Order', () => {
    const searchTerm = 'ABC200';

    it('should sort patient results by identifier in ascending order', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponseForIdentifierSorting);

      const result = await getPatientSearchResults(
        searchTerm,
        mockTranslationFunction,
      );

      const sortedResults = result.results;
      expect(sortedResults).toHaveLength(6);

      // Expected order: alphabetical/numeric ascending order
      expect(sortedResults[0].patientId).toBe('ABC200');
      expect(sortedResults[1].patientId).toBe('ABC20000');
      expect(sortedResults[2].patientId).toBe('ABC200000');
      expect(sortedResults[3].patientId).toBe('ABC2000001');
      expect(sortedResults[4].patientId).toBe('DEF456');
      expect(sortedResults[5].patientId).toBe('XYZ123ABC200');
    });

    it('should sort consistently regardless of search term', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponseWithPartialMatches);

      const result = await getPatientSearchResults(
        searchTerm,
        mockTranslationFunction,
      );

      const sortedResults = result.results;
      expect(sortedResults).toHaveLength(3);

      // Expected order: alphabetical ascending
      expect(sortedResults[0].patientId).toBe('AB200');
      expect(sortedResults[1].patientId).toBe('ABC123');
      expect(sortedResults[2].patientId).toBe('XYZ789');
    });

    it('should handle case-insensitive sorting', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponseWithCaseVariations);

      const result = await getPatientSearchResults(
        searchTerm,
        mockTranslationFunction,
      );

      const sortedResults = result.results;
      expect(sortedResults).toHaveLength(3);

      // Should sort case-insensitively in ascending order
      const patientIds = sortedResults.map(r => r.patientId);
      expect(patientIds).toContain('abc200');
      expect(patientIds).toContain('ABC200');
      expect(patientIds).toContain('AbC200');
      
      // First should be 'ABC200' or 'AbC200' or 'abc200' (all equivalent)
      expect(sortedResults[0].patientId.toLowerCase()).toBe('abc200');
    });

    it('should handle single patient result correctly', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockSinglePatientSearchResponse);

      const result = await getPatientSearchResults(
        searchTerm,
        mockTranslationFunction,
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].patientId).toBe('ABC200');
    });

    it('should handle empty search results', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyPatientSearchResponse);

      const result = await getPatientSearchResults(
        searchTerm,
        mockTranslationFunction,
      );

      expect(result.results).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should handle percent search (show all patients) with proper sorting', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockPatientSearchResponseForPercentSearch);

      const result = await getPatientSearchResults(
        '%',
        mockTranslationFunction,
      );

      // Should sort all patients in ascending identifier order
      expect(result.results).toHaveLength(mockPatientSearchResponseForPercentSearch.pageOfResults.length);
      
      // Verify sorting is applied
      const patientIds = result.results.map(r => r.patientId);
      const sortedIds = [...patientIds].sort((a, b) => 
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      );
      expect(patientIds).toEqual(sortedIds);
    });

    it('should handle mixed alphanumeric identifiers correctly', async () => {
      const mixedResponse = {
        ...mockPatientSearchResponse,
        pageOfResults: [
          { ...mockPatientSearchResponse.pageOfResults[0], identifier: 'PAT100' },
          { ...mockPatientSearchResponse.pageOfResults[0], identifier: 'PAT2' },
          { ...mockPatientSearchResponse.pageOfResults[0], identifier: 'PAT10' },
          { ...mockPatientSearchResponse.pageOfResults[0], identifier: 'PAT1' },
        ],
      };
      (get as jest.Mock).mockResolvedValueOnce(mixedResponse);

      const result = await getPatientSearchResults(
        'PAT',
        mockTranslationFunction,
      );

      // Should sort numerically: PAT1, PAT2, PAT10, PAT100
      expect(result.results[0].patientId).toBe('PAT1');
      expect(result.results[1].patientId).toBe('PAT2');
      expect(result.results[2].patientId).toBe('PAT10');
      expect(result.results[3].patientId).toBe('PAT100');
    });
  });

  describe('sortPatientsByIdentifierAscending', () => {
    it('should sort patients by identifier in ascending order', () => {
      const patients = mockPatientSearchResultsForIdentifierSorting;
      const sorted = sortPatientsByIdentifierAscending(patients);

      // Should sort alphabetically/numerically in ascending order
      expect(sorted[0].identifier).toBe('ABC200');
      expect(sorted[1].identifier).toBe('ABC20000');
      expect(sorted[2].identifier).toBe('ABC200000');
      expect(sorted[3].identifier).toBe('ABC2000001');
      expect(sorted[4].identifier).toBe('DEF456');
      expect(sorted[5].identifier).toBe('XYZ123ABC200');
    });

    it('should handle empty patient array', () => {
      const result = sortPatientsByIdentifierAscending([]);
      expect(result).toEqual([]);
    });

    it('should not mutate original array', () => {
      const patients = mockPatientSearchResultsForIdentifierSorting;
      const originalOrder = patients.map(p => p.identifier);
      
      sortPatientsByIdentifierAscending(patients);
      
      // Original array should remain unchanged
      expect(patients.map(p => p.identifier)).toEqual(originalOrder);
    });

    it('should handle numeric sorting correctly', () => {
      const patientsWithNumbers = [
        { ...mockPatientSearchResultsForIdentifierSorting[0], identifier: 'PAT10' },
        { ...mockPatientSearchResultsForIdentifierSorting[1], identifier: 'PAT2' },
        { ...mockPatientSearchResultsForIdentifierSorting[2], identifier: 'PAT1' },
      ];

      const sorted = sortPatientsByIdentifierAscending(patientsWithNumbers);
      
      // Should sort numerically: PAT1, PAT2, PAT10 (not PAT1, PAT10, PAT2)
      expect(sorted[0].identifier).toBe('PAT1');
      expect(sorted[1].identifier).toBe('PAT2');
      expect(sorted[2].identifier).toBe('PAT10');
    });

    it('should handle single patient array', () => {
      const singlePatient = [mockPatientSearchResultsForIdentifierSorting[0]];
      const sorted = sortPatientsByIdentifierAscending(singlePatient);
      
      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toEqual(singlePatient[0]);
    });
  });
});