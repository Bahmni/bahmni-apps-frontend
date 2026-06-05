import {
  createFhirPatient,
  createFhirEncounter,
  dispatchAuditEvent,
  getCurrentUser,
  getCurrentProvider,
  PersonAttributeType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { PersonAttributesProvider } from '../../providers/PersonAttributesProvider';
import { useCreatePatient } from '../useCreatePatient';

const mockUseRegistrationConfig = jest.fn();
jest.mock('../../providers/registrationConfig', () => ({
  useRegistrationConfig: () => mockUseRegistrationConfig(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createFhirPatient: jest.fn(),
  createFhirEncounter: jest.fn(),
  getCurrentUser: jest.fn(),
  getCurrentProvider: jest.fn(),
  generateIdentifier: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  getUserLoginLocation: () => ({ uuid: 'loc-uuid', name: 'Test Location' }),
  AUDIT_LOG_EVENT_DETAILS: {
    REGISTER_NEW_PATIENT: {
      eventType: 'REGISTER_NEW_PATIENT',
      module: 'registration',
    },
    CREATE_ENCOUNTER: {
      eventType: 'CREATE_ENCOUNTER',
      module: 'registration',
    },
  },
  FHIR_ENCOUNTER_TYPE_CODE_SYSTEM:
    'http://fhir.openmrs.org/code-system/encounter-type',
}));

jest.mock('@bahmni/widgets', () => ({
  useNotification: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../useAdditionalIdentifiers', () => ({
  useIdentifierTypes: () => ({
    data: [
      { uuid: 'primary-type-uuid', name: 'Patient Identifier' },
      { uuid: 'old-id-uuid', name: 'Old Identification Number' },
    ],
  }),
}));

const mockCreateFhirPatient = createFhirPatient as jest.Mock;
const mockCreateFhirEncounter = createFhirEncounter as jest.Mock;
const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockGetCurrentProvider = getCurrentProvider as jest.Mock;
const mockUseNotification = useNotification as jest.Mock;
const mockAddNotification = jest.fn();

describe('useCreatePatient', () => {
  let queryClient: QueryClient;

  const mockPersonAttributes: PersonAttributeType[] = [
    {
      uuid: 'phone-uuid',
      name: 'phoneNumber',
      description: 'Phone',
      format: 'java.lang.String',
      sortWeight: 1,
      concept: null,
    },
    {
      uuid: 'email-uuid',
      name: 'email',
      description: 'Email',
      format: 'java.lang.String',
      sortWeight: 2,
      concept: null,
    },
  ];

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <PersonAttributesProvider initialAttributes={mockPersonAttributes}>
          {children}
        </PersonAttributesProvider>
      </QueryClientProvider>
    );
    return Wrapper;
  };

  const mockFormData = {
    profile: {
      patientIdFormat: 'BDH',
      entryType: false,
      firstName: 'John',
      middleName: 'Michael',
      lastName: 'Doe',
      gender: 'male',
      ageYears: '30',
      ageMonths: '0',
      ageDays: '0',
      dateOfBirth: '1993-05-15',
      birthTime: '',
      dobEstimated: false,
      patientIdentifier: {
        identifierType: 'Primary Identifier',
        preferred: true,
      },
    },
    address: { address1: '123 Main St', cityVillage: 'New York' },
    contact: { phoneNumber: '+1234567890' },
    additional: { email: 'john@test.com' },
    additionalIdentifiers: {},
    relationships: [],
  };

  const mockFhirResponse = {
    resourceType: 'Patient',
    id: 'patient-uuid-123',
    name: [{ given: ['John', 'Michael'], family: 'Doe' }],
    gender: 'male',
    birthDate: '1993-05-15',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
    });
    mockUseRegistrationConfig.mockReturnValue({ registrationConfig: null });
    mockGetCurrentUser.mockResolvedValue({ uuid: 'user-uuid-123' });
    mockGetCurrentProvider.mockResolvedValue({ uuid: 'provider-uuid-456' });
    mockCreateFhirEncounter.mockResolvedValue({ id: 'encounter-uuid-789' });
    window.history.replaceState = jest.fn();
  });

  it('should call createFhirPatient with FHIR payload', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateFhirPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'Patient',
        name: [{ given: ['John', 'Michael'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1993-05-15',
      }),
    );
  });

  it('should show success notification and dispatch audit event', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
    expect(dispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'REGISTER_NEW_PATIENT',
      patientUuid: 'patient-uuid-123',
      module: 'registration',
    });
  });

  it('should update browser history with patient UUID', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      { patientDisplay: 'John Michael Doe', patientUuid: 'patient-uuid-123' },
      '',
      '/registration/patient/patient-uuid-123',
    );
  });

  it('should show error notification on failure', async () => {
    mockCreateFhirPatient.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', message: 'API Error' }),
    );
    expect(dispatchAuditEvent).not.toHaveBeenCalled();
  });

  it('should not dispatch audit event when response has no id', async () => {
    mockCreateFhirPatient.mockResolvedValue({});

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(dispatchAuditEvent).not.toHaveBeenCalled();
  });

  it('should include person attribute extensions in payload', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const payload = mockCreateFhirPatient.mock.calls[0][0];
    expect(payload.extension).toEqual(
      expect.arrayContaining([
        {
          url: 'http://fhir.bahmni.org/ext/patient/phonenumber',
          valueString: '+1234567890',
        },
        {
          url: 'http://fhir.bahmni.org/ext/patient/email',
          valueString: 'john@test.com',
        },
      ]),
    );
  });

  it('should create registration encounter when registrationEncounterTypeUuid is configured', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationEncounterTypeUuid: 'reg-encounter-type-uuid',
      },
    });

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await waitFor(() => {
      expect(mockCreateFhirEncounter).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: 'Encounter',
          status: 'in-progress',
          subject: { reference: 'Patient/patient-uuid-123' },
          location: [{ location: { reference: 'Location/loc-uuid' } }],
        }),
      );
    });
  });

  it('should dispatch CREATE_ENCOUNTER audit event after encounter creation', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationEncounterTypeUuid: 'reg-encounter-type-uuid',
      },
    });

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await waitFor(() => {
      expect(dispatchAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CREATE_ENCOUNTER',
          patientUuid: 'patient-uuid-123',
          module: 'registration',
        }),
      );
    });
  });

  it('should not create encounter when registrationEncounterTypeUuid is not configured', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {},
    });

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Give time for any async fire-and-forget calls to settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockCreateFhirEncounter).not.toHaveBeenCalled();
  });

  it('should show error notification and not block patient save when encounter creation fails', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationEncounterTypeUuid: 'reg-encounter-type-uuid',
      },
    });
    mockCreateFhirEncounter.mockRejectedValue(
      new Error('Encounter creation failed'),
    );

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Encounter creation failed',
        }),
      );
    });

    // Patient save succeeds regardless
    expect(result.current.isSuccess).toBe(true);
  });
});
