import { FhirExportTask, getFhirExportTasks } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { FHIR_EXPORT_REFRESH_INTERVAL_MS } from '../constants/app';

export const FHIR_EXPORT_TASKS_QUERY_KEY = ['fhirExportTasks'];

const TERMINAL_STATUSES: ReadonlyArray<FhirExportTask['status']> = [
  'completed',
  'failed',
  'rejected',
  'cancelled',
];

/** True while at least one task can still change status. */
export const hasPendingTasks = (tasks: FhirExportTask[] | undefined) =>
  !!tasks?.some((task) => !TERMINAL_STATUSES.includes(task.status));

/**
 * Loads the recent FHIR export tasks. While any task is still in progress the
 * list refreshes every 30s; polling stops once all of them reach a final state
 * (a new export invalidates the query, which restarts it).
 */
export const useFhirExportTasks = (enabled: boolean) =>
  useQuery<FhirExportTask[]>({
    queryKey: FHIR_EXPORT_TASKS_QUERY_KEY,
    queryFn: getFhirExportTasks,
    enabled,
    refetchInterval: (query) =>
      hasPendingTasks(query.state.data)
        ? FHIR_EXPORT_REFRESH_INTERVAL_MS
        : false,
  });
