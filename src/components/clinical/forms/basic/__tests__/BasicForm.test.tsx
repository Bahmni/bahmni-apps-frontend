import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BasicForm from '../BasicForm';
import { useLocations } from '@hooks/useLocations';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useActiveVisit } from '@hooks/useActiveVisit';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
import { FhirEncounter } from '@/types/encounter';
import i18n from '@/setupTests.i18n';

jest.mock('@hooks/useLocations');
jest.mock('@hooks/useEncounterConcepts');
jest.mock('@hooks/useActivePractitioner');
jest.mock('@hooks/useActiveVisit');
jest.mock('@stores/encounterDetailsStore');

// Mock the utils
jest.mock('@utils/date', () => ({
  formatDate: jest.fn(() => ({
    formattedResult: '16/05/2025',
    error: null,
  })),
}));

// Mock the Carbon components
jest.mock('@carbon/react', () => {
  const actual = jest.requireActual('@carbon/react');

  interface MockDropdownProps {
    id: string;
    titleText: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemToString: (item: any) => string;
    disabled?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                key={i}
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
    SkeletonPlaceholder: ({ className }: { className: string }) => (
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
  i18n.changeLanguage('en');

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

  const mockStoreState = {
    selectedLocation: null,
    selectedEncounterType: null,
    selectedVisitType: null,
    encounterParticipants: [],
    consultationDate: new Date(),
    isEncounterDetailsFormReady: true,
    activeVisit: null,
    activeVisitError: null,
    errors: {
      location: null,
      encounterType: null,
      participants: null,
      general: null,
    },
    setSelectedLocation: jest.fn(),
    setSelectedEncounterType: jest.fn(),
    setSelectedVisitType: jest.fn(),
    setEncounterParticipants: jest.fn(),
    setConsultationDate: jest.fn(),
    setEncounterDetailsFormReady: jest.fn(),
    setActiveVisit: jest.fn(),
    setActiveVisitError: jest.fn(),
    setErrors: jest.fn(),
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
    (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
      mockStoreState,
    );
  });

  const renderBasicForm = (props = {}) => {
    const defaultProps = {
      patientUUID: 'test-patient-uuid',
    };

    return render(<BasicForm {...defaultProps} {...props} />);
  };

  describe('Error Handling', () => {
    it('should handle errors without message property from hooks', async () => {
      // Arrange
      const errorWithoutMessage = { code: 500 };
      const storeWithErrors = {
        ...mockStoreState,
        errors: {
          location: errorWithoutMessage,
          encounterType: null,
          participants: null,
          general: null,
        },
      };
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: errorWithoutMessage,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithErrors,
      );

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setErrors).toHaveBeenCalledWith({
          location: errorWithoutMessage,
          encounterType: null,
          participants: null,
          general: null,
        });
      });

      // Verify error display
      const locationDropdown = screen.getByTestId('location-dropdown');
      expect(locationDropdown.querySelector('select')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Select location');
    });

    it('should handle empty error messages from hooks', async () => {
      // Arrange
      const emptyError = new Error('');
      const storeWithErrors = {
        ...mockStoreState,
        errors: {
          location: emptyError,
          encounterType: null,
          participants: null,
          general: null,
        },
      };
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: emptyError,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithErrors,
      );

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setErrors).toHaveBeenCalledWith({
          location: emptyError,
          encounterType: null,
          participants: null,
          general: null,
        });
      });

      // Verify error message is not displayed when empty
      const locationDropdown = screen.getByTestId('location-dropdown');
      expect(locationDropdown.querySelector('select')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Select location');
    });

    it('should handle null errors from hooks', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: null,
      });
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: null,
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        user: null,
        loading: false,
        error: null,
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: null,
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      expect(mockStoreState.setErrors).toHaveBeenCalledWith({
        location: null,
        encounterType: null,
        participants: null,
        general: null,
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle undefined error from hooks', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: undefined,
      });

      // Act
      renderBasicForm();

      // Assert
      expect(mockStoreState.setErrors).toHaveBeenCalledWith({
        location: undefined,
        encounterType: null,
        participants: null,
        general: null,
      });
    });

    it('should handle non-Error object errors from hooks', async () => {
      // Arrange
      const nonErrorObject = { message: 'API Error' };
      const storeWithErrors = {
        ...mockStoreState,
        errors: {
          location: nonErrorObject,
          encounterType: null,
          participants: null,
          general: null,
        },
      };
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: nonErrorObject,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithErrors,
      );

      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setErrors).toHaveBeenCalledWith({
          location: nonErrorObject,
          encounterType: null,
          participants: null,
          general: null,
        });
      });

      // Verify error display
      const locationDropdown = screen.getByTestId('location-dropdown');
      expect(locationDropdown.querySelector('select')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(screen.getByRole('alert')).toHaveTextContent('API Error');
    });

    it('should handle a mix of Error and non-Error object errors from hooks', async () => {
      // Arrange
      const locationError = new Error('Location Error');
      const encounterError = { message: 'Encounter API Error' };
      const practitionerError = new Error('Practitioner Error');
      const visitError = { message: 'Visit API Error' };

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
        expect(mockStoreState.setErrors).toHaveBeenCalledWith({
          location: locationError,
          encounterType: encounterError,
          participants: practitionerError,
          general: visitError,
        });
      });

      // Verify error messages are displayed
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(4);
      const alertTexts = alerts.map((alert) => alert.textContent);
      expect(alertTexts).toContain('Location Error');
      expect(alertTexts).toContain('Encounter API Error');
      expect(alertTexts).toContain('Practitioner Error');
    });

    it('should handle multiple non-Error object errors from different hooks', async () => {
      // Arrange
      const locationError = { message: 'Location API Error' };
      const encounterError = { message: 'Encounter API Error' };
      const practitionerError = { message: 'Practitioner API Error' };
      const visitError = { message: 'Visit API Error' };

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
        expect(mockStoreState.setErrors).toHaveBeenCalledWith({
          location: locationError,
          encounterType: encounterError,
          participants: practitionerError,
          general: visitError,
        });
      });

      // Verify error messages are displayed
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(4);
      const alertTexts = alerts.map((alert) => alert.textContent);
      expect(alertTexts).toContain('Location API Error');
      expect(alertTexts).toContain('Encounter API Error');
      expect(alertTexts).toContain('Practitioner API Error');
    });

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
        expect(mockStoreState.setErrors).toHaveBeenCalledWith({
          location: locationError,
          encounterType: encounterError,
          participants: practitionerError,
          general: visitError,
        });
      });
    });

    it('should show error state in dropdowns when errors exist', () => {
      // Arrange
      const storeWithErrors = {
        ...mockStoreState,
        errors: {
          location: new Error('Location error'),
          encounterType: new Error('Encounter error'),
          participants: new Error('Practitioner error'),
          general: new Error('Visit error'),
        },
      };
      (useLocations as jest.Mock).mockReturnValue({
        locations: mockLocations,
        loading: false,
        error: new Error('Location error'),
      });
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: mockEncounterConcepts,
        loading: false,
        error: new Error('Encounter error'),
      });
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: mockPractitioner,
        loading: false,
        error: new Error('Practitioner error'),
      });
      (useActiveVisit as jest.Mock).mockReturnValue({
        activeVisit: mockActiveVisit,
        loading: false,
        error: new Error('Visit error'),
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithErrors,
      );

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
        'aria-invalid',
        'true',
      );
      expect(encounterTypeDropdown.querySelector('select')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(visitTypeDropdown.querySelector('select')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(practitionerDropdown.querySelector('select')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
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

    it('should show content with error state when error exists', () => {
      // Arrange
      const locationError = new Error('Location error');
      const storeWithErrors = {
        ...mockStoreState,
        errors: {
          location: locationError,
        },
      };
      // Ensure no loading states
      (useLocations as jest.Mock).mockReturnValue({
        locations: mockLocations,
        loading: false,
        error: locationError,
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
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithErrors,
      );

      // Act
      renderBasicForm();

      // Assert
      expect(
        screen.queryByTestId('skeleton-placeholder'),
      ).not.toBeInTheDocument();
      const dropdown = screen.getByTestId('location-dropdown');
      expect(dropdown.querySelector('select')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Location error');
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
      expect(skeletons).toHaveLength(6); // Both encounter type and visit type (2 each) + date field (2)
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
      expect(skeletons).toHaveLength(4); // Visit type (2) + date field (2)
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

    it('should render error messages with correct translations', () => {
      // Arrange
      const storeWithErrors = {
        ...mockStoreState,
        selectedLocation: mockLocations[0], // Need to ensure fields are not loading
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
        isEncounterDetailsFormReady: true,
        errors: {
          location: new Error('ERROR_FETCHING_LOCATIONS_DETAILS'),
          encounterType: new Error('ERROR_FETCHING_ENCOUNTER_DETAILS'),
          participants: new Error('ERROR_FETCHING_PRACTITIONERS_DETAILS'),
          general: new Error('ERROR_FETCHING_VISIT_DETAILS'),
        },
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithErrors,
      );

      // Act
      renderBasicForm();

      // Assert
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(4); // location, encounter type, visit type, and participants show errors
      const alertTexts = alerts.map((alert) => alert.textContent);
      expect(alertTexts).toContain('ERROR_FETCHING_LOCATIONS_DETAILS');
      expect(alertTexts).toContain('ERROR_FETCHING_ENCOUNTER_DETAILS');
      expect(alertTexts).toContain('ERROR_FETCHING_PRACTITIONERS_DETAILS');
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

    it('should render a divider after the form fields', () => {
      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByRole('separator')).toBeInTheDocument();
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
});
