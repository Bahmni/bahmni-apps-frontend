import { getCurrentUser } from '@services/userService';
import { get } from '@services/api';
import { USER_RESOURCE_URL, BAHMNI_USER_COOKIE_NAME } from '@constants/app';
import * as commonUtils from '@utils/common';
import notificationService from '@services/notificationService';

// Mock dependencies
jest.mock('@services/api');
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
}));
jest.mock('@utils/common', () => ({
  ...jest.requireActual('@utils/common'),
  getCookieByName: jest.fn(),
  getFormattedError: jest.fn().mockImplementation((error) => ({
    title: 'Error Title',
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
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
    (commonUtils.getCookieByName as jest.Mock).mockReset();
    (notificationService.showError as jest.Mock).mockReset();
  });

  describe('getCurrentUser', () => {
    // Happy Path Tests
    it('should fetch user successfully when cookie exists', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(commonUtils.getCookieByName).toHaveBeenCalledWith(
        BAHMNI_USER_COOKIE_NAME,
      );
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should handle URL-encoded username in cookie', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(
        mockEncodedUsername,
      );
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should handle quoted username in cookie', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(
        mockQuotedUsername,
      );
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should handle special characters in username', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(
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
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    // Sad Path Tests
    it('should return null when cookie is not found', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(null);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalled();
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should return null when cookie is empty string', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue('');

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalled();
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should return null when API returns empty results', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue({ results: [] });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should return null when API returns null results', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue({ results: null });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    // Error Handling Tests
    it('should show notification and return null when API call fails', async () => {
      // Arrange
      const mockError = new Error('API Error');
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(commonUtils.getFormattedError).toHaveBeenCalledWith(mockError);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error Title',
        'API Error',
      );
    });

    it('should show notification and return null when username decoding fails', async () => {
      // Arrange
      const invalidEncoding = '%invalid';
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(
        invalidEncoding,
      );

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(commonUtils.getFormattedError).toHaveBeenCalled();
      expect(notificationService.showError).toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
    });

    // Edge Cases
    it('should handle malformed cookie values', async () => {
      // Arrange
      const malformedValue = '%%%invalid%%%';
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(
        malformedValue,
      );
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(get).not.toHaveBeenCalledWith(USER_RESOURCE_URL(malformedValue));
      expect(result).toEqual(null);
      expect(notificationService.showError).toHaveBeenCalled();
    });

    it('should handle whitespace in username', async () => {
      // Arrange
      const usernameWithSpace = 'super man';
      const encodedUsernameWithSpace = encodeURIComponent(usernameWithSpace);
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(
        encodedUsernameWithSpace,
      );
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
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should return first result when API returns multiple results', async () => {
      // Arrange
      (commonUtils.getCookieByName as jest.Mock).mockReturnValue(mockUsername);
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
      expect(notificationService.showError).not.toHaveBeenCalled();
    });
  });
});
