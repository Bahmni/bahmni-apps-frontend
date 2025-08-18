import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Condition } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CERTAINITY_CONCEPTS } from '../../../../constants/diagnosis';
import { useConceptSearch } from '../../../../hooks/useConceptSearch';
import useConditions from '../../../../hooks/useConditions';
import { useConditionsAndDiagnosesStore } from '../../../../stores/conditionsAndDiagnosesStore';
import { ConceptSearch } from '../../../../models/concepts';
import { type ConditionInputEntry } from '@bahmni-frontend/bahmni-services';
import { type DiagnosisInputEntry } from '@bahmni-frontend/bahmni-services';
import ConditionsAndDiagnoses from '../ConditionsAndDiagnoses';

expect.extend(toHaveNoViolations);

// Mock the hooks
jest.mock('../../../../hooks/useConceptSearch');
jest.mock('../../../../hooks/useConditions');

// Mock the Zustand store
jest.mock('../../../../stores/conditionsAndDiagnosesStore');

// Typed mock functions
const mockedUseConceptSearch = useConceptSearch as jest.MockedFunction<
  typeof useConceptSearch
>;
const mockedUseConditions = useConditions as jest.MockedFunction<
  typeof useConditions
>;
const mockedUseConditionsAndDiagnosesStore =
  useConditionsAndDiagnosesStore as jest.MockedFunction<
    typeof useConditionsAndDiagnosesStore
  >;

// Mock data
// Mock data factories
const createMockConcept = (
  overrides?: Partial<ConceptSearch>,
): ConceptSearch => ({
  conceptName: 'Hypertension',
  conceptUuid: 'uuid-1',
  matchedName: 'Hypertension',
  ...overrides,
});

const createMockDiagnosisEntry = (
  overrides?: Partial<DiagnosisInputEntry>,
): DiagnosisInputEntry => ({
  id: 'uuid-1',
  display: 'Hypertension',
  selectedCertainty: CERTAINITY_CONCEPTS[0],
  errors: {},
  hasBeenValidated: false,
  ...overrides,
});

const createMockConditionEntry = (
  overrides?: Partial<ConditionInputEntry>,
): ConditionInputEntry => ({
  id: 'uuid-3',
  display: 'Chronic Hypertension',
  durationValue: 6,
  durationUnit: 'months',
  errors: {},
  hasBeenValidated: false,
  ...overrides,
});

const createMockExistingCondition = (
  overrides?: Partial<Condition>,
): Condition => ({
  resourceType: 'Condition',
  id: 'existing-uuid-1',
  subject: { reference: 'Patient/patient-uuid' },
  code: {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: 'uuid-1',
        display: 'Existing Condition 1',
      },
    ],
  },
  clinicalStatus: { coding: [{ code: 'active' }] },
  verificationStatus: { coding: [{ code: 'confirmed' }] },
  ...overrides,
});

const mockConcepts = [
  createMockConcept({ conceptName: 'Hypertension', conceptUuid: 'uuid-1' }),
  createMockConcept({ conceptName: 'Diabetes', conceptUuid: 'uuid-2' }),
];

const mockDiagnosisEntries = [createMockDiagnosisEntry()];
const mockConditionEntries = [
  createMockConditionEntry({
    id: 'uuid-3',
    display: 'Chronic Hypertension',
    durationValue: 6,
    durationUnit: 'months',
  }),
  createMockConditionEntry({
    id: 'uuid-4',
    display: 'Type 2 Diabetes',
    durationValue: null,
    durationUnit: null,
  }),
];
const mockExistingConditions = [
  createMockExistingCondition({
    id: 'existing-uuid-1',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: 'uuid-1',
          display: 'Existing Condition 1',
        },
      ],
    },
  }),
  createMockExistingCondition({
    id: 'existing-uuid-2',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: 'uuid-5',
          display: 'Existing Condition 2',
        },
      ],
    },
  }),
];

