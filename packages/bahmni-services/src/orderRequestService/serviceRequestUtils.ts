import type { BundleEntry, Resource, ServiceRequest } from 'fhir/r4';

export function getUniqueServiceRequests<T extends Resource>(
  entries: BundleEntry<T>[],
): BundleEntry<T>[] {
  if (!entries || entries.length === 0) {
    return [];
  }

  const seen = new Set<string>();

  return entries.filter((entry) => {
    const resource = entry.resource;

    if (!resource || resource.resourceType !== 'ServiceRequest') {
      return true;
    }

    const sr = resource as unknown as ServiceRequest;
    const conceptCode = sr.code?.coding?.[0]?.code?.toLowerCase() ?? '';
    const encounterRef = sr.encounter?.reference?.toLowerCase() ?? '';
    const requesterRef = sr.requester?.reference?.toLowerCase() ?? '';

    const dedupeKey = `${conceptCode}|${encounterRef}|${requesterRef}`;

    if (seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}
