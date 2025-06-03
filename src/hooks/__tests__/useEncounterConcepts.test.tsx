import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEncounterConcepts } from '../useEncounterConcepts';
import { getEncounterConcepts } from '@services/encounterConceptsService';
import { useNotification } from '@hooks/useNotification';
import { getFormattedError } from '@utils/common';

// Mock dependencies
jest.mock('@services/encounterConceptsService');
jest.mock('@hooks/useNotification');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetEncounterConcepts = getEncounterConcepts as jest.MockedFunction<
  typeof getEncounterConcepts
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

// Mock encounter concepts data
const mockEncounterConcepts: EncounterConceptsResponse = {
  visitTypes: {
    EMERGENCY: '493ebb53-b2bd-4ced-b444-e0965804d771',
    OPD: '54f43754-c6ce-4472-890e-0f28acaeaea6',
  },
  encounterTypes: {
    DISCHARGE: 'd37e03e0-5e07-11ef-8f7c-0242ac120002',
    ADMISSION: 'd3785931-5e07-11ef-8f7c-0242ac120002',
  },
  orderTypes: {
    'Lab Order': 'd3560b17-5e07-11ef-8f7c-0242ac120002',
    'Test Order': '52a447d3-a64a-11e3-9aeb-50e549534c5e',
  },
  conceptData: {},
};

describe('useEncounterConcepts', () => {
  // Mock state setters and notification hook
  let mockSetEncounterConcepts: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;
  let mockAddNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useState mock implementation
    mockSetEncounterConcepts = jest.fn();
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
      .mockImplementationOnce(() => [null, mockSetEncounterConcepts])
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
    it('should fetch encounter concepts successfully', async () => {
      // Arrange
      mockedGetEncounterConcepts.mockResolvedValueOnce(mockEncounterConcepts);

      // Override useState to return the correct initial states
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(
          () =>
            [null, mockSetEncounterConcepts] as [
              unknown,
              React.Dispatch<unknown>,
            ],
        ) // encounterConcepts state
        .mockImplementationOnce(
          () => [true, mockSetLoading] as [unknown, React.Dispatch<unknown>],
        ) // loading state
        .mockImplementationOnce(
          () => [null, mockSetError] as [unknown, React.Dispatch<unknown>],
        ); // error state

      // Act
      renderHook(() => useEncounterConcepts());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetEncounterConcepts).toHaveBeenCalled();
        expect(mockSetEncounterConcepts).toHaveBeenCalledWith(
          mockEncounterConcepts,
        );
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should refetch encounter concepts when refetch function is called', async () => {
      // Arrange
      const initialConcepts = mockEncounterConcepts;
      const updatedConcepts = {
        ...mockEncounterConcepts,
        visitTypes: {
          ...mockEncounterConcepts.visitTypes,
          IPD: 'b7494a80-fdf9-49bb-bb40-396c47b40343',
        },
      };

      mockedGetEncounterConcepts.mockResolvedValueOnce(initialConcepts);

      // Mock useState to return initialConcepts and false for loading
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [
          initialConcepts,
          mockSetEncounterConcepts,
        ])
        .mockImplementationOnce(() => [false, mockSetLoading])
        .mockImplementationOnce(() => [null, mockSetError]);

      // Act - Initial render
      const { result } = renderHook(() => useEncounterConcepts());

      // Clear mocks for refetch test
      mockSetEncounterConcepts.mockClear();
      mockSetLoading.mockClear();
      mockSetError.mockClear();
      mockedGetEncounterConcepts.mockClear();

      // Setup for refetch
      mockedGetEncounterConcepts.mockResolvedValueOnce(updatedConcepts);

      // Act - Call refetch
      act(() => {
        result.current.refetch();
      });

      // Assert during refetch
      expect(mockSetLoading).toHaveBeenCalledWith(true);

      // Wait for refetch to complete
      await waitFor(() => {
        expect(mockedGetEncounterConcepts).toHaveBeenCalled();
        expect(mockSetEncounterConcepts).toHaveBeenCalledWith(updatedConcepts);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle API call failure', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedGetEncounterConcepts.mockRejectedValueOnce(error);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Network Error',
        message: 'Network error',
      });

      // Act
      renderHook(() => useEncounterConcepts());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetEncounterConcepts).toHaveBeenCalled();
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

    it('should handle invalid data from getEncounterConcepts', async () => {
      // Arrange
      mockedGetEncounterConcepts.mockResolvedValueOnce(
        null as unknown as EncounterConceptsResponse,
      );

      // Act
      renderHook(() => useEncounterConcepts());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetEncounterConcepts).toHaveBeenCalled();
        // The hook should handle null data gracefully
        expect(mockSetEncounterConcepts).toHaveBeenCalledWith(null);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle malformed JSON responses', async () => {
      const malformedJsonError = {
        response: { status: 200, data: 'Invalid JSON' },
        isAxiosError: true,
      };
      mockedGetEncounterConcepts.mockRejectedValueOnce(malformedJsonError);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Request Error',
        message: 'Invalid JSON',
      });

      renderHook(() => useEncounterConcepts());

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
    it('should handle empty encounter concepts from API', async () => {
      const emptyConcepts: EncounterConceptsResponse = {
        visitTypes: {},
        encounterTypes: {},
        orderTypes: {},
        conceptData: {},
      };

      mockedGetEncounterConcepts.mockResolvedValueOnce(emptyConcepts);

      renderHook(() => useEncounterConcepts());

      await waitFor(() => {
        expect(mockSetEncounterConcepts).toHaveBeenCalledWith(emptyConcepts);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle malformed encounter concepts data gracefully', async () => {
      mockedGetEncounterConcepts.mockResolvedValueOnce(
        {} as EncounterConceptsResponse,
      );

      renderHook(() => useEncounterConcepts());

      await waitFor(() => {
        expect(mockSetEncounterConcepts).toHaveBeenCalledWith({});
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderHook(() => useEncounterConcepts());
      expect(() => unmount()).not.toThrow();
    });
  });
});
