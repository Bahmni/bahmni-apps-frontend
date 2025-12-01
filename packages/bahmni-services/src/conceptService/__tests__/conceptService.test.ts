import { ValueSet } from 'fhir/r4';
import * as api from '../../api';
import { getUserPreferredLocale } from '../../i18n/translationService';
import {
  searchConcepts,
  searchFHIRConcepts,
  searchFHIRConceptsByName,
  getConceptById,
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

  describe('getConceptById', () => {
    const mockUUID = '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const mockConceptData = {
      uuid: mockUUID,
      display: 'Temperature',
      name: {
        display: 'Temperature',
        uuid: '162556AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        name: 'Temperature',
        locale: 'en',
        localePreferred: true,
        conceptNameType: 'FULLY_SPECIFIED',
        links: [
          {
            rel: 'self',
            uri: `/openmrs/ws/rest/v1/concept/${mockUUID}/name/162556AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`,
            resourceAlias: 'name',
          },
        ],
        resourceVersion: '1.9',
      },
      datatype: {
        uuid: '8d4a4488-c2cc-11de-8d13-0010c6dffd0f',
        display: 'Numeric',
        links: [
          {
            rel: 'self',
            uri: '/openmrs/ws/rest/v1/conceptdatatype/8d4a4488-c2cc-11de-8d13-0010c6dffd0f',
          },
        ],
      },
      conceptClass: {
        uuid: '8d4907b2-c2cc-11de-8d13-0010c6dffd0f',
        display: 'Test',
        links: [
          {
            rel: 'self',
            uri: '/openmrs/ws/rest/v1/conceptclass/8d4907b2-c2cc-11de-8d13-0010c6dffd0f',
          },
        ],
      },
      set: false,
      version: '1.0',
      retired: false,
      names: [],
      descriptions: [],
      mappings: [],
      answers: [],
      setMembers: [],
      attributes: [],
      links: [
        {
          rel: 'self',
          uri: `/openmrs/ws/rest/v1/concept/${mockUUID}`,
          resourceAlias: 'concept',
        },
      ],
      resourceVersion: '1.9',
    };

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

    it('should handle 404 not found errors', async () => {
      const notFoundError = new Error('Concept not found');
      notFoundError.name = 'NotFoundError';
      (api.get as jest.Mock).mockRejectedValue(notFoundError);

      await expect(getConceptById('invalid-uuid')).rejects.toThrow(
        notFoundError,
      );
    });

    it('should work with different UUID formats', async () => {
      const shortUUID = '12345';
      await getConceptById(shortUUID);

      expect(api.get).toHaveBeenCalledWith(CONCEPT_GET_URL(shortUUID));
    });

    it('should handle empty UUID', async () => {
      const emptyUUID = '';
      await getConceptById(emptyUUID);

      expect(api.get).toHaveBeenCalledWith(CONCEPT_GET_URL(emptyUUID));
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
});
