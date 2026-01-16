import { AUDIT_LOG_EVENT_DETAILS, dispatchAuditEvent } from '@bahmni/services';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BundleEntry } from 'fhir/r4';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import { ClinicalAppProvider } from '../../../providers/ClinicalAppProvider';
import * as consultationBundleService from '../../../services/consultationBundleService';
import * as pinnedFormsService from '../../../services/pinnedFormsService';
import useAllergyStore from '../../../stores/allergyStore';
import { useConditionsAndDiagnosesStore } from '../../../stores/conditionsAndDiagnosesStore';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import { useMedicationStore } from '../../../stores/medicationsStore';
import useServiceRequestStore from '../../../stores/serviceRequestStore';
import ConsultationPad from '../ConsultationPad';

// Import the mocked service to get access to the mock function

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
  findActiveEncounterInSession: jest.fn().mockResolvedValue(null),
  __esModule: true,
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
jest.mock('@bahmni/design-system', () => ({
  __esModule: true,
  ...jest.requireActual('@bahmni/design-system'),
  ActionArea: ({
    title,
    primaryButtonText,
    onPrimaryButtonClick,
    isPrimaryButtonDisabled,
    secondaryButtonText,
    onSecondaryButtonClick,
    tertiaryButtonText,
    onTertiaryButtonClick,
    content,
    hidden,
  }: any) => (
    <div data-testid="mock-action-area" data-hidden={hidden}>
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
      {tertiaryButtonText && (
        <button data-testid="tertiary-button" onClick={onTertiaryButtonClick}>
          {tertiaryButtonText}
        </button>
      )}
    </div>
  ),
  MenuItemDivider: () => <hr data-testid="mock-divider" />,
}));

jest.mock(
  '../../../components/forms/encounterDetails/EncounterDetails',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-encounter-details">Encounter Details Form</div>
    ),
  }),
);

jest.mock(
  '../../../components/forms/conditionsAndDiagnoses/ConditionsAndDiagnoses',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-conditions-diagnoses">
        Conditions and Diagnoses Form
      </div>
    ),
  }),
);

jest.mock('../../../components/forms/allergies/AllergiesForm', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-allergies-form">Allergies Form</div>,
}));

jest.mock(
  '../../../components/forms/investigations/InvestigationsForm',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-investigations-form">Investigations Form</div>
    ),
  }),
);

jest.mock('../../../components/forms/medications/MedicationsForm', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="mock-medications-form">Medications Form</div>
  ),
}));

// Mock services
jest.mock('../../../services/consultationBundleService', () => ({
  postConsultationBundle: jest.fn(),
  createDiagnosisBundleEntries: jest.fn(() => []),
  createAllergiesBundleEntries: jest.fn(() => []),
  createConditionsBundleEntries: jest.fn(() => []),
  createServiceRequestBundleEntries: jest.fn(() => []),
  createMedicationRequestEntries: jest.fn(() => []),
  createObservationBundleEntries: jest.fn(() => []),
  createEncounterBundleEntry: jest.fn(() => ({
    fullUrl: 'urn:uuid:mock-encounter-uuid',
    resource: { resourceType: 'Encounter', id: 'mock-encounter-id' },
    request: { method: 'POST', url: 'Encounter' },
  })),
  getEncounterReference: jest.fn(() => 'urn:uuid:mock-encounter-uuid'),
}));

// Mock TanStack Query
const mockCancelQueries = jest.fn();
const mockRemoveQueries = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: {
      encounterUuids: [],
      visitUuids: [],
    },
    isLoading: false,
    error: null,
  })),
  useQueryClient: jest.fn(() => ({
    cancelQueries: mockCancelQueries,
    removeQueries: mockRemoveQueries,
    invalidateQueries: mockInvalidateQueries,
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock pinned forms service
jest.mock('../../../services/pinnedFormsService', () => ({
  savePinnedForms: jest.fn(),
  loadPinnedForms: jest.fn(() => Promise.resolve([])),
}));

const mockSavePinnedForms =
  pinnedFormsService.savePinnedForms as jest.MockedFunction<
    typeof pinnedFormsService.savePinnedForms
  >;
const mockLoadPinnedForms =
  pinnedFormsService.loadPinnedForms as jest.MockedFunction<
    typeof pinnedFormsService.loadPinnedForms
  >;
const mockUseObservationFormsSearch =
  useObservationFormsSearch as jest.MockedFunction<
    typeof useObservationFormsSearch
  >;

// Mock hooks
const mockAddNotification = jest.fn();

jest.mock('@bahmni/widgets', () => ({
  useNotification: jest.fn(() => ({
    addNotification: mockAddNotification,
  })),
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: ['VIEW_PATIENTS', 'EDIT_ENCOUNTERS'],
  })),
  conditionsQueryKeys: jest.fn((patientUUID: string) => [
    'conditions',
    patientUUID,
  ]),
  __esModule: true,
}));

