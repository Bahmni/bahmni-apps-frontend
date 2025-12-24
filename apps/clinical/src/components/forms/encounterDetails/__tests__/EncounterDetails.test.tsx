import { usePatientUUID, useActivePractitioner } from '@bahmni/widgets';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { useActiveVisit } from '../../../../hooks/useActiveVisit';
import { useEncounterConcepts } from '../../../../hooks/useEncounterConcepts';
import { useLocations } from '../../../../hooks/useLocations';
import { FhirEncounter } from '../../../../models/encounter';
import { useEncounterDetailsStore } from '../../../../stores/encounterDetailsStore';
import BasicForm from '../EncounterDetails';

jest.mock('../../../../hooks/useLocations');
jest.mock('../../../../hooks/useEncounterConcepts');
jest.mock('../../../../hooks/useActiveVisit');
jest.mock('../../../../stores/encounterDetailsStore');

jest.mock('@bahmni/widgets');

// Mock the utils
jest.mock('@bahmni/services', () => ({
  formatDate: jest.fn(() => ({
    formattedResult: '16/05/2025',
    error: null,
  })),
  useTranslation: () => ({
    t: (key: string) => {
      switch (key) {
        case 'LOCATION':
          return 'Location';
        case 'ENCOUNTER_TYPE':
          return 'Encounter Type';
        case 'VISIT_TYPE':
          return 'Visit Type';
        case 'PARTICIPANT':
          return 'Participant(s)';
        case 'ENCOUNTER_DATE':
          return 'Encounter Date';
        default:
          return key;
      }
    },
  }),
}));

// Mock the Carbon components
jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@carbon/react');

  interface MockDropdownProps {
    id: string;
    titleText: string;

    items: Array<any>;

    itemToString: (item: any) => string;
    disabled?: boolean;

    initialSelectedItem?: any;
    invalid?: boolean;
    invalidText?: string;
  }

  return {
    ...actual,
    Dropdown: ({
      id,
      titleText,
      items,
      itemToString,
      disabled,
      initialSelectedItem,
      invalid,
      invalidText,
    }: MockDropdownProps) => {
      const safeItemToString = (item: any): string => {
        try {
          return itemToString(item);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          return '';
        }
      };

      return (
        <div data-testid={id}>
          <div>{titleText}</div>
          <select
            disabled={disabled}
            aria-label={titleText}
            aria-invalid={invalid}
            aria-errormessage={invalid ? `${id}-error` : undefined}
          >
            {initialSelectedItem && (
              <option value="selected">
                {safeItemToString(initialSelectedItem)}
              </option>
            )}
            {items.map((item, i) => (
              <option
                key={
                  typeof item === 'object' && item?.uuid
                    ? item.uuid
                    : `item-${i}`
                }
                value={typeof item === 'object' && item?.uuid ? item.uuid : i}
              >
                {safeItemToString(item)}
              </option>
            ))}
          </select>
          {invalid && invalidText && (
            <div id={`${id}-error`} role="alert">
              {invalidText}
            </div>
          )}
        </div>
      );
    },
    SkeletonText: ({ className }: { className: string }) => (
      <div className={className} data-testid="skeleton-placeholder" />
    ),
    MenuItemDivider: () => <hr />,
    Grid: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="grid">{children}</div>
    ),
    Column: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="column">{children}</div>
    ),
    DatePicker: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="date-picker">{children}</div>
    ),
    DatePickerInput: ({
      id,
      placeholder,
      labelText,
      disabled,
    }: {
      id: string;
      placeholder: string;
      labelText: string;
      disabled: boolean;
    }) => (
      <input
        id={id}
        placeholder={placeholder}
        aria-label={labelText}
        disabled={disabled}
        data-testid="date-picker-input"
      />
    ),
  };
});

// Configure jest-axe
expect.extend(toHaveNoViolations);

