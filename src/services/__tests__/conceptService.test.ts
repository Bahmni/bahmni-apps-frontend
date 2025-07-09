import { ValueSet } from 'fhir/r4';
import {
  FHIR_VALUESET_URL,
  FHIR_VALUESET_FILTER_EXPAND_URL,
} from '@constants/app';
import * as api from '../api';
import {
  searchConcepts,
  searchFHIRConcepts,
  searchFHIRConceptsByName,
} from '../conceptService';
import * as translationService from '../translationService';

jest.mock('../api');
jest.mock('../translationService');

describe('conceptService', () => {
  describe('searchConcepts', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (translationService.getUserPreferredLocale as jest.Mock).mockReturnValue(
        'en',
      );
      (api.get as jest.Mock).mockResolvedValue([]);
    });

    it('should call API with correct URL including locale from getUserPreferredLocale', async () => {
      const mockLocale = 'fr';
      (translationService.getUserPreferredLocale as jest.Mock).mockReturnValue(
        mockLocale,
      );

      await searchConcepts('test', 20);

      expect(api.get).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/bahmni/terminologies/concepts?limit=20&locale=${mockLocale}&term=test`,
      );
    });

    it('should return ConceptSearch array from API response', async () => {
      const mockConcepts = [
        { conceptName: 'Test', conceptUuid: '123', matchedName: 'Test' },
      ];
      (api.get as jest.Mock).mockResolvedValue(mockConcepts);

      const result = await searchConcepts('test');

      expect(result).toEqual(mockConcepts);
    });

    it('should handle errors appropriately', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(searchConcepts('test')).rejects.toThrow(mockError);
    });

    it('should pass the search term to the CONCEPT_SEARCH_URL', async () => {
      await searchConcepts('term with spaces');

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('term=term with spaces'),
      );
    });
  });

  describe('searchFHIRConcepts', () => {
    const mockUUID = '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const mockValueSet: ValueSet = {
      resourceType: 'ValueSet',
      id: mockUUID,
      status: 'active',
      compose: {
        include: [
          {
            concept: [
              {
                code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                display: 'Mental status change',
              },
              {
                code: '121629AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                display: 'Anaemia',
              },
            ],
          },
        ],
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (api.get as jest.Mock).mockResolvedValue(mockValueSet);
    });

    it('should call API with correct FHIR ValueSet URL', async () => {
      await searchFHIRConcepts(mockUUID);
      expect(api.get).toHaveBeenCalledWith(FHIR_VALUESET_URL(mockUUID));
    });

    it('should return ValueSet from API response', async () => {
      const result = await searchFHIRConcepts(mockUUID);
      expect(result).toEqual(mockValueSet);
    });

    it('should handle errors appropriately', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);
      await expect(searchFHIRConcepts(mockUUID)).rejects.toThrow(mockError);
    });
  });

  describe('searchFHIRConceptsByName', () => {
    const mockValueSet: ValueSet = {
      resourceType: 'ValueSet',
      id: 'test-valueset',
      status: 'active',
      expansion: {
        timestamp: '2024-01-01T00:00:00Z',
        contains: [
          {
            system: 'http://loinc.org',
            code: '1234-5',
            display: 'Test Concept 1',
          },
          {
            system: 'http://loinc.org',
            code: '5678-9',
            display: 'Test Concept 2',
          },
        ],
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (api.get as jest.Mock).mockResolvedValue(mockValueSet);
    });

    it('should call API with correct FHIR ValueSet filter expand URL', async () => {
      const searchName = 'blood pressure';
      await searchFHIRConceptsByName(searchName);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_VALUESET_FILTER_EXPAND_URL(searchName),
      );
    });

    it('should encode special characters in the search name', async () => {
      const searchName = 'test & special/characters';
      await searchFHIRConceptsByName(searchName);

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('filter=test%20%26%20special%2Fcharacters'),
      );
    });

    it('should return ValueSet from API response', async () => {
      const result = await searchFHIRConceptsByName('test');
      expect(result).toEqual(mockValueSet);
    });

    it('should handle empty search name', async () => {
      await searchFHIRConceptsByName('');

      expect(api.get).toHaveBeenCalledWith(FHIR_VALUESET_FILTER_EXPAND_URL(''));
    });

    it('should handle search names with only whitespace', async () => {
      const searchName = '   ';
      await searchFHIRConceptsByName(searchName);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_VALUESET_FILTER_EXPAND_URL(searchName),
      );
    });

    it('should handle errors appropriately', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(searchFHIRConceptsByName('test')).rejects.toThrow(mockError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      (api.get as jest.Mock).mockRejectedValue(networkError);

      await expect(searchFHIRConceptsByName('test')).rejects.toThrow(
        networkError,
      );
    });

    it('should handle very long search names', async () => {
      const longSearchName = 'a'.repeat(1000);
      await searchFHIRConceptsByName(longSearchName);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_VALUESET_FILTER_EXPAND_URL(longSearchName),
      );
    });

    it('should handle search names with unicode characters', async () => {
      const unicodeSearchName = 'test 测试 テスト';
      await searchFHIRConceptsByName(unicodeSearchName);

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining(
          'filter=test%20%E6%B5%8B%E8%AF%95%20%E3%83%86%E3%82%B9%E3%83%88',
        ),
      );
    });
  });
});
