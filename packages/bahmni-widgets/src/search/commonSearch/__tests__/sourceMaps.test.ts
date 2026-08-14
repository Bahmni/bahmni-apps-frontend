import {
  getAllAppointmentServices,
  getAllPrograms,
  getUserLoginLocation,
} from '@bahmni/services';
import { LOOKUP_SOURCES } from '../sourceMaps';
import {
  mockAppointmentServices,
  mockOtherLocationAppointmentService,
  mockPrograms,
  mockRetiredProgram,
  mockUserLoginLocation,
} from './__mocks__/lookupCriterionInputMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getAllAppointmentServices: jest.fn(),
  getUserLoginLocation: jest.fn(),
  getAllPrograms: jest.fn(),
}));

const mockGetAllAppointmentServices =
  getAllAppointmentServices as jest.MockedFunction<
    typeof getAllAppointmentServices
  >;
const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockGetAllPrograms = getAllPrograms as jest.MockedFunction<
  typeof getAllPrograms
>;

describe('appointmentService lookup source', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps services at the current login location to LookupOption', async () => {
    mockGetUserLoginLocation.mockReturnValue(mockUserLoginLocation);
    mockGetAllAppointmentServices.mockResolvedValue(mockAppointmentServices);

    const options = await LOOKUP_SOURCES.appointmentService!();

    expect(options).toEqual([
      { uuid: 'service-uuid-1', label: 'TB Program' },
      { uuid: 'service-uuid-2', label: 'HIV Program' },
    ]);
  });

  it('excludes services configured at a different location', async () => {
    mockGetUserLoginLocation.mockReturnValue(mockUserLoginLocation);
    mockGetAllAppointmentServices.mockResolvedValue([
      ...mockAppointmentServices,
      mockOtherLocationAppointmentService,
    ]);

    const options = await LOOKUP_SOURCES.appointmentService!();

    expect(options.map((o) => o.uuid)).not.toContain(
      mockOtherLocationAppointmentService.uuid,
    );
  });

  it('includes services with no location', async () => {
    mockGetUserLoginLocation.mockReturnValue(mockUserLoginLocation);
    mockGetAllAppointmentServices.mockResolvedValue([
      { ...mockAppointmentServices[0], location: null },
    ]);

    const options = await LOOKUP_SOURCES.appointmentService!();

    expect(options).toEqual([{ uuid: 'service-uuid-1', label: 'TB Program' }]);
  });

  it('propagates errors from getAllAppointmentServices', async () => {
    mockGetUserLoginLocation.mockReturnValue(mockUserLoginLocation);
    mockGetAllAppointmentServices.mockRejectedValue(new Error('API Error'));

    await expect(LOOKUP_SOURCES.appointmentService!()).rejects.toThrow(
      'API Error',
    );
  });

  it('propagates errors from getUserLoginLocation without calling getAllAppointmentServices', async () => {
    mockGetUserLoginLocation.mockImplementation(() => {
      throw new Error('No login location');
    });

    await expect(LOOKUP_SOURCES.appointmentService!()).rejects.toThrow(
      'No login location',
    );
    expect(mockGetAllAppointmentServices).not.toHaveBeenCalled();
  });
});

describe('programName lookup source', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps programs to LookupOption', async () => {
    mockGetAllPrograms.mockResolvedValue(mockPrograms);

    const options = await LOOKUP_SOURCES.programName!();

    expect(options).toEqual([
      { uuid: 'program-uuid-1', label: 'TB Program' },
      { uuid: 'program-uuid-2', label: 'HIV Program' },
    ]);
  });

  it('excludes retired programs', async () => {
    mockGetAllPrograms.mockResolvedValue([...mockPrograms, mockRetiredProgram]);

    const options = await LOOKUP_SOURCES.programName!();

    expect(options.map((o) => o.uuid)).not.toContain(mockRetiredProgram.uuid);
  });

  it('propagates errors from getAllPrograms', async () => {
    mockGetAllPrograms.mockRejectedValue(new Error('API Error'));

    await expect(LOOKUP_SOURCES.programName!()).rejects.toThrow('API Error');
  });
});
