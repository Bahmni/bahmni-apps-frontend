import * as api from '../../api/api';
import { getUserPreferredLocale } from '../../i18n/translationService';
import { OBSERVATION_FORMS_URL, FORM_DATA_URL } from '../constants';
import {
  fetchObservationForms,
  fetchFormMetadata,
  fetchFormUuidByObservationDate,
  getPatientFormData,
} from '../observationFormsService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock translation service
jest.mock('../../i18n/translationService', () => ({
  getUserPreferredLocale: jest.fn(),
}));

// Mock api module
jest.mock('../../api/api', () => ({
  get: jest.fn(),
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

      expect(mockFetch).toHaveBeenCalledWith(OBSERVATION_FORMS_URL());
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

    it('should append episodeUuid as query param when episodeUuids array is provided', async () => {
      const episodeUuids = ['episode-uuid-123', 'episode-uuid-456'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');

      await fetchObservationForms(episodeUuids);

      expect(mockFetch).toHaveBeenCalledWith(
        OBSERVATION_FORMS_URL('episode-uuid-123,episode-uuid-456'),
      );
      expect(mockFetch.mock.calls[0][0]).toContain(
        '?episodeUuid=episode-uuid-123,episode-uuid-456',
      );
    });

    it('should use base URL without query params when episodeUuids is not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');

      await fetchObservationForms();

      expect(mockFetch).toHaveBeenCalledWith(OBSERVATION_FORMS_URL());
      expect(mockFetch.mock.calls[0][0]).not.toContain('?');
    });

    it('should use base URL without query params when episodeUuids is empty array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');

      await fetchObservationForms([]);

      expect(mockFetch).toHaveBeenCalledWith(OBSERVATION_FORMS_URL());
      expect(mockFetch.mock.calls[0][0]).not.toContain('?');
    });
  });

  describe('getPatientFormData', () => {
    const mockGet = api.get as jest.MockedFunction<typeof api.get>;

    beforeEach(() => {
      mockGet.mockClear();
    });

    it('should fetch patient form data successfully with valid patientUuid', async () => {
      const patientUuid = 'patient-uuid-123';
      const mockFormData = [
        {
          formType: 'v2',
          formName: 'Vitals',
          formVersion: 1,
          visitUuid: 'visit-uuid-1',
          visitStartDateTime: 1609459200000,
          encounterUuid: 'encounter-uuid-1',
          encounterDateTime: 1609459200000,
          providers: [
            {
              providerName: 'Dr. Smith',
              uuid: 'provider-uuid-1',
            },
          ],
        },
        {
          formType: 'v2',
          formName: 'History and Examination',
          formVersion: 2,
          visitUuid: 'visit-uuid-2',
          visitStartDateTime: 1609545600000,
          encounterUuid: 'encounter-uuid-2',
          encounterDateTime: 1609545600000,
          providers: [
            {
              providerName: 'Dr. Jones',
              uuid: 'provider-uuid-2',
            },
          ],
        },
      ];

      mockGet.mockResolvedValueOnce(mockFormData);

      const result = await getPatientFormData(patientUuid);

      expect(mockGet).toHaveBeenCalledWith(
        FORM_DATA_URL(patientUuid, undefined),
      );
      expect(result).toEqual(mockFormData);
    });

    it('should fetch patient form data with numberOfVisits parameter', async () => {
      const patientUuid = 'patient-uuid-123';
      const numberOfVisits = 5;
      const mockFormData = [
        {
          formType: 'v2',
          formName: 'Vitals',
          formVersion: 1,
          visitUuid: 'visit-uuid-1',
          visitStartDateTime: 1609459200000,
          encounterUuid: 'encounter-uuid-1',
          encounterDateTime: 1609459200000,
          providers: [],
        },
      ];

      mockGet.mockResolvedValueOnce(mockFormData);

      const result = await getPatientFormData(
        patientUuid,
        undefined,
        numberOfVisits,
      );

      expect(mockGet).toHaveBeenCalledWith(
        FORM_DATA_URL(patientUuid, numberOfVisits, undefined),
      );
      expect(result).toEqual(mockFormData);
    });

    it('should return empty array when API returns non-array data', async () => {
      const patientUuid = 'patient-uuid-123';

      mockGet.mockResolvedValueOnce({ message: 'No data' } as any);

      const result = await getPatientFormData(patientUuid);

      expect(result).toEqual([]);
    });

    it('should pass episodeUuids as a comma-separated query param', async () => {
      const patientUuid = 'patient-uuid-123';
      mockGet.mockResolvedValueOnce([]);

      await getPatientFormData(patientUuid, ['ep-1', 'ep-2']);

      expect(mockGet).toHaveBeenCalledWith(
        FORM_DATA_URL(patientUuid, undefined, 'ep-1,ep-2'),
      );
    });
  });

  describe('fetchFormMetadata', () => {
    const formUuid = 'form-uuid-123';

    const makeResponse = (overrides: Record<string, unknown> = {}) => ({
      uuid: formUuid,
      name: 'Vitals',
      version: '18',
      published: true,
      resources: [
        {
          value: JSON.stringify({
            name: 'Vitals',
            uuid: formUuid,
            version: '1',
            controls: [],
          }),
        },
      ],
      ...overrides,
    });

    it('uses OpenMRS record fields (uuid, name, version, published) when present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => makeResponse(),
      });

      const result = await fetchFormMetadata(formUuid);

      expect(result.uuid).toBe(formUuid);
      expect(result.name).toBe('Vitals');
      expect(result.version).toBe('18');
      expect(result.published).toBe(true);
    });

    it('falls back to schema JSON fields when OpenMRS record fields are absent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: [
            {
              value: JSON.stringify({
                name: 'Vitals',
                uuid: 'schema-uuid',
                version: '1',
                controls: [],
              }),
            },
          ],
        }),
      });

      const result = await fetchFormMetadata(formUuid);

      expect(result.name).toBe('Vitals');
      expect(result.uuid).toBe('schema-uuid');
      expect(result.version).toBe('1');
      expect(result.published).toBe(false);
    });

    it('calls the translations endpoint when schema has translationsUrl', async () => {
      (getUserPreferredLocale as jest.Mock).mockReturnValue('en');
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            makeResponse({
              resources: [
                {
                  value: JSON.stringify({
                    name: 'Vitals',
                    uuid: formUuid,
                    version: '18',
                    controls: [],
                    translationsUrl:
                      '/openmrs/ws/rest/v1/bahmniie/form/translations',
                  }),
                },
              ],
            }),
        })
        .mockResolvedValueOnce({ ok: false }); // translations fetch fails gracefully

      const result = await fetchFormMetadata(formUuid);

      // Two fetches: metadata + translations
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Falls back to empty translations when fetch is not ok
      expect(result.translations).toEqual({ labels: {}, concepts: {} });
    });

    it('throws when the API returns a non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(fetchFormMetadata(formUuid)).rejects.toThrow(
        `Failed to fetch form metadata for ${formUuid}: 404`,
      );
    });

    it('throws when the form has no resources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resources: [] }),
      });

      await expect(fetchFormMetadata(formUuid)).rejects.toThrow(
        `No resources found for form ${formUuid}`,
      );
    });
  });

  describe('fetchFormUuidByObservationDate', () => {
    const jul10 = new Date('2026-07-10T10:00:00Z').getTime();
    const jul1 = new Date('2026-07-01T00:00:00Z').getTime();

    const makeForm = (
      uuid: string,
      dateCreated: string,
      version = '1',
      published = true,
    ) => ({
      uuid,
      name: 'Vitals',
      version,
      published,
      auditInfo: { dateCreated },
    });

    it('uses version-string match when formVersion > 1 (new encounters)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            makeForm('uuid-v1', '2026-07-01T00:00:00Z', '1'),
            makeForm('uuid-v18', '2026-07-08T00:00:00Z', '18'),
            makeForm('uuid-v19', '2026-07-15T00:00:00Z', '19'),
          ],
        }),
      });

      const result = await fetchFormUuidByObservationDate('Vitals', 18, jul10);

      expect(result).toBe('uuid-v18');
    });

    it('falls back to date-based when formVersion is 1 (old encounters)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            makeForm('uuid-v1', '2026-07-01T00:00:00Z', '1'),
            makeForm('uuid-v2', '2026-07-05T00:00:00Z', '2'),
            makeForm('uuid-v3', '2026-07-15T00:00:00Z', '3'), // after encounter
          ],
        }),
      });

      const result = await fetchFormUuidByObservationDate('Vitals', 1, jul10);

      expect(result).toBe('uuid-v2');
    });

    it('returns most recently published form before encounterDateTime', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            makeForm('uuid-v1', '2026-07-01T00:00:00Z', '1'),
            makeForm('uuid-v2', '2026-07-05T00:00:00Z', '2'),
            makeForm('uuid-v3', '2026-07-15T00:00:00Z', '3'),
          ],
        }),
      });

      const result = await fetchFormUuidByObservationDate(
        'Vitals',
        undefined,
        jul10,
      );

      expect(result).toBe('uuid-v2');
    });

    it('falls back to oldest form when all forms post-date the encounter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [makeForm('uuid-v1', '2026-08-01T00:00:00Z', '1')],
        }),
      });

      const result = await fetchFormUuidByObservationDate(
        'Vitals',
        undefined,
        jul1,
      );

      expect(result).toBe('uuid-v1');
    });

    it('returns oldest form when no date is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            makeForm('uuid-v2', '2026-07-05T00:00:00Z', '2'),
            makeForm('uuid-v1', '2026-07-01T00:00:00Z', '1'),
          ],
        }),
      });

      const result = await fetchFormUuidByObservationDate(
        'Vitals',
        undefined,
        undefined,
      );

      expect(result).toBe('uuid-v1');
    });

    it('excludes unpublished forms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            makeForm('uuid-v1', '2026-07-01T00:00:00Z', '1', false),
            makeForm('uuid-v2', '2026-07-05T00:00:00Z', '2', true),
          ],
        }),
      });

      const result = await fetchFormUuidByObservationDate(
        'Vitals',
        undefined,
        jul10,
      );

      expect(result).toBe('uuid-v2');
    });

    it('returns null when the API call fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await fetchFormUuidByObservationDate(
        'Vitals',
        undefined,
        jul10,
      );

      expect(result).toBeNull();
    });

    it('returns null when no published forms match the name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await fetchFormUuidByObservationDate(
        'Vitals',
        undefined,
        jul10,
      );

      expect(result).toBeNull();
    });
  });
});
