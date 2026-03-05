import { get } from '../../api';
import { TAB_PRACTITIONER_TYPE_MAP } from '../constants';
import {
  fetchProvidersByTab,
  Provider,
  ProviderResponse,
} from '../providerService';

jest.mock('../../api', () => ({
  get: jest.fn(),
}));

const mockGet = get as jest.MockedFunction<typeof get>;

describe('providerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProvidersByTab', () => {
    describe('Happy Paths', () => {
      it('should fetch providers for a valid tab label', async () => {
        const mockResponse: ProviderResponse = {
          results: [
            {
              id: 'provider-1',
              name: 'Dr. Smith',
              uuid: 'uuid-1',
            },
            {
              id: 'provider-2',
              name: 'Dr. Jones',
              uuid: 'uuid-2',
            },
          ],
        };

        mockGet.mockResolvedValueOnce(mockResponse);

        const result = await fetchProvidersByTab('Radiology Order');

        expect(mockGet).toHaveBeenCalledWith(
          '/openmrs/ws/rest/v1//provider?v=custom:(id,name,uuid)&attrName=practitioner_type&attrValue=Radiology%20Technologist',
        );
        expect(result).toEqual([
          {
            id: 'uuid-1',
            name: 'Dr. Smith',
            uuid: 'uuid-1',
          },
          {
            id: 'uuid-2',
            name: 'Dr. Jones',
            uuid: 'uuid-2',
          },
        ]);
      });

      it('should use uuid as id when uuid is present', async () => {
        mockGet.mockReset();
        const mockResponse: ProviderResponse = {
          results: [
            {
              id: 'old-id',
              name: 'Dr. Smith',
              uuid: 'new-uuid',
            },
          ],
        };

        mockGet.mockResolvedValueOnce(mockResponse);

        const result = await fetchProvidersByTab('P&O Order');

        expect(result[0].id).toBe('new-uuid');
      });

      it('should use id as fallback when uuid is missing', async () => {
        mockGet.mockReset();
        const mockResponse: ProviderResponse = {
          results: [
            {
              id: 'provider-id',
              name: 'Dr. Smith',
              uuid: '',
            },
          ],
        };

        mockGet.mockResolvedValueOnce(mockResponse);

        const result = await fetchProvidersByTab('Rehab Order');

        expect(result[0].id).toBe('provider-id');
      });

      it('should fetch providers for all configured tab labels', async () => {
        mockGet.mockReset();
        const tabLabels = Object.keys(TAB_PRACTITIONER_TYPE_MAP);

        for (const tabLabel of tabLabels) {
          const mockResponse: ProviderResponse = {
            results: [
              {
                id: 'provider-1',
                name: 'Test Provider',
                uuid: 'uuid-1',
              },
            ],
          };

          mockGet.mockResolvedValueOnce(mockResponse);

          const result = await fetchProvidersByTab(tabLabel);

          expect(result).toHaveLength(1);
          expect(result[0].name).toBe('Test Provider');
        }
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array for unmapped tab label', async () => {
        const result = await fetchProvidersByTab('Unknown Order Type');

        expect(mockGet).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should return empty array when response is null', async () => {
        mockGet.mockReset();
        mockGet.mockResolvedValueOnce(null);

        const result = await fetchProvidersByTab('Radiology Order');

        expect(result).toEqual([]);
      });

      it('should return empty array when results is undefined', async () => {
        mockGet.mockReset();
        mockGet.mockResolvedValueOnce({} as ProviderResponse);

        const result = await fetchProvidersByTab('Speech Therapy Order');

        expect(result).toEqual([]);
      });

      it('should return empty array when results is not an array', async () => {
        mockGet.mockReset();
        mockGet.mockResolvedValueOnce({ results: 'not-an-array' } as any);

        const result = await fetchProvidersByTab('Rehab Order');

        expect(result).toEqual([]);
      });

      it('should return empty array when results is empty', async () => {
        mockGet.mockReset();
        const mockResponse: ProviderResponse = {
          results: [],
        };

        mockGet.mockResolvedValueOnce(mockResponse);

        const result = await fetchProvidersByTab('P&O Order');

        expect(result).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      it('should return empty array when API call throws error', async () => {
        mockGet.mockReset();
        mockGet.mockRejectedValueOnce(new Error('API Error'));

        const result = await fetchProvidersByTab('Radiology Order');

        expect(result).toEqual([]);
      });

      it('should return empty array when API call throws network error', async () => {
        mockGet.mockReset();
        mockGet.mockRejectedValueOnce(new Error('Network Error'));

        const result = await fetchProvidersByTab('Rehab Order');

        expect(result).toEqual([]);
      });

      it('should return empty array when API returns 404', async () => {
        mockGet.mockReset();
        mockGet.mockRejectedValueOnce({ status: 404, message: 'Not Found' });

        const result = await fetchProvidersByTab('Speech Therapy Order');

        expect(result).toEqual([]);
      });

      it('should return empty array when API returns 500', async () => {
        mockGet.mockReset();
        mockGet.mockRejectedValueOnce({
          status: 500,
          message: 'Internal Server Error',
        });

        const result = await fetchProvidersByTab('Radiology Order');

        expect(result).toEqual([]);
      });
    });

    describe('Data Mapping', () => {
      it('should correctly map all provider fields', async () => {
        mockGet.mockReset();
        const mockResponse: ProviderResponse = {
          results: [
            {
              id: 'provider-id-123',
              name: 'Dr. Sarah Johnson',
              uuid: 'provider-uuid-456',
            },
          ],
        };

        mockGet.mockResolvedValueOnce(mockResponse);

        const result = await fetchProvidersByTab('Radiology Order');

        expect(result[0]).toEqual({
          id: 'provider-uuid-456',
          name: 'Dr. Sarah Johnson',
          uuid: 'provider-uuid-456',
        });
      });

      it('should handle providers with special characters in name', async () => {
        mockGet.mockReset();
        const mockResponse: ProviderResponse = {
          results: [
            {
              id: 'provider-1',
              name: "Dr. O'Brien-Smith",
              uuid: 'uuid-1',
            },
          ],
        };

        mockGet.mockResolvedValueOnce(mockResponse);

        const result = await fetchProvidersByTab('Rehab Order');

        expect(result[0].name).toBe("Dr. O'Brien-Smith");
      });

      it('should handle multiple providers correctly', async () => {
        mockGet.mockReset();
        const mockResponse: ProviderResponse = {
          results: [
            { id: 'id-1', name: 'Provider 1', uuid: 'uuid-1' },
            { id: 'id-2', name: 'Provider 2', uuid: 'uuid-2' },
            { id: 'id-3', name: 'Provider 3', uuid: 'uuid-3' },
            { id: 'id-4', name: 'Provider 4', uuid: 'uuid-4' },
            { id: 'id-5', name: 'Provider 5', uuid: 'uuid-5' },
          ],
        };

        mockGet.mockResolvedValueOnce(mockResponse);

        const result = await fetchProvidersByTab('Rehab Order');

        expect(result).toHaveLength(5);
        expect(result.map((p) => p.name)).toEqual([
          'Provider 1',
          'Provider 2',
          'Provider 3',
          'Provider 4',
          'Provider 5',
        ]);
      });
    });

    describe('URL Construction', () => {
      it('should construct correct URL with URL-encoded practitioner type', async () => {
        mockGet.mockReset();
        mockGet.mockResolvedValueOnce({ results: [] });

        await fetchProvidersByTab('Radiology Order');

        expect(mockGet).toHaveBeenCalledWith(
          expect.stringContaining('attrValue=Radiology%20Technologist'),
        );
      });

      it('should construct correct URL for Speech Therapy Order', async () => {
        mockGet.mockReset();
        mockGet.mockResolvedValueOnce({ results: [] });

        await fetchProvidersByTab('Speech Therapy Order');

        expect(mockGet).toHaveBeenCalledWith(
          expect.stringContaining('attrValue=Speech%20Therapist'),
        );
      });

      it('should include all required query parameters', async () => {
        mockGet.mockReset();
        mockGet.mockResolvedValueOnce({ results: [] });

        await fetchProvidersByTab('P&O Order');

        const expectedUrl =
          '/openmrs/ws/rest/v1//provider?v=custom:(id,name,uuid)&attrName=practitioner_type&attrValue=PandO%20Technician';
        expect(mockGet).toHaveBeenCalledWith(expectedUrl);
      });
    });

    describe('Provider Interface', () => {
      it('should return providers matching the Provider interface', async () => {
        mockGet.mockReset();
        const mockResponse: ProviderResponse = {
          results: [
            {
              id: 'test-id',
              name: 'Test Provider',
              uuid: 'test-uuid',
            },
          ],
        };

        mockGet.mockResolvedValueOnce(mockResponse);

        const result: Provider[] = await fetchProvidersByTab('Radiology Order');

        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('uuid');
        expect(typeof result[0].id).toBe('string');
        expect(typeof result[0].name).toBe('string');
        expect(typeof result[0].uuid).toBe('string');
      });
    });
  });
});
