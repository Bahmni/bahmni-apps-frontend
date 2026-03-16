import { getPatientProfile } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientDetails } from '../usePatientDetails';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientProfile: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  formatDate: jest.fn(() => ({ formattedResult: '2024-01-01', error: null })),
}));
jest.mock('@bahmni/widgets');
jest.mock('../../utils/identifierGenderUtils', () => ({
  useGenderData: () => ({
    getGenderDisplay: jest.fn((gender: string) => gender),
  }),
}));
jest.mock('../../utils/patientDataConverter', () => ({
  convertToBasicInfoData: jest.fn(() => ({})),
  convertToPersonAttributesData: jest.fn(() => ({})),
  convertToAddressData: jest.fn(() => ({})),
  convertToAdditionalIdentifiersData: jest.fn(() => ({})),
  convertToRelationshipsData: jest.fn(() => []),
}));

const mockGetPatientProfile = getPatientProfile as jest.MockedFunction<
  typeof getPatientProfile
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const mockPatientData = {
  patient: {
    uuid: 'patient-123',
    identifiers: [
      {
        identifier: 'ID123',
        identifierType: { uuid: 'type-1', name: 'Patient ID' },
        preferred: true,
      },
    ],
    person: {
      uuid: 'person-123',
      display: 'John Doe',
      birthdateEstimated: false,
      birthdate: '1990-01-01',
      gender: 'M',
      names: [{ givenName: 'John', familyName: 'Doe' }],
      addresses: [{ country: 'USA' }],
      attributes: [],
    },
    auditInfo: {
      dateCreated: '2024-01-01T10:00:00.000Z',
    },
  },
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

  it('should fetch patient details when patientUuid is provided', async () => {
    mockGetPatientProfile.mockResolvedValue(mockPatientData);

    const { result } = renderHook(
      () =>
        usePatientDetails({
          patientUuid: 'patient-123',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetPatientProfile).toHaveBeenCalledWith('patient-123');
    expect(result.current.metadata.patientUuid).toBe('patient-123');
    expect(result.current.metadata.patientIdentifier).toBe('ID123');
  });

  it('should not fetch when patientUuid is undefined', () => {
    const { result } = renderHook(
      () =>
        usePatientDetails({
          patientUuid: undefined,
        }),
      { wrapper: createWrapper() },
    );

    expect(mockGetPatientProfile).not.toHaveBeenCalled();
    expect(result.current.patientDetails).toBeUndefined();
  });

  it('should show error notification on failure', async () => {
    const error = new Error('Failed to fetch patient');
    mockGetPatientProfile.mockRejectedValue(error);

    renderHook(
      () =>
        usePatientDetails({
          patientUuid: 'patient-123',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_LOADING_PATIENT_DETAILS',
        message: 'Failed to fetch patient',
      });
    });
  });
});
