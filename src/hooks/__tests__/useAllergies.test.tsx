import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { mockAllergyIntolerance } from '@__mocks__/allergyMocks';
import { useNotification } from '@hooks/useNotification';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { getAllergies } from '@services/allergyService';
import { FhirAllergyIntolerance } from '@types/allergy';
import { getFormattedError } from '@utils/common';
import { useAllergies } from '../useAllergies';

// Mock dependencies
jest.mock('@services/allergyService');
jest.mock('@hooks/useNotification');
jest.mock('@hooks/usePatientUUID');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetAllergies = getAllergies as jest.MockedFunction<
  typeof getAllergies
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('useAllergies', () => {
  // Mock state setters and notification hook
  let mockSetAllergies: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;
  let mockAddNotification: jest.Mock;

  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useState mock implementation
    mockSetAllergies = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();
    mockAddNotification = jest.fn();

    (usePatientUUID as jest.Mock).mockReturnValue(patientUUID);

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
      .mockImplementationOnce(() => [[], mockSetAllergies])
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
    it('should fetch allergies', async () => {
      // Arrange

      const mockAllergies = [mockAllergyIntolerance];
      mockedGetAllergies.mockResolvedValueOnce(mockAllergies);

      // Override useState to return the correct initial states
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(
          () => [[], mockSetAllergies] as [unknown, React.Dispatch<unknown>],
        ) // allergies state
        .mockImplementationOnce(
          () => [true, mockSetLoading] as [unknown, React.Dispatch<unknown>],
        ) // loading state
        .mockImplementationOnce(
          () => [null, mockSetError] as [unknown, React.Dispatch<unknown>],
        ); // error state

      // Act
      renderHook(() => useAllergies());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);
        expect(mockSetAllergies).toHaveBeenCalledWith(mockAllergies);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should refetch allergies when refetch function is called', async () => {
      const initialAllergies = [mockAllergyIntolerance];
      const updatedAllergies = [
        mockAllergyIntolerance,
        {
          ...mockAllergyIntolerance,
          id: 'new-allergy-id',
        } as FhirAllergyIntolerance,
      ];

      mockedGetAllergies.mockResolvedValueOnce(initialAllergies);

      // Mock useState to return initialAllergies and false for loading
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [initialAllergies, mockSetAllergies])
        .mockImplementationOnce(() => [false, mockSetLoading])
        .mockImplementationOnce(() => [null, mockSetError]);

      // Act - Initial render
      const { result } = renderHook(() => useAllergies());

      // Clear mocks for refetch test
      mockSetAllergies.mockClear();
      mockSetLoading.mockClear();
      mockSetError.mockClear();
      mockedGetAllergies.mockClear();

      // Setup for refetch
      mockedGetAllergies.mockResolvedValueOnce(updatedAllergies);

      // Act - Call refetch
      act(() => {
        result.current.refetch();
      });

      // Assert during refetch
      expect(mockSetLoading).toHaveBeenCalledWith(true);

      // Wait for refetch to complete
      await waitFor(() => {
        expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);
        expect(mockSetAllergies).toHaveBeenCalledWith(updatedAllergies);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle null patientUUID', () => {
      (usePatientUUID as jest.Mock).mockReturnValue(null);

      // Act
      renderHook(() => useAllergies());

      // Assert
      expect(mockSetError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid patient UUID',
        }),
      );
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error',
        message: 'Invalid patient UUID',
      });
      expect(mockedGetAllergies).not.toHaveBeenCalled();
    });

    it('should handle API call failure', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedGetAllergies.mockRejectedValueOnce(error);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Network Error',
        message: 'Network error',
      });

      // Act
      renderHook(() => useAllergies());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);
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

    it('should handle invalid data from getAllergies', async () => {
      // Arrange
      mockedGetAllergies.mockResolvedValueOnce(
        null as unknown as FhirAllergyIntolerance[],
      );

      // Act
      renderHook(() => useAllergies());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);
        // The hook should handle null data gracefully
        expect(mockSetAllergies).toHaveBeenCalledWith(null);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle empty allergies array from API', async () => {
      mockedGetAllergies.mockResolvedValueOnce([]);

      renderHook(() => useAllergies());

      await waitFor(() => {
        expect(mockSetAllergies).toHaveBeenCalledWith([]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle malformed allergy data gracefully', async () => {
      mockedGetAllergies.mockResolvedValueOnce([{} as FhirAllergyIntolerance]);

      renderHook(() => useAllergies());

      await waitFor(() => {
        expect(mockSetAllergies).toHaveBeenCalledWith([{}]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle malformed JSON responses', async () => {
      const malformedJsonError = {
        response: { status: 200, data: 'Invalid JSON' },
        isAxiosError: true,
      };
      mockedGetAllergies.mockRejectedValueOnce(malformedJsonError);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Request Error',
        message: 'Invalid JSON',
      });

      renderHook(() => useAllergies());

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalled();
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'Request Error',
          message: 'Invalid JSON',
        });
      });
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderHook(() => useAllergies());
      expect(() => unmount()).not.toThrow();
    });

    it('should refetch allergies when patientUUID changes', async () => {
      (usePatientUUID as jest.Mock).mockReturnValueOnce(patientUUID);
      const { rerender } = renderHook(() => useAllergies());

      mockedGetAllergies.mockResolvedValueOnce([mockAllergyIntolerance]);
      (usePatientUUID as jest.Mock).mockReturnValueOnce('uuid-2');
      rerender();

      await waitFor(() => {
        expect(mockedGetAllergies).toHaveBeenNthCalledWith(1, patientUUID);
        expect(mockedGetAllergies).toHaveBeenNthCalledWith(2, 'uuid-2');
      });
    });
  });
});
