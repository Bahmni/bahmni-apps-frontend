import { renderHook, act, waitFor } from '@testing-library/react';
import i18n from '@/setupTests.i18n';
import { getLocations } from '@services/locationService';
import { OpenMRSLocation } from '@types/location';
import { useLocations } from '../useLocations';

// Mock dependencies
jest.mock('@services/locationService');

// Type the mocked functions
const mockedGetLocations = getLocations as jest.MockedFunction<
  typeof getLocations
>;

// Mock location data
const mockLocation: OpenMRSLocation = {
  uuid: 'location-uuid-1',
  display: 'Test Location',
  links: [
    {
      rel: 'self',
      uri: 'http://example.com/location/location-uuid-1',
      resourceAlias: 'location',
    },
  ],
};

describe('useLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should fetch locations successfully', async () => {
      // Arrange
      const mockLocations = [mockLocation];
      mockedGetLocations.mockResolvedValueOnce(mockLocations);

      // Act
      const { result } = renderHook(() => useLocations());

      // Assert initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.locations).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert final state
      expect(result.current.locations).toEqual(mockLocations);
      expect(result.current.error).toBeNull();
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should refetch locations when refetch function is called', async () => {
      // Arrange
      const initialLocations = [mockLocation];
      const updatedLocations = [
        mockLocation,
        {
          ...mockLocation,
          uuid: 'location-uuid-2',
          display: 'Second Test Location',
        },
      ];

      mockedGetLocations
        .mockResolvedValueOnce(initialLocations)
        .mockResolvedValueOnce(updatedLocations);

      // Act - Initial render
      const { result } = renderHook(() => useLocations());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.locations).toEqual(initialLocations);

      // Act - Call refetch
      act(() => {
        result.current.refetch();
      });

      // Assert loading state during refetch
      expect(result.current.loading).toBe(true);

      // Wait for refetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert final state
      expect(result.current.locations).toEqual(updatedLocations);
      expect(result.current.error).toBeNull();
      expect(mockedGetLocations).toHaveBeenCalledTimes(2);
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle API call failure with Error object', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedGetLocations.mockRejectedValueOnce(error);

      // Act
      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.error).toBe(error);
      expect(result.current.locations).toEqual([]);
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should handle API call failure with non-Error object', async () => {
      // Arrange
      const nonErrorObject = { message: 'Some API error' };
      mockedGetLocations.mockRejectedValueOnce(nonErrorObject);

      // Act
      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.error?.message).toBe(
        'Error fetching locations details',
      );
      expect(result.current.locations).toEqual([]);
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should handle empty locations array from API', async () => {
      // Arrange
      mockedGetLocations.mockResolvedValueOnce([]);

      // Act
      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.error?.message).toBe(
        'Error fetching locations details',
      );
      expect(result.current.locations).toEqual([]);
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should handle null response from API', async () => {
      // Arrange
      mockedGetLocations.mockResolvedValueOnce(
        null as unknown as OpenMRSLocation[],
      );

      // Act
      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.error?.message).toBe(
        'Error fetching locations details',
      );
      expect(result.current.locations).toEqual([]);
      expect(mockedGetLocations).toHaveBeenCalled();
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle malformed location data gracefully', async () => {
      // Arrange
      mockedGetLocations.mockResolvedValueOnce([{} as OpenMRSLocation]);

      // Act
      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.locations).toEqual([{}]);
      expect(result.current.error).toBeNull();
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderHook(() => useLocations());
      expect(() => unmount()).not.toThrow();
    });
  });
});
