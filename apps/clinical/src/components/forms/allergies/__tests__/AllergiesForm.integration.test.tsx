import * as bahmniServices from '@bahmni-frontend/bahmni-services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Coding } from 'fhir/r4';
import { ALLERGEN_TYPES } from '../.././../../constants/allergy';
import i18n from '../../../../../setupTests.i18n';
import { useClinicalConfig } from '../../../../hooks/useClinicalConfig';
import { ClinicalConfigProvider } from '../../../../providers/ClinicalConfigProvider';
import { useAllergyStore } from '../../../../stores/allergyStore';
import AllergiesForm from '../AllergiesForm';

// Mock hooks and services
jest.mock('../../../../stores/allergyStore');
jest.mock('../../../../hooks/useClinicalConfig');
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  fetchAndFormatAllergenConcepts: jest.fn(),
  fetchReactionConcepts: jest.fn(),
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
    validateAllAllergies: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
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
        type: ALLERGEN_TYPES.MEDICATION.display,
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
          type: ALLERGEN_TYPES.MEDICATION.display,
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
        type: ALLERGEN_TYPES.MEDICATION.display,
      }),
    );

    // Re-render to show the selected allergy
    render(
      <ClinicalConfigProvider>
        <AllergiesForm />
      </ClinicalConfigProvider>,
    );

    // Remove allergy
    const removeButton = screen.getAllByTestId('selected-item-close-button');
    await userEvent.click(removeButton[0]);
    expect(mockStore.removeAllergy).toHaveBeenCalledWith('123');
  });
});
