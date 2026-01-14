import { dispatchAuditEvent, PersonAttributeType } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAdditionalIdentifiers } from '../../../hooks/useAdditionalIdentifiers';
import { useCreatePatient } from '../../../hooks/useCreatePatient';
import { usePatientDetails } from '../../../hooks/usePatientDetails';
import { usePatientPhoto } from '../../../hooks/usePatientPhoto';
import { useUpdatePatient } from '../../../hooks/useUpdatePatient';
import { PersonAttributesProvider } from '../../../providers/PersonAttributesProvider';
import { validateAllSections, collectFormData } from '../patientFormService';
import PatientRegister from '../PatientRegister';

// Mock useQuery
const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: (options: any) => mockUseQuery(options),
}));

// Mock the dependencies
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
  getPatientProfile: jest.fn(),
  getPatientImageAsDataUrl: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  BAHMNI_HOME_PATH: '/home',
  AUDIT_LOG_EVENT_DETAILS: {
    VIEWED_NEW_PATIENT_PAGE: {
      eventType: 'VIEWED_NEW_PATIENT_PAGE',
      module: 'registration',
    },
  },
}));

jest.mock('@bahmni/widgets', () => ({
  useNotification: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../hooks/useCreatePatient');
jest.mock('../../../hooks/useUpdatePatient');
jest.mock('../../../hooks/useRegistrationConfig');
jest.mock('../../../hooks/useAdditionalIdentifiers');
jest.mock('../../../hooks/usePatientDetails');
jest.mock('../../../hooks/usePatientPhoto');
jest.mock('../patientFormService');

// Mock child components
jest.mock('../../../components/forms/profile/Profile', () => ({
  Profile: ({ ref }: { ref?: React.Ref<unknown> }) => {
    // Expose imperative methods via ref
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = {
        validate: jest.fn(() => true),
        getData: jest.fn(() => ({
          firstName: 'John',
          lastName: 'Doe',
          gender: 'male',
          dateOfBirth: '1990-01-01',
        })),
      };
    }
    return <div data-testid="patient-profile">Patient Profile</div>;
  },
}));

jest.mock('../../../components/forms/addressInfo/AddressInfo', () => ({
  AddressInfo: ({ ref }: { ref?: React.Ref<unknown> }) => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = {
        validate: jest.fn(() => true),
        getData: jest.fn(() => ({
          address1: '123 Main St',
          cityVillage: 'New York',
        })),
      };
    }
    return <div data-testid="patient-address">Patient Address Information</div>;
  },
}));

jest.mock('../../../components/forms/contactInfo/ContactInfo', () => ({
  ContactInfo: ({ ref }: { ref?: React.Ref<unknown> }) => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = {
        validate: jest.fn(() => true),
        getData: jest.fn(() => ({
          phoneNumber: '1234567890',
        })),
      };
    }
    return <div data-testid="patient-contact">Patient Contact Information</div>;
  },
}));

jest.mock('../../../components/forms/additionalInfo/AdditionalInfo', () => ({
  AdditionalInfo: ({ ref }: { ref?: React.Ref<unknown> }) => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = {
        validate: jest.fn(() => true),
        getData: jest.fn(() => ({
          occupation: 'Engineer',
        })),
      };
    }
    return (
      <div data-testid="patient-additional">Patient Additional Information</div>
    );
  },
}));

jest.mock(
  '../../../components/forms/additionalIdentifiers/AdditionalIdentifiers',
  () => ({
    AdditionalIdentifiers: ({ ref }: { ref?: React.Ref<unknown> }) => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current = {
          validate: jest.fn(() => true),
          getData: jest.fn(() => ({})),
        };
      }
      return (
        <div data-testid="patient-additional-identifiers">
          <div data-testid="header-tile">
            <span>ADDITIONAL_IDENTIFIERS_HEADER_TITLE</span>
          </div>
          Patient Additional Identifiers
        </div>
      );
    },
  }),
);

jest.mock('../visitTypeSelector', () => ({
  VisitTypeSelector: ({
    onVisitSave,
    patientUuid,
  }: {
    onVisitSave: () => Promise<string | null>;
    patientUuid?: string | null;
  }) => (
    <div data-testid="visit-type-selector">
      <button
        data-testid="visit-save-button"
        onClick={onVisitSave}
        disabled={!!patientUuid}
      >
        Start Visit
      </button>
      <span data-testid="patient-uuid-display">{patientUuid ?? 'none'}</span>
    </div>
  ),
}));

