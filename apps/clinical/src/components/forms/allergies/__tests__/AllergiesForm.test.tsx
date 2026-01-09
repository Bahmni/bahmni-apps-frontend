import { useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Coding } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import useAllergenSearch from '../../../../hooks/useAllergenSearch';
import { AllergenConcept } from '../../../../models/allergy';
import { useAllergyStore } from '../../../../stores/allergyStore';
import AllergiesForm from '../AllergiesForm';

expect.extend(toHaveNoViolations);

// Mock modules
jest.mock('../../../../stores/allergyStore');
jest.mock('../../../../hooks/useAllergenSearch');
jest.mock('../styles/AllergiesForm.module.scss', () => ({
  allergiesFormTile: 'allergiesFormTile',
  allergiesFormTitle: 'allergiesFormTitle',
  allergiesBox: 'allergiesBox',
  selectedAllergyItem: 'selectedAllergyItem',
  duplicateNotification: 'duplicateNotification',
}));

// Mock @bahmni/widgets
jest.mock('@bahmni/widgets', () => ({
  useNotification: jest.fn(() => ({
    addNotification: jest.fn(),
  })),
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

// Mock @bahmni/services
jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        ALLERGIES_FORM_TITLE: 'Allergies',
        ALLERGIES_SEARCH_PLACEHOLDER: 'Search for allergies',
        ALLERGIES_SEARCH_ARIA_LABEL: 'Search for allergies',
        ALLERGIES_ADDED_ALLERGIES: 'Added Allergies',
        ALLERGY_ALREADY_ADDED: 'Allergen is already added',
        LOADING_CONCEPTS: 'Loading concepts...',
        NO_MATCHING_ALLERGEN_FOUND:
          'No matching allergen recorded for this term',
        ERROR_FETCHING_CONCEPTS:
          'An unexpected error occurred while fetching allergen concepts',
        ERROR_DEFAULT_TITLE: 'Error',
        ALLERGY_CATEGORY_DRUG: 'Drug',
        ALLERGY_CATEGORY_FOOD: 'Food',
        ALLERGY_CATEGORY_ENVIRONMENT: 'Environment',
        ALLERGY_CATEGORY_OTHER: 'Other',
      };
      return translations[key] || key;
    },
  })),
  getFormattedAllergies: jest.fn(() => Promise.resolve([])),
}));