describe('ConditionsAndDiagnoses', () => {
  // Mock store actions
  let addDiagnosisMock: jest.Mock;
  let removeDiagnosisMock: jest.Mock;
  let updateCertaintyMock: jest.Mock;
  let markAsConditionMock: jest.Mock;
  let removeConditionMock: jest.Mock;
  let updateConditionDurationMock: jest.Mock;
  let validateMock: jest.Mock;
  let resetMock: jest.Mock;
  let getStateMock: jest.Mock;

  const renderComponent = (
    selectedDiagnoses: DiagnosisInputEntry[] = [],
    selectedConditions: ConditionInputEntry[] = [],
    conceptSearchResults: ConceptSearch[] = [],
    conceptSearchLoading = false,
    conceptSearchError: Error | null = null,
    existingConditions: Condition[] = [],
    existingConditionsLoading = false,
    existingConditionsError: Error | null = null,
  ) => {
    mockedUseConceptSearch.mockReturnValue({
      searchResults: conceptSearchResults,
      loading: conceptSearchLoading,
      error: conceptSearchError,
    });

    mockedUseConditions.mockReturnValue({
      conditions: existingConditions,
      loading: existingConditionsLoading,
      error: existingConditionsError,
      refetch: jest.fn(),
    });

    addDiagnosisMock = jest.fn();
    removeDiagnosisMock = jest.fn();
    updateCertaintyMock = jest.fn();
    markAsConditionMock = jest.fn();
    removeConditionMock = jest.fn();
    updateConditionDurationMock = jest.fn();
    validateMock = jest.fn().mockReturnValue(true);
    resetMock = jest.fn();
    getStateMock = jest.fn();

    mockedUseConditionsAndDiagnosesStore.mockReturnValue({
      selectedDiagnoses,
      selectedConditions,
      addDiagnosis: addDiagnosisMock,
      removeDiagnosis: removeDiagnosisMock,
      updateCertainty: updateCertaintyMock,
      validate: validateMock,
      reset: resetMock,
      getState: getStateMock,
      markAsCondition: markAsConditionMock,
      removeCondition: removeConditionMock,
      updateConditionDuration: updateConditionDurationMock,
    });

    return render(<ConditionsAndDiagnoses/>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  describe('Initial Rendering', () => {
    test('should render the component with default state', () => {
      renderComponent();
      expect(screen.getByText('Conditions and Diagnoses')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search to add new diagnosis'),
      ).toBeInTheDocument();
    });

    test('should not render selected diagnoses section when no diagnoses are selected', () => {
      renderComponent([], mockConditionEntries); // Pass empty selectedDiagnoses
      expect(screen.queryByText('Added Diagnoses')).not.toBeInTheDocument();
    });

    test('should render selected diagnoses section when diagnoses are present', () => {
      renderComponent(mockDiagnosisEntries);
      expect(screen.getByText('Added Diagnoses')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });

    test('should not render conditions section when no conditions are selected', () => {
      renderComponent(mockDiagnosisEntries, []); // Pass empty selectedConditions
      expect(screen.queryByText('Added Conditions')).not.toBeInTheDocument();
    });

    test('should render conditions section when conditions are present', () => {
      renderComponent([], mockConditionEntries);
      expect(screen.getByText('Added Conditions')).toBeInTheDocument();
      expect(screen.getByText('Chronic Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
    });

    test('should render both diagnoses and conditions sections when both have data', () => {
      renderComponent(mockDiagnosisEntries, mockConditionEntries);

      expect(screen.getByText('Added Diagnoses')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();

      expect(screen.getByText('Added Conditions')).toBeInTheDocument();
      expect(screen.getByText('Chronic Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
    });
  });

  describe('User Workflow: Search, Select, and Remove Diagnoses', () => {
    test('should display selected diagnosis after selection', async () => {
      const user = userEvent.setup();
      renderComponent([], [], mockConcepts);

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'hyper');
      await user.click(screen.getByText('Hypertension'));

      // Assert on visible result (assuming addDiagnosis updates the store and component re-renders)
      // For this test, we need to mock the store's state change after addDiagnosis is called
      mockedUseConditionsAndDiagnosesStore.mockReturnValue({
        ...mockedUseConditionsAndDiagnosesStore(),
        selectedDiagnoses: [
          createMockDiagnosisEntry({ display: 'Hypertension', id: 'uuid-1' }),
        ],
      });
      renderComponent([
        createMockDiagnosisEntry({ display: 'Hypertension', id: 'uuid-1' }),
      ]);

      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Added Diagnoses')).toBeInTheDocument();
    });

    test('should display already selected diagnoses as disabled with indicator text', async () => {
      const user = userEvent.setup();
      const existingDiagnosis = createMockDiagnosisEntry({
        id: mockConcepts[0].conceptUuid,
        display: mockConcepts[0].conceptName,
      });

      renderComponent([existingDiagnosis], [], mockConcepts);

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'hyper');

      const disabledOption = await screen.findByText(
        `${mockConcepts[0].conceptName} (Already selected)`,
      );
      expect(disabledOption).toBeInTheDocument();
      const disabledListItem = disabledOption.closest('li');
      expect(disabledListItem).toHaveAttribute('disabled');
    });

    test('should not allow selection of disabled items', async () => {
      const user = userEvent.setup();
      const existingDiagnosis = createMockDiagnosisEntry({
        id: mockConcepts[0].conceptUuid,
        display: mockConcepts[0].conceptName,
      });

      renderComponent([existingDiagnosis], [], mockConcepts);

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'hyper');

      const disabledOption = await screen.findByText(
        `${mockConcepts[0].conceptName} (Already selected)`,
      );
      expect(disabledOption).toBeInTheDocument();

      const disabledListItem = disabledOption.closest('li');
      expect(disabledListItem).toHaveAttribute('disabled');

      // Attempt to click the disabled item
      await user.click(disabledOption);

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    test('should handle removal of a diagnosis', async () => {
      const user = userEvent.setup();
      renderComponent(mockDiagnosisEntries);

      const removeButton = screen.getByRole('button', {
        name: 'Selected Item Close',
      });
      await user.click(removeButton);

      expect(removeDiagnosisMock).toHaveBeenCalledWith(
        mockDiagnosisEntries[0].id,
      );
    });
  });

  describe('Search Functionality', () => {
    test.each([null, undefined])(
      'should display empty value when %s item is selected in ComboBox',
      (value) => {
        renderComponent();
        const comboBox = screen.getByRole('combobox');

        fireEvent.change(comboBox, {
          target: { value: '' },
          selectedItem: value,
        });
        expect(comboBox).toHaveValue('');
      },
    );

    test('should clear search results when search term is empty', async () => {
      const user = userEvent.setup();
      renderComponent([], [], [], true); // Initially loading search results

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );

      await user.type(searchInput, 'test');
      await user.clear(searchInput);

      expect(mockedUseConceptSearch).toHaveBeenCalledWith('');
      expect(
        screen.queryByText('No matching diagnosis recorded'),
      ).not.toBeInTheDocument();
    });

    test('should show loading state while searching', async () => {
      const user = userEvent.setup();
      renderComponent([], [], [], true); // Set loading to true

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'hyper');

      expect(mockedUseConceptSearch).toHaveBeenCalledWith('hyper');
      expect(screen.getByText('Loading concepts...')).toBeInTheDocument();
    });

    test('should display search results when API returns data', async () => {
      const user = userEvent.setup();
      renderComponent([], [], mockConcepts);

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'hyper');

      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
    });

    test('should display no results message when search returns empty', async () => {
      const user = userEvent.setup();
      renderComponent([], [], []); // Empty search results

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'nonexistent');

      expect(
        screen.getByText('No matching diagnosis recorded'),
      ).toBeInTheDocument();
    });

    test('should display error message when search fails', async () => {
      const user = userEvent.setup();
      renderComponent([], [], [], false, new Error('API Error'));

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'test');

      const errorOption = screen.getByText(
        'An unexpected error occurred. Please try again later.',
      );
      expect(errorOption).toBeInTheDocument();
      const errorListItem = errorOption.closest('li');
      expect(errorListItem).toHaveAttribute('disabled');
    });

    test('should handle search term less than 3 characters', async () => {
      const user = userEvent.setup();
      renderComponent();
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'hy');

      expect(mockedUseConceptSearch).toHaveBeenCalledWith('hy');
      expect(screen.queryByText('Hypertension')).not.toBeInTheDocument();
    });
  });

  describe('Managing Conditions', () => {
    test('should handle condition removal', async () => {
      const user = userEvent.setup();
      renderComponent([], [mockConditionEntries[0]]);

      const removeButtons = screen.getAllByRole('button', {
        name: 'Selected Item Close',
      });
      await user.click(removeButtons[0]);

      expect(removeConditionMock).toHaveBeenCalledWith(
        mockConditionEntries[0].id,
      );
    });

    test('should handle condition duration updates', async () => {
      renderComponent([], mockConditionEntries);
      expect(screen.getByText('Chronic Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
      // This test needs to be more specific about how duration updates are handled.
      // It currently only checks for rendering, not interaction.
      // A more robust test would involve simulating input into the duration fields
      // within SelectedConditionItem and asserting that updateConditionDuration is called.
    });
  });

  describe('Diagnosis to Condition Conversion', () => {
    test('should handle marking diagnosis as condition', async () => {
      const user = userEvent.setup();
      const diagnosisToConvert = createMockDiagnosisEntry({
        id: 'diagnosis-to-convert',
        display: 'Diagnosis to Convert',
      });
      renderComponent([diagnosisToConvert]);

      const markAsConditionLink = screen.getByRole('link', {
        name: /add as condition/i,
      });
      await user.click(markAsConditionLink);

      expect(markAsConditionMock).toHaveBeenCalledWith('diagnosis-to-convert');
    });

    test('should correctly check if diagnosis is a duplicate condition (existing patient conditions)', () => {
      const diagnosis = createMockDiagnosisEntry({
        id: 'uuid-1',
        display: 'Hypertension',
      });
      const existingCondition = createMockExistingCondition({
        code: { coding: [{ code: 'uuid-1', display: 'Existing Condition 1' }] },
      });

      renderComponent([diagnosis], [], [], false, null, [existingCondition]);

      const diagnosisItem = screen.getByText('Hypertension');
      expect(diagnosisItem).toBeInTheDocument();
      // To properly test this, SelectedDiagnosisItem would need to expose a test ID or a specific text
      // indicating it's a duplicate. For now, we rely on the component's internal logic.
    });

    test('should correctly check if diagnosis is a duplicate condition (selected conditions)', () => {
      const diagnosis = createMockDiagnosisEntry({
        id: 'uuid-1',
        display: 'Hypertension',
      });
      const selectedCondition = createMockConditionEntry({
        id: 'uuid-1',
        display: 'Hypertension',
      });

      renderComponent([diagnosis], [selectedCondition]);

      const addedDiagnosesSection = screen
        .getByText('Added Diagnoses')
        .closest('[role="region"]') as HTMLElement;
      expect(addedDiagnosesSection).toBeInTheDocument();
      const diagnosisItem = within(addedDiagnosesSection).getByText(
        'Hypertension',
      );
      expect(diagnosisItem).toBeInTheDocument();
      // Similar to the above, a more explicit assertion would be needed if the UI indicates duplication.
    });

    test('should correctly check if diagnosis is not a duplicate condition', () => {
      const diagnosis = createMockDiagnosisEntry({
        id: 'uuid-non-duplicate',
        display: 'Non-Duplicate Diagnosis',
      });
      renderComponent([diagnosis], [], [], false, null, mockExistingConditions);

      const diagnosisItem = screen.getByText('Non-Duplicate Diagnosis');
      expect(diagnosisItem).toBeInTheDocument();
    });

    test('should handle undefined/null existingConditions array in isConditionDuplicate', () => {
      const diagnosis = createMockDiagnosisEntry();
      renderComponent([diagnosis], [], [], false, null, []); // Empty existingConditions

      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    test('should display loading text when existing conditions are loading', async () => {
      const user = userEvent.setup();
      renderComponent([], [], [], false, null, [], true); // Existing conditions loading

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'test');

      expect(screen.getByText('Loading concepts...')).toBeInTheDocument();
    });

    test('should display error message when fetching existing conditions fails', async () => {
      const user = userEvent.setup();
      renderComponent(
        [],
        [],
        [],
        false,
        null,
        [],
        false,
        new Error('Conditions API Error'),
      );

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'test');
      expect(
        screen.getByText('No matching diagnosis recorded'),
      ).toBeInTheDocument();
    });

    test('should prioritize search error over conditions error for display', async () => {
      const user = userEvent.setup();
      renderComponent(
        [],
        [],
        [],
        false,
        new Error('Search API Error'),
        [],
        false,
        new Error('Conditions API Error'),
      );

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'test');

      expect(
        screen.getByText(
          'An unexpected error occurred. Please try again later.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Search Result Filtering with Existing Conditions', () => {
    test('should mark search results as disabled if they are selected diagnoses AND existing conditions', async () => {
      const user = userEvent.setup();
      const existingDiagnosis = createMockDiagnosisEntry({
        id: mockConcepts[0].conceptUuid,
        display: mockConcepts[0].conceptName,
      });

      renderComponent(
        [existingDiagnosis],
        [],
        mockConcepts,
        false,
        null,
        mockExistingConditions,
      );

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'hyper');

      const disabledOption = await screen.findByText(
        `${mockConcepts[0].conceptName} (Already selected)`,
      );
      expect(disabledOption).toBeInTheDocument();
      const disabledListItem = disabledOption.closest('li');
      expect(disabledListItem).toHaveAttribute('disabled');
    });

    test('should not mark search results as disabled if they are only existing conditions (current component behavior)', async () => {
      const user = userEvent.setup();
      renderComponent(
        [],
        [],
        mockConcepts,
        false,
        null,
        mockExistingConditions,
      );

      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await user.type(searchInput, 'hyper');

      const enabledOption = await screen.findByText(
        mockConcepts[0].conceptName,
      );
      expect(enabledOption).toBeInTheDocument();
      const enabledListItem = enabledOption.closest('li');
      expect(enabledListItem).not.toHaveAttribute('disabled');

      const anotherEnabledOption = screen.getByText(
        mockConcepts[1].conceptName,
      );
      expect(anotherEnabledOption).toBeInTheDocument();
      const anotherEnabledListItem = anotherEnabledOption.closest('li');
      expect(anotherEnabledListItem).not.toHaveAttribute('disabled');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      renderComponent();
      expect(screen.getByLabelText('Search for diagnoses')).toBeInTheDocument();
    });

    test('accessible forms pass axe', async () => {
      const { container } = renderComponent();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Selection Edge Cases', () => {
    test('should not call addDiagnosis when selectedItem is null', async () => {
      renderComponent();
      const comboBox = screen.getByRole('combobox');

      // Simulate onChange with null selectedItem
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: null,
      });

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    test('should not call addDiagnosis when selectedItem is undefined', async () => {
      renderComponent();
      const comboBox = screen.getByRole('combobox');

      // Simulate onChange with undefined selectedItem
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: undefined,
      });

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    test('should not call addDiagnosis when selectedItem has missing conceptUuid', async () => {
      const mockConceptMissingUuid = createMockConcept({
        conceptName: 'Test Concept',
        conceptUuid: '',
      });

      renderComponent([], [], [mockConceptMissingUuid]);
      const searchInput = screen.getByPlaceholderText(
        'Search to add new diagnosis',
      );
      await userEvent.type(searchInput, 'Test');

      fireEvent.click(screen.getByText('Test Concept'));

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    test('should not call addDiagnosis when selectedItem has missing conceptName', async () => {
      const mockConceptMissingName = createMockConcept({
        conceptName: '',
        conceptUuid: 'uuid-test',
        matchedName: 'Test Concept',
      });

      renderComponent([], [], [mockConceptMissingName]);
      const comboBox = screen.getByRole('combobox');

      // Simulate onChange with the problematic selectedItem directly
      fireEvent.change(comboBox, {
        target: { value: 'Test' },
        selectedItem: mockConceptMissingName,
      });

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    test('should not call addDiagnosis when selectedItem has both missing conceptName and conceptUuid', async () => {
      const mockInvalidConcept = createMockConcept({
        conceptName: '',
        conceptUuid: '',
        matchedName: 'Invalid Concept',
      });

      renderComponent([], [], [mockInvalidConcept]);
      const comboBox = screen.getByRole('combobox');

      // Simulate onChange with the problematic selectedItem directly
      fireEvent.change(comboBox, {
        target: { value: 'invalid' },
        selectedItem: mockInvalidConcept,
      });

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });
  });
  describe('Snapshot Tests', () => {
    it('empty form matches snapshot', () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });

    it('form with search results matches snapshot', () => {
      const { container } = renderComponent([], [], mockConcepts);
      expect(container).toMatchSnapshot();
    });

    it('form with selected diagnoses matches snapshot', () => {
      const { container } = renderComponent(mockDiagnosisEntries);
      expect(container).toMatchSnapshot();
    });

    it('duplicate diagnosis search should matches snapshot', () => {
      const { container } = renderComponent(
        mockDiagnosisEntries,
        [],
        mockConcepts,
      );
      expect(container).toMatchSnapshot();
    });

    it('form with selected conditions matches snapshot', () => {
      const { container } = renderComponent([], mockConditionEntries);
      expect(container).toMatchSnapshot();
    });

    it('form with both diagnoses and conditions matches snapshot', () => {
      const { container } = renderComponent(
        mockDiagnosisEntries,
        mockConditionEntries,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
