import { render, screen } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import { UserPrivilegeProvider } from '@providers/UserPrivilegeProvider';
import * as privilegeService from '@services/privilegeService';
import ConsultationPad from '../ConsultationPad';

// Mock the useEncounterSession hook
const mockUseEncounterSession = jest.fn();
jest.mock('@hooks/useEncounterSession', () => ({
  useEncounterSession: () => mockUseEncounterSession(),
}));

// Mock all other dependencies
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
  }: {
    title: string;
    primaryButtonText: string;
    onPrimaryButtonClick: () => void;
    isPrimaryButtonDisabled: boolean;
    secondaryButtonText: string;
    onSecondaryButtonClick: () => void;
    content: React.ReactNode;
  }) => (
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

jest.mock('@services/consultationBundleService', () => ({
  postConsultationBundle: jest.fn(),
  createDiagnosisBundleEntries: jest.fn(() => []),
  createAllergiesBundleEntries: jest.fn(() => []),
  createConditionsBundleEntries: jest.fn(() => []),
  createServiceRequestBundleEntries: jest.fn(() => []),
  createMedicationRequestEntries: jest.fn(() => []),
}));

const mockAddNotification = jest.fn();
jest.mock('@hooks/useNotification', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    addNotification: mockAddNotification,
  })),
}));

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

// Mock privilege service
jest.mock('@services/privilegeService');

// Mock stores
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

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9abc-def012345678'),
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <UserPrivilegeProvider>{ui}</UserPrivilegeProvider>
    </I18nextProvider>,
  );
};

