import {
  updatePatient,
  dispatchAuditEvent,
  PersonAttributeType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { PersonAttributesProvider } from '../../providers/PersonAttributesProvider';
import { useUpdatePatient } from '../useUpdatePatient';

// Mock dependencies
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  updatePatient: jest.fn(),
  dispatchAuditEvent: jest.fn(),
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

const mockUpdatePatient = updatePatient as jest.Mock;
const mockUseNotification = useNotification as jest.Mock;
const mockAddNotification = jest.fn();

describe('useUpdatePatient', () => {
  let queryClient: QueryClient;

  const mockPersonAttributes: PersonAttributeType[] = [
    {
      uuid: 'a384873b-847a-4a86-b869-28fb601162dd',
      name: 'phoneNumber',
      description: 'Phone Number',
      format: 'java.lang.String',
      sortWeight: 1,
      concept: null,
    },
    {
      uuid: '27fa84ff-fdd6-4895-9c77-254b60555f39',
      name: 'altPhoneNumber',
      description: 'Alternate Phone Number',
      format: 'java.lang.String',
      sortWeight: 2,
      concept: null,
    },
    {
      uuid: 'e3123cba-5e07-11ef-8f7c-0242ac120002',
      name: 'email',
      description: 'Email',
      format: 'java.lang.String',
      sortWeight: 3,
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
      ageMonths: '6',
      ageDays: '15',
      dateOfBirth: '1993-05-15',
      birthTime: '1993-05-15T05:00:00.000Z',
      dobEstimated: false,
      patientIdentifier: {
        identifierSourceUuid: 'source-uuid-123',
        identifierPrefix: 'BDH',
        identifierType: 'Primary Identifier',
        preferred: true,
        voided: false,
      },
    },
    address: {
      address1: '123 Main St',
      address2: 'Apt 4B',
      cityVillage: 'New York',
      countyDistrict: 'Manhattan',
      stateProvince: 'NY',
      postalCode: '10001',
    },
    contact: {
      phoneNumber: '+1234567890',
      altPhoneNumber: '+0987654321',
    },
    additional: {
      email: 'john.doe@example.com',
    },
    additionalIdentifiers: {},
    additionalIdentifiersInitialData: undefined,
  };

  const mockSuccessResponse = {
    patient: {
      uuid: 'patient-uuid-123',
      display: 'John Michael Doe',
      person: {
        uuid: 'person-uuid-123',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  describe('Successful patient update', () => {
    it('should successfully update a patient and show success notification', async () => {
      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      // Execute mutation
      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify updatePatient was called with correct payload
      expect(mockUpdatePatient).toHaveBeenCalledWith('patient-uuid-123', {
        patient: {
          person: {
            names: [
              {
                givenName: 'John',
                middleName: 'Michael',
                familyName: 'Doe',
                display: 'John Michael Doe',
                preferred: false,
              },
            ],
            gender: 'M',
            birthdate: '1993-05-15',
            birthdateEstimated: false,
            birthtime: '1993-05-15T05:00:00.000Z',
            addresses: [mockFormData.address],
            attributes: [
              {
                attributeType: {
                  uuid: 'a384873b-847a-4a86-b869-28fb601162dd',
                },
                value: '+1234567890',
              },
              {
                attributeType: {
                  uuid: '27fa84ff-fdd6-4895-9c77-254b60555f39',
                },
                value: '+0987654321',
              },
              {
                attributeType: {
                  uuid: 'e3123cba-5e07-11ef-8f7c-0242ac120002',
                },
                value: 'john.doe@example.com',
              },
            ],
            deathDate: null,
            causeOfDeath: '',
          },
          identifiers: [mockFormData.profile.patientIdentifier],
        },
        relationships: [],
      });

      // Verify success notification
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Success',
        message: 'Patient updated successfully',
        type: 'success',
        timeout: 5000,
      });

      // Verify audit event was dispatched
      expect(dispatchAuditEvent).toHaveBeenCalledWith({
        eventType: 'EDIT_PATIENT_DETAILS',
        patientUuid: 'patient-uuid-123',
        module: 'registration',
      });
    });

    it('should handle patient update without middle name', async () => {
      const formDataWithoutMiddleName = {
        ...mockFormData,
        profile: {
          ...mockFormData.profile,
          middleName: '',
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithoutMiddleName);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the payload doesn't include middleName
      expect(mockUpdatePatient).toHaveBeenCalledWith(
        'patient-uuid-123',
        expect.objectContaining({
          patient: expect.objectContaining({
            person: expect.objectContaining({
              names: [
                expect.objectContaining({
                  givenName: 'John',
                  familyName: 'Doe',
                  display: 'John Doe',
                  preferred: false,
                }),
              ],
            }),
          }),
        }),
      );
    });

    it('should handle estimated date of birth', async () => {
      const formDataWithEstimatedDob = {
        ...mockFormData,
        profile: {
          ...mockFormData.profile,
          dobEstimated: true,
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithEstimatedDob);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify birthdateEstimated is true
      expect(mockUpdatePatient).toHaveBeenCalledWith(
        'patient-uuid-123',
        expect.objectContaining({
          patient: expect.objectContaining({
            person: expect.objectContaining({
              birthdateEstimated: true,
            }),
          }),
        }),
      );
    });

    it('should handle female gender correctly', async () => {
      const formDataWithFemaleGender = {
        ...mockFormData,
        profile: {
          ...mockFormData.profile,
          gender: 'female',
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithFemaleGender);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify gender is capitalized correctly
      expect(mockUpdatePatient).toHaveBeenCalledWith(
        'patient-uuid-123',
        expect.objectContaining({
          patient: expect.objectContaining({
            person: expect.objectContaining({
              gender: 'F',
            }),
          }),
        }),
      );
    });

    it('should handle missing birth time', async () => {
      const formDataWithoutBirthTime = {
        ...mockFormData,
        profile: {
          ...mockFormData.profile,
          birthTime: '',
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithoutBirthTime);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify birthtime is null
      expect(mockUpdatePatient).toHaveBeenCalledWith(
        'patient-uuid-123',
        expect.objectContaining({
          patient: expect.objectContaining({
            person: expect.objectContaining({
              birthtime: null,
            }),
          }),
        }),
      );
    });
  });

  describe('Error handling', () => {
    it('should show error notification when patient update fails', async () => {
      const error = new Error('API Error');
      mockUpdatePatient.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify error notification
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error updating patient',
        timeout: 5000,
        message: 'API Error',
      });

      // Verify success notification was not called
      expect(mockAddNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );

      // Verify audit event was not dispatched
      expect(dispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      mockUpdatePatient.mockRejectedValue(networkError);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error updating patient',
        timeout: 5000,
        message: 'Network request failed',
      });
    });

    it('should handle validation errors from API', async () => {
      const validationError = {
        message: 'Validation failed',
        errors: ['Invalid date format'],
      };
      mockUpdatePatient.mockRejectedValue(validationError);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error updating patient',
        timeout: 5000,
        message: '[object Object]',
      });
    });
  });

  describe('Mutation states', () => {
    it('should track isPending state during mutation', async () => {
      mockUpdatePatient.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockSuccessResponse), 100);
          }),
      );

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate(mockFormData);

      // Should be pending immediately after mutate
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Should not be pending after success
      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should provide mutation data after success', async () => {
      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSuccessResponse);
    });

    it('should provide error after failure', async () => {
      const error = new Error('Update failed');
      mockUpdatePatient.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Response handling edge cases', () => {
    it('should handle response without patient UUID', async () => {
      const responseWithoutUuid = {
        patient: {
          display: 'John Doe',
        },
      };

      mockUpdatePatient.mockResolvedValue(responseWithoutUuid);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify success notification is still shown
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );

      // Verify audit event was NOT dispatched (no UUID)
      expect(dispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('should handle empty response', async () => {
      mockUpdatePatient.mockResolvedValue({});

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );
      expect(dispatchAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('Data transformation', () => {
    it('should correctly transform all form data to API payload', async () => {
      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0];

      // Verify patient UUID is passed as first argument
      expect(callArgs[0]).toBe('patient-uuid-123');

      // Verify complete payload structure
      expect(callArgs[1]).toEqual({
        patient: {
          person: {
            names: [
              {
                givenName: 'John',
                middleName: 'Michael',
                familyName: 'Doe',
                display: 'John Michael Doe',
                preferred: false,
              },
            ],
            gender: 'M',
            birthdate: '1993-05-15',
            birthdateEstimated: false,
            birthtime: '1993-05-15T05:00:00.000Z',
            addresses: [mockFormData.address],
            attributes: [
              {
                attributeType: {
                  uuid: 'a384873b-847a-4a86-b869-28fb601162dd',
                },
                value: '+1234567890',
              },
              {
                attributeType: {
                  uuid: '27fa84ff-fdd6-4895-9c77-254b60555f39',
                },
                value: '+0987654321',
              },
              {
                attributeType: {
                  uuid: 'e3123cba-5e07-11ef-8f7c-0242ac120002',
                },
                value: 'john.doe@example.com',
              },
            ],
            deathDate: null,
            causeOfDeath: '',
          },
          identifiers: [mockFormData.profile.patientIdentifier],
        },
        relationships: [],
      });
    });

    it('should handle partial address data', async () => {
      const formDataWithPartialAddress = {
        ...mockFormData,
        address: {
          address1: '123 Main St',
          cityVillage: 'New York',
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithPartialAddress);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdatePatient).toHaveBeenCalledWith(
        'patient-uuid-123',
        expect.objectContaining({
          patient: expect.objectContaining({
            person: expect.objectContaining({
              addresses: [
                {
                  address1: '123 Main St',
                  cityVillage: 'New York',
                },
              ],
            }),
          }),
        }),
      );
    });

    it('should handle empty contact attributes with voided flag', async () => {
      const formDataWithEmptyContact = {
        ...mockFormData,
        contact: {
          phoneNumber: '',
          altPhoneNumber: '',
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithEmptyContact);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];

      // Verify empty contact attributes are sent with voided: true
      const contactAttributes = callArgs.patient.person.attributes.filter(
        (attr: { attributeType: { uuid: string } }) =>
          attr.attributeType.uuid === 'a384873b-847a-4a86-b869-28fb601162dd' ||
          attr.attributeType.uuid === '27fa84ff-fdd6-4895-9c77-254b60555f39',
      );

      expect(contactAttributes).toHaveLength(2);
      expect(contactAttributes).toEqual([
        {
          attributeType: { uuid: 'a384873b-847a-4a86-b869-28fb601162dd' },
          voided: true,
        },
        {
          attributeType: { uuid: '27fa84ff-fdd6-4895-9c77-254b60555f39' },
          voided: true,
        },
      ]);
    });

    it('should handle only some contact attributes provided', async () => {
      const formDataWithPartialContact = {
        ...mockFormData,
        contact: {
          phoneNumber: '+1234567890',
          altPhoneNumber: '',
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithPartialContact);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];

      // Verify phoneNumber has value
      const phoneAttribute = callArgs.patient.person.attributes.find(
        (attr: { attributeType: { uuid: string } }) =>
          attr.attributeType.uuid === 'a384873b-847a-4a86-b869-28fb601162dd',
      );

      expect(phoneAttribute).toEqual({
        attributeType: {
          uuid: 'a384873b-847a-4a86-b869-28fb601162dd',
        },
        value: '+1234567890',
      });

      // Verify altPhoneNumber is sent with voided: true
      const altPhoneAttribute = callArgs.patient.person.attributes.find(
        (attr: { attributeType: { uuid: string } }) =>
          attr.attributeType.uuid === '27fa84ff-fdd6-4895-9c77-254b60555f39',
      );

      expect(altPhoneAttribute).toEqual({
        attributeType: {
          uuid: '27fa84ff-fdd6-4895-9c77-254b60555f39',
        },
        voided: true,
      });
    });

    it('should handle empty additional attributes with voided flag', async () => {
      const formDataWithEmptyAdditional = {
        ...mockFormData,
        additional: {
          email: '',
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithEmptyAdditional);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];

      // Verify email attribute is sent with voided: true for empty value
      const emailAttribute = callArgs.patient.person.attributes.find(
        (attr: { attributeType: { uuid: string } }) =>
          attr.attributeType.uuid === 'e3123cba-5e07-11ef-8f7c-0242ac120002',
      );

      expect(emailAttribute).toEqual({
        attributeType: {
          uuid: 'e3123cba-5e07-11ef-8f7c-0242ac120002',
        },
        voided: true,
      });
    });
  });

  describe('Patient UUID handling', () => {
    it('should use the correct patient UUID from form data', async () => {
      const differentUuid = 'different-patient-uuid-456';
      const formDataWithDifferentUuid = {
        ...mockFormData,
        patientUuid: differentUuid,
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithDifferentUuid);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the first argument is the correct patient UUID
      expect(mockUpdatePatient).toHaveBeenCalledWith(
        differentUuid,
        expect.any(Object),
      );
    });
  });

  describe('Attribute mapping', () => {
    it('should only include attributes that match person attribute types', async () => {
      const formDataWithUnmappedAttributes = {
        ...mockFormData,
        contact: {
          phoneNumber: '+1234567890',
          altPhoneNumber: '',
          unknownField: 'value',
        } as any,
        additional: {
          email: 'john@example.com',
          anotherUnknownField: 'value',
        } as any,
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithUnmappedAttributes);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];

      // Verify only mapped attributes are included (altPhoneNumber voided, unknown fields excluded)
      expect(callArgs.patient.person.attributes).toHaveLength(3);
      expect(callArgs.patient.person.attributes).toEqual([
        {
          attributeType: {
            uuid: 'a384873b-847a-4a86-b869-28fb601162dd',
          },
          value: '+1234567890',
        },
        {
          attributeType: {
            uuid: '27fa84ff-fdd6-4895-9c77-254b60555f39',
          },
          voided: true,
        },
        {
          attributeType: {
            uuid: 'e3123cba-5e07-11ef-8f7c-0242ac120002',
          },
          value: 'john@example.com',
        },
      ]);
    });
  });

  describe('Additional Identifiers', () => {
    it('should include new additional identifiers in the payload', async () => {
      const formDataWithNewIdentifiers = {
        ...mockFormData,
        additionalIdentifiers: {
          'pan-uuid': 'AAAAG3456B',
          'aadhar-uuid': '123456789012',
        },
        additionalIdentifiersInitialData: undefined,
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithNewIdentifiers);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];

      // Verify both new identifiers are included
      expect(callArgs.patient.identifiers).toHaveLength(3); // primary + 2 additional
      expect(callArgs.patient.identifiers).toEqual([
        mockFormData.profile.patientIdentifier,
        {
          identifier: 'AAAAG3456B',
          identifierType: 'pan-uuid',
          preferred: false,
        },
        {
          identifier: '123456789012',
          identifierType: 'aadhar-uuid',
          preferred: false,
        },
      ]);
    });

    it('should skip existing identifiers and only send new ones', async () => {
      const formDataWithMixedIdentifiers = {
        ...mockFormData,
        additionalIdentifiers: {
          'pan-uuid': 'AAAAG3456B', // Existing
          'aadhar-uuid': '123456789012', // New
        },
        additionalIdentifiersInitialData: {
          'pan-uuid': 'AAAAG3456B', // Has initial data - should be skipped
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithMixedIdentifiers);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];

      // Verify only new identifier is included (Aadhar), not existing (PAN)
      expect(callArgs.patient.identifiers).toHaveLength(2); // primary + 1 new
      expect(callArgs.patient.identifiers).toEqual([
        mockFormData.profile.patientIdentifier,
        {
          identifier: '123456789012',
          identifierType: 'aadhar-uuid',
          preferred: false,
        },
      ]);
    });

    it('should filter out empty additional identifiers', async () => {
      const formDataWithEmptyIdentifiers = {
        ...mockFormData,
        additionalIdentifiers: {
          'pan-uuid': 'AAAAG3456B',
          'aadhar-uuid': '',
          'license-uuid': '   ',
        },
        additionalIdentifiersInitialData: undefined,
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithEmptyIdentifiers);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];

      // Verify only non-empty identifier is included
      expect(callArgs.patient.identifiers).toHaveLength(2); // primary + 1
      expect(callArgs.patient.identifiers).toEqual([
        mockFormData.profile.patientIdentifier,
        {
          identifier: 'AAAAG3456B',
          identifierType: 'pan-uuid',
          preferred: false,
        },
      ]);
    });

    it('should not include any additional identifiers when all have initial data', async () => {
      const formDataWithAllExisting = {
        ...mockFormData,
        additionalIdentifiers: {
          'pan-uuid': 'AAAAG3456B',
          'aadhar-uuid': '123456789012',
        },
        additionalIdentifiersInitialData: {
          'pan-uuid': 'AAAAG3456B',
          'aadhar-uuid': '123456789012',
        },
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithAllExisting);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];

      // Verify only primary identifier is included
      expect(callArgs.patient.identifiers).toHaveLength(1);
      expect(callArgs.patient.identifiers).toEqual([
        mockFormData.profile.patientIdentifier,
      ]);
    });
  });

  describe('Relationships handling', () => {
    it('should send empty relationships array when no relationships provided', async () => {
      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];
      expect(callArgs.relationships).toEqual([]);
    });

    it('should include relationships in the update payload', async () => {
      const formDataWithRelationships = {
        ...mockFormData,
        relationships: [
          {
            id: 'rel-1',
            relationshipType: 'rel-type-uuid-1',
            patientId: 'GAN789012',
            patientUuid: 'related-patient-uuid',
            tillDate: '31/12/2024',
          },
        ],
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithRelationships);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];
      expect(callArgs.relationships).toBeDefined();
      expect(callArgs.relationships).toHaveLength(1);
    });

    it('should transform relationships to API format correctly', async () => {
      const formDataWithRelationships = {
        ...mockFormData,
        relationships: [
          {
            id: 'rel-1',
            relationshipType: 'rel-type-uuid-1',
            patientId: 'GAN789012',
            patientUuid: 'related-patient-uuid',
            tillDate: '31/12/2024',
          },
        ],
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithRelationships);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];
      expect(callArgs.relationships[0]).toMatchObject({
        relationshipType: { uuid: 'rel-type-uuid-1' },
        personB: { uuid: 'related-patient-uuid' },
      });
      expect(callArgs.relationships[0].endDate).toBeDefined();
    });

    it('should handle relationships without end date', async () => {
      const formDataWithRelationships = {
        ...mockFormData,
        relationships: [
          {
            id: 'rel-1',
            relationshipType: 'rel-type-uuid-1',
            patientId: 'GAN789012',
            patientUuid: 'related-patient-uuid',
            tillDate: '',
          },
        ],
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithRelationships);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];
      expect(callArgs.relationships[0].endDate).toBeUndefined();
    });

    it('should handle multiple relationships', async () => {
      const formDataWithMultipleRelationships = {
        ...mockFormData,
        relationships: [
          {
            id: 'rel-1',
            relationshipType: 'rel-type-uuid-1',
            patientId: 'GAN789012',
            patientUuid: 'related-patient-uuid-1',
            tillDate: '31/12/2024',
          },
          {
            id: 'rel-2',
            relationshipType: 'rel-type-uuid-2',
            patientId: 'GAN654321',
            patientUuid: 'related-patient-uuid-2',
            tillDate: '',
          },
        ],
      };

      mockUpdatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithMultipleRelationships);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockUpdatePatient.mock.calls[0][1];
      expect(callArgs.relationships).toHaveLength(2);
    });
  });
});
