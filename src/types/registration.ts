import { FhirPatient } from './patient';
import { FhirEncounter } from './encounter';
import { Provider } from './provider';

export interface Age {
  years: number | null;
  months: number | null;
  days: number | null;
}

export interface Identifier {
  uuid?: string;
  identifier: string;
  identifierType: {
    uuid: string;
    name: string;
    primary: boolean;
    required: boolean;
    identifierSources: IdentifierSource[];
  };
  preferred: boolean;
  voided: boolean;
  registrationNumber?: string;
  selectedIdentifierSource?: IdentifierSource;
  hasOldIdentifier?: boolean;
}

export interface IdentifierSource {
  prefix: string;
  name: string;
}

export interface Patient extends FhirPatient {
  age: Age;
  address: any; // to be replaced with FhirAddress
  relationships: Relationship[];
  newlyAddedRelationships: Relationship[];
  deletedRelationships: Relationship[];
  primaryIdentifier: Identifier;
  extraIdentifiers: Identifier[];
  attributes: PatientAttribute[];
}

export interface Address {
  address1?: string;
  address2?: string;
  cityVillage?: string;
  countyDistrict?: string;
  stateProvince?: string;
  country?: string;
  postalCode?: string;
}

export interface Relationship {
  uuid?: string;
  relationshipType: {
    uuid: string;
    aIsToB: string;
    bIsToA: string;
  };
  personA: {
    uuid: string;
  };
  personB: {
    uuid: string;
    display: string;
  };
}

export interface PatientAttribute {
  attributeType: {
    uuid: string;
    name: string;
    description: string;
    format: string;
    answers: {
      description: string;
      conceptId: string;
    }[];
  };
  value: any;
  voided: boolean;
}

export interface PatientConfig {
  attributeTypes: any[];
  identifierTypes: any[];
  patientAttributesSections: any;
  attributeRows: any[];
}

export interface Visit {
  uuid: string;
  startDatetime: string;
  stopDatetime: string | null;
  patient: {
    uuid: string;
  };
  visitType: {
    uuid: string;
    name: string;
  };
  location: {
    uuid: string;
    name: string;
  };
  encounters: FhirEncounter[];
}

export interface VisitFormData {
    visitType?: VisitType;
    location?: { uuid: string; name: string };
    startDatetime?: string;
    attributes?: any[];
    errors?: any;
    touched?: any;
}

export interface EncounterFormData {
    encounterType?: { uuid: string; name: string };
    location?: { uuid: string; name: string };
    encounterDatetime?: string;
    provider?: Provider;
    obs?: any[];
    orders?: any[];
    visit?: string;
}

export interface VisitType {
    uuid: string;
    name: string;
}
