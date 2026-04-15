export interface ChildLocation {
  uuid: string;
  display: string;
  retired: boolean;
}

export interface Location {
  uuid: string;
  display: string;
  childLocations: ChildLocation[];
}

export interface LocationResponse {
  results: Location[];
}
