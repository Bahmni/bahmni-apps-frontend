import { BundleEntry, FhirResource, Resource } from 'fhir/r4';

export interface ConsultationBundle extends Resource {
  readonly resourceType: 'ConsultationBundle';
  readonly type: 'transaction';
  timestamp?: string | undefined;
  entry?: Array<BundleEntry<FhirResource>> | undefined;
}
