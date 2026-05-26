import type { Appointment, Bundle, BundleEntry } from 'fhir/r4';
import {
  AppointmentUnavailability,
  CreateUnavailabilityRequest,
} from '../models';

export const createEmptyBundle = (): Bundle<Appointment> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
});

export const createBundleWithEntry = (
  entry: BundleEntry<Appointment>[],
): Bundle<Appointment> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry,
});

export const createBundleWithAppointments = (
  appointments: Appointment[],
): Bundle<Appointment> =>
  createBundleWithEntry(
    appointments.map((appt) => ({
      resource: appt,
    })),
  );

export const createMockAppointment = (
  uuid: string,
  appointmentNumber: string,
  startDate: string,
  provider: string,
  status: string,
): Appointment => ({
  resourceType: 'Appointment',
  id: uuid,
  status: status as Appointment['status'],
  identifier: [
    {
      system: 'urn:system:bahmni:appointments',
      value: appointmentNumber,
    },
  ],
  serviceType: [
    {
      text: 'Consultation',
      coding: [
        {
          code: 'service-uuid',
          display: 'Consultation',
        },
      ],
    },
  ],
  participant: [
    {
      actor: {
        reference: `Patient/patient-uuid-123`,
        display: 'John Doe (Patient Identifier: ABC200001)',
      },
      status: 'accepted',
    },
    {
      actor: {
        reference: `Practitioner/provider-uuid`,
        display: provider,
      },
      status: 'accepted',
    },
    {
      actor: {
        reference: `Location/location-uuid`,
        display: 'OPD-1',
      },
      status: 'accepted',
    },
  ],
  start: startDate,
  end: startDate,
  comment: 'Follow-up visit',
});

export const createMockAppointmentBundle = (
  appointments: Appointment[],
): Bundle<Appointment> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: appointments.map((resource) => ({
    resource,
  })),
});

export const FIXED_NOW = new Date('2026-02-18T06:02:28.000Z');

export const patientUUID = 'patient-uuid-123';

export const upcomingAppointment = createMockAppointment(
  'appt-uuid-1',
  'APT-001',
  '2025-02-15T10:30:00Z',
  'Dr. Smith',
  'booked',
);

export const pastAppointment = createMockAppointment(
  'appt-uuid-past-1',
  'APT-OLD-001',
  '2025-01-10T10:30:00Z',
  'Dr. Johnson',
  'fulfilled',
);

export const mockUnavailabilities: AppointmentUnavailability[] = [
  {
    uuid: 'unavailability-uuid-1',
    location: {
      uuid: 'location-uuid-1',
      name: 'General OPD',
    },
    service: {
      uuid: 'service-uuid-1',
      name: 'General Medicine',
    },
    provider: {
      uuid: 'provider-uuid-1',
      name: 'Dr. Smith',
    },
    startDate: '2026-05-20',
    startTime: '09:00',
    endDate: '2026-05-20',
    endTime: '12:00',
    voided: false,
    dateCreated: '2026-05-18T10:00:00Z',
    creatorName: 'Admin User',
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
    startDate: '2026-05-22',
    startTime: '14:00',
    endDate: '2026-05-22',
    endTime: '17:00',
    voided: false,
    dateCreated: '2026-05-19T08:00:00Z',
    creatorName: 'Admin User',
  },
];

export const mockCreateRequest: CreateUnavailabilityRequest[] = [
  {
    locationUuid: 'location-uuid-1',
    appointmentServiceUuid: 'service-uuid-1',
    providerUuid: 'provider-uuid-1',
    startDate: '2026-05-25',
    startTime: '09:00',
    endDate: '2026-05-25',
    endTime: '12:00',
  },
];

export const mockCreateRequestWithoutOptionalFields: CreateUnavailabilityRequest[] =
  [
    {
      locationUuid: 'location-uuid-1',
      startDate: '2026-05-26',
      startTime: '10:00',
      endDate: '2026-05-26',
      endTime: '15:00',
    },
  ];

export const multipleRequests: CreateUnavailabilityRequest[] = [
  {
    locationUuid: 'location-uuid-1',
    appointmentServiceUuid: 'service-uuid-1',
    startDate: '2026-05-25',
    startTime: '09:00',
    endDate: '2026-05-25',
    endTime: '12:00',
  },
  {
    locationUuid: 'location-uuid-1',
    appointmentServiceUuid: 'service-uuid-2',
    startDate: '2026-05-25',
    startTime: '09:00',
    endDate: '2026-05-25',
    endTime: '12:00',
  },
];
