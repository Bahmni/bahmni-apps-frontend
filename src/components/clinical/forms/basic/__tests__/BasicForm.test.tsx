import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BasicForm from '../BasicForm';
import { useLocations } from '@hooks/useLocations';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
import { FhirEncounter } from '@types/encounter';
import i18n from '@/setupTests.i18n';

jest.mock('@hooks/useLocations');
jest.mock('@hooks/useEncounterConcepts');
jest.mock('@hooks/useActivePractitioner');
jest.mock('@stores/encounterDetailsStore');

// Mock the utils
jest.mock('@utils/date', () => ({
  formatDate: jest.fn(() => ({
    formattedResult: '16/05/2025',
    error: null,
  })),
}));

// Mock the Carbon components to avoid dropdown itemToString issues with invalid data
jest.mock('@carbon/react', () => {
  const actual = jest.requireActual('@carbon/react');

  // Define types for the props to avoid TypeScript errors
  interface MockDropdownProps {
    id: string;
    titleText: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemToString: (item: any) => string;
    disabled?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedItem?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange?: (event: { selectedItem: any }) => void;
  }

  return {
    ...actual,
    Dropdown: ({
      id,
      titleText,
      items,
      itemToString,
      disabled,
      selectedItem,
    }: MockDropdownProps) => {
      // A safer version that prevents edge case errors
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
          <select disabled={disabled} aria-label={titleText}>
            {selectedItem && (
              <option value="selected">{safeItemToString(selectedItem)}</option>
            )}
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              items.map((item: any, i: number) => (
                <option
                  key={i}
                  value={typeof item === 'object' && item?.uuid ? item.uuid : i}
                >
                  {safeItemToString(item)}
                </option>
              ))
            }
          </select>
        </div>
      );
    },
    Loading: ({ description }: { description: string }) => (
      <div data-testid="loading">{description}</div>
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
    setSelectedLocation: jest.fn(),
    setSelectedEncounterType: jest.fn(),
    setSelectedVisitType: jest.fn(),
    setEncounterParticipants: jest.fn(),
    setConsultationDate: jest.fn(),
    setEncounterDetailsFormReady: jest.fn(),
    reset: jest.fn(),
    getState: jest.fn(),
  };

  // Helper to create store state with form not ready
  const createMockStoreStateNotReady = () => ({
    ...mockStoreState,
    isEncounterDetailsFormReady: false,
  });

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
    (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
      mockStoreState,
    );
  });

  const renderBasicForm = (props = {}) => {
    const defaultProps = {
      activeVisit: mockActiveVisit,
    };

    return render(<BasicForm {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should match snapshot', () => {
      // Act
      const { container } = renderBasicForm();

      // Assert
      expect(container).toMatchSnapshot();
    });

    it('should render all form fields with correct data', () => {
      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
      expect(screen.getByText('Visit Type')).toBeInTheDocument();
      expect(screen.getByText('Encounter Date')).toBeInTheDocument();
      expect(screen.getByText('Participant(s)')).toBeInTheDocument();
    });

    it('should render all form fields as disabled', () => {
      // Act
      renderBasicForm();

      // Assert
      const locationDropdown = screen.getByRole('combobox', {
        name: /Location/i,
      });
      const encounterTypeDropdown = screen.getByRole('combobox', {
        name: /Encounter Type/i,
      });
      const visitTypeDropdown = screen.getByRole('combobox', {
        name: /Visit Type/i,
      });
      const datePickerInput = screen.getByLabelText(/Encounter Date/i);
      const practitionerDropdown = screen.getByRole('combobox', {
        name: 'Participant(s)',
      });

      expect(locationDropdown).toBeDisabled();
      expect(encounterTypeDropdown).toBeDisabled();
      expect(visitTypeDropdown).toBeDisabled();
      expect(datePickerInput).toBeDisabled();
      expect(practitionerDropdown).toBeDisabled();
    });

    it('should show loading state when data is being fetched', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: true,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        createMockStoreStateNotReady(),
      );

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('LOADING_FORM_DATA')).toBeInTheDocument();
    });

    it('should render all dropdowns even when no data is selected', () => {
      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('encounter-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('visit-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('practitioner-dropdown')).toBeInTheDocument();
    });
  });

  describe('Store Integration', () => {
    it('should initialize location when locations are loaded', async () => {
      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setSelectedLocation).toHaveBeenCalledWith(
          mockLocations[0],
        );
      });
    });

    it('should initialize encounter type when concepts are loaded', async () => {
      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setSelectedEncounterType).toHaveBeenCalledWith(
          mockEncounterConcepts.encounterTypes[0],
        );
      });
    });

    it('should initialize visit type based on active visit', async () => {
      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setSelectedVisitType).toHaveBeenCalledWith(
          mockEncounterConcepts.visitTypes[0],
        );
      });
    });

    it('should initialize encounter participants with current practitioner', async () => {
      // Act
      renderBasicForm();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setEncounterParticipants).toHaveBeenCalledWith([
          mockPractitioner,
        ]);
      });
    });

    it('should not re-initialize values if already set in store', () => {
      // Arrange
      const storeWithValues = {
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
      };
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        storeWithValues,
      );

      // Act
      renderBasicForm();

      // Assert
      expect(mockStoreState.setSelectedLocation).not.toHaveBeenCalled();
      expect(mockStoreState.setSelectedEncounterType).not.toHaveBeenCalled();
      expect(mockStoreState.setSelectedVisitType).not.toHaveBeenCalled();
      expect(mockStoreState.setEncounterParticipants).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading when locations are loading', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: true,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        createMockStoreStateNotReady(),
      );

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show loading when encounter concepts are loading', () => {
      // Arrange
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: true,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        createMockStoreStateNotReady(),
      );

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show loading when practitioner is loading', () => {
      // Arrange
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        user: null,
        loading: true,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
        createMockStoreStateNotReady(),
      );

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByTestId('loading')).toBeInTheDocument();
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

    it('should have appropriate ARIA attributes on all form elements', () => {
      // Act
      renderBasicForm();

      // Assert
      expect(
        screen.getByRole('combobox', { name: /Location/i }),
      ).toHaveAttribute('disabled');
      expect(
        screen.getByRole('combobox', { name: /Encounter Type/i }),
      ).toHaveAttribute('disabled');
      expect(
        screen.getByRole('combobox', { name: /Visit Type/i }),
      ).toHaveAttribute('disabled');
      expect(screen.getByLabelText(/Encounter Date/i)).toHaveAttribute(
        'disabled',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty locations array', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(mockStoreState.setSelectedLocation).not.toHaveBeenCalled();
    });

    it('should handle null encounter concepts', () => {
      // Arrange
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
      expect(mockStoreState.setSelectedEncounterType).not.toHaveBeenCalled();
    });

    it('should handle encounter without type coding', () => {
      // Arrange
      const encounterWithoutType: FhirEncounter = {
        ...mockActiveVisit,
        type: [],
      };

      // Act
      renderBasicForm({ activeVisit: encounterWithoutType });

      // Assert
      expect(mockStoreState.setSelectedVisitType).not.toHaveBeenCalled();
    });

    it('should handle missing consultation encounter type', () => {
      // Arrange
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: {
          ...mockEncounterConcepts,
          encounterTypes: [{ uuid: '999', name: 'Other Type' }],
        },
        loading: false,
        error: null,
      });

      // Act
      renderBasicForm();

      // Assert
      expect(mockStoreState.setSelectedEncounterType).not.toHaveBeenCalled();
    });

    it('should handle null practitioner', () => {
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
      expect(screen.getByText('Participant(s)')).toBeInTheDocument();
      expect(mockStoreState.setEncounterParticipants).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle location fetch error gracefully', () => {
      // Arrange
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: false,
        error: new Error('Failed to fetch locations'),
      });

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('should handle encounter concepts fetch error gracefully', () => {
      // Arrange
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
        loading: false,
        error: new Error('Failed to fetch concepts'),
      });

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
    });

    it('should handle practitioner fetch error gracefully', () => {
      // Arrange
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        user: null,
        loading: false,
        error: new Error('Failed to fetch practitioner'),
      });

      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByText('Participant(s)')).toBeInTheDocument();
    });
  });

  describe('Form Ready State Management', () => {
    it('should call setEncounterDetailsFormReady with true when all data is loaded', () => {
      // Act
      renderBasicForm();

      // Assert
      expect(mockStoreState.setEncounterDetailsFormReady).toHaveBeenCalledWith(
        true,
      );
    });

    it('should call setEncounterDetailsFormReady with false when locations are loading', () => {
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

    it('should call setEncounterDetailsFormReady with false when encounter concepts are loading', () => {
      // Arrange
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: null,
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

    it('should call setEncounterDetailsFormReady with false when practitioner is loading', () => {
      // Arrange
      (useActivePractitioner as jest.Mock).mockReturnValue({
        practitioner: null,
        user: null,
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

    it('should update form ready state when loading states change', async () => {
      // Arrange
      const { rerender } = renderBasicForm();

      // Initially all data is loaded
      expect(mockStoreState.setEncounterDetailsFormReady).toHaveBeenCalledWith(
        true,
      );

      // Clear previous calls
      mockStoreState.setEncounterDetailsFormReady.mockClear();

      // Update to loading state
      (useLocations as jest.Mock).mockReturnValue({
        locations: [],
        loading: true,
        error: null,
      });

      // Act - rerender with new loading state
      rerender(<BasicForm activeVisit={mockActiveVisit} />);

      // Assert
      await waitFor(() => {
        expect(
          mockStoreState.setEncounterDetailsFormReady,
        ).toHaveBeenCalledWith(false);
      });
    });
  });
});
