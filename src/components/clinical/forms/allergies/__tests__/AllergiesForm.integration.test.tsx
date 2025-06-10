import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';
import { NotificationProvider } from '@providers/NotificationProvider';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import AllergiesForm from '../AllergiesForm';
import { useAllergyStore } from '@stores/allergyStore';
import * as api from '@services/api';
import { ALLERGEN_TYPES } from '@constants/concepts';
import { Coding } from 'fhir/r4';

// Mock hooks and services
jest.mock('@services/api');
jest.mock('@stores/allergyStore');
jest.mock('@hooks/useClinicalConfig');
jest.mock('@services/notificationService', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
  notificationService: {
    register: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
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

    // Mock the API responses for ValueSet endpoints
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('ValueSet/162552')) {
        // Medication allergens - using new expansion.contains format
        return Promise.resolve({
          resourceType: 'ValueSet',
          expansion: {
            timestamp: '2025-06-10T04:02:11+00:00',
            contains: [
              {
                code: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Parent concept - will be filtered out
                display: 'Reference application common drug allergens',
                system: 'http://snomed.info/sct',
              },
              {
                code: '123',
                display: 'Penicillin',
                system: 'http://snomed.info/sct',
              },
              {
                code: 'inactive-med',
                display: 'Inactive Medication',
                system: 'http://snomed.info/sct',
                inactive: true, // Will be filtered out
              },
            ],
          },
        });
      } else if (url.includes('ValueSet/162553')) {
        // Food allergens - using new expansion.contains format
        return Promise.resolve({
          resourceType: 'ValueSet',
          expansion: {
            timestamp: '2025-06-10T04:02:11+00:00',
            contains: [
              {
                code: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Parent concept - will be filtered out
                display: 'Food allergens parent concept',
                system: 'http://snomed.info/sct',
              },
              {
                code: '456',
                display: 'Peanuts',
                system: 'http://snomed.info/sct',
              },
            ],
          },
        });
      } else if (url.includes('ValueSet/162554')) {
        // Environment allergens - using new expansion.contains format
        return Promise.resolve({
          resourceType: 'ValueSet',
          expansion: {
            timestamp: '2025-06-10T04:02:11+00:00',
            contains: [
              {
                code: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Parent concept - will be filtered out
                display: 'Environment allergens parent concept',
                system: 'http://snomed.info/sct',
              },
              {
                code: '789',
                display: 'Dust',
                system: 'http://snomed.info/sct',
              },
            ],
          },
        });
      } else if (url.includes('ValueSet/162555')) {
        // Reaction concepts - keeping old format as this endpoint hasn't changed
        return Promise.resolve({
          resourceType: 'ValueSet',
          compose: {
            include: [
              {
                concept: mockReactionConcepts,
              },
            ],
          },
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock the store
    (useAllergyStore as unknown as jest.Mock).mockReturnValue(mockStore);
    i18n.changeLanguage('en');
  });

  test('loads and displays allergens from API', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <NotificationProvider>
          <ClinicalConfigProvider>
            <AllergiesForm />
          </ClinicalConfigProvider>
        </NotificationProvider>
      </I18nextProvider>,
    );

    const searchBox = screen.getByRole('combobox', {
      name: /search for allergies/i,
    });
    await userEvent.type(searchBox, 'pen');

    await waitFor(() => {
      expect(screen.getByText('Penicillin [Medication]')).toBeInTheDocument();
      expect(screen.getByText('Peanuts [Food]')).toBeInTheDocument();
    });
  });

  test('adds allergy to store when selected', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <NotificationProvider>
          <ClinicalConfigProvider>
            <AllergiesForm />
          </ClinicalConfigProvider>
        </NotificationProvider>
      </I18nextProvider>,
    );

    const searchBox = screen.getByRole('combobox', {
      name: /search for allergies/i,
    });
    await userEvent.type(searchBox, 'pen');

    await waitFor(() => {
      expect(screen.getByText('Penicillin [Medication]')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Penicillin [Medication]'));

    expect(mockStore.addAllergy).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: '123',
        display: 'Penicillin',
        type: ALLERGEN_TYPES.MEDICATION.display,
      }),
    );
  });

  test('handles API error gracefully', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <I18nextProvider i18n={i18n}>
        <NotificationProvider>
          <ClinicalConfigProvider>
            <AllergiesForm />
          </ClinicalConfigProvider>
        </NotificationProvider>
      </I18nextProvider>,
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
      <I18nextProvider i18n={i18n}>
        <NotificationProvider>
          <ClinicalConfigProvider>
            <AllergiesForm />
          </ClinicalConfigProvider>
        </NotificationProvider>
      </I18nextProvider>,
    );

    // Search and add allergy
    const searchBox = screen.getByRole('combobox', {
      name: /search for allergies/i,
    });
    await userEvent.type(searchBox, 'pen');

    await waitFor(() => {
      expect(screen.getByText('Penicillin [Medication]')).toBeInTheDocument();
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

    await userEvent.click(screen.getByText('Penicillin [Medication]'));
    expect(mockStore.addAllergy).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: '123',
        display: 'Penicillin',
        type: ALLERGEN_TYPES.MEDICATION.display,
      }),
    );

    // Re-render to show the selected allergy
    render(
      <I18nextProvider i18n={i18n}>
        <NotificationProvider>
          <ClinicalConfigProvider>
            <AllergiesForm />
          </ClinicalConfigProvider>
        </NotificationProvider>
      </I18nextProvider>,
    );

    // Remove allergy
    const removeButton = screen.getAllByTestId('selected-item-close-button');
    await userEvent.click(removeButton[0]);
    expect(mockStore.removeAllergy).toHaveBeenCalledWith('123');
  });
});
