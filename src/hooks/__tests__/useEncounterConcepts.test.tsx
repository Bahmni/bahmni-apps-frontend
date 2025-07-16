import { renderHook, act, waitFor } from '@testing-library/react';
import { getEncounterConcepts } from '@services/encounterConceptsService';
import { EncounterConcepts } from '@types/encounterConcepts';
import { getFormattedError } from '@utils/common';
import { useEncounterConcepts } from '../useEncounterConcepts';

// Mock dependencies
jest.mock('@services/encounterConceptsService');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetEncounterConcepts = getEncounterConcepts as jest.MockedFunction<
  typeof getEncounterConcepts
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

const mockEncounterConcepts: EncounterConcepts = {
  visitTypes: [
    { name: 'EMERGENCY', uuid: '493ebb53-b2bd-4ced-b444-e0965804d771' },
    { name: 'OPD', uuid: '54f43754-c6ce-4472-890e-0f28acaeaea6' },
  ],
  encounterTypes: [
    { name: 'DISCHARGE', uuid: 'd37e03e0-5e07-11ef-8f7c-0242ac120002' },
    { name: 'ADMISSION', uuid: 'd3785931-5e07-11ef-8f7c-0242ac120002' },
  ],
  orderTypes: [
    { name: 'Lab Order', uuid: 'd3560b17-5e07-11ef-8f7c-0242ac120002' },
    { name: 'Test Order', uuid: '52a447d3-a64a-11e3-9aeb-50e549534c5e' },
  ],
  conceptData: [],
};

describe('useEncounterConcepts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should fetch encounter concepts successfully', async () => {
      // Arrange
      mockedGetEncounterConcepts.mockResolvedValueOnce(mockEncounterConcepts);

      // Act
      const { result } = renderHook(() => useEncounterConcepts());

      // Assert initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.encounterConcepts).toBeNull();
      expect(result.current.error).toBeNull();

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert final state
      expect(result.current.encounterConcepts).toEqual(mockEncounterConcepts);
      expect(result.current.error).toBeNull();
      expect(mockedGetEncounterConcepts).toHaveBeenCalled();
    });

    it('should refetch encounter concepts when refetch function is called', async () => {
      // Arrange
      const updatedConcepts: EncounterConcepts = {
        ...mockEncounterConcepts,
        visitTypes: [
          ...mockEncounterConcepts.visitTypes,
          { name: 'IPD', uuid: 'b7494a80-fdf9-49bb-bb40-396c47b40343' },
        ],
      };

      mockedGetEncounterConcepts
        .mockResolvedValueOnce(mockEncounterConcepts)
        .mockResolvedValueOnce(updatedConcepts);

      // Act - Initial render
      const { result } = renderHook(() => useEncounterConcepts());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.encounterConcepts).toEqual(mockEncounterConcepts);

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
      expect(result.current.encounterConcepts).toEqual(updatedConcepts);
      expect(result.current.error).toBeNull();
      expect(mockedGetEncounterConcepts).toHaveBeenCalledTimes(2);
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle API call failure with Error object', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedGetEncounterConcepts.mockRejectedValueOnce(error);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Network Error',
        message: 'Network error',
      });

      // Act
      const { result } = renderHook(() => useEncounterConcepts());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.error).toBe(error);
      expect(result.current.encounterConcepts).toBeNull();
      expect(mockedGetEncounterConcepts).toHaveBeenCalled();
    });

    it('should handle API call failure with non-Error object', async () => {
      // Arrange
      const nonErrorObject = { message: 'Some API error' };
      mockedGetEncounterConcepts.mockRejectedValueOnce(nonErrorObject);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Some API error',
      });

      // Act
      const { result } = renderHook(() => useEncounterConcepts());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.error?.message).toBe('Some API error');
      expect(result.current.encounterConcepts).toBeNull();
      expect(mockedGetEncounterConcepts).toHaveBeenCalled();
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle empty encounter concepts from API', async () => {
      // Arrange
      const emptyConcepts: EncounterConcepts = {
        visitTypes: [],
        encounterTypes: [],
        orderTypes: [],
        conceptData: [],
      };

      mockedGetEncounterConcepts.mockResolvedValueOnce(emptyConcepts);

      // Act
      const { result } = renderHook(() => useEncounterConcepts());

      // Wait for async operations
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.encounterConcepts).toEqual(emptyConcepts);
      expect(result.current.error).toBeNull();
      expect(mockedGetEncounterConcepts).toHaveBeenCalled();
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderHook(() => useEncounterConcepts());
      expect(() => unmount()).not.toThrow();
    });
  });
});
