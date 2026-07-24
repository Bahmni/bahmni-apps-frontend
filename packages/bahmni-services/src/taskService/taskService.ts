import { Bundle, Task } from 'fhir/r4';
import { get } from '../api';
import { TASKS_URL, FHIR_TASK_URL } from './constants';
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

/**
 * Creates a FHIR Task to record fulfillment action on an order.
 * The backend persists fulfiller_status and fulfiller_comment in the orders table.
 *
 * @param orderUuid - The UUID of the order (ServiceRequest) being acted upon
 * @param fhirStatus - FHIR Task status string (e.g. 'requested', 'accepted', 'completed')
 * @param options - Optional fields: notes, ownerUuid, encounterUuid, patientUuid
 */
export async function createTask(
  orderUuid: string,
  fhirStatus: string,
  options: CreateTaskOptions = {},
): Promise<void> {
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

  await post(FHIR_TASK_URL, payload);
}