describe('BasicForm', () => {
  // Common setup
  const mockLocations = [
    {
      uuid: '123',
      display: 'Location 1',
      links: [],
    },
  ];

  const mockEncounterConcepts = {
    encounterTypes: [
      { uuid: '789', name: 'Consultation' },
      { uuid: '012', name: 'Encounter Type 2' },
    ],
    visitTypes: [
      { uuid: '345', name: 'Visit Type 1' },
      { uuid: '678', name: 'Visit Type 2' },
    ],
    orderTypes: [],
    conceptData: [],
  };

  const mockPractitioner = {
    uuid: 'provider-uuid-123',
    display: 'Dr. Smith - Clinician',
    person: {
      uuid: 'person-uuid-456',
      display: 'Dr. John Smith',
      gender: 'M',
      age: 35,
      birthdate: '1987-01-01T00:00:00.000+0000',
      birthdateEstimated: false,
      dead: false,
      deathDate: null,
      causeOfDeath: null,
      preferredName: {
        uuid: 'name-uuid-789',
        display: 'Dr. John Smith',
        links: [],
      },
      voided: false,
      birthtime: null,
      deathdateEstimated: false,
      links: [],
      resourceVersion: '1.9',
    },
  };

  const mockActiveVisit: FhirEncounter = {
    resourceType: 'Encounter',
    id: 'encounter-1',
    status: 'in-progress',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
    },
    type: [
      {
        coding: [
          {
            code: '345',
            system: '',
            display: '',
          },
        ],
      },
    ],
    meta: {
      versionId: '',
      lastUpdated: '',
      tag: [],
    },
    subject: {
      reference: '',
      type: '',
      display: '',
    },
    period: {
      start: '2025-05-16T00:00:00.000Z',
    },
    location: [],
  };

  const mockUser = {
    uuid: 'user-uuid-123',
    username: 'admin',
  };

  const mockStoreState = {
    selectedLocation: null,
    selectedEncounterType: null,
    selectedVisitType: null,
    encounterParticipants: [],
    consultationDate: new Date(),
    isEncounterDetailsFormReady: true,
    activeVisit: null,
    activeVisitError: null,
    practitioner: null,
    user: null,
    patientUUID: null,
    hasError: false,
    setSelectedLocation: jest.fn(),
    setSelectedEncounterType: jest.fn(),
    setSelectedVisitType: jest.fn(),
    setEncounterParticipants: jest.fn(),
    setConsultationDate: jest.fn(),
    setEncounterDetailsFormReady: jest.fn(),
    setActiveVisit: jest.fn(),
    setActiveVisitError: jest.fn(),
    setPractitioner: jest.fn(),
    setUser: jest.fn(),
    setPatientUUID: jest.fn(),
    setIsError: jest.fn(),
    reset: jest.fn(),
    getState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
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
      user: null,
      loading: false,
      error: null,
    });
    (useActiveVisit as jest.Mock).mockReturnValue({
      activeVisit: mockActiveVisit,
      loading: false,
      error: null,
    });
    (usePatientUUID as jest.Mock).mockReturnValue('test-patient-uuid');
    (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
      mockStoreState,
    );
  });

  const renderBasicForm = () => {
    return render(<BasicForm />);
  };

  describe('usePatientUUID Hook Integration', () => {
    it('should call useActiveVisit with patient UUID from hook', () => {
      // Arrange
      const testPatientUUID = 'test-patient-123';
      (usePatientUUID as jest.Mock).mockReturnValue(testPatientUUID);

      // Act
      renderBasicForm();

      // Assert
      expect(useActiveVisit).toHaveBeenCalledWith(testPatientUUID);
    });

    it('should call useActiveVisit with null when usePatientUUID returns null', () => {
      // Arrange
      (usePatientUUID as jest.Mock).mockReturnValue(null);

      // Act
      renderBasicForm();

      // Assert
      expect(useActiveVisit).toHaveBeenCalledWith(null);
    });

    it('should handle null patientUUID gracefully', () => {
      // Arrange
      (usePatientUUID as jest.Mock).mockReturnValue(null);
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: null,
        loading: false,
        error: new Error('ERROR_INVALID_PATIENT_UUID'),
      });

      // Act
      renderBasicForm();

      // Assert - Component should still render without crashing
      expect(screen.getByTestId('grid')).toBeInTheDocument();
      // The error from useActiveVisit should be handled by the normal error flow
      expect(mockStoreState.setIsError).toHaveBeenCalledWith(true);
    });
  });

  describe('Error Handling', () => {
    it('should update store errors when hooks have errors', async () => {
      // Arrange
      const locationError = new Error('Location error');
      const encounterError = new Error('Encounter error');
      const practitionerError = new Error('Practitioner error');
      const visitError = new Error('Visit error');

      const storeWithErrors = {
        ...mockStoreState,
        errors: {
          location: locationError,
          encounterType: encounterError,
          participants: practitionerError,
          general: visitError,
        },
      };

      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: locationError,
      });
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: encounterError,
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        user: null,
        loading: false,
        error: practitionerError,
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: null,
        loading: false,
        error: visitError,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithErrors,
      );

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setIsError).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('FormField Component', () => {
    it('should show placeholder when loading', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: 'null',
        loading: true,
        error: null,
      });
      // Mock other hooks to not be loading
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: 'null',
        loading: false,
        error: {},
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: 'null',
        user: 'null',
        loading: false,
        error: {},
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: 'null',
        loading: false,
        error: {},
      });

      // Act
      renderBasicForm();

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons).toHaveLength(2); // Title and body for location field
      expect(screen.queryByTestId('location-dropdown')).not.toBeInTheDocument();
    });

    it('should show content when not loading', () => {
      // Arrange - ensure no hooks are loading
      (useLocations as jest.Mock).mockReturnValue({
        locations: mockLocations,
        loading: false,
        error: {},
      });
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: mockEncounterConcepts,
        loading: false,
        error: {},
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: mockPractitioner,
        user: null,
        loading: false,
        error: {},
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: mockActiveVisit,
        loading: false,
        error: {},
      });

      // Act
      renderBasicForm();

      // Assert
      expect(
        screen.queryByTestId('skeleton-placeholder'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('encounter-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('visit-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('practitioner-dropdown')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when locations are loading', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: mockLocations,
        loading: true,
        error: null,
      }); // Mock other hooks to not be loading
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: 'null',
        loading: false,
        error: {},
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: 'null',
        user: 'null',
        loading: false,
        error: {},
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: 'null',
        loading: false,
        error: {},
      });

      // Act
      renderBasicForm();

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons).toHaveLength(2); // Title and body for location field
      expect(screen.queryByTestId('location-dropdown')).not.toBeInTheDocument();
    });

    it('should show loading state when encounter concepts are loading', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: mockLocations,
        loading: false,
        error: null,
      });
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: true,
        error: null,
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: mockPractitioner,
        user: null,
        loading: false,
        error: null,
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: mockActiveVisit,
        loading: false,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0], // Location is selected
        selectedEncounterType: null, // No encounter type selected
        selectedVisitType: null, // No visit type selected
        encounterParticipants: [mockPractitioner], // Practitioner selected
        isEncounterDetailsFormReady: false, // Form not ready
      });

      // Act
      renderBasicForm();

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons).toHaveLength(4); // Both encounter type and visit type (2 each)
      expect(
        screen.queryByTestId('encounter-type-dropdown'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('visit-type-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('should show loading state when practitioner is loading', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: mockLocations,
        loading: false,
        error: {},
      });
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: mockEncounterConcepts,
        loading: false,
        error: {},
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        user: null,
        loading: true,
        error: null,
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: mockActiveVisit,
        loading: false,
        error: {},
      });

      // Act
      renderBasicForm();

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons).toHaveLength(2); // Title and body for practitioner field
      expect(
        screen.queryByTestId('practitioner-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('should show loading state when active visit is loading', () => {
      // Arrange
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
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: null,
        loading: true,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0], // Location is selected
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0], // Encounter type selected
        selectedVisitType: null, // No visit type selected
        encounterParticipants: [mockPractitioner], // Practitioner selected
        isEncounterDetailsFormReady: false, // Form not ready due to loading
      });

      // Act
      renderBasicForm();

      // Assert
      // Visit type field should show loading, date field should show loading due to form not ready
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons).toHaveLength(2); // Visit type (2)
      expect(
        screen.queryByTestId('visit-type-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('should show loading state for all fields when everything is loading', () => {
      // Arrange
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
        user: null,
        loading: true,
        error: null,
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: null,
        loading: true,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: null,
        selectedEncounterType: null,
        selectedVisitType: null,
        encounterParticipants: [],
      });

      // Act
      renderBasicForm();

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons).toHaveLength(8); // 4 fields * 2 placeholders each
      expect(screen.queryByTestId('location-dropdown')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('encounter-type-dropdown'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('visit-type-dropdown'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('practitioner-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('should update form ready state based on loading states', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: true,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      expect(mockStoreState.setEncounterDetailsFormReady).toHaveBeenCalledWith(
        false,
      );
    });
  });

  describe('Form Field Rendering', () => {
    it('should render all dropdowns as disabled', () => {
      // Arrange - ensure all data is loaded and selected
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
      });

      // Act
      renderBasicForm();

      // Assert
      const locationDropdown = screen.getByTestId('location-dropdown');
      const encounterTypeDropdown = screen.getByTestId(
        'encounter-type-dropdown',
      );
      const visitTypeDropdown = screen.getByTestId('visit-type-dropdown');
      const practitionerDropdown = screen.getByTestId('practitioner-dropdown');
      const dateInput = screen.getByTestId('date-picker-input');

      expect(locationDropdown.querySelector('select')).toHaveAttribute(
        'disabled',
      );
      expect(encounterTypeDropdown.querySelector('select')).toHaveAttribute(
        'disabled',
      );
      expect(visitTypeDropdown.querySelector('select')).toHaveAttribute(
        'disabled',
      );
      expect(practitionerDropdown.querySelector('select')).toHaveAttribute(
        'disabled',
      );
      expect(dateInput).toHaveAttribute('disabled');
    });

    it('should render field labels with correct translations', () => {
      // Arrange - ensure all data is loaded and selected
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
      });

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
      expect(screen.getByText('Visit Type')).toBeInTheDocument();
      expect(screen.getByText('Participant(s)')).toBeInTheDocument();
      // Date picker doesn't show a visible label, only aria-label
      const dateInput = screen.getByTestId('date-picker-input');
      expect(dateInput).toHaveAttribute('aria-label', 'Encounter Date');
    });

    it('should render field placeholders with correct translations', () => {
      // Arrange - ensure all data is loaded and selected
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
      });

      // Act
      renderBasicForm();

      // Assert
      const locationDropdown = screen.getByTestId('location-dropdown');
      const encounterTypeDropdown = screen.getByTestId(
        'encounter-type-dropdown',
      );
      const visitTypeDropdown = screen.getByTestId('visit-type-dropdown');
      const practitionerDropdown = screen.getByTestId('practitioner-dropdown');

      expect(locationDropdown.querySelector('select')).toHaveAttribute(
        'aria-label',
        'Location',
      );
      expect(encounterTypeDropdown.querySelector('select')).toHaveAttribute(
        'aria-label',
        'Encounter Type',
      );
      expect(visitTypeDropdown.querySelector('select')).toHaveAttribute(
        'aria-label',
        'Visit Type',
      );
      expect(practitionerDropdown.querySelector('select')).toHaveAttribute(
        'aria-label',
        'Participant(s)',
      );
    });

    it('should render select prompts with correct translations', () => {
      // Arrange - ensure data is available but no items selected to show dropdown titles
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0], // Need location selected to show other fields
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0], // Need encounter type selected to show visit type
        selectedVisitType: mockEncounterConcepts.visitTypes[0], // Need visit type selected
        encounterParticipants: [mockPractitioner], // Need practitioner selected
        isEncounterDetailsFormReady: true, // Form ready to show date field
      });

      // Act
      renderBasicForm();

      // Assert
      // Check that dropdown titles are visible
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
      expect(screen.getByText('Visit Type')).toBeInTheDocument();
      expect(screen.getByText('Participant(s)')).toBeInTheDocument();
    });

    it('should render dropdowns with correct initial values', () => {
      // Arrange
      const storeWithValues = {
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithValues,
      );

      // Act
      renderBasicForm();

      // Assert
      // Check that the selected values appear in the dropdowns
      const locationSelect = screen
        .getByTestId('location-dropdown')
        .querySelector('select');
      const encounterSelect = screen
        .getByTestId('encounter-type-dropdown')
        .querySelector('select');
      const visitSelect = screen
        .getByTestId('visit-type-dropdown')
        .querySelector('select');
      const practitionerSelect = screen
        .getByTestId('practitioner-dropdown')
        .querySelector('select');

      expect(locationSelect).toHaveValue('selected');
      expect(encounterSelect).toHaveValue('selected');
      expect(visitSelect).toHaveValue('selected');
      expect(practitionerSelect).toHaveValue('selected');
    });

    it('should render date picker with formatted date', () => {
      // Act
      renderBasicForm();

      // Assert
      const dateInput = screen.getByTestId('date-picker-input');
      expect(dateInput).toHaveAttribute('placeholder', '16/05/2025');
    });
  });

  describe('Layout Structure', () => {
    it('should render in a grid layout', () => {
      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByTestId('grid')).toBeInTheDocument();
    });

    it('should render fields in columns', () => {
      // Act
      renderBasicForm();

      // Assert
      const columns = screen.getAllByTestId('column');
      expect(columns).toHaveLength(5); // Location, Encounter Type, Visit Type, Practitioner, Date
    });
  });

  describe('Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      // Act
      const { container } = renderBasicForm();

      // Assert
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Snapshot Tests', () => {
    it('should match snapshot when fully loaded', () => {
      // Arrange - ensure all data is loaded and selected
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
        errors: {
          location: null,
          encounterType: null,
          participants: null,
          general: null,
        },
      });

      // Act
      const { container } = renderBasicForm();

      // Assert
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot when loading', () => {
      // Arrange - simulate loading state
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
        user: null,
        loading: true,
        error: null,
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: null,
        loading: true,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: null,
        selectedEncounterType: null,
        selectedVisitType: null,
        encounterParticipants: [],
        isEncounterDetailsFormReady: false,
      });

      // Act
      const { container } = renderBasicForm();

      // Assert
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot with error states', () => {
      // Arrange - simulate error states
      const locationError = new Error('Location error');
      const encounterError = new Error('Encounter error');
      const practitionerError = new Error('Practitioner error');
      const visitError = new Error('Visit error');

      (useLocations as jest.Mock).mockReturnValue({
        locations: mockLocations,
        loading: false,
        error: locationError,
      });
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: mockEncounterConcepts,
        loading: false,
        error: encounterError,
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: mockPractitioner,
        user: null,
        loading: false,
        error: practitionerError,
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: mockActiveVisit,
        loading: false,
        error: visitError,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
        errors: {
          location: locationError,
          encounterType: encounterError,
          participants: practitionerError,
          general: visitError,
        },
      });

      // Act
      const { container } = renderBasicForm();

      // Assert
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Practitioner and User Store Integration', () => {
    it('should set practitioner in store when useActivePractitioner returns practitioner', async () => {
      // Arrange
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: mockPractitioner,
        user: mockUser,
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setPractitioner).toHaveBeenCalledWith(
          mockPractitioner,
        );
      });
    });

    it('should set user in store when useActivePractitioner returns user', async () => {
      // Arrange
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: mockPractitioner,
        user: mockUser,
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setUser).toHaveBeenCalledWith(mockUser);
      });
    });

    it('should not set practitioner in store when useActivePractitioner returns null practitioner', async () => {
      // Arrange
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        user: null,
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setPractitioner).not.toHaveBeenCalled();
      });
    });

    it('should not set user in store when useActivePractitioner returns null user', async () => {
      // Arrange
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        user: null,
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setUser).not.toHaveBeenCalled();
      });
    });
  });

  describe('Patient UUID Store Integration', () => {
    it('should set patientUUID in store when usePatientUUID returns a value', async () => {
      // Arrange
      const testPatientUUID = 'test-patient-123';
      (usePatientUUID as jest.Mock).mockReturnValue(testPatientUUID);

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setPatientUUID).toHaveBeenCalledWith(
          testPatientUUID,
        );
      });
    });

    it('should set patientUUID to null in store when usePatientUUID returns null', async () => {
      // Arrange
      (usePatientUUID as jest.Mock).mockReturnValue(null);

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setPatientUUID).toHaveBeenCalledWith(null);
      });
    });

    it('should set patientUUID to undefined in store when usePatientUUID returns undefined', async () => {
      // Arrange
      (usePatientUUID as jest.Mock).mockReturnValue(undefined);

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setPatientUUID).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Initialization Logic Branches', () => {
    describe('Default Location Initialization', () => {
      it('should set first location when locations exist and no location is selected', () => {
        // Arrange
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: null, // No location selected
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedLocation).toHaveBeenCalledWith(
          mockLocations[0],
        );
      });

      it('should not set location when locations is empty', () => {
        // Arrange
        (useLocations as jest.Mock).mockReturnValue({
          locations: [], // Empty locations
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: null,
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedLocation).not.toHaveBeenCalled();
      });

      it('should not set location when a location is already selected', () => {
        // Arrange
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0], // Location already selected
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedLocation).not.toHaveBeenCalled();
      });
    });

    describe('Default Encounter Type Initialization', () => {
      it('should set Consultation encounter type when available and no type is selected', () => {
        // Arrange
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedEncounterType: null, // No encounter type selected
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedEncounterType).toHaveBeenCalledWith(
          mockEncounterConcepts.encounterTypes[0], // Consultation type
        );
      });

      it('should not set encounter type when Consultation type is not found', () => {
        // Arrange
        const encounterConceptsWithoutConsultation = {
          ...mockEncounterConcepts,
          encounterTypes: [
            { uuid: '012', name: 'Emergency' },
            { uuid: '013', name: 'Follow-up' },
          ],
        };
        (useEncounterConcepts as jest.Mock).mockReturnValue({
          encounterConcepts: encounterConceptsWithoutConsultation,
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedEncounterType: null,
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedEncounterType).not.toHaveBeenCalled();
      });

      it('should not set encounter type when no encounter concepts are available', () => {
        // Arrange
        (useEncounterConcepts as jest.Mock).mockReturnValue({
          encounterConcepts: null,
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedEncounterType: null,
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedEncounterType).not.toHaveBeenCalled();
      });

      it('should not set encounter type when one is already selected', () => {
        // Arrange
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedEncounterType: mockEncounterConcepts.encounterTypes[1], // Already selected
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedEncounterType).not.toHaveBeenCalled();
      });
    });

    describe('Visit Type Initialization from Active Visit', () => {
      it('should set visit type when matching active visit type is found', () => {
        // Arrange
        const mockActiveVisitWithType = {
          ...mockActiveVisit,
          type: [
            {
              coding: [
                {
                  code: '345', // Matches mockEncounterConcepts.visitTypes[0].uuid
                  system: '',
                  display: '',
                },
              ],
            },
          ],
        };
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: mockActiveVisitWithType,
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedVisitType: null, // No visit type selected
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedVisitType).toHaveBeenCalledWith(
          mockEncounterConcepts.visitTypes[0],
        );
      });

      it('should not set visit type when active visit type is not found in visit types', () => {
        // Arrange
        const mockActiveVisitWithUnknownType = {
          ...mockActiveVisit,
          type: [
            {
              coding: [
                {
                  code: 'unknown-type', // Doesn't match any visit types
                  system: '',
                  display: '',
                },
              ],
            },
          ],
        };
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: mockActiveVisitWithUnknownType,
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedVisitType: null,
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedVisitType).not.toHaveBeenCalled();
      });

      it('should not set visit type when active visit has no type coding', () => {
        // Arrange
        const mockActiveVisitWithNoType = {
          ...mockActiveVisit,
          type: [
            {
              coding: [], // No coding array
            },
          ],
        };
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: mockActiveVisitWithNoType,
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedVisitType: null,
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedVisitType).not.toHaveBeenCalled();
      });

      it('should not set visit type when active visit has malformed type structure', () => {
        // Arrange
        const mockActiveVisitWithMalformedType = {
          ...mockActiveVisit,
          type: [], // Empty type array
        };
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: mockActiveVisitWithMalformedType,
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedVisitType: null,
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedVisitType).not.toHaveBeenCalled();
      });

      it('should not set visit type when no active visit exists', () => {
        // Arrange
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: null,
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedVisitType: null,
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedVisitType).not.toHaveBeenCalled();
      });

      it('should not set visit type when one is already selected', () => {
        // Arrange
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedVisitType: mockEncounterConcepts.visitTypes[0], // Already selected
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setSelectedVisitType).not.toHaveBeenCalled();
      });
    });

    describe('Practitioner Participants Initialization', () => {
      it('should set practitioner as participant when practitioner exists and no participants are set', () => {
        // Arrange
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          encounterParticipants: [], // No participants
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setEncounterParticipants).toHaveBeenCalledWith([
          mockPractitioner,
        ]);
      });

      it('should not set practitioner as participant when no practitioner exists', () => {
        // Arrange
        (useActivePractitioner as jest.Mock).mockReturnValue({
          practitioner: null,
          user: null,
          loading: false,
          error: null,
        });
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          encounterParticipants: [],
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setEncounterParticipants).not.toHaveBeenCalled();
      });

      it('should not set practitioner as participant when participants already exist', () => {
        // Arrange
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          encounterParticipants: [mockPractitioner], // Participants already exist
        });

        // Act
        renderBasicForm();

        // Assert
        expect(mockStoreState.setEncounterParticipants).not.toHaveBeenCalled();
      });
    });
  });

  describe('Memoized Values Branches', () => {
    describe('availablePractitioners', () => {
      it('should return array with practitioner when practitioner exists', () => {
        // Arrange - default setup has practitioner

        // Act
        renderBasicForm();

        // Assert
        const practitionerDropdown = screen.getByTestId(
          'practitioner-dropdown',
        );
        const options = practitionerDropdown.querySelectorAll('option');
        expect(options).toHaveLength(2); // selected + practitioner option
      });

      it('should return empty array when no practitioner exists', () => {
        // Arrange
        (useActivePractitioner as jest.Mock).mockReturnValue({
          practitioner: null,
          user: null,
          loading: false,
          error: new Error('No practitioner'), // Set error to prevent loading state
        });
        // Ensure practitioner field is not in loading state by having practitionerError
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0], // Set location to show other fields
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0], // Set encounter type
          selectedVisitType: mockEncounterConcepts.visitTypes[0], // Set visit type
          isEncounterDetailsFormReady: true, // Form is ready
        });

        // Act
        renderBasicForm();

        // Assert
        const practitionerDropdown = screen.getByTestId(
          'practitioner-dropdown',
        );
        const options = practitionerDropdown.querySelectorAll('option');
        expect(options).toHaveLength(0); // No options when no practitioner
      });
    });
  });

  describe('ItemToString Function Branches', () => {
    it('should handle location with missing display property', () => {
      // Arrange
      const locationsWithMissingDisplay = [
        {
          uuid: '123',
          // Missing display property
          links: [],
        },
      ];
      (useLocations as jest.Mock).mockReturnValue({
        locations: locationsWithMissingDisplay,
        loading: false,
        error: null,
      });
      // Ensure location dropdown is visible by setting a selected location
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: locationsWithMissingDisplay[0], // Set location to show dropdown
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
      });

      // Act
      renderBasicForm();

      // Assert - Should not crash and show empty string
      const locationDropdown = screen.getByTestId('location-dropdown');
      const selectedOption = locationDropdown.querySelector(
        'option[value="selected"]',
      );
      expect(selectedOption).toHaveTextContent('');
    });

    it('should handle concept with missing name property', () => {
      // Arrange
      const encounterConceptsWithMissingName = {
        encounterTypes: [
          {
            uuid: '789',
            // Missing name property
          },
        ],
        visitTypes: mockEncounterConcepts.visitTypes,
        orderTypes: [],
        conceptData: [],
      };
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: encounterConceptsWithMissingName,
        loading: false,
        error: null,
      });
      // Ensure encounter type dropdown is visible by setting selections
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType:
          encounterConceptsWithMissingName.encounterTypes[0], // Set encounter type to show dropdown
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
      });

      // Act
      renderBasicForm();

      // Assert - Should not crash and show empty string
      const encounterTypeDropdown = screen.getByTestId(
        'encounter-type-dropdown',
      );
      const options = encounterTypeDropdown.querySelectorAll('option');
      expect(options[1]).toHaveTextContent(''); // Second option should be empty
    });

    it('should handle practitioner with missing preferredName display', () => {
      // Arrange
      const practitionerWithMissingDisplay = {
        ...mockPractitioner,
        person: {
          ...mockPractitioner.person,
          preferredName: {
            uuid: 'name-uuid-789',
            // Missing display property
            links: [],
          },
        },
      };
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: practitionerWithMissingDisplay,
        user: null,
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert - Should not crash and show empty string
      const practitionerDropdown = screen.getByTestId('practitioner-dropdown');
      const selectedOption = practitionerDropdown.querySelector(
        'option[value="selected"]',
      );
      expect(selectedOption).toHaveTextContent('');
    });

    it('should handle practitioner with null person', () => {
      // Arrange
      const practitionerWithNullPerson = {
        ...mockPractitioner,
        person: null,
      };
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: practitionerWithNullPerson,
        user: null,
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert - Should not crash and show empty string
      const practitionerDropdown = screen.getByTestId('practitioner-dropdown');
      const selectedOption = practitionerDropdown.querySelector(
        'option[value="selected"]',
      );
      expect(selectedOption).toHaveTextContent('');
    });
  });

  describe('FormField Component Branches', () => {
    it('should render placeholder when isLoading is true', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: true, // Still loading
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: null, // No location selected
      });

      // Act
      renderBasicForm();

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(screen.queryByTestId('location-dropdown')).not.toBeInTheDocument();
    });

    it('should render children when isLoading is false', () => {
      // Arrange - ensure all fields have their non-loading conditions met
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0], // Set to prevent loading
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0], // Set to prevent loading
        selectedVisitType: mockEncounterConcepts.visitTypes[0], // Set to prevent loading
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true, // Set to prevent loading
      });

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('encounter-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('visit-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('practitioner-dropdown')).toBeInTheDocument();
      expect(
        screen.queryByTestId('skeleton-placeholder'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Ready State Logic', () => {
    describe('Happy Paths', () => {
      it('should set form as ready when all required data is loaded successfully without errors', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {
            location: null,
            encounterType: null,
            participants: null,
            general: null,
          },
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // All hooks return successful data with no loading states
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
          user: mockUser,
          loading: false,
          error: null,
        });
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: mockActiveVisit,
          loading: false,
          error: null,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(true);
        });
      });
    });

    describe('Sad Paths - Loading States', () => {
      it('should NOT set form as ready when locations are loading', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        (useLocations as jest.Mock).mockReturnValue({
          locations: [],
          loading: true, // Still loading
          error: null,
        });
        (useEncounterConcepts as jest.Mock).mockReturnValue({
          encounterConcepts: mockEncounterConcepts,
          loading: false,
          error: null,
        });
        (useActivePractitioner as jest.Mock).mockReturnValue({
          practitioner: mockPractitioner,
          user: mockUser,
          loading: false,
          error: null,
        });
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: mockActiveVisit,
          loading: false,
          error: null,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when encounter concepts are loading', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        (useLocations as jest.Mock).mockReturnValue({
          locations: mockLocations,
          loading: false,
          error: null,
        });
        (useEncounterConcepts as jest.Mock).mockReturnValue({
          encounterConcepts: null,
          loading: true, // Still loading
          error: null,
        });
        (useActivePractitioner as jest.Mock).mockReturnValue({
          practitioner: mockPractitioner,
          user: mockUser,
          loading: false,
          error: null,
        });
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: mockActiveVisit,
          loading: false,
          error: null,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when practitioner is loading', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

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
          practitioner: null,
          user: null,
          loading: true, // Still loading
          error: null,
        });
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: mockActiveVisit,
          loading: false,
          error: null,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when active visit is loading', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

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
          user: mockUser,
          loading: false,
          error: null,
        });
        (useActiveVisit as jest.Mock).mockReturnValue({
          activeVisit: null,
          loading: true, // Still loading
          error: null,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });
    });

    describe('Sad Paths - Missing Required Fields', () => {
      it('should NOT set form as ready when selectedLocation is null', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: null, // Missing location
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when selectedEncounterType is null', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: null, // Missing encounter type
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when selectedVisitType is null', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: null, // Missing visit type
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when practitioner is null', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: null, // Missing practitioner
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when user is null', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: null, // Missing user
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when activeVisit is null', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: null, // Missing active visit
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready when encounterParticipants is empty', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [], // Empty participants
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should NOT set form as ready with multiple simultaneous errors', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        const locationError = new Error('Location error');
        const encounterError = new Error('Encounter error');
        const practitionerError = new Error('Practitioner error');
        const visitError = new Error('Visit error');

        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: mockLocations[0],
          selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
          selectedVisitType: mockEncounterConcepts.visitTypes[0],
          encounterParticipants: [mockPractitioner],
          activeVisit: mockActiveVisit,
          practitioner: mockPractitioner,
          user: mockUser,
          errors: {
            location: locationError,
            encounterType: encounterError,
            participants: practitionerError,
            general: visitError,
          },
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });

      it('should NOT set form as ready with multiple missing fields', async () => {
        // Arrange
        const mockSetEncounterDetailsFormReady = jest.fn();
        (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
          ...mockStoreState,
          selectedLocation: null, // Missing
          selectedEncounterType: null, // Missing
          selectedVisitType: null, // Missing
          encounterParticipants: [], // Empty
          activeVisit: null, // Missing
          practitioner: null, // Missing
          user: null, // Missing
          errors: {},
          setEncounterDetailsFormReady: mockSetEncounterDetailsFormReady,
        });

        // Act
        renderBasicForm();

        // Assert
        await waitFor(() => {
          expect(mockSetEncounterDetailsFormReady).toHaveBeenCalledWith(false);
        });
      });
    });
  });
});
