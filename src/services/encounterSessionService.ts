import { get } from './api';
import { FhirEncounter, FhirEncounterBundle } from '../types/encounter';
import { getActiveVisit } from './encounterService';
import { ENCOUNTER_SESSION_DURATION_GP_URL } from '@constants/app';
import { ENCOUNTER_SEARCH_URL } from '@constants/app';

interface EncounterSearchParams {
  'subject:Patient': string;
  _tag?: string;
  _lastUpdated?: string;
  type?: string;
}

/**
 * Searches for encounters using FHIR API with given parameters
 * @param params - Search parameters for encounter query
 * @returns Promise resolving to array of FhirEncounter
 */
export async function searchEncounters(params: EncounterSearchParams): Promise<FhirEncounter[]> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });
  
  const url = `${ENCOUNTER_SEARCH_URL}?${queryParams.toString()}`;
  const bundle = await get<FhirEncounterBundle>(url);
  
  return bundle.entry?.map((entry: { resource: FhirEncounter }) => entry.resource) || [];
}

/**
 * Gets the encounter session duration from global properties
 * @returns Promise resolving to session duration in minutes (default: 30)
 */
export async function getEncounterSessionDuration(): Promise<number> {
  try {
    const response = await get<{ value: string }>(ENCOUNTER_SESSION_DURATION_GP_URL);
    const duration = Number(response.value);
    return !isNaN(duration) && duration > 0 ? duration : 60; // Default to 60 minutes if invalid
  } catch (error) {
    console.warn('Failed to fetch encounter session duration, using default:', error);
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
  patientUUID: string
): Promise<FhirEncounter | null> {
  if (!encounters.length) return null;
  
  try {
    const activeVisit = await getActiveVisit(patientUUID);
    if (!activeVisit) return null;
    
    // Filter encounters that belong to the active visit
    const sessionEncounter = encounters.find(encounter => {
      // Check if encounter matches the active visit or overlaps with visit period
      return encounter.id === activeVisit.id ||
             // Check if encounter period overlaps with visit period
             (encounter.period && activeVisit.period && 
              !activeVisit.period.end && // Active visit has no end date
              encounter.period.start);
    });
    
    return sessionEncounter || null;
  } catch (error) {
    console.warn('Error filtering encounters by active visit:', error);
    // If we can't get active visit info, return the most recent encounter
    return encounters.length > 0 ? encounters[0] : null;
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
  sessionDurationMinutes?: number
): Promise<FhirEncounter | null> {
  try {
    if (!patientUUID) {
      return null;
    }
    
    const duration = sessionDurationMinutes || await getEncounterSessionDuration();
    const sessionStartTime = new Date(Date.now() - duration * 60 * 1000);
    const lastUpdatedParam = `ge${sessionStartTime.toISOString()}`;

    const searchParams: EncounterSearchParams = {
      'subject:Patient': patientUUID,
      _tag: 'encounter',
      _lastUpdated: lastUpdatedParam
    };
    
    try {
      // Search for encounters within session duration
      const encounters = await searchEncounters(searchParams);
      
      if (encounters.length === 0) {
        return null;
      }
      
      // Filter by practitioner if provided
      let filteredEncounters = encounters;
      if (practitionerUUID) {
        try {
          filteredEncounters = encounters.filter(encounter => {
            if (!encounter.participant) {
              return false;
            }
            
            return encounter.participant.some(participant => {
              const individual = participant.individual;
              if (!individual?.reference) {
                return false;
              }
              
              const practitionerRef = individual.reference;
              
              // Check multiple possible formats
              const refMatch = (
                practitionerRef === `Practitioner/${practitionerUUID}` ||
                practitionerRef === practitionerUUID ||
                practitionerRef.endsWith(`/${practitionerUUID}`) ||
                practitionerRef.split('/').pop() === practitionerUUID
              );
              
              // Check identifier if available
              const identifierMatch = individual.identifier?.value === practitionerUUID;
              
              return refMatch || identifierMatch;
            });
          });
          
          // If no encounters found for this practitioner, return null (New Consultation)
          if (filteredEncounters.length === 0) {
            return null;
          }
        } catch (filterError) {
          console.warn('Error filtering encounters by practitioner, using all encounters:', filterError);
          // If filtering fails, fall back to using all encounters
          filteredEncounters = encounters;
        }
      }
      
      // Filter by active visit and return the most recent one
      const result = await filterByActiveVisit(filteredEncounters, patientUUID);
      
      return result;
    } catch (apiError) {
      console.warn('Encounter session API call failed, defaulting to new consultation:', apiError);
      // In development or when API is not available, we can't determine session state
      // Return null to default to "New Consultation"
      return null;
    }
  } catch (error) {
    console.error('Error finding active encounter in session:', error);
    return null;
  }
}

/**
 * Checks if there is an active encounter session for a patient and practitioner
 * @param patientUUID - Patient UUID
 * @param practitionerUUID - Practitioner UUID (optional, for practitioner-specific sessions)
 * @returns Promise resolving to boolean indicating if session is active
 */
export async function hasActiveEncounterSession(patientUUID: string, practitionerUUID?: string): Promise<boolean> {
  const activeEncounter = await findActiveEncounterInSession(patientUUID, practitionerUUID);
  return activeEncounter !== null;
}
