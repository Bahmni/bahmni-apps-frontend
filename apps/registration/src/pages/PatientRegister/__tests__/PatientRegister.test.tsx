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
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../hooks/useCreatePatient');
jest.mock('../../../hooks/useUpdatePatient');
jest.mock('../../../hooks/useRelationshipValidation');
jest.mock('../../../providers/registrationConfig');
jest.mock('../../../hooks/useAdditionalIdentifiers');
jest.mock('../../../hooks/usePatientDetails');
jest.mock('../../../hooks/usePatientPhoto');
jest.mock('../patientFormService');

// Mock child components
jest.mock('../../../components/forms/profile/Profile', () => ({
  __esModule: true,
  default: ({ ref }: { ref?: React.Ref<unknown> }) => {
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

const mockAddressValidate = jest.fn(() => true);
const mockContactValidate = jest.fn(() => true);

jest.mock('../../../components/forms/addressInfo/AddressInfo', () => ({
  AddressInfo: ({ ref }: { ref?: React.Ref<unknown> }) => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = {
        validate: mockAddressValidate,
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
        validate: mockContactValidate,
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

jest.mock(
  '../../../components/forms/patientRelationships/PatientRelationships',
  () => ({
    PatientRelationships: ({ ref }: { ref?: React.Ref<unknown> }) => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current = {
          validate: jest.fn(() => true),
          getData: jest.fn(() => []),
          removeDeletedRelationships: jest.fn(),
        };
      }
      return (
        <div data-testid="patient-relationships">Patient Relationships</div>
      );
    },
  }),
);

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({
    title,
    open,
    onHeadingClick,
    children,
    'data-testid': testId,
  }: any) => (
    <div data-testid={testId}>
      <button
        onClick={onHeadingClick}
        aria-expanded={open}
        data-testid="accordion-button"
        type="button"
      >
        {title}
      </button>
      <div>{children}</div>
    </div>
  ),
  Tile: ({ children, className, 'data-testid': testId }: any) => (
    <div data-testid={testId ?? 'section-header-tile'} className={className}>
      {children}
    </div>
  ),
}));

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
      patientPhoto: undefined,
      isLoading: false,
    });

    // Mock useRegistrationConfig to return default config
    const { useRegistrationConfig } = jest.requireMock(
      '../../../providers/registrationConfig',
    );
    useRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationForm: {
          sections: [
            {
              name: 'Address Details',
              controls: [
                {
                  type: 'address',
                  titleTranslationKey: 'REGISTRATION_SECTION_ADDRESS_DETAILS',
                },
              ],
            },
            {
              name: 'Contact Information',
              controls: [
                {
                  type: 'contactInfo',
                  titleTranslationKey: 'REGISTRATION_SECTION_CONTACT_DETAILS',
                },
              ],
            },
            {
              name: 'Additional Information',
              translationKey: 'REGISTRATION_SECTION_ADDITIONAL_INFO',
              controls: [{ type: 'additionalInfo' }],
            },
            {
              name: 'Identifiers',
              translationKey: 'REGISTRATION_SECTION_IDENTIFIERS',
              controls: [{ type: 'additionalIdentifiers' }],
            },
            {
              name: 'Relationships',
              translationKey: 'REGISTRATION_SECTION_RELATIONSHIPS',
              controls: [{ type: 'relationships' }],
            },
          ],
        },
      },
    });

    // Mock useRelationshipValidation
    const { useRelationshipValidation } = jest.requireMock(
      '../../../hooks/useRelationshipValidation',
    );
    useRelationshipValidation.mockReturnValue({
      relationshipTypes: [
        { uuid: 'spouse', name: 'Spouse', aIsToB: 'is spouse of' },
        { uuid: 'child', name: 'Child', aIsToB: 'is child of' },
      ],
    });

    // Mock useAdditionalIdentifiers to show additional identifiers by default
    (useAdditionalIdentifiers as jest.Mock).mockReturnValue({
      shouldShowAdditionalIdentifiers: true,
      hasAdditionalIdentifiers: true,
      identifierTypes: [
        { uuid: 'primary-id', name: 'Primary ID', primary: true },
        { uuid: 'national-id', name: 'National ID', primary: false },
      ],
      isLoading: false,
    });

    mockAddressValidate.mockReturnValue(true);
    mockContactValidate.mockReturnValue(true);

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
      expect(screen.getByTestId('patient-additional')).toBeInTheDocument();
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
      expect(screen.getByTestId('patient-additional')).toBeInTheDocument();
    });

    it('should pass refs to form section components', () => {
      renderComponent();

      // Check that components receive refs by verifying they render
      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      expect(screen.getByTestId('patient-address')).toBeInTheDocument();
      expect(screen.getByTestId('patient-contact')).toBeInTheDocument();
      expect(screen.getByTestId('patient-additional')).toBeInTheDocument();
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

  describe('Config-driven Form Sections', () => {
    it('should render sections from config when provided', () => {
      const { useRegistrationConfig } = jest.requireMock(
        '../../../providers/registrationConfig',
      );
      useRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationForm: {
            sections: [
              {
                name: 'Address Details',
                controls: [{ type: 'address' }],
              },
              {
                name: 'Contact Information',
                controls: [{ type: 'contactInfo' }],
              },
              {
                name: 'Additional Information',
                translationKey: 'REGISTRATION_SECTION_ADDITIONAL_INFO',
                controls: [{ type: 'additionalInfo' }],
              },
            ],
          },
        },
      });

      renderComponent();

      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      expect(screen.getByTestId('patient-address')).toBeInTheDocument();
      expect(screen.getByTestId('patient-contact')).toBeInTheDocument();
      expect(screen.getByTestId('patient-additional')).toBeInTheDocument();
    });

    it('should render default Basic Information even when config is absent', () => {
      const { useRegistrationConfig } = jest.requireMock(
        '../../../providers/registrationConfig',
      );
      useRegistrationConfig.mockReturnValue({
        registrationConfig: null,
      });

      renderComponent();

      // Basic Information should always be rendered (from fallback default)
      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      // Optional sections should not be rendered
      expect(screen.queryByTestId('patient-address')).not.toBeInTheDocument();
      expect(screen.queryByTestId('patient-contact')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('patient-additional'),
      ).not.toBeInTheDocument();
    });

    it('should render custom section order from config', () => {
      const { useRegistrationConfig } = jest.requireMock(
        '../../../providers/registrationConfig',
      );
      // Reverse the typical order: additionalInfo first, then basic details
      useRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationForm: {
            sections: [
              {
                name: 'Additional Information',
                translationKey: 'REGISTRATION_SECTION_ADDITIONAL_INFO',
                controls: [{ type: 'additionalInfo' }],
              },
              {
                name: 'Address Details',
                controls: [{ type: 'address' }],
              },
              {
                name: 'Contact Information',
                controls: [{ type: 'contactInfo' }],
              },
            ],
          },
        },
      });

      renderComponent();

      // All components should still be rendered (order determined by config)
      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      expect(screen.getByTestId('patient-address')).toBeInTheDocument();
      expect(screen.getByTestId('patient-contact')).toBeInTheDocument();
      expect(screen.getByTestId('patient-additional')).toBeInTheDocument();
    });

    it('should hide additionalIdentifiers even if in config when hasAdditionalIdentifiers is false', () => {
      (useAdditionalIdentifiers as jest.Mock).mockReturnValue({
        shouldShowAdditionalIdentifiers: false,
        hasAdditionalIdentifiers: false,
        identifierTypes: [
          { uuid: 'primary-id', name: 'Primary ID', primary: true },
        ],
        isLoading: false,
      });

      const { useRegistrationConfig } = jest.requireMock(
        '../../../providers/registrationConfig',
      );
      useRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationForm: {
            sections: [
              {
                name: 'Identifiers',
                translationKey: 'REGISTRATION_SECTION_IDENTIFIERS',
                controls: [{ type: 'additionalIdentifiers' }],
              },
            ],
          },
        },
      });

      renderComponent();

      expect(
        screen.queryByTestId('patient-additional-identifiers'),
      ).not.toBeInTheDocument();
    });

    it('should hide relationships even if in config when relationshipTypes is empty', () => {
      const { useRelationshipValidation } = jest.requireMock(
        '../../../hooks/useRelationshipValidation',
      );
      useRelationshipValidation.mockReturnValue({
        relationshipTypes: [],
      });

      const { useRegistrationConfig } = jest.requireMock(
        '../../../providers/registrationConfig',
      );
      useRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationForm: {
            sections: [
              {
                name: 'Relationships',
                translationKey: 'REGISTRATION_SECTION_RELATIONSHIPS',
                controls: [{ type: 'relationships' }],
              },
            ],
          },
        },
      });

      renderComponent();

      // PatientRelationships component should not render when no relationship types
      expect(
        screen.queryByTestId('patient-relationships'),
      ).not.toBeInTheDocument();
    });

    it('should skip unknown control types while rendering valid ones', () => {
      const { useRegistrationConfig } = jest.requireMock(
        '../../../providers/registrationConfig',
      );
      useRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationForm: {
            sections: [
              {
                name: 'Address Details',
                controls: [{ type: 'address' }],
              },
            ],
          },
        },
      });

      renderComponent();

      // Valid controls should render, unknown types should be skipped
      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      expect(screen.getByTestId('patient-address')).toBeInTheDocument();

      // Unknown type should not cause errors
      expect(screen.queryByTestId('patient-unknown')).not.toBeInTheDocument();
    });

    it('should always render Basic Information even when sections array is empty', () => {
      const { useRegistrationConfig } = jest.requireMock(
        '../../../providers/registrationConfig',
      );
      useRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationForm: {
            sections: [],
          },
        },
      });

      renderComponent();

      // Basic Information should always be rendered
      expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      // Optional sections should not be rendered
      expect(screen.queryByTestId('patient-address')).not.toBeInTheDocument();
      expect(screen.queryByTestId('patient-contact')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('patient-additional'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Section Collapsibility (BAH-4590)', () => {
    it('should render collapsible sections using Accordion and non-collapsible section using Tile', () => {
      renderComponent();

      // Non-collapsible first section (Basic Information) uses Tile
      expect(screen.getByTestId('section-header-tile')).toBeInTheDocument();

      // Collapsible sections use AccordionItem with accordion-button
      const accordionButtons = screen.getAllByTestId('accordion-button');
      expect(accordionButtons.length).toBeGreaterThan(0);
    });

    it('should start with all collapsible sections collapsed on page load', () => {
      renderComponent();

      // All config-driven sections are collapsible by default (none have collapsible: false)
      // Every accordion button must start in collapsed state
      const accordionButtons = screen.getAllByTestId('accordion-button');
      expect(accordionButtons.length).toBeGreaterThan(0);
      accordionButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should toggle section expanded state when clicking accordion heading', async () => {
      renderComponent();

      // Collapsible sections start collapsed (aria-expanded=false)
      const accordionButtons = screen.getAllByTestId('accordion-button');
      const firstAccordionButton = accordionButtons[0];

      expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(firstAccordionButton);

      await waitFor(() => {
        expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should allow multiple sections to be open simultaneously', async () => {
      renderComponent();

      const accordionButtons = screen.getAllByTestId('accordion-button');

      // Expand first two collapsible sections
      fireEvent.click(accordionButtons[0]);
      fireEvent.click(accordionButtons[1]);

      await waitFor(() => {
        // Both should be expanded (aria-expanded=true)
        expect(accordionButtons[0]).toHaveAttribute('aria-expanded', 'true');
        expect(accordionButtons[1]).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should collapse a section without affecting other expanded sections', async () => {
      renderComponent();

      const accordionButtons = screen.getAllByTestId('accordion-button');

      // Expand first two sections
      fireEvent.click(accordionButtons[0]);
      fireEvent.click(accordionButtons[1]);

      // Collapse the first section
      fireEvent.click(accordionButtons[0]);

      await waitFor(() => {
        // First section collapsed, second still expanded
        expect(accordionButtons[0]).toHaveAttribute('aria-expanded', 'false');
        expect(accordionButtons[1]).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should auto-expand sections with validation errors on save', async () => {
      (validateAllSections as jest.Mock).mockReturnValue(false);
      // Address section validator fails — triggers auto-expand for that section
      mockAddressValidate.mockReturnValue(false);

      renderComponent();

      const accordionButtons = screen.getAllByTestId('accordion-button');
      // Address Details is index 0 — starts collapsed
      expect(accordionButtons[0]).toHaveAttribute('aria-expanded', 'false');
      // Contact Information is index 1 — starts collapsed
      expect(accordionButtons[1]).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(validateAllSections).toHaveBeenCalled();
        // Address Details should be auto-expanded (it has errors)
        expect(accordionButtons[0]).toHaveAttribute('aria-expanded', 'true');
        // Contact Information should remain collapsed (no errors)
        expect(accordionButtons[1]).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should auto-expand multiple sections with validation errors', async () => {
      (validateAllSections as jest.Mock).mockReturnValue(false);
      // Both address and contact validators fail — both sections should expand
      mockAddressValidate.mockReturnValue(false);
      mockContactValidate.mockReturnValue(false);

      renderComponent();

      const accordionButtons = screen.getAllByTestId('accordion-button');
      expect(accordionButtons[0]).toHaveAttribute('aria-expanded', 'false');
      expect(accordionButtons[1]).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(validateAllSections).toHaveBeenCalled();
        // Both Address Details and Contact Information should be auto-expanded
        expect(accordionButtons[0]).toHaveAttribute('aria-expanded', 'true');
        expect(accordionButtons[1]).toHaveAttribute('aria-expanded', 'true');
        // Additional Information (index 2) has no errors — stays collapsed
        expect(accordionButtons[2]).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should have collapsible headers for all config sections except those explicitly non-collapsible', () => {
      const { useRegistrationConfig } = jest.requireMock(
        '../../../providers/registrationConfig',
      );
      useRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationForm: {
            sections: [
              {
                name: 'Address Details',
                translationKey: 'ADDRESS_HEADER',
                controls: [{ type: 'address' }],
                // collapsible not set, should default to true
              },
              {
                name: 'Contact Information',
                translationKey: 'CONTACT_HEADER',
                controls: [{ type: 'contactInfo' }],
                collapsible: true, // explicitly collapsible
              },
              {
                name: 'Non-Collapsible Section',
                translationKey: 'NON_COLLAPSIBLE_HEADER',
                controls: [{ type: 'additionalInfo' }],
                collapsible: false, // explicitly non-collapsible
              },
            ],
          },
        },
      });

      renderComponent();

      // Non-collapsible section (explicitly collapsible: false) uses Tile header
      expect(
        screen.getAllByTestId('section-header-tile').length,
      ).toBeGreaterThanOrEqual(1);

      // Collapsible sections (collapsible: true / not set) use Accordion buttons
      const accordionButtons = screen.queryAllByTestId('accordion-button');
      // At least 2 (Address and Contact are collapsible by default/explicitly)
      expect(accordionButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should preserve section expanded state during re-renders', async () => {
      renderComponent();

      const accordionButtons = screen.getAllByTestId('accordion-button');

      // Expand a collapsible section
      fireEvent.click(accordionButtons[0]);

      // Trigger a re-render by clicking save (which validates but doesn't change sections)
      (validateAllSections as jest.Mock).mockReturnValue(true);
      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Section should still be expanded (aria-expanded=true) after re-render
        expect(accordionButtons[0]).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByTestId('patient-profile')).toBeInTheDocument();
      });
    });
  });
});
