import { BundleEntry, FhirResource, Resource } from 'fhir/r4';

export interface EncounterBundle extends Resource {
  readonly resourceType: 'EncounterBundle';
  readonly type: 'transaction';
  timestamp?: string | undefined;
  entry?: Array<BundleEntry<FhirResource>> | undefined;
}