// Mock utils/allergy
jest.mock('../../../../utils/allergy', () => ({
  getCategoryDisplayName: jest.fn((type: string) => {
    const categories: Record<string, string> = {
      drug: 'ALLERGY_CATEGORY_DRUG',
      food: 'ALLERGY_CATEGORY_FOOD',
      environment: 'ALLERGY_CATEGORY_ENVIRONMENT',
      other: 'ALLERGY_CATEGORY_OTHER',
    };
    return categories[type] || 'ALLERGY_CATEGORY_OTHER';
  }),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

const mockAllergen: AllergenConcept = {
  uuid: 'test-allergy-1',
  display: 'Peanut Allergy',
  type: 'food',
  disabled: false,
};

const mockReactions: Coding[] = [
  {
    code: 'hives',
    display: 'REACTION_HIVES',
    system: 'http://snomed.info/sct',
  },
  {
    code: 'rash',
    display: 'REACTION_RASH',
    system: 'http://snomed.info/sct',
  },
];

const mockSelectedAllergy = {
  id: mockAllergen.uuid,
  display: mockAllergen.display,
  selectedSeverity: null,
  selectedReactions: [],
  errors: {},
  hasBeenValidated: false,
};

const mockAllergyStore = {
  selectedAllergies: [],
  addAllergy: jest.fn(),
  removeAllergy: jest.fn(),
  updateSeverity: jest.fn(),
  updateReactions: jest.fn(),
  updateNote: jest.fn(),
  validateAllAllergies: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(),
};

const mockAllergenSearch = {
  allergens: [],
  reactions: mockReactions,
  isLoading: false,
  error: null,
};

// Test utilities
const renderAllergiesForm = (overrides = {}) => {
  const mockStore = { ...mockAllergyStore, ...overrides };
  (
    useAllergyStore as jest.MockedFunction<typeof useAllergyStore>
  ).mockReturnValue(mockStore);

  return render(<AllergiesForm />);
};

const mockAllergenSearchHook = (overrides = {}) => {
  const searchHook = { ...mockAllergenSearch, ...overrides };
  (
    useAllergenSearch as jest.MockedFunction<typeof useAllergenSearch>
  ).mockReturnValue(searchHook);
};

const getSearchCombobox = () =>
  screen.getByRole('combobox', { name: /search for allergies/i });

describe('AllergiesForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    // Set default mocks
    (
      useAllergyStore as jest.MockedFunction<typeof useAllergyStore>
    ).mockReturnValue(mockAllergyStore);
    mockAllergenSearchHook();
  });

  describe('Rendering', () => {
    it('should render search box correctly', () => {
      renderAllergiesForm();
      expect(getSearchCombobox()).toBeInTheDocument();
    });

    it('should display selected allergies', () => {
      renderAllergiesForm({ selectedAllergies: [mockSelectedAllergy] });
      expect(screen.getByText(/Peanut Allergy/)).toBeInTheDocument();
    });

    it('should show loading state while searching', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ isLoading: true });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'a');

      await waitFor(() => {
        expect(screen.getByText(/loading concepts/i)).toBeInTheDocument();
      });
    });

    it('should show error when search fails', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ error: new Error('Failed to load allergens') });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'a');

      await waitFor(() => {
        expect(
          screen.getByText(/unexpected error occurred/i),
        ).toBeInTheDocument();
      });
    });

    it('should show message when no search results found', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [] });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'nonexistent');

      await waitFor(() => {
        expect(
          screen.getByText(/No matching allergen recorded/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Allergy Selection', () => {
    it('should add an allergy when selected from search results', async () => {
      const user = userEvent.setup();
      const mockAddAllergy = jest.fn();

      mockAllergenSearchHook({ allergens: [mockAllergen] });
      renderAllergiesForm({ addAllergy: mockAddAllergy });

      await user.type(getSearchCombobox(), 'peanut');

      await waitFor(() => {
        expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Peanut Allergy [Food]'));

      await waitFor(() => {
        expect(mockAddAllergy).toHaveBeenCalledWith(mockAllergen);
      });
    });

    it('should prevent adding duplicate allergies', async () => {
      const user = userEvent.setup();
      const mockAddAllergy = jest.fn();

      mockAllergenSearchHook({ allergens: [mockAllergen] });
      renderAllergiesForm({
        selectedAllergies: [mockSelectedAllergy],
        addAllergy: mockAddAllergy,
      });

      await user.type(getSearchCombobox(), 'peanut');

      await waitFor(async () => {
        const alreadyAddedOption = screen.getByText(
          'Peanut Allergy (Allergen is already added)',
        );
        expect(alreadyAddedOption).toBeInTheDocument();
        await user.click(alreadyAddedOption);
      });

      expect(mockAddAllergy).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    const testCases = [
      { name: 'null selectedItem', selectedItem: null },
      { name: 'undefined selectedItem', selectedItem: undefined },
      {
        name: 'selectedItem with empty uuid',
        selectedItem: {
          uuid: '',
          display: 'Test Allergy',
          type: 'food',
          disabled: false,
        },
      },
      {
        name: 'selectedItem with empty display',
        selectedItem: {
          uuid: 'test-uuid',
          display: '',
          type: 'food',
          disabled: false,
        },
      },
      {
        name: 'selectedItem with missing uuid',
        selectedItem: {
          display: 'Test Allergy',
          type: 'food',
          disabled: false,
        },
      },
      {
        name: 'selectedItem with missing display',
        selectedItem: { uuid: 'test-uuid', type: 'food', disabled: false },
      },
    ];

    testCases.forEach(({ name, selectedItem }) => {
      it(`should not add allergy when ${name}`, () => {
        const mockAddAllergy = jest.fn();
        const { container } = renderAllergiesForm({
          addAllergy: mockAddAllergy,
        });

        const comboBoxElement = container.querySelector('#allergies-search');
        const changeEvent = new CustomEvent('change', {
          detail: { selectedItem },
        });

        comboBoxElement?.dispatchEvent(changeEvent);

        expect(mockAddAllergy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should handle input changes and trigger search', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [mockAllergen] });

      renderAllergiesForm();

      const searchBox = getSearchCombobox();
      await user.type(searchBox, 'peanut');

      await waitFor(() => {
        expect(screen.getByDisplayValue('peanut')).toBeInTheDocument();
      });
    });

    it('should return empty array when search term is empty', () => {
      renderAllergiesForm();
      expect(screen.queryByText('Peanut Allergy')).not.toBeInTheDocument();
    });

    it('should handle search with special characters', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [] });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), '!@#$%');

      await waitFor(() => {
        expect(
          screen.getByText(/No matching allergen recorded/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('ComboBox ItemToString Function', () => {
    it('should format item display with type category', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [mockAllergen] });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'peanut');

      await waitFor(() => {
        expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      });
    });

    it('should format item display without type when already selected', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [mockAllergen] });
      renderAllergiesForm({ selectedAllergies: [mockSelectedAllergy] });

      await user.type(getSearchCombobox(), 'peanut');

      await waitFor(() => {
        expect(
          screen.getByText('Peanut Allergy (Allergen is already added)'),
        ).toBeInTheDocument();
      });
    });

    it('should handle null item in itemToString', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [{ ...mockAllergen, type: null }] });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'peanut');

      await waitFor(() => {
        expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ error: new Error('API Error'), allergens: [] });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'test');

      await waitFor(() => {
        expect(
          screen.getByText(/unexpected error occurred/i),
        ).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({
        error: new Error('Network Error'),
        allergens: [],
        isLoading: false,
      });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'network');

      await waitFor(() => {
        expect(
          screen.getByText(/unexpected error occurred/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Memoization', () => {
    it('should memoize filtered search results correctly', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [mockAllergen] });

      const { rerender } = renderAllergiesForm();

      await user.type(getSearchCombobox(), 'peanut');

      await waitFor(() => {
        expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      });

      rerender(<AllergiesForm />);

      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should call removeAllergy when allergy is removed', () => {
      const mockRemoveAllergy = jest.fn();
      renderAllergiesForm({
        selectedAllergies: [mockSelectedAllergy],
        removeAllergy: mockRemoveAllergy,
      });

      const removeButton = screen.getByRole('button', { name: /close/i });
      removeButton.click();

      expect(mockRemoveAllergy).toHaveBeenCalledWith(mockSelectedAllergy.id);
    });

    it('should handle multiple selected allergies', () => {
      const secondAllergy = {
        ...mockSelectedAllergy,
        id: 'test-allergy-2',
        display: 'Shellfish Allergy',
      };

      renderAllergiesForm({
        selectedAllergies: [mockSelectedAllergy, secondAllergy],
      });

      expect(screen.getByText(/Peanut Allergy/)).toBeInTheDocument();
      expect(screen.getByText(/Shellfish Allergy/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty allergen list gracefully', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [], isLoading: false, error: null });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'nonexistent');

      await waitFor(() => {
        expect(
          screen.getByText(/No matching allergen recorded/i),
        ).toBeInTheDocument();
      });
    });

    it('should handle malformed allergen data', async () => {
      const user = userEvent.setup();
      const malformedAllergen = {
        uuid: 'test-id',
        display: null,
        type: 'food',
        disabled: false,
      };

      mockAllergenSearchHook({ allergens: [malformedAllergen as any] });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'malformed');

      await waitFor(() => {
        expect(getSearchCombobox()).toBeInTheDocument();
      });
    });

    it('should handle rapid search input changes', async () => {
      const user = userEvent.setup();
      mockAllergenSearchHook({ allergens: [mockAllergen] });

      renderAllergiesForm();

      const searchBox = getSearchCombobox();
      await user.type(searchBox, 'p');
      await user.type(searchBox, 'e');
      await user.type(searchBox, 'a');

      await waitFor(() => {
        expect(screen.getByDisplayValue('pea')).toBeInTheDocument();
      });
    });
  });

  describe('Duplicate Allergy Detection and Prevention', () => {
    it('should detect and prevent duplicate from currently selected allergies', async () => {
      const user = userEvent.setup();
      const mockAddAllergy = jest.fn();

      mockAllergenSearchHook({ allergens: [mockAllergen] });
      renderAllergiesForm({
        selectedAllergies: [mockSelectedAllergy],
        addAllergy: mockAddAllergy,
      });

      await user.type(getSearchCombobox(), 'peanut');

      await waitFor(() => {
        const option = screen.getByText(
          'Peanut Allergy (Allergen is already added)',
        );
        expect(option).toBeInTheDocument();
      });

      await user.click(
        screen.getByText('Peanut Allergy (Allergen is already added)'),
      );

      expect(mockAddAllergy).not.toHaveBeenCalled();
    });

    it('should mark duplicate options as disabled in search results', async () => {
      const user = userEvent.setup();

      const secondAllergen: AllergenConcept = {
        uuid: 'test-allergy-2',
        display: 'Shellfish',
        type: 'food',
        disabled: false,
      };

      mockAllergenSearchHook({ allergens: [mockAllergen, secondAllergen] });
      renderAllergiesForm({
        selectedAllergies: [mockSelectedAllergy],
      });

      await user.type(getSearchCombobox(), 'allergy');

      await waitFor(() => {
        expect(
          screen.getByText('Peanut Allergy (Allergen is already added)'),
        ).toBeInTheDocument();

        expect(screen.getByText('Shellfish [Food]')).toBeInTheDocument();
      });

      const options = screen.getAllByRole('option');
      const peanutOption = options.find((option) =>
        option.textContent?.includes(
          'Peanut Allergy (Allergen is already added)',
        ),
      );
      expect(peanutOption).toHaveAttribute('disabled');
    });

    it('should allow adding different allergy after preventing duplicate', async () => {
      const user = userEvent.setup();
      const mockAddAllergy = jest.fn();

      const anotherAllergen: AllergenConcept = {
        uuid: 'test-allergy-2',
        display: 'Shellfish',
        type: 'food',
        disabled: false,
      };

      mockAllergenSearchHook({ allergens: [mockAllergen, anotherAllergen] });
      renderAllergiesForm({
        selectedAllergies: [mockSelectedAllergy],
        addAllergy: mockAddAllergy,
      });

      await user.type(getSearchCombobox(), 'peanut');
      await user.click(
        screen.getByText('Peanut Allergy (Allergen is already added)'),
      );

      expect(mockAddAllergy).not.toHaveBeenCalled();

      await user.clear(getSearchCombobox());
      await user.type(getSearchCombobox(), 'shellfish');

      await waitFor(() => {
        expect(screen.getByText('Shellfish [Food]')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Shellfish [Food]'));

      await waitFor(() => {
        expect(mockAddAllergy).toHaveBeenCalledWith(anotherAllergen);
      });
    });
  });

  describe('Backend Allergies - Duplicate Detection', () => {
    it('should prevent adding allergy that exists in backend', async () => {
      const user = userEvent.setup();
      const mockAddAllergy = jest.fn();

      (useQuery as jest.Mock).mockReturnValue({
        data: [{ id: mockAllergen.uuid, display: 'Peanut Allergy' }] as any,
        isLoading: false,
        error: null,
      });
      mockAllergenSearchHook({ allergens: [mockAllergen] });
      renderAllergiesForm({ addAllergy: mockAddAllergy });

      await user.type(getSearchCombobox(), 'peanut');

      await waitFor(() => {
        expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Peanut Allergy [Food]'));

      expect(mockAddAllergy).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderAllergiesForm();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Snapshots', () => {
    it('should match snapshot with no allergies', () => {
      const { container } = renderAllergiesForm();
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with selected allergies', () => {
      const { container } = renderAllergiesForm({
        selectedAllergies: [mockSelectedAllergy],
      });
      expect(container).toMatchSnapshot();
    });
  });
});
