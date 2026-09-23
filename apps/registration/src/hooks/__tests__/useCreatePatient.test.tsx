import {
  createFhirPatient,
  createRelatedPerson,
  dispatchAuditEvent,
  PersonAttributeType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { PersonAttributesProvider } from '../../providers/PersonAttributesProvider';
import { useCreatePatient } from '../useCreatePatient';

const mockUseRegistrationEncounterTypeUuid = jest.fn();
jest.mock('../useRegistrationEncounterTypeUuid', () => ({
  useRegistrationEncounterTypeUuid: () =>
    mockUseRegistrationEncounterTypeUuid(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createFhirPatient: jest.fn(),
  createRelatedPerson: jest.fn(),
  generateIdentifier: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  getUserLoginLocation: () => ({ uuid: 'loc-uuid', name: 'Test Location' }),
  AUDIT_LOG_EVENT_DETAILS: {
    REGISTER_NEW_PATIENT: {
      eventType: 'REGISTER_NEW_PATIENT',
      module: 'registration',
    },
  },
}));

const mockCreateRegistrationEncounterForPatient = jest.fn();
jest.mock('../../services/registrationEncounterService', () => ({
  createRegistrationEncounterForPatient: (...args: unknown[]) =>
    mockCreateRegistrationEncounterForPatient(...args),
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
const mockCreateRelatedPerson = createRelatedPerson as jest.Mock;
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
    mockUseRegistrationEncounterTypeUuid.mockReturnValue(undefined);
    mockCreateRegistrationEncounterForPatient.mockResolvedValue(undefined);
    mockCreateRelatedPerson.mockResolvedValue({});
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

  it('should not create a registration encounter during registration even when encounter type is configured', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);
    mockUseRegistrationEncounterTypeUuid.mockReturnValue(
      'reg-encounter-type-uuid',
    );

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The registration encounter is now created at visit save, not at
    // registration time. Give any stray fire-and-forget a chance to settle.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockCreateRegistrationEncounterForPatient).not.toHaveBeenCalled();
  });

  it('should call createRelatedPerson for each valid relationship after patient is created', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);

    const formDataWithRelationships = {
      ...mockFormData,
      relationships: [
        {
          id: '',
          relationshipType: 'rel-type-uuid-1',
          patientId: '',
          patientUuid: 'related-patient-uuid-1',
          patientName: 'Jane Smith',
          tillDate: '2024-12-31',
          isExisting: false,
        },
        {
          id: '',
          relationshipType: 'rel-type-uuid-2',
          patientId: '',
          patientUuid: 'related-patient-uuid-2',
          patientName: 'Bob Jones',
          tillDate: '',
          isExisting: false,
        },
      ],
    };

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(formDataWithRelationships);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateRelatedPerson).toHaveBeenCalledTimes(2);
    expect(mockCreateRelatedPerson).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'RelatedPerson',
        patient: { reference: 'Patient/patient-uuid-123' },
        relationship: [
          {
            coding: [expect.objectContaining({ code: 'rel-type-uuid-1' })],
          },
        ],
      }),
    );
  });

  it('should skip relationships without a patientUuid', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);

    const formDataWithInvalidRelationship = {
      ...mockFormData,
      relationships: [
        {
          id: '',
          relationshipType: 'rel-type-uuid-1',
          patientId: '',
          patientUuid: undefined,
          patientName: '',
          tillDate: '',
          isExisting: false,
        },
      ],
    };

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(formDataWithInvalidRelationship);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateRelatedPerson).not.toHaveBeenCalled();
  });

  it('should not call createRelatedPerson when relationships array is empty', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateRelatedPerson).not.toHaveBeenCalled();
  });

  it('should show error notification when createRelatedPerson rejects', async () => {
    mockCreateFhirPatient.mockResolvedValue(mockFhirResponse);
    mockCreateRelatedPerson.mockRejectedValue(
      new Error('Related person API error'),
    );

    const formDataWithRelationships = {
      ...mockFormData,
      relationships: [
        {
          id: '',
          relationshipType: 'rel-type-uuid-1',
          patientId: '',
          patientUuid: 'related-patient-uuid-1',
          patientName: 'Jane Smith',
          tillDate: '',
          isExisting: false,
        },
      ],
    };

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(formDataWithRelationships);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
  });
});
