import { ObservationForm } from '@bahmni/services';
import { renderHook, waitFor, act } from '@testing-library/react';
import * as pinnedFormsService from '../../services/pinnedFormsService';
import { usePinnedObservationForms } from '../usePinnedObservationForms';

// Mock the dependencies
jest.mock('../../services/pinnedFormsService');

const mockLoadPinnedForms =
  pinnedFormsService.loadPinnedForms as jest.MockedFunction<
    typeof pinnedFormsService.loadPinnedForms
  >;
const mockSavePinnedForms =
  pinnedFormsService.savePinnedForms as jest.MockedFunction<
    typeof pinnedFormsService.savePinnedForms
  >;

describe('usePinnedObservationForms', () => {
  const mockForms: ObservationForm[] = [
    {
      uuid: 'form-1',
      name: 'History and Examination',
      id: 1,
      privileges: [],
    },
    {
      uuid: 'form-2',
      name: 'Vitals',
      id: 2,
      privileges: [],
    },
    {
      uuid: 'form-3',
      name: 'Progress Notes',
      id: 3,
      privileges: [],
    },
  ];

  const mockUserUuid = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadPinnedForms.mockResolvedValue([]);
    mockSavePinnedForms.mockResolvedValue(undefined);
  });

  describe('Initial Loading', () => {
    it('should load pinned forms when forms and userUuid are available', async () => {
      mockLoadPinnedForms.mockResolvedValue([
        'History and Examination',
        'Vitals',
      ]);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pinnedForms).toHaveLength(2);
      expect(result.current.pinnedForms[0].name).toBe(
        'History and Examination',
      );
      expect(result.current.pinnedForms[1].name).toBe('Vitals');
    });

    it('should match pinned forms by name from available forms', async () => {
      mockLoadPinnedForms.mockResolvedValue(['Vitals']);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pinnedForms).toHaveLength(1);
      expect(result.current.pinnedForms[0].uuid).toBe('form-2');
    });

    it('should handle empty pinned forms list', async () => {
      mockLoadPinnedForms.mockResolvedValue([]);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pinnedForms).toEqual([]);
    });

    it('should ignore pinned form names that do not match available forms', async () => {
      mockLoadPinnedForms.mockResolvedValue(['Vitals', 'Non-existent Form']);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pinnedForms).toHaveLength(1);
      expect(result.current.pinnedForms[0].name).toBe('Vitals');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when loading pinned forms', async () => {
      const error = new Error('Failed to load');
      mockLoadPinnedForms.mockRejectedValue(error);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Failed to load');
      expect(result.current.pinnedForms).toEqual([]);
    });

    it('should set pinnedForms to empty array on error', async () => {
      mockLoadPinnedForms.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pinnedForms).toEqual([]);
    });

    it('should handle errors when saving pinned forms', async () => {
      mockLoadPinnedForms.mockResolvedValue([]);
      const saveError = new Error('Save failed');
      mockSavePinnedForms.mockRejectedValue(saveError);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Try to update pinned forms
      await result.current.updatePinnedForms([mockForms[0]]);

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('Save failed');
      });

      // State should still be updated optimistically
      expect(result.current.pinnedForms).toHaveLength(1);
    });
  });

  describe('updatePinnedForms', () => {
    it('should update pinned forms optimistically', async () => {
      mockLoadPinnedForms.mockResolvedValue([]);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update pinned forms
      await act(async () => {
        await result.current.updatePinnedForms([mockForms[0], mockForms[1]]);
      });

      // Should update immediately (optimistic)
      await waitFor(() => {
        expect(result.current.pinnedForms).toHaveLength(2);
      });
      expect(result.current.pinnedForms).toContainEqual(mockForms[0]);
      expect(result.current.pinnedForms).toContainEqual(mockForms[1]);
    });

    it('should save pinned form names to backend', async () => {
      mockLoadPinnedForms.mockResolvedValue([]);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updatePinnedForms([mockForms[0], mockForms[2]]);
      });

      await waitFor(() => {
        expect(mockSavePinnedForms).toHaveBeenCalledWith(mockUserUuid, [
          'History and Examination',
          'Progress Notes',
        ]);
      });
    });

    it('should handle clearing all pinned forms', async () => {
      mockLoadPinnedForms.mockResolvedValue(['Vitals']);

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.pinnedForms).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updatePinnedForms([]);
      });

      await waitFor(() => {
        expect(result.current.pinnedForms).toEqual([]);
      });
      await waitFor(() => {
        expect(mockSavePinnedForms).toHaveBeenCalledWith(mockUserUuid, []);
      });
    });

    it('should maintain optimistic UI even if save fails', async () => {
      mockLoadPinnedForms.mockResolvedValue([]);
      mockSavePinnedForms.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updatePinnedForms([mockForms[0]]);
      });

      // Optimistic update should persist
      await waitFor(() => {
        expect(result.current.pinnedForms).toHaveLength(1);
      });
      expect(result.current.pinnedForms[0]).toEqual(mockForms[0]);
    });
  });

  describe('Loading Only Once', () => {
    it('should only load pinned forms once when forms finish loading', async () => {
      mockLoadPinnedForms.mockResolvedValue(['Vitals']);

      const { result, rerender } = renderHook(() =>
        usePinnedObservationForms(mockForms, { userUuid: mockUserUuid }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockLoadPinnedForms).toHaveBeenCalledTimes(1);

      // Rerender should not trigger another load
      rerender();
      rerender();

      expect(mockLoadPinnedForms).toHaveBeenCalledTimes(1);
    });

    it('should not reload when forms list changes after initial load', async () => {
      mockLoadPinnedForms.mockResolvedValue(['Vitals']);

      const { result, rerender } = renderHook(
        ({ forms }) =>
          usePinnedObservationForms(forms, { userUuid: mockUserUuid }),
        { initialProps: { forms: mockForms } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change the available forms
      const newForms = [
        ...mockForms,
        { uuid: 'form-4', name: 'New Form', id: 4, privileges: [] },
      ];

      rerender({ forms: newForms });

      // Should still only have loaded once
      expect(mockLoadPinnedForms).toHaveBeenCalledTimes(1);
    });
  });
});
