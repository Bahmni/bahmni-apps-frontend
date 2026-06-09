import {
  AUDIT_LOG_EVENT_DETAILS,
  createFhirEncounter,
  dispatchAuditEvent,
  getActiveVisitByPatient,
  getCurrentProvider,
  getCurrentUser,
  getEncounterSessionDuration,
  getUserLoginLocation,
  searchEncounters,
  updateFhirEncounter,
  type AuditEventType,
} from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import { buildRegistrationEncounterPayload } from '../utils/fhirEncounterMapper';

/**
 * Creates a registration encounter for patient.
 * Fetches current user/provider/location, builds the FHIR payload, posts it,
 * and dispatches an audit event. Throws on failure — callers decide how to handle errors.
 */
export async function createRegistrationEncounterForPatient(
  patientUuid: string,
  encounterTypeUuid: string,
): Promise<Encounter> {
  const locationUuid = getUserLoginLocation().uuid;
  const user = await getCurrentUser();
  const provider = user ? await getCurrentProvider(user.uuid) : null;

  const encounter = buildRegistrationEncounterPayload({
    patientUuid,
    encounterTypeUuid,
    locationUuid,
    providerUuid: provider?.uuid,
  });

  const createdEncounter = await createFhirEncounter(encounter);

  const encounterTypeName =
    createdEncounter.type?.[0]?.coding?.[0]?.display ??
    createdEncounter.type?.[0]?.text ??
    encounterTypeUuid;

  dispatchAuditEvent({
    eventType: AUDIT_LOG_EVENT_DETAILS.CREATE_ENCOUNTER
      .eventType as AuditEventType,
    patientUuid,
    messageParams: { encounterType: encounterTypeName },
    module: AUDIT_LOG_EVENT_DETAILS.CREATE_ENCOUNTER.module,
  });
  return createdEncounter;
}

function isEncounterInSession(
  encounter: Encounter,
  sessionDurationMs: number,
): boolean {
  return (
    !!encounter.period?.start &&
    new Date(encounter.period.start).getTime() + sessionDurationMs > Date.now()
  );
}

function sortByMostRecent(encounters: Encounter[]): Encounter[] {
  return [...encounters].sort((a, b) => {
    const dateA = new Date(a.period?.start ?? 0).getTime();
    const dateB = new Date(b.period?.start ?? 0).getTime();
    return dateB - dateA;
  });
}

/**
 * Returns the first registration encounter whose session is still valid
 * (period.start + sessionDuration > now), or null if none exists.
 * Uses _lastUpdated as a loose server-side pre-filter to reduce result size,
 * then validates period.start client-side for correctness.
 * Throws on failure — callers decide how to handle errors.
 */
export async function findValidRegistrationEncounterInSession(
  patientUuid: string,
  encounterTypeUuid: string,
): Promise<Encounter | null> {
  const sessionDuration = await getEncounterSessionDuration();
  const sessionDurationMs = sessionDuration * 60 * 1000;
  const sessionStartTime = new Date(Date.now() - sessionDurationMs);

  const candidates = await searchEncounters({
    patient: patientUuid,
    type: encounterTypeUuid,
    _lastUpdated: `ge${sessionStartTime.toISOString()}`,
  });

  return (
    sortByMostRecent(candidates).find((e) =>
      isEncounterInSession(e, sessionDurationMs),
    ) ?? null
  );
}

/**
 * Links a registration encounter to the patient's newly created active visit.
 * If an unlinked in-session encounter exists, links it to the visit.
 * If the session has expired (or no encounter was found), creates a fresh encounter
 * linked directly to the visit.
 * Silently no-ops when there is no active visit or all in-session encounters are already linked.
 * Throws on unexpected API failures — callers decide how to handle errors.
 */
export async function linkRegistrationEncounterToVisit(
  patientUuid: string,
  encounterTypeUuid: string,
): Promise<void> {
  const activeVisit = await getActiveVisitByPatient(patientUuid);
  const visitResult = activeVisit?.results?.[0];
  const visitUuid = visitResult?.uuid;
  if (!visitUuid) return;

  const sessionDuration = await getEncounterSessionDuration();
  const sessionDurationMs = sessionDuration * 60 * 1000;
  const sessionStartTime = new Date(Date.now() - sessionDurationMs);

  const candidates = await searchEncounters({
    patient: patientUuid,
    type: encounterTypeUuid,
    _lastUpdated: `ge${sessionStartTime.toISOString()}`,
  });

  const validEncounters = sortByMostRecent(
    candidates.filter((e) => isEncounterInSession(e, sessionDurationMs)),
  );

  const unlinkedEncounter = validEncounters.find((e) => !e.partOf);

  if (unlinkedEncounter?.id) {
    await updateFhirEncounter(unlinkedEncounter.id, {
      ...unlinkedEncounter,
      period: { start: new Date(visitResult.startDatetime).toISOString() },
      partOf: { reference: `Encounter/${visitUuid}` },
    });
    return;
  }

  if (validEncounters.length === 0) return;
}
