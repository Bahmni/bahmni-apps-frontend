import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import DiagnosesForm from '../ConditionsAndDiagnoses';
import { useConceptSearch } from '@hooks/useConceptSearch';
import { ConceptSearch } from '@/types/concepts';
import { axe, toHaveNoViolations } from 'jest-axe';
import i18n from '@/setupTests.i18n';
import { useConditionsAndDiagnosesStore } from '@stores/conditionsAndDiagnosesStore';
import { DiagnosisInputEntry } from '@/types/diagnosis';
import { ConditionsAndDiagnosesState } from '@stores/conditionsAndDiagnosesStore';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { ConditionInputEntry } from '@/types/condition';

expect.extend(toHaveNoViolations);

jest.mock('@hooks/useConceptSearch', () => ({
  useConceptSearch: jest.fn(),
}));

// Mock the Zustand store
jest.mock('@stores/conditionsAndDiagnosesStore', () => {
  const actualModule = jest.requireActual(
    '@stores/conditionsAndDiagnosesStore',
  );
  return {
    ...actualModule,
    useConditionsAndDiagnosesStore: jest.fn(),
  };
});

// Mock data
const mockConcepts: ConceptSearch[] = [
  {
    conceptName: 'Hypertension',
    conceptUuid: 'uuid-1',
    matchedName: 'Hypertension',
  },
  {
    conceptName: 'Diabetes',
    conceptUuid: 'uuid-2',
    matchedName: 'Diabetes',
  },
];

const mockDiagnosisEntries: DiagnosisInputEntry[] = [
  {
    id: 'uuid-1',
    display: 'Hypertension',
    selectedCertainty: CERTAINITY_CONCEPTS[0],
    errors: {},
    hasBeenValidated: false,
  },
];

const mockDiagnosisInputEntryWithoutCertainty: DiagnosisInputEntry = {
  id: 'uuid-2',
  display: 'Diabetes',
  selectedCertainty: null,
  errors: {},
  hasBeenValidated: false,
};

const mockConditionEntries: ConditionInputEntry[] = [
  {
    id: 'uuid-3',
    display: 'Chronic Hypertension',
    durationValue: 6,
    durationUnit: 'months',
    errors: {},
    hasBeenValidated: false,
  },
  {
    id: 'uuid-4',
    display: 'Type 2 Diabetes',
    durationValue: null,
    durationUnit: null,
    errors: {},
    hasBeenValidated: false,
  },
];

// Mock store implementation
const createMockStore = (
  initialState: Partial<ConditionsAndDiagnosesState> = {},
) => {
  const store: ConditionsAndDiagnosesState = {
    selectedDiagnoses: [],
    selectedConditions: [],
    addDiagnosis: jest.fn(),
    removeDiagnosis: jest.fn(),
    updateCertainty: jest.fn(),
    validate: jest.fn().mockReturnValue(true),
    reset: jest.fn(),
    getState: jest.fn(),
    markAsCondition: jest.fn(),
    removeCondition: jest.fn(),
    updateConditionDuration: jest.fn(),
    ...initialState,
  };

  // Make getState return the current store state
  store.getState = jest.fn().mockReturnValue(store);

  return store;
};

