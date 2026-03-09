import type {
  Appointment as FhirAppointment,
  Bundle,
  BundleEntry,
} from 'fhir/r4';

export const createEmptyBundle = (): Bundle<FhirAppointment> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
});

export const createBundleWithEntry = (
  entry: BundleEntry<FhirAppointment>[],
): Bundle<FhirAppointment> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry,
});

export const createBundleWithAppointments = (
  appointments: FhirAppointment[],
): Bundle<FhirAppointment> =>
  createBundleWithEntry(
    appointments.map((appt) => ({
      resource: appt,
    })),
  );

export const createMockFhirAppointment = (
  uuid: string,
  appointmentNumber: string,
  startDate: string,
  provider: string,
  status: string,
): FhirAppointment => ({
  resourceType: 'Appointment',
  id: uuid,
  status: status as FhirAppointment['status'],
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
  appointments: FhirAppointment[],
): Bundle<FhirAppointment> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: appointments.map((resource) => ({
    resource,
  })),
});
