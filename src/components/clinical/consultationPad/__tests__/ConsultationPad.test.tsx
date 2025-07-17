import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BundleEntry } from 'fhir/r4';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import { logEncounterEdit } from '@services/auditLogService';
import * as consultationBundleService from '@services/consultationBundleService';
import useAllergyStore from '@stores/allergyStore';
import { useConditionsAndDiagnosesStore } from '@stores/conditionsAndDiagnosesStore';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
import { useMedicationStore } from '@stores/medicationsStore';
import useServiceRequestStore from '@stores/serviceRequestStore';
import ConsultationPad from '../ConsultationPad';

// Mock i18next translation function
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => {
      // Return specific translations for common keys
      const translations: Record<string, string> = {
        CONSULTATION_PAD_TITLE: 'New Consultation',
        CONSULTATION_PAD_DONE_BUTTON: 'Done',
        CONSULTATION_PAD_CANCEL_BUTTON: 'Cancel',
        CONSULTATION_SUBMITTED_SUCCESS_TITLE: 'Success',
        CONSULTATION_SUBMITTED_SUCCESS_MESSAGE:
          'Consultation saved successfully',
        ERROR_CONSULTATION_TITLE: 'Consultation Error',
        CONSULTATION_ERROR_GENERIC: 'Error creating consultation bundle',
        CONSULTATION_PAD_ERROR_TITLE: 'Something went wrong',
        CONSULTATION_PAD_ERROR_BODY:
          'An error occurred while loading the consultation pad. Please try again later.',
      };

      return translations[key] || key;
    },
  }),
}));

// Mock all child components
jest.mock('@components/common/actionArea/ActionArea', () => ({
  __esModule: true,
  default: ({
    title,
    primaryButtonText,
    onPrimaryButtonClick,
    isPrimaryButtonDisabled,
    secondaryButtonText,
    onSecondaryButtonClick,
    content,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <div data-testid="mock-action-area">
      <div data-testid="action-area-title">{title}</div>
      <div data-testid="action-area-content">{content}</div>
      <button
        data-testid="primary-button"
        onClick={onPrimaryButtonClick}
        disabled={isPrimaryButtonDisabled}
      >
        {primaryButtonText}
      </button>
      <button data-testid="secondary-button" onClick={onSecondaryButtonClick}>
        {secondaryButtonText}
      </button>
    </div>
  ),
}));

jest.mock(
  '@components/clinical/forms/encounterDetails/EncounterDetails',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-encounter-details">Encounter Details Form</div>
    ),
  }),
);

jest.mock(
  '@components/clinical/forms/conditionsAndDiagnoses/ConditionsAndDiagnoses',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-conditions-diagnoses">
        Conditions and Diagnoses Form
      </div>
    ),
  }),
);

jest.mock('@components/clinical/forms/allergies/AllergiesForm', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-allergies-form">Allergies Form</div>,
}));

jest.mock(
  '@components/clinical/forms/investigations/InvestigationsForm',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-investigations-form">Investigations Form</div>
    ),
  }),
);

jest.mock(
  '@components/clinical/forms/prescribeMedicines/MedicationsForm',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-medications-form">Medications Form</div>
    ),
  }),
);

jest.mock('@carbon/react', () => ({
  ...jest.requireActual('@carbon/react'),
  MenuItemDivider: () => <hr data-testid="mock-divider" />,
}));

// Mock services
jest.mock('@services/consultationBundleService', () => ({
  postConsultationBundle: jest.fn(),
  createDiagnosisBundleEntries: jest.fn(() => []),
  createAllergiesBundleEntries: jest.fn(() => []),
  createConditionsBundleEntries: jest.fn(() => []),
  createServiceRequestBundleEntries: jest.fn(() => []),
  createMedicationRequestEntries: jest.fn(() => []),
}));

// Mock hooks
const mockAddNotification = jest.fn();
jest.mock('@hooks/useNotification', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    addNotification: mockAddNotification,
  })),
}));

// Mock audit log service
jest.mock('@services/auditLogService', () => ({
  logEncounterEdit: jest.fn(),
}));

// Mock utilities
jest.mock('@utils/fhir/encounterResourceCreator', () => ({
  createEncounterResource: jest.fn(() => ({
    resourceType: 'Encounter',
    id: 'mock-encounter-id',
    subject: { reference: 'Patient/patient-123' },
  })),
}));

