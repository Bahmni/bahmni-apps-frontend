import { get } from './api';
import {
  EncounterConceptsResponse,
  EncounterConcepts,
  Concept,
} from '@types/encounterConcepts';
import { ENCOUNTER_CONCEPTS_URL } from '@constants/app';
import { COMMON_ERROR_MESSAGES } from '@constants/errors';
import i18next from 'i18next';

/**
 * Transforms a record of string key-value pairs into an array of Concept objects
 * @param record Record with string keys and values
 * @returns Array of Concept objects with name and uuid properties
 */
function transformToConcepts<T>(record: Record<string, T> = {}): Concept[] {
  return Object.entries(record).map(([name, uuid]) => ({
    name,
    uuid: String(uuid),
  }));
}

/**
 * Fetches encounter concepts from the OpenMRS API and transforms the response
 * @returns Promise resolving to EncounterConcepts containing arrays of Concept objects
 * @throws Error when the response has an unexpected structure or format
 */
export async function getEncounterConcepts(): Promise<EncounterConcepts> {
  const response = await get<EncounterConceptsResponse>(ENCOUNTER_CONCEPTS_URL);

  // Check if response is a valid object with the expected structure
  if (!response || typeof response !== 'object') {
    throw new Error(i18next.t(COMMON_ERROR_MESSAGES.INVALID_RESPONSE));
  }

  return {
    visitTypes: transformToConcepts(response.visitTypes),
    encounterTypes: transformToConcepts(response.encounterTypes),
    orderTypes: transformToConcepts(response.orderTypes),
    conceptData: transformToConcepts(response.conceptData),
  };
}
