import { Location, LocationResponse } from '../../models';

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
