import { BundleEntry, FhirResource } from 'fhir/r4';
import { generateUUID } from '../utils/utils';
import { EncounterBundle } from './models';

export const createEncounterBundle = (
  entries: Array<BundleEntry<FhirResource>>,
): EncounterBundle => {
  return {
    resourceType: 'EncounterBundle',
    type: 'transaction',
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    entry: entries,
  };
};

export const createBundleEntry = (
  fullUrl: string,
  resource: FhirResource,
  requestMethod: 'POST' | 'PUT' | 'DELETE',
  resourceUrl?: string,
): BundleEntry<FhirResource> => {
  return {
    fullUrl,
    resource,
    request: {
      method: requestMethod,
      url: resourceUrl ?? resource.resourceType,
    },
  };
};
