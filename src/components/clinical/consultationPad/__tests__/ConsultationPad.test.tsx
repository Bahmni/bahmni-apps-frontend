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
      preferredAddress: null,
      attributes: [],
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
});
