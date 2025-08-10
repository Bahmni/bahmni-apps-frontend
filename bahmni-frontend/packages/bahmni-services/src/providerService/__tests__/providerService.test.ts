import { PROVIDER_RESOURCE_URL } from '../constants';
import { get } from '../../api';
import { getCurrentProvider } from '../providerService';

// Mock dependencies
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

  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
  });

  describe('getCurrentProvider', () => {
    it('should fetch provider using userUUID', async () => {
      // Arrange
      (get as jest.Mock).mockResolvedValueOnce(mockProviderResponse);

      // Act
      const result = await getCurrentProvider(mockUserUUID);

      // Assert
      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
      expect(result).toEqual(mockProviderResponse.results[0]);
    });

    it('should return null if provider results are empty', async () => {
      // Arrange
      (get as jest.Mock).mockResolvedValueOnce({ results: [] });

      // Act
      const result = await getCurrentProvider(mockUserUUID);

      // Assert
      expect(result).toBeNull();
      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
    });

    it('should return null if provider results are null', async () => {
      // Arrange
      (get as jest.Mock).mockResolvedValueOnce({ results: null });

      // Act
      const result = await getCurrentProvider(mockUserUUID);

      // Assert
      expect(result).toBeNull();
      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
    });

    it('should throw error if provider API call fails', async () => {
      // Arrange
      const mockError = new Error('Provider API Error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getCurrentProvider(mockUserUUID)).rejects.toThrow(
        'Provider API Error',
      );
      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
    });
  });
});
