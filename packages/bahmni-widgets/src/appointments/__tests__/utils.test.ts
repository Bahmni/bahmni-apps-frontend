import type { Appointment as FhirAppointment } from 'fhir/r4';
import {
  sortAppointmentsByDate,
  transformFhirAppointmentToFormatted,
  FormattedAppointment,
} from '../utils';

describe('transformFhirAppointmentToFormatted', () => {
  const mockFhirAppointment: FhirAppointment = {
    resourceType: 'Appointment',
    id: 'appt-uuid-123',
    identifier: [
      {
        system: 'http://fhir.bahmni.org/code-system/appointments',
        value: 'APT-12345',
      },
    ],
    status: 'booked',
    serviceType: [
      {
        text: 'Consultation',
      },
    ],
    start: '2025-02-15T10:30:00Z',
    end: '2025-02-15T11:00:00Z',
    participant: [
      {
        actor: {
          reference: 'Practitioner/prac-uuid-123',
          display: 'Dr. Smith',
        },
        status: 'accepted',
      },
    ],
    reasonCode: [
      {
        text: 'Follow-up',
      },
    ],
  };

  it('should format FHIR appointment with ISO startDateTime', () => {
    const result = transformFhirAppointmentToFormatted(mockFhirAppointment);

    expect(result.appointmentDate).toMatch(/15\/02\/2025/);
    expect(result.appointmentSlot).toBeTruthy();
  });

  it('should extract appointment slot from start and end times', () => {
    const result = transformFhirAppointmentToFormatted(mockFhirAppointment);

    expect(result.appointmentSlot).toMatch(
      /\d{2}:\d{2}\s(AM|PM|am|pm)\s-\s\d{2}:\d{2}\s(AM|PM|am|pm)/,
    );
    expect(result.appointmentSlot).toBeTruthy();
  });

  it('should handle appointment without end time', () => {
    const appointmentWithoutEnd = {
      ...mockFhirAppointment,
      end: undefined,
    };

    const result = transformFhirAppointmentToFormatted(appointmentWithoutEnd);

    expect(result.appointmentSlot).toBeTruthy();
  });

  it('should handle appointment without start time', () => {
    const appointmentWithoutStart = {
      ...mockFhirAppointment,
      start: undefined,
    };

    const result = transformFhirAppointmentToFormatted(appointmentWithoutStart);

    expect(result.appointmentDate).toBe('-');
    expect(result.appointmentSlot).toBe('-');
  });

  it('should extract appointment number from identifier', () => {
    const result = transformFhirAppointmentToFormatted(mockFhirAppointment);

    expect(result.appointmentNumber).toBe('APT-12345');
  });

  it('should extract service type', () => {
    const result = transformFhirAppointmentToFormatted(mockFhirAppointment);

    expect(result.service).toBe('Consultation');
  });

  it('should extract provider from practitioner participant', () => {
    const result = transformFhirAppointmentToFormatted(mockFhirAppointment);

    expect(result.provider).toBe('Dr. Smith');
  });

  it('should handle missing provider', () => {
    const appointmentWithoutProvider = {
      ...mockFhirAppointment,
      participant: [],
    };

    const result = transformFhirAppointmentToFormatted(
      appointmentWithoutProvider,
    );

    expect(result.provider).toBe('-');
  });

  it('should map reason codes to reason string', () => {
    const result = transformFhirAppointmentToFormatted(mockFhirAppointment);

    expect(result.reason).toBe('Follow-up');
  });

  it('should handle multiple reason codes', () => {
    const appointmentWithMultipleReasons = {
      ...mockFhirAppointment,
      reasonCode: [{ text: 'Follow-up' }, { text: 'Check-up' }],
    };

    const result = transformFhirAppointmentToFormatted(
      appointmentWithMultipleReasons,
    );

    expect(result.reason).toBe('Follow-up, Check-up');
  });

  it('should preserve all formatted appointment properties', () => {
    const result = transformFhirAppointmentToFormatted(mockFhirAppointment);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('uuid');
    expect(result).toHaveProperty('appointmentNumber');
    expect(result).toHaveProperty('appointmentDate');
    expect(result).toHaveProperty('appointmentSlot');
    expect(result).toHaveProperty('service');
    expect(result).toHaveProperty('reason');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('provider');
  });

  it('should return FormattedAppointment with all required fields', () => {
    const result = transformFhirAppointmentToFormatted(mockFhirAppointment);

    // Verify all fields exist and are properly typed
    expect(typeof result.id).toBe('string');
    expect(typeof result.uuid).toBe('string');
    expect(typeof result.appointmentNumber).toBe('string');
    expect(typeof result.appointmentDate).toBe('string');
    expect(typeof result.appointmentSlot).toBe('string');
    expect(typeof result.service).toBe('string');
    expect(typeof result.reason).toBe('string');
    expect(typeof result.status).toBe('string');
    expect(typeof result.provider).toBe('string');
  });
});

describe('sortAppointmentsByDate', () => {
  const createFormattedAppointment = (
    date: string,
    uuid: string,
  ): FormattedAppointment => ({
    uuid,
    id: uuid,
    appointmentDate: date,
    appointmentSlot: '10:00 AM',
    appointmentNumber: `APT-${uuid}`,
    service: 'Test Service',
    status: 'Scheduled',
    reason: 'Test Reason',
    provider: 'Dr. Test',
  });

  it('should sort appointments in ascending order by date', () => {
    const appointments = [
      createFormattedAppointment('15/03/2025', 'appt-1'),
      createFormattedAppointment('10/03/2025', 'appt-2'),
      createFormattedAppointment('20/03/2025', 'appt-3'),
    ];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted[0].uuid).toBe('appt-2');
    expect(sorted[1].uuid).toBe('appt-1');
    expect(sorted[2].uuid).toBe('appt-3');
  });

  it('should return new array without mutating original', () => {
    const appointments = [
      createFormattedAppointment('15/03/2025', 'appt-1'),
      createFormattedAppointment('10/03/2025', 'appt-2'),
    ];
    const original = [...appointments];

    sortAppointmentsByDate(appointments);

    expect(appointments).toEqual(original);
  });

  it('should handle single appointment', () => {
    const appointments = [createFormattedAppointment('15/03/2025', 'appt-1')];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted).toHaveLength(1);
    expect(sorted[0].uuid).toBe('appt-1');
  });

  it('should handle empty array', () => {
    const appointments: FormattedAppointment[] = [];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted).toEqual([]);
  });

  it('should handle appointments with same date', () => {
    const appointments = [
      createFormattedAppointment('15/03/2025', 'appt-1'),
      createFormattedAppointment('15/03/2025', 'appt-2'),
      createFormattedAppointment('15/03/2025', 'appt-3'),
    ];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted).toHaveLength(3);
    expect(sorted[0].appointmentDate).toBe('15/03/2025');
  });

  it('should sort dates in DD/MM/YYYY format correctly', () => {
    const appointments = [
      createFormattedAppointment('31/01/2025', 'appt-1'),
      createFormattedAppointment('01/01/2025', 'appt-2'),
      createFormattedAppointment('15/01/2025', 'appt-3'),
    ];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted[0].uuid).toBe('appt-2');
    expect(sorted[1].uuid).toBe('appt-3');
    expect(sorted[2].uuid).toBe('appt-1');
  });

  it('should maintain appointment properties after sorting', () => {
    const appointments = [
      createFormattedAppointment('15/03/2025', 'appt-1'),
      createFormattedAppointment('10/03/2025', 'appt-2'),
    ];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted[0].status).toBe('Scheduled');
    expect(sorted[0].appointmentSlot).toBe('10:00 AM');
  });
});
