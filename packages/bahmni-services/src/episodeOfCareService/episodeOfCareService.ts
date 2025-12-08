import { Bundle, Encounter } from 'fhir/r4';
import { get } from '../api';
import { EOC_ENCOUNTERS_URL } from './constants';
import { EpisodeOfCareDataType } from './models';

/**
 * Fetches encounters for Episode-of-Care UUIDs and extracts visit and encounter UUIDs
 * @param eocUuids - Array of EOC UUIDs or single EOC UUID
 * @returns Promise resolving to object with visit UUIDs and encounter UUIDs
 */
export async function getEncountersForEOC(
  eocUuids: string[] | string,
): Promise<EpisodeOfCareDataType> {
  const ids = Array.isArray(eocUuids) ? eocUuids.join(',') : eocUuids;
  const bundle = await get<Bundle>(EOC_ENCOUNTERS_URL(ids));

  const encounters =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Encounter')
      ?.map((entry) => entry.resource as Encounter) ?? [];

  const visitUuidsSet = new Set<string>();
  const encounterUuids: string[] = [];

  encounters.forEach((encounter) => {
    if (encounter.id) {
      encounterUuids.push(encounter.id);
    }

    const visitId = encounter.partOf?.reference?.split('/')[1];
    if (visitId) {
      visitUuidsSet.add(visitId);
    }
  });

  const visitUuids = Array.from(visitUuidsSet);

  return { visitUuids, encounterUuids };
}