describe('ConsultationPad - Encounter Session Integration', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock privilege service
    (privilegeService.getCurrentUserPrivileges as jest.Mock).mockResolvedValue([
      { name: 'app:clinical:observationForms' },
      { name: 'app:clinical:locationpicker' },
    ]);

    // Reset stores to initial state
    mockEncounterDetailsStore = createMockEncounterDetailsStore();
    mockDiagnosesStore = createMockDiagnosesStore();
    mockAllergyStore = createMockAllergyStore();
    mockServiceRequestStore = createMockServiceRequestStore();
    mockMedicationStore = createMockMedicationStore();
  });

  describe('Encounter Session Hook Integration', () => {
    it('should render with default encounter session state', () => {
      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'New Consultation',
      );
    });

    it('should handle loading state from encounter session', () => {
      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });

    it('should handle error state from encounter session', () => {
      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: false,
        error: 'Failed to fetch session',
        refetch: jest.fn(),
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });

    it('should handle active session with practitioner match', () => {
      const mockEncounter = {
        id: 'encounter-123',
        resourceType: 'Encounter' as const,
        status: 'in-progress' as const,
        subject: { reference: 'Patient/patient-123' },
        participant: [
          {
            individual: {
              reference: 'Practitioner/practitioner-123',
              identifier: { value: 'practitioner-123' },
            },
          },
        ],
      };

      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: true,
        activeEncounter: mockEncounter,
        isPractitionerMatch: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });

    it('should handle active session without practitioner match', () => {
      const mockEncounter = {
        id: 'encounter-123',
        resourceType: 'Encounter' as const,
        status: 'in-progress' as const,
        subject: { reference: 'Patient/patient-123' },
        participant: [
          {
            individual: {
              reference: 'Practitioner/different-practitioner',
              identifier: { value: 'different-practitioner' },
            },
          },
        ],
      };

      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: true,
        activeEncounter: mockEncounter,
        isPractitionerMatch: false,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });

    it('should call refetch when needed', async () => {
      const mockRefetch = jest.fn();

      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      // The refetch function should be available but not automatically called
      expect(mockRefetch).not.toHaveBeenCalled();
    });
  });

  describe('Encounter Session State Changes', () => {
    it('should handle session state transitions', () => {
      // Start with no session
      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { rerender } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );

      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'New Consultation',
      );

      // Simulate session becoming active
      const mockEncounter = {
        id: 'encounter-123',
        resourceType: 'Encounter' as const,
        status: 'in-progress' as const,
        subject: { reference: 'Patient/patient-123' },
        participant: [
          {
            individual: {
              reference: 'Practitioner/practitioner-123',
              identifier: { value: 'practitioner-123' },
            },
          },
        ],
      };

      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: true,
        activeEncounter: mockEncounter,
        isPractitionerMatch: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <UserPrivilegeProvider>
            <ConsultationPad onClose={mockOnClose} />
          </UserPrivilegeProvider>
        </I18nextProvider>,
      );

      // Title should still be "New Consultation" as ConsultationPad doesn't directly use encounter session for title
      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'New Consultation',
      );
    });

    it('should handle loading to loaded state transition', () => {
      // Start with loading
      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { rerender } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );

      // Simulate loading complete
      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <UserPrivilegeProvider>
            <ConsultationPad onClose={mockOnClose} />
          </UserPrivilegeProvider>
        </I18nextProvider>,
      );

      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });

    it('should handle error to success state transition', () => {
      // Start with error
      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: false,
        error: 'Network error',
        refetch: jest.fn(),
      });

      const { rerender } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );

      // Simulate error resolved
      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <UserPrivilegeProvider>
            <ConsultationPad onClose={mockOnClose} />
          </UserPrivilegeProvider>
        </I18nextProvider>,
      );

      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });
  });

  describe('Encounter Session Hook Return Values', () => {
    it('should handle all possible combinations of session states', () => {
      const testCases = [
        {
          hasActiveSession: false,
          activeEncounter: null,
          isPractitionerMatch: false,
          description: 'No session, no encounter, no match',
        },
        {
          hasActiveSession: true,
          activeEncounter: {
            id: 'enc-1',
            resourceType: 'Encounter' as const,
            status: 'in-progress' as const,
          },
          isPractitionerMatch: true,
          description:
            'Active session, encounter present, practitioner matches',
        },
        {
          hasActiveSession: true,
          activeEncounter: {
            id: 'enc-1',
            resourceType: 'Encounter' as const,
            status: 'in-progress' as const,
          },
          isPractitionerMatch: false,
          description:
            'Active session, encounter present, practitioner does not match',
        },
        {
          hasActiveSession: false,
          activeEncounter: {
            id: 'enc-1',
            resourceType: 'Encounter' as const,
            status: 'finished' as const,
          },
          isPractitionerMatch: false,
          description:
            'No active session, encounter present (expired), no match',
        },
      ];

      testCases.forEach(
        ({ hasActiveSession, activeEncounter, isPractitionerMatch }) => {
          mockUseEncounterSession.mockReturnValue({
            hasActiveSession,
            activeEncounter,
            isPractitionerMatch,
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          });

          const { unmount } = renderWithProviders(
            <ConsultationPad onClose={mockOnClose} />,
          );

          expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();

          unmount();
        },
      );
    });

    it('should handle encounter with complex participant structure', () => {
      const complexEncounter = {
        id: 'encounter-complex',
        resourceType: 'Encounter' as const,
        status: 'in-progress' as const,
        subject: { reference: 'Patient/patient-123' },
        participant: [
          {
            individual: {
              reference: 'Practitioner/practitioner-123',
              identifier: { value: 'practitioner-123' },
              display: 'Dr. John Doe',
            },
            type: [{ coding: [{ code: 'ATND', display: 'attender' }] }],
          },
          {
            individual: {
              reference: 'Practitioner/practitioner-456',
              identifier: { value: 'practitioner-456' },
              display: 'Dr. Jane Smith',
            },
            type: [{ coding: [{ code: 'CON', display: 'consultant' }] }],
          },
        ],
      };

      mockUseEncounterSession.mockReturnValue({
        hasActiveSession: true,
        activeEncounter: complexEncounter,
        isPractitionerMatch: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });
  });
});
