import { getPatientById } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientDetails } from '../usePatientDetails';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientById: jest.fn(),
  formatDateTime: jest.fn(() => ({
    formattedResult: '04 May 2026 11:53 AM',
    error: false,
  })),
}));
jest.mock('@bahmni/widgets');
jest.mock('../../utils/identifierGenderUtils', () => ({
  useGenderData: () => ({
    getGenderDisplay: (code: string) => (code === 'M' ? 'Male' : code),
  }),
}));
jest.mock('../usePersonAttributes', () => ({
  usePersonAttributes: () => ({
    personAttributes: [
      {
        uuid: 'phone-uuid',
        name: 'phoneNumber',
        format: 'java.lang.String',
        sortWeight: 1,
      },
      {
        uuid: 'email-uuid',
        name: 'email',
        format: 'java.lang.String',
        sortWeight: 2,
      },
    ],
  }),
}));

const mockGetPatientById = getPatientById as jest.Mock;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const mockFhirPatient = {
  resourceType: 'Patient',
  id: 'patient-123',
  identifier: [
    {
      id: 'id-1',
      use: 'official',
      type: { coding: [{ code: 'type-uuid' }], text: 'Patient Identifier' },
      value: 'ABC200000',
    },
    {
      id: 'id-2',
      type: { coding: [{ code: 'old-id-uuid' }], text: 'Old ID' },
      value: 'OLD123',
    },
  ],
  name: [{ id: 'name-uuid', given: ['John', 'Michael'], family: 'Doe' }],
  gender: 'male',
  birthDate: '1990-05-15',
  extension: [
    {
      url: 'http://fhir.bahmni.org/ext/patient/phonenumber',
      valueString: '+91123',
    },
    {
      url: 'http://fhir.bahmni.org/ext/patient/email',
      valueString: 'john@test.com',
    },
    {
      url: 'http://fhir.bahmni.org/ext/patient/date-created',
      valueDateTime: '2026-05-04T11:53:11+00:00',
    },
  ],
  address: [
    {
      use: 'home',
      city: 'Delhi',
      state: 'Delhi',
      extension: [
        {
          url: 'http://fhir.openmrs.org/ext/address',
          extension: [
            {
              url: 'http://fhir.openmrs.org/ext/address#address1',
              valueString: 'Flat 1',
            },
          ],
        },
      ],
    },
  ],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('usePatientDetails', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
      notifications: [],
    });
  });

  it('should fetch patient via FHIR and populate metadata', async () => {
    mockGetPatientById.mockResolvedValue(mockFhirPatient);

    const { result } = renderHook(
      () => usePatientDetails({ patientUuid: 'patient-123' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetPatientById).toHaveBeenCalledWith('patient-123');
    expect(result.current.metadata.patientUuid).toBe('patient-123');
    expect(result.current.metadata.patientIdentifier).toBe('ABC200000');
    expect(result.current.metadata.patientName).toBe('John Michael Doe');
    expect(result.current.metadata.registerDate).toBe('04 May 2026 11:53 AM');
  });

  it('should convert basic info from FHIR response', async () => {
    mockGetPatientById.mockResolvedValue(mockFhirPatient);

    const { result } = renderHook(
      () => usePatientDetails({ patientUuid: 'patient-123' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.profileInitialData).toEqual(
      expect.objectContaining({
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        gender: 'Male',
        dateOfBirth: '1990-05-15',
        nameUuid: 'name-uuid',
      }),
    );
    expect(result.current.initialDobEstimated).toBe(false);
  });

  it('should convert person attributes from extensions', async () => {
    mockGetPatientById.mockResolvedValue(mockFhirPatient);

    const { result } = renderHook(
      () => usePatientDetails({ patientUuid: 'patient-123' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.personAttributesInitialData).toEqual({
      phoneNumber: '+91123',
      email: 'john@test.com',
    });
  });

  it('should convert address from FHIR with extensions', async () => {
    mockGetPatientById.mockResolvedValue(mockFhirPatient);

    const { result } = renderHook(
      () => usePatientDetails({ patientUuid: 'patient-123' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.addressInitialData).toEqual(
      expect.objectContaining({
        address1: 'Flat 1',
        cityVillage: 'Delhi',
        stateProvince: 'Delhi',
      }),
    );
  });

  it('should convert additional identifiers', async () => {
    mockGetPatientById.mockResolvedValue(mockFhirPatient);

    const { result } = renderHook(
      () => usePatientDetails({ patientUuid: 'patient-123' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.additionalIdentifiersInitialData).toEqual({
      'old-id-uuid': 'OLD123',
    });
  });

  it('should detect estimated birthdate from YYYY precision', async () => {
    mockGetPatientById.mockResolvedValue({
      ...mockFhirPatient,
      birthDate: '1990',
    });

    const { result } = renderHook(
      () => usePatientDetails({ patientUuid: 'patient-123' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.initialDobEstimated).toBe(true);
    expect(result.current.profileInitialData?.dateOfBirth).toBe('1990-01-01');
  });

  it('should not fetch when patientUuid is undefined', () => {
    const { result } = renderHook(
      () => usePatientDetails({ patientUuid: undefined }),
      { wrapper: createWrapper() },
    );

    expect(mockGetPatientById).not.toHaveBeenCalled();
    expect(result.current.patientDetails).toBeUndefined();
  });

  it('should show error notification on failure', async () => {
    mockGetPatientById.mockRejectedValue(new Error('Failed to fetch'));

    renderHook(() => usePatientDetails({ patientUuid: 'patient-123' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error loading patient details',
        message: 'Failed to fetch',
      });
    });
  });
});
