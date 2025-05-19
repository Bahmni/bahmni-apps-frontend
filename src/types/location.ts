/**
 * Interface for a link within a location
 */
export interface LocationLink {
  rel: string;
  uri: string;
  resourceAlias: string;
}

/**
 * Interface for a single location item
 */
export interface OpenMRSLocation {
  uuid: string;
  display: string;
  links: LocationLink[];
}

/**
 * Interface for the full locations response
 */
export interface OpenMRSLocationResponse {
  results: OpenMRSLocation[];
}
