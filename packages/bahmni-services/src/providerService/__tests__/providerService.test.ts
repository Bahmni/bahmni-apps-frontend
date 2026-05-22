import { get } from '../../api';
import { ALL_PROVIDERS_URL, PROVIDER_RESOURCE_URL } from '../constants';
import {
  getCurrentProvider,
  getAllProviders,
  getProviderLoginLocations,
} from '../providerService';

jest.mock('../../api');

describe('providerService', () => {
  const mockUserUUID = 'd7a669e7-5e07-11ef-8f7c-0242ac120002';

  const mockProviderResponse = {
    results: [
      {
        uuid: 'provider-uuid-123',
        display: 'Superman - Clinician',
        person: {
          uuid: 'person-uuid-456',
          display: 'Superman',
          gender: 'M',
          age: 35,
          birthdate: '1987-01-01T00:00:00.000+0000',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-uuid-789',
            display: 'Superman',
            links: [],
          },
          preferredAddress: null,
          attributes: [],
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.9',
        },
      },
    ],
  };

  const mockAllProvidersResponse = {
    results: [
      {
        uuid: 'provider-uuid-1',
        display: 'Dr. John Smith - Clinician',
        person: {
          uuid: 'person-uuid-1',
          display: 'Dr. John Smith',
          gender: 'M',
          age: 45,
          birthdate: '1979-05-15T00:00:00.000+0000',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-uuid-1',
            display: 'Dr. John Smith',
            links: [],
          },
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.9',
        },
      },
      {
        uuid: 'provider-uuid-2',
        display: 'Dr. Jane Doe - Surgeon',
        person: {
          uuid: 'person-uuid-2',
          display: 'Dr. Jane Doe',
          gender: 'F',
          age: 38,
          birthdate: '1986-08-22T00:00:00.000+0000',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-uuid-2',
            display: 'Dr. Jane Doe',
            links: [],
          },
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.9',
        },
      },
    ],
  };

  const mockProviderWithLoginLocations = {
    results: [
      {
        uuid: 'provider-uuid-123',
        display: 'Superman - Clinician',
        person: {
          uuid: 'person-uuid-456',
          display: 'Superman',
          gender: 'M',
          age: 35,
          birthdate: '1987-01-01T00:00:00.000+0000',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-uuid-789',
            display: 'Superman',
            links: [],
          },
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.9',
        },
        attributes: [
          {
            uuid: 'attr-uuid-1',
            display: 'Login Locations: General OPD',
            attributeType: {
              uuid: 'attr-type-uuid-1',
              display: 'Login Locations',
            },
            value: {
              uuid: 'location-uuid-1',
              display: 'General OPD',
              tags: [{ display: 'Appointment Location' }],
            },
            voided: false,
          },
          {
            uuid: 'attr-uuid-2',
            display: 'Login Locations: ENT Ward',
            attributeType: {
              uuid: 'attr-type-uuid-2',
              display: 'Login Locations',
            },
            value: {
              uuid: 'location-uuid-2',
              display: 'ENT Ward',
              tags: [{ display: 'Appointment Location' }],
            },
            voided: false,
          },
          {
            uuid: 'attr-uuid-3',
            display: 'Login Locations: Non-Appointment Location',
            attributeType: {
              uuid: 'attr-type-uuid-3',
              display: 'Login Locations',
            },
            value: {
              uuid: 'location-uuid-3',
              display: 'Admin Office',
              tags: [{ display: 'Admin' }],
            },
            voided: false,
          },
          {
            uuid: 'attr-uuid-4',
            display: 'Other Attribute',
            attributeType: {
              uuid: 'attr-type-uuid-4',
              display: 'Other Attribute',
            },
            value: true,
            voided: false,
          },
          {
            uuid: 'attr-uuid-5',
            display: 'Login Locations: Voided Location',
            attributeType: {
              uuid: 'attr-type-uuid-5',
              display: 'Login Locations',
            },
            value: {
              uuid: 'location-uuid-4',
              display: 'Voided Location',
              tags: [{ display: 'Appointment Location' }],
            },
            voided: true,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('getAllProviders', () => {
    it('should fetch all providers', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockAllProvidersResponse);

      const result = await getAllProviders();

      expect(get).toHaveBeenCalledWith(ALL_PROVIDERS_URL);
      expect(result).toEqual(mockAllProvidersResponse.results);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no providers exist', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ results: [] });

      const result = await getAllProviders();

      expect(get).toHaveBeenCalledWith(ALL_PROVIDERS_URL);
      expect(result).toEqual([]);
    });

    it('should throw error if getAllProviders API call fails', async () => {
      const mockError = new Error('All Providers API Error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getAllProviders()).rejects.toThrow(
        'All Providers API Error',
      );
      expect(get).toHaveBeenCalledWith(ALL_PROVIDERS_URL);
    });
  });

  describe('getProviderLoginLocations', () => {
    it('should fetch login locations with Appointment Location tag', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockProviderWithLoginLocations);

      const result = await getProviderLoginLocations(mockUserUUID);

      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        uuid: 'location-uuid-1',
        display: 'General OPD',
        childLocations: [],
      });
      expect(result[1]).toEqual({
        uuid: 'location-uuid-2',
        display: 'ENT Ward',
        childLocations: [],
      });
    });

    it('should return empty array when no provider results', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ results: [] });

      const result = await getProviderLoginLocations(mockUserUUID);

      expect(result).toEqual([]);
    });

    it('should return empty array when provider has no attributes', async () => {
      const providerWithoutAttributes = {
        results: [
          {
            uuid: 'provider-uuid-123',
            display: 'Superman - Clinician',
            person: {
              uuid: 'person-uuid-456',
              display: 'Superman',
            },
          },
        ],
      };
      (get as jest.Mock).mockResolvedValueOnce(providerWithoutAttributes);

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

    it('should filter out locations without Appointment Location tag', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockProviderWithLoginLocations);

      const result = await getProviderLoginLocations(mockUserUUID);

      const adminLocation = result.find(
        (loc) => loc.display === 'Admin Office',
      );
      expect(adminLocation).toBeUndefined();
    });

    it('should throw error if getProviderLoginLocations API call fails', async () => {
      const mockError = new Error('Provider Login Locations API Error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getProviderLoginLocations(mockUserUUID)).rejects.toThrow(
        'Provider Login Locations API Error',
      );
    });
  });
});
