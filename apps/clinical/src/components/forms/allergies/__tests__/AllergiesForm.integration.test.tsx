import * as bahmniServices from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Coding } from 'fhir/r4';
import i18n from '../../../../../setupTests.i18n';
import { useClinicalConfig } from '../../../../hooks/useClinicalConfig';
import { ClinicalConfigProvider } from '../../../../providers/ClinicalConfigProvider';
import { useAllergyStore } from '../../../../stores/allergyStore';
import AllergiesForm from '../AllergiesForm';

// Mock hooks and services
jest.mock('../../../../stores/allergyStore');
jest.mock('../../../../hooks/useClinicalConfig');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchAndFormatAllergenConcepts: jest.fn(),
  fetchReactionConcepts: jest.fn(),
  getFormattedAllergies: jest.fn(() => Promise.resolve([])),
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
          'An unexpected error occurred. Please try again later.',
        ERROR_DEFAULT_TITLE: 'Error',
        ALLERGY_CATEGORY_DRUG: 'Drug',
        ALLERGY_CATEGORY_FOOD: 'Food',
        ALLERGY_CATEGORY_ENVIRONMENT: 'Environment',
        ALLERGY_CATEGORY_OTHER: 'Other',
      };
      return translations[key] || key;
    },
  })),
}));

// Mock @bahmni/widgets
jest.mock('@bahmni/widgets', () => ({
  useNotification: jest.fn(() => ({
    addNotification: jest.fn(),
  })),
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock utils/allergy
jest.mock('../../../../utils/allergy', () => ({
  getCategoryDisplayName: jest.fn((type: string) => {
    const categories: Record<string, string> = {
      medication: 'ALLERGY_CATEGORY_DRUG',
      food: 'ALLERGY_CATEGORY_FOOD',
      environment: 'ALLERGY_CATEGORY_ENVIRONMENT',
      other: 'ALLERGY_CATEGORY_OTHER',
    };
    return categories[type] || 'ALLERGY_CATEGORY_OTHER';
  }),
}));

const mockUseClinicalConfig = useClinicalConfig as jest.MockedFunction<
  typeof useClinicalConfig
>;

const mockClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      foodAllergenUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      environmentalAllergenUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allergyReactionUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
};

// Mock CSS modules
jest.mock('../styles/AllergiesForm.module.scss', () => ({
  allergiesFormTile: 'allergiesFormTile',
  allergiesFormTitle: 'allergiesFormTitle',
  allergiesBox: 'allergiesBox',
  selectedAllergyItem: 'selectedAllergyItem',
  duplicateNotification: 'duplicateNotification',
}));

const mockReactionConcepts: Coding[] = [
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

describe('AllergiesForm Integration Tests', () => {
  const mockStore = {
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

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();

    // Setup default mock implementation for useClinicalConfig
    mockUseClinicalConfig.mockReturnValue({
      clinicalConfig: mockClinicalConfig,
      setClinicalConfig: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });

    // Mock scrollIntoView which is not available in jsdom
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    // Mock the fetchAndFormatAllergenConcepts function
    (
      bahmniServices.fetchAndFormatAllergenConcepts as jest.Mock
    ).mockResolvedValue([
      {
        uuid: '123',
        display: 'Penicillin',
        type: 'medication',
      },
      {
        uuid: '456',
        display: 'Peanuts',
        type: 'food',
      },
      {
        uuid: '789',
        display: 'Dust',
        type: 'environment',
      },
    ]);

    // Mock the fetchReactionConcepts function
    (bahmniServices.fetchReactionConcepts as jest.Mock).mockResolvedValue(
      mockReactionConcepts,
    );

    // Mock the store
    (useAllergyStore as unknown as jest.Mock).mockReturnValue(mockStore);
    i18n.changeLanguage('en');
  });

  test('loads and displays allergens from API', async () => {
    render(<AllergiesForm />);

    const searchBox = screen.getByRole('combobox', {
      name: /search for allergies/i,
    });
    await userEvent.type(searchBox, 'pen');

    await waitFor(() => {
      expect(screen.getByText('Penicillin [Drug]')).toBeInTheDocument();
      expect(screen.getByText('Peanuts [Food]')).toBeInTheDocument();
    });
  });

  test('adds allergy to store when selected', async () => {
    render(
      <ClinicalConfigProvider>
        <AllergiesForm />
      </ClinicalConfigProvider>,
    );

    const searchBox = screen.getByRole('combobox', {
      name: /search for allergies/i,
    });
    await userEvent.type(searchBox, 'pen');

    await waitFor(() => {
      expect(screen.getByText('Penicillin [Drug]')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Penicillin [Drug]'));

    expect(mockStore.addAllergy).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: '123',
        display: 'Penicillin',
        type: 'medication',
      }),
    );
  });

  test('handles API error gracefully', async () => {
    (
      bahmniServices.fetchAndFormatAllergenConcepts as jest.Mock
    ).mockRejectedValue(new Error('API Error'));

    render(
      <ClinicalConfigProvider>
        <AllergiesForm />
      </ClinicalConfigProvider>,
    );

    const searchBox = screen.getByRole('combobox', {
      name: /search for allergies/i,
    });
    await userEvent.type(searchBox, 'pen');

    await waitFor(() => {
      expect(
        screen.getByText(
          'An unexpected error occurred. Please try again later.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('full workflow: search, add, and remove allergy', async () => {
    render(
      <ClinicalConfigProvider>
        <AllergiesForm />
      </ClinicalConfigProvider>,
    );

    // Search and add allergy
    const searchBox = screen.getByRole('combobox', {
      name: /search for allergies/i,
    });
    await userEvent.type(searchBox, 'pen');

    await waitFor(() => {
      expect(screen.getByText('Penicillin [Drug]')).toBeInTheDocument();
    });

    // Mock the store to return the selected allergy after it's added
    (useAllergyStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      selectedAllergies: [
        {
          id: '123',
          display: 'Penicillin',
          type: 'medication',
          selectedSeverity: null,
          selectedReactions: [],
          errors: {},
          hasBeenValidated: false,
        },
      ],
    });

    await userEvent.click(screen.getByText('Penicillin [Drug]'));
    expect(mockStore.addAllergy).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: '123',
        display: 'Penicillin',
        type: 'medication',
      }),
    );

    // Re-render to show the selected allergy
    render(
      <ClinicalConfigProvider>
        <AllergiesForm />
      </ClinicalConfigProvider>,
    );

    // Remove allergy
    const removeButton = screen.getAllByRole('button', { name: /close/i });
    await userEvent.click(removeButton[0]);
    expect(mockStore.removeAllergy).toHaveBeenCalledWith('123');
  });
});
