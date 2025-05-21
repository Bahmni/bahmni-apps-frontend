import { getCurrentProvider } from '@services/providerService';
import { get } from '@services/api';
import {
  USER_RESOURCE_URL,
  PROVIDER_RESOURCE_URL,
  BAHMNI_USER_COOKIE_NAME,
} from '@constants/app';
import * as commonUtils from '@utils/common';

// Mock dependencies
jest.mock('@services/api');
jest.mock('@services/notificationService');
jest.mock('@utils/common', () => ({
  ...jest.requireActual('@utils/common'),
  getCookieByName: jest.fn(),
  getFormattedError: jest.fn().mockImplementation((error) => ({
    title: 'Error Title',
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
}));

describe('providerService', () => {
  const mockUsername = 'superman';
  const mockEncodedUsername = '%22superman%22'; // URL encoded with quotes
  const mockUserUUID = 'd7a669e7-5e07-11ef-8f7c-0242ac120002';

  const mockUserResponse = {
    results: [
      {
        username: mockUsername,
        uuid: mockUserUUID,
      },
    ],
  };

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
    (commonUtils.getCookieByName as jest.Mock).mockReset();
  });

  describe('getCurrentProvider', () => {
    it('should fetch provider from username in cookie', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock)
        .mockResolvedValueOnce(mockUserResponse) // First call for user
        .mockResolvedValueOnce(mockProviderResponse); // Second call for provider

      // Act
      const result = await getCurrentProvider();

      // Assert
      expect(commonUtils.getCookieByName).toHaveBeenCalledWith(
        BAHMNI_USER_COOKIE_NAME,
      );
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL('superman'));
      expect(get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUserUUID));
      expect(result).toEqual(mockProviderResponse.results[0]);
    });

    it('should handle URL encoded and quoted cookie values', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock)
        .mockResolvedValueOnce(mockUserResponse) // First call for user
        .mockResolvedValueOnce(mockProviderResponse); // Second call for provider

      // Act
      await getCurrentProvider();

      // Assert
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL('superman'));
    });

    it('should return null if cookie is not found', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce('');

      // Act
      const result = await getCurrentProvider();

      // Assert
      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalled();
    });

    it('should return null if user results are empty', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockResolvedValueOnce({ results: [] });

      // Act
      const result = await getCurrentProvider();

      // Assert
      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalledWith(
        PROVIDER_RESOURCE_URL(expect.anything()),
      );
    });

    it('should return null if user results are null', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockResolvedValueOnce({ results: null });

      // Act
      const result = await getCurrentProvider();

      // Assert
      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalledWith(
        PROVIDER_RESOURCE_URL(expect.anything()),
      );
    });

    it('should return null if provider results are empty', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock)
        .mockResolvedValueOnce(mockUserResponse) // First call for user
        .mockResolvedValueOnce({ results: [] }); // Second call for provider with empty results

      // Act
      const result = await getCurrentProvider();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if provider results are null', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock)
        .mockResolvedValueOnce(mockUserResponse) // First call for user
        .mockResolvedValueOnce({ results: null }); // Second call for provider with null results

      // Act
      const result = await getCurrentProvider();

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error if user API call fails', async () => {
      // Arrange
      const mockError = new Error('Network Error');
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getCurrentProvider()).rejects.toThrow('Network Error');
    });

    it('should throw error if provider API call fails', async () => {
      // Arrange
      const mockError = new Error('Provider API Error');
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock)
        .mockResolvedValueOnce(mockUserResponse) // First call for user succeeds
        .mockRejectedValueOnce(mockError); // Second call for provider fails

      // Act & Assert
      await expect(getCurrentProvider()).rejects.toThrow('Provider API Error');
    });
  });
});
