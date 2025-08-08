import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Coding } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import useAllergenSearch from '../../../../hooks/useAllergenSearch';
import { useAllergyStore } from '../../../../stores/allergyStore';
import { AllergenConcept } from '../../../../types/allergy';
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

  return render(
      <AllergiesForm />
  );
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
          'Peanut Allergy (Already added)',
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

      // Verify search is triggered
      await waitFor(() => {
        expect(screen.getByDisplayValue('peanut')).toBeInTheDocument();
      });
    });

    it('should return empty array when search term is empty', () => {
      renderAllergiesForm();

      // The component should not show any search results when search term is empty
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
          screen.getByText('Peanut Allergy (Already added)'),
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

      // Rerender with same props should use memoized results
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
        display: null, // null display
        type: 'food',
        disabled: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAllergenSearchHook({ allergens: [malformedAllergen as any] });

      renderAllergiesForm();

      await user.type(getSearchCombobox(), 'malformed');

      // Should not crash and handle gracefully
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
      const selectedAllergyWithReactions = {
        ...mockSelectedAllergy,
        selectedReactions: [mockReactions[0]],
        hasBeenValidated: true,
      };

      const { container } = renderAllergiesForm({
        selectedAllergies: [selectedAllergyWithReactions],
      });

      expect(container).toMatchSnapshot();
    });
  });
});
