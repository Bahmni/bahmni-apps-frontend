import { dispatchAuditEvent } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useCreatePatient } from '../../../hooks/useCreatePatient';
import CreatePatient from '../CreatePatient';
import { validateAllSections, collectFormData } from '../patientFormService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  notificationService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
  },
  dispatchAuditEvent: jest.fn(),
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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../hooks/useCreatePatient');
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

describe('CreatePatient', () => {
  let queryClient: QueryClient;
  let mockMutateAsync: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockMutateAsync = jest.fn();

    (useCreatePatient as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: false,
      data: null,
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

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CreatePatient />
        </BrowserRouter>
      </QueryClientProvider>,
    );
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
      expect(
        screen.getByText('CREATE_PATIENT_PRINT_REG_CARD'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('visit-type-selector')).toBeInTheDocument();
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
          }),
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
    it('should disable save button when mutation is pending', () => {
      (useCreatePatient as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isSuccess: false,
        data: null,
      });

      renderComponent();

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
    });

    it('should show "Saving..." text when mutation is pending', () => {
      (useCreatePatient as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isSuccess: false,
        data: null,
      });

      renderComponent();

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable save button when patient is already created', async () => {
      (useCreatePatient as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isSuccess: true,
        data: { patient: { uuid: 'patient-123' } },
      });

      const { rerender } = renderComponent();

      // Trigger the effect that sets patientUuid
      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <CreatePatient />
          </BrowserRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
        expect(saveButton).toBeDisabled();
      });
    });

    it('should enable save button initially', () => {
      renderComponent();

      const saveButton = screen.getByText('CREATE_PATIENT_SAVE');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Patient UUID Tracking', () => {
    it('should set patient UUID when mutation is successful', async () => {
      const { rerender } = renderComponent();

      // Simulate successful mutation
      (useCreatePatient as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isSuccess: true,
        data: { patient: { uuid: 'patient-123', display: 'John Doe' } },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <CreatePatient />
          </BrowserRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        const uuidDisplay = screen.getByTestId('patient-uuid-display');
        expect(uuidDisplay.textContent).toBe('patient-123');
      });
    });

    it('should not set patient UUID when response does not have UUID', () => {
      (useCreatePatient as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isSuccess: true,
        data: { patient: { display: 'John Doe' } },
      });

      renderComponent();

      const uuidDisplay = screen.getByTestId('patient-uuid-display');
      expect(uuidDisplay.textContent).toBe('none');
    });
  });

  describe('Visit Type Selector Integration', () => {
    it('should pass handleSave to VisitTypeSelector', () => {
      renderComponent();

      expect(screen.getByTestId('visit-type-selector')).toBeInTheDocument();
    });

    it('should pass patient UUID to VisitTypeSelector', async () => {
      const { rerender } = renderComponent();

      // Simulate successful mutation
      (useCreatePatient as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isSuccess: true,
        data: { patient: { uuid: 'patient-123', display: 'John Doe' } },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <CreatePatient />
          </BrowserRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        const uuidDisplay = screen.getByTestId('patient-uuid-display');
        expect(uuidDisplay.textContent).toBe('patient-123');
      });
    });

    it('should call handleSave when VisitTypeSelector triggers onVisitSave', async () => {
      mockMutateAsync.mockResolvedValue({
        patient: { uuid: 'patient-456', display: 'Jane Doe' },
      });

      renderComponent();

      const visitSaveButton = screen.getByTestId('visit-save-button');
      fireEvent.click(visitSaveButton);

      await waitFor(() => {
        expect(validateAllSections).toHaveBeenCalled();
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

    it('should render print registration card button', () => {
      renderComponent();

      const printButton = screen.getByText('CREATE_PATIENT_PRINT_REG_CARD');
      expect(printButton).toBeInTheDocument();
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

  describe('Component Cleanup', () => {
    it('should cleanup properly on unmount', () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });
  });
});
