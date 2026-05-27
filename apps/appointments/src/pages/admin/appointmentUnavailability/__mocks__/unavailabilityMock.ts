import type {
  AppointmentService,
  AppointmentUnavailability,
  Location,
  Provider,
} from '@bahmni/services';
import {
  APPOINTMENT_LOCATION_TAG,
  PROVIDER_ATTRIBUTE_AVAILABLE,
} from '../constants';

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

export const mockProviders: Provider[] = [
  {
    uuid: 'provider-uuid-1',
    display: 'Dr. John Smith',
    person: {
      uuid: 'person-uuid-1',
      display: 'Dr. John Smith',
      voided: false,
      gender: '',
      age: null,
      birthdate: null,
      birthdateEstimated: false,
      dead: false,
      deathDate: null,
      causeOfDeath: null,
      preferredName: {
        uuid: 'name-uuid-1',
        display: 'Dr. John Smith',
        links: [],
      },
      birthtime: null,
      deathdateEstimated: false,
      links: [],
      resourceVersion: '',
    },
    attributes: [
      {
        attributeType: {
          display: PROVIDER_ATTRIBUTE_AVAILABLE,
          uuid: '',
        },
        value: true,
        uuid: '',
        display: '',
        voided: false,
      },
    ],
  },
  {
    uuid: 'provider-uuid-2',
    display: 'Dr. Jane Doe',
    person: {
      uuid: 'person-uuid-2',
      display: 'Dr. Jane Doe',
      voided: false,
      gender: '',
      age: null,
      birthdate: null,
      birthdateEstimated: false,
      dead: false,
      deathDate: null,
      causeOfDeath: null,
      preferredName: {
        uuid: 'name-uuid-2',
        display: 'Dr. Jane Doe',
        links: [],
      },
      birthtime: null,
      deathdateEstimated: false,
      links: [],
      resourceVersion: '',
    },
    attributes: [
      {
        attributeType: {
          display: PROVIDER_ATTRIBUTE_AVAILABLE,
          uuid: '',
        },
        value: true,
        uuid: '',
        display: '',
        voided: false,
      },
    ],
  },
  {
    uuid: 'provider-uuid-3',
    display: 'Dr. Unavailable Provider',
    person: {
      uuid: 'person-uuid-3',
      display: 'Dr. Unavailable Provider',
      voided: false,
      gender: '',
      age: null,
      birthdate: null,
      birthdateEstimated: false,
      dead: false,
      deathDate: null,
      causeOfDeath: null,
      birthtime: null,
      deathdateEstimated: false,
      links: [],
      resourceVersion: '',
      preferredName: {
        uuid: 'name-uuid-3',
        display: 'Dr. Unavailable Provider',
        links: [],
      },
    },
    attributes: [
      {
        attributeType: {
          display: PROVIDER_ATTRIBUTE_AVAILABLE,
          uuid: '',
        },
        value: false,
        uuid: '',
        display: '',
        voided: false,
      },
    ],
  },
];

export const mockAppointmentUnavailabilities: AppointmentUnavailability[] = [
  {
    uuid: 'unavailability-uuid-1',
    location: {
      uuid: 'location-uuid-1',
      name: 'General OPD',
    },
    service: {
      uuid: 'service-uuid-1',
      name: 'General Medicine OPD Consultation',
    },
    provider: {
      uuid: 'provider-uuid-1',
      name: 'Dr. John Smith',
    },
    startDate: '2026-05-22',
    startTime: '09:00',
    endDate: '2026-05-22',
    endTime: '17:00',
    voided: false,
    dateCreated: '2026-05-22T09:00:00Z',
    creatorName: 'admin',
  },
  {
    uuid: 'unavailability-uuid-2',
    location: {
      uuid: 'location-uuid-2',
      name: 'ENT Ward',
    },
    service: {
      uuid: 'service-uuid-2',
      name: 'ENT Consultation',
    },
    provider: null,
    startDate: '2026-05-23',
    startTime: '10:00',
    endDate: '2026-05-23',
    endTime: '16:00',
    voided: false,
    dateCreated: '2026-05-23T10:00:00Z',
    creatorName: 'admin',
  },
  {
    uuid: 'unavailability-uuid-3',
    location: {
      uuid: 'location-uuid-1',
      name: 'General OPD',
    },
    service: {
      uuid: 'service-uuid-1',
      name: 'General Medicine OPD Consultation',
    },
    provider: null,
    startDate: '2026-05-24',
    startTime: '08:00',
    endDate: '2026-05-25',
    endTime: '18:00',
    voided: false,
    dateCreated: '2026-05-24T08:00:00Z',
    creatorName: 'admin',
  },
];

export const mockCurrentUser = {
  uuid: 'user-uuid-1',
  username: 'admin',
  display: 'Admin User',
};
