export interface FhirEncounterPeriod {
  start: string;
  end?: string;
}

export interface FhirEncounterTypeCode {
  system: string;
  code: string;
  display: string;
}

export interface FhirEncounterType {
  coding: FhirEncounterTypeCode[];
}

export interface FhirEncounterLocation {
  location: {
    reference: string;
    type: string;
    display: string;
  };
}

export interface FhirEncounterParticipant {
  individual?: {
    reference: string;
    type: string;
    identifier?: {
      value: string;
    };
    display: string;
  };
}

export interface FhirEncounter {
  resourceType: string;
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
    tag: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  status: string;
  class: {
    system: string;
    code: string;
  };
  type: FhirEncounterType[];
  subject: {
    reference: string;
    type: string;
    display: string;
  };
  participant?: FhirEncounterParticipant[];
  period: FhirEncounterPeriod;
  location: FhirEncounterLocation[];
}

export interface FhirEncounterBundle {
  resourceType: string;
  id: string;
  meta: {
    lastUpdated: string;
  };
  type: string;
  total: number;
  link: Array<{
    relation: string;
    url: string;
  }>;
  entry: Array<{
    fullUrl: string;
    resource: FhirEncounter;
  }>;
}
