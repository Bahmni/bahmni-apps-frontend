import { renderHook, act, waitFor } from '@testing-library/react';
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
  const mockAddNotification: jest.Mock = jest.fn();

  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  beforeEach(() => {
    jest.clearAllMocks();

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
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should fetch allergies', async () => {
      // Arrange
      const mockAllergies = [mockAllergyIntolerance];
      mockedGetAllergies.mockResolvedValueOnce(mockAllergies);

      // Act
      const { result } = renderHook(() => useAllergies());
      expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);

      // Wait for async operations
      await waitFor(() => {
        expect(result.current).toEqual({
          allergies: mockAllergies,
          loading: false,
          error: null,
          refetch: expect.any(Function),
        });
        expect(result.current.allergies).toBe(mockAllergies);
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

      mockedGetAllergies.mockResolvedValue(initialAllergies);

      // Act - Initial render
      const { result } = renderHook(() => useAllergies());
      expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);

      await waitFor(() => {
        expect(result.current.allergies).toBe(initialAllergies);
      });

      mockedGetAllergies.mockClear();

      // Setup for refetch
      mockedGetAllergies.mockResolvedValueOnce(updatedAllergies);

      // Act - Call refetch
      act(() => {
        result.current.refetch();
      });
      expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);

      // Wait for refetch to complete
      await waitFor(() => {
        expect(result.current.allergies).toBe(updatedAllergies);
      });
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle null patientUUID', async () => {
      (usePatientUUID as jest.Mock).mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useAllergies());

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error',
        message: 'Invalid patient UUID',
      });
      expect(mockedGetAllergies).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(result.current.error).toEqual(new Error('Invalid patient UUID'));
      });
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
      const { result } = renderHook(() => useAllergies());
      expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetFormattedError).toHaveBeenCalledWith(error);
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'Network Error',
          message: 'Network error',
        });
        expect(result.current.error).toEqual(error);
      });
    });

    it('should handle invalid data from getAllergies', async () => {
      // Arrange
      mockedGetAllergies.mockResolvedValueOnce(
        null as unknown as FhirAllergyIntolerance[],
      );

      // Act
      const { result } = renderHook(() => useAllergies());
      expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);

      // Wait for async operations
      await waitFor(() => {
        // The hook should handle null data gracefully
        expect(result.current.allergies).toEqual([]);
      });
    });

    it('should handle empty allergies array from API', async () => {
      mockedGetAllergies.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAllergies());
      expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);

      await waitFor(() => {
        expect(result.current.allergies).toEqual([]);
      });
    });

    it('should handle malformed allergy data gracefully', async () => {
      mockedGetAllergies.mockResolvedValueOnce([{} as FhirAllergyIntolerance]);

      const { result } = renderHook(() => useAllergies());
      expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);

      await waitFor(() => {
        expect(result.current.allergies).toEqual([{}]);
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

      const { result } = renderHook(() => useAllergies());
      expect(mockedGetAllergies).toHaveBeenCalledWith(patientUUID);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'Request Error',
          message: 'Invalid JSON',
        });
        expect(result.current.error).toEqual(new Error('Invalid JSON'));
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