// Mock utilities
jest.mock('../../../utils/fhir/encounterResourceCreator', () => ({
  createEncounterResource: jest.fn(() => ({
    resourceType: 'Encounter',
    id: 'mock-encounter-id',
    subject: { reference: 'Patient/patient-123' },
  })),
}));

jest.mock('../../../utils/fhir/consultationBundleCreator', () => ({
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

// Mock encounter session hook
const mockUseEncounterSession = jest.fn();
jest.mock('../../../hooks/useEncounterSession', () => ({
  __esModule: true,
  useEncounterSession: () => mockUseEncounterSession(),
}));

// Mock observation forms search hook
jest.mock('../../../hooks/useObservationFormsSearch', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    forms: [] as any[],
    isLoading: false,
    error: null,
  })),
}));

// Mock observation forms store
// We need to use a factory function that returns new state for each component instance
const mockObservationFormsStoreState = {
  selectedForms: [] as any[],
  formsData: {},
  viewingForm: null as any,
};

const createMockObservationFormsStore = () => ({
  get selectedForms() {
    return mockObservationFormsStoreState.selectedForms;
  },
  get formsData() {
    return mockObservationFormsStoreState.formsData;
  },
  get viewingForm() {
    return mockObservationFormsStoreState.viewingForm;
  },
  addForm: jest.fn((form: any) => {
    // Check if form already exists
    const isDuplicate = mockObservationFormsStoreState.selectedForms.some(
      (f: any) => f.uuid === form.uuid,
    );
    if (!isDuplicate) {
      mockObservationFormsStoreState.selectedForms = [
        ...mockObservationFormsStoreState.selectedForms,
        form,
      ];
    }
    // Always set viewing form when addForm is called
    mockObservationFormsStoreState.viewingForm = form;
  }),
  removeForm: jest.fn((formUuid: string) => {
    mockObservationFormsStoreState.selectedForms =
      mockObservationFormsStoreState.selectedForms.filter(
        (f: any) => f.uuid !== formUuid,
      );
    if (mockObservationFormsStoreState.viewingForm?.uuid === formUuid) {
      mockObservationFormsStoreState.viewingForm = null;
    }
  }),
  updateFormData: jest.fn(),
  getFormData: jest.fn(() => undefined),
  setViewingForm: jest.fn((form: any) => {
    mockObservationFormsStoreState.viewingForm = form;
  }),
  getAllObservations: jest.fn(() => []),
  getObservationFormsData: jest.fn(() => ({})),
  validate: jest.fn(() => true),
  reset: jest.fn(() => {
    mockObservationFormsStoreState.selectedForms = [];
    mockObservationFormsStoreState.formsData = {};
    mockObservationFormsStoreState.viewingForm = null;
  }),
  getState: jest.fn(() => mockObservationFormsStoreState),
});

const mockObservationFormsStore = createMockObservationFormsStore();

jest.mock('../../../stores/observationFormsStore', () => ({
  __esModule: true,
  useObservationFormsStore: () => mockObservationFormsStore,
}));

// Mock pinned observation forms hook
const mockUsePinnedObservationForms = jest.fn(() => ({
  pinnedForms: [],
  updatePinnedForms: jest.fn(),
  isLoading: false,
  error: null,
}));

jest.mock('../../../hooks/usePinnedObservationForms', () => ({
  __esModule: true,
  usePinnedObservationForms: () => mockUsePinnedObservationForms(),
}));

