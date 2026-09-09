export interface ChildLocation {
  uuid: string;
  display: string;
  retired: boolean;
}

export interface LocationTag {
  uuid?: string;
  display: string;
}

export interface Location {
  uuid: string;
  display: string;
  childLocations?: ChildLocation[];
  tags?: LocationTag[];
}

export interface LocationResponse {
  results: Location[];
}
