import { get } from './api';
import {
  USER_RESOURCE_URL,
  PRACTITIONER_RESOURCE_URL,
  BAHMNI_USER_COOKIE_NAME,
} from '@constants/app';
import { FhirPractitioner, FormattedPractitioner } from '@types/practitioner';
import { UserResponse } from '@types/user';
import { getCookieByName } from '@utils/common';

/**
 * Fetches the current user's UUID from cookies and REST endpoint
 * @returns Promise resolving to user UUID or null if not found
 */
export async function getCurrentUserUUID(): Promise<string | null> {
  // Get username from cookie
  const encodedUsername = getCookieByName(BAHMNI_USER_COOKIE_NAME);
  if (!encodedUsername) {
    return null;
  }

  // Decode username from cookie value (handles URL encoding and quotes)
  const username = decodeURIComponent(encodedUsername).replace(
    /^"(.*)"$/,
    '$1',
  );

  // Get user from REST API
  const userResponse = await get<UserResponse>(USER_RESOURCE_URL(username));
  if (!userResponse.results || userResponse.results.length === 0) {
    return null;
  }

  return userResponse.results[0].uuid;
}

/**
 * Fetches a practitioner by UUID from the FHIR R4 endpoint
 * @param uuid - The UUID of the practitioner to fetch
 * @returns Promise resolving to a FhirPractitioner or null if not found
 */
export async function getPractitionerByUUID(
  uuid: string,
): Promise<FhirPractitioner | null> {
  return await get<FhirPractitioner>(PRACTITIONER_RESOURCE_URL(uuid));
}

/**
 * Fetches the active practitioner's details
 * @returns Promise resolving to a FhirPractitioner or null if not found
 */
export async function getActivePractitioner(): Promise<FhirPractitioner | null> {
  const userUUID = await getCurrentUserUUID();
  if (!userUUID) {
    return null;
  }
  return await getPractitionerByUUID(userUUID);
}

/**
 * Formats a FHIR practitioner into a more user-friendly format
 * @param practitioner - The FHIR practitioner to format
 * @returns A formatted practitioner object or null if input is null
 */
export function formatPractitioner(
  practitioner: FhirPractitioner | null,
): FormattedPractitioner | null {
  if (!practitioner) {
    return null;
  }
  const name = practitioner.name?.[0];
  const identifier = practitioner.identifier?.[0]?.value;

  return {
    id: practitioner.id,
    identifier: identifier,
    active: practitioner.active,
    fullName: name?.text,
    familyName: name?.family,
    givenName: name?.given?.[0],
    gender: practitioner.gender,
    lastUpdated: practitioner.meta.lastUpdated,
  };
}
