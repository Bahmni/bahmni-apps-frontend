import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConsultationPad from '../ConsultationPad';
import { useLocations } from '@hooks/useLocations';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useCurrentEncounter } from '@hooks/useCurrentEncounter';
import { Concept } from '@/types/encounterConcepts';
import { OpenMRSLocation } from '@/types/location';
import { FormattedPractitioner } from '@/types/practitioner';
import { FhirEncounter } from '@/types/encounter';
import i18n from '@/setupTests.i18n';

// Mock all hooks
jest.mock('@hooks/useLocations');
jest.mock('@hooks/useEncounterConcepts');
jest.mock('@hooks/useActivePractitioner');
jest.mock('@hooks/useCurrentEncounter');

// Mock Carbon components
jest.mock('@carbon/react', () => ({
  Column: jest.fn(({ children, className, sm, md, lg }) => (
    <div
      data-testid="carbon-column"
      className={className}
      data-sm={sm}
      data-md={md}
      data-lg={lg}
    >
      {children}
    </div>
  )),
  FlexGrid: jest.fn(({ children, fullWidth }) => (
    <div data-testid="carbon-flexgrid" data-fullwidth={fullWidth}>
      {children}
    </div>
  )),
  Loading: jest.fn(({ description, withOverlay }) => (
    <div data-testid="carbon-loading" data-withoverlay={withOverlay}>
      {description}
    </div>
  )),
}));

// Mock ActionArea component
jest.mock('@components/common/actionArea/ActionArea', () => {
  return jest.fn(
    ({
      title,
      primaryButtonText,
      onPrimaryButtonClick,
      secondaryButtonText,
      onSecondaryButtonClick,
      content,
    }) => (
      <div data-testid="action-area">
        <div data-testid="action-area-title">{title}</div>
        <button data-testid="primary-button" onClick={onPrimaryButtonClick}>
          {primaryButtonText}
        </button>
        <button data-testid="secondary-button" onClick={onSecondaryButtonClick}>
          {secondaryButtonText}
        </button>
        <div data-testid="action-area-content">{content}</div>
      </div>
    ),
  );
});

// Mock BasicForm component
jest.mock('@/components/clinical/basicForm/BasicForm', () => {
  return jest.fn((props) => (
    <div data-testid="basic-form">
      <pre data-testid="basic-form-props">{JSON.stringify(props, null, 2)}</pre>
    </div>
  ));
});

// Configure jest-axe
expect.extend(toHaveNoViolations);

