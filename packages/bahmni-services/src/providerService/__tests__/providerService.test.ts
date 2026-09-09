import { get } from '../../api';
import {
  mockUserUUID,
  mockProviderResponse,
  mockProviderWithLoginLocations,
  mockProviderWithoutAttributes,
  mockProviderPage1,
  mockProviderPage2,
  mockProviderPage3,
  mockSinglePageResponse,
  mockEmptyProvidersResponse,
} from '../__mocks__/mocks';
import { ALL_PROVIDERS_URL, PROVIDER_RESOURCE_URL } from '../constants';
import {
  fetchAllProviders,
  getCurrentProvider,
  getProviderLoginLocations,
} from '../providerService';

jest.mock('../../api');

describe('providerService', () => {
  beforeEach(() => {
    (get as jest.Mock).mockReset();
  });

  describe('getCurrentProvider', () => {
    it('should fetch provider using userUUID', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockProviderResponse);

      const result = await getCurrentProvider(mockUserUUID);

      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
      expect(result).toEqual(mockProviderResponse.results[0]);
    });

    it('should return null if provider results are empty', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ results: [] });

      const result = await getCurrentProvider(mockUserUUID);

      expect(result).toBeNull();
      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
    });

    it('should return null if provider results are null', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ results: null });

      const result = await getCurrentProvider(mockUserUUID);

      expect(result).toBeNull();
      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
    });

    it('should throw error if provider API call fails', async () => {
      const mockError = new Error('Provider API Error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getCurrentProvider(mockUserUUID)).rejects.toThrow(
        'Provider API Error',
      );
      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
    });
  });

  describe('getProviderLoginLocations', () => {
    it('should fetch all login locations with their tags', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockProviderWithLoginLocations);

      const result = await getProviderLoginLocations(mockUserUUID);

      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        uuid: 'location-uuid-1',
        display: 'General OPD',
        childLocations: [],
        tags: [{ display: 'Appointment Location' }],
      });
      expect(result[1]).toEqual({
        uuid: 'location-uuid-2',
        display: 'ENT Ward',
        childLocations: [],
        tags: [{ display: 'Appointment Location' }],
      });
      expect(result[2]).toEqual({
        uuid: 'location-uuid-3',
        display: 'Admin Office',
        childLocations: [],
        tags: [{ display: 'Admin' }],
      });
    });

    it('should return empty array when no provider results', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ results: [] });

      const result = await getProviderLoginLocations(mockUserUUID);

      expect(result).toEqual([]);
    });

    it('should return empty array when provider has no attributes', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockProviderWithoutAttributes);

      const result = await getProviderLoginLocations(mockUserUUID);

      expect(result).toEqual([]);
    });

    it('should filter out voided attributes', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockProviderWithLoginLocations);

      const result = await getProviderLoginLocations(mockUserUUID);

      const voidedLocation = result.find(
        (loc) => loc.display === 'Voided Location',
      );
      expect(voidedLocation).toBeUndefined();
    });

    it('should throw error if getProviderLoginLocations API call fails', async () => {
      const mockError = new Error('Provider Login Locations API Error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getProviderLoginLocations(mockUserUUID)).rejects.toThrow(
        'Provider Login Locations API Error',
      );
    });
  });

  describe('fetchAllProviders', () => {
    it('should fetch all providers from multiple pages', async () => {
      (get as jest.Mock)
        .mockResolvedValueOnce(mockProviderPage1)
        .mockResolvedValueOnce(mockProviderPage2)
        .mockResolvedValueOnce(mockProviderPage3);

      const result = await fetchAllProviders();

      expect(get).toHaveBeenCalledTimes(3);
      expect(get).toHaveBeenNthCalledWith(1, ALL_PROVIDERS_URL);
      expect(get).toHaveBeenNthCalledWith(
        2,
        'http://localhost/openmrs/ws/rest/v1/provider?startIndex=1',
      );
      expect(get).toHaveBeenNthCalledWith(
        3,
        'http://localhost/openmrs/ws/rest/v1/provider?startIndex=2',
      );
      expect(result).toHaveLength(3);
      expect(result[0].uuid).toBe('provider-uuid-1');
      expect(result[1].uuid).toBe('provider-uuid-2');
      expect(result[2].uuid).toBe('provider-uuid-3');
    });

    it('should return providers from single page when no next link', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockSinglePageResponse);

      const result = await fetchAllProviders();

      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(ALL_PROVIDERS_URL);
      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('provider-uuid-1');
    });

    it('should return empty array when no providers exist', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyProvidersResponse);

      const result = await fetchAllProviders();

      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(ALL_PROVIDERS_URL);
      expect(result).toEqual([]);
    });

    it('should handle response with undefined results', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ results: undefined });

      const result = await fetchAllProviders();

      expect(get).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should handle response with undefined links', async () => {
      const responseWithoutLinks = {
        results: mockProviderPage1.results,
      };
      (get as jest.Mock).mockResolvedValueOnce(responseWithoutLinks);

      const result = await fetchAllProviders();

      expect(get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it('should handle response with empty links array', async () => {
      const responseWithEmptyLinks = {
        results: mockProviderPage1.results,
        links: [],
      };
      (get as jest.Mock).mockResolvedValueOnce(responseWithEmptyLinks);

      const result = await fetchAllProviders();

      expect(get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it('should ignore non-next links', async () => {
      const responseWithOtherLinks = {
        results: mockProviderPage1.results,
        links: [
          {
            rel: 'self',
            uri: 'http://localhost/openmrs/ws/rest/v1/provider',
            resourceAlias: 'provider',
          },
          {
            rel: 'prev',
            uri: 'http://localhost/openmrs/ws/rest/v1/provider?startIndex=0',
            resourceAlias: 'provider',
          },
        ],
      };
      (get as jest.Mock).mockResolvedValueOnce(responseWithOtherLinks);

      const result = await fetchAllProviders();

      expect(get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it('should throw error if API call fails on first page', async () => {
      const mockError = new Error('Fetch All Providers API Error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(fetchAllProviders()).rejects.toThrow(
        'Fetch All Providers API Error',
      );
      expect(get).toHaveBeenCalledTimes(1);
    });

    it('should throw error if API call fails on subsequent page', async () => {
      const mockError = new Error('Fetch All Providers Page 2 Error');
      (get as jest.Mock)
        .mockResolvedValueOnce(mockProviderPage1)
        .mockRejectedValueOnce(mockError);

      await expect(fetchAllProviders()).rejects.toThrow(
        'Fetch All Providers Page 2 Error',
      );
      expect(get).toHaveBeenCalledTimes(2);
    });
  });
});
