import {
  createOrderFulfillmentEncounter,
  getActiveVisitByPatient,
  OrderFulfillmentEncounterParams,
} from '@bahmni/services';

type EnsureEncounterParams = Omit<OrderFulfillmentEncounterParams, 'visitUuid'>;

/**
 * Checks if the patient has an active visit and, if so, creates an encounter
 * under that visit via ConsultationBundle.
 *
 * Returns the encounter UUID if one was created, or null if the patient has
 * no active visit (in which case the caller should proceed without an encounter).
 */
export async function ensureEncounterForActiveVisit(
  params: EnsureEncounterParams,
): Promise<string | null> {
  const { patientUuid, practitionerUuid, locationUuid, encounterTypeUuid } =
    params;

  const activeVisitResponse = await getActiveVisitByPatient(patientUuid);

  if (!activeVisitResponse?.results?.length) {
    return null;
  }

  const visitUuid = activeVisitResponse.results[0].uuid;

  return createOrderFulfillmentEncounter({
    patientUuid,
    visitUuid,
    practitionerUuid,
    locationUuid,
    encounterTypeUuid,
  });
}
