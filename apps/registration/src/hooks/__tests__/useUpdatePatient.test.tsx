import {
  updateFhirPatient,
  createRelatedPerson,
  deleteRelatedPerson,
  dispatchAuditEvent,
  PersonAttributeType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { PersonAttributesProvider } from '../../providers/PersonAttributesProvider';
import { useUpdatePatient } from '../useUpdatePatient';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  updateFhirPatient: jest.fn(),
  createRelatedPerson: jest.fn(),
  deleteRelatedPerson: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  getUserLoginLocation: () => ({ uuid: 'loc-uuid', name: 'Test Location' }),
  AUDIT_LOG_EVENT_DETAILS: {
    EDIT_PATIENT_DETAILS: {
      eventType: 'EDIT_PATIENT_DETAILS',
      module: 'registration',
    },
  },
}));

jest.mock('@bahmni/widgets', () => ({
  useNotification: jest.fn(),
}));

jest.mock('../useAdditionalIdentifiers', () => ({
  useIdentifierTypes: () => ({
    data: [
      { uuid: 'primary-type-uuid', name: 'Patient Identifier' },
      { uuid: 'old-id-uuid', name: 'Old Identification Number' },
    ],
  }),
}));

const mockUpdateFhirPatient = updateFhirPatient as jest.Mock;
const mockCreateRelatedPerson = createRelatedPerson as jest.Mock;
const mockDeleteRelatedPerson = deleteRelatedPerson as jest.Mock;
const mockUseNotification = useNotification as jest.Mock;
const mockAddNotification = jest.fn();

describe('useUpdatePatient', () => {
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
    patientUuid: 'patient-uuid-123',
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
    mockCreateRelatedPerson.mockResolvedValue({});
    mockDeleteRelatedPerson.mockResolvedValue({});
  });

  it('should call updateFhirPatient with UUID and FHIR payload', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdateFhirPatient).toHaveBeenCalledWith(
      'patient-uuid-123',
      expect.objectContaining({
        resourceType: 'Patient',
        id: 'patient-uuid-123',
        gender: 'male',
      }),
    );
  });

  it('should show success notification and dispatch audit event', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useUpdatePatient(), {
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
      eventType: 'EDIT_PATIENT_DETAILS',
      patientUuid: 'patient-uuid-123',
      module: 'registration',
    });
  });

  it('should show error notification on failure', async () => {
    mockUpdateFhirPatient.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useUpdatePatient(), {
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

  it('should strip trailing bracketed suffix from error message', async () => {
    mockUpdateFhirPatient.mockRejectedValue(
      'Identifier "X" does not match [Identifier "X" does not match]',
    );

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Identifier "X" does not match',
      }),
    );
  });

  it('should not dispatch audit event when response has no id', async () => {
    mockUpdateFhirPatient.mockResolvedValue({});

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(mockFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(dispatchAuditEvent).not.toHaveBeenCalled();
  });

  it('should send voiding extensions for empty attributes on update', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);

    const formDataWithEmptyEmail = {
      ...mockFormData,
      additional: { email: '' },
    };

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(formDataWithEmptyEmail);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const payload = mockUpdateFhirPatient.mock.calls[0][1];
    expect(payload.extension).toEqual(
      expect.arrayContaining([
        {
          url: 'http://fhir.bahmni.org/ext/patient/phonenumber',
          valueString: '+1234567890',
        },
        { url: 'http://fhir.bahmni.org/ext/patient/email' },
      ]),
    );
  });

  it('should call createRelatedPerson for new relationships', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);

    const formDataWithNewRelationship = {
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
          isDeleted: false,
        },
      ],
    };

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(formDataWithNewRelationship);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateRelatedPerson).toHaveBeenCalledTimes(1);
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
    expect(mockDeleteRelatedPerson).not.toHaveBeenCalled();
  });

  it('should call deleteRelatedPerson for deleted existing relationships', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);

    const formDataWithDeletedRelationship = {
      ...mockFormData,
      relationships: [
        {
          id: 'existing-related-person-uuid',
          relationshipType: 'rel-type-uuid-1',
          patientId: '',
          patientUuid: 'related-patient-uuid-1',
          patientName: 'Jane Smith',
          tillDate: '',
          isExisting: true,
          isDeleted: true,
        },
      ],
    };

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(formDataWithDeletedRelationship);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteRelatedPerson).toHaveBeenCalledTimes(1);
    expect(mockDeleteRelatedPerson).toHaveBeenCalledWith(
      'existing-related-person-uuid',
    );
    expect(mockCreateRelatedPerson).not.toHaveBeenCalled();
  });

  it('should not call createRelatedPerson or deleteRelatedPerson for existing unchanged relationships', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);

    const formDataWithUnchangedRelationship = {
      ...mockFormData,
      relationships: [
        {
          id: 'existing-related-person-uuid',
          relationshipType: 'rel-type-uuid-1',
          patientId: '',
          patientUuid: 'related-patient-uuid-1',
          patientName: 'Jane Smith',
          tillDate: '',
          isExisting: true,
          isDeleted: false,
        },
      ],
    };

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(formDataWithUnchangedRelationship);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateRelatedPerson).not.toHaveBeenCalled();
    expect(mockDeleteRelatedPerson).not.toHaveBeenCalled();
  });

  it('should show error notification when createRelatedPerson rejects', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);
    mockCreateRelatedPerson.mockRejectedValue(
      new Error('Related person API error'),
    );

    const formDataWithNewRelationship = {
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
          isDeleted: false,
        },
      ],
    };

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(formDataWithNewRelationship);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
  });

  it('should not invalidate relatedPersons query when there are no relationship changes', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);

    const formDataWithUnchangedRelationship = {
      ...mockFormData,
      relationships: [
        {
          id: 'existing-related-person-uuid',
          relationshipType: 'rel-type-uuid-1',
          patientId: '',
          patientUuid: 'related-patient-uuid-1',
          patientName: 'Jane Smith',
          tillDate: '',
          isExisting: true,
          isDeleted: false,
        },
      ],
    };

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(formDataWithUnchangedRelationship);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueriesSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['relatedPersons']),
      }),
    );
  });

  it('should invalidate relatedPersons query when there are relationship changes', async () => {
    mockUpdateFhirPatient.mockResolvedValue(mockFhirResponse);

    const formDataWithNewRelationship = {
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
          isDeleted: false,
        },
      ],
    };

    const { result } = renderHook(() => useUpdatePatient(), {
      wrapper: createWrapper(),
    });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(formDataWithNewRelationship);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['relatedPersons', 'patient-uuid-123'],
      }),
    );
  });
});
