import { Bundle, Task } from 'fhir/r4';
import { get, post } from '../api';
import {
  FHIR_EXPORT_ANONYMISE_INPUT,
  FHIR_EXPORT_DOWNLOAD_OUTPUT,
  FHIR_EXPORT_END_DATE_INPUT,
  FHIR_EXPORT_START_DATE_INPUT,
  FHIR_EXPORT_TASKS_URL,
  FHIR_EXPORT_TERMINAL_STATUSES,
  FHIR_EXPORT_URL,
  FHIR_EXPORT_USER_NAME_INPUT,
} from './constants';
import {
  FhirExportRequest,
  FhirExportSubmitResponse,
  FhirExportTask,
} from './models';

const getInputValue = (task: Task, inputName: string): string | undefined =>
  task.input?.find((input) => input.type?.text === inputName)?.valueString;

const hasInput = (task: Task, inputName: string): boolean =>
  !!task.input?.some((input) => input.type?.text === inputName);

const getDownloadUrl = (task: Task): string | undefined =>
  (
    task.output?.find(
      (output) => output.type?.text === FHIR_EXPORT_DOWNLOAD_OUTPUT,
    ) ?? task.output?.[0]
  )?.valueString;

const toFhirExportTask = (task: Task): FhirExportTask => ({
  id: task.id ?? '',
  status: task.status,
  userName: getInputValue(task, FHIR_EXPORT_USER_NAME_INPUT),
  authoredOn: task.authoredOn,
  startDate: getInputValue(task, FHIR_EXPORT_START_DATE_INPUT),
  endDate: getInputValue(task, FHIR_EXPORT_END_DATE_INPUT),
  anonymised:
    getInputValue(task, FHIR_EXPORT_ANONYMISE_INPUT)?.toLowerCase() === 'true',
  downloadUrl: task.status === 'completed' ? getDownloadUrl(task) : undefined,
  errorMessage: task.statusReason?.text,
});

/**
 * Whether the export task has reached a state the backend will not change again
 */
export const isFhirExportTaskTerminal = (task: FhirExportTask): boolean =>
  FHIR_EXPORT_TERMINAL_STATUSES.includes(task.status);

/**
 * Builds the export URL; the backend reads the range and flag as query params.
 * Dates are optional on the server, so they are only sent when provided.
 */
export const buildFhirExportUrl = ({
  startDate,
  endDate,
  anonymise,
}: FhirExportRequest): string => {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  params.set('anonymise', String(anonymise));
  return `${FHIR_EXPORT_URL}?${params.toString()}`;
};

/**
 * Requests an asynchronous bulk FHIR R4 export of patient data
 * @param request - date range (`yyyy-MM-dd`) and whether to anonymise the data
 * @returns the newly created export task reference
 */
export const submitFhirExport = async (
  request: FhirExportRequest,
): Promise<FhirExportSubmitResponse> =>
  post<FhirExportSubmitResponse, null>(buildFhirExportUrl(request), null);

/**
 * Fetches the most recent FHIR export tasks, newest first.
 * The FHIR Task endpoint returns every kind of task, so only those carrying the
 * export's anonymise-flag input are kept. (The legacy admin screen matches on
 * the task's `basedOn` concept instead; every export task carries both.)
 */
export const fetchFhirExportTasks = async (): Promise<FhirExportTask[]> => {
  const bundle = await get<Bundle<Task>>(FHIR_EXPORT_TASKS_URL);
  return (bundle.entry ?? [])
    .flatMap((entry) => (entry.resource ? [entry.resource] : []))
    .filter((task) => hasInput(task, FHIR_EXPORT_ANONYMISE_INPUT))
    .map(toFhirExportTask);
};
