import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConditions } from '../useConditions';
import { getConditions } from '@services/conditionService';
import { useNotification } from '@hooks/useNotification';
import {
  mockCondition,
  mockConditionWithoutOptionalFields,
} from '../../__mocks__/conditionMocks';
import { FhirCondition } from '../../types/condition';
import { getFormattedError } from '@utils/common';

// Mock dependencies
jest.mock('@services/conditionService');
jest.mock('@hooks/useNotification');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetConditions = getConditions as jest.MockedFunction<
  typeof getConditions
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('useConditions', () => {
  // Mock state setters and notification hook
  let mockSetConditions: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;
  let mockAddNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useState mock implementation
    mockSetConditions = jest.fn();
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
      .mockImplementationOnce(() => [[], mockSetConditions])
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
    it('should fetch conditions when a valid patientUUID is provided', async () => {
      // Arrange
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      const mockConditions = [mockCondition];
      mockedGetConditions.mockResolvedValueOnce(mockConditions);

      // Override useState to return the correct initial states
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(
          () => [[], mockSetConditions] as [unknown, React.Dispatch<unknown>],
        ) // conditions state
        .mockImplementationOnce(
          () => [true, mockSetLoading] as [unknown, React.Dispatch<unknown>],
        ) // loading state
        .mockImplementationOnce(
          () => [null, mockSetError] as [unknown, React.Dispatch<unknown>],
        ); // error state

      // Act
      /* eslint-disable  @typescript-eslint/no-unused-vars */
      const { result } = renderHook(() => useConditions(patientUUID));

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetConditions).toHaveBeenCalledWith(patientUUID);
        expect(mockSetConditions).toHaveBeenCalledWith(mockConditions);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should refetch conditions when refetch function is called', async () => {
      // Arrange
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      const initialConditions = [mockCondition];
      const updatedConditions = [
        mockCondition,
        { ...mockCondition, id: 'new-condition-id' } as FhirCondition,
      ];

      mockedGetConditions.mockResolvedValueOnce(initialConditions);

      // Mock useState to return initialConditions and false for loading
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [initialConditions, mockSetConditions])
        .mockImplementationOnce(() => [false, mockSetLoading])
        .mockImplementationOnce(() => [null, mockSetError]);

      // Act - Initial render
      const { result } = renderHook(() => useConditions(patientUUID));

      // Clear mocks for refetch test
      mockSetConditions.mockClear();
      mockSetLoading.mockClear();
      mockSetError.mockClear();
      mockedGetConditions.mockClear();

      // Setup for refetch
      mockedGetConditions.mockResolvedValueOnce(updatedConditions);

      // Act - Call refetch
      act(() => {
        result.current.refetch();
      });

      // Assert during refetch
      expect(mockSetLoading).toHaveBeenCalledWith(true);

      // Wait for refetch to complete
      await waitFor(() => {
        expect(mockedGetConditions).toHaveBeenCalledWith(patientUUID);
        expect(mockSetConditions).toHaveBeenCalledWith(updatedConditions);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle null patientUUID', () => {
      // Act
      renderHook(() => useConditions(null));

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
      expect(mockedGetConditions).not.toHaveBeenCalled();
    });

    it('should handle API call failure', async () => {
      // Arrange
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      const error = new Error('Network error');
      mockedGetConditions.mockRejectedValueOnce(error);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Network Error',
        message: 'Network error',
      });

      // Act
      renderHook(() => useConditions(patientUUID));

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetConditions).toHaveBeenCalledWith(patientUUID);
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

    it('should handle invalid data from getConditions', async () => {
      // Arrange
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      mockedGetConditions.mockResolvedValueOnce(
        null as unknown as FhirCondition[],
      );

      // Act
      renderHook(() => useConditions(patientUUID));

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetConditions).toHaveBeenCalledWith(patientUUID);
        // The hook should handle null data gracefully
        expect(mockSetConditions).toHaveBeenCalledWith(null);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });
    it('should handle empty conditions array from API', async () => {
      mockedGetConditions.mockResolvedValueOnce([]);

      /* eslint-disable  @typescript-eslint/no-unused-vars */
      const { result } = renderHook(() => useConditions('valid-uuid'));

      await waitFor(() => {
        expect(mockSetConditions).toHaveBeenCalledWith([]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle conditions missing optional fields', async () => {
      mockedGetConditions.mockResolvedValueOnce([
        mockConditionWithoutOptionalFields,
      ]);

      /* eslint-disable  @typescript-eslint/no-unused-vars */
      const { result } = renderHook(() => useConditions('valid-uuid'));

      await waitFor(() => {
        expect(mockSetConditions).toHaveBeenCalledWith([
          mockConditionWithoutOptionalFields,
        ]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle malformed condition data gracefully', async () => {
      mockedGetConditions.mockResolvedValueOnce([{} as FhirCondition]);

      /* eslint-disable  @typescript-eslint/no-unused-vars */
      const { result } = renderHook(() => useConditions('valid-uuid'));

      await waitFor(() => {
        expect(mockSetConditions).toHaveBeenCalledWith([{}]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle different condition statuses', async () => {
      const inactiveCondition = {
        ...mockCondition,
        clinicalStatus: { coding: [{ code: 'inactive', display: 'Inactive' }] },
      };
      mockedGetConditions.mockResolvedValueOnce([
        mockCondition,
        inactiveCondition,
      ]);

      /* eslint-disable  @typescript-eslint/no-unused-vars */
      const { result } = renderHook(() => useConditions('valid-uuid'));

      await waitFor(() => {
        expect(mockSetConditions).toHaveBeenCalledWith([
          mockCondition,
          inactiveCondition,
        ]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle malformed JSON responses', async () => {
      const malformedJsonError = {
        response: { status: 200, data: 'Invalid JSON' },
        isAxiosError: true,
      };
      mockedGetConditions.mockRejectedValueOnce(malformedJsonError);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Request Error',
        message: 'Invalid JSON',
      });

      renderHook(() => useConditions('valid-uuid'));

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
      const { unmount } = renderHook(() => useConditions('valid-uuid'));
      expect(() => unmount()).not.toThrow();
    });

    it('should refetch conditions when patientUUID changes', async () => {
      const { rerender } = renderHook(({ uuid }) => useConditions(uuid), {
        initialProps: { uuid: 'uuid-1' },
      });

      mockedGetConditions.mockResolvedValueOnce([mockCondition]);
      rerender({ uuid: 'uuid-2' });

      await waitFor(() => {
        expect(mockedGetConditions).toHaveBeenCalledWith('uuid-2');
      });
    });
  });
});
