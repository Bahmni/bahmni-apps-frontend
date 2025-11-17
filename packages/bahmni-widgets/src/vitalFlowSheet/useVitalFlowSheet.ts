import {
  getVitalFlowSheetData,
  VitalFlowSheetData,
  getFormattedError,
} from '@bahmni/services';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';

interface UseVitalFlowSheetParams {
  latestCount: number;
  obsConcepts: string[];
  groupBy: string;
}

interface UseVitalFlowSheetResult {
  data: VitalFlowSheetData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage vital flow sheet data
 * @param params - Parameters for fetching vital flow sheet data
 * @returns Object containing data, loading state, error state, and refetch function
 */
export const useVitalFlowSheet = (
  params: UseVitalFlowSheetParams,
): UseVitalFlowSheetResult => {
  const [data, setData] = useState<VitalFlowSheetData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();
  const patientUUID = usePatientUUID();

  // Memoize the individual params to prevent unnecessary re-renders
  // Use JSON.stringify for array comparison to avoid reference issues

  const memoizedParams = useMemo(
    () => ({
      latestCount: params.latestCount,
      obsConcepts: params.obsConcepts,
      groupBy: params.groupBy,
    }),
    [params.latestCount, params.obsConcepts, params.groupBy],
  );

  const fetchVitalFlowSheetData = useCallback(async () => {
    if (!patientUUID) {
      setError(new Error('Invalid patient UUID'));
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Invalid patient UUID',
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const flowSheetData = await getVitalFlowSheetData(
        patientUUID,
        memoizedParams.latestCount,
        memoizedParams.obsConcepts,
        memoizedParams.groupBy,
      );
      setData(flowSheetData);
    } catch (err) {
      const { title, message } = getFormattedError(err);
      addNotification({
        type: 'error',
        title: title,
        message: message,
      });
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, [patientUUID, memoizedParams, addNotification]);

  useEffect(() => {
    if (patientUUID && memoizedParams) {
      fetchVitalFlowSheetData();
    }
  }, [patientUUID, memoizedParams, fetchVitalFlowSheetData]);

  return {
    data,
    loading,
    error,
    refetch: fetchVitalFlowSheetData,
  };
};
