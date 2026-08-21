import { getPatientObservationsBundle } from '@bahmni/services';
import type { QueryClient } from '@tanstack/react-query';
import type { Observation } from 'fhir/r4';
import { extractFormName } from '../../observations/utils';
import { extractId } from '../../utils/Observations';
import { TaskActionType } from '../constants';
import type { TaskAction, TaskViewModel } from '../models';
import { extractFormNameFromTask } from '../utils';

const handleLaunchFormAction = (
  action: TaskAction,
  task: TaskViewModel,
): void => {
  const formName = extractFormNameFromTask(
    task,
    action.handlerConfig.formInputCode as string,
  );

  globalThis.dispatchEvent(
    new CustomEvent('startConsultation', {
      detail: {
        encounterType: action.handlerConfig.encounterType,
        formName,
        directFormMode: true,
        editOnly: 'observationForms',
        task: task.fhirResource,
      },
    }),
  );
};

const resolveSourceEncounterUuid = async (
  task: TaskViewModel,
  formName: string | null,
  queryClient: QueryClient,
): Promise<string | undefined> => {
  const serviceRequestId = extractId(task.fhirResource.basedOn?.[0]?.reference);
  const patientId = extractId(task.fhirResource.for?.reference);
  if (!serviceRequestId || !patientId || !formName) return undefined;

  const bundle = await queryClient.ensureQueryData({
    queryKey: ['observationsByServiceRequest', serviceRequestId],
    queryFn: () =>
      getPatientObservationsBundle(patientId, undefined, serviceRequestId),
  });

  const target = formName.toLowerCase();
  const firstMatch = (bundle.entry ?? [])
    .map((entry) => entry.resource)
    .filter((r): r is Observation => r?.resourceType === 'Observation')
    .find((obs) => extractFormName(obs)?.toLowerCase() === target);
  return extractId(firstMatch?.encounter?.reference);
};

const handleEditFormAction = async (
  action: TaskAction,
  task: TaskViewModel,
  queryClient: QueryClient,
): Promise<void> => {
  const formName = extractFormNameFromTask(
    task,
    action.handlerConfig.formInputCode as string,
  );
  const sourceEncounterUuid = await resolveSourceEncounterUuid(
    task,
    formName,
    queryClient,
  );

  globalThis.dispatchEvent(
    new CustomEvent('startConsultation', {
      detail: {
        encounterType: action.handlerConfig.encounterType,
        editOnly: 'observationForms',
        editTitle: 'EDIT_OBSERVATION_FORM_TITLE',
        sourceEncounterUuid,
        formName,
        directFormMode: true,
        task: task.fhirResource,
      },
    }),
  );
};

export const handleTaskAction = (
  action: TaskAction,
  task: TaskViewModel,
  queryClient: QueryClient,
): void | Promise<void> => {
  if (action.type === TaskActionType.LAUNCH_FORM) {
    return handleLaunchFormAction(action, task);
  }
  if (action.type === TaskActionType.EDIT_FORM) {
    return handleEditFormAction(action, task, queryClient);
  }
};
