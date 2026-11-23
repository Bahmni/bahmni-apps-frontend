import { Bundle, Task } from 'fhir/r4';
import { get, post } from '../api';
import { searchConceptByName } from '../conceptService';
import {
  FHIR_EXPORT_ANONYMISE_CONCEPT_NAME,
  FHIR_EXPORT_INPUT_ANONYMISE,
  FHIR_EXPORT_INPUT_END_DATE,
  FHIR_EXPORT_INPUT_START_DATE,
  FHIR_EXPORT_INPUT_USER_NAME,
  FHIR_EXPORT_TASKS_URL,
  FHIR_EXPORT_URL,
} from './constants';
import { FhirExportParams, FhirExportTask } from './models';

/**
 * Submits a bulk FHIR export request.
 * Dates are `yyyy-MM-dd` strings, as expected by the backend.
 */
export const submitFhirExport = async ({
  startDate,
  endDate,
  anonymise,
}: FhirExportParams): Promise<void> => {
  const url =
    `${FHIR_EXPORT_URL}?anonymise=${anonymise}` +
    `&startDate=${encodeURIComponent(startDate)}` +
    `&endDate=${encodeURIComponent(endDate)}`;
  await post(url, {});
};

const findInput = (task: Task, name: string) =>
  task.input?.find((input) => input.type?.text === name)?.valueString;

const toFhirExportTask = (task: Task): FhirExportTask => ({
  id: task.id ?? '',
  userName: findInput(task, FHIR_EXPORT_INPUT_USER_NAME) ?? '',
  triggeredDate: task.authoredOn ?? '',
  startDate: findInput(task, FHIR_EXPORT_INPUT_START_DATE) ?? '',
  endDate: findInput(task, FHIR_EXPORT_INPUT_END_DATE) ?? '',
  anonymised:
    findInput(task, FHIR_EXPORT_INPUT_ANONYMISE)?.toLowerCase() === 'true',
  status: task.status,
  downloadUrl:
    task.status === 'completed' ? task.output?.[0]?.valueString : undefined,
  statusReason: task.statusReason?.text,
});

/**
 * Fetches the most recent bulk FHIR export tasks.
 * The Task endpoint returns every kind of task, so only those based on the
 * "FHIR Export Anonymise Flag" concept (as in the legacy admin page) are kept.
 */
export const getFhirExportTasks = async (): Promise<FhirExportTask[]> => {
  const [concept, bundle] = await Promise.all([
    searchConceptByName(FHIR_EXPORT_ANONYMISE_CONCEPT_NAME),
    get<Bundle<Task>>(FHIR_EXPORT_TASKS_URL),
  ]);
  if (!concept) return [];

  return (bundle.entry ?? [])
    .map((entry) => entry.resource)
    .filter(
      (task): task is Task =>
        !!task?.basedOn?.some((ref) => ref.reference === concept.uuid),
    )
    .map(toFhirExportTask);
};
