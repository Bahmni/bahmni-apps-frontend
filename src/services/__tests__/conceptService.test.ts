import { searchConcepts, searchFHIRConcepts } from '../conceptService';
import * as api from '../api';
import * as translationService from '../translationService';
import { ValueSet } from 'fhir/r4';
import { FHIR_VALUESET_URL } from '@constants/app';

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
                display: 'Mental status change'
              },
              {
                code: '121629AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                display: 'Anaemia'
              }
            ]
          }
        ]
      }
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
});
