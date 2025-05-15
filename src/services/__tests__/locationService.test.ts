import { get } from '../api';
import { getLocations } from '../locationService';
import { LOCATION_RESOURCE_URL } from '@constants/app';
import { OpenMRSLocation, OpenMRSLocationResponse } from '@/types/location';

// Mock the api module
jest.mock('../api');

// Type the mocked functions
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should return locations when API call succeeds', async () => {
      // Arrange
      const mockLocations: OpenMRSLocation[] = [
        {
          uuid: 'location-uuid-1',
          display: 'Test Location 1',
          links: [
            {
              rel: 'self',
              uri: 'http://example.com/location/location-uuid-1',
              resourceAlias: 'location',
            },
          ],
        },
        {
          uuid: 'location-uuid-2',
          display: 'Test Location 2',
          links: [
            {
              rel: 'self',
              uri: 'http://example.com/location/location-uuid-2',
              resourceAlias: 'location',
            },
          ],
        },
      ];

      const mockResponse: OpenMRSLocationResponse = {
        results: mockLocations,
      };

      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getLocations();

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(LOCATION_RESOURCE_URL);
      expect(result).toEqual(mockLocations);
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should propagate errors from API calls', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockedGet.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getLocations()).rejects.toThrow('Network error');
      expect(mockedGet).toHaveBeenCalledWith(LOCATION_RESOURCE_URL);
    });

    it('should handle server errors properly', async () => {
      // Arrange
      const serverError = new Error('Internal Server Error');
      serverError.name = 'ServerError';
      mockedGet.mockRejectedValueOnce(serverError);

      // Act & Assert
      await expect(getLocations()).rejects.toThrow('Internal Server Error');
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should return empty array when results is null', async () => {
      // Arrange
      const mockResponse = { results: null };
      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getLocations();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when results is undefined', async () => {
      // Arrange
      const mockResponse = {};
      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getLocations();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle unexpected response structure', async () => {
      // Arrange - Response without the expected structure
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      mockedGet.mockResolvedValueOnce('invalid response' as any);

      // Act & Assert
      const result = await getLocations();

      // Should still return an empty array rather than crashing
      expect(result).toEqual([]);
    });
  });
});
