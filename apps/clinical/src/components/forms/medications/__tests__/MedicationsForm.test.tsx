import { useNotification, usePatientUUID } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Medication } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';

import useMedicationConfig from '../../../../hooks/useMedicationConfig';
import { useMedicationSearch } from '../../../../hooks/useMedicationSearch';
import { MedicationInputEntry } from '../../../../models/medication';
import { MedicationConfig } from '../../../../models/medicationConfig';
import { useMedicationStore } from '../../../../stores/medicationsStore';
import MedicationsForm from '../MedicationsForm';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('../../../../stores/medicationsStore');
jest.mock('../../../../models/medicationConfig');
jest.mock('../../../../hooks/useMedicationSearch');
jest.mock('../../../../hooks/useMedicationConfig');
jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: jest.fn(
    (medication) =>
      medication?.code?.text ?? medication?.code?.display ?? 'Test Medication',
  ),
  getActiveMedicationsFromBundle: jest.fn(() => ({
    activeMedications: [],
    medicationMap: {},
  })),
}));

// Mock @bahmni/widgets hooks
jest.mock('@bahmni/widgets', () => {
  const widgets = jest.requireActual('@bahmni/widgets');
  return {
    ...widgets,
    useNotification: jest.fn(),
    usePatientUUID: jest.fn(),
  };
});

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

// Mock CSS modules
jest.mock('../styles/MedicationsForm.module.scss', () => ({
  medicationsFormTile: 'medicationsFormTile',
  medicationsFormTitle: 'medicationsFormTitle',
  medicationsBox: 'medicationsBox',
  duplicateNotification: 'duplicateNotification',
}));

const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<
  typeof useQueryClient
>;

// Mock data
const mockMedication: Medication = {
  id: 'test-medication-1',
  resourceType: 'Medication',
  code: {
    text: 'Paracetamol 500mg',
    coding: [
      {
        code: 'paracetamol-500',
        display: 'Paracetamol 500mg',
        system: 'http://snomed.info/sct',
      },
    ],
  },
};

