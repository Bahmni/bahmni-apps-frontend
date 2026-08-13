import {
  fetchAllProviders,
  getAllAppointmentServices,
  getUserLoginLocation,
} from '@bahmni/services';
import { LOOKUP_SOURCES } from '../sourceMaps';
import {
  mockAppointmentServices,
  mockOtherLocationAppointmentService,
  mockProviders,
  mockUserLoginLocation,
} from './__mocks__/lookupCriterionInputMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getAllAppointmentServices: jest.fn(),
  getUserLoginLocation: jest.fn(),
  fetchAllProviders: jest.fn(),
}));

const mockGetAllAppointmentServices =
  getAllAppointmentServices as jest.MockedFunction<
    typeof getAllAppointmentServices
  >;
const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockFetchAllProviders = fetchAllProviders as jest.MockedFunction<
  typeof fetchAllProviders
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

describe('provider lookup source', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps providers using preferredName, falling back to person display then provider display, and excludes providers without a person', async () => {
    mockFetchAllProviders.mockResolvedValue(mockProviders);

    const options = await LOOKUP_SOURCES.provider!();

    expect(options).toEqual([
      { uuid: 'provider-uuid-1', label: 'Super Man' },
      { uuid: 'provider-uuid-2', label: 'Lab Manager' },
      { uuid: 'provider-uuid-3', label: 'LABSYSTEM - null' },
    ]);
  });

  it('propagates errors from fetchAllProviders', async () => {
    mockFetchAllProviders.mockRejectedValue(new Error('API Error'));

    await expect(LOOKUP_SOURCES.provider!()).rejects.toThrow('API Error');
  });
});
