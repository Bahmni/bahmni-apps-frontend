import {
  ENCOUNTER_SESSION_DURATION_GP_URL,
  ENCOUNTER_SEARCH_URL,
  CONSULTATION_ENCOUNTER_TYPE_UUID,
} from '@constants/app';

import { FhirEncounter, FhirEncounterBundle } from '../types/encounter';
import { get } from './api';
import { getActiveVisit } from './encounterService';

interface EncounterSearchParams {
  patient: string;
  _tag?: string;
  _lastUpdated?: string;
  participant?: string;
  type?: string;
}

/**
 * Searches for encounters using FHIR API with given parameters
 * @param params - Search parameters for encounter query
 * @returns Promise resolving to array of FhirEncounter
 */
export async function searchEncounters(
  params: EncounterSearchParams,
): Promise<FhirEncounter[]> {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });

  const url = `${ENCOUNTER_SEARCH_URL}?${queryParams.toString()}`;

  const bundle = await get<FhirEncounterBundle>(url);

  return (
    bundle.entry?.map((entry: { resource: FhirEncounter }) => entry.resource) ||
    []
  );
}

/**
 * Gets the encounter session duration from global properties
 * @returns Promise resolving to session duration in minutes (default: 30)
 */
export async function getEncounterSessionDuration(): Promise<number> {
  try {
    const response = await get<{ value: string }>(
      ENCOUNTER_SESSION_DURATION_GP_URL,
    );
    const duration = Number(response.value);
    return !isNaN(duration) && duration > 0 ? duration : 60; // Default to 60 minutes if invalid
  } catch {
    return 30;
  }
}

/**
 * Filters encounters to find those belonging to the active visit
 * @param encounters - Array of encounters to filter
 * @param patientUUID - Patient UUID
 * @returns Promise resolving to encounter within active visit or null
 */
export async function filterByActiveVisit(
  encounters: FhirEncounter[],
  patientUUID: string,
): Promise<FhirEncounter | null> {
  if (!encounters.length) return null;

  try {
    const activeVisit = await getActiveVisit(patientUUID);
    if (!activeVisit) return null;

    // Find encounter that belongs to the active visit
    return (
      encounters.find((encounter) => {
        const visitUUID = encounter.partOf?.reference?.split('/')[1];
        return activeVisit.id === visitUUID;
      }) ?? null
    );
  } catch {
    // If we can't get visit info, default to "New Consultation"
    return null;
  }
}

/**
 * Finds an active encounter within the session duration for a patient and practitioner
 * @param patientUUID - Patient UUID
 * @param practitionerUUID - Practitioner UUID (optional, for practitioner-specific sessions)
 * @param sessionDurationMinutes - Session duration in minutes (optional, will fetch from config if not provided)
 * @returns Promise resolving to active encounter or null
 */
export async function findActiveEncounterInSession(
  patientUUID: string,
  practitionerUUID?: string,
  sessionDurationMinutes?: number,
): Promise<FhirEncounter | null> {
  try {
    if (!patientUUID) return null;

    const duration =
      sessionDurationMinutes ?? (await getEncounterSessionDuration());
    const sessionStartTime = new Date(Date.now() - duration * 60 * 1000);
    const lastUpdatedParam = `ge${sessionStartTime.toISOString()}`;

    const searchParams: EncounterSearchParams = {
      patient: patientUUID,
      _tag: 'encounter',
      _lastUpdated: lastUpdatedParam,
      type: CONSULTATION_ENCOUNTER_TYPE_UUID,
    };

    // Add participant filter if practitioner UUID is provided
    if (practitionerUUID) {
      searchParams.participant = practitionerUUID;
    }

    // Search for encounters within session duration
    // Server-side filtering by patient, duration, and practitioner (if provided)
    const encounters = await searchEncounters(searchParams);

    if (encounters.length === 0) return null;

    // Filter by active visit and return the most recent one
    const result = await filterByActiveVisit(encounters, patientUUID);
    return result;
  } catch {
    return null;
  }
}

/**
 * Checks if there is an active encounter session for a patient and practitioner
 * @param patientUUID - Patient UUID
 * @param practitionerUUID - Practitioner UUID (optional, for practitioner-specific sessions)
 * @returns Promise resolving to boolean indicating if session is active
 */
export async function hasActiveEncounterSession(
  patientUUID: string,
  practitionerUUID?: string,
): Promise<boolean> {
  const activeEncounter = await findActiveEncounterInSession(
    patientUUID,
    practitionerUUID,
  );
  return activeEncounter !== null;
}
