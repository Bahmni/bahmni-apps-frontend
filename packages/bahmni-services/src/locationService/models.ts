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

export interface FHIRLocationTag {
  system: string;
  code: string;
  display?: string;
}

export interface FHIRLocationMeta {
  versionId?: string;
  lastUpdated?: string;
  tag?: FHIRLocationTag[];
}

export interface FHIRLocation {
  resourceType: 'Location';
  id: string;
  meta?: FHIRLocationMeta;
  name: string;
  description?: string;
  status?: string;
}

export interface FHIRBundleEntry {
  fullUrl: string;
  resource: FHIRLocation;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: string;
  total: number;
  entry?: FHIRBundleEntry[];
}
