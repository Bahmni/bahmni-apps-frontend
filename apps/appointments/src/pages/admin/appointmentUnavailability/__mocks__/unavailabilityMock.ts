import type {
  AppointmentService,
  AppointmentUnavailability,
  Location,
  Provider,
} from '@bahmni/services';
import type { Bundle, Location as FHIRLocation } from 'fhir/r4';
import {
  APPOINTMENT_LOCATION_TAG,
  PROVIDER_ATTRIBUTE_AVAILABLE_FOR_APPOINTMENT,
} from '../constants';
import type { UnavailabilityFormData } from '../models';

export const mockLocations: Location[] = [
  {
    uuid: 'location-uuid-1',
    display: 'General OPD',
    childLocations: [],
    tags: [{ display: APPOINTMENT_LOCATION_TAG }],
  },
  {
    uuid: 'location-uuid-2',
    display: 'ENT Ward',
    childLocations: [],
    tags: [{ display: APPOINTMENT_LOCATION_TAG }],
  },
];

export const mockNonAppointmentLocations: Location[] = [
  {
    uuid: 'location-uuid-3',
    display: 'Admin Office',
    childLocations: [],
    tags: [{ display: 'Admin' }],
  },
  {
    uuid: 'location-uuid-4',
    display: 'Pharmacy',
    childLocations: [],
    tags: [{ display: 'Pharmacy' }],
  },
];

export const mockAppointmentServices: AppointmentService[] = [
  {
    appointmentServiceId: 1,
    uuid: 'service-uuid-1',
    name: 'General Medicine OPD Consultation',
    description: 'Appointment for General Medicine Consultation',
    speciality: { uuid: 'speciality-uuid-1', name: 'General Medicine' },
    startTime: '09:00',
    endTime: '17:00',
    location: { uuid: 'location-uuid-1', name: 'General OPD' },
    durationMins: 15,
    color: '#00FF00',
    initialAppointmentStatus: 'Scheduled',
    attributes: [],
  },
  {
    appointmentServiceId: 2,
    uuid: 'service-uuid-2',
    name: 'ENT OPD Consultation',
    description: 'Appointment for ENT Consultation',
    speciality: { uuid: 'speciality-uuid-2', name: 'ENT' },
    startTime: '10:00',
    endTime: '16:00',
    location: { uuid: 'location-uuid-2', name: 'ENT Ward' },
    durationMins: 30,
    color: '#0000FF',
    initialAppointmentStatus: 'Scheduled',
    attributes: [],
  },
];

const createMockProvider = (
  providerUuid: string,
  displayName: string,
  personUuid: string,
  nameUuid: string,
  available: boolean,
): Provider => ({
  uuid: providerUuid,
  display: displayName,
  person: {
    uuid: personUuid,
    display: displayName,
    voided: false,
    gender: '',
    age: null,
    birthdate: null,
    birthdateEstimated: false,
    dead: false,
    deathDate: null,
    causeOfDeath: null,
    preferredName: { uuid: nameUuid, display: displayName, links: [] },
    birthtime: null,
    deathdateEstimated: false,
    links: [],
    resourceVersion: '',
  },
  attributes: [
    {
      attributeType: {
        display: PROVIDER_ATTRIBUTE_AVAILABLE_FOR_APPOINTMENT,
        uuid: '',
      },
      value: available,
      uuid: '',
      display: '',
      voided: false,
    },
  ],
});

export const mockProviders: Provider[] = [
  createMockProvider(
    'provider-uuid-1',
    'Dr. John Smith',
    'person-uuid-1',
    'name-uuid-1',
    true,
  ),
  createMockProvider(
    'provider-uuid-2',
    'Dr. Jane Doe',
    'person-uuid-2',
    'name-uuid-2',
    true,
  ),
  createMockProvider(
    'provider-uuid-3',
    'Dr. Unavailable Provider',
    'person-uuid-3',
    'name-uuid-3',
    false,
  ),
];

const toUnavailability = (
  uuid: string,
  location: { uuid: string; name: string },
  service: { uuid: string; name: string } | null,
  provider: { uuid: string; name: string } | null,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  dateCreated: string,
  creatorName: string,
): AppointmentUnavailability => ({
  uuid,
  location,
  service,
  provider,
  startDate,
  startTime,
  endDate,
  endTime,
  voided: false,
  dateCreated,
  creatorName,
});

export const mockAppointmentUnavailabilities: AppointmentUnavailability[] = [
  toUnavailability(
    'unavailability-uuid-1',
    { uuid: 'location-uuid-1', name: 'General OPD' },
    { uuid: 'service-uuid-1', name: 'General Medicine OPD Consultation' },
    { uuid: 'provider-uuid-1', name: 'Dr. John Smith' },
    '2026-05-22',
    '09:00',
    '2026-05-22',
    '17:00',
    '2026-05-22T09:00:00Z',
    'admin',
  ),
  toUnavailability(
    'unavailability-uuid-2',
    { uuid: 'location-uuid-2', name: 'ENT Ward' },
    { uuid: 'service-uuid-2', name: 'ENT Consultation' },
    null,
    '2026-05-23',
    '10:00',
    '2026-05-23',
    '16:00',
    '2026-05-23T10:00:00Z',
    'admin',
  ),
  toUnavailability(
    'unavailability-uuid-3',
    { uuid: 'location-uuid-1', name: 'General OPD' },
    { uuid: 'service-uuid-1', name: 'General Medicine OPD Consultation' },
    null,
    '2026-05-24',
    '08:00',
    '2026-05-25',
    '18:00',
    '2026-05-24T08:00:00Z',
    'admin',
  ),
];

export const mockCurrentUser = {
  uuid: 'user-uuid-1',
  username: 'admin',
  display: 'Admin User',
};

export const mockFHIRBundle: Bundle<FHIRLocation> = {
  resourceType: 'Bundle',
  id: 'test-bundle',
  type: 'searchset',
  total: 2,
  entry: [
    {
      fullUrl: 'http://test/Location/location-uuid-1', // NOSONAR
      resource: {
        resourceType: 'Location',
        id: 'location-uuid-1',
        name: 'General OPD',
      },
    },
    {
      fullUrl: 'http://test/Location/location-uuid-2', // NOSONAR
      resource: {
        resourceType: 'Location',
        id: 'location-uuid-2',
        name: 'ENT Ward',
      },
    },
  ],
};

export const mockUnavailabilityFormData: UnavailabilityFormData = {
  locationUuid: 'location-uuid-1',
  selectedServiceItems: [],
  selectedProviderItems: [],
  startDate: new Date('2026-05-25'),
  startTime: '09:00',
  startTimePeriod: 'AM',
  endDate: new Date('2026-05-25'),
  endTime: '05:00',
  endTimePeriod: 'PM',
  filteredServicesCount: 0,
  availableProvidersCount: 0,
};

export const mockUnavailableProviders: Provider[] = mockProviders.map((p) => ({
  ...p,
  attributes: p.attributes?.map((a) => ({ ...a, value: false })) ?? [],
}));

export const mockRequests = [
  { locationUuid: 'location-uuid-1', startTime: '09:00', endTime: '17:00' },
];

export const mockUnavailabilityNoServiceNoProvider: AppointmentUnavailability =
  toUnavailability(
    'unavailability-uuid-4',
    { uuid: 'location-uuid-1', name: 'General OPD' },
    null,
    null,
    '2026-05-25',
    '09:00',
    '2026-05-25',
    '17:00',
    '2026-05-25T09:00:00Z',
    'admin',
  );
