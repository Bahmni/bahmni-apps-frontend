import { del, get, post } from '../../api';
import {
  createMockAppointment,
  createEmptyBundle,
  createBundleWithAppointments,
} from '../__mocks__/mocks';
import {
  getUpcomingAppointments,
  getPastAppointments,
  searchAppointmentsByAttribute,
  updateAppointmentStatus,
  getAppointmentById,
  getAllAppointmentServices,
  deleteAppointmentService,
} from '../appointmentService';
import {
  UPCOMING_APPOINTMENTS_URL,
  PAST_APPOINTMENTS_URL,
  APPOINTMENTS_SEARCH_URL,
  getAppointmentByIdUrl,
  updateAppointmentStatusUrl,
  ALL_APPOINTMENT_SERVICES_URL,
  getDeleteAppointmentServiceUrl,
} from '../constants';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedDel = del as jest.MockedFunction<typeof del>;

const FIXED_NOW = new Date('2026-02-18T06:02:28.000Z');

jest.useFakeTimers().setSystemTime(FIXED_NOW);

const patientUUID = 'patient-uuid-123';

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

const upcomingAppointment = createMockAppointment(
  'appt-uuid-1',
  'APT-001',
  '2025-02-15T10:30:00Z',
  'Dr. Smith',
  'booked',
);

const pastAppointment = createMockAppointment(
  'appt-uuid-past-1',
  'APT-OLD-001',
  '2025-01-10T10:30:00Z',
  'Dr. Johnson',
  'fulfilled',
);

describe('Appointment Service', () => {
  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      'getUpcomingAppointments',
      () => getUpcomingAppointments(patientUUID),
      UPCOMING_APPOINTMENTS_URL(patientUUID),
    ],
    [
      'getPastAppointments',
      () => getPastAppointments(patientUUID),
      PAST_APPOINTMENTS_URL(patientUUID),
    ],
    [
      'getAppointmentById',
      () => getAppointmentById('appt-uuid-1'),
      getAppointmentByIdUrl('appt-uuid-1'),
    ],
    [
      'getAllAppointmentServices',
      () => getAllAppointmentServices(),
      ALL_APPOINTMENT_SERVICES_URL,
    ],
  ])(
    '%s should call GET with correct endpoint and return result',
    async (_, fn, expectedUrl) => {
      const mockResult = { id: 'mock' };
      mockedGet.mockResolvedValue(mockResult);

      const result = await fn();

      expect(mockedGet).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockResult);
    },
  );

  it.each([
    ['getUpcomingAppointments', () => getUpcomingAppointments(patientUUID)],
    ['getPastAppointments', () => getPastAppointments(patientUUID)],
  ])('%s should return empty Bundle when no appointments', async (_, fn) => {
    setupEmptyBundle();

    const result = await fn();

    expect(result.entry).toHaveLength(0);
  });

  it('searchAppointmentsByAttribute should call POST with correct endpoint and params and return result', async () => {
    const searchParam = { patient: patientUUID };
    const mockBundle = createBundleWithAppointments([upcomingAppointment]);
    mockedPost.mockResolvedValue(mockBundle);

    const result = await searchAppointmentsByAttribute(searchParam);

    expect(mockedPost).toHaveBeenCalledWith(
      APPOINTMENTS_SEARCH_URL,
      searchParam,
    );
    expect(result).toEqual(mockBundle);
  });

  it('deleteAppointmentService should call DELETE with correct endpoint', async () => {
    const serviceUuid = 'service-uuid-1';
    mockedDel.mockResolvedValue(undefined);

    await deleteAppointmentService(serviceUuid);

    expect(mockedDel).toHaveBeenCalledWith(
      getDeleteAppointmentServiceUrl(serviceUuid),
    );
  });

  it('updateAppointmentStatus should call POST with correct endpoint and body', async () => {
    const appointmentUUID = 'appt-uuid-1';
    const onDate = new Date('2026-02-18');
    mockedPost.mockResolvedValue(undefined);

    await updateAppointmentStatus(appointmentUUID, 'fulfilled', onDate);

    expect(mockedPost).toHaveBeenCalledWith(
      updateAppointmentStatusUrl(appointmentUUID),
      {
        toStatus: 'fulfilled',
        onDate,
      },
    );
  });

  it.each([
    [
      'getUpcomingAppointments',
      () => getUpcomingAppointments(patientUUID),
      mockedGet,
    ],
    ['getPastAppointments', () => getPastAppointments(patientUUID), mockedGet],
    ['getAppointmentById', () => getAppointmentById('appt-uuid-1'), mockedGet],
    ['getAllAppointmentServices', () => getAllAppointmentServices(), mockedGet],
    [
      'searchAppointmentsByAttribute',
      () => searchAppointmentsByAttribute({ patient: patientUUID }),
      mockedPost,
    ],
    [
      'updateAppointmentStatus',
      () => updateAppointmentStatus('appt-uuid-1', 'fulfilled'),
      mockedPost,
    ],
    [
      'deleteAppointmentService',
      () => deleteAppointmentService('service-uuid-1'),
      mockedDel,
    ],
  ])('%s should propagate API errors', async (_, fn, mockedFn) => {
    mockedFn.mockRejectedValue(new Error('API Error'));

    await expect(fn()).rejects.toThrow('API Error');
  });

  it('getPastAppointments should append count to endpoint when provided', async () => {
    const mockBundle = setupMockBundle([pastAppointment]);

    const result = await getPastAppointments(patientUUID, 5);

    expect(result).toEqual(mockBundle);
    expect(mockedGet).toHaveBeenCalledWith(
      PAST_APPOINTMENTS_URL(patientUUID, 5),
    );
  });
});
