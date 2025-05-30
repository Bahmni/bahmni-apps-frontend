import { get } from '../api';
import { getUserPreferredLocale } from '../translationService';
import {
  fetchAndFormatAllergenConcepts,
  formatAllergenConcepts,
} from '../allergenService';
import { ALLERGEN_TYPES } from '@constants/concepts';
import { AllergenConceptResponse } from '@/types/concepts';

jest.mock('../api');
jest.mock('../translationService');

const mockGet = get as jest.MockedFunction<typeof get>;
const mockGetUserPreferredLocale =
  getUserPreferredLocale as jest.MockedFunction<typeof getUserPreferredLocale>;

describe('allergenService', () => {
  const mockLocale = 'en';

  const mockResponses: Record<string, AllergenConceptResponse> = {
    [ALLERGEN_TYPES.MEDICATION.code]: {
      uuid: ALLERGEN_TYPES.MEDICATION.code,
      setMembers: [
        {
          uuid: '162298AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'ACE inhibitors',
          retired: false,
        },
        {
          uuid: '162299AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Amoxicillin',
          retired: false,
        },
        {
          uuid: '162307AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Old Medication',
          retired: true,
        },
      ],
    },
    [ALLERGEN_TYPES.FOOD.code]: {
      uuid: ALLERGEN_TYPES.FOOD.code,
      setMembers: [
        {
          uuid: '162308AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Dairy Products',
          retired: false,
        },
        {
          uuid: '162317AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Old Food',
          retired: true,
        },
      ],
    },
    [ALLERGEN_TYPES.ENVIRONMENT.code]: {
      uuid: ALLERGEN_TYPES.ENVIRONMENT.code,
      setMembers: [
        {
          uuid: '162318AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Bee Stings',
          retired: false,
        },
        {
          uuid: '162325AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Old Environment',
          retired: true,
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserPreferredLocale.mockReturnValue(mockLocale);
  });

  describe('formatAllergenConcepts', () => {
    it('should format raw concepts with correct types and exclude retired ones', () => {
      const rawConcepts = {
        medication: mockResponses[ALLERGEN_TYPES.MEDICATION.code].setMembers,
        food: mockResponses[ALLERGEN_TYPES.FOOD.code].setMembers,
        environment: mockResponses[ALLERGEN_TYPES.ENVIRONMENT.code].setMembers,
      };

      const result = formatAllergenConcepts(rawConcepts);

      expect(result).toEqual([
        {
          uuid: '162298AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'ACE inhibitors',
          retired: false,
          type: ALLERGEN_TYPES.MEDICATION.display,
        },
        {
          uuid: '162299AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Amoxicillin',
          retired: false,
          type: ALLERGEN_TYPES.MEDICATION.display,
        },
        {
          uuid: '162308AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Dairy Products',
          retired: false,
          type: ALLERGEN_TYPES.FOOD.display,
        },
        {
          uuid: '162318AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Bee Stings',
          retired: false,
          type: ALLERGEN_TYPES.ENVIRONMENT.display,
        },
      ]);
    });

    it('should handle empty set members', () => {
      const rawConcepts = {
        medication: [],
        food: [],
        environment: [],
      };

      const result = formatAllergenConcepts(rawConcepts);
      expect(result).toEqual([]);
    });

    it('should handle missing allergen types', () => {
      const rawConcepts = {
        medication: mockResponses[ALLERGEN_TYPES.MEDICATION.code].setMembers,
      };

      const result = formatAllergenConcepts(rawConcepts);
      expect(result).toEqual([
        {
          uuid: '162298AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'ACE inhibitors',
          retired: false,
          type: ALLERGEN_TYPES.MEDICATION.display,
        },
        {
          uuid: '162299AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Amoxicillin',
          retired: false,
          type: ALLERGEN_TYPES.MEDICATION.display,
        },
      ]);
    });

    it('should handle null or undefined set members', () => {
      const rawConcepts = {
        environment: mockResponses[ALLERGEN_TYPES.ENVIRONMENT.code].setMembers,
      };

      const result = formatAllergenConcepts(rawConcepts);
      expect(result).toEqual([
        {
          uuid: '162318AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Bee Stings',
          retired: false,
          type: ALLERGEN_TYPES.ENVIRONMENT.display,
        },
      ]);
    });

    it('should maintain order of allergen types', () => {
      const rawConcepts = {
        environment: mockResponses[ALLERGEN_TYPES.ENVIRONMENT.code].setMembers,
        medication: mockResponses[ALLERGEN_TYPES.MEDICATION.code].setMembers,
        food: mockResponses[ALLERGEN_TYPES.FOOD.code].setMembers,
      };

      const result = formatAllergenConcepts(rawConcepts);

      // Should still maintain medication -> food -> environment order
      expect(result[0].type).toBe(ALLERGEN_TYPES.MEDICATION.display);
      expect(result[2].type).toBe(ALLERGEN_TYPES.FOOD.display);
      expect(result[3].type).toBe(ALLERGEN_TYPES.ENVIRONMENT.display);
    });
  });

  describe('fetchAndFormatAllergenConcepts', () => {
    it('should fetch and format all allergen concepts', async () => {
      mockGet.mockImplementation((url: string) => {
        const code = url.split('/')[6].split('?')[0];
        return Promise.resolve(mockResponses[code]);
      });

      const result = await fetchAndFormatAllergenConcepts();

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining(ALLERGEN_TYPES.MEDICATION.code),
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining(ALLERGEN_TYPES.FOOD.code),
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining(ALLERGEN_TYPES.ENVIRONMENT.code),
      );

      expect(result).toEqual([
        {
          uuid: '162298AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'ACE inhibitors',
          retired: false,
          type: ALLERGEN_TYPES.MEDICATION.display,
        },
        {
          uuid: '162299AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Amoxicillin',
          retired: false,
          type: ALLERGEN_TYPES.MEDICATION.display,
        },
        {
          uuid: '162308AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Dairy Products',
          retired: false,
          type: ALLERGEN_TYPES.FOOD.display,
        },
        {
          uuid: '162318AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Bee Stings',
          retired: false,
          type: ALLERGEN_TYPES.ENVIRONMENT.display,
        },
      ]);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockGet.mockRejectedValue(error);

      await expect(fetchAndFormatAllergenConcepts()).rejects.toThrow(error);
    });

    it('should handle partial API failures', async () => {
      mockGet.mockImplementation((url: string) => {
        const code = url.split('/')[6].split('?')[0];
        if (code === ALLERGEN_TYPES.MEDICATION.code) {
          return Promise.reject(new Error('API Error'));
        }
        return Promise.resolve(mockResponses[code]);
      });

      await expect(fetchAndFormatAllergenConcepts()).rejects.toThrow(
        'API Error',
      );
    });

    it('should handle malformed API responses', async () => {
      mockGet.mockImplementation(() =>
        Promise.resolve({
          uuid: 'test-uuid',
          // Missing setMembers property
        }),
      );

      const result = await fetchAndFormatAllergenConcepts();
      expect(result).toEqual([]);
    });

    it('should handle all empty setMembers', async () => {
      mockGet.mockImplementation(() =>
        Promise.resolve({
          uuid: 'test-uuid',
          setMembers: [],
        }),
      );

      const result = await fetchAndFormatAllergenConcepts();
      expect(result).toEqual([]);
    });

    it('should handle undefined/null responses', async () => {
      mockGet.mockImplementation((url: string) => {
        const code = url.split('/')[6].split('?')[0];
        if (code === ALLERGEN_TYPES.MEDICATION.code) {
          return Promise.resolve(undefined);
        }
        if (code === ALLERGEN_TYPES.FOOD.code) {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockResponses[code]);
      });

      const result = await fetchAndFormatAllergenConcepts();

      // Should only contain environment allergens since others are undefined/null
      expect(result).toEqual([
        {
          uuid: '162318AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Bee Stings',
          retired: false,
          type: ALLERGEN_TYPES.ENVIRONMENT.display,
        },
      ]);
    });

    it('should use correct locale in API calls', async () => {
      const customLocale = 'fr';
      mockGetUserPreferredLocale.mockReturnValue(customLocale);

      mockGet.mockImplementation((url: string) => {
        const code = url.split('/')[6].split('?')[0];
        return Promise.resolve(mockResponses[code]);
      });

      await fetchAndFormatAllergenConcepts();

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining(`locale=${customLocale}`),
      );
    });
  });
});
