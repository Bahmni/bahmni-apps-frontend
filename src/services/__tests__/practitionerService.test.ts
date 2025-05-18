import {
  getCurrentUserUUID,
  getPractitionerByUUID,
  getActivePractitioner,
  formatPractitioner,
} from '@services/practitionerService';
import { get } from '@services/api';
import {
  USER_RESOURCE_URL,
  PRACTITIONER_RESOURCE_URL,
  BAHMNI_USER_COOKIE_NAME,
} from '@constants/app';
import * as commonUtils from '@utils/common';
import { FhirPractitioner } from '@types/practitioner';

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

describe('practitionerService', () => {
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

  const mockPractitioner: FhirPractitioner = {
    resourceType: 'Practitioner',
    id: mockUserUUID,
    meta: {
      versionId: '1724057324000',
      lastUpdated: '2024-08-19T08:48:44.000+00:00',
    },
    identifier: [
      {
        system: 'http://fhir.openmrs.org/ext/provider/identifier',
        value: 'superman',
      },
    ],
    active: true,
    name: [
      {
        id: 'd7a60fc9-5e07-11ef-8f7c-0242ac120002',
        text: 'Super Man',
        family: 'Man',
        given: ['Super'],
      },
    ],
    gender: 'male',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
    (commonUtils.getCookieByName as jest.Mock).mockReset();
  });

  describe('getCurrentUserUUID', () => {
    it('should fetch user UUID from username in cookie', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockResolvedValueOnce(mockUserResponse);

      // Act
      const result = await getCurrentUserUUID();

      // Assert
      expect(commonUtils.getCookieByName).toHaveBeenCalledWith(
        BAHMNI_USER_COOKIE_NAME,
      );
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL('superman'));
      expect(result).toBe(mockUserUUID);
    });

    it('should handle URL encoded and quoted cookie values', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockResolvedValueOnce(mockUserResponse);

      // Act
      await getCurrentUserUUID();

      // Assert
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL('superman'));
    });

    it('should return null if cookie is not found', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce('');

      // Act
      const result = await getCurrentUserUUID();

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
      const result = await getCurrentUserUUID();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if user results are null', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockResolvedValueOnce({ results: null });

      // Act
      const result = await getCurrentUserUUID();

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error if API call fails', async () => {
      // Arrange
      const mockError = new Error('Network Error');
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getCurrentUserUUID()).rejects.toThrow('Network Error');
    });
  });

  describe('getPractitionerByUUID', () => {
    it('should fetch practitioner by UUID', async () => {
      // Arrange
      (get as jest.Mock).mockResolvedValueOnce(mockPractitioner);

      // Act
      const result = await getPractitionerByUUID(mockUserUUID);

      // Assert
      expect(get).toHaveBeenCalledWith(PRACTITIONER_RESOURCE_URL(mockUserUUID));
      expect(result).toEqual(mockPractitioner);
    });
  });

  describe('getActivePractitioner', () => {
    it('should fetch current user and then their practitioner', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock)
        .mockResolvedValueOnce(mockUserResponse) // First call for user
        .mockResolvedValueOnce(mockPractitioner); // Second call for practitioner

      // Act
      const result = await getActivePractitioner();

      // Assert
      expect(commonUtils.getCookieByName).toHaveBeenCalledWith(
        BAHMNI_USER_COOKIE_NAME,
      );
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL('superman'));
      expect(get).toHaveBeenCalledWith(PRACTITIONER_RESOURCE_URL(mockUserUUID));
      expect(result).toEqual(mockPractitioner);
    });

    it('should return null if user UUID cannot be fetched', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce('');

      // Act
      const result = await getActivePractitioner();

      // Assert
      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalledWith(
        PRACTITIONER_RESOURCE_URL(expect.anything()),
      );
    });

    it('should throw error if getCurrentUserUUID throws', async () => {
      // Arrange
      const mockError = new Error('Cookie Error');
      (commonUtils.getCookieByName as jest.Mock).mockReturnValueOnce(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getActivePractitioner()).rejects.toThrow('Cookie Error');
    });
  });

  describe('formatPractitioner', () => {
    it('should format practitioner for UI consumption', () => {
      // Act
      const result = formatPractitioner(mockPractitioner);

      // Assert
      expect(result).toEqual({
        id: mockUserUUID,
        identifier: 'superman',
        active: true,
        fullName: 'Super Man',
        familyName: 'Man',
        givenName: 'Super',
        gender: 'male',
        lastUpdated: '2024-08-19T08:48:44.000+00:00',
      });
    });

    it('should handle null practitioner gracefully', () => {
      // Act
      const result = formatPractitioner(null);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle missing fields gracefully', () => {
      // Arrange
      const incompletePractitioner: FhirPractitioner = {
        resourceType: 'Practitioner',
        id: 'test-id',
        meta: {
          versionId: '1',
          lastUpdated: '2024-08-19T08:48:44.000+00:00',
        },
      };

      // Act
      const result = formatPractitioner(incompletePractitioner);

      // Assert
      expect(result).toEqual({
        id: 'test-id',
        lastUpdated: '2024-08-19T08:48:44.000+00:00',
      });
    });

    it('should throw error when encountering malformed data', () => {
      // Arrange
      const mockError = new Error('Formatting Error');
      const malformedPractitioner = { ...mockPractitioner };

      // Create a situation where accessing a property would throw
      Object.defineProperty(malformedPractitioner, 'meta', {
        get: () => {
          throw mockError;
        },
      });

      // Act & Assert
      expect(() =>
        formatPractitioner(malformedPractitioner as FhirPractitioner),
      ).toThrow('Formatting Error');
    });
  });
});