jest.mock('@utils/fhir/consultationBundleCreator', () => ({
  createBundleEntry: jest.fn((url, resource, method) => ({
    fullUrl: url,
    resource,
    request: { method, url: resource.resourceType },
  })),
  createConsultationBundle: jest.fn((entries) => ({
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  })),
}));

// Create mock store factories
const createMockEncounterDetailsStore = () => ({
  activeVisit: { id: 'visit-123' },
  selectedLocation: { uuid: 'location-123', display: 'OPD' },
  selectedEncounterType: { uuid: 'encounter-type-123', name: 'Consultation' },
  encounterParticipants: [{ uuid: 'participant-123' }],
  consultationDate: new Date('2025-01-19'),
  isEncounterDetailsFormReady: true,
  practitioner: { uuid: 'practitioner-123' },
  user: { uuid: 'user-123' },
  patientUUID: 'patient-123',
  hasError: false,
  reset: jest.fn(),
});

const createMockDiagnosesStore = () => ({
  selectedDiagnoses: [],
  selectedConditions: [],
  validate: jest.fn(() => true),
  reset: jest.fn(),
});

const createMockAllergyStore = () => ({
  selectedAllergies: [],
  validateAllAllergies: jest.fn(() => true),
  reset: jest.fn(),
});

const createMockServiceRequestStore = () => ({
  selectedServiceRequests: new Map(),
  reset: jest.fn(),
});

const createMockMedicationStore = () => ({
  selectedMedications: [],
  validateAllMedications: jest.fn(() => true),
  reset: jest.fn(),
  getState: jest.fn(() => ({ selectedMedications: [] })),
});

// Initialize stores
let mockEncounterDetailsStore = createMockEncounterDetailsStore();
let mockDiagnosesStore = createMockDiagnosesStore();
let mockAllergyStore = createMockAllergyStore();
let mockServiceRequestStore = createMockServiceRequestStore();
let mockMedicationStore = createMockMedicationStore();

jest.mock('@stores/encounterDetailsStore', () => ({
  useEncounterDetailsStore: jest.fn(() => mockEncounterDetailsStore),
}));

jest.mock('@stores/conditionsAndDiagnosesStore', () => ({
  useConditionsAndDiagnosesStore: jest.fn(() => mockDiagnosesStore),
}));

jest.mock('@stores/allergyStore', () => ({
  __esModule: true,
  default: jest.fn(() => mockAllergyStore),
  useAllergyStore: jest.fn(() => mockAllergyStore),
}));

jest.mock('@stores/serviceRequestStore', () => ({
  __esModule: true,
  default: jest.fn(() => mockServiceRequestStore),
}));

jest.mock('@stores/medicationsStore', () => ({
  __esModule: true,
  useMedicationStore: jest.fn(() => mockMedicationStore),
  default: jest.fn(() => mockMedicationStore),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9abc-def012345678'),
  },
});

const mockLogEncounterEdit = logEncounterEdit as jest.MockedFunction<
  typeof logEncounterEdit
>;

// Test wrapper
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

