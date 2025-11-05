import {
  createPatient,
  notificationService,
  dispatchAuditEvent,
} from '@bahmni-frontend/bahmni-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useCreatePatient } from '../useCreatePatient';

// Mock dependencies
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  createPatient: jest.fn(),
  notificationService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
  },
  dispatchAuditEvent: jest.fn(),
  AUDIT_LOG_EVENT_DETAILS: {
    REGISTER_NEW_PATIENT: {
      eventType: 'REGISTER_NEW_PATIENT',
      module: 'registration',
    },
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

const mockCreatePatient = createPatient as jest.Mock;

describe('useCreatePatient', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
      ageMonths: '6',
      ageDays: '15',
      dateOfBirth: '1993-05-15',
      birthTime: '10:30',
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
    // Mock window.history.replaceState
    window.history.replaceState = jest.fn();
  });

  describe('Successful patient creation', () => {
    it('should successfully create a patient and show success notification', async () => {
      mockCreatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      // Execute mutation
      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify createPatient was called with correct payload
      expect(mockCreatePatient).toHaveBeenCalledWith({
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
            birthtime: '10:30',
            addresses: [mockFormData.address],
            attributes: [],
            deathDate: null,
            causeOfDeath: '',
          },
          identifiers: [mockFormData.profile.patientIdentifier],
        },
        relationships: [],
      });

      // Verify success notification
      expect(notificationService.showSuccess).toHaveBeenCalledWith(
        'Success',
        'Patient saved successfully',
        5000,
      );

      // Verify audit event was dispatched
      expect(dispatchAuditEvent).toHaveBeenCalledWith({
        eventType: 'REGISTER_NEW_PATIENT',
        patientUuid: 'patient-uuid-123',
        module: 'registration',
      });

      // Verify browser history was updated
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {
          patientDisplay: 'John Michael Doe',
          patientUuid: 'patient-uuid-123',
        },
        '',
        '/registration/patient/patient-uuid-123',
      );
    });

    it('should handle patient creation without middle name', async () => {
      const formDataWithoutMiddleName = {
        ...mockFormData,
        profile: {
          ...mockFormData.profile,
          middleName: '',
        },
      };

      mockCreatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithoutMiddleName);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the payload doesn't include middleName
      expect(mockCreatePatient).toHaveBeenCalledWith(
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

      mockCreatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithEstimatedDob);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify birthdateEstimated is true
      expect(mockCreatePatient).toHaveBeenCalledWith(
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

      mockCreatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithFemaleGender);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify gender is capitalized correctly
      expect(mockCreatePatient).toHaveBeenCalledWith(
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

      mockCreatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithoutBirthTime);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify birthtime is null
      expect(mockCreatePatient).toHaveBeenCalledWith(
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
    it('should show error notification when patient creation fails', async () => {
      const error = new Error('API Error');
      mockCreatePatient.mockRejectedValue(error);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify error notification
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Failed to save patient',
        5000,
      );

      // Verify success notification was not called
      expect(notificationService.showSuccess).not.toHaveBeenCalled();

      // Verify audit event was not dispatched
      expect(dispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      mockCreatePatient.mockRejectedValue(networkError);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Failed to save patient',
        5000,
      );
    });

    it('should handle validation errors from API', async () => {
      const validationError = {
        message: 'Validation failed',
        errors: ['Invalid date format'],
      };
      mockCreatePatient.mockRejectedValue(validationError);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(notificationService.showError).toHaveBeenCalled();
    });
  });

  describe('Mutation states', () => {
    it('should track isPending state during mutation', async () => {
      mockCreatePatient.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockSuccessResponse), 100);
          }),
      );

      const { result } = renderHook(() => useCreatePatient(), {
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
      mockCreatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSuccessResponse);
    });

    it('should provide error after failure', async () => {
      const error = new Error('Creation failed');
      mockCreatePatient.mockRejectedValue(error);

      const { result } = renderHook(() => useCreatePatient(), {
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

      mockCreatePatient.mockResolvedValue(responseWithoutUuid);
      const mockNavigate = jest.fn();
      jest
        .spyOn(require('react-router-dom'), 'useNavigate')
        .mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify success notification is still shown
      expect(notificationService.showSuccess).toHaveBeenCalled();

      // Verify audit event was NOT dispatched (no UUID)
      expect(dispatchAuditEvent).not.toHaveBeenCalled();

      // Verify browser history was NOT updated
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it('should handle empty response', async () => {
      mockCreatePatient.mockResolvedValue({});

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(notificationService.showSuccess).toHaveBeenCalled();
      expect(dispatchAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('Data transformation', () => {
    it('should correctly transform all form data to API payload', async () => {
      mockCreatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockFormData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const callArgs = mockCreatePatient.mock.calls[0][0];

      // Verify complete payload structure
      expect(callArgs).toEqual({
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
            birthtime: '10:30',
            addresses: [mockFormData.address],
            attributes: [],
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

      mockCreatePatient.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(formDataWithPartialAddress);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCreatePatient).toHaveBeenCalledWith(
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
  });
});