const mockMedicationConfig: MedicationConfig = {
  doseUnits: [
    { uuid: 'mg-uuid', name: 'mg' },
    { uuid: 'ml-uuid', name: 'ml' },
  ],
  routes: [
    { uuid: 'oral-uuid', name: 'Oral' },
    { uuid: 'iv-uuid', name: 'IV' },
  ],
  frequencies: [
    { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
    { uuid: 'tds-uuid', name: 'TDS', frequencyPerDay: 3 },
  ],
  durationUnits: [
    { uuid: 'days-uuid', name: 'Days' },
    { uuid: 'weeks-uuid', name: 'Weeks' },
  ],
  dosingInstructions: [
    { uuid: 'before-food-uuid', name: 'Before Food' },
    { uuid: 'after-food-uuid', name: 'After Food' },
  ],
  dispensingUnits: [],
  dosingRules: [],
  orderAttributes: [],
};

const mockSelectedMedication: MedicationInputEntry = {
  id: mockMedication.id!,
  display: 'Paracetamol 500mg',
  medication: mockMedication,
  dosage: 1,
  dosageUnit: null,
  frequency: null,
  route: null,
  duration: 5,
  durationUnit: null,
  isSTAT: false,
  isPRN: false,
  startDate: new Date(),
  instruction: null,
  errors: {},
  hasBeenValidated: false,
  dispenseQuantity: 10,
  dispenseUnit: null,
};

const mockStore = {
  selectedMedications: [],
  addMedication: jest.fn(),
  removeMedication: jest.fn(),
  updateDosage: jest.fn(),
  updateDosageUnit: jest.fn(),
  updateFrequency: jest.fn(),
  updateRoute: jest.fn(),
  updateDuration: jest.fn(),
  updateDurationUnit: jest.fn(),
  updateInstruction: jest.fn(),
  updateisPRN: jest.fn(),
  updateisSTAT: jest.fn(),
  updateDispenseQuantity: jest.fn(),
  updateDispenseUnit: jest.fn(),
  updateStartDate: jest.fn(),
  updateNote: jest.fn(),
  validateAllMedications: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(),
};

const mockMedicationConfigHook = {
  medicationConfig: mockMedicationConfig,
  loading: false,
  error: null,
};

const mockMedicationSearchHook = {
  searchResults: [],
  loading: false,
  error: null,
};

describe('MedicationsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    (useMedicationStore as unknown as jest.Mock).mockReturnValue(mockStore);
    (useMedicationConfig as jest.Mock).mockReturnValue(
      mockMedicationConfigHook,
    );
    (useMedicationSearch as jest.Mock).mockReturnValue(
      mockMedicationSearchHook,
    );

    // Mock @bahmni/widgets hooks
    mockUseNotification.mockReturnValue({
      addNotification: jest.fn(),
    } as ReturnType<typeof useNotification>);
    mockUsePatientUUID.mockReturnValue('patient-uuid-123');

    // Mock TanStack Query for existing medications
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>);

    // Mock TanStack Query client
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    } as unknown as ReturnType<typeof useQueryClient>);
  });

  // HAPPY PATH TESTS
  describe('Happy Path Scenarios', () => {
    test('renders medication search box correctly', () => {
      render(<MedicationsForm />);

      expect(
        screen.getByRole('combobox', { name: /search to add medication/i }),
      ).toBeInTheDocument();
    });

    test('renders form title correctly', () => {
      render(<MedicationsForm />);

      expect(screen.getByText(/prescribe medication/i)).toBeInTheDocument();
    });

    test('adds medication when selected from search', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      await user.type(searchBox, 'paracetamol');

      // Wait for search results to appear
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Click on the medication
      await user.click(screen.getByText('Paracetamol 500mg'));

      // Verify the store was called correctly
      await waitFor(() => {
        expect(mockStore.addMedication).toHaveBeenCalledWith(
          mockMedication,
          'Paracetamol 500mg',
        );
      });
    });

    test('clears search term after selecting medication', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      await user.type(searchBox, 'paracetamol');

      // Wait for search results to appear
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Click on the medication
      await user.click(screen.getByText('Paracetamol 500mg'));

      // Verify search box is cleared
      await waitFor(() => {
        expect(searchBox).toHaveValue('');
      });
    });

    test('resets ComboBox selectedItem to null after selection to allow immediate re-search', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });
      render(<MedicationsForm />);
      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await user.type(searchBox, 'paracetamol');
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Paracetamol 500mg'));
      await waitFor(() => {
        expect(searchBox).toHaveValue('');
      });
    });

    test('prevents unnecessary API call when selecting medication item', async () => {
      const user = userEvent.setup();
      const mockSearchHook = jest.fn();

      // Mock the search hook to track calls
      (useMedicationSearch as jest.Mock).mockImplementation((searchTerm) => {
        mockSearchHook(searchTerm);
        return {
          ...mockMedicationSearchHook,
          searchResults: searchTerm ? [mockMedication] : [],
        };
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Clear any initial calls
      mockSearchHook.mockClear();

      // Type to trigger search
      await user.type(searchBox, 'paracetamol');

      // Verify search was called with the typed term
      expect(mockSearchHook).toHaveBeenCalledWith('paracetamol');

      // Wait for search results to appear
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Clear the mock to track calls during selection
      mockSearchHook.mockClear();

      // Select the medication
      await user.click(screen.getByText('Paracetamol 500mg'));

      // Verify the medication was added
      await waitFor(() => {
        expect(mockStore.addMedication).toHaveBeenCalledWith(
          mockMedication,
          'Paracetamol 500mg',
        );
      });

      // Wait a bit to ensure any potential delayed calls would have happened
      await waitFor(() => {}, { timeout: 200 });

      // Verify that the search term was cleared after selection
      // The ComboBox may call onInputChange during selection, but the search term
      // should be cleared to empty string by setSearchMedicationTerm('')
      const searchCallsAfterSelection = mockSearchHook.mock.calls;
      const emptySearchCalls = searchCallsAfterSelection.filter(
        (call) => call[0] === '',
      );

      // Should have at least one call to clear the search term
      expect(emptySearchCalls.length).toBeGreaterThan(0);
    });

    test('displays selected medications with medication config', () => {
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      render(<MedicationsForm />);

      expect(screen.getByText(/added medicines/i)).toBeInTheDocument();
      expect(screen.getByText(/Paracetamol 500mg/)).toBeInTheDocument();
    });

    test('removes medication when close button is clicked', async () => {
      const user = userEvent.setup();
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      render(<MedicationsForm />);

      // Find the close button by its aria-label from SelectedItem component
      const closeButton = screen.getByRole('button', {
        name: /close/i,
      });
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockStore.removeMedication).toHaveBeenCalledWith(
          mockSelectedMedication.id,
        );
      });
    });

    test('does not show selected medications section when no medications selected', () => {
      render(<MedicationsForm />);

      expect(screen.queryByText(/added medicines/i)).not.toBeInTheDocument();
    });
  });

  // SAD PATH TESTS
  describe('Sad Path Scenarios', () => {
    test('shows loading state while searching medications', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        loading: true,
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await user.type(searchBox, 'test');

      await waitFor(() => {
        expect(screen.getByText('Loading medications...')).toBeInTheDocument();
      });
    });

    test('shows error when medication search fails', async () => {
      const user = userEvent.setup();
      const error = new Error('Search failed');
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        error,
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await user.type(searchBox, 'test');

      await waitFor(() => {
        expect(
          screen.getByText(/error searching medications/i),
        ).toBeInTheDocument();
      });
    });

    test('shows message when no search results found', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [],
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      await user.type(searchBox, 'nonexistent');

      await waitFor(() => {
        expect(
          screen.getByText(/no matching medications found/i),
        ).toBeInTheDocument();
      });
    });

    test('prevents adding duplicate medications', () => {
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      render(<MedicationsForm />);

      // Should show the selected medication in the added medicines section
      expect(screen.getByText(/added medicines/i)).toBeInTheDocument();
      expect(screen.getByText(/Paracetamol 500mg/)).toBeInTheDocument();
    });

    test('shows already selected text for medications in the selected list', async () => {
      const user = userEvent.setup();
      const secondMedication: Medication = {
        id: 'test-medication-2',
        resourceType: 'Medication',
        code: {
          text: 'Ibuprofen 400mg',
          coding: [
            {
              code: 'ibuprofen-400',
              display: 'Ibuprofen 400mg',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      // Mock search results with both medications
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication, secondMedication],
      });

      // Mock store with one medication already selected
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Type in search box to trigger search results
      await user.type(searchBox, 'med');

      // Wait for search results to appear
      await waitFor(() => {
        // The already selected medication should show with "already selected" text
        expect(
          screen.getByText('Paracetamol 500mg (Already added)'),
        ).toBeInTheDocument();

        // The non-selected medication should show normally
        expect(screen.getByText('Ibuprofen 400mg')).toBeInTheDocument();
      });

      // Verify that the already selected medication option is disabled
      const options = screen.getAllByRole('option');
      const paracetamolOption = options.find((option) =>
        option.textContent?.includes('Paracetamol 500mg (Already added)'),
      );
      expect(paracetamolOption).toHaveAttribute('disabled');
    });

    test('does not add medication when selected item is invalid', async () => {
      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Test with undefined selectedItem
      fireEvent.change(searchBox, {
        target: { value: 'test' },
        selectedItem: undefined,
      });
      expect(mockStore.addMedication).not.toHaveBeenCalled();

      // Test with null selectedItem
      fireEvent.change(searchBox, {
        target: { value: 'test' },
        selectedItem: null,
      });
      expect(mockStore.addMedication).not.toHaveBeenCalled();
    });

    test('shows loading skeleton when medication config is loading', () => {
      (useMedicationConfig as jest.Mock).mockReturnValue({
        ...mockMedicationConfigHook,
        loading: true,
      });

      render(<MedicationsForm />);

      // Should show loading skeleton (look for skeleton class)
      expect(document.querySelector('.cds--skeleton')).toBeInTheDocument();
    });

    test('shows error when medication config fails to load', () => {
      const error = new Error('Failed to load medication config');
      (useMedicationConfig as jest.Mock).mockReturnValue({
        ...mockMedicationConfigHook,
        loading: false,
        error,
      });

      render(<MedicationsForm />);

      expect(
        screen.getByText(/Error fetching medication configuration/i),
      ).toBeInTheDocument();
    });
  });

  // EDGE CASES
  describe('Edge Cases', () => {
    test('handles missing medication config gracefully', () => {
      (useMedicationConfig as jest.Mock).mockReturnValue({
        medicationConfig: null,
        loading: false,
        error: null,
      });
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      render(<MedicationsForm />);

      // Should not show selected medications section without config
      expect(screen.queryByText(/added medicines/i)).not.toBeInTheDocument();
    });

    test('handles medication without id gracefully', async () => {
      const user = userEvent.setup();
      const medicationWithoutId = { ...mockMedication, id: undefined };
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [medicationWithoutId],
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await user.type(searchBox, 'test');

      // Should still display the medication
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });
    });
  });

  // ACCESSIBILITY TESTS
  describe('Keyboard Navigation', () => {
    test('should support keyboard navigation and selection in ComboBox', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });

      render(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Type to open dropdown
      await user.type(searchBox, 'paracetamol');

      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Navigate with arrow key and select with Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockStore.addMedication).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = render(<MedicationsForm />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // DUPLICATE NOTIFICATION TESTS
  describe('Duplicate Notification Feature', () => {
    const duplicateNotificationPattern =
      /one or more drugs you are trying to order are already active/i;

    test('shows duplicate notification when medications have overlapping dates', async () => {
      const med1: MedicationInputEntry = {
        ...mockSelectedMedication,
        id: 'med-1',
        startDate: new Date('2025-01-01'),
        duration: 10,
        durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
        medication: {
          ...mockMedication,
          code: {
            coding: [{ code: 'code1', system: 'http://snomed.info/sct' }],
          },
        },
      };

      const med2: MedicationInputEntry = {
        ...mockSelectedMedication,
        id: 'med-2',
        startDate: new Date('2025-01-05'),
        duration: 10,
        durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
        medication: {
          ...mockMedication,
          code: {
            coding: [{ code: 'code1', system: 'http://snomed.info/sct' }],
          },
        },
      };

      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [med1, med2],
      });

      render(<MedicationsForm />);

      await waitFor(() => {
        expect(
          screen.getByText(duplicateNotificationPattern),
        ).toBeInTheDocument();
      });
    });

    test('does not show duplicate notification when medications have non-overlapping dates', async () => {
      const med1: MedicationInputEntry = {
        ...mockSelectedMedication,
        id: 'med-1',
        startDate: new Date('2025-01-01'),
        duration: 5,
        durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
        medication: {
          ...mockMedication,
          code: {
            coding: [{ code: 'code1', system: 'http://snomed.info/sct' }],
          },
        },
      };

      const med2: MedicationInputEntry = {
        ...mockSelectedMedication,
        id: 'med-2',
        startDate: new Date('2025-01-10'),
        duration: 5,
        durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
        medication: {
          ...mockMedication,
          code: {
            coding: [{ code: 'code1', system: 'http://snomed.info/sct' }],
          },
        },
      };

      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [med1, med2],
      });

      render(<MedicationsForm />);

      await waitFor(() => {
        expect(
          screen.queryByText(duplicateNotificationPattern),
        ).not.toBeInTheDocument();
      });
    });

    test('does not show duplicate notification when STAT medication matches another with same code', async () => {
      const statMed: MedicationInputEntry = {
        ...mockSelectedMedication,
        id: 'stat-med',
        isSTAT: true,
        medication: {
          ...mockMedication,
          code: {
            coding: [{ code: 'code1', system: 'http://snomed.info/sct' }],
          },
        },
      };

      const regularMed: MedicationInputEntry = {
        ...mockSelectedMedication,
        id: 'regular-med',
        isSTAT: false,
        startDate: new Date('2025-01-15'),
        duration: 5,
        durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
        medication: {
          ...mockMedication,
          code: {
            coding: [{ code: 'code1', system: 'http://snomed.info/sct' }],
          },
        },
      };

      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [statMed, regularMed],
      });

      render(<MedicationsForm />);

      await waitFor(() => {
        expect(
          screen.queryByText(duplicateNotificationPattern),
        ).not.toBeInTheDocument();
      });
    });

    test('does not show duplicate notification for PRN medications with same code', async () => {
      const prnMed: MedicationInputEntry = {
        ...mockSelectedMedication,
        id: 'prn-med',
        isPRN: true,
        medication: {
          ...mockMedication,
          code: {
            coding: [{ code: 'code1', system: 'http://snomed.info/sct' }],
          },
        },
      };

      const scheduledMed: MedicationInputEntry = {
        ...mockSelectedMedication,
        id: 'scheduled-med',
        isPRN: false,
        isSTAT: false,
        startDate: new Date('2025-01-01'),
        duration: 10,
        durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
        medication: {
          ...mockMedication,
          code: {
            coding: [{ code: 'code1', system: 'http://snomed.info/sct' }],
          },
        },
      };

      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [prnMed, scheduledMed],
      });

      render(<MedicationsForm />);

      await waitFor(() => {
        expect(
          screen.queryByText(duplicateNotificationPattern),
        ).not.toBeInTheDocument();
      });
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('matches snapshot with no medications', () => {
      const { container } = render(<MedicationsForm />);
      expect(container).toMatchSnapshot();
    });

    test('matches snapshot with selected medications', () => {
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      const { container } = render(<MedicationsForm />);
      expect(container).toMatchSnapshot();
    });
  });
});
