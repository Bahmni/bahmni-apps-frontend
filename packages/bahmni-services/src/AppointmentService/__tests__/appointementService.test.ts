import { get } from '../../api';
import {
  createMockFhirAppointment,
  createEmptyBundle,
  createBundleWithAppointments,
} from '../_mocks_/mockData';
import {
  getUpcomingAppointments,
  getPastAppointments,
} from '../appointmmetService';
import { UPCOMING_APPOINTMENTS_URL, PAST_APPOINTMENTS_URL } from '../constants';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

const FIXED_NOW = new Date('2026-02-18T06:02:28.000Z');

jest.useFakeTimers().setSystemTime(FIXED_NOW);

const setupMockBundle = (appointments: any[]) => {
  const mockBundle = createBundleWithAppointments(appointments);
  mockedGet.mockResolvedValue(mockBundle);
  return mockBundle;
};

const setupEmptyBundle = () => {
  const mockBundle = createEmptyBundle();
  mockedGet.mockResolvedValue(mockBundle);
  return mockBundle;
};

const SINGLE_APPOINTMENT = {
  upcoming: createMockFhirAppointment(
    'appt-uuid-1',
    'APT-001',
    '2025-02-15T10:30:00Z',
    'Dr. Smith',
    'booked',
  ),
  past: createMockFhirAppointment(
    'appt-uuid-past-1',
    'APT-OLD-001',
    '2025-01-10T10:30:00Z',
    'Dr. Johnson',
    'fulfilled',
  ),
};

describe('Appointment Service', () => {
  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpcomingAppointments', () => {
    const patientUUID = 'patient-uuid-123';

    it('should call GET with correct endpoint for upcoming appointments', async () => {
      setupMockBundle([SINGLE_APPOINTMENT.upcoming]);

      await getUpcomingAppointments(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        UPCOMING_APPOINTMENTS_URL(patientUUID),
      );
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('should return FHIR Bundle with appointments and participant information', async () => {
      const mockBundle = setupMockBundle([
        createMockFhirAppointment(
          'appt-uuid-1',
          'APT-001',
          '2025-02-15T10:30:00Z',
          'Dr. Smith',
          'booked',
        ),
        createMockFhirAppointment(
          'appt-uuid-2',
          'APT-002',
          '2025-02-20T14:00:00Z',
          'Dr. Johnson',
          'booked',
        ),
      ]);

      const result = await getUpcomingAppointments(patientUUID);

      expect(result).toEqual(mockBundle);
      expect(result.entry).toHaveLength(2);
      expect(result.entry?.[0]?.resource?.id).toBe('appt-uuid-1');
      expect(result.entry?.[0]?.resource?.identifier?.[0]?.value).toBe(
        'APT-001',
      );
      expect(result.entry?.[0]?.resource?.status).toBe('booked');
      expect(result.entry?.[1]?.resource?.id).toBe('appt-uuid-2');

      // Verify participant information
      expect(result.entry?.[0]?.resource?.participant).toBeDefined();
      const patientParticipant = result.entry?.[0]?.resource?.participant?.find(
        (p) => p.actor?.reference?.startsWith('Patient/'),
      );
      expect(patientParticipant?.actor?.reference).toContain(
        'patient-uuid-123',
      );
      expect(patientParticipant?.actor?.display).toContain('John Doe');
      expect(patientParticipant?.actor?.display).toContain('ABC200001');
    });

    it('should return empty Bundle when no upcoming appointments', async () => {
      setupEmptyBundle();

      const result = await getUpcomingAppointments(patientUUID);

      expect(result.entry).toHaveLength(0);
    });
  });

  describe('getPastAppointments', () => {
    const patientUUID = 'patient-uuid-123';

    it('should call GET with correct endpoint for past appointments', async () => {
      setupMockBundle([SINGLE_APPOINTMENT.past]);

      await getPastAppointments(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        PAST_APPOINTMENTS_URL(patientUUID),
      );
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('should return FHIR Bundle with past appointments and location information in participant', async () => {
      const mockBundle = setupMockBundle([
        createMockFhirAppointment(
          'appt-uuid-past-1',
          'APT-OLD-001',
          '2025-01-10T10:30:00Z',
          'Dr. Johnson',
          'fulfilled',
        ),
        createMockFhirAppointment(
          'appt-uuid-past-2',
          'APT-OLD-002',
          '2025-01-05T11:00:00Z',
          'Dr. Smith',
          'fulfilled',
        ),
      ]);

      const result = await getPastAppointments(patientUUID);

      expect(result).toEqual(mockBundle);
      expect(result.entry).toHaveLength(2);
      expect(result.entry?.[0]?.resource?.id).toBe('appt-uuid-past-1');
      expect(result.entry?.[0]?.resource?.identifier?.[0]?.value).toBe(
        'APT-OLD-001',
      );
      expect(result.entry?.[0]?.resource?.status).toBe('fulfilled');
      expect(result.entry?.[1]?.resource?.id).toBe('appt-uuid-past-2');

      // Verify location information in participant
      expect(result.entry?.[0]?.resource?.participant).toBeDefined();
      const locationParticipant =
        result.entry?.[0]?.resource?.participant?.find((p) =>
          p.actor?.reference?.startsWith('Location/'),
        );
      expect(locationParticipant?.actor?.reference).toContain('location-uuid');
      expect(locationParticipant?.actor?.display).toContain('OPD-1');
    });

    it('should return empty Bundle when no past appointments', async () => {
      setupEmptyBundle();

      const result = await getPastAppointments(patientUUID);

      expect(result.entry).toHaveLength(0);
    });

    it('should handle optional count parameter', async () => {
      const mockBundle = setupMockBundle([SINGLE_APPOINTMENT.past]);

      const result = await getPastAppointments(patientUUID, 5);

      expect(result).toEqual(mockBundle);
      expect(result.entry).toHaveLength(1);
      expect(mockedGet).toHaveBeenCalledWith(
        PAST_APPOINTMENTS_URL(patientUUID, 5),
      );
    });

    it('should propagate API errors', async () => {
      const mockError = new Error('API Error');
      mockedGet.mockRejectedValue(mockError);

      await expect(getPastAppointments(patientUUID)).rejects.toThrow(
        'API Error',
      );
    });
  });
});
