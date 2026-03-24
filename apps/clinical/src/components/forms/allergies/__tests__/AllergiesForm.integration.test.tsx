import * as bahmniServices from '@bahmni/services';
import { useHasPrivilege } from '@bahmni/widgets';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Coding } from 'fhir/r4';
import i18n from '../../../../../setupTests.i18n';
import { useClinicalConfig } from '../../../../providers/clinicalConfig';
import { useAllergyStore } from '../../../../stores/allergyStore';
import AllergiesForm from '../AllergiesForm';

jest.mock('../../../../stores/allergyStore');
jest.mock('../../../../providers/clinicalConfig');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchAndFormatAllergenConcepts: jest.fn(),
  fetchReactionConcepts: jest.fn(),
  getFormattedAllergies: jest.fn(() => Promise.resolve([])),
  getCurrentUserPrivileges: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({
    addNotification: jest.fn(),
  })),
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: [{ name: 'Add Allergies' }],
  })),
  useHasPrivilege: jest.fn(() => true),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

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

    mockUseClinicalConfig.mockReturnValue({
      clinicalConfig: mockClinicalConfig,
      isLoading: false,
      error: null,
    });

    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    (
      bahmniServices.fetchAndFormatAllergenConcepts as jest.Mock
    ).mockResolvedValue([
      { uuid: '123', display: 'Penicillin', type: 'medication' },
      { uuid: '456', display: 'Peanuts', type: 'food' },
      { uuid: '789', display: 'Dust', type: 'environment' },
    ]);

    (bahmniServices.fetchReactionConcepts as jest.Mock).mockResolvedValue(
      mockReactionConcepts,
    );

    jest.mocked(useHasPrivilege).mockReturnValue(true);
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
      expect(screen.getByText(/Penicillin/)).toBeInTheDocument();
      expect(screen.getByText(/Peanuts/)).toBeInTheDocument();
    });
  });

  test('adds allergy to store when selected', async () => {
    render(<AllergiesForm />);

    const searchBox = screen.getByRole('combobox', {
      name: /search for allergies/i,
    });
    await userEvent.type(searchBox, 'pen');

    await waitFor(() => {
      expect(screen.getByText(/Penicillin/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/Penicillin/));

    expect(mockStore.addAllergy).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: '123',
        display: 'Penicillin',
        type: 'medication',
      }),
    );
  });

  test('does not render and makes no API calls when user lacks Add Allergies privilege', () => {
    jest.mocked(useHasPrivilege).mockReturnValue(false);

    const { container } = render(<AllergiesForm />);

    expect(container).toBeEmptyDOMElement();
    expect(bahmniServices.getFormattedAllergies).not.toHaveBeenCalled();
  });

  test('handles API error gracefully', async () => {
    (
      bahmniServices.fetchAndFormatAllergenConcepts as jest.Mock
    ).mockRejectedValue(new Error('API Error'));

    render(<AllergiesForm />);

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
});
