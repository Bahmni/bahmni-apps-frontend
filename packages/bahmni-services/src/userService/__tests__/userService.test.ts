import { get } from '../../api';
import { BAHMNI_USER_COOKIE_NAME } from '../../constants/app';
import { getCookieByName } from '../../utils';
import { USER_RESOURCE_URL, BAHMNI_USER_LOCATION_COOKIE } from '../constants';
import { getCurrentUser, getUserLoginLocation } from '../userService';

// Mock dependencies
jest.mock('../../api');
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getCookieByName: jest.fn(),
}));

//TODO: Remove this import once the test i18n setup is complete
jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    t: jest.fn().mockImplementation((key: string) => key),
  },
}));

describe('userService', () => {
  // Mock data
  const mockUsername = 'superman';
  const mockEncodedUsername = '%22superman%22'; // URL encoded with quotes
  const mockQuotedUsername = '"superman"';
  const mockSpecialUsername = '@super.man%20';
  const mockEncodedSpecialUsername = encodeURIComponent(mockSpecialUsername);

  const mockUserResponse = {
    results: [
      {
        uuid: 'user-uuid-123',
        username: mockUsername,
        display: 'Superman User',
        person: {
          uuid: 'person-uuid-456',
          display: 'Superman',
        },
        privileges: [],
        roles: [
          {
            uuid: 'role-uuid-789',
            display: 'Clinician',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
    (getCookieByName as jest.Mock).mockReset();
  });

  describe('getCurrentUser', () => {
    // Happy Path Tests
    it('should fetch user successfully when cookie exists', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_COOKIE_NAME);
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
    });

    it('should handle URL-encoded username in cookie', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue(mockEncodedUsername);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
    });

    it('should handle quoted username in cookie', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue(mockQuotedUsername);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
    });

    it('should handle special characters in username', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue(
        mockEncodedSpecialUsername,
      );
      const specialUserResponse = {
        results: [
          { ...mockUserResponse.results[0], username: mockSpecialUsername },
        ],
      };
      (get as jest.Mock).mockResolvedValue(specialUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockSpecialUsername));
      expect(result).toEqual(specialUserResponse.results[0]);
    });

    // Sad Path Tests
    it('should return null when cookie is not found', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue(null);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalled();
    });

    it('should return null when cookie is empty string', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue('');

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalled();
    });

    it('should return null when API returns empty results', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue({ results: [] });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when API returns null results', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue({ results: null });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });

    // Error Handling Tests
    it('should throw error when API call fails', async () => {
      // Arrange
      const mockError = new Error('API Error');
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(getCurrentUser()).rejects.toThrow(
        'ERROR_FETCHING_USER_DETAILS',
      );
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
    });

    it('should throw error when username decoding fails', async () => {
      // Arrange
      const invalidEncoding = '%invalid';
      (getCookieByName as jest.Mock).mockReturnValue(invalidEncoding);

      // Act & Assert
      await expect(getCurrentUser()).rejects.toThrow(
        'ERROR_FETCHING_USER_DETAILS',
      );
      expect(get).not.toHaveBeenCalled();
    });

    // Edge Cases
    it('should handle malformed cookie values', async () => {
      // Arrange
      const malformedValue = '%%%invalid%%%';
      (getCookieByName as jest.Mock).mockReturnValue(malformedValue);

      // Act & Assert
      await expect(getCurrentUser()).rejects.toThrow(
        'ERROR_FETCHING_USER_DETAILS',
      );
      expect(get).not.toHaveBeenCalledWith(USER_RESOURCE_URL(malformedValue));
    });

    it('should handle whitespace in username', async () => {
      // Arrange
      const usernameWithSpace = 'super man';
      const encodedUsernameWithSpace = encodeURIComponent(usernameWithSpace);
      (getCookieByName as jest.Mock).mockReturnValue(encodedUsernameWithSpace);
      const spaceUserResponse = {
        results: [
          { ...mockUserResponse.results[0], username: usernameWithSpace },
        ],
      };
      (get as jest.Mock).mockResolvedValue(spaceUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(usernameWithSpace));
      expect(result).toEqual(spaceUserResponse.results[0]);
    });

    it('should return first result when API returns multiple results', async () => {
      // Arrange
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      const multipleResults = {
        results: [
          mockUserResponse.results[0],
          { ...mockUserResponse.results[0], uuid: 'user-uuid-456' },
        ],
      };
      (get as jest.Mock).mockResolvedValue(multipleResults);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toEqual(multipleResults.results[0]);
    });
  });
});

const mockEncodedUserLocationCookie =
  '%7B%22name%22%3A%22Emergency%22%2C%22uuid%22%3A%22b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e%22%7D';
const mockUserLocation = {
  name: 'Emergency',
  uuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
};

describe('getUserLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCookieByName as jest.Mock).mockReset();
  });
  it('should fetch user log in location successfully when cookie exists', async () => {
    (getCookieByName as jest.Mock).mockReturnValue(
      mockEncodedUserLocationCookie,
    );
    const result = await getUserLoginLocation();
    expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
    expect(result).toEqual(mockUserLocation);
  });

  it('should return null for user log in location when cookie does not exists', async () => {
    (getCookieByName as jest.Mock).mockReturnValue(null);
    const result = await getUserLoginLocation();
    expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
    expect(result).toBeNull();
  });
});
