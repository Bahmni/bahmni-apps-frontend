import { Location, LocationResponse, FHIRBundle } from '../../models';

export const mockLocation: Location = {
  uuid: 'location-uuid-1',
  display: 'OPD',
  childLocations: [
    { uuid: 'child-uuid-1', display: 'OPD Ward', retired: false },
    { uuid: 'child-uuid-2', display: 'OPD Old Ward', retired: true },
  ],
};

export const mockLocationWithNoChildren: Location = {
  uuid: 'location-uuid-2',
  display: 'IPD',
  childLocations: [],
};

export const mockLocationResponse: LocationResponse = {
  results: [mockLocation, mockLocationWithNoChildren],
};

export const mockEmptyLocationResponse: LocationResponse = {
  results: [],
};

export const mockFHIRLocationBundle: FHIRBundle = {
  resourceType: 'Bundle',
  id: '1df63687-28b5-49b6-a204-eee03a8bf2ea',
  type: 'searchset',
  total: 2,
  entry: [
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Location/7672b695-1872-40de-9ae8-a2bb38038208',
      resource: {
        resourceType: 'Location',
        id: '7672b695-1872-40de-9ae8-a2bb38038208',
        name: 'IOM MHAC NAIROBI',
        status: 'active',
      },
    },
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Location/c8ef048d-4e31-43fa-8518-ee0d6cc32dfc',
      resource: {
        resourceType: 'Location',
        id: 'c8ef048d-4e31-43fa-8518-ee0d6cc32dfc',
        name: 'IOM MHAC MAKATI',
        status: 'active',
      },
    },
  ],
};

export const mockEmptyFHIRLocationBundle: FHIRBundle = {
  resourceType: 'Bundle',
  id: 'empty-bundle',
  type: 'searchset',
  total: 0,
};