describe('ConsultationPad', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset stores to initial state
    mockEncounterDetailsStore = createMockEncounterDetailsStore();
    mockDiagnosesStore = createMockDiagnosesStore();
    mockAllergyStore = createMockAllergyStore();
    mockServiceRequestStore = createMockServiceRequestStore();
    mockMedicationStore = createMockMedicationStore();

    // Update the mocked return values
    (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
      mockEncounterDetailsStore,
    );
    (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue(
      mockDiagnosesStore,
    );
    (useAllergyStore as unknown as jest.Mock).mockReturnValue(mockAllergyStore);
    (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(
      mockServiceRequestStore,
    );
    (useMedicationStore as unknown as jest.Mock).mockReturnValue(
      mockMedicationStore,
    );

    // Reset audit logging mocks
    mockLogEncounterEdit.mockClear();
    mockLogEncounterEdit.mockResolvedValue({ logged: true });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);
      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });

    it('should display correct title when no error', () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);
      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'New Consultation',
      );
    });

    it('should render all child forms in correct order', () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const content = screen.getByTestId('action-area-content');
      const forms = content.querySelectorAll('[data-testid]');

      expect(forms[0]).toHaveAttribute('data-testid', 'mock-encounter-details');
      expect(forms[2]).toHaveAttribute(
        'data-testid',
        'mock-conditions-diagnoses',
      );
      expect(forms[4]).toHaveAttribute('data-testid', 'mock-allergies-form');
      expect(forms[6]).toHaveAttribute(
        'data-testid',
        'mock-investigations-form',
      );
      expect(forms[8]).toHaveAttribute('data-testid', 'mock-medications-form');
    });

    it('should render dividers between forms', () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);
      const dividers = screen.getAllByTestId('mock-divider');
      expect(dividers).toHaveLength(5);
    });

    it('should render forms and dividers in the correct sequence', () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const content = screen.getByTestId('action-area-content');
      const children = Array.from(content.children);

      // Verify the exact sequence of forms and dividers
      expect(children).toHaveLength(10); // 5 forms + 5 dividers

      // Check each element in order
      expect(children[0]).toHaveAttribute(
        'data-testid',
        'mock-encounter-details',
      );
      expect(children[1]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[2]).toHaveAttribute(
        'data-testid',
        'mock-conditions-diagnoses',
      );
      expect(children[3]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[4]).toHaveAttribute('data-testid', 'mock-allergies-form');
      expect(children[5]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[6]).toHaveAttribute(
        'data-testid',
        'mock-investigations-form',
      );
      expect(children[7]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[8]).toHaveAttribute(
        'data-testid',
        'mock-medications-form',
      );
      expect(children[9]).toHaveAttribute('data-testid', 'mock-divider');
    });

    it('should render action buttons with correct text', () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('primary-button')).toHaveTextContent('Done');
      expect(screen.getByTestId('secondary-button')).toHaveTextContent(
        'Cancel',
      );
    });

    it('should render error state when hasError is true', () => {
      mockEncounterDetailsStore.hasError = true;

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('action-area-title')).toHaveTextContent('');
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(
          'An error occurred while loading the consultation pad. Please try again later.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('mock-encounter-details'),
      ).not.toBeInTheDocument();
    });

    it('should disable Done button when required data is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockEncounterDetailsStore.selectedLocation = null as any;

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('primary-button')).toBeDisabled();
    });

    it('should enable Done button when all required data is present', () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('primary-button')).not.toBeDisabled();
    });
  });

  describe('Snapshot Tests', () => {
    it('should match snapshot for form order and dividers', () => {
      const { container } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for error state', () => {
      mockEncounterDetailsStore.hasError = true;
      const { container } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with disabled Done button', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockEncounterDetailsStore.selectedLocation = null as any;
      const { container } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );
      expect(container).toMatchSnapshot();
    });

    it('should verify correct order of forms and dividers in snapshot', () => {
      const { container } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );
      const content = container.querySelector(
        '[data-testid="action-area-content"]',
      );

      // Create a snapshot of just the content area to focus on form order
      expect(content).toMatchSnapshot();
    });

    it('should match snapshot during submission state', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolveSubmission: any;
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmission = resolve;
          }),
      );

      const { container } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );

      const doneButton = screen.getByTestId('primary-button');
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(doneButton).toBeDisabled();
      });

      expect(container).toMatchSnapshot();

      await act(async () => {
        resolveSubmission({ id: 'bundle-123' });
      });
    });
  });

  describe('User Interactions', () => {
    describe('Cancel Button', () => {
      it('should call onClose when clicked', async () => {
        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const cancelButton = screen.getByTestId('secondary-button');
        await userEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should reset all stores when clicked', async () => {
        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const cancelButton = screen.getByTestId('secondary-button');
        await userEvent.click(cancelButton);

        expect(mockDiagnosesStore.reset).toHaveBeenCalled();
        expect(mockAllergyStore.reset).toHaveBeenCalled();
        expect(mockServiceRequestStore.reset).toHaveBeenCalled();
        expect(mockMedicationStore.reset).toHaveBeenCalled();
      });

      it('should not submit data when clicked', async () => {
        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const cancelButton = screen.getByTestId('secondary-button');
        await userEvent.click(cancelButton);

        expect(
          consultationBundleService.postConsultationBundle,
        ).not.toHaveBeenCalled();
      });
    });

    describe('Done Button', () => {
      it('should validate and submit when data is valid', async () => {
        (
          consultationBundleService.postConsultationBundle as jest.Mock
        ).mockResolvedValue({
          id: 'bundle-123',
          type: 'transaction-response',
        });

        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const doneButton = screen.getByTestId('primary-button');
        await userEvent.click(doneButton);

        await waitFor(() => {
          expect(mockDiagnosesStore.validate).toHaveBeenCalled();
          expect(mockAllergyStore.validateAllAllergies).toHaveBeenCalled();
          expect(
            consultationBundleService.postConsultationBundle,
          ).toHaveBeenCalled();
          expect(mockAddNotification).toHaveBeenCalledWith({
            title: 'Success',
            message: 'Consultation saved successfully',
            type: 'success',
            timeout: 5000,
          });
          expect(mockOnClose).toHaveBeenCalled();
        });
      });

      it('should not submit when diagnoses validation fails', async () => {
        mockDiagnosesStore.validate.mockReturnValue(false);

        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const doneButton = screen.getByTestId('primary-button');
        await userEvent.click(doneButton);

        expect(mockDiagnosesStore.validate).toHaveBeenCalled();
        expect(
          consultationBundleService.postConsultationBundle,
        ).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });

      it('should not submit when allergies validation fails', async () => {
        mockAllergyStore.validateAllAllergies.mockReturnValue(false);

        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const doneButton = screen.getByTestId('primary-button');
        await userEvent.click(doneButton);

        expect(mockAllergyStore.validateAllAllergies).toHaveBeenCalled();
        expect(
          consultationBundleService.postConsultationBundle,
        ).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });

      it('should not submit when medications validation fails', async () => {
        mockMedicationStore.validateAllMedications.mockReturnValue(false);

        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const doneButton = screen.getByTestId('primary-button');
        await userEvent.click(doneButton);

        expect(mockMedicationStore.validateAllMedications).toHaveBeenCalled();
        expect(
          consultationBundleService.postConsultationBundle,
        ).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });

      it('should handle submission errors gracefully', async () => {
        const error = new Error('Network error');
        (
          consultationBundleService.postConsultationBundle as jest.Mock
        ).mockRejectedValue(error);

        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const doneButton = screen.getByTestId('primary-button');

        // Wait for button to be enabled
        await waitFor(() => {
          expect(doneButton).not.toBeDisabled();
        });

        await userEvent.click(doneButton);

        await waitFor(() => {
          expect(mockAddNotification).toHaveBeenCalledWith({
            title: 'Consultation Error',
            message: 'Network error',
            type: 'error',
            timeout: 5000,
          });
          expect(mockOnClose).not.toHaveBeenCalled();
        });
      });

      it('should disable button during submission', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resolveSubmission: any;
        (
          consultationBundleService.postConsultationBundle as jest.Mock
        ).mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveSubmission = resolve;
            }),
        );

        renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

        const doneButton = screen.getByTestId('primary-button');
        expect(doneButton).not.toBeDisabled();

        fireEvent.click(doneButton);

        await waitFor(() => {
          expect(doneButton).toBeDisabled();
        });

        resolveSubmission({ id: 'bundle-123' });

        await waitFor(() => {
          expect(doneButton).not.toBeDisabled();
        });
      });
    });
  });

  describe('State Management', () => {
    it('should cleanup stores on unmount', () => {
      const { unmount } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );

      unmount();

      expect(mockEncounterDetailsStore.reset).toHaveBeenCalled();
      expect(mockAllergyStore.reset).toHaveBeenCalled();
      expect(mockDiagnosesStore.reset).toHaveBeenCalled();
      expect(mockServiceRequestStore.reset).toHaveBeenCalled();
      expect(mockMedicationStore.reset).toHaveBeenCalled();
    });

    it('should track submission state correctly', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolveSubmission: any;
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmission = resolve;
          }),
      );

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');

      // Initial state - not submitting
      expect(doneButton).not.toBeDisabled();

      // Start submission
      fireEvent.click(doneButton);

      // During submission
      await waitFor(() => {
        expect(doneButton).toBeDisabled();
      });

      // Complete submission
      resolveSubmission({ id: 'bundle-123' });

      // After submission
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should reset all stores after successful submission', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(mockDiagnosesStore.reset).toHaveBeenCalled();
        expect(mockAllergyStore.reset).toHaveBeenCalled();
        expect(mockEncounterDetailsStore.reset).toHaveBeenCalled();
        expect(mockServiceRequestStore.reset).toHaveBeenCalled();
        expect(mockMedicationStore.reset).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('should validate all forms before submission', async () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      expect(mockDiagnosesStore.validate).toHaveBeenCalled();
      expect(mockAllergyStore.validateAllAllergies).toHaveBeenCalled();
      expect(mockMedicationStore.validateAllMedications).toHaveBeenCalled();
    });

    it('should disable Done button when patientUUID is missing', () => {
      const testStore = {
        ...createMockEncounterDetailsStore(),
        patientUUID: null,
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        testStore,
      );

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      expect(doneButton).toBeDisabled();
    });

    it('should disable Done button when practitioner is missing', () => {
      const testStore = {
        ...createMockEncounterDetailsStore(),
        practitioner: null,
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        testStore,
      );

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      expect(doneButton).toBeDisabled();
    });

    it('should disable Done button when activeVisit is missing', () => {
      const testStore = {
        ...createMockEncounterDetailsStore(),
        activeVisit: null,
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        testStore,
      );

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      expect(doneButton).toBeDisabled();
    });

    it('should disable Done button when selectedLocation is missing', () => {
      const testStore = {
        ...createMockEncounterDetailsStore(),
        selectedLocation: null,
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        testStore,
      );

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      expect(doneButton).toBeDisabled();
    });

    it('should disable Done button when selectedEncounterType is missing', () => {
      const testStore = {
        ...createMockEncounterDetailsStore(),
        selectedEncounterType: null,
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        testStore,
      );

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      expect(doneButton).toBeDisabled();
    });

    it('should disable Done button when encounterParticipants is empty', () => {
      const testStore = {
        ...createMockEncounterDetailsStore(),
        encounterParticipants: [],
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        testStore,
      );

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      expect(doneButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display generic error message when error is not an Error instance', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockRejectedValue('String error');

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(doneButton).not.toBeDisabled();
      });

      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Consultation Error',
          message: 'Error creating consultation bundle',
          type: 'error',
          timeout: 5000,
        });
      });
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockRejectedValue(timeoutError);

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(doneButton).not.toBeDisabled();
      });

      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Consultation Error',
          message: 'Request timeout',
          type: 'error',
          timeout: 5000,
        });
      });
    });

    it('should not submit when encounterDetailsFormReady is false', () => {
      mockEncounterDetailsStore.isEncounterDetailsFormReady = false;

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      expect(doneButton).toBeDisabled();
    });
  });

  describe('Bundle Creation', () => {
    it('should post complete consultation bundle with all resource types', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
      });

      // Mock the bundle entry creation functions to return identifiable entries
      (
        consultationBundleService.createDiagnosisBundleEntries as jest.Mock
      ).mockReturnValue([
        {
          resource: { resourceType: 'Condition', id: 'diagnosis-1' },
          request: { method: 'POST' },
        },
      ]);

      (
        consultationBundleService.createAllergiesBundleEntries as jest.Mock
      ).mockReturnValue([
        {
          resource: { resourceType: 'AllergyIntolerance', id: 'allergy-1' },
          request: { method: 'POST' },
        },
      ]);

      (
        consultationBundleService.createConditionsBundleEntries as jest.Mock
      ).mockReturnValue([
        {
          resource: { resourceType: 'Condition', id: 'condition-1' },
          request: { method: 'POST' },
        },
      ]);

      (
        consultationBundleService.createServiceRequestBundleEntries as jest.Mock
      ).mockReturnValue([
        {
          resource: { resourceType: 'ServiceRequest', id: 'service-request-1' },
          request: { method: 'POST' },
        },
      ]);

      (
        consultationBundleService.createMedicationRequestEntries as jest.Mock
      ).mockReturnValue([
        {
          resource: { resourceType: 'MedicationRequest', id: 'medication-1' },
          request: { method: 'POST' },
        },
      ]);

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(doneButton).not.toBeDisabled();
      });

      await userEvent.click(doneButton);

      await waitFor(() => {
        // Verify postConsultationBundle was called
        expect(
          consultationBundleService.postConsultationBundle,
        ).toHaveBeenCalled();

        // Get the bundle that was passed to postConsultationBundle
        const bundleArg = (
          consultationBundleService.postConsultationBundle as jest.Mock
        ).mock.calls[0][0];

        // Verify bundle structure
        expect(bundleArg).toMatchObject({
          resourceType: 'Bundle',
          type: 'transaction',
          entry: expect.any(Array),
        });

        // Verify all resource types are included in the bundle
        const resourceTypes = bundleArg.entry.map(
          (entry: BundleEntry) => entry.resource?.resourceType,
        );

        // Should contain the encounter resource
        expect(resourceTypes).toContain('Encounter');

        // Should contain resources from all bundle creation functions
        expect(resourceTypes).toContain('Condition'); // From diagnoses and conditions
        expect(resourceTypes).toContain('AllergyIntolerance');
        expect(resourceTypes).toContain('ServiceRequest');
        expect(resourceTypes).toContain('MedicationRequest');

        // Verify the encounter entry is first
        expect(bundleArg.entry[0].resource.resourceType).toBe('Encounter');
        expect(bundleArg.entry[0].fullUrl).toMatch(/^urn:uuid:/);

        // Verify total number of entries (1 encounter + 5 from bundle creation functions)
        expect(bundleArg.entry).toHaveLength(6);
      });
    });

    it('should create consultation bundle with correct data', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(doneButton).not.toBeDisabled();
      });

      await userEvent.click(doneButton);

      await waitFor(() => {
        // Verify encounter resource creation
        expect(
          consultationBundleService.createDiagnosisBundleEntries,
        ).toHaveBeenCalledWith({
          selectedDiagnoses: [],
          encounterSubject: { reference: 'Patient/patient-123' },
          encounterReference: 'urn:uuid:mock-uuid-1234-5678-9abc-def012345678',
          practitionerUUID: 'user-123',
          consultationDate: mockEncounterDetailsStore.consultationDate,
        });

        expect(
          consultationBundleService.createAllergiesBundleEntries,
        ).toHaveBeenCalledWith({
          selectedAllergies: [],
          encounterSubject: { reference: 'Patient/patient-123' },
          encounterReference: 'urn:uuid:mock-uuid-1234-5678-9abc-def012345678',
          practitionerUUID: 'user-123',
        });

        expect(
          consultationBundleService.createConditionsBundleEntries,
        ).toHaveBeenCalledWith({
          selectedConditions: [],
          encounterSubject: { reference: 'Patient/patient-123' },
          encounterReference: 'urn:uuid:mock-uuid-1234-5678-9abc-def012345678',
          practitionerUUID: 'user-123',
          consultationDate: mockEncounterDetailsStore.consultationDate,
        });

        expect(
          consultationBundleService.createServiceRequestBundleEntries,
        ).toHaveBeenCalledWith({
          selectedServiceRequests: new Map(),
          encounterSubject: { reference: 'Patient/patient-123' },
          encounterReference: 'urn:uuid:mock-uuid-1234-5678-9abc-def012345678',
          practitionerUUID: 'practitioner-123',
        });
      });
    });

    it('should generate unique UUID for encounter reference', async () => {
      const mockUUIDs = ['uuid-1-2-3-4-5', 'uuid-2-3-4-5-6', 'uuid-3-4-5-6-7'];
      let uuidIndex = 0;
      (global.crypto.randomUUID as jest.Mock).mockImplementation(
        () => mockUUIDs[uuidIndex++],
      );

      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(doneButton).not.toBeDisabled();
      });

      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(global.crypto.randomUUID).toHaveBeenCalled();
        expect(
          consultationBundleService.createDiagnosisBundleEntries,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            encounterReference: 'urn:uuid:uuid-1-2-3-4-5',
          }),
        );
      });
    });
  });

  describe('Submission Flow', () => {
    it('should handle complete submission flow', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(doneButton).not.toBeDisabled();
      });

      // Click submit
      await userEvent.click(doneButton);

      // Verify validation was called
      expect(mockDiagnosesStore.validate).toHaveBeenCalled();
      expect(mockAllergyStore.validateAllAllergies).toHaveBeenCalled();

      // Verify bundle creation
      await waitFor(() => {
        expect(
          consultationBundleService.postConsultationBundle,
        ).toHaveBeenCalled();
      });

      // Verify success notification
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Success',
        message: 'Consultation saved successfully',
        type: 'success',
        timeout: 5000,
      });

      // Verify stores were reset
      expect(mockDiagnosesStore.reset).toHaveBeenCalled();
      expect(mockAllergyStore.reset).toHaveBeenCalled();
      expect(mockEncounterDetailsStore.reset).toHaveBeenCalled();
      expect(mockServiceRequestStore.reset).toHaveBeenCalled();

      // Verify onClose was called
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should prevent multiple simultaneous submissions', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolveFirst: any;
      let callCount = 0;

      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockImplementation(() => {
        callCount++;
        return new Promise((resolve) => {
          if (callCount === 1) {
            resolveFirst = resolve;
          } else {
            resolve({ id: `bundle-${callCount}` });
          }
        });
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(doneButton).not.toBeDisabled();
      });

      // First click
      fireEvent.click(doneButton);

      // Try clicking again while first submission is in progress
      fireEvent.click(doneButton);
      fireEvent.click(doneButton);

      // Resolve first submission
      if (resolveFirst) {
        act(() => {
          resolveFirst({ id: 'bundle-1' });
        });
      }

      await waitFor(() => {
        // Should only have been called once despite multiple clicks
        expect(
          consultationBundleService.postConsultationBundle,
        ).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Audit Logging', () => {
    it('should log encounter edit after successful consultation submission', async () => {
      const encounterUuid = 'encounter-123';
      const encounterType = 'Consultation';

      // Mock crypto.randomUUID to return predictable value
      (global.crypto.randomUUID as jest.Mock).mockReturnValue(encounterUuid);

      mockLogEncounterEdit.mockResolvedValue({ logged: true });

      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
        type: 'transaction-response',
      });

      // Update mock store to have encounter type
      mockEncounterDetailsStore.selectedEncounterType = {
        uuid: 'encounter-type-123',
        name: encounterType,
      };

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(mockLogEncounterEdit).toHaveBeenCalledWith(
          'patient-123',
          encounterUuid,
          encounterType,
        );
      });
    });

    it('should not log encounter edit if consultation submission fails', async () => {
      const submissionError = new Error('Network error');

      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockRejectedValue(submissionError);

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(
          consultationBundleService.postConsultationBundle,
        ).toHaveBeenCalled();
        // Audit logging should not be called if submission fails
        expect(mockLogEncounterEdit).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should log encounter edit with correct patient UUID and encounter type', async () => {
      const patientUuid = 'patient-456';
      const encounterUuid = 'encounter-789';
      const encounterType = 'Follow-up';

      // Mock crypto.randomUUID to return predictable value
      (global.crypto.randomUUID as jest.Mock).mockReturnValue(encounterUuid);

      mockLogEncounterEdit.mockResolvedValue({ logged: true });

      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-456',
        type: 'transaction-response',
      });

      // Update mock store with different values
      mockEncounterDetailsStore.patientUUID = patientUuid;
      mockEncounterDetailsStore.selectedEncounterType = {
        uuid: 'encounter-type-456',
        name: encounterType,
      };

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(mockLogEncounterEdit).toHaveBeenCalledWith(
          patientUuid,
          encounterUuid,
          encounterType,
        );
      });
    });

    it('should complete consultation successfully when audit logging returns disabled status', async () => {
      const encounterUuid = 'encounter-123';

      // Mock crypto.randomUUID to return predictable value
      (global.crypto.randomUUID as jest.Mock).mockReturnValue(encounterUuid);

      // Mock audit service to return disabled status
      mockLogEncounterEdit.mockResolvedValue({
        logged: false,
        error: 'Audit logging is disabled',
      });

      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
        type: 'transaction-response',
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        // Verify audit logging was attempted
        expect(mockLogEncounterEdit).toHaveBeenCalledWith(
          'patient-123',
          encounterUuid,
          'Consultation',
        );
        // Consultation should still succeed even when audit service returns disabled status
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Consultation saved successfully',
          type: 'success',
          timeout: 5000,
        });
      });
    });
  });
});
