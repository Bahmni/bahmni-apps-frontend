import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientHistory } from '../usePatientHistory';
import { RegistrationService } from '../../services/registration/registrationService';
import { useNotification } from '../useNotification';
import type {
  PatientHistoryEntry,
  HistorySearchCriteria,
  HistoryExportRequest,
  HistoryFilter,
} from '../../types/registration/history';

// Mock dependencies
jest.mock('../../services/registration/registrationService');
jest.mock('../useNotification');

const mockRegistrationService = RegistrationService as jest.Mocked<typeof RegistrationService>;
const mockUseNotification = useNotification as jest.MockedFunction<typeof useNotification>;

describe('usePatientHistory', () => {
  const mockAddNotification = jest.fn();
  const mockPatientUuid = 'patient-123';

  const mockHistoryEntries: PatientHistoryEntry[] = [
    {
      uuid: 'history-1',
      changeType: 'CREATE',
      patientUuid: mockPatientUuid,
      description: 'Patient created',
      changes: {
        demographics: [
          { field: 'givenName', oldValue: null, newValue: 'John' },
          { field: 'familyName', oldValue: null, newValue: 'Doe' },
        ],
      },
      user: {
        uuid: 'user-1',
        display: 'Test User',
        username: 'testuser',
      },
      dateChanged: '2023-01-01T10:00:00.000Z',
      reason: 'Initial registration',
      source: 'WEB',
      auditInfo: {
        creator: { uuid: 'user-1', display: 'Test User' },
        dateCreated: '2023-01-01T10:00:00.000Z',
      },
    },
    {
      uuid: 'history-2',
      changeType: 'UPDATE',
      patientUuid: mockPatientUuid,
      description: 'Demographics updated',
      changes: {
        demographics: [
          { field: 'age', oldValue: '29', newValue: '30' },
        ],
        identifiers: [
          {
            action: 'ADDED',
            identifierType: 'National ID',
            newValue: 'ID123456',
          },
        ],
      },
      user: {
        uuid: 'user-2',
        display: 'Another User',
        username: 'anotheruser',
      },
      dateChanged: '2023-06-15T14:30:00.000Z',
      source: 'API',
      auditInfo: {
        creator: { uuid: 'user-2', display: 'Another User' },
        dateCreated: '2023-06-15T14:30:00.000Z',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      expect(result.current.history).toEqual([]);
      expect(result.current.filteredHistory).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.filter).toBe('ALL');
      expect(result.current.totalCount).toBe(0);
      expect(result.current.hasMore).toBe(false);
    });

    it('should auto-load history when patient UUID is provided', () => {
      const mockResponse = { results: mockHistoryEntries, totalCount: 2, hasMore: false };
      mockRegistrationService.getPatientHistory.mockResolvedValue(mockResponse);

      renderHook(() => usePatientHistory(mockPatientUuid, { autoLoad: true }));

      expect(mockRegistrationService.getPatientHistory).toHaveBeenCalledWith({
        patientUuid: mockPatientUuid,
        limit: 50,
      });
    });

    it('should not auto-load when autoLoad is false', () => {
      renderHook(() => usePatientHistory(mockPatientUuid, { autoLoad: false }));

      expect(mockRegistrationService.getPatientHistory).not.toHaveBeenCalled();
    });

    it('should apply default filter when provided', () => {
      const { result } = renderHook(() =>
        usePatientHistory(mockPatientUuid, { defaultFilter: 'UPDATE' })
      );

      expect(result.current.filter).toBe('UPDATE');
    });
  });

  describe('loadHistory', () => {
    it('should load history successfully', async () => {
      const mockResponse = { results: mockHistoryEntries, totalCount: 2, hasMore: false };
      mockRegistrationService.getPatientHistory.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      act(() => {
        result.current.loadHistory();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.history).toEqual(mockHistoryEntries);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle history loading errors', async () => {
      const errorMessage = 'Failed to load history';
      mockRegistrationService.getPatientHistory.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.history).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to load patient history',
        message: errorMessage,
      });
    });

    it('should load history with custom criteria', async () => {
      const mockResponse = { results: mockHistoryEntries, totalCount: 2, hasMore: false };
      mockRegistrationService.getPatientHistory.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      const criteria: HistorySearchCriteria = {
        patientUuid: mockPatientUuid,
        changeType: 'UPDATE',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        limit: 25,
      };

      act(() => {
        result.current.loadHistory(criteria);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockRegistrationService.getPatientHistory).toHaveBeenCalledWith(criteria);
    });

    it('should handle network errors gracefully', async () => {
      mockRegistrationService.getPatientHistory.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network Error');
    });
  });

  describe('exportHistory', () => {
    it('should export history successfully', async () => {
      const mockExportResponse = {
        fileUrl: '/exports/history.csv',
        fileName: 'patient_history_123.csv',
        fileSize: 1024,
        mimeType: 'text/csv',
        expiresAt: '2023-12-31T23:59:59.000Z',
      };

      mockRegistrationService.exportPatientHistory.mockResolvedValue(mockExportResponse);

      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      const exportRequest: HistoryExportRequest = {
        patientUuid: mockPatientUuid,
        options: {
          format: 'CSV',
          includeDetails: true,
        },
      };

      let exportResult = null;
      await act(async () => {
        exportResult = await result.current.exportHistory(exportRequest);
      });

      expect(exportResult).toEqual(mockExportResponse);
      expect(mockRegistrationService.exportPatientHistory).toHaveBeenCalledWith(exportRequest);
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'History exported successfully',
        message: 'Download will start automatically',
      });
    });

    it('should handle export errors', async () => {
      const errorMessage = 'Failed to export history';
      mockRegistrationService.exportPatientHistory.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      const exportRequest: HistoryExportRequest = {
        patientUuid: mockPatientUuid,
        options: { format: 'CSV' },
      };

      let exportResult = null;
      await act(async () => {
        exportResult = await result.current.exportHistory(exportRequest);
      });

      expect(exportResult).toBeNull();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to export history',
        message: errorMessage,
      });
    });

    it('should validate export request before exporting', async () => {
      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      const invalidRequest = {
        patientUuid: '',
        options: { format: 'CSV' as const },
      };

      let exportResult = null;
      await act(async () => {
        exportResult = await result.current.exportHistory(invalidRequest);
      });

      expect(exportResult).toBeNull();
      expect(mockRegistrationService.exportPatientHistory).not.toHaveBeenCalled();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Invalid export request',
        message: 'Patient UUID is required',
      });
    });
  });

  describe('filtering', () => {
    beforeEach(async () => {
      const mockResponse = { results: mockHistoryEntries, totalCount: 2, hasMore: false };
      mockRegistrationService.getPatientHistory.mockResolvedValue(mockResponse);
    });

    it('should filter history by change type', async () => {
      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      // Load history first
      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply filter
      act(() => {
        result.current.setFilter('CREATE');
      });

      expect(result.current.filter).toBe('CREATE');
      expect(result.current.filteredHistory).toHaveLength(1);
      expect(result.current.filteredHistory[0].changeType).toBe('CREATE');
    });

    it('should show all history when filter is ALL', async () => {
      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      // Load history first
      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply ALL filter
      act(() => {
        result.current.setFilter('ALL');
      });

      expect(result.current.filter).toBe('ALL');
      expect(result.current.filteredHistory).toHaveLength(2);
    });

    it('should clear filter and show all history', async () => {
      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      // Load history first
      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply filter then clear
      act(() => {
        result.current.setFilter('CREATE');
      });

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.filter).toBe('ALL');
      expect(result.current.filteredHistory).toHaveLength(2);
    });
  });

  describe('helper methods', () => {
    beforeEach(async () => {
      const mockResponse = { results: mockHistoryEntries, totalCount: 2, hasMore: false };
      mockRegistrationService.getPatientHistory.mockResolvedValue(mockResponse);
    });

    it('should get history statistics', async () => {
      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      // Load history first
      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.getHistoryStats();

      expect(stats.totalChanges).toBe(2);
      expect(stats.changesByType).toEqual({
        CREATE: 1,
        UPDATE: 1,
        DELETE: 0,
        VOID: 0,
        UNVOID: 0,
      });
      expect(stats.topUsers).toHaveLength(2);
      expect(stats.lastChangeDate).toBe('2023-06-15T14:30:00.000Z');
    });

    it('should get changes by date range', async () => {
      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      // Load history first
      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const changesByDate = result.current.getChangesByDateRange('2023-01-01', '2023-12-31');

      expect(changesByDate).toHaveLength(2);
      expect(changesByDate[0].date).toBe('2023-01-01');
      expect(changesByDate[1].date).toBe('2023-06-15');
    });

    it('should refresh history data', async () => {
      const mockResponse = { results: mockHistoryEntries, totalCount: 2, hasMore: false };
      mockRegistrationService.getPatientHistory.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockRegistrationService.getPatientHistory).toHaveBeenCalledWith({
        patientUuid: mockPatientUuid,
        limit: 50,
      });
    });

    it('should get changes for specific field', async () => {
      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      // Load history first
      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ageChanges = result.current.getChangesForField('age');

      expect(ageChanges).toHaveLength(1);
      expect(ageChanges[0].oldValue).toBe('29');
      expect(ageChanges[0].newValue).toBe('30');
    });
  });

  describe('pagination', () => {
    it('should load more history entries', async () => {
      const initialResponse = {
        results: [mockHistoryEntries[0]],
        totalCount: 2,
        hasMore: true,
      };
      const moreResponse = {
        results: [mockHistoryEntries[1]],
        totalCount: 2,
        hasMore: false,
      };

      mockRegistrationService.getPatientHistory
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(moreResponse);

      const { result } = renderHook(() => usePatientHistory(mockPatientUuid));

      // Load initial history
      act(() => {
        result.current.loadHistory();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.hasMore).toBe(true);

      // Load more
      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('options and configuration', () => {
    it('should respect custom limit option', () => {
      const mockResponse = { results: mockHistoryEntries, totalCount: 2, hasMore: false };
      mockRegistrationService.getPatientHistory.mockResolvedValue(mockResponse);

      renderHook(() => usePatientHistory(mockPatientUuid, { limit: 25, autoLoad: true }));

      expect(mockRegistrationService.getPatientHistory).toHaveBeenCalledWith({
        patientUuid: mockPatientUuid,
        limit: 25,
      });
    });

    it('should handle empty patient UUID gracefully', () => {
      const { result } = renderHook(() => usePatientHistory(''));

      expect(result.current.history).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should include details when option is enabled', () => {
      const mockResponse = { results: mockHistoryEntries, totalCount: 2, hasMore: false };
      mockRegistrationService.getPatientHistory.mockResolvedValue(mockResponse);

      renderHook(() =>
        usePatientHistory(mockPatientUuid, { includeDetails: true, autoLoad: true })
      );

      expect(mockRegistrationService.getPatientHistory).toHaveBeenCalledWith({
        patientUuid: mockPatientUuid,
        limit: 50,
      });
    });
  });
});
