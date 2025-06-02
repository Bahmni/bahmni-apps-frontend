import { COMMON_ERROR_MESSAGES } from '@constants/errors';
import { getLocations } from '../locationService';

describe('locationService', () => {
  // Store the original document.cookie descriptor
  const originalDocumentCookie = Object.getOwnPropertyDescriptor(
    document,
    'cookie',
  );

  beforeEach(() => {
    // Reset document.cookie before each test
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore original document.cookie after tests
    if (originalDocumentCookie) {
      Object.defineProperty(document, 'cookie', originalDocumentCookie);
    }
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should return location from cookie when it exists', async () => {
      // Arrange
      const locationCookie =
        '%7B%22name%22%3A%22General%20Ward%22%2C%22uuid%22%3A%228e6ad830-21be-488b-87af-5e480334342c%22%7D';
      document.cookie = `bahmni.user.location=${locationCookie}`;

      // Act
      const result = await getLocations();

      // Assert
      expect(result).toEqual([
        {
          uuid: '8e6ad830-21be-488b-87af-5e480334342c',
          display: 'General Ward',
          links: [],
        },
      ]);
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should return empty array when cookie is not present', async () => {
      // Act
      const result = await getLocations();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when cookie value is empty', async () => {
      // Arrange
      document.cookie = 'bahmni.user.location=';

      // Act
      const result = await getLocations();

      // Assert
      expect(result).toEqual([]);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle malformed cookie gracefully', async () => {
      // Arrange
      document.cookie = 'bahmni.user.location=invalid-json';
      // Assert
      await expect(getLocations()).rejects.toThrow(
        COMMON_ERROR_MESSAGES.UNEXPECTED_ERROR,
      );
    });

    it('should handle cookie with missing properties', async () => {
      // Arrange - Cookie missing the uuid property
      document.cookie =
        'bahmni.user.location=%7B%22name%22%3A%22General%20Ward%22%7D';

      // Act
      const result = await getLocations();

      // Assert
      expect(result).toEqual([
        {
          uuid: undefined,
          display: 'General Ward',
          links: [],
        },
      ]);
    });

    it('should handle multiple cookies properly', async () => {
      // Arrange
      document.cookie = 'other.cookie=some-value';
      document.cookie =
        'bahmni.user.location=%7B%22name%22%3A%22General%20Ward%22%2C%22uuid%22%3A%228e6ad830-21be-488b-87af-5e480334342c%22%7D';

      // Act
      const result = await getLocations();

      // Assert
      expect(result).toEqual([
        {
          uuid: '8e6ad830-21be-488b-87af-5e480334342c',
          display: 'General Ward',
          links: [],
        },
      ]);
    });
  });
});
