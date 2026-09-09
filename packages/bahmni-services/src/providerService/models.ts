import { Location } from '../locationService';

/**
 * Interface representing a link to a resource
 */
export interface Link {
  rel: string;
  uri: string;
  resourceAlias: string;
}

/**
 * Interface representing a person's name
 */
export interface PersonName {
  uuid: string;
  display: string;
  links: Link[];
}

/**
 * Interface representing a person in OpenMRS
 */
export interface Person {
  uuid: string;
  display: string;
  gender: string;
  age?: number;
  birthdate?: string;
  birthdateEstimated: boolean;
  dead: boolean;
  deathDate?: string;
  causeOfDeath?: string;
  preferredName?: PersonName;
  voided: boolean;
  birthtime?: string;
  deathdateEstimated: boolean;
  links: Link[];
  resourceVersion: string;
}

export interface ProviderAttributeType {
  uuid: string;
  display: string;
}

export interface ProviderAttribute {
  uuid: string;
  display: string;
  attributeType: ProviderAttributeType;
  value: boolean | Location;
  voided: boolean;
}

/**
 * Interface representing OpenMRS Provider resource from REST API
 */
export interface Provider {
  uuid: string;
  display: string;
  person: Person;
  attributes?: ProviderAttribute[];
}

/**
 * Interface representing Provider response from REST API
 */
export interface ProviderResponse {
  results: Provider[] | null;
  links?: Link[];
}
