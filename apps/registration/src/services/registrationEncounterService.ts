import {
  AUDIT_LOG_EVENT_DETAILS,
  MODULE_LABELS,
  createFhirEncounter,
  dispatchAuditEvent,
  getCurrentProvider,
  getCurrentUser,
  getUserLoginLocation,
  get,
  OPENMRS_REST_V1,
  type AuditEventType,
} from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import { buildRegistrationEncounterPayload } from '../utils/fhirEncounterMapper';

const ENCOUNTER_TYPE_URL = `${OPENMRS_REST_V1}/encountertype`;

/**
 * Creates a registration encounter for patient.
 * Fetches current user/provider/location, builds the FHIR payload, posts it,
 * and dispatches an audit event. Throws on failure — callers decide how to handle errors.
 */
export async function createRegistrationEncounterForPatient(
  patientUuid: string,
  encounterTypeUuid: string,
  options?: { visitUuid?: string; periodStart?: string },
): Promise<Encounter> {
  const locationUuid = getUserLoginLocation().uuid;
  const user = await getCurrentUser();
  const provider = user ? await getCurrentProvider(user.uuid) : null;

  const encounter = buildRegistrationEncounterPayload({
    patientUuid,
    encounterTypeUuid,
    locationUuid,
    providerUuid: provider?.uuid,
    visitUuid: options?.visitUuid,
    periodStart: options?.periodStart,
  });

  const createdEncounter = await createFhirEncounter(encounter);

  const encounterTypeName =
    createdEncounter.type?.[0]?.coding?.[0]?.display ??
    createdEncounter.type?.[0]?.text ??
    encounterTypeUuid;

  // EDIT_ENCOUNTER is a shared event with no default module (Clinical relies on
  // that), so the registration module is passed explicitly here.
  dispatchAuditEvent({
    eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER
      .eventType as AuditEventType,
    patientUuid,
    messageParams: {
      encounterUuid: createdEncounter.id,
      encounterType: encounterTypeName,
    },
    module: MODULE_LABELS.REGISTRATION,
  });
  return createdEncounter;
}

export async function getEncounterTypeUuidByName(
  name: string,
): Promise<string | undefined> {
  const response = await get<{ results: { uuid: string; name: string }[] }>(
    `${ENCOUNTER_TYPE_URL}?q=${encodeURIComponent(name)}&v=default`,
  );
  return response.results.find((r) => r.name === name)?.uuid;
}
