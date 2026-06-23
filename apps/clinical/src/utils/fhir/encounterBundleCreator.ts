import { BundleEntry, FhirResource } from 'fhir/r4';
import { EncounterBundle } from '../../models/encounterBundle';

export const createEncounterBundle = (
  entries: Array<BundleEntry<FhirResource>>,
): EncounterBundle => {
  return {
    resourceType: 'EncounterBundle',
    type: 'transaction',
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    entry: entries,
  };
};

export const createBundleEntry = (
  fullURL: string,
  resource: FhirResource,
  requestMethod: 'POST' | 'PUT' | 'DELETE',
  resourceUrl?: string,
): BundleEntry<FhirResource> => {
  return {
    fullUrl: fullURL,
    resource: resource,
    request: {
      method: requestMethod,
      url: resourceUrl ?? resource.resourceType,
    },
  };
};
