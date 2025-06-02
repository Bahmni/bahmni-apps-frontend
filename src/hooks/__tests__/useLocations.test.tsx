import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocations } from '../useLocations';
import { getLocations } from '@services/locationService';
import { useNotification } from '@hooks/useNotification';
import { getFormattedError } from '@utils/common';
import { OpenMRSLocation } from '@types/location';

// Mock dependencies
jest.mock('@services/locationService');
jest.mock('@hooks/useNotification');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetLocations = getLocations as jest.MockedFunction<
  typeof getLocations
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
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
  // Mock state setters and notification hook
  let mockSetLocations: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;
  let mockAddNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useState mock implementation
    mockSetLocations = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();
    mockAddNotification = jest.fn();

    // Mock useNotification hook
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });

    // Mock getFormattedError
    mockedGetFormattedError.mockReturnValue({
      title: 'Error',
      message: 'An error occurred',
    });

    // Mock React hooks
    jest
      .spyOn(React, 'useState')
      .mockImplementationOnce(() => [[], mockSetLocations])
      .mockImplementationOnce(() => [false, mockSetLoading])
      .mockImplementationOnce(() => [null, mockSetError]);

    let previousDeps: string | undefined;
    jest.spyOn(React, 'useEffect').mockImplementation((effect, deps) => {
      const depsString = JSON.stringify(deps);
      if (depsString !== previousDeps) {
        effect();
        previousDeps = depsString;
      }
    });

    jest.spyOn(React, 'useCallback').mockImplementation((callback) => callback);
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should fetch locations successfully', async () => {
      // Arrange
      const mockLocations = [mockLocation];
      mockedGetLocations.mockResolvedValueOnce(mockLocations);

      // Override useState to return the correct initial states
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(
          () => [[], mockSetLocations] as [unknown, React.Dispatch<unknown>],
        ) // locations state
        .mockImplementationOnce(
          () => [true, mockSetLoading] as [unknown, React.Dispatch<unknown>],
        ) // loading state
        .mockImplementationOnce(
          () => [null, mockSetError] as [unknown, React.Dispatch<unknown>],
        ); // error state

      // Act
      renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetLocations).toHaveBeenCalled();
        expect(mockSetLocations).toHaveBeenCalledWith(mockLocations);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
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

      mockedGetLocations.mockResolvedValueOnce(initialLocations);

      // Mock useState to return initialLocations and false for loading
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [initialLocations, mockSetLocations])
        .mockImplementationOnce(() => [false, mockSetLoading])
        .mockImplementationOnce(() => [null, mockSetError]);

      // Act - Initial render
      const { result } = renderHook(() => useLocations());

      // Clear mocks for refetch test
      mockSetLocations.mockClear();
      mockSetLoading.mockClear();
      mockSetError.mockClear();
      mockedGetLocations.mockClear();

      // Setup for refetch
      mockedGetLocations.mockResolvedValueOnce(updatedLocations);

      // Act - Call refetch
      act(() => {
        result.current.refetch();
      });

      // Assert during refetch
      expect(mockSetLoading).toHaveBeenCalledWith(true);

      // Wait for refetch to complete
      await waitFor(() => {
        expect(mockedGetLocations).toHaveBeenCalled();
        expect(mockSetLocations).toHaveBeenCalledWith(updatedLocations);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle API call failure', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedGetLocations.mockRejectedValueOnce(error);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Network Error',
        message: 'Network error',
      });

      // Act
      renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetLocations).toHaveBeenCalled();
        expect(mockSetError).toHaveBeenCalledWith(error);
        expect(mockedGetFormattedError).toHaveBeenCalledWith(error);
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'Network Error',
          message: 'Network error',
        });
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle invalid data from getLocations', async () => {
      // Arrange
      mockedGetLocations.mockResolvedValueOnce(
        null as unknown as OpenMRSLocation[],
      );

      // Act
      renderHook(() => useLocations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetLocations).toHaveBeenCalled();
        // The hook should handle null data gracefully
        expect(mockSetLocations).toHaveBeenCalledWith(null);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle malformed JSON responses', async () => {
      const malformedJsonError = {
        response: { status: 200, data: 'Invalid JSON' },
        isAxiosError: true,
      };
      mockedGetLocations.mockRejectedValueOnce(malformedJsonError);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Request Error',
        message: 'Invalid JSON',
      });

      renderHook(() => useLocations());

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalled();
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'Request Error',
          message: 'Invalid JSON',
        });
      });
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle empty locations array from API', async () => {
      mockedGetLocations.mockResolvedValueOnce([]);

      renderHook(() => useLocations());

      await waitFor(() => {
        expect(mockSetLocations).toHaveBeenCalledWith([]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle malformed location data gracefully', async () => {
      mockedGetLocations.mockResolvedValueOnce([{} as OpenMRSLocation]);

      renderHook(() => useLocations());

      await waitFor(() => {
        expect(mockSetLocations).toHaveBeenCalledWith([{}]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderHook(() => useLocations());
      expect(() => unmount()).not.toThrow();
    });
  });
});
