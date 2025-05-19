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
  age: number | null;
  birthdate: string | null;
  birthdateEstimated: boolean;
  dead: boolean;
  deathDate: string | null;
  causeOfDeath: string | null;
  preferredName: PersonName;
  voided: boolean;
  birthtime: string | null;
  deathdateEstimated: boolean;
  links: Link[];
  resourceVersion: string;
}

/**
 * Interface representing OpenMRS Provider resource from REST API
 */
export interface Provider {
  uuid: string;
  display: string;
  person: Person;
}

/**
 * Interface representing Provider response from REST API
 */
export interface ProviderResponse {
  results: Provider[];
}
