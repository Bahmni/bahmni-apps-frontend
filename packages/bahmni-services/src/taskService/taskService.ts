import { Bundle, Task } from 'fhir/r4';
import { get, post, put } from '../api';
import { FHIR_TASK_URL, TASKS_URL } from './constants';
import { CreateTaskOptions, CreateTaskPayload } from './models';

/**
 * Fetches tasks for a given patient with optional filters
 * @param patientUuid - The UUID of the patient
 * @param basedOnReference - Optional reference to filter tasks (e.g., "ServiceRequest/uuid")
 * @param encounterUuids - Optional array of encounter UUIDs to filter tasks
 * @returns Promise resolving to a Bundle of Task resources
 */
export async function getTasks(
  patientUuid?: string,
  basedOnReference?: string,
  encounterUuids?: string[],
): Promise<Bundle<Task>> {
  return get<Bundle<Task>>(
    TASKS_URL(patientUuid, basedOnReference, encounterUuids),
  );
}

interface FhirBundle {
  entry?: Array<{ resource: { id: string } & CreateTaskPayload }>;
}

function buildTaskPayload(
  orderUuid: string,
  fhirStatus: string,
  options: CreateTaskOptions = {},
): CreateTaskPayload {
  const { notes, ownerUuid, encounterUuid, patientUuid } = options;

  const payload: CreateTaskPayload = {
    resourceType: 'Task',
    intent: 'order',
    status: fhirStatus,
    basedOn: [{ reference: `ServiceRequest/${orderUuid}` }],
  };

  if (patientUuid) {
    payload.for = { reference: `Patient/${patientUuid}` };
  }

  if (notes) {
    payload.note = [{ text: notes }];
  }

  if (ownerUuid) {
    payload.owner = { reference: `Practitioner/${ownerUuid}` };
  }

  if (encounterUuid) {
    payload.encounter = { reference: `Encounter/${encounterUuid}` };
  }

  return payload;
}

/**
 * Searches for existing FHIR Task for an order (basedOn reference).
 * Returns the most recently created Task if found, or null.
 */
async function getExistingTaskForOrder(
  orderUuid: string,
): Promise<{ id: string } | null> {
  try {
    const response = await get<FhirBundle>(
      `${FHIR_TASK_URL}?based-on=ServiceRequest/${orderUuid}&_sort=-_lastUpdated&_count=1`,
    );

    if (response?.entry && response.entry.length > 0) {
      const task = response.entry[0].resource;
      return task.id ? { id: task.id } : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Updates an existing FHIR Task resource.
 * Only includes fields that may have changed to avoid creating duplicate references.
 */
async function updateTask(
  taskId: string,
  orderUuid: string,
  fhirStatus: string,
  options: CreateTaskOptions = {},
): Promise<void> {
  const payload: CreateTaskPayload = {
    resourceType: 'Task',
    intent: 'order',
    status: fhirStatus,
    basedOn: [{ reference: `ServiceRequest/${orderUuid}` }],
    id: taskId,
  };

  if (options.notes) {
    payload.note = [{ text: options.notes }];
  }

  if (options.ownerUuid) {
    payload.owner = { reference: `Practitioner/${options.ownerUuid}` };
  }

  if (options.encounterUuid) {
    payload.encounter = { reference: `Encounter/${options.encounterUuid}` };
  }

  await put(`${FHIR_TASK_URL}/${taskId}`, payload);
}

/**
 * Creates a FHIR Task to record fulfillment action on an order.
 * @param orderUuid - The UUID of the order (ServiceRequest) being acted upon
 * @param fhirStatus - FHIR Task status string (e.g. 'requested', 'accepted', 'completed')
 * @param options - Optional fields: notes, ownerUuid, encounterUuid, patientUuid, conceptUuid
 */
export async function createTask(
  orderUuid: string,
  fhirStatus: string,
  options: CreateTaskOptions = {},
): Promise<void> {
  const payload = buildTaskPayload(orderUuid, fhirStatus, options);
  await post(FHIR_TASK_URL, payload);
}

/**
 * Creates or updates a FHIR Task for an order.
 * If an existing Task linked to this order is found, updates it.
 * Otherwise, creates a new Task.
 *
 * @param orderUuid - The UUID of the order (ServiceRequest) being acted upon
 * @param fhirStatus - FHIR Task status string (e.g. 'requested', 'accepted', 'completed')
 * @param options - Optional fields: notes, ownerUuid, encounterUuid, patientUuid, conceptUuid
 */
export async function createOrUpdateTask(
  orderUuid: string,
  fhirStatus: string,
  options: CreateTaskOptions = {},
): Promise<void> {
  const existingTask = await getExistingTaskForOrder(orderUuid);

  if (existingTask) {
    await updateTask(existingTask.id, orderUuid, fhirStatus, options);
  } else {
    await createTask(orderUuid, fhirStatus, options);
  }
}