jest.mock('../../forms/observations/ObservationForms', () => ({
  __esModule: true,
  default: ({ onFormSelect, selectedForms, onRemoveForm }: any) => (
    <div data-testid="mock-observation-forms">
      <div data-testid="observation-forms-content">Observation Forms</div>
      <button
        data-testid="select-form-button"
        onClick={() =>
          onFormSelect?.({
            uuid: 'form-1',
            name: 'Test Form',
            id: 1,
            privileges: [],
          })
        }
      >
        Select Form
      </button>
      <div data-testid="selected-forms-count">
        Selected: {selectedForms?.length ?? 0}
      </div>
      <div data-testid="pinned-forms-count">Pinned: 0</div>
      {selectedForms?.map((form: { uuid: string; name: string }) => (
        <div
          key={form.uuid}
          data-testid={`selected-form-${form.uuid}`}
          onClick={() => onFormSelect?.(form)}
          role="button"
          tabIndex={0}
        >
          {form.name}
          <button
            data-testid={`remove-form-${form.uuid}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveForm?.(form.uuid);
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../../forms/observations/ObservationFormsContainer', () => ({
  __esModule: true,
  default: ({ viewingForm, onViewingFormChange, onRemoveForm }: any) => (
    <div data-testid="mock-observation-forms-wrapper">
      <div data-testid="wrapper-viewing-form">{viewingForm?.name}</div>
      <button
        data-testid="wrapper-save-button"
        onClick={() => onViewingFormChange?.(null)}
      >
        Save
      </button>
      <button
        data-testid="wrapper-discard-button"
        onClick={() => {
          onRemoveForm?.(viewingForm?.uuid);
          onViewingFormChange?.(null);
        }}
      >
        Discard
      </button>
      <button
        data-testid="wrapper-back-button"
        onClick={() => onViewingFormChange?.(null)}
      >
        Back
      </button>
    </div>
  ),
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
  isError: false,
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

jest.mock('../../../stores/encounterDetailsStore', () => ({
  useEncounterDetailsStore: jest.fn(() => mockEncounterDetailsStore),
}));

jest.mock('../../../stores/conditionsAndDiagnosesStore', () => ({
  useConditionsAndDiagnosesStore: jest.fn(() => mockDiagnosesStore),
}));

jest.mock('../../../stores/allergyStore', () => ({
  __esModule: true,
  default: jest.fn(() => mockAllergyStore),
  useAllergyStore: jest.fn(() => mockAllergyStore),
}));

jest.mock('../../../stores/serviceRequestStore', () => ({
  __esModule: true,
  default: jest.fn(() => mockServiceRequestStore),
}));

jest.mock('../../../stores/medicationsStore', () => ({
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

const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;

describe('ConsultationPad', () => {
  const mockOnClose = jest.fn();

  const renderWithProvider = (episodeUuids: string[] = []) => {
    return render(
      <ClinicalAppProvider episodeUuids={episodeUuids}>
        <ConsultationPad onClose={mockOnClose} />
      </ClinicalAppProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset stores to initial state
    mockEncounterDetailsStore = createMockEncounterDetailsStore();
    mockDiagnosesStore = createMockDiagnosesStore();
    mockAllergyStore = createMockAllergyStore();
    mockServiceRequestStore = createMockServiceRequestStore();
    mockMedicationStore = createMockMedicationStore();

    // Mock useEncounterSession hook
    mockUseEncounterSession.mockReturnValue({
      hasActiveSession: false,
      activeEncounter: null,
      isPractitionerMatch: false,
      refetch: jest.fn(),
    });

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

    // Reset audit event dispatcher mocks
    mockDispatchAuditEvent.mockClear();

    // Reset pinned forms service mocks
    mockSavePinnedForms.mockClear();
    mockLoadPinnedForms.mockClear();
    mockLoadPinnedForms.mockResolvedValue([]);

    // Reset observation forms search hook
    mockUseObservationFormsSearch.mockReturnValue({
      forms: [] as any[],
      isLoading: false,
      error: null,
    });

    // Reset observation forms store state
    mockObservationFormsStoreState.selectedForms = [];
    mockObservationFormsStoreState.formsData = {};
    mockObservationFormsStoreState.viewingForm = null;
    mockObservationFormsStore.addForm.mockClear();
    mockObservationFormsStore.removeForm.mockClear();
    mockObservationFormsStore.updateFormData.mockClear();
    mockObservationFormsStore.getFormData.mockClear();
    mockObservationFormsStore.getFormData.mockReturnValue(undefined);
    mockObservationFormsStore.setViewingForm.mockClear();
    mockObservationFormsStore.getAllObservations.mockClear();
    mockObservationFormsStore.getAllObservations.mockReturnValue([]);
    mockObservationFormsStore.getObservationFormsData.mockClear();
    mockObservationFormsStore.getObservationFormsData.mockReturnValue({});
    mockObservationFormsStore.validate.mockClear();
    mockObservationFormsStore.validate.mockReturnValue(true);
    mockObservationFormsStore.reset.mockClear();

    // Reset pinned observation forms hook
    mockUsePinnedObservationForms.mockReturnValue({
      pinnedForms: [],
      updatePinnedForms: jest.fn(),
      isLoading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderWithProvider();
      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });

    it('should display correct title when no error', () => {
      renderWithProvider();
      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'CONSULTATION_ACTION_NEW',
      );
    });

    it('should render all child forms in correct order', () => {
      renderWithProvider();

      const content = screen.getByTestId('action-area-content');
      const forms = content.querySelectorAll('[data-testid]');

      expect(forms[0]).toHaveAttribute('data-testid', 'mock-encounter-details');

      expect(forms[2]).toHaveAttribute('data-testid', 'mock-allergies-form');
      expect(forms[4]).toHaveAttribute(
        'data-testid',
        'mock-investigations-form',
      );
      expect(forms[6]).toHaveAttribute(
        'data-testid',
        'mock-conditions-diagnoses',
      );
      expect(forms[8]).toHaveAttribute('data-testid', 'mock-medications-form');
    });

    it('should render dividers between forms', () => {
      renderWithProvider();
      const dividers = screen.getAllByTestId('mock-divider');
      expect(dividers).toHaveLength(6);
    });

    it('should render forms and dividers in the correct sequence', () => {
      renderWithProvider();

      const content = screen.getByTestId('action-area-content');
      const children = Array.from(content.children);

      // Verify the exact sequence of forms and dividers
      expect(children).toHaveLength(12); // 6 forms + 6 dividers

      // Check each element in order
      expect(children[0]).toHaveAttribute(
        'data-testid',
        'mock-encounter-details',
      );
      expect(children[1]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[2]).toHaveAttribute('data-testid', 'mock-allergies-form');
      expect(children[3]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[4]).toHaveAttribute(
        'data-testid',
        'mock-investigations-form',
      );
      expect(children[5]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[6]).toHaveAttribute(
        'data-testid',
        'mock-conditions-diagnoses',
      );
      expect(children[7]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[8]).toHaveAttribute(
        'data-testid',
        'mock-medications-form',
      );
      expect(children[9]).toHaveAttribute('data-testid', 'mock-divider');
      expect(children[10]).toHaveAttribute(
        'data-testid',
        'mock-observation-forms',
      );
      expect(children[11]).toHaveAttribute('data-testid', 'mock-divider');
    });

    it('should render action buttons with correct text', () => {
      renderWithProvider();

      expect(screen.getByTestId('primary-button')).toHaveTextContent('Done');
      expect(screen.getByTestId('secondary-button')).toHaveTextContent(
        'Cancel',
      );
    });

    it('should render error state when isError is true', () => {
      mockEncounterDetailsStore.isError = true;

      renderWithProvider();

      expect(screen.getByTestId('action-area-title')).toBeEmptyDOMElement();
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
      mockEncounterDetailsStore.selectedLocation = null as any;

      renderWithProvider();

      expect(screen.getByTestId('primary-button')).toBeDisabled();
    });

    it('should enable Done button when all required data is present', () => {
      renderWithProvider();

      expect(screen.getByTestId('primary-button')).not.toBeDisabled();
    });
  });
  describe('Observation Forms Integration', () => {
    it('should render ObservationForms component with correct props', () => {
      renderWithProvider();

      const observationForms = screen.getByTestId('mock-observation-forms');
      expect(observationForms).toBeInTheDocument();
      expect(screen.getByTestId('selected-forms-count')).toHaveTextContent(
        'Selected: 0',
      );
    });

    it('should render ObservationFormsWrapper when form is selected for viewing', async () => {
      const { rerender } = renderWithProvider();

      const selectButton = screen.getByTestId('select-form-button');
      await userEvent.click(selectButton);

      // Force a re-render to pick up the store changes
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Should render ObservationFormsWrapper instead of consultation ActionArea
      await waitFor(() => {
        expect(
          screen.getByTestId('mock-observation-forms-wrapper'),
        ).toBeInTheDocument();
      });
      expect(screen.getByTestId('wrapper-viewing-form')).toHaveTextContent(
        'Test Form',
      );
      expect(screen.queryByTestId('mock-action-area')).toBeInTheDocument();
    });

    it('should manage selectedForms state correctly', async () => {
      const { rerender } = renderWithProvider();

      // Initially should show 0 selected forms
      expect(screen.getByTestId('selected-forms-count')).toHaveTextContent(
        'Selected: 0',
      );

      const selectButton = screen.getByTestId('select-form-button');
      await userEvent.click(selectButton);

      // Force re-render
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // After selecting, should switch to ObservationFormsWrapper
      await waitFor(() => {
        expect(
          screen.getByTestId('mock-observation-forms-wrapper'),
        ).toBeInTheDocument();
      });

      // Go back to consultation view using wrapper back button
      const backButton = screen.getByTestId('wrapper-back-button');
      await userEvent.click(backButton);

      // Force re-render to pick up viewingForm = null
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Now should show 1 selected form
      await waitFor(() => {
        expect(screen.getByTestId('selected-forms-count')).toHaveTextContent(
          'Selected: 1',
        );
      });
      expect(screen.getByTestId('selected-form-form-1')).toBeInTheDocument();
    });

    it('should prevent duplicate forms from being added to selectedForms', async () => {
      const { rerender } = renderWithProvider();

      const selectButton = screen.getByTestId('select-form-button');

      // Add the form once
      await userEvent.click(selectButton);

      // Force re-render
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Go back to consultation view using wrapper back button
      await waitFor(() => {
        expect(screen.getByTestId('wrapper-back-button')).toBeInTheDocument();
      });
      const backButton = screen.getByTestId('wrapper-back-button');
      await userEvent.click(backButton);

      // Force re-render
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Try to add the same form again
      await waitFor(() => {
        expect(screen.getByTestId('select-form-button')).toBeInTheDocument();
      });
      const selectButtonAgain = screen.getByTestId('select-form-button');
      await userEvent.click(selectButtonAgain);

      // Force re-render again
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Go back to consultation view again using wrapper back button
      await waitFor(() => {
        expect(screen.getByTestId('wrapper-back-button')).toBeInTheDocument();
      });
      const backButtonAgain = screen.getByTestId('wrapper-back-button');
      await userEvent.click(backButtonAgain);

      // Force re-render
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Should only have one form
      await waitFor(() => {
        expect(screen.getByTestId('selected-forms-count')).toHaveTextContent(
          'Selected: 1',
        );
      });
    });

    it('should remove forms from selectedForms when onRemoveForm is called', async () => {
      const { rerender } = renderWithProvider();

      // Add a form first
      const selectButton = screen.getByTestId('select-form-button');
      await userEvent.click(selectButton);

      // Force re-render
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Go back to consultation view using wrapper back button
      await waitFor(() => {
        expect(screen.getByTestId('wrapper-back-button')).toBeInTheDocument();
      });
      const backButton = screen.getByTestId('wrapper-back-button');
      await userEvent.click(backButton);

      // Force re-render
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Verify form is selected
      await waitFor(() => {
        expect(screen.getByTestId('selected-forms-count')).toHaveTextContent(
          'Selected: 1',
        );
      });
      expect(screen.getByTestId('selected-form-form-1')).toBeInTheDocument();

      // Remove the form
      const removeButton = screen.getByTestId('remove-form-form-1');
      await userEvent.click(removeButton);

      // Force re-render after removal
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Verify form is removed
      await waitFor(() => {
        expect(screen.getByTestId('selected-forms-count')).toHaveTextContent(
          'Selected: 0',
        );
      });
      expect(
        screen.queryByTestId('selected-form-form-1'),
      ).not.toBeInTheDocument();
    });

    it('should remove form from selectedForms when discarded from wrapper', async () => {
      const { rerender } = renderWithProvider();

      // Add a form first
      const selectButton = screen.getByTestId('select-form-button');
      await userEvent.click(selectButton);

      // Force re-render
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Should render ObservationFormsWrapper
      await waitFor(() => {
        expect(
          screen.getByTestId('mock-observation-forms-wrapper'),
        ).toBeInTheDocument();
      });

      // Discard the form using wrapper discard button
      const discardButton = screen.getByTestId('wrapper-discard-button');
      await userEvent.click(discardButton);

      // Force re-render after discard
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // Should be back to consultation view with no selected forms
      await waitFor(() => {
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
      });
      expect(screen.getByTestId('selected-forms-count')).toHaveTextContent(
        'Selected: 0',
      );
      expect(
        screen.queryByTestId('selected-form-form-1'),
      ).not.toBeInTheDocument();
    });

    it('should hide ActionArea when viewing a form', async () => {
      const { rerender } = renderWithProvider();

      // Initially, ActionArea should not be hidden
      const actionArea = screen.getByTestId('mock-action-area');
      expect(actionArea).toHaveAttribute('data-hidden', 'false');

      // Select a form to view
      const selectButton = screen.getByTestId('select-form-button');
      await userEvent.click(selectButton);

      // Force re-render to pick up the store changes
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // ActionArea should now be hidden
      await waitFor(() => {
        const hiddenActionArea = screen.getByTestId('mock-action-area');
        expect(hiddenActionArea).toHaveAttribute('data-hidden', 'true');
      });

      // Go back from viewing form
      const backButton = screen.getByTestId('wrapper-back-button');
      await userEvent.click(backButton);

      // Force re-render
      rerender(
        <ClinicalAppProvider episodeUuids={[]}>
          <ConsultationPad onClose={mockOnClose} />
        </ClinicalAppProvider>,
      );

      // ActionArea should be visible again
      await waitFor(() => {
        const visibleActionArea = screen.getByTestId('mock-action-area');
        expect(visibleActionArea).toHaveAttribute('data-hidden', 'false');
      });
    });
  });
  describe('Snapshot Tests', () => {
    it('should match snapshot for form order and dividers', () => {
      const { container } = renderWithProvider();
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for error state', () => {
      mockEncounterDetailsStore.isError = true;
      const { container } = renderWithProvider();
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with disabled Done button', () => {
      mockEncounterDetailsStore.selectedLocation = null as any;
      const { container } = renderWithProvider();
      expect(container).toMatchSnapshot();
    });

    it('should verify correct order of forms and dividers in snapshot', () => {
      const { container } = renderWithProvider();
      const content = container.querySelector(
        '[data-testid="action-area-content"]',
      );

      // Create a snapshot of just the content area to focus on form order
      expect(content).toMatchSnapshot();
    });

    it('should match snapshot during submission state', async () => {
      let resolveSubmission: any;
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmission = resolve;
          }),
      );

      const { container } = renderWithProvider();

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
        renderWithProvider();

        const cancelButton = screen.getByTestId('secondary-button');
        await userEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should reset all stores when clicked', async () => {
        renderWithProvider();

        const cancelButton = screen.getByTestId('secondary-button');
        await userEvent.click(cancelButton);

        expect(mockDiagnosesStore.reset).toHaveBeenCalled();
        expect(mockAllergyStore.reset).toHaveBeenCalled();
        expect(mockServiceRequestStore.reset).toHaveBeenCalled();
        expect(mockMedicationStore.reset).toHaveBeenCalled();
      });

      it('should not submit data when clicked', async () => {
        renderWithProvider();

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

        renderWithProvider();

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

        renderWithProvider();

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

        renderWithProvider();

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

        renderWithProvider();

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

        renderWithProvider();

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
        let resolveSubmission: any;
        (
          consultationBundleService.postConsultationBundle as jest.Mock
        ).mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveSubmission = resolve;
            }),
        );

        renderWithProvider();

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
      const { unmount } = renderWithProvider();

      unmount();

      expect(mockEncounterDetailsStore.reset).toHaveBeenCalled();
      expect(mockAllergyStore.reset).toHaveBeenCalled();
      expect(mockDiagnosesStore.reset).toHaveBeenCalled();
      expect(mockServiceRequestStore.reset).toHaveBeenCalled();
      expect(mockMedicationStore.reset).toHaveBeenCalled();
    });

    it('should track submission state correctly', async () => {
      let resolveSubmission: any;
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmission = resolve;
          }),
      );

      renderWithProvider();

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

      renderWithProvider();

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
      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

      const doneButton = screen.getByTestId('primary-button');
      expect(doneButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display generic error message when error is not an Error instance', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockRejectedValue('String error');

      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

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
          encounterReference: 'urn:uuid:mock-encounter-uuid',
          practitionerUUID: 'practitioner-123',
          consultationDate: mockEncounterDetailsStore.consultationDate,
        });

        expect(
          consultationBundleService.createAllergiesBundleEntries,
        ).toHaveBeenCalledWith({
          selectedAllergies: [],
          encounterSubject: { reference: 'Patient/patient-123' },
          encounterReference: 'urn:uuid:mock-encounter-uuid',
          practitionerUUID: 'practitioner-123',
        });

        expect(
          consultationBundleService.createConditionsBundleEntries,
        ).toHaveBeenCalledWith({
          selectedConditions: [],
          encounterSubject: { reference: 'Patient/patient-123' },
          encounterReference: 'urn:uuid:mock-encounter-uuid',
          practitionerUUID: 'practitioner-123',
          consultationDate: mockEncounterDetailsStore.consultationDate,
        });

        expect(
          consultationBundleService.createServiceRequestBundleEntries,
        ).toHaveBeenCalledWith({
          selectedServiceRequests: new Map(),
          encounterSubject: { reference: 'Patient/patient-123' },
          encounterReference: 'urn:uuid:mock-encounter-uuid',
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

      // Mock getEncounterReference to return the expected UUID format
      (
        consultationBundleService.getEncounterReference as jest.Mock
      ).mockReturnValue('urn:uuid:uuid-1-2-3-4-5');

      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
      });

      renderWithProvider();

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

      renderWithProvider();

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

      renderWithProvider();

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

  describe('Audit Event Dispatching', () => {
    it('should dispatch audit event with correct event type after successful consultation submission', async () => {
      const encounterType = 'Consultation';
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

      renderWithProvider();

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
          eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER.eventType,
          messageParams: {
            encounterType: encounterType,
          },
          patientUuid: 'patient-123',
        });
      });
    });

    it('should use the correct audit log constant for event type', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
        type: 'transaction-response',
      });

      renderWithProvider();

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        const callArgs = mockDispatchAuditEvent.mock.calls[0][0];
        // Verify that the eventType is using the constant, not a hardcoded string
        expect(callArgs.eventType).toBe(
          AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER.eventType,
        );
        expect(callArgs.eventType).toBe('EDIT_ENCOUNTER');
      });
    });

    it('should not dispatch audit event if consultation submission fails', async () => {
      const submissionError = new Error('Network error');

      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockRejectedValue(submissionError);

      renderWithProvider();

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(
          consultationBundleService.postConsultationBundle,
        ).toHaveBeenCalled();
        // Audit event should not be dispatched if submission fails
        expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should dispatch audit event with correct patient UUID and encounter details', async () => {
      const encounterType = 'Follow-up';
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-456',
        type: 'transaction-response',
      });

      // Update mock store with different values
      mockEncounterDetailsStore.selectedEncounterType = {
        uuid: 'encounter-type-456',
        name: encounterType,
      };

      renderWithProvider();

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
          eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER.eventType,
          messageParams: {
            encounterType: encounterType,
          },
          patientUuid: 'patient-123',
        });
      });
    });

    it('should complete consultation successfully regardless of audit event dispatch result', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
        type: 'transaction-response',
      });

      renderWithProvider();

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        // Verify audit event was dispatched
        expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
          eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER.eventType,
          messageParams: {
            encounterType: 'Consultation',
          },
          patientUuid: 'patient-123',
        });
        // Consultation should succeed regardless of audit dispatch result
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Consultation saved successfully',
          type: 'success',
          timeout: 5000,
        });
      });
    });

    it('should verify the audit event type constant is not hardcoded', async () => {
      (
        consultationBundleService.postConsultationBundle as jest.Mock
      ).mockResolvedValue({
        id: 'bundle-123',
        type: 'transaction-response',
      });

      renderWithProvider();

      const doneButton = screen.getByTestId('primary-button');
      await userEvent.click(doneButton);

      await waitFor(() => {
        expect(mockDispatchAuditEvent).toHaveBeenCalled();
        const callArgs = mockDispatchAuditEvent.mock.calls[0][0];

        // Verify event type is from constant and matches expected value
        expect(callArgs.eventType).not.toBe('hardcoded-string');
        expect(callArgs.eventType).toBe(
          AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER.eventType,
        );

        // Verify other expected parameters
        expect(callArgs.messageParams).toEqual({
          encounterType: 'Consultation',
        });
      });
    });
  });
});
