import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import MedicationsForm from '../MedicationsForm';
import { useMedicationStore } from '@stores/medicationsStore';
import useMedicationConfig from '@hooks/useMedicationConfig';
import { useMedicationSearch } from '@hooks/useMedicationSearch';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Medication } from 'fhir/r4';
import { MedicationConfig } from '@types/medicationConfig';
import { MedicationInputEntry } from '@types/medication';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('@stores/medicationsStore');
jest.mock('@hooks/useMedicationConfig');
jest.mock('@hooks/useMedicationSearch');
jest.mock('@services/medicationService', () => ({
  getMedicationDisplay: jest.fn(
    (medication) =>
      medication?.code?.text || medication?.code?.display || 'Test Medication',
  ),
}));

// Mock CSS modules
jest.mock('../styles/MedicationsForm.module.scss', () => ({
  medicationsFormTile: 'medicationsFormTile',
  medicationsFormTitle: 'medicationsFormTitle',
  medicationsBox: 'medicationsBox',
}));

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

    i18n.changeLanguage('en');
  });

  // HAPPY PATH TESTS
  describe('Happy Path Scenarios', () => {
    test('renders medication search box correctly', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      expect(
        screen.getByRole('combobox', { name: /search to add medication/i }),
      ).toBeInTheDocument();
    });

    test('renders form title correctly', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      expect(screen.getByText(/prescribe medication/i)).toBeInTheDocument();
    });

    test('adds medication when selected from search', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      await waitFor(async () => {
        await user.type(searchBox, 'paracetamol');
      });

      // Wait for search results to appear
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Click on the medication
      await waitFor(async () => {
        await user.click(screen.getByText('Paracetamol 500mg'));
      });

      // Verify the store was called correctly
      await waitFor(() => {
        expect(mockStore.addMedication).toHaveBeenCalledWith(
          mockMedication,
          'Paracetamol 500mg',
        );
      });
    });

    test('displays selected medications with medication config', () => {
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      expect(screen.getByText(/added medicines/i)).toBeInTheDocument();
      expect(screen.getByText(/Paracetamol 500mg/)).toBeInTheDocument();
    });

    test('removes medication when close button is clicked', async () => {
      const user = userEvent.setup();
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      // Find the close button by its aria-label from SelectedItem component
      const closeButton = screen.getByRole('button', {
        name: /close/i,
      });
      await waitFor(async () => {
        await user.click(closeButton);
      });

      await waitFor(() => {
        expect(mockStore.removeMedication).toHaveBeenCalledWith(
          mockSelectedMedication.id,
        );
      });
    });

    test('does not show selected medications section when no medications selected', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

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

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await waitFor(async () => {
        await user.type(searchBox, 'test');
      });

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

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await waitFor(async () => {
        await user.type(searchBox, 'test');
      });

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

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      await waitFor(async () => {
        await user.type(searchBox, 'nonexistent');
      });

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

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

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

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Type in search box to trigger search results
      await waitFor(async () => {
        await user.type(searchBox, 'med');
      });

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
      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Test with undefined selectedItem
      await waitFor(() => {
        fireEvent.change(searchBox, {
          target: { value: 'test' },
          selectedItem: undefined,
        });
      });
      expect(mockStore.addMedication).not.toHaveBeenCalled();

      // Test with null selectedItem
      await waitFor(() => {
        fireEvent.change(searchBox, {
          target: { value: 'test' },
          selectedItem: null,
        });
      });
      expect(mockStore.addMedication).not.toHaveBeenCalled();
    });

    test('shows loading skeleton when medication config is loading', () => {
      (useMedicationConfig as jest.Mock).mockReturnValue({
        ...mockMedicationConfigHook,
        loading: true,
      });

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

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

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

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

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

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

      render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await waitFor(async () => {
        await user.type(searchBox, 'test');
      });

      // Should still display the medication
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('matches snapshot with no medications', () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );
      expect(container).toMatchSnapshot();
    });

    test('matches snapshot with selected medications', () => {
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <MedicationsForm />
        </I18nextProvider>,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