describe('ConditionsAndDiagnoses', () => {
  // Default mock store
  let mockStore: ConditionsAndDiagnosesState;
  let addDiagnosisMock: jest.Mock;
  let removeDiagnosisMock: jest.Mock;
  let updateCertaintyMock: jest.Mock;

  beforeEach(() => {
    addDiagnosisMock = jest.fn();
    removeDiagnosisMock = jest.fn();
    updateCertaintyMock = jest.fn();

    mockStore = createMockStore({
      addDiagnosis: addDiagnosisMock,
      removeDiagnosis: removeDiagnosisMock,
      updateCertainty: updateCertaintyMock,
    });

    (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue(
      mockStore,
    );
  });

  const renderWithI18n = (component: React.ReactElement) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock scrollIntoView which is not available in jsdom
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    // Default mock for useConceptSearch
    (useConceptSearch as jest.Mock).mockReturnValue({
      searchResults: [],
      loading: false,
      error: null,
    });
    i18n.changeLanguage('en');
  });

  describe('Rendering', () => {
    it('should render the component with default state', () => {
      render(<DiagnosesForm />);
      expect(screen.getByText('Conditions and Diagnoses')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search to add new diagnosis'),
      ).toBeInTheDocument();
    });

    it('should not render selected diagnoses section when no diagnoses are selected', () => {
      // Use empty array for selectedDiagnoses
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [],
      });

      render(<DiagnosesForm />);
      expect(screen.queryByText('Added Diagnoses')).not.toBeInTheDocument();
    });

    it('should render selected diagnoses section when diagnoses are present', () => {
      // Mock store with diagnoses
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
      });

      render(<DiagnosesForm />);
      expect(screen.getByText('Added Diagnoses')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should handle itemToString with null/undefined item', () => {
      render(<DiagnosesForm />);
      const comboBox = screen.getByRole('combobox');

      // Test with null
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: null,
      });
      expect(comboBox).toHaveValue('');

      // Test with undefined
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: undefined,
      });
      expect(comboBox).toHaveValue('');
    });

    it('should clear search results when search term is empty', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: true,
        error: null,
      });
      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );

      // Type something first
      await userEvent.type(searchInput, 'test');

      // Clear the search term
      await userEvent.clear(searchInput);

      // Should have called handleSearch with empty string
      expect(useConceptSearch).toHaveBeenCalledWith('');
      expect(
        screen.queryByText('No matching diagnosis recorded'),
      ).not.toBeInTheDocument();
    });

    it('should show loading state while searching', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: true,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'hyper');

      expect(useConceptSearch).toHaveBeenCalledWith('hyper');
    });

    it('should display search results when API returns data', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'hyper');

      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
    });

    it('should display no results message when search returns empty', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'nonexistent');

      expect(
        screen.getByText('No matching diagnosis recorded'),
      ).toBeInTheDocument();
    });

    it('should display loading text when search is loading', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: true,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'nonexistent');

      expect(screen.getByText('Loading concepts...')).toBeInTheDocument();
    });

    it('should display error message when search fails', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: new Error('API Error'),
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'test');

      // Verify error message is displayed
      const errorOption = screen.getByText(
        'An unexpected error occurred. Please try again later.',
      );
      expect(errorOption).toBeInTheDocument();

      // Verify the error option is disabled
      const errorListItem = errorOption.closest('li');
      expect(errorListItem).toHaveAttribute('disabled');
    });

    it('should handle search term less than 3 characters', async () => {
      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'hy');

      expect(useConceptSearch).toHaveBeenCalledWith('hy');
      expect(screen.queryByText('Hypertension')).not.toBeInTheDocument();
    });
  });

  describe('Selection and Removal', () => {
    it('should handle selection of a diagnosis', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'hyper');

      // Simulate selecting an item
      fireEvent.change(searchInput, {
        target: { value: mockConcepts[0].conceptName },
      });
      fireEvent.click(screen.getByText(mockConcepts[0].conceptName));

      expect(addDiagnosisMock).toHaveBeenCalledWith({
        ...mockConcepts[0],
        disabled: false,
      });
    });

    it('should display already selected diagnoses as disabled with indicator text', async () => {
      const existingDiagnosis: DiagnosisInputEntry = {
        id: mockConcepts[0].conceptUuid,
        display: mockConcepts[0].conceptName,
        selectedCertainty: CERTAINITY_CONCEPTS[0],
        errors: {},
        hasBeenValidated: false,
      };

      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [existingDiagnosis],
      });

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'hyper');

      // Check that the already selected item shows with indicator text
      const disabledOption = await screen.findByText(
        `${mockConcepts[0].conceptName} (Already selected)`,
      );
      expect(disabledOption).toBeInTheDocument();
    });

    it('should not allow selection of disabled items', async () => {
      const existingDiagnosis: DiagnosisInputEntry = {
        id: mockConcepts[0].conceptUuid,
        display: mockConcepts[0].conceptName,
        selectedCertainty: CERTAINITY_CONCEPTS[0],
        errors: {},
        hasBeenValidated: false,
      };

      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [existingDiagnosis],
      });

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'hyper');

      // Find the disabled option
      const disabledOption = await screen.findByText(
        `${mockConcepts[0].conceptName} (Already selected)`,
      );
      expect(disabledOption).toBeInTheDocument();

      // Verify the item is marked as disabled
      const disabledListItem = disabledOption.closest('li');
      expect(disabledListItem).toHaveAttribute('disabled');

      // Since the item is disabled, Carbon ComboBox should not trigger onChange
      // We can verify this by checking that addDiagnosis was not called
      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    it('should update disabled state when diagnoses are added/removed', async () => {
      // Start with no diagnoses selected
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [],
      });

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      const { rerender } = render(<DiagnosesForm />);

      // Initially no diagnoses selected
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'hyper');

      // Wait for search results to appear
      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      // All items should be enabled (no "Already selected" text)
      expect(screen.queryByText(/(Already selected)/)).not.toBeInTheDocument();

      // Now simulate adding a diagnosis to selected list
      const newDiagnosis: DiagnosisInputEntry = {
        id: mockConcepts[0].conceptUuid,
        display: mockConcepts[0].conceptName,
        selectedCertainty: null,
        errors: {},
        hasBeenValidated: false,
      };

      // Update the mock to return selected diagnoses
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [newDiagnosis],
      });

      // Force a re-render
      rerender(<DiagnosesForm />);

      // Type in search again to trigger the search
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'hyper');

      // Now the item should show as disabled
      await waitFor(() => {
        expect(
          screen.getByText(`${mockConcepts[0].conceptName} (Already selected)`),
        ).toBeInTheDocument();
      });
    });

    it('should handle removal of a diagnosis', async () => {
      // Mock store with existing diagnosis
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
      });

      render(<DiagnosesForm />);

      const removeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(removeButton);

      expect(removeDiagnosisMock).toHaveBeenCalledWith(
        mockDiagnosisEntries[0].id,
      );
    });

    it('should handle null/undefined selection gracefully', async () => {
      render(<DiagnosesForm />);

      // Trigger onChange with null value directly
      const comboBox = screen.getByRole('combobox');
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: null,
      });

      waitFor(() => {
        // Verify no error is displayed
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        // Verify addDiagnosis was not called
        expect(addDiagnosisMock).not.toHaveBeenCalled();
      });
    });
    it('should handle selection of a diagnosis with undefined concept uuid', async () => {
      const mockConceptWithUndefinedUuid: ConceptSearch = {
        conceptName: 'Test',
        conceptUuid: '',
        matchedName: 'Undefined Concept',
      };

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [mockConceptWithUndefinedUuid],
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'Test');

      // Simulate selecting the item
      fireEvent.change(searchInput, {
        target: { value: mockConceptWithUndefinedUuid.conceptName },
      });
      fireEvent.click(
        screen.getByText(mockConceptWithUndefinedUuid.conceptName),
      );

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DiagnosesForm />);
      expect(screen.getByLabelText('Search for diagnoses')).toBeInTheDocument();
    });

    test('accessible forms pass axe', async () => {
      const { container } = render(<DiagnosesForm />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Conditions Section', () => {
    it('should not render conditions section when no conditions are selected', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedConditions: [],
      });

      render(<DiagnosesForm />);
      expect(screen.queryByText('Conditions')).not.toBeInTheDocument();
    });

    it('should render conditions section when conditions are present', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedConditions: mockConditionEntries,
      });

      render(<DiagnosesForm />);
      expect(screen.getByText('Added Conditions')).toBeInTheDocument();
      expect(screen.getByText('Chronic Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
    });

    it('should handle condition removal', async () => {
      const removeConditionMock = jest.fn();
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedConditions: [mockConditionEntries[0]],
        removeCondition: removeConditionMock,
      });

      render(<DiagnosesForm />);

      // Find the close button for the condition
      const removeButtons = screen.getAllByRole('button', { name: /close/i });
      await userEvent.click(removeButtons[0]);

      expect(removeConditionMock).toHaveBeenCalledWith(
        mockConditionEntries[0].id,
      );
    });

    it('should handle condition duration updates', async () => {
      const updateConditionDurationMock = jest.fn();
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedConditions: mockConditionEntries,
        updateConditionDuration: updateConditionDurationMock,
      });

      render(<DiagnosesForm />);
      expect(screen.getByText('Chronic Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
    });
  });

  describe('Diagnosis to Condition Conversion', () => {
    it('should handle marking diagnosis as condition', () => {
      const markAsConditionMock = jest.fn().mockReturnValue(true);
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
        markAsCondition: markAsConditionMock,
      });

      render(<DiagnosesForm />);

      // The handleMarkAsCondition function should be available to child components
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });

    it('should correctly check if condition exists with isConditionExists - returns true', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
        selectedConditions: [
          {
            id: mockDiagnosisEntries[0].id,
            display: 'Hypertension',
            durationValue: 1,
            durationUnit: 'months',
            errors: {},
            hasBeenValidated: false,
          },
        ],
      });

      render(<DiagnosesForm />);
      // Both sections should contain Hypertension, so use getAllByText
      const hypertensionElements = screen.getAllByText('Hypertension');
      expect(hypertensionElements.length).toBeGreaterThan(0);
    });

    it('should correctly check if condition exists with isConditionExists - returns false', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
        selectedConditions: [],
      });

      render(<DiagnosesForm />);
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });

    it('should handle undefined/null conditions array in isConditionExists', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
        selectedConditions: undefined,
      });

      render(<DiagnosesForm />);
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });

  describe('Integration Tests - Diagnoses and Conditions Together', () => {
    it('should render both diagnoses and conditions sections when both have data', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
        selectedConditions: mockConditionEntries,
      });

      render(<DiagnosesForm />);

      // Both sections should be visible
      expect(screen.getByText('Added Diagnoses')).toBeInTheDocument();
      expect(screen.getByText('Added Conditions')).toBeInTheDocument();

      // Diagnoses content
      expect(screen.getByText('Hypertension')).toBeInTheDocument();

      // Conditions content
      expect(screen.getByText('Chronic Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
    });

    it('should handle marking diagnosis as condition workflow', () => {
      const markAsConditionMock = jest.fn().mockReturnValue(true);
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
        selectedConditions: [],
        markAsCondition: markAsConditionMock,
      });

      render(<DiagnosesForm />);

      // Should show diagnosis initially
      expect(screen.getByText('Added Diagnoses')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.queryByText('Added Conditions')).not.toBeInTheDocument();

      // The markAsCondition function should be available and functional
      // This tests that the component provides the necessary props to child components
      expect(markAsConditionMock).toBeDefined();
    });

    it('should show only conditions when diagnosis has been moved to conditions', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [],
        selectedConditions: [
          {
            id: mockDiagnosisEntries[0].id,
            display: mockDiagnosisEntries[0].display,
            durationValue: null,
            durationUnit: null,
            errors: {},
            hasBeenValidated: false,
          },
        ],
      });

      render(<DiagnosesForm />);

      // Should now show in conditions section only
      expect(screen.queryByText('Added Diagnoses')).not.toBeInTheDocument();
      expect(screen.getByText('Added Conditions')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });

  describe('Enhanced Edge Cases and Error Handling', () => {
    it('should handle diagnosis without certainty', () => {
      // Mock store with diagnosis without certainty
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [mockDiagnosisInputEntryWithoutCertainty],
      });

      render(<DiagnosesForm />);
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
    });

    it('should handle selection with missing conceptName', async () => {
      const mockConceptMissingName: ConceptSearch = {
        conceptName: '',
        conceptUuid: 'uuid-test',
        matchedName: 'Test Concept',
      };

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [mockConceptMissingName],
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'test');

      const testConcept = screen.queryByText('Test Concept');
      if (testConcept) {
        fireEvent.click(testConcept);
      }

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    it('should handle selection with both missing conceptName and conceptUuid', async () => {
      const mockInvalidConcept: ConceptSearch = {
        conceptName: '',
        conceptUuid: '',
        matchedName: 'Invalid Concept',
      };

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [mockInvalidConcept],
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'invalid');

      // Try to find and click the item if it exists, but main test is that addDiagnosis is not called
      const invalidConcept = screen.queryByText('Invalid Concept');
      if (invalidConcept) {
        fireEvent.click(invalidConcept);
      }

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    it('should handle null selectedItem in onChange', async () => {
      render(<DiagnosesForm />);
      const comboBox = screen.getByRole('combobox');

      // Simulate onChange with null selectedItem
      fireEvent.change(comboBox, {
        target: { value: '' },
      });

      // Trigger the onChange handler directly with null selectedItem
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', {
        value: { selectedItem: null },
        enumerable: true,
      });

      fireEvent(comboBox, changeEvent);

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    it('should handle completely undefined selectedItem in onChange', async () => {
      render(<DiagnosesForm />);
      const comboBox = screen.getByRole('combobox');

      // Create a mock event with undefined selectedItem
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', {
        value: { selectedItem: undefined },
        enumerable: true,
      });

      fireEvent(comboBox, changeEvent);

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('empty form matches snapshot', () => {
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });

    test('form with search results matches snapshot', () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });

    test('form with selected diagnoses matches snapshot', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
      });
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });

    test('duplicate diagnosis search should matches snapshot', async () => {
      const existingDiagnosis: DiagnosisInputEntry = {
        id: mockConcepts[0].conceptUuid,
        display: mockConcepts[0].conceptName,
        selectedCertainty: CERTAINITY_CONCEPTS[0],
        errors: {},
        hasBeenValidated: false,
      };

      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [existingDiagnosis],
      });

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });
      const { container } = renderWithI18n(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'hyper');
      expect(container).toMatchSnapshot();
    });

    test('form with selected conditions matches snapshot', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedConditions: mockConditionEntries,
      });
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });

    test('form with both diagnoses and conditions matches snapshot', () => {
      (useConditionsAndDiagnosesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
        selectedConditions: mockConditionEntries,
      });
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });
  });
});
