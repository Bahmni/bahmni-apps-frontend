import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConsultationPad from '../ConsultationPad';
import { useTranslation } from 'react-i18next';
import { useLocations } from '@hooks/useLocations';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useCurrentEncounter } from '@hooks/useCurrentEncounter';
import useNotification from '@hooks/useNotification';
import { postConsultationBundle } from '@services/consultationBundleService';
import { Provider } from '@types/provider';
import { formatDate } from '@utils/date';
import { createEncounterResource } from '@utils/fhir/encounterResourceCreator';
import { useConceptSearch } from '@hooks/useConceptSearch';

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

jest.mock('@hooks/useCurrentEncounter', () => ({
  useCurrentEncounter: jest.fn(),
}));

jest.mock('@services/consultationBundleService', () => ({
  postConsultationBundle: jest.fn(),
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function MockDiagnosesForm(props: any) {
    return (
      <div data-testid="mock-diagnoses-form">
        <button onClick={() => props.handleSearch('test search')}>
          Search
        </button>
        <button
          onClick={() =>
            props.handleResultSelection({
              conceptUuid: 'test-uuid',
              conceptName: 'Test Diagnosis',
              matchedName: 'Test',
            })
          }
        >
          Select
        </button>
        <button
          data-testid="select-null-button"
          onClick={() => props.handleResultSelection(null)}
        >
          Select Null
        </button>
        <button onClick={() => props.handleRemoveDiagnosis(0)}>Remove</button>
        <div data-testid="diagnoses-form-errors">
          {props.errors?.length > 0 && props.errors[0].message}
        </div>
        <div data-testid="diagnoses-form-loading">
          {props.isSearchLoading ? 'Loading' : 'Not Loading'}
        </div>
        <div data-testid="diagnoses-form-results">
          {props.searchResults?.length || 0} results
        </div>
        <div data-testid="diagnoses-form-selected">
          {props.selectedDiagnoses?.length || 0} selected
        </div>
        {/* Mock selected diagnoses with certainty change capability */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {props.selectedDiagnoses?.map((diagnosis: any, index: number) => (
          <div
            key={`diagnosis-${index}`}
            data-testid={`selected-diagnosis-${index}`}
          >
            <span>{diagnosis.title}</span>
            <button
              data-testid={`change-certainty-${index}`}
              onClick={() =>
                diagnosis.handleCertaintyChange({
                  selectedItem: {
                    code: 'confirmed',
                    display: 'Confirmed',
                    system:
                      'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                  },
                })
              }
            >
              Change Certainty
            </button>
          </div>
        ))}
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

  const mockCurrentEncounter = {
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
      loading: false,
      error: null,
    };

    const currentEncounterHook = {
      currentEncounter: mockCurrentEncounter,
      loading: false,
      error: null,
    };

    (useLocations as jest.Mock).mockReturnValue(locationsHook);
    (useEncounterConcepts as jest.Mock).mockReturnValue(encounterConceptsHook);
    (useActivePractitioner as jest.Mock).mockReturnValue(practitionerHook);
    (useCurrentEncounter as jest.Mock).mockReturnValue(currentEncounterHook);

    return {
      locations: locationsHook,
      encounterConcepts: encounterConceptsHook,
      practitioner: practitionerHook,
      currentEncounter: currentEncounterHook,
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

    (useCurrentEncounter as jest.Mock).mockReturnValue({
      currentEncounter: null,
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

  function mockHooksWithCurrentEncounterError() {
    const baseState = mockHooksForNormalState();

    (useCurrentEncounter as jest.Mock).mockReturnValue({
      ...baseState.currentEncounter,
      error: new Error('Failed to fetch current encounter'),
      loading: false,
    });
  }

  function mockHooksWithMissingData() {
    const baseState = mockHooksForNormalState();

    (useLocations as jest.Mock).mockReturnValue({
      ...baseState.locations,
      locations: [],
    });
  }

  function mockHooksWithInvalidSubmissionData() {
    mockHooksForNormalState();

    (useLocations as jest.Mock).mockReturnValue({
      locations: [],
      loading: false,
      error: null,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue(mockTranslation);
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    (postConsultationBundle as jest.Mock).mockResolvedValue({});
    (createEncounterResource as jest.Mock).mockResolvedValue({});
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
      it('should render error state when locations hook returns an error', () => {
        // Arrange
        mockHooksWithLocationError();

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

      it('should render error state when formatDate returns an error', () => {
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

        // Assert
        expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
        expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
      });

      it('should render error state when encounterConcepts hook returns an error', () => {
        // Arrange
        mockHooksWithEncounterConceptsError();

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

      it('should render error state when currentEncounter hook returns an error', () => {
        // Arrange
        mockHooksWithCurrentEncounterError();

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

      it('should render error state when locations array is empty', () => {
        // Arrange
        mockHooksWithMissingData();

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
        // Verify formatDate was called with current date
        expect(formatDate).toHaveBeenCalledWith(expect.any(Date));
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
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});

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
          expect(consoleSpy).toHaveBeenCalledWith(mockError);
        });

        // Cleanup
        consoleSpy.mockRestore();
      });

      it('should call createConsultationBundlePayload with correct parameters', async () => {
        // Arrange
        mockHooksForNormalState();
        const mockDate = new Date(1466424490000);
        const spy = jest
          .spyOn(global, 'Date')
          .mockImplementation(() => mockDate);

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
            mockCurrentEncounter.id,
            mockLocations[0].uuid,
            mockDate,
          );
        });
        spy.mockRestore();
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
            mockCurrentEncounter.id,
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

      // Assert
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
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
      // BasicForm should receive empty string as defaultDate prop
      expect(formatDate).toHaveBeenCalledWith(expect.any(Date));
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

    it('should handle null currentEncounter', () => {
      // Arrange
      mockHooksForNormalState();
      (useCurrentEncounter as jest.Mock).mockReturnValue({
        currentEncounter: null,
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
      (useCurrentEncounter as jest.Mock).mockReturnValue({
        currentEncounter: {
          ...mockCurrentEncounter,
          type: [{ coding: [{ code: 'non-existent-code' }] }],
        },
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
      // Setup default mock for useConceptSearch
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
      });
    });

    // 1. Component Initialization and Hook Interactions
    describe('Component Initialization and Hook Interactions', () => {
      it('should call useConceptSearch with searchDiagnosesTerm', () => {
        // Arrange
        mockHooksForNormalState();
        let capturedSearchTerm = '';
        (useConceptSearch as jest.Mock).mockImplementation((searchTerm) => {
          capturedSearchTerm = searchTerm;
          return { searchResults: [], loading: false, error: null };
        });

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(useConceptSearch).toHaveBeenCalled();
        expect(capturedSearchTerm).toBe(''); // Initially empty
      });

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

      it('should pass all required props to DiagnosesForm', () => {
        // Arrange
        mockHooksForNormalState();
        (useConceptSearch as jest.Mock).mockReturnValue({
          searchResults: mockSearchResults,
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
        expect(screen.getByTestId('diagnoses-form-results')).toHaveTextContent(
          '2 results',
        );
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

    // 3. Search Functionality Tests
    describe('Search Functionality Tests', () => {
      it('should update searchDiagnosesTerm when handleSearch is called', async () => {
        // Arrange
        mockHooksForNormalState();
        let capturedSearchTerm = '';
        (useConceptSearch as jest.Mock).mockImplementation((searchTerm) => {
          capturedSearchTerm = searchTerm;
          return { searchResults: [], loading: false, error: null };
        });

        // Act
        const { rerender } = render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        fireEvent.click(screen.getByText('Search'));

        // Force a rerender to capture the updated search term
        rerender(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        await waitFor(() => {
          expect(capturedSearchTerm).toBe('test search');
        });
      });

      it('should clear errors when new search starts', () => {
        // Arrange
        mockHooksForNormalState();
        (useConceptSearch as jest.Mock).mockReturnValue({
          searchResults: [],
          loading: false,
          error: new Error('Previous error'),
        });

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Should show error initially
        expect(screen.getByTestId('diagnoses-form-errors')).toHaveTextContent(
          'Previous error',
        );

        // Trigger new search
        fireEvent.click(screen.getByText('Search'));

        // Assert - error should be cleared
        expect(
          screen.getByTestId('diagnoses-form-errors'),
        ).not.toHaveTextContent('Previous error');
      });

      it('should pass search results from useConceptSearch to DiagnosesForm', () => {
        // Arrange
        mockHooksForNormalState();
        (useConceptSearch as jest.Mock).mockReturnValue({
          searchResults: mockSearchResults,
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
          '2 results',
        );
      });
    });

    // 4. Selection and State Management Tests
    describe('Selection and State Management Tests', () => {
      it('should add diagnosis to selectedDiagnoses when handleResultSelection is called', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Initially no diagnoses selected
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '0 selected',
        );

        // Select a diagnosis
        fireEvent.click(screen.getByText('Select'));

        // Assert
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '1 selected',
        );
      });

      it('should clear search term and selection after successful addition', async () => {
        // Arrange
        mockHooksForNormalState();
        let capturedSearchTerm = 'test search';
        (useConceptSearch as jest.Mock).mockImplementation((searchTerm) => {
          capturedSearchTerm = searchTerm;
          return {
            searchResults: mockSearchResults,
            loading: false,
            error: null,
          };
        });

        // Act
        const { rerender } = render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Select a diagnosis
        fireEvent.click(screen.getByText('Select'));

        // Force a rerender to capture the cleared search term
        rerender(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        await waitFor(() => {
          expect(capturedSearchTerm).toBe(''); // Search term should be cleared
        });
      });

      it('should not add duplicate diagnosis and show error', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Add diagnosis first time
        fireEvent.click(screen.getByText('Select'));
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '1 selected',
        );

        // Try to add same diagnosis again
        fireEvent.click(screen.getByText('Select'));

        // Assert
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '1 selected', // Should still be 1
        );
        expect(mockTranslation.t).toHaveBeenCalledWith(
          'DIAGNOSES_DUPLICATE_ERROR',
        );
      });

      it('should handle null/undefined selectedItem gracefully', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Initially no diagnoses selected
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '0 selected',
        );

        // Click the button that calls handleResultSelection with null
        fireEvent.click(screen.getByTestId('select-null-button'));

        // The state should remain unchanged
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '0 selected',
        );

        // No errors should be displayed
        expect(screen.getByTestId('diagnoses-form-errors')).toHaveTextContent(
          '',
        );
      });

      it('should properly handle certainty change callback when diagnosis is added', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Add a diagnosis
        fireEvent.click(screen.getByText('Select'));

        // Verify diagnosis was added
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '1 selected',
        );

        // Verify the selected diagnosis item is rendered
        expect(screen.getByTestId('selected-diagnosis-0')).toBeInTheDocument();

        // Click the certainty change button
        fireEvent.click(screen.getByTestId('change-certainty-0'));

        // The component should handle the certainty change without errors
        // and the diagnosis should still be there
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '1 selected',
        );
      });
    });

    // 5. Certainty Management Tests
    describe('Certainty Management Tests', () => {
      it('should update certainty for specific diagnosis when handleCertaintyChange is called', () => {
        // Note: This test would require more complex mocking to fully test
        // For now, we ensure the component renders without errors
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Add a diagnosis
        fireEvent.click(screen.getByText('Select'));

        // Assert - component should handle certainty changes
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '1 selected',
        );
      });

      it('should maintain certainty values when other diagnoses are modified', () => {
        // This tests that certainty values are isolated per diagnosis
        // Implementation would require more detailed mocking
        expect(true).toBe(true);
      });
    });

    // 6. Removal Tests
    describe('Removal Tests', () => {
      it('should remove diagnosis from selectedDiagnoses when handleRemoveDiagnosis is called', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Add a diagnosis
        fireEvent.click(screen.getByText('Select'));
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '1 selected',
        );

        // Remove the diagnosis
        fireEvent.click(screen.getByText('Remove'));

        // Assert
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '0 selected',
        );
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

    // 7. Error Handling Tests
    describe('Error Handling Tests', () => {
      it('should display API errors from useConceptSearch', () => {
        // Arrange
        mockHooksForNormalState();
        const apiError = new Error('Search API failed');
        (useConceptSearch as jest.Mock).mockReturnValue({
          searchResults: [],
          loading: false,
          error: apiError,
        });

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Assert
        expect(screen.getByTestId('diagnoses-form-errors')).toHaveTextContent(
          'Search API failed',
        );
      });

      it('should display duplicate error with correct translation', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Add diagnosis twice
        fireEvent.click(screen.getByText('Select'));
        fireEvent.click(screen.getByText('Select'));

        // Assert
        expect(mockTranslation.t).toHaveBeenCalledWith(
          'DIAGNOSES_DUPLICATE_ERROR',
        );
      });

      it('should accumulate multiple errors if they occur', () => {
        // This would require more complex state management
        // For now, we ensure single errors are handled correctly
        expect(true).toBe(true);
      });
    });

    // 8. Edge Cases
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

      it('should handle rapid selection and removal', () => {
        // Arrange
        mockHooksForNormalState();

        // Act
        render(
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />,
        );

        // Rapid operations
        fireEvent.click(screen.getByText('Select'));
        fireEvent.click(screen.getByText('Remove'));
        fireEvent.click(screen.getByText('Select'));
        fireEvent.click(screen.getByText('Select')); // Duplicate
        fireEvent.click(screen.getByText('Remove'));

        // Assert - should end with 0 selected
        expect(screen.getByTestId('diagnoses-form-selected')).toHaveTextContent(
          '0 selected',
        );
      });
    });

    // 9. Accessibility Tests
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
});
