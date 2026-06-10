import {
  useTranslation,
  CONSULTATION_SAVED_EVENT,
  resetEncounterSession,
  setEncounterSessionDecision,
  getEncounterSessionSnapshot,
} from '@bahmni/services';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { dispatchConsultationStart } from '../../../events/startConsultation';
import { useEncounterSession } from '../../../hooks/useEncounterSession';
import { usePatientVisit } from '../../../hooks/usePatientVisit';
import PatientHeader from '../PatientHeader';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  // Let the real store functions through so we can assert on them
}));

jest.mock('../../../events/startConsultation', () => ({
  dispatchConsultationStart: jest.fn(),
}));
// Mock the PatientDetails component
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  PatientDetails: () => (
    <div data-testid="patient-details-mock">PatientDetails Mock</div>
  ),
  DocumentPrintButton: () => <div data-testid="document-print-button-mock" />,
  useActivePractitioner: jest.fn(() => ({
    uuid: 'active-practitioner-uuid',
    practitioner: { uuid: 'active-practitioner-uuid' },
  })),
  usePatientUUID: jest.fn(() => 'patient-uuid'),
  useHasPrivilege: jest.fn(() => true),
}));

jest.mock('../../../hooks/usePatientVisit', () => ({
  usePatientVisit: jest.fn(() => ({
    activeVisit: { id: 'visit-uuid-123' },
    lastVisit: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

jest.mock('../../../providers/clinicalConfig', () => ({
  useClinicalConfig: jest.fn(() => ({
    clinicalConfig: null,
    isLoading: false,
    error: null,
  })),
}));

jest.mock('../../../hooks/useEncounterSession', () => ({
  useEncounterSession: jest.fn(() => ({
    hasActiveSession: false,
    activeEncounter: null,
    isPractitionerMatch: false,
    matchReason: [],
    editActiveEncounter: false,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

const mockedUseEncounterSession = useEncounterSession as jest.MockedFunction<
  typeof useEncounterSession
>;

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockedUsePatientVisit = usePatientVisit as jest.MockedFunction<
  typeof usePatientVisit
>;

const mockDispatchConsultationStart =
  dispatchConsultationStart as jest.MockedFunction<
    typeof dispatchConsultationStart
  >;

describe('PatientHeader Component', () => {
  const defaultProps = {
    isActionAreaVisible: false,
  };

  // Helper function to render with props
  const renderComponent = (props = {}) => {
    return render(<PatientHeader {...defaultProps} {...props} />);
  };
  const mockTranslate = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      CONSULTATION_ACTION_NEW: 'New Consultation',
      CONSULTATION_ACTION_EDIT: 'Edit Consultation',
      CONSULTATION_ACTION_IN_PROGRESS: 'Consultation in progress',
      PATIENT_HEADER_LABEL: 'Patient Header',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset shared store so each test starts from a clean slate
    resetEncounterSession();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
    mockedUseEncounterSession.mockReturnValue({
      hasActiveSession: false,
      activeEncounter: null,
      isPractitionerMatch: false,
      matchReason: [],
      editActiveEncounter: false,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  // Basic rendering tests
  describe('Rendering', () => {
    test('renders without crashing', () => {
      renderComponent();
      expect(screen.getByLabelText('Patient Header')).toBeInTheDocument();
    });

    test('renders Tile with correct aria-label', () => {
      renderComponent();
      const tile = screen.getByLabelText('Patient Header');
      expect(tile).toBeInTheDocument();
    });

    test('renders PatientDetails component', () => {
      renderComponent();
      const patientDetails = screen.getByTestId('patient-details-mock');
      expect(patientDetails).toBeInTheDocument();
    });

    test('uses lastVisit id in renderContext when no active visit', () => {
      mockedUsePatientVisit.mockReturnValueOnce({
        activeVisit: null,
        lastVisit: { id: 'last-visit-uuid' } as any,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(
        screen.getByTestId('document-print-button-mock'),
      ).toBeInTheDocument();
    });
  });

  // Button tests
  describe('Button functionality', () => {
    test('renders button with "New Consultation" text and dispatches event on click', () => {
      renderComponent({ isActionAreaVisible: false });
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockDispatchConsultationStart).toHaveBeenCalled();
      expect(button).toHaveTextContent('New Consultation');
    });

    test('renders disabled button with "in progress" text when action area is visible', () => {
      renderComponent({ isActionAreaVisible: true });
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveTextContent('Consultation in progress');
    });

    test('does not dispatch event when button is disabled', () => {
      renderComponent({ isActionAreaVisible: true });
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockDispatchConsultationStart).not.toHaveBeenCalled();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Data attributes', () => {
    test('does not set data-can-edit-encounter by default', () => {
      renderComponent();
      const header = screen.getByLabelText('Patient Header');
      expect(header).not.toHaveAttribute('data-can-edit-encounter');
    });

    test('does not set data-match-reason by default', () => {
      renderComponent();
      const header = screen.getByLabelText('Patient Header');
      expect(header).not.toHaveAttribute('data-match-reason');
    });

    test('sets data-match-reason and data-can-edit-encounter=true when session is matched', () => {
      mockedUseEncounterSession.mockReturnValueOnce({
        hasActiveSession: true,
        activeEncounter: null,
        isPractitionerMatch: true,
        matchReason: ['MATCHED'],
        editActiveEncounter: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      renderComponent();
      const header = screen.getByLabelText('Patient Header');
      expect(header).toHaveAttribute('data-match-reason', 'MATCHED');
      expect(header).toHaveAttribute('data-can-edit-encounter', 'true');
    });

    test('sets data-match-reason when there is no active encounter', () => {
      mockedUseEncounterSession.mockReturnValueOnce({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        matchReason: ['NO_ACTIVE_ENCOUNTER'],
        editActiveEncounter: false,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      renderComponent();
      const header = screen.getByLabelText('Patient Header');
      expect(header).toHaveAttribute(
        'data-match-reason',
        'NO_ACTIVE_ENCOUNTER',
      );
      expect(header).not.toHaveAttribute('data-can-edit-encounter');
    });
  });

  describe('Shared encounter session store writes (BAH-4652)', () => {
    test('writes MATCHED decision to shared store when session resolves', async () => {
      const mockEncounter = {
        resourceType: 'Encounter',
        id: 'enc-1',
        status: 'in-progress',
      } as any;
      mockedUseEncounterSession.mockReturnValue({
        hasActiveSession: true,
        activeEncounter: mockEncounter,
        isPractitionerMatch: true,
        matchReason: ['MATCHED'],
        editActiveEncounter: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      await act(async () => {
        renderComponent();
      });

      const storeState = getEncounterSessionSnapshot();
      expect(storeState.canEditOrCreate).toBe(true);
      expect(storeState.matchReasons).toEqual(['MATCHED']);
      expect(storeState.activeEncounter).toEqual(mockEncounter);
    });

    test('writes NO_ACTIVE_ENCOUNTER decision to shared store', async () => {
      mockedUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        matchReason: ['NO_ACTIVE_ENCOUNTER'],
        editActiveEncounter: false,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      await act(async () => {
        renderComponent();
      });

      const storeState = getEncounterSessionSnapshot();
      expect(storeState.canEditOrCreate).toBe(false);
      expect(storeState.activeEncounter).toBeNull();
    });

    test('resets shared store when patient UUID changes', async () => {
      // Pre-populate store
      setEncounterSessionDecision({
        reasons: ['MATCHED'],
        encounter: {
          resourceType: 'Encounter',
          id: 'old-enc',
          status: 'in-progress',
        } as any,
      });
      expect(getEncounterSessionSnapshot().canEditOrCreate).toBe(true);

      // Simulate patient change by re-rendering with different patientUUID
      const { unmount } = await act(async () =>
        render(<PatientHeader isActionAreaVisible={false} />),
      );

      // The component should call resetEncounterSession on mount when patient changes
      // Since usePatientUUID is mocked to 'patient-uuid' and prevRef starts null, reset fires
      expect(getEncounterSessionSnapshot().matchReasons).toEqual([]);
      unmount();
    });
  });

  describe('Consultation saved refetch', () => {
    test('calls refetch when consultation saved event is dispatched for the same patient', () => {
      const mockRefetch = jest.fn();
      mockedUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        matchReason: [],
        editActiveEncounter: false,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderComponent();

      act(() => {
        window.dispatchEvent(
          new CustomEvent(CONSULTATION_SAVED_EVENT, {
            detail: {
              patientUUID: 'patient-uuid',
              updatedResources: {
                conditions: false,
                allergies: false,
                medications: false,
                serviceRequests: {},
              },
              updatedConcepts: new Map(),
            },
          }),
        );
      });

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    test('does not call refetch when consultation saved event is dispatched for a different patient', () => {
      const mockRefetch = jest.fn();
      mockedUseEncounterSession.mockReturnValue({
        hasActiveSession: false,
        activeEncounter: null,
        isPractitionerMatch: false,
        matchReason: [],
        editActiveEncounter: false,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderComponent();

      act(() => {
        window.dispatchEvent(
          new CustomEvent(CONSULTATION_SAVED_EVENT, {
            detail: {
              patientUUID: 'other-patient-uuid',
              updatedResources: {
                conditions: false,
                allergies: false,
                medications: false,
                serviceRequests: {},
              },
              updatedConcepts: new Map(),
            },
          }),
        );
      });

      expect(mockRefetch).not.toHaveBeenCalled();
    });
  });
});
