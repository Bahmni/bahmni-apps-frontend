export interface ConceptSearch {
  conceptName: string;
  conceptUuid: string;
  matchedName: string;
  disabled?: boolean;
}

export interface ConceptClass {
  uuid: string;
  name: string;
}

export interface ConceptData {
  uuid: string;
  display: string;
  name: ConceptName;
  datatype: ConceptDataType;
  conceptClass: ConceptClassData;
  set: boolean;
  version: string | null;
  retired: boolean;
  names: ConceptName[];
  descriptions: unknown[];
  mappings: unknown[];
  answers: unknown[];
  setMembers: ConceptSetMember[];
  attributes: ConceptAttribute[];
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias?: string;
  }>;
  resourceVersion: string;
}

export interface ConceptName {
  display: string;
  uuid: string;
  name: string;
  locale: string;
  localePreferred: boolean;
  conceptNameType: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias?: string;
  }>;
  resourceVersion: string;
}

export interface ConceptDataType {
  uuid: string;
  display: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias?: string;
  }>;
}

export interface ConceptClassData {
  uuid: string;
  display: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias?: string;
  }>;
}

export interface ConceptSetMember {
  uuid: string;
  display: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias?: string;
  }>;
}

export interface ConceptAttribute {
  uuid: string;
  display: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias?: string;
  }>;
}
