import { post, get } from '../../api';
import { BAHMNI_SQL_URL } from '../../constants/app';
import {
  searchAppointmentsByAttribute,
  getAppointmentById,
  getUpcomingAppointments,
  getPastAppointments,
} from '../appointmmetService';
import {
  APPOINTMENTS_SEARCH_URL,
  getAppointmentByIdUrl,
  getUpcomingAppointmentsUrl,
  getPastAppointmentsUrl,
} from '../constants';
import { Appointment } from '../models';

jest.mock('../../api');
const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('Appointment Service', () => {
  const mockAppointment: Appointment = {
    uuid: 'appt-uuid-1',
    appointmentNumber: 'APT-12345',
    patient: {
      uuid: 'patient-uuid-1',
      identifier: 'ABC200001',
      name: 'John Doe',
      gender: 'M',
      birthDate: 631152000000,
      age: 0,
      PatientIdentifier: '',
      customAttributes: [],
    },
    service: {
      uuid: 'service-uuid',
      name: 'Consultation',
      appointmentServiceId: 0,
      description: null,
      speciality: null,
      startTime: '',
      endTime: '',
      location: {
        name: '',
        uuid: '',
      },
      color: '',
      initialAppointmentStatus: null,
    },
    serviceType: {
      uuid: 'service-type-uuid',
      name: 'General',
    },
    provider: {
      uuid: 'provider-uuid',
      name: 'Dr. Smith',
    },
    location: {
      uuid: 'location-uuid',
      name: 'OPD',
    },
    startDateTime: 1737024600000,
    endDateTime: 1737026400000,
    appointmentKind: 'Scheduled',
    status: 'Scheduled',
    comments: 'Follow-up visit',
    reasons: [
      {
        conceptUuid: 'reason-uuid',
        name: 'Consultation',
      },
    ],
    dateCreated: 1737024000000,
    length: 0,
    dateAppointmentScheduled: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchAppointmentsByAttribute', () => {
    it('should call post with the correct URL and search term', async () => {
      const searchParam = { appointmentNumber: 'APT-12345' };
      const mockAppointments: Appointment[] = [mockAppointment];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(searchParam);

      expect(mockedPost).toHaveBeenCalledWith(
        APPOINTMENTS_SEARCH_URL,
        searchParam,
      );
      expect(result).toEqual(mockAppointments);
    });

    it('should return empty array when no appointments found', async () => {
      const searchParam = { appointmentNumber: 'NON-EXISTENT' };
      const mockAppointments: Appointment[] = [];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(searchParam);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return multiple appointments when found', async () => {
      const searchParam = { startDate: '2025-01-15T00:00:00.000Z' };
      const mockAppointment2: Appointment = {
        ...mockAppointment,
        uuid: 'appt-uuid-2',
        appointmentNumber: 'APT-67890',
        patient: {
          ...mockAppointment.patient,
          uuid: 'patient-uuid-2',
          identifier: 'ABC200002',
          name: 'Jane Smith',
          gender: 'F',
        },
        startDateTime: 1737028200000,
        endDateTime: 1737030000000,
      };
      const mockAppointments: Appointment[] = [
        mockAppointment,
        mockAppointment2,
      ];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(searchParam);

      expect(result).toEqual(mockAppointments);
      expect(result).toHaveLength(2);
    });
  });

  describe('getAppointmentById', () => {
    const mockUUID = 'appt-uuid-1';

    beforeEach(() => {
      jest.clearAllMocks();
      mockedGet.mockResolvedValue(mockAppointment);
    });

    it('should call API with correct appointment URL', async () => {
      await getAppointmentById(mockUUID);

      expect(mockedGet).toHaveBeenCalledWith(getAppointmentByIdUrl(mockUUID));
    });

    it('should return Appointment from API response', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result).toEqual(mockAppointment);
      expect(result.uuid).toBe(mockUUID);
      expect(result.appointmentNumber).toBe('APT-12345');
      expect(result.patient.name).toBe('John Doe');
    });

    it('should handle 404 not found errors', async () => {
      const notFoundError = new Error('Appointment not found');
      notFoundError.name = 'NotFoundError';
      mockedGet.mockRejectedValue(notFoundError);

      await expect(getAppointmentById('invalid-uuid')).rejects.toThrow(
        notFoundError,
      );
    });
  });

  describe('getUpcomingAppointments', () => {
    const patientUUID = 'patient-uuid-123';
    const mockSqlResponse = {
      uuid: 'appt-uuid-1',
      DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY: [2025, 2, 15, 10, 30],
      DASHBOARD_APPOINTMENTS_SLOT_KEY: '10:30 AM - 10:46 AM',
      DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: 'APT-001',
      DASHBOARD_APPOINTMENTS_REASON_KEY: 'Follow-up',
      DASHBOARD_APPOINTMENTS_SERVICE_KEY: 'Consultation',
      DASHBOARD_APPOINTMENTS_SERVICE_TYPE_KEY: 'General',
      DASHBOARD_APPOINTMENTS_PROVIDER_KEY: 'Dr. Smith',
      DASHBOARD_APPOINTMENTS_LOCATION_KEY: 'OPD-1',
      DASHBOARD_APPOINTMENTS_STATUS_KEY: 'Scheduled',
    };

    it('should call GET with correct SQL endpoint for upcoming appointments', async () => {
      const mockAppointments = [mockSqlResponse];
      mockedGet.mockResolvedValue(mockAppointments);

      await getUpcomingAppointments(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        getUpcomingAppointmentsUrl(patientUUID),
      );
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('should return transformed appointments from SQL response', async () => {
      const mockAppointment2 = {
        ...mockSqlResponse,
        uuid: 'appt-uuid-2',
        DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: 'APT-002',
        DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY: [2025, 2, 20, 14, 0],
      };
      const mockAppointments = [mockSqlResponse, mockAppointment2];
      mockedGet.mockResolvedValue(mockAppointments);

      const result = await getUpcomingAppointments(patientUUID);

      expect(result).toHaveLength(2);
      expect(result[0].uuid).toBe('appt-uuid-1');
      expect(result[0].status).toBe('Scheduled');
      expect(result[0].provider?.name).toBe('Dr. Smith');
      expect(result[1].uuid).toBe('appt-uuid-2');
    });

    it('should return empty array when no upcoming appointments', async () => {
      mockedGet.mockResolvedValue([]);

      const result = await getUpcomingAppointments(patientUUID);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getPastAppointments', () => {
    const patientUUID = 'patient-uuid-123';
    const mockSqlResponse = {
      uuid: 'appt-uuid-past-1',
      DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY: [2025, 1, 10, 10, 30],
      DASHBOARD_APPOINTMENTS_SLOT_KEY: '10:30 AM - 10:46 AM',
      DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: 'APT-OLD-001',
      DASHBOARD_APPOINTMENTS_REASON_KEY: 'Consultation',
      DASHBOARD_APPOINTMENTS_SERVICE_KEY: 'Consultation',
      DASHBOARD_APPOINTMENTS_SERVICE_TYPE_KEY: 'General',
      DASHBOARD_APPOINTMENTS_PROVIDER_KEY: 'Dr. Johnson',
      DASHBOARD_APPOINTMENTS_LOCATION_KEY: 'OPD-2',
      DASHBOARD_APPOINTMENTS_STATUS_KEY: 'Completed',
    };

    it('should call GET with correct SQL endpoint for past appointments', async () => {
      const mockAppointments = [mockSqlResponse];
      mockedGet.mockResolvedValue(mockAppointments);

      await getPastAppointments(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        getPastAppointmentsUrl(patientUUID),
      );
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('should return transformed appointments from SQL response', async () => {
      const mockAppointment2 = {
        ...mockSqlResponse,
        uuid: 'appt-uuid-past-2',
        DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: 'APT-OLD-002',
        DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY: [2025, 1, 5, 11, 0],
      };
      const mockAppointments = [mockSqlResponse, mockAppointment2];
      mockedGet.mockResolvedValue(mockAppointments);

      const result = await getPastAppointments(patientUUID);

      expect(result).toHaveLength(2);
      expect(result[0].uuid).toBe('appt-uuid-past-1');
      expect(result[0].status).toBe('Completed');
      expect(result[0].provider?.name).toBe('Dr. Johnson');
      expect(result[1].uuid).toBe('appt-uuid-past-2');
    });

    it('should return empty array when no past appointments', async () => {
      mockedGet.mockResolvedValue([]);

      const result = await getPastAppointments(patientUUID);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should propagate API errors', async () => {
      const mockError = new Error('SQL Query Error');
      mockedGet.mockRejectedValue(mockError);

      await expect(getPastAppointments(patientUUID)).rejects.toThrow(
        'SQL Query Error',
      );
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining('pastAppointments'),
      );
    });
  });
});
