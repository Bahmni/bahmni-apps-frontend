import {
  fetchFhirExportTasks,
  FhirExportTask,
  isFhirExportTaskTerminal,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { FHIR_EXPORT_POLL_INTERVAL_MS } from '../constants/app';

export const FHIR_EXPORT_TASKS_QUERY_KEY = ['fhirExportTasks'];

/**
 * Keep polling only while at least one task can still change. Before the first
 * response there is nothing to judge, so no timer runs; the table is
 * refetched explicitly after a submit, which restarts polling.
 */
export const getFhirExportRefetchInterval = (
  tasks: FhirExportTask[] | undefined,
): number | false =>
  tasks?.some((task) => !isFhirExportTaskTerminal(task))
    ? FHIR_EXPORT_POLL_INTERVAL_MS
    : false;

export const useFhirExportTasks = (enabled: boolean) =>
  useQuery<FhirExportTask[]>({
    queryKey: FHIR_EXPORT_TASKS_QUERY_KEY,
    queryFn: fetchFhirExportTasks,
    enabled,
    refetchInterval: (query) => getFhirExportRefetchInterval(query.state.data),
  });
