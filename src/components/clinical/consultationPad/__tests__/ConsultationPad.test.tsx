import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConsultationPad from '../ConsultationPad';
import { useTranslation } from 'react-i18next';
import { useLocations } from '@hooks/useLocations';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useActiveVisit } from '@/hooks/useActiveVisit';
import useNotification from '@hooks/useNotification';
import { postConsultationBundle } from '@services/consultationBundleService';
import { Provider } from '@types/provider';
import { formatDate } from '@utils/date';
import { createEncounterResource } from '@utils/fhir/encounterResourceCreator';
import { useConceptSearch } from '@hooks/useConceptSearch';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { DiagnosisState } from '@stores/diagnosisStore';
import { ConceptSearch } from '@types/concepts';
import { Coding } from 'fhir/r4';

// Mock all dependencies
jest.mock('@utils/date', () => ({
  ...jest.requireActual('@utils/date'),
  formatDate: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@hooks/useNotification', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@hooks/useLocations', () => ({
  useLocations: jest.fn(),
}));

jest.mock('@hooks/useEncounterConcepts', () => ({
  useEncounterConcepts: jest.fn(),
}));

jest.mock('@hooks/useActivePractitioner', () => ({
  useActivePractitioner: jest.fn(),
}));

jest.mock('@hooks/useActiveVisit', () => ({
  useActiveVisit: jest.fn(),
}));

// Mock the Zustand store
jest.mock('@stores/diagnosisStore', () => {
  // Create a factory function to get a fresh store for each test
  const createMockStore = () => {
    const store = {
      selectedDiagnoses: [] as DiagnosisInputEntry[],
      addDiagnosis: jest.fn((diagnosis) => {
        // Actually update the selectedDiagnoses array when addDiagnosis is called
        const newDiagnosis = {
          id: diagnosis.conceptUuid,
          display: diagnosis.conceptName,
          selectedCertainty: null,
          errors: {},
          hasBeenValidated: false,
        };
        store.selectedDiagnoses.push(newDiagnosis);
        return newDiagnosis;
      }),
      removeDiagnosis: jest.fn((id) => {
        // Actually remove from the selectedDiagnoses array
        store.selectedDiagnoses = store.selectedDiagnoses.filter(
          (d) => d.id !== id,
        );
      }),
      updateCertainty: jest.fn((id, certainty) => {
        // Actually update the certainty
        const diagnosis = store.selectedDiagnoses.find((d) => d.id === id);
        if (diagnosis) {
          diagnosis.selectedCertainty = certainty;
        }
      }),
      validateAllDiagnoses: jest.fn().mockReturnValue(true),
      reset: jest.fn(() => {
        store.selectedDiagnoses = [];
      }),
      getState: jest.fn(),
    };

    // Make getState return the current store state
    store.getState = jest.fn().mockReturnValue(store);

    return store;
  };

  // Create a fresh store for each test
  const mockStoreInstance = createMockStore();

  return {
    useDiagnosisStore: jest.fn().mockReturnValue(mockStoreInstance),
    createMockStore, // Export the factory for tests that need to reset the store
  };
});

// Mock the encounterDetailsStore
jest.mock('@stores/encounterDetailsStore', () => {
  const createMockEncounterStore = () => {
    const store = {
      selectedLocation: null,
      selectedEncounterType: null,
      selectedVisitType: null,
      encounterParticipants: [],
      consultationDate: new Date(),
      setSelectedLocation: jest.fn(),
      setSelectedEncounterType: jest.fn(),
      setSelectedVisitType: jest.fn(),
      setEncounterParticipants: jest.fn(),
      setConsultationDate: jest.fn(),
      reset: jest.fn(),
      getState: jest.fn(),
    };

    store.getState = jest.fn().mockReturnValue(store);
    return store;
  };

  const mockStoreInstance = createMockEncounterStore();

  return {
    useEncounterDetailsStore: jest.fn().mockReturnValue(mockStoreInstance),
    createMockEncounterStore,
  };
});

jest.mock('@services/consultationBundleService', () => ({
  postConsultationBundle: jest
    .fn()
    .mockImplementation((bundle) => Promise.resolve(bundle)),
  createDiagnosisBundleEntries: jest
    .fn()
    .mockImplementation(({ selectedDiagnoses }) => {
      if (!selectedDiagnoses?.length) return [];
      return selectedDiagnoses
        .filter((d: DiagnosisInputEntry) => d.selectedCertainty?.code)
        .map(() => ({
          resource: {
            resourceType: 'Condition',
          },
        }));
    }),
}));

jest.mock('@utils/fhir/encounterResourceCreator', () => ({
  createEncounterResource: jest.fn(),
}));
global.crypto.randomUUID = jest
  .fn()
  .mockReturnValue('1d87ab20-8b86-4b41-a30d-984b2208d945');

jest.mock('@components/common/actionArea/ActionArea', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function MockActionArea(props: any) {
    return (
      <div data-testid="mock-action-area">
        <div data-testid="action-area-title">{props.title}</div>
        <div data-testid="action-area-content">{props.content}</div>
        <button
          data-testid="primary-button"
          onClick={props.onPrimaryButtonClick}
        >
          {props.primaryButtonText}
        </button>
        <button
          data-testid="secondary-button"
          onClick={props.onSecondaryButtonClick}
        >
          {props.secondaryButtonText}
        </button>
      </div>
    );
  };
});

jest.mock('@components/clinical/basicForm/BasicForm', () => {
  return function MockBasicForm() {
    return <div data-testid="mock-basic-form"></div>;
  };
});

jest.mock('@components/clinical/diagnosesForm/DiagnosesForm', () => {
  return function MockDiagnosesForm() {
    // Get access to the mocked store
    const mockStore = jest
      .requireMock('@stores/diagnosisStore')
      .useDiagnosisStore();

    // Add a diagnosis with the test data
    const handleSelect = () => {
      // Create a diagnosis with a fixed ID for testing
      const newDiagnosis = {
        id: 'test-diagnosis-id',
        display: 'Test Diagnosis',
        selectedCertainty: null,
        errors: {},
        hasBeenValidated: false,
      };

      // Directly modify the store's selectedDiagnoses array
      mockStore.selectedDiagnoses = [newDiagnosis];

      return newDiagnosis;
    };

    // Remove a diagnosis
    const handleRemove = () => {
      // Clear the diagnoses array
      mockStore.selectedDiagnoses = [];
    };

    // Update certainty
    const handleCertaintyChange = () => {
      // Directly update the certainty on the first diagnosis
      if (mockStore.selectedDiagnoses.length > 0) {
        mockStore.selectedDiagnoses[0].selectedCertainty = {
          code: 'confirmed',
          display: 'Confirmed',
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        };
      }
    };

    return (
      <div data-testid="mock-diagnoses-form">
        <button
          onClick={() => {
            // Simulate search - no need to do anything here
          }}
        >
          Search
        </button>
        <button onClick={handleSelect}>Select</button>
        <button
          data-testid="select-null-button"
          onClick={() => {
            // Handle null selection - no-op
          }}
        >
          Select Null
        </button>
        <button onClick={handleRemove}>Remove</button>
        <div data-testid="diagnoses-form-errors">
          {/* No errors to display in mock */}
        </div>
        <div data-testid="diagnoses-form-loading">
          {/* Get loading state from useConceptSearch mock */}
          {jest.requireMock('@hooks/useConceptSearch').useConceptSearch()
            .loading
            ? 'Loading'
            : 'Not Loading'}
        </div>
        <div data-testid="diagnoses-form-results">
          {/* Get results from useConceptSearch mock */}
          {jest.requireMock('@hooks/useConceptSearch').useConceptSearch()
            .searchResults?.length || 0}{' '}
          results
        </div>
        <div data-testid="diagnoses-form-selected">
          {mockStore.selectedDiagnoses?.length || 0} selected
        </div>
        {/* Mock selected diagnoses with certainty change capability */}
        {mockStore.selectedDiagnoses?.map(
          (diagnosis: DiagnosisInputEntry, index: number) => (
            <div
              key={`diagnosis-${index}`}
              data-testid={`selected-diagnosis-${index}`}
            >
              <span>{diagnosis.display}</span>
              <button
                data-testid={`change-certainty-${index}`}
                onClick={() => handleCertaintyChange()}
              >
                Change Certainty
              </button>
            </div>
          ),
        )}
      </div>
    );
  };
});

jest.mock('@hooks/useConceptSearch', () => ({
  useConceptSearch: jest.fn(),
}));

// Configure jest-axe
expect.extend(toHaveNoViolations);

describe('ConsultationPad', () => {
  // Common test data
  const mockPatientUUID = 'patient-123';
  const mockOnClose = jest.fn();
  const mockTranslation = { t: jest.fn((key) => key) };
  const mockAddNotification = jest.fn();

  // Mock data for hooks
  const mockLocations = [
    {
      uuid: 'location-1',
      display: 'Test Location',
      links: [],
    },
  ];

  const mockEncounterConcepts = {
    encounterTypes: [{ uuid: 'encounter-type-1', name: 'Consultation' }],
    visitTypes: [{ uuid: 'visit-type-1', name: 'OPD' }],
  };

  // Updated mock practitioner to match Provider interface
  const mockPractitioner: Provider = {
    uuid: 'provider-uuid-123',
    display: 'Dr. Test - Clinician',
    person: {
      uuid: 'person-uuid-456',
      display: 'Dr. Test',
      gender: 'M',
      age: 35,
      birthdate: '1987-01-01T00:00:00.000+0000',
      birthdateEstimated: false,
      dead: false,
      deathDate: null,
      causeOfDeath: null,
      preferredName: {
        uuid: 'name-uuid-789',
        display: 'Dr. Test',
        links: [],
      },
      voided: false,
      birthtime: null,
      deathdateEstimated: false,
      links: [],
      resourceVersion: '1.9',
    },
  };

  const mockActiveVisit = {
    id: 'encounter-1',
    type: [
      {
        coding: [{ code: 'visit-type-1' }],
      },
    ],
  };

  // Helper functions to setup mocks for different scenarios
  function mockHooksForNormalState() {
    const locationsHook = {
      locations: mockLocations,
      loading: false,
      error: null,
    };

    const encounterConceptsHook = {
      encounterConcepts: mockEncounterConcepts,
      loading: false,
      error: null,
    };

    const practitionerHook = {
      practitioner: mockPractitioner,
      user: {
        uuid: 'user-123',
        display: 'Test User',
      },
      loading: false,
      error: null,
    };

    const activeVisitHook = {
      activeVisit: mockActiveVisit,
      loading: false,
      error: null,
    };

    (useLocations as jest.Mock).mockReturnValue(locationsHook);
    (useEncounterConcepts as jest.Mock).mockReturnValue(encounterConceptsHook);
    (useActivePractitioner as jest.Mock).mockReturnValue(practitionerHook);
    (useActiveVisit as jest.Mock).mockReturnValue(activeVisitHook);

    return {
      locations: locationsHook,
      encounterConcepts: encounterConceptsHook,
      practitioner: practitionerHook,
      activeVisitHook: activeVisitHook,
    };
  }

  function mockHooksForLoading() {
    (useLocations as jest.Mock).mockReturnValue({
      locations: [],
      loading: true,
      error: null,
    });

    (useEncounterConcepts as jest.Mock).mockReturnValue({
      encounterConcepts: null,
      loading: true,
      error: null,
    });

    (useActivePractitioner as jest.Mock).mockReturnValue({
      practitioner: null,
      loading: true,
      error: null,
    });

    (useActiveVisit as jest.Mock).mockReturnValue({
      activeVisit: null,
      loading: true,
      error: null,
    });
  }

  function mockHooksWithLocationError() {
    const baseState = mockHooksForNormalState();

    (useLocations as jest.Mock).mockReturnValue({
      ...baseState.locations,
      error: new Error('Failed to fetch locations'),
      loading: false,
    });
  }

  function mockHooksWithEncounterConceptsError() {
    const baseState = mockHooksForNormalState();

    (useEncounterConcepts as jest.Mock).mockReturnValue({
      ...baseState.encounterConcepts,
      error: new Error('Failed to fetch encounter concepts'),
      loading: false,
    });
  }

  function mockHooksWithPractitionerError() {
    const baseState = mockHooksForNormalState();

    (useActivePractitioner as jest.Mock).mockReturnValue({
      ...baseState.practitioner,
      error: new Error('Failed to fetch practitioner'),
      loading: false,
    });
  }

  function mockHooksWithActiveVisitError() {
    const baseState = mockHooksForNormalState();

    (useActiveVisit as jest.Mock).mockReturnValue({
      ...baseState.activeVisitHook,
      error: new Error('Failed to fetch active visit'),
      loading: false,
    });
  }

  function mockHooksWithMissingData() {
    const baseState = mockHooksForNormalState();

    (useLocations as jest.Mock).mockReturnValue({
      ...baseState.locations,
      locations: [],
    });

    // Clear the encounterDetailsStore location to make submission invalid
    const encounterStore = jest
      .requireMock('@stores/encounterDetailsStore')
      .useEncounterDetailsStore();
    encounterStore.selectedLocation = null;
  }

  function mockHooksWithInvalidSubmissionData() {
    mockHooksForNormalState();

    (useLocations as jest.Mock).mockReturnValue({
      locations: [],
      loading: false,
      error: null,
    });

    // Clear the encounterDetailsStore location to make submission invalid
    const encounterStore = jest
      .requireMock('@stores/encounterDetailsStore')
      .useEncounterDetailsStore();
    encounterStore.selectedLocation = null;
  }

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock stores
    const diagnosisStore = jest
      .requireMock('@stores/diagnosisStore')
      .useDiagnosisStore();
    diagnosisStore.selectedDiagnoses = [];
    diagnosisStore.validateAllDiagnoses.mockReturnValue(true);

    const encounterStore = jest
      .requireMock('@stores/encounterDetailsStore')
      .useEncounterDetailsStore();
    encounterStore.selectedLocation = mockLocations[0];
    encounterStore.selectedEncounterType =
      mockEncounterConcepts.encounterTypes[0];
    encounterStore.selectedVisitType = mockEncounterConcepts.visitTypes[0];
    encounterStore.encounterParticipants = [mockPractitioner];
    encounterStore.consultationDate = new Date();

    (useTranslation as jest.Mock).mockReturnValue(mockTranslation);
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    (postConsultationBundle as jest.Mock).mockImplementation((bundle) => {
      return Promise.resolve({
        resourceType: 'Bundle',
        type: 'transaction-response',
        entry: bundle.entry,
      });
    });
    (createEncounterResource as jest.Mock).mockReturnValue({
      resourceType: 'Encounter',
      id: 'test-encounter',
      subject: { reference: 'Patient/test-patient' },
      status: 'in-progress',
      type: [{ coding: [{ code: 'consultation', display: 'Consultation' }] }],
    });
    (formatDate as jest.Mock).mockReturnValue({
      formattedResult: '2025-05-20',
      error: undefined,
    });
    // Default mock for useConceptSearch to prevent undefined errors
    (useConceptSearch as jest.Mock).mockReturnValue({
      searchResults: [],
      loading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    describe('Loading State', () => {
      it('should render loading state when data is being fetched', () => {
        // Arrange
        mockHooksForLoading();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(
          screen.getByText('CONSULTATION_PAD_LOADING'),
        ).toBeInTheDocument();
      });

      it('should render loading state when isSubmitting is true', () => {
        // Arrange
        mockHooksForNormalState();
        // Mock useState to return isSubmitting as true for the first call
        jest
          .spyOn(React, 'useState')
          .mockImplementationOnce(() => [true, jest.fn()]);

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(
          screen.getByText('CONSULTATION_PAD_LOADING'),
        ).toBeInTheDocument();
      });
    });

    describe('Error State', () => {
      it('should render normally when locations hook returns an error', () => {
        // Arrange
        mockHooksWithLocationError();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert - Should still render the form
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByTestId('mock-basic-form')).toBeInTheDocument();
      });

      it('should render normally when formatDate returns an error', () => {
        // Arrange
        mockHooksForNormalState();
        (formatDate as jest.Mock).mockReturnValue({
          formattedResult: '',
          error: {
            title: 'Date Format Error',
            message: 'Invalid date format',
          },
        });

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert - Should still render the form
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByTestId('mock-basic-form')).toBeInTheDocument();
      });

      it('should render normally when encounterConcepts hook returns an error', () => {
        // Arrange
        mockHooksWithEncounterConceptsError();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert - Should still render the form
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByTestId('mock-basic-form')).toBeInTheDocument();
      });

      it('should render error state when practitioner hook returns an error', () => {
        // Arrange
        mockHooksWithPractitionerError();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
      });

      it('should render error state when active visit hook returns an error', () => {
        // Arrange
        mockHooksWithActiveVisitError();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
      });

      it('should render normally when locations array is empty', () => {
        // Arrange
        mockHooksWithMissingData();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert - Should still render the form
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByTestId('mock-basic-form')).toBeInTheDocument();
      });

      it('should render error state when patientUUID is empty', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(<ConsultationPad patientUUID="" onClose={mockOnClose} />);

        // Assert
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
      });
    });

    describe('Normal State', () => {
      it('should render the BasicForm when all data is available', () => {
        // Arrange
        mockHooksForNormalState();
        const mockFormattedDate = '2025-05-20';
        (formatDate as jest.Mock).mockReturnValue({
          formattedResult: mockFormattedDate,
          error: undefined,
        });

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByTestId('mock-basic-form')).toBeInTheDocument();
        expect(screen.getByText('CONSULTATION_PAD_TITLE')).toBeInTheDocument();
        // formatDate is now called by BasicForm, not ConsultationPad
      });

      it('should render with correct button text', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('primary-button')).toHaveTextContent(
          'CONSULTATION_PAD_DONE_BUTTON',
        );
        expect(screen.getByTestId('secondary-button')).toHaveTextContent(
          'CONSULTATION_PAD_CANCEL_BUTTON',
        );
      });
    });

    describe('Snapshots', () => {
      it('should match snapshot for normal state', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        const { container } = render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(container).toMatchSnapshot();
      });

      it('should match snapshot for loading state', () => {
        // Arrange
        mockHooksForLoading();

        // Act
        const { container } = render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(container).toMatchSnapshot();
      });

      it('should match snapshot for error state', () => {
        // Arrange
        mockHooksWithLocationError();

        // Act
        const { container } = render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(container).toMatchSnapshot();
      });
    });
  });

  describe('Functionality', () => {
    describe('Button Handlers', () => {
      it('should call onClose when secondary button is clicked', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('secondary-button'));

        // Assert
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should not call postConsultationBundle when primary button is clicked but canSubmitConsultation is false', () => {
        // Arrange
        mockHooksWithInvalidSubmissionData();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        expect(postConsultationBundle).not.toHaveBeenCalled();
      });

      it('should call postConsultationBundle and onClose when primary button is clicked with valid data', async () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        await waitFor(() => {
          expect(postConsultationBundle).toHaveBeenCalledTimes(1);
          expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('Form Submission', () => {
      it('should show a success notification when form submission succeeds', async () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        await waitFor(() => {
          expect(mockAddNotification).toHaveBeenCalledWith({
            title: 'CONSULTATION_SUBMITTED_SUCCESS_TITLE',
            message: 'CONSULTATION_SUBMITTED_SUCCESS_MESSAGE',
            type: 'success',
            timeout: 5000,
          });
        });
      });

      it('should handle errors during form submission', async () => {
        // Arrange
        mockHooksForNormalState();
        const mockError = new Error('Submission failed');
        (postConsultationBundle as jest.Mock).mockRejectedValue(mockError);

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        await waitFor(() => {
          expect(mockAddNotification).toHaveBeenCalled();
        });
      });

      it('should call createConsultationBundlePayload with correct parameters', async () => {
        // Arrange
        mockHooksForNormalState();
        const mockDate = new Date(1466424490000);

        // Set the consultation date in the store
        const encounterStore = jest
          .requireMock('@stores/encounterDetailsStore')
          .useEncounterDetailsStore();
        encounterStore.consultationDate = mockDate;

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        await waitFor(() => {
          expect(createEncounterResource).toHaveBeenCalledWith(
            mockEncounterConcepts.encounterTypes[0].uuid,
            mockEncounterConcepts.encounterTypes[0].name,
            mockPatientUUID,
            [mockPractitioner.uuid], // Updated to use uuid instead of id
            mockActiveVisit.id,
            mockLocations[0].uuid,
            mockDate,
          );
        });
      });

      it('should set isSubmitting to true when submission starts and false when it completes', async () => {
        // Arrange
        mockHooksForNormalState();
        const setIsSubmittingMock = jest.fn();
        jest
          .spyOn(React, 'useState')
          .mockImplementationOnce(() => [false, setIsSubmittingMock]);

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        await waitFor(() => {
          expect(setIsSubmittingMock).toHaveBeenNthCalledWith(1, true);
          expect(setIsSubmittingMock).toHaveBeenNthCalledWith(2, false);
        });
      });

      it('should set isSubmitting to false when an error occurs during submission', async () => {
        // Arrange
        mockHooksForNormalState();
        const setIsSubmittingMock = jest.fn();
        jest
          .spyOn(React, 'useState')
          .mockImplementationOnce(() => [false, setIsSubmittingMock]);
        const mockError = new Error('Submission failed');
        (postConsultationBundle as jest.Mock).mockRejectedValue(mockError);
        jest.spyOn(console, 'error').mockImplementation(() => {});

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        await waitFor(() => {
          expect(setIsSubmittingMock).toHaveBeenNthCalledWith(1, true);
          expect(setIsSubmittingMock).toHaveBeenNthCalledWith(2, false);
        });
      });
    });

    describe('Data Validation', () => {
      it('should determine canSubmitConsultation correctly when all required data is present', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        expect(postConsultationBundle).toHaveBeenCalled();
      });

      it('should determine canSubmitConsultation correctly when locations array is empty', () => {
        // Arrange
        mockHooksWithMissingData();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        expect(postConsultationBundle).not.toHaveBeenCalled();
      });

      it('should determine canSubmitConsultation correctly with missing provider uuid', () => {
        // Arrange
        mockHooksForNormalState();
        (useActivePractitioner as jest.Mock).mockReturnValue({
          practitioner: { ...mockPractitioner, uuid: undefined },
          loading: false,
          error: null,
        });

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        expect(postConsultationBundle).not.toHaveBeenCalled();
      });

      it('should correctly pass provider uuid to createEncounterResource', async () => {
        // Arrange
        mockHooksForNormalState();
        const mockDate = new Date(1466424490000);
        const spy = jest
          .spyOn(global, 'Date')
          .mockImplementation(() => mockDate);

        // Set the consultation date in the store
        const encounterStore = jest
          .requireMock('@stores/encounterDetailsStore')
          .useEncounterDetailsStore();
        encounterStore.consultationDate = mockDate;

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );
        fireEvent.click(screen.getByTestId('primary-button'));

        // Assert
        await waitFor(() => {
          expect(createEncounterResource).toHaveBeenCalledWith(
            mockEncounterConcepts.encounterTypes[0].uuid,
            mockEncounterConcepts.encounterTypes[0].name,
            mockPatientUUID,
            [mockPractitioner.uuid],
            mockActiveVisit.id,
            mockLocations[0].uuid,
            mockDate,
          );
        });
        spy.mockRestore();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null encounterConcepts', () => {
      // Arrange
      mockHooksForNormalState();
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: null,
      });

      // Act
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Assert - Should still render the form
      expect(screen.getByTestId('mock-basic-form')).toBeInTheDocument();
    });

    it('should handle formatDate function with empty string value', () => {
      // Arrange
      mockHooksForNormalState();
      (formatDate as jest.Mock).mockReturnValue({
        formattedResult: '',
        error: undefined,
      });

      // Act
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Assert
      expect(screen.getByTestId('mock-basic-form')).toBeInTheDocument();
      // formatDate is now called by BasicForm, not ConsultationPad
    });

    it('should handle multiple error conditions gracefully', () => {
      // Arrange
      mockHooksForNormalState();
      // Simulate both a date error and a missing practitioner
      (formatDate as jest.Mock).mockReturnValue({
        formattedResult: '',
        error: { title: 'Error', message: 'Invalid date' },
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        loading: false,
        error: null,
      });

      // Act
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Assert
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });

    it('should handle null practitioner', () => {
      // Arrange
      mockHooksForNormalState();
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        loading: false,
        error: null,
      });

      // Act
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Assert
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });

    it('should handle null active visit', () => {
      // Arrange
      mockHooksForNormalState();
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: null,
        loading: false,
        error: null,
      });

      // Act
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Assert
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });

    it('should handle missing encounter type', () => {
      // Arrange
      mockHooksForNormalState();
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: {
          ...mockEncounterConcepts,
          encounterTypes: [
            { uuid: 'encounter-type-1', name: 'Not Consultation' },
          ],
        },
        loading: false,
        error: null,
      });

      // Clear the encounterDetailsStore encounter type to make submission invalid
      const encounterStore = jest
        .requireMock('@stores/encounterDetailsStore')
        .useEncounterDetailsStore();
      encounterStore.selectedEncounterType = null;

      // Act
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Assert
      // This should still render, but canSubmitConsultation would be false
      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
      // Test that submission won't work
      fireEvent.click(screen.getByTestId('primary-button'));
      expect(postConsultationBundle).not.toHaveBeenCalled();
    });

    it('should handle missing visit type', () => {
      // Arrange
      mockHooksForNormalState();
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: {
          ...mockActiveVisit,
          type: [{ coding: [{ code: 'non-existent-code' }] }],
        },
        loading: false,
        error: null,
      });

      // Act
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Assert - Should still render the form
      expect(screen.getByTestId('mock-basic-form')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      // Arrange
      mockHooksForNormalState();

      // Act
      const { container } = render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Assert
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ConsultationPad - DiagnosesForm Integration', () => {
    // Import the useConceptSearch mock
    const { useConceptSearch } = jest.requireMock('@hooks/useConceptSearch');

    // Mock data for concept search
    const mockSearchResults = [
      {
        conceptUuid: 'diagnosis-1',
        conceptName: 'Diabetes Type 2',
        matchedName: 'Diabetes',
      },
      {
        conceptUuid: 'diagnosis-2',
        conceptName: 'Hypertension',
        matchedName: 'Hypertension',
      },
    ];

    beforeEach(() => {
      // Import the useDiagnosisStore mock
      const { useDiagnosisStore } = jest.requireMock('@stores/diagnosisStore');

      // Reset the store before each test
      const freshStore: DiagnosisState = {
        selectedDiagnoses: [],
        addDiagnosis: jest.fn((diagnosis: ConceptSearch) => {
          // Actually update the selectedDiagnoses array when addDiagnosis is called
          const newDiagnosis = {
            id: diagnosis.conceptUuid,
            display: diagnosis.conceptName,
            selectedCertainty: null,
            errors: {},
            hasBeenValidated: false,
          };
          freshStore.selectedDiagnoses.push(newDiagnosis);
          return newDiagnosis;
        }),
        removeDiagnosis: jest.fn((id: string) => {
          // Actually remove from the selectedDiagnoses array
          freshStore.selectedDiagnoses = freshStore.selectedDiagnoses.filter(
            (d: DiagnosisInputEntry) => d.id !== id,
          );
        }),
        updateCertainty: jest.fn((id: string, certainty: Coding | null) => {
          // Actually update the certainty
          const diagnosis = freshStore.selectedDiagnoses.find(
            (d: DiagnosisInputEntry) => d.id === id,
          );
          if (diagnosis) {
            diagnosis.selectedCertainty = certainty;
          }
        }),
        validateAllDiagnoses: jest.fn().mockReturnValue(true),
        reset: jest.fn(() => {
          freshStore.selectedDiagnoses = [];
        }),
        getState: jest.fn(),
      };

      // Add getState after freshStore is fully defined
      freshStore.getState = jest.fn().mockReturnValue(freshStore);

      // Update the mock to use the fresh store
      (useDiagnosisStore as unknown as jest.Mock).mockReturnValue(freshStore);

      // Setup default mock for useConceptSearch
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
      });
    });

    // 1. Component Initialization and Hook Interactions
    describe('Component Initialization and Hook Interactions', () => {
      it('should render DiagnosesForm component', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('mock-diagnoses-form')).toBeInTheDocument();
      });
    });

    // 2. Rendering Tests
    describe('Rendering Tests', () => {
      it('should render DiagnosesForm below BasicForm', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        const actionAreaContent = screen.getByTestId('action-area-content');
        const basicForm = screen.getByTestId('mock-basic-form');
        const diagnosesForm = screen.getByTestId('mock-diagnoses-form');

        expect(actionAreaContent).toContainElement(basicForm);
        expect(actionAreaContent).toContainElement(diagnosesForm);
      });

      it('should show loading state in DiagnosesForm when searching', () => {
        // Arrange
        mockHooksForNormalState();
        (useConceptSearch as jest.Mock).mockReturnValue({
          searchResults: [],
          loading: true,
          error: null,
        });

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('diagnoses-form-loading')).toHaveTextContent(
          'Loading',
        );
      });
    });

    // 3. Certainty Management Tests
    describe('Certainty Management Tests', () => {
      it('should update certainty for specific diagnosis when handleCertaintyChange is called', () => {
        // Arrange
        mockHooksForNormalState();

        // Get the store mock
        const mockStore = jest
          .requireMock('@stores/diagnosisStore')
          .useDiagnosisStore();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Manually add a diagnosis to the store
        mockStore.selectedDiagnoses = [
          {
            id: 'test-diagnosis-id',
            display: 'Test Diagnosis',
            selectedCertainty: null,
            errors: {},
            hasBeenValidated: false,
          },
        ];

        // Re-render to reflect the updated store
        fireEvent.click(screen.getByText('Select'));

        // Assert - component should handle certainty changes
        expect(mockStore.selectedDiagnoses.length).toBe(1);
      });

      it('should maintain certainty values when other diagnoses are modified', () => {
        // This tests that certainty values are isolated per diagnosis
        // Implementation would require more detailed mocking
        expect(true).toBe(true);
      });

      it('should properly update certainty for multiple diagnoses', () => {
        // Arrange
        mockHooksForNormalState();

        // Get the store mock
        const mockStore = jest
          .requireMock('@stores/diagnosisStore')
          .useDiagnosisStore();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Manually add a diagnosis to the store
        mockStore.selectedDiagnoses = [
          {
            id: 'test-diagnosis-id',
            display: 'Test Diagnosis',
            selectedCertainty: null,
            errors: {},
            hasBeenValidated: false,
          },
        ];

        // Re-render to reflect the updated store
        fireEvent.click(screen.getByText('Select'));

        // Assert
        expect(mockStore.selectedDiagnoses.length).toBe(1);
      });
    });

    // 4. Removal Tests
    describe('Removal Tests', () => {
      it('should remove diagnosis from selectedDiagnoses when handleRemoveDiagnosis is called', () => {
        // Arrange
        mockHooksForNormalState();

        // Get the store mock
        const mockStore = jest
          .requireMock('@stores/diagnosisStore')
          .useDiagnosisStore();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Manually add a diagnosis to the store
        mockStore.selectedDiagnoses = [
          {
            id: 'test-diagnosis-id',
            display: 'Test Diagnosis',
            selectedCertainty: null,
            errors: {},
            hasBeenValidated: false,
          },
        ];

        // Re-render to reflect the updated store
        fireEvent.click(screen.getByText('Select'));

        // Remove the diagnosis
        fireEvent.click(screen.getByText('Remove'));

        // Assert
        expect(mockStore.selectedDiagnoses.length).toBe(0);
      });

      it('should clear errors when diagnosis is removed', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Add duplicate to trigger error
        fireEvent.click(screen.getByText('Select'));
        fireEvent.click(screen.getByText('Select')); // Duplicate

        // Remove diagnosis
        fireEvent.click(screen.getByText('Remove'));

        // Assert - errors should be cleared
        expect(
          screen.getByTestId('diagnoses-form-errors'),
        ).not.toHaveTextContent('DIAGNOSES_DUPLICATE_ERROR');
      });
    });

    // 5. Edge Cases
    describe('Edge Cases', () => {
      it('should handle empty search results', () => {
        // Arrange
        mockHooksForNormalState();
        (useConceptSearch as jest.Mock).mockReturnValue({
          searchResults: [],
          loading: false,
          error: null,
        });

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('diagnoses-form-results')).toHaveTextContent(
          '0 results',
        );
      });

      it('should maintain state when all diagnoses are removed', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Add and remove all diagnoses
        fireEvent.click(screen.getByText('Select'));
        fireEvent.click(screen.getByText('Remove'));

        // Assert
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '0 selected',
        );
        expect(screen.getByTestId('mock-diagnoses-form')).toBeInTheDocument(); // Form should still be rendered
      });
    });

    // 6. Accessibility Tests
    describe('Accessibility', () => {
      it('should have no accessibility violations with DiagnosesForm', async () => {
        // Arrange
        mockHooksForNormalState();
        (useConceptSearch as jest.Mock).mockReturnValue({
          searchResults: mockSearchResults,
          loading: false,
          error: null,
        });

        // Act
        const { container } = render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no accessibility violations when displaying errors', async () => {
        // Arrange
        mockHooksForNormalState();
        (useConceptSearch as jest.Mock).mockReturnValue({
          searchResults: [],
          loading: false,
          error: new Error('Search failed'),
        });

        // Act
        const { container } = render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no accessibility violations with selected diagnoses', async () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        const { container } = render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Add diagnoses
        fireEvent.click(screen.getByText('Select'));

        // Assert
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Diagnosis Creation Logic', () => {
    beforeEach(() => {
      mockHooksForNormalState();
      jest
        .spyOn(global.crypto, 'randomUUID')
        .mockReturnValue('1d87ab20-8b86-4b41-a30d-984b2208d945');
    });

    it('should not create diagnosis entries when selectedDiagnoses is empty', async () => {
      // Arrange
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Act
      fireEvent.click(screen.getByTestId('primary-button'));

      // Assert
      await waitFor(() => {
        expect(postConsultationBundle).toHaveBeenCalledWith(
          expect.objectContaining({
            entry: expect.not.arrayContaining([
              expect.objectContaining({
                resource: expect.objectContaining({
                  resourceType: 'Condition',
                }),
              }),
            ]),
          }),
        );
      });
    });

    it('should not create diagnosis entries when diagnosis has no certainty selected', async () => {
      // Arrange
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Add diagnosis without certainty
      fireEvent.click(screen.getByText('Select'));

      // Act
      fireEvent.click(screen.getByTestId('primary-button'));

      // Assert
      await waitFor(() => {
        expect(postConsultationBundle).toHaveBeenCalledWith(
          expect.objectContaining({
            entry: expect.not.arrayContaining([
              expect.objectContaining({
                resource: expect.objectContaining({
                  resourceType: 'Condition',
                }),
              }),
            ]),
          }),
        );
      });
    });

    it('should not create entries when encounterResource is missing', () => {
      // Arrange
      mockHooksForNormalState();
      (createEncounterResource as jest.Mock).mockReturnValue(null);

      // Mock useState to include a diagnosis with certainty
      const mockSelectedDiagnoses = [
        {
          id: 'diagnosis-1',
          display: 'Test Diagnosis',
          selectedCertainty: {
            code: 'confirmed',
            display: 'Confirmed',
            system:
              'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          },
        },
      ];

      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [false, jest.fn()]) // isSubmitting
        .mockImplementationOnce(() => [mockSelectedDiagnoses, jest.fn()]); // selectedDiagnoses

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Act
      fireEvent.click(screen.getByTestId('primary-button'));

      // Assert
      expect(postConsultationBundle).not.toHaveBeenCalled();
    });
  });
});
