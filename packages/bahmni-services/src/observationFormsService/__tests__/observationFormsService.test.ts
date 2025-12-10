import { getUserPreferredLocale } from '../../i18n/translationService';
import { OBSERVATION_FORMS_URL } from '../constants';
import { fetchObservationForms } from '../observationFormsService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock translation service
jest.mock('../../i18n/translationService', () => ({
  getUserPreferredLocale: jest.fn(),
}));

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('observationFormsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('fetchObservationForms', () => {
    it('should fetch, normalize and transform forms data successfully', async () => {
      const mockApiResponse = [
        {
          uuid: 'form-uuid-1',
          name: 'Test Form',
          id: 1,
          privileges: [
            {
              privilegeName: 'app:clinical:observationForms',
              editable: true,
            },
          ],
          nameTranslation: '[{"display":"Formulario","locale":"es"}]',
        },
        {
          uuid: 'form-uuid-2',
          name: 'Another Form',
          id: 2,
          privileges: [],
          nameTranslation: '[]',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('es');

      const result = await fetchObservationForms();

      expect(mockFetch).toHaveBeenCalledWith(OBSERVATION_FORMS_URL);
      expect(result).toEqual([
        {
          uuid: 'form-uuid-1',
          name: 'Formulario', // Should use translated name
          id: 1,
          privileges: [
            {
              privilegeName: 'app:clinical:observationForms',
              editable: true,
            },
          ],
        },
        {
          uuid: 'form-uuid-2',
          name: 'Another Form', // Should fallback to original name
          id: 2,
          privileges: [],
        },
      ]);
    });

    it('should throw error for HTTP failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchObservationForms()).rejects.toThrow(
        'HTTP error! status for latestPublishedForms: 500',
      );
    });

    it('should handle translation with multiple locales', async () => {
      const mockApiResponse = [
        {
          uuid: 'form-uuid-1',
          name: 'Original Name',
          id: 1,
          privileges: [],
          nameTranslation:
            '[{"display":"Nombre Español","locale":"es"},{"display":"English Name","locale":"en"}]',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');

      const result = await fetchObservationForms();

      expect(result[0].name).toBe('English Name');
    });

    it('should fallback to original name when locale has no translation', async () => {
      const mockApiResponse = [
        {
          uuid: 'form-uuid-1',
          name: 'Original Name',
          id: 1,
          privileges: [],
          nameTranslation: '[{"display":"Nombre Español","locale":"es"}]',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('fr'); // Locale not in translations

      const result = await fetchObservationForms();

      expect(result[0].name).toBe('Original Name');
    });

    it('should handle empty translations array', async () => {
      const mockApiResponse = [
        {
          uuid: 'form-uuid-1',
          name: 'Original Name',
          id: 1,
          privileges: [],
          nameTranslation: '[]', // Empty translations
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('es');

      const result = await fetchObservationForms();

      expect(result[0].name).toBe('Original Name');
    });

    it('should properly map privileges from API to domain model', async () => {
      const mockApiResponse = [
        {
          uuid: 'form-uuid-1',
          name: 'Test Form',
          id: 1,
          privileges: [
            {
              privilegeName: 'app:clinical:observationForms',
              editable: true,
            },
            {
              privilegeName: 'app:clinical:readOnly',
              editable: false,
            },
          ],
          nameTranslation: '[]',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');

      const result = await fetchObservationForms();

      expect(result[0].privileges).toEqual([
        {
          privilegeName: 'app:clinical:observationForms',
          editable: true,
        },
        {
          privilegeName: 'app:clinical:readOnly',
          editable: false,
        },
      ]);
    });

    it('should handle forms with empty privileges array', async () => {
      const mockApiResponse = [
        {
          uuid: 'form-uuid-1',
          name: 'Test Form',
          id: 1,
          privileges: [], // Empty privileges
          nameTranslation: '[]',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');

      const result = await fetchObservationForms();

      expect(result[0].privileges).toEqual([]);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(fetchObservationForms()).rejects.toThrow('Network error');
    });

    it('should handle empty array response from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');

      const result = await fetchObservationForms();

      expect(result).toEqual([]);
    });

    it('should handle non-array response from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'No forms available' }),
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');

      const result = await fetchObservationForms();

      expect(result).toEqual([]);
    });
  });
});