describe('ConsultationPad', () => {
  // Mock data setup
  const mockPatientUUID = 'test-patient-uuid';
  const mockOnClose = jest.fn();

  // Mock hook responses (success case)
  const mockLocations: OpenMRSLocation[] = [
    {
      uuid: 'location-uuid-1',
      display: 'Test Location',
      links: [],
    },
  ];

  const mockEncounterConcepts = {
    encounterTypes: [
      { uuid: 'encounter-type-uuid-1', name: 'Consultation' } as Concept,
      { uuid: 'encounter-type-uuid-2', name: 'Other Type' } as Concept,
    ],
    visitTypes: [
      { uuid: 'visit-type-uuid-1', name: 'Visit Type 1' } as Concept,
      { uuid: 'visit-type-uuid-2', name: 'Visit Type 2' } as Concept,
    ],
  };

  const mockPractitioner: FormattedPractitioner = {
    id: 'practitioner-uuid',
    fullName: 'Dr. Test Doctor',
  };

  const mockCurrentEncounter: FhirEncounter = {
    id: 'encounter-uuid-1',
    type: [
      {
        coding: [
          {
            code: 'visit-type-uuid-1',
            display: 'Visit Type 1',
          },
        ],
      },
    ],
  } as FhirEncounter;

  beforeEach(() => {
    // Reset i18n to English
    i18n.changeLanguage('en');
    jest.clearAllMocks();

    // Default mock implementations
    (useLocations as jest.Mock).mockReturnValue({
      locations: mockLocations,
      loading: false,
      error: null,
    });

    (useEncounterConcepts as jest.Mock).mockReturnValue({
      encounterConcepts: mockEncounterConcepts,
      loading: false,
      error: null,
    });

    (useActivePractitioner as jest.Mock).mockReturnValue({
      practitioner: mockPractitioner,
      loading: false,
      error: null,
    });

    (useCurrentEncounter as jest.Mock).mockReturnValue({
      currentEncounter: mockCurrentEncounter,
      loading: false,
      error: null,
    });
  });

  describe('Rendering States', () => {
    it('should match snapshot when fully loaded', () => {
      const { container } = render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(container).toMatchSnapshot();
    });

    it('should show loading state when locations are loading', () => {
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: true,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'Loading Consultation Pad',
      );
    });

    it('should show loading state when encounter concepts are loading', () => {
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: true,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
    });

    it('should show loading state when practitioner is loading', () => {
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        loading: true,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
    });

    it('should show loading state when current encounter is loading', () => {
      (useCurrentEncounter as jest.Mock).mockReturnValue({
        currentEncounter: null,
        loading: true,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
    });

    it('should show error state when locations has error', () => {
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: new Error('Failed to load locations'),
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when encounter concepts has error', () => {
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: new Error('Failed to load encounter concepts'),
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when practitioner has error', () => {
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        loading: false,
        error: new Error('Failed to load practitioner'),
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when current encounter has error', () => {
      (useCurrentEncounter as jest.Mock).mockReturnValue({
        currentEncounter: null,
        loading: false,
        error: new Error('Failed to load current encounter'),
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Required Data Validation', () => {
    it('should show error state when practitioner is null', () => {
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        loading: false,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when patientUUID is empty', () => {
      render(<ConsultationPad patientUUID="" onClose={mockOnClose} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when encounterConcepts.encounterTypes is missing', () => {
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when encounterConcepts.visitTypes is missing', () => {
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when currentEncounter is null', () => {
      (useCurrentEncounter as jest.Mock).mockReturnValue({
        currentEncounter: null,
        loading: false,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when no matching visitTypeSelected is found', () => {
      // Modify the mock current encounter to have a code that won't match any visit type
      const modifiedEncounter = {
        ...mockCurrentEncounter,
        type: [
          {
            coding: [
              {
                code: 'non-existent-visit-type',
                display: 'Non-existent Visit Type',
              },
            ],
          },
        ],
      } as FhirEncounter;

      (useCurrentEncounter as jest.Mock).mockReturnValue({
        currentEncounter: modifiedEncounter,
        loading: false,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when no matching encounterTypeSelected is found', () => {
      // Modify the mock encounter concepts to not include a "Consultation" encounter type
      const modifiedEncounterConcepts = {
        ...mockEncounterConcepts,
        encounterTypes: [
          {
            uuid: 'encounter-type-uuid-1',
            name: 'Not Consultation',
          } as Concept,
          { uuid: 'encounter-type-uuid-2', name: 'Other Type' } as Concept,
        ],
      };

      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: modifiedEncounterConcepts,
        loading: false,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Content State and Prop Passing', () => {
    it('should render BasicForm with correct props when all data is available', () => {
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByTestId('basic-form')).toBeInTheDocument();

      const propsElement = screen.getByTestId('basic-form-props');
      const passedProps = JSON.parse(propsElement.textContent || '{}');

      // Check for expected props in BasicForm
      expect(passedProps.practitioner).toEqual(mockPractitioner);
      expect(passedProps.encounterTypes).toEqual(
        mockEncounterConcepts.encounterTypes,
      );
      expect(passedProps.encounterTypeSelected).toEqual(
        mockEncounterConcepts.encounterTypes[0],
      ); // First one is "Consultation"
      expect(passedProps.visitTypes).toEqual(mockEncounterConcepts.visitTypes);
      expect(passedProps.visitTypeSelected).toEqual(
        mockEncounterConcepts.visitTypes[0],
      ); // Should match by uuid
      expect(passedProps.location).toEqual(mockLocations[0]);
      expect(passedProps.locationSelected).toEqual(mockLocations[0]);
      expect(passedProps.defaultDate).toBeDefined();
    });
  });

  describe('Button Handlers', () => {
    it('should call onClose when primary button is clicked', () => {
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      const primaryButton = screen.getByTestId('primary-button');
      fireEvent.click(primaryButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when secondary button is clicked', () => {
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      const secondaryButton = screen.getByTestId('secondary-button');
      fireEvent.click(secondaryButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Processing', () => {
    it('should find the "Consultation" encounter type', () => {
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      const propsElement = screen.getByTestId('basic-form-props');
      const passedProps = JSON.parse(propsElement.textContent || '{}');

      expect(passedProps.encounterTypeSelected.name).toBe('Consultation');
    });

    it('should find a matching visit type by code', () => {
      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      const propsElement = screen.getByTestId('basic-form-props');
      const passedProps = JSON.parse(propsElement.textContent || '{}');

      expect(passedProps.visitTypeSelected.uuid).toBe('visit-type-uuid-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array in locations', () => {
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle null encounterConcepts', () => {
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: null,
      });

      render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
