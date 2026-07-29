import type { Encounter } from 'fhir/r4';
import { post } from '../api';
import {
  FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
  FHIR_ENCOUNTER_TAG_SYSTEM,
} from '../constants/fhir';
import { getVisits } from '../encounterService';
import { getUserLoginLocation } from '../userService';
import { FHIR_VISIT_TYPE_SYSTEM } from './constants';
import { getVisitLocationUUID } from './visitService';

const FHIR_ENCOUNTER_URL = '/openmrs/ws/fhir2/R4/Encounter';

const VISIT_TAG = 'visit';

/**
 * Creates a FHIR Encounter resource representing a visit (tagged "visit").
 * Does NOT dispatch any audit event — the caller is responsible for that.
 */
export async function createFhirVisit(
  patientUuid: string,
  locationUuid: string,
  visitTypeUuid: string,
): Promise<Encounter> {
  const resource: Encounter = {
    resourceType: 'Encounter',
    status: 'in-progress',
    class: {
      system: FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
      code: 'AMB',
      display: 'ambulatory',
    },
    meta: {
      tag: [
        {
          system: FHIR_ENCOUNTER_TAG_SYSTEM,
          code: VISIT_TAG,
          display: 'Visit',
        },
      ],
    },
    type: [
      {
        coding: [
          {
            system: FHIR_VISIT_TYPE_SYSTEM,
            code: visitTypeUuid,
          },
        ],
      },
    ],
    subject: { reference: `Patient/${patientUuid}`, type: 'Patient' },
    location: [
      {
        location: {
          reference: `Location/${locationUuid}`,
          type: 'Location',
        },
      },
    ],
    period: { start: new Date().toISOString() },
  };
  return post<Encounter>(FHIR_ENCOUNTER_URL, resource);
}

/**
 * Returns the open (no period.end) visit at the user's login visit-location,
 * or null if none exists.
 * Surfaces getUserLoginLocation()'s synchronous throw as a rejected promise.
 */
export async function getActiveVisitAtLoginLocation(
  patientUuid: string,
): Promise<Encounter | null> {
  let loginLocationUuid: string;
  try {
    loginLocationUuid = getUserLoginLocation().uuid;
  } catch (err) {
    return Promise.reject(err);
  }

  const visitLocationResponse = await getVisitLocationUUID(loginLocationUuid);
  const visitLocationUuid = visitLocationResponse.uuid;

  const visits = await getVisits(patientUuid);

  const locationRef = `Location/${visitLocationUuid}`;
  return (
    visits.find(
      (v) =>
        !v.period?.end &&
        v.location?.some((l) => l.location?.reference === locationRef),
    ) ?? null
  );
}
