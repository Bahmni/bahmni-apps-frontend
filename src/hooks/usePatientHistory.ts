import { useState, useEffect, useCallback, useMemo } from 'react';
import { RegistrationService } from '../services/registration/registrationService';
import { useNotification } from './useNotification';
import type {
  PatientHistoryEntry,
  HistorySearchCriteria,
  HistoryExportRequest,
  HistoryExportResponse,
  HistoryFilter,
  PatientHistoryOptions,
  PatientHistoryStats,
  HistoryChangeType,
} from '../types/registration/history';

/**
 * Custom hook for managing patient history
 * @param patientUuid - UUID of the patient
 * @param options - Configuration options
 * @returns Patient history management interface
 */
export function usePatientHistory(
  patientUuid: string,
  options: PatientHistoryOptions = {}
) {
  const { addNotification } = useNotification();
  const {
    autoLoad = false,
    defaultFilter = 'ALL',
    limit = 50,
    includeDetails = true,
    enableRealtime = false,
  } = options;

  // State
  const [history, setHistory] = useState<PatientHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<HistoryFilter>(defaultFilter);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);

  /**
   * Load patient history
   */
  const loadHistory = useCallback(async (criteria?: HistorySearchCriteria) => {
    if (!patientUuid) return;

    setIsLoading(true);
    setError(null);

    try {
      const searchCriteria: HistorySearchCriteria = {
        patientUuid,
        limit,
        startIndex: 0,
        ...criteria,
      };

      const response = await RegistrationService.getPatientHistory(searchCriteria);

      setHistory([...response.results]);
      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);
      setCurrentStartIndex(response.results.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Failed to load patient history',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [patientUuid, limit, addNotification]);

  /**
   * Load more history entries (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!patientUuid || !hasMore || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const criteria: HistorySearchCriteria = {
        patientUuid,
        limit,
        startIndex: currentStartIndex,
      };

      const response = await RegistrationService.getPatientHistory(criteria);

      setHistory(prev => [...prev, ...response.results]);
      setHasMore(response.hasMore);
      setCurrentStartIndex(prev => prev + response.results.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Failed to load more history',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [patientUuid, limit, hasMore, isLoading, currentStartIndex, addNotification]);

  /**
   * Export patient history
   */
  const exportHistory = useCallback(async (
    request: HistoryExportRequest
  ): Promise<HistoryExportResponse | null> => {
    // Validate request
    if (!request.patientUuid.trim()) {
      addNotification({
        type: 'error',
        title: 'Invalid export request',
        message: 'Patient UUID is required',
      });
      return null;
    }

    setIsExporting(true);

    try {
      const response = await RegistrationService.exportPatientHistory(request);

      addNotification({
        type: 'success',
        title: 'History exported successfully',
        message: 'Download will start automatically',
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addNotification({
        type: 'error',
        title: 'Failed to export history',
        message: errorMessage,
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [addNotification]);

  /**
   * Set history filter
   */
  const setFilter = useCallback((newFilter: HistoryFilter) => {
    setFilterState(newFilter);
  }, []);

  /**
   * Clear filter (set to ALL)
   */
  const clearFilter = useCallback(() => {
    setFilterState('ALL');
  }, []);

  /**
   * Get filtered history based on current filter
   */
  const filteredHistory = useMemo(() => {
    if (filter === 'ALL') {
      return history;
    }
    return history.filter(entry => entry.changeType === filter);
  }, [history, filter]);

  /**
   * Get history statistics
   */
  const getHistoryStats = useCallback((): PatientHistoryStats => {
    const changesByType: Record<HistoryChangeType, number> = {
      CREATE: 0,
      UPDATE: 0,
      DELETE: 0,
      VOID: 0,
      UNVOID: 0,
    };

    const userCounts: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};
    let lastChangeDate: string | undefined;

    history.forEach(entry => {
      // Count by type
      changesByType[entry.changeType]++;

      // Count by user
      const userId = entry.user.uuid;
      userCounts[userId] = (userCounts[userId] || 0) + 1;

      // Count by date
      const date = entry.dateChanged.split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;

      // Track latest change
      if (!lastChangeDate || entry.dateChanged > lastChangeDate) {
        lastChangeDate = entry.dateChanged;
      }
    });

    // Convert to arrays and sort
    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => {
        const user = history.find(h => h.user.uuid === userId)?.user.display || userId;
        return { user, count };
      })
      .sort((a, b) => b.count - a.count);

    const changesByDate = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalChanges: history.length,
      changesByType,
      changesByDate,
      topUsers,
      lastChangeDate,
    };
  }, [history]);

  /**
   * Get changes by date range
   */
  const getChangesByDateRange = useCallback((startDate: string, endDate: string) => {
    return history
      .filter(entry => {
        const entryDate = entry.dateChanged.split('T')[0];
        return entryDate >= startDate && entryDate <= endDate;
      })
      .map(entry => ({
        date: entry.dateChanged.split('T')[0],
        entry,
      }))
      .reduce((acc, { date, entry }) => {
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[])
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [history]);

  /**
   * Get changes for a specific field
   */
  const getChangesForField = useCallback((fieldName: string) => {
    const changes: Array<{
      entryUuid: string;
      dateChanged: string;
      oldValue: string | null;
      newValue: string | null;
      user: string;
    }> = [];

    history.forEach(entry => {
      // Check demographics changes
      entry.changes.demographics?.forEach(change => {
        if (change.field === fieldName) {
          changes.push({
            entryUuid: entry.uuid,
            dateChanged: entry.dateChanged,
            oldValue: change.oldValue,
            newValue: change.newValue,
            user: entry.user.display,
          });
        }
      });

      // Check other changes
      entry.changes.other?.forEach(change => {
        if (change.field === fieldName) {
          changes.push({
            entryUuid: entry.uuid,
            dateChanged: entry.dateChanged,
            oldValue: change.oldValue,
            newValue: change.newValue,
            user: entry.user.display,
          });
        }
      });
    });

    return changes.sort((a, b) => b.dateChanged.localeCompare(a.dateChanged));
  }, [history]);

  /**
   * Refresh history data
   */
  const refresh = useCallback(async () => {
    await loadHistory({
      patientUuid,
      limit,
    });
  }, [loadHistory, patientUuid, limit]);

  // Auto-load data on mount if enabled
  useEffect(() => {
    if (autoLoad && patientUuid) {
      refresh();
    }
  }, [autoLoad, patientUuid, refresh]);

  // Memoized return value for performance
  const returnValue = useMemo(() => ({
    // Data
    history,
    filteredHistory,
    filter,
    totalCount,
    hasMore,

    // Loading states
    isLoading,
    isExporting,

    // Error state
    error,

    // Actions
    loadHistory,
    loadMore,
    exportHistory,
    setFilter,
    clearFilter,
    refresh,

    // Helper methods
    getHistoryStats,
    getChangesByDateRange,
    getChangesForField,
  }), [
    history,
    filteredHistory,
    filter,
    totalCount,
    hasMore,
    isLoading,
    isExporting,
    error,
    loadHistory,
    loadMore,
    exportHistory,
    setFilter,
    clearFilter,
    refresh,
    getHistoryStats,
    getChangesByDateRange,
    getChangesForField,
  ]);

  return returnValue;
}

export default usePatientHistory;