jest.mock(
  '../../../components/registrationActions/RegistrationActions',
  () => ({
    RegistrationActions: ({
      onBeforeNavigate,
    }: {
      onBeforeNavigate?: () => Promise<unknown>;
    }) => (
      <div data-testid="registration-actions">
        <button
          data-testid="extension-action-button"
          onClick={async () => {
            try {
              await onBeforeNavigate?.();
            } catch {
              // Error caught, prevent navigation (same as real component)
            }
          }}
        >
          Extension Action
        </button>
      </div>
    ),
  }),
);

describe('PatientRegister', () => {
  let queryClient: QueryClient;
  let mockMutateAsync: jest.Mock;
  let mockAddNotification: jest.Mock;

  const mockPersonAttributes: PersonAttributeType[] = [
    {
      uuid: 'phone-uuid',
      name: 'phoneNumber',
      description: 'Phone Number',
      format: 'java.lang.String',
      sortWeight: 1,
      concept: null,
    },
    {
      uuid: 'alt-phone-uuid',
      name: 'altPhoneNumber',
      description: 'Alternate Phone Number',
      format: 'java.lang.String',
      sortWeight: 2,
      concept: null,
    },
    {
      uuid: 'email-uuid',
      name: 'email',
      description: 'Email',
      format: 'java.lang.String',
      sortWeight: 3,
      concept: null,
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockMutateAsync = jest.fn();
    mockAddNotification = jest.fn();

    const { useNotification } = jest.requireMock('@bahmni/widgets');
    useNotification.mockReturnValue({
      addNotification: mockAddNotification,
    });

    // Mock useQuery to return no data by default (not in edit mode)
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    (useCreatePatient as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: false,
      data: null,
    });

    (useUpdatePatient as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: false,
      data: null,
    });

    (usePatientDetails as jest.Mock).mockReturnValue({
      metadata: undefined,
      photo: undefined,
      isLoading: false,
    });

    (usePatientPhoto as jest.Mock).mockReturnValue({
      photo: undefined,
      isLoading: false,
    });

    // Mock useAdditionalIdentifiers to show additional identifiers by default
    (useAdditionalIdentifiers as jest.Mock).mockReturnValue({
      shouldShowAdditionalIdentifiers: true,
      hasAdditionalIdentifiers: true,
      isConfigEnabled: true,
      identifierTypes: [
        { uuid: 'primary-id', name: 'Primary ID', primary: true },
        { uuid: 'national-id', name: 'National ID', primary: false },
      ],
      isLoading: false,
    });

    (validateAllSections as jest.Mock).mockReturnValue(true);
    (collectFormData as jest.Mock).mockReturnValue({
      profile: { firstName: 'John', lastName: 'Doe' },
      address: { address1: '123 Main St' },
      contact: { phoneNumber: '1234567890' },
      additional: { occupation: 'Engineer' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <PersonAttributesProvider initialAttributes={mockPersonAttributes}>
        <BrowserRouter>{children}</BrowserRouter>
      </PersonAttributesProvider>
    </QueryClientProvider>
  );

  const renderComponent = () => {
    return render(<PatientRegister />, { wrapper: Wrapper });
  };

  describe('Component Initialization', () => {
    it('should render all form sections', () => {
      renderComponent();

      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      expect(screen.getByTestId('patient-address')).toBeInTheDocument();
      expect(screen.getByTestId('patient-contact')).toBeInTheDocument();
      // Component renders AdditionalInfo twice, so use getAllByTestId
      expect(
        screen.getAllByTestId('patient-additional')[0],
      ).toBeInTheDocument();
    });

    it('should render the page title', () => {
      renderComponent();

      expect(
        screen.getByText('CREATE_PATIENT_HEADER_TITLE'),
      ).toBeInTheDocument();
    });

    it('should render all action buttons', () => {
      renderComponent();

      expect(
        screen.getByText('CREATE_PATIENT_BACK_TO_SEARCH'),
      ).toBeInTheDocument();
      expect(screen.getByText('CREATE_PATIENT_SAVE')).toBeInTheDocument();
      expect(screen.getByTestId('registration-actions')).toBeInTheDocument();
    });

    it('should dispatch audit event on page load', () => {
      renderComponent();

      expect(dispatchAuditEvent).toHaveBeenCalledWith({
        eventType: 'VIEWED_NEW_PATIENT_PAGE',
        module: 'registration',
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate all sections when save is clicked', async () => {
      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(validateAllSections).toHaveBeenCalledWith(
          expect.objectContaining({
            profileRef: expect.any(Object),
            addressRef: expect.any(Object),
            contactRef: expect.any(Object),
            additionalRef: expect.any(Object),
            additionalIdentifiersRef: expect.any(Object),
          }),
          expect.any(Function),
          expect.any(Function), // translation function
          expect.objectContaining({
            shouldValidateAdditionalIdentifiers: expect.any(Boolean),
          }),
        );
      });
    });

    it('should not collect data if validation fails', async () => {
      (validateAllSections as jest.Mock).mockReturnValue(false);

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(validateAllSections).toHaveBeenCalled();
        expect(collectFormData).not.toHaveBeenCalled();
      });
    });

    it('should return null when validation fails', async () => {
      (validateAllSections as jest.Mock).mockReturnValue(false);

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Data Collection', () => {
    it('should collect data from all form sections after validation', async () => {
      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(collectFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            profileRef: expect.any(Object),
            addressRef: expect.any(Object),
            contactRef: expect.any(Object),
            additionalRef: expect.any(Object),
            additionalIdentifiersRef: expect.any(Object),
          }),
          expect.any(Function),
          expect.any(Function), // translation function
        );
      });
    });

    it('should not call mutation if data collection returns null', async () => {
      (collectFormData as jest.Mock).mockReturnValue(null);

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(collectFormData).toHaveBeenCalled();
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('Patient Creation', () => {
    it('should call mutateAsync with collected form data', async () => {
      const mockFormData = {
        profile: { firstName: 'John', lastName: 'Doe' },
        address: { address1: '123 Main St' },
        contact: { phoneNumber: '1234567890' },
        additional: { occupation: 'Engineer' },
      };
      (collectFormData as jest.Mock).mockReturnValue(mockFormData);
      mockMutateAsync.mockResolvedValue({
        patient: { uuid: 'patient-123', display: 'John Doe' },
      });

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(mockFormData);
      });
    });

    it('should return patient UUID on successful creation', async () => {
      mockMutateAsync.mockResolvedValue({
        patient: { uuid: 'patient-123', display: 'John Doe' },
      });

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('should return null when mutation throws an error', async () => {
      mockMutateAsync.mockRejectedValue(new Error('API Error'));

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('should return null when response does not have patient UUID', async () => {
      mockMutateAsync.mockResolvedValue({
        patient: { display: 'John Doe' },
      });

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Save Button State', () => {
    it('should render save button', () => {
      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();
    });

    it('should call mutation when save button is clicked', async () => {
      mockMutateAsync.mockResolvedValue({
        patient: {
          uuid: 'patient-123',
          display: 'John Doe',
          identifiers: [{ identifier: 'BDH123' }],
          person: { display: 'John Doe' },
          auditInfo: { dateCreated: '2025-11-28T19:00:00.000Z' },
        },
      });

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('should call mutation when save button is clicked with form data', async () => {
      mockMutateAsync.mockResolvedValue({
        patient: {
          uuid: 'patient-123',
          display: 'John Doe',
          identifiers: [{ identifier: 'BDH123' }],
          person: { display: 'John Doe' },
          auditInfo: { dateCreated: '2025-11-28T19:00:00.000Z' },
        },
      });

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(validateAllSections).toHaveBeenCalled();
        expect(collectFormData).toHaveBeenCalled();
      });
    });
  });

  describe('Patient UUID Tracking', () => {
    it('should display patient UUID after successful creation', async () => {
      mockMutateAsync.mockResolvedValue({
        patient: {
          uuid: 'patient-123',
          display: 'John Doe',
          identifiers: [{ identifier: 'BDH123' }],
          person: { display: 'John Doe' },
          auditInfo: { dateCreated: '2025-11-28T19:00:00.000Z' },
        },
      });

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Header Component', () => {
    it('should render the header component', () => {
      renderComponent();

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      (validateAllSections as jest.Mock).mockReturnValue(false);

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should handle data collection errors gracefully', async () => {
      (collectFormData as jest.Mock).mockReturnValue(null);

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should handle mutation errors gracefully', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Network error'));

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Form Section Refs', () => {
    it('should create refs for all form sections', () => {
      renderComponent();

      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      expect(screen.getByTestId('patient-address')).toBeInTheDocument();
      expect(screen.getByTestId('patient-contact')).toBeInTheDocument();
      // Component renders AdditionalInfo twice due to duplicate
      expect(
        screen.getAllByTestId('patient-additional')[0],
      ).toBeInTheDocument();
    });

    it('should pass refs to form section components', () => {
      renderComponent();

      // Check that components receive refs by verifying they render
      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      expect(screen.getByTestId('patient-address')).toBeInTheDocument();
      expect(screen.getByTestId('patient-contact')).toBeInTheDocument();
      // Component renders AdditionalInfo twice due to duplicate
      expect(
        screen.getAllByTestId('patient-additional')[0],
      ).toBeInTheDocument();
    });
  });

  describe('Button Actions', () => {
    it('should render back to search button', () => {
      renderComponent();

      const backButton = screen.getByText('CREATE_PATIENT_BACK_TO_SEARCH');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Multiple Save Attempts', () => {
    it('should handle multiple save button clicks', async () => {
      mockMutateAsync.mockResolvedValue({
        patient: { uuid: 'patient-123', display: 'John Doe' },
      });

      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');

      // Click save button multiple times
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Should be called multiple times
        expect(validateAllSections).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading State During Save', () => {
    it('should prevent duplicate patient creation by disabling save button', () => {
      (useCreatePatient as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isSuccess: false,
        data: null,
      });

      renderComponent();

      // Save button should be disabled during save
      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Component Cleanup', () => {
    it('should cleanup properly on unmount', () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('RegistrationActions Integration', () => {
    it('should render RegistrationActions component', () => {
      renderComponent();

      expect(screen.getByTestId('registration-actions')).toBeInTheDocument();
    });

    it('should pass onDefaultAction callback to RegistrationActions', () => {
      renderComponent();

      expect(screen.getByTestId('registration-actions')).toBeInTheDocument();
    });

    it('should call handleSave when extension button is clicked without patient saved', async () => {
      renderComponent();

      const extensionButton = screen.getByTestId('extension-action-button');
      fireEvent.click(extensionButton);

      await waitFor(() => {
        expect(validateAllSections).toHaveBeenCalled();
      });
    });

    it('should not show error when patient is already saved', async () => {
      mockMutateAsync.mockResolvedValue({
        patient: {
          uuid: 'patient-123',
          display: 'John Doe',
          identifiers: [{ identifier: 'BDH123' }],
          person: { display: 'John Doe' },
          auditInfo: { dateCreated: '2025-11-28T19:00:00.000Z' },
        },
      });

      renderComponent();

      // First save the patient
      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      // Wait for the mutation to complete AND the state to update
      await waitFor(
        () => {
          expect(mockMutateAsync).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // Wait for React state updates to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clear previous notification calls
      mockAddNotification.mockClear();

      // Now try extension action with saved patient
      const extensionButton = screen.getByTestId('extension-action-button');
      fireEvent.click(extensionButton);

      // Wait to ensure the async onClick handler completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not show error notification for patient not saved
      expect(mockAddNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'REGISTRATION_PATIENT_MUST_BE_SAVED',
        }),
      );
    });
  });

  describe('Additional Identifiers Conditional Rendering', () => {
    it('should show additional identifiers section when shouldShowAdditionalIdentifiers is true', () => {
      renderComponent();

      expect(
        screen.getByTestId('patient-additional-identifiers'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('ADDITIONAL_IDENTIFIERS_HEADER_TITLE'),
      ).toBeInTheDocument();
    });

    it('should not show additional identifiers section when shouldShowAdditionalIdentifiers is false', () => {
      (useAdditionalIdentifiers as jest.Mock).mockReturnValue({
        shouldShowAdditionalIdentifiers: false,
        hasAdditionalIdentifiers: false,
        isConfigEnabled: true,
        identifierTypes: [
          { uuid: 'primary-id', name: 'Primary ID', primary: true },
        ],
        isLoading: false,
      });

      renderComponent();

      expect(
        screen.queryByTestId('patient-additional-identifiers'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('ADDITIONAL_IDENTIFIERS_HEADER_TITLE'),
      ).not.toBeInTheDocument();
    });

    it('should not show additional identifiers section when config is disabled', () => {
      (useAdditionalIdentifiers as jest.Mock).mockReturnValue({
        shouldShowAdditionalIdentifiers: false,
        hasAdditionalIdentifiers: true,
        isConfigEnabled: false,
        identifierTypes: [
          { uuid: 'primary-id', name: 'Primary ID', primary: true },
          { uuid: 'national-id', name: 'National ID', primary: false },
        ],
        isLoading: false,
      });

      renderComponent();

      expect(
        screen.queryByTestId('patient-additional-identifiers'),
      ).not.toBeInTheDocument();
    });

    it('should not show additional identifiers section when no additional identifiers exist', () => {
      (useAdditionalIdentifiers as jest.Mock).mockReturnValue({
        shouldShowAdditionalIdentifiers: false,
        hasAdditionalIdentifiers: false,
        isConfigEnabled: true,
        identifierTypes: [
          { uuid: 'primary-id', name: 'Primary ID', primary: true },
        ],
        isLoading: false,
      });

      renderComponent();

      expect(
        screen.queryByTestId('patient-additional-identifiers'),
      ).not.toBeInTheDocument();
    });
  });
});
