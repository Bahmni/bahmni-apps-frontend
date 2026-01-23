import * as api from '../../api';
import { getUserPreferredLocale } from '../../i18n/translationService';
import {
  mockConceptSearch,
  mockUUID,
  mockValueSet,
  mockValueSetExpanded,
  mockConceptData,
} from '../__mocks__/mocks';
import {
  searchConcepts,
  searchFHIRConcepts,
  searchFHIRConceptsByName,
  getConceptById,
  searchConceptByName,
} from '../conceptService';
import {
  FHIR_VALUESET_URL,
  FHIR_VALUESET_FILTER_EXPAND_URL,
  CONCEPT_GET_URL,
} from '../constants';

jest.mock('../../api');
jest.mock('../../i18n/translationService');

describe('conceptService', () => {
  describe('searchConcepts', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');
      (api.get as jest.Mock).mockResolvedValue([]);
    });

    it('should call API with correct URL including locale from getUserPreferredLocale', async () => {
      const mockLocale = 'fr';
      (getUserPreferredLocale as jest.Mock).mockReturnValue(mockLocale);

      await searchConcepts('test', 20);

      expect(api.get).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/bahmni/terminologies/concepts?limit=20&locale=${mockLocale}&term=test`,
      );
    });

    it('should return ConceptSearch array from API response', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockConceptSearch);

      const result = await searchConcepts('test');

      expect(result).toEqual(mockConceptSearch);
    });

    it('should handle errors appropriately', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(searchConcepts('test')).rejects.toThrow(mockError);
    });
  });

  describe('searchFHIRConcepts', () => {
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
    beforeEach(() => {
      jest.clearAllMocks();
      (api.get as jest.Mock).mockResolvedValue(mockValueSetExpanded);
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
      expect(result).toEqual(mockValueSetExpanded);
    });

    it('should handle errors appropriately', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(searchFHIRConceptsByName('test')).rejects.toThrow(mockError);
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

  describe('getConceptById', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (api.get as jest.Mock).mockResolvedValue(mockConceptData);
    });

    it('should call API with correct concept URL', async () => {
      await getConceptById(mockUUID);

      expect(api.get).toHaveBeenCalledWith(CONCEPT_GET_URL(mockUUID));
      expect(api.get).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/concept/${mockUUID}`,
      );
    });

    it('should return ConceptData from API response', async () => {
      const result = await getConceptById(mockUUID);

      expect(result).toEqual(mockConceptData);
      expect(result.uuid).toBe(mockUUID);
      expect(result.display).toBe('Temperature');
    });

    it('should handle errors appropriately', async () => {
      const notFoundError = new Error('Concept not found');
      notFoundError.name = 'NotFoundError';
      (api.get as jest.Mock).mockRejectedValue(notFoundError);

      await expect(getConceptById('invalid-uuid')).rejects.toThrow(
        notFoundError,
      );
    });

    it('should return concept with set members when concept is a set', async () => {
      const mockSetConcept = {
        ...mockConceptData,
        set: true,
        setMembers: [
          {
            uuid: 'member1-uuid',
            display: 'Member 1',
            links: [
              {
                rel: 'self',
                uri: '/openmrs/ws/rest/v1/concept/member1-uuid',
              },
            ],
          },
        ],
      };
      (api.get as jest.Mock).mockResolvedValue(mockSetConcept);

      const result = await getConceptById(mockUUID);

      expect(result.set).toBe(true);
      expect(result.setMembers).toHaveLength(1);
      expect(result.setMembers[0].uuid).toBe('member1-uuid');
    });

    it('should return retired concept when concept is retired', async () => {
      const mockRetiredConcept = {
        ...mockConceptData,
        retired: true,
      };
      (api.get as jest.Mock).mockResolvedValue(mockRetiredConcept);

      const result = await getConceptById(mockUUID);

      expect(result.retired).toBe(true);
    });
  });

  describe('searchConceptByName', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return ConceptData when concept is found', async () => {
      const mockResponse = {
        results: [mockConceptData],
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchConceptByName('Temperature');

      expect(result).toEqual(mockConceptData);
      expect(result?.uuid).toBe(mockUUID);
      expect(result?.display).toBe('Temperature');
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('s=byFullySpecifiedName'),
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('name=Temperature'),
      );
    });

    it('should return null when concept is not found', async () => {
      const mockResponse = { results: [] };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchConceptByName('NonExistentConcept');

      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(searchConceptByName('Temperature')).rejects.toThrow(
        mockError,
      );
    });

    it('should URL encode concept name with special characters', async () => {
      const mockResponse = { results: [] };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const conceptName = 'Blood Pressure';
      await searchConceptByName(conceptName);

      expect(api.get).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName&name=${encodeURIComponent(conceptName)}`,
      );
    });
  });
});
