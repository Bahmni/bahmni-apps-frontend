import { renderHook, act, waitFor } from '@testing-library/react';
// import i18n from '@/setupTests.i18n';
import { OpenMRSLocation } from '../../models/location';
import { getLocations } from '../../services/locationService';
import { useLocations } from '../useLocations';

// Mock dependencies
jest.mock('../../services/locationService');

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
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should fetch locations successfully', async () => {
      const mockLocations = [mockLocation];
      mockedGetLocations.mockResolvedValueOnce(mockLocations);

      const { result } = renderHook(() => useLocations());

      expect(result.current.loading).toBe(true);
      expect(result.current.locations).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.locations).toEqual(mockLocations);
      expect(result.current.error).toBeNull();
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should refetch locations when refetch function is called', async () => {
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

      const { result } = renderHook(() => useLocations());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.locations).toEqual(initialLocations);

      act(() => {
        result.current.refetch();
      });

      expect(result.current.loading).toBe(true);

      // Wait for refetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.locations).toEqual(updatedLocations);
      expect(result.current.error).toBeNull();
      expect(mockedGetLocations).toHaveBeenCalledTimes(2);
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle API call failure with Error object', async () => {
      const error = new Error('Network error');
      mockedGetLocations.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(error);
      expect(result.current.locations).toEqual([]);
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should handle API call failure with non-Error object', async () => {
      const nonErrorObject = { message: 'Some API error' };
      mockedGetLocations.mockRejectedValueOnce(nonErrorObject);

      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe(
        'Error fetching locations details',
      );
      expect(result.current.locations).toEqual([]);
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should handle empty locations array from API', async () => {
      mockedGetLocations.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe(
        'Error fetching locations details',
      );
      expect(result.current.locations).toEqual([]);
      expect(mockedGetLocations).toHaveBeenCalled();
    });

    it('should handle null response from API', async () => {
      mockedGetLocations.mockResolvedValueOnce(
        null as unknown as OpenMRSLocation[],
      );

      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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
      mockedGetLocations.mockResolvedValueOnce([{} as OpenMRSLocation]);

      const { result } = renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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
