import { post } from '../../api';
import { searchAppointmentsByAttribute } from '../appointmmetService';
import { APPOINTMENTS_SEARCH_URL } from '../constatns';
import { Appointment } from '../models';

jest.mock('../../api');
const mockedPost = post as jest.MockedFunction<typeof post>;

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
      const searchTerm = { appointmentNumber: 'APT-12345' };
      const fieldsToSearch = ['appointmentNumber'];
      const mockAppointments: Appointment[] = [mockAppointment];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(
        searchTerm,
        fieldsToSearch,
      );

      expect(mockedPost).toHaveBeenCalledWith(
        APPOINTMENTS_SEARCH_URL,
        searchTerm,
      );
      expect(result).toEqual(mockAppointments);
    });

    it('should handle multiple search criteria', async () => {
      const searchTerm = {
        appointmentNumber: 'APT-12345',
        startDate: '2025-01-15T00:00:00.000Z',
      };
      const fieldsToSearch = ['appointmentNumber', 'startDate'];
      const mockAppointments: Appointment[] = [mockAppointment];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(
        searchTerm,
        fieldsToSearch,
      );

      expect(mockedPost).toHaveBeenCalledWith(
        APPOINTMENTS_SEARCH_URL,
        searchTerm,
      );
      expect(result).toEqual(mockAppointments);
    });

    it('should return empty array when no appointments found', async () => {
      const searchTerm = { appointmentNumber: 'NON-EXISTENT' };
      const fieldsToSearch = ['appointmentNumber'];
      const mockAppointments: Appointment[] = [];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(
        searchTerm,
        fieldsToSearch,
      );

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return multiple appointments when found', async () => {
      const searchTerm = { startDate: '2025-01-15T00:00:00.000Z' };
      const fieldsToSearch = ['startDate'];
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

      const result = await searchAppointmentsByAttribute(
        searchTerm,
        fieldsToSearch,
      );

      expect(result).toEqual(mockAppointments);
      expect(result).toHaveLength(2);
    });

    it('should propagate API errors', async () => {
      const searchTerm = { appointmentNumber: 'APT-12345' };
      const fieldsToSearch = ['appointmentNumber'];
      const mockError = new Error('API Error: Network failure');

      mockedPost.mockRejectedValue(mockError);

      await expect(
        searchAppointmentsByAttribute(searchTerm, fieldsToSearch),
      ).rejects.toThrow('API Error: Network failure');
      expect(mockedPost).toHaveBeenCalledWith(
        APPOINTMENTS_SEARCH_URL,
        searchTerm,
      );
    });

    it('should handle empty search term object', async () => {
      const searchTerm = {};
      const fieldsToSearch: string[] = [];
      const mockAppointments: Appointment[] = [];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(
        searchTerm,
        fieldsToSearch,
      );

      expect(mockedPost).toHaveBeenCalledWith(
        APPOINTMENTS_SEARCH_URL,
        searchTerm,
      );
      expect(result).toEqual([]);
    });
  });
});
