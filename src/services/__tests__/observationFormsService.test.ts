import { OBSERVATION_FORMS_URL } from '@constants/app';
import { FormApiResponse } from '../../types/observationForms';
import {
  fetchObservationForms,
  fetchAndNormalizeFormsData,
  getTranslatedFormName,
  transformToObservationForm,
} from '../observationFormsService';
import * as translationService from '../translationService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock translation service
jest.mock('../translationService', () => ({
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

  describe('fetchAndNormalizeFormsData', () => {
    it('should fetch data and return array response', async () => {
      const mockApiResponse = [
        {
          uuid: 'form-uuid-1',
          name: 'Test Form',
          id: 1,
          privileges: [],
          nameTranslation: '',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchAndNormalizeFormsData();

      expect(mockFetch).toHaveBeenCalledWith(OBSERVATION_FORMS_URL);
      expect(result).toEqual(mockApiResponse);
    });

    it('should return empty array for non-array response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await fetchAndNormalizeFormsData();

      expect(result).toEqual([]);
    });

    it('should throw error for HTTP failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchAndNormalizeFormsData()).rejects.toThrow(
        'HTTP error! status for latestPublishedForms: 500',
      );
    });
  });

  describe('getTranslatedFormName', () => {
    const mockForm: FormApiResponse = {
      uuid: 'form-uuid-1',
      name: 'Original Name',
      id: 1,
      privileges: [],
      nameTranslation:
        '[{"display":"Nombre Español","locale":"es"},{"display":"English Name","locale":"en"}]',
    };

    it('should return translated name when locale matches', () => {
      const result = getTranslatedFormName(mockForm, 'es');
      expect(result).toBe('Nombre Español');
    });

    it('should return original name when locale has no translation', () => {
      const result = getTranslatedFormName(mockForm, 'fr');
      expect(result).toBe('Original Name');
    });

    it('should handle empty translations array', () => {
      const formWithEmptyTranslations = { ...mockForm, nameTranslation: '[]' };
      const result = getTranslatedFormName(formWithEmptyTranslations, 'es');
      expect(result).toBe('Original Name');
    });
  });

  describe('transformToObservationForm', () => {
    const mockApiForm: FormApiResponse = {
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
      nameTranslation: '[{"display":"Formulario de Prueba","locale":"es"}]',
    };

    it('should transform API form to domain model', () => {
      const result = transformToObservationForm(mockApiForm, 'en');

      expect(result).toEqual({
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
      });
    });

    it('should use translated name when available', () => {
      const result = transformToObservationForm(mockApiForm, 'es');

      expect(result.name).toBe('Formulario de Prueba');
    });

    it('should handle empty privileges array', () => {
      const formWithoutPrivileges = { ...mockApiForm, privileges: [] };
      const result = transformToObservationForm(formWithoutPrivileges, 'en');

      expect(result.privileges).toEqual([]);
    });
  });

  describe('fetchObservationForms', () => {
    it('should orchestrate fetching and transforming forms', async () => {
      const mockApiResponse = [
        {
          uuid: 'form-uuid-1',
          name: 'Test Form',
          id: 1,
          privileges: [],
          nameTranslation: '[{"display":"Formulario","locale":"es"}]',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (translationService.getUserPreferredLocale as jest.Mock).mockReturnValue(
        'es',
      );

      const result = await fetchObservationForms();

      expect(result).toEqual([
        {
          uuid: 'form-uuid-1',
          name: 'Formulario',
          id: 1,
          privileges: [],
        },
      ]);
    });
  });
});
