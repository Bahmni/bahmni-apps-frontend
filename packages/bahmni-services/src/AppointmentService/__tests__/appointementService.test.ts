import { post, get } from '../../api';
import {
  searchAppointmentsByAttribute,
  getAppointmentById,
} from '../appointmmetService';
import { APPOINTMENTS_SEARCH_URL, APPOINTMENTS_URL } from '../constatns';
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
      const searchTerm = { appointmentNumber: 'APT-12345' };
      const mockAppointments: Appointment[] = [mockAppointment];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(searchTerm);

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
      const mockAppointments: Appointment[] = [mockAppointment];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(searchTerm);

      expect(mockedPost).toHaveBeenCalledWith(
        APPOINTMENTS_SEARCH_URL,
        searchTerm,
      );
      expect(result).toEqual(mockAppointments);
    });

    it('should return empty array when no appointments found', async () => {
      const searchTerm = { appointmentNumber: 'NON-EXISTENT' };
      const mockAppointments: Appointment[] = [];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(searchTerm);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return multiple appointments when found', async () => {
      const searchTerm = { startDate: '2025-01-15T00:00:00.000Z' };
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

      const result = await searchAppointmentsByAttribute(searchTerm);

      expect(result).toEqual(mockAppointments);
      expect(result).toHaveLength(2);
    });

    it('should propagate API errors', async () => {
      const searchTerm = { appointmentNumber: 'APT-12345' };
      const mockError = new Error('API Error: Network failure');

      mockedPost.mockRejectedValue(mockError);

      await expect(searchAppointmentsByAttribute(searchTerm)).rejects.toThrow(
        'API Error: Network failure',
      );
      expect(mockedPost).toHaveBeenCalledWith(
        APPOINTMENTS_SEARCH_URL,
        searchTerm,
      );
    });

    it('should handle empty search term object', async () => {
      const searchTerm = {};
      const mockAppointments: Appointment[] = [];

      mockedPost.mockResolvedValue(mockAppointments);

      const result = await searchAppointmentsByAttribute(searchTerm);

      expect(mockedPost).toHaveBeenCalledWith(
        APPOINTMENTS_SEARCH_URL,
        searchTerm,
      );
      expect(result).toEqual([]);
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

      expect(mockedGet).toHaveBeenCalledWith(`${APPOINTMENTS_URL}/${mockUUID}`);
      expect(mockedGet).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/appointments/${mockUUID}`,
      );
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

    it('should work with different UUID formats', async () => {
      const shortUUID = '12345';
      await getAppointmentById(shortUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        `${APPOINTMENTS_URL}/${shortUUID}`,
      );
    });

    it('should handle empty UUID', async () => {
      const emptyUUID = '';
      await getAppointmentById(emptyUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        `${APPOINTMENTS_URL}/${emptyUUID}`,
      );
    });

    it('should return appointment with complete patient information', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.patient).toBeDefined();
      expect(result.patient.uuid).toBe('patient-uuid-1');
      expect(result.patient.identifier).toBe('ABC200001');
      expect(result.patient.name).toBe('John Doe');
      expect(result.patient.gender).toBe('M');
    });

    it('should return appointment with service details', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.service).toBeDefined();
      expect(result.service.uuid).toBe('service-uuid');
      expect(result.service.name).toBe('Consultation');
    });

    it('should return appointment with status information', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.status).toBe('Scheduled');
      expect(result.appointmentKind).toBe('Scheduled');
    });

    it('should return appointment with reasons when present', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0].conceptUuid).toBe('reason-uuid');
      expect(result.reasons[0].name).toBe('Consultation');
    });
  });
});
