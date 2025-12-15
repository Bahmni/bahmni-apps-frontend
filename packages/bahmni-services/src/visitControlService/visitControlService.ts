import { get, post } from '../api';
import { dispatchAuditEvent } from '../auditLogService/auditEventDispatcher';
import { AUDIT_LOG_EVENT_DETAILS } from '../auditLogService/constants';
import type { AuditEventType } from '../auditLogService/models';
import { getUserLoginLocation } from '../userService/userService';
import {
  CREATE_VISIT_URL,
  GET_ACTIVE_VISIT_URL,
  GET_VISIT_LOCATION,
  VISIT_TYPES_URL,
} from './constants';
import type {
  ActiveVisit,
  VisitData,
  VisitLocationResponse,
  VisitType,
  VisitTypes,
} from './models';

/**
 * Fetches visit types from Bahmni configuration
 * @returns Promise<VisitTypes> - Visit types response with name-uuid mapping
 */
export const getVisitTypes = async (): Promise<VisitTypes> => {
  return get<VisitTypes>(VISIT_TYPES_URL());
};

/**
 * Get active visits for a patient
 * @param patientUuid - The UUID of the patient
 * @returns Promise<{results: Array<{uuid: string}>}> - The active visit data
 */
export const getActiveVisitByPatient = async (
  patientUuid: string,
): Promise<ActiveVisit> => {
  return get<ActiveVisit>(GET_ACTIVE_VISIT_URL(patientUuid));
};

/**
 * Get visit location UUID for a given login location
 * @param loginLocation - The login location UUID
 * @returns Promise<VisitLocationResponse> - The visit location details including UUID
 */
const getVisitLocationUUID = async (
  loginLocation: string,
): Promise<VisitLocationResponse> => {
  return get<VisitLocationResponse>(GET_VISIT_LOCATION(loginLocation));
};

/**
 * Create a new visit for a patient
 * @param visitData - The visit data including patient UUID, visit type, and location
 * @returns Promise<string> - The created visit UUID
 */
const createVisit = async (visitData: VisitData): Promise<string> => {
  return post<string>(CREATE_VISIT_URL, visitData);
};

/**
 * Checks if a patient has an active visit
 * @param patientUuid - The UUID of the patient
 * @returns Promise<boolean> - True if patient has an active visit, false otherwise
 */
export const checkIfActiveVisitExists = async (
  patientUuid: string,
): Promise<boolean> => {
  const response = await getActiveVisitByPatient(patientUuid);
  return response?.results && response.results.length > 0;
};

/**
 * Creates a new visit for a patient with the specified visit type
 * Automatically sets the visit location based on the user's login location
 * Fetches the correct visit location UUID from Bahmni's visitLocation endpoint
 * Dispatches an audit event after successful visit creation
 * @param patientUuid - The UUID of the patient
 * @param visitType - The visit type object containing name and uuid
 * @returns Promise<string> - The created visit UUID
 */
export const createVisitForPatient = async (
  patientUuid: string,
  visitType: VisitType,
) => {
  const visitLocationUUID = await getVisitLocationUUID(
    getUserLoginLocation().uuid,
  );

  const visitDetails = {
    patient: patientUuid,
    visitType: visitType.uuid,
    location: visitLocationUUID.uuid,
  };

  const result = await createVisit(visitDetails);

  dispatchAuditEvent({
    eventType: AUDIT_LOG_EVENT_DETAILS.OPEN_VISIT.eventType as AuditEventType,
    patientUuid,
    messageParams: { visitType: visitType.name },
    module: AUDIT_LOG_EVENT_DETAILS.OPEN_VISIT.module,
  });

  return result;
};
