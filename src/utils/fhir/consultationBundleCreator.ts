import { BundleEntry, FhirResource } from 'fhir/r4';
import { ConsultationBundle } from '../../types/consultationBundle';

export const createConsultationBundle = (
  entries: Array<BundleEntry<FhirResource>>,
): ConsultationBundle => {
  return {
    resourceType: 'ConsultationBundle',
    type: 'transaction',
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    entry: entries,
  };
};

export const createBundleEntry = (
  fullURL: string,
  resource: FhirResource,
  requestMethod: 'POST' | 'PUT',
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
