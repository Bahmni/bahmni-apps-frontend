import { Bundle, Task } from 'fhir/r4';
import { get, post } from '../api';
import { searchConceptByName } from '../conceptService';
import {
  FHIR_EXPORT_ANONYMISE_INPUT,
  FHIR_EXPORT_BASED_ON_TYPE,
  FHIR_EXPORT_DOWNLOAD_OUTPUT,
  FHIR_EXPORT_END_DATE_INPUT,
  FHIR_EXPORT_START_DATE_INPUT,
  FHIR_EXPORT_TASKS_COUNT,
  FHIR_EXPORT_TASKS_ENDPOINT,
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
 * Builds the URL listing the most recent tasks based on the "FHIR Export
 * Anonymise Flag" concept, which the backend stamps on every export task.
 * Filtering on the server keeps the `_count` window from being filled by
 * unrelated tasks.
 */
export const buildFhirExportTasksUrl = (anonymiseConceptUuid: string): string =>
  `${FHIR_EXPORT_TASKS_ENDPOINT}?based-on=${FHIR_EXPORT_BASED_ON_TYPE}/${encodeURIComponent(anonymiseConceptUuid)}` +
  `&_sort:desc=_lastUpdated&_count=${FHIR_EXPORT_TASKS_COUNT}`;

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
 * Tasks are selected on the server by their `basedOn` reference to the
 * "FHIR Export Anonymise Flag" concept (the same marker the legacy admin screen
 * matches), so unrelated newer tasks cannot push exports out of the page. The
 * anonymise-flag input is still checked as a cheap safeguard.
 */
export const fetchFhirExportTasks = async (): Promise<FhirExportTask[]> => {
  const anonymiseConcept = await searchConceptByName(
    FHIR_EXPORT_ANONYMISE_INPUT,
    'custom:(uuid)',
  );
  // Export tasks reference this concept, so none can exist without it
  if (!anonymiseConcept) return [];

  const bundle = await get<Bundle<Task>>(
    buildFhirExportTasksUrl(anonymiseConcept.uuid),
  );
  return (bundle?.entry ?? [])
    .flatMap((entry) => (entry.resource ? [entry.resource] : []))
    .filter((task) => hasInput(task, FHIR_EXPORT_ANONYMISE_INPUT))
    .map(toFhirExportTask);
};
