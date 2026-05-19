import {
  getConfig,
  fetchMedicationOrdersMetadata,
  getVaccinations,
} from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReactNode } from 'react';
import { useMedicationSearch } from '../../../../hooks/useMedicationSearch';
import MedicationRequestForm from '../MedicationRequestForm';
import { useMedicationRequestStore } from '../store';
import {
  makeMockStore,
  mockMedication,
  mockMedicationConfig,
  mockSelectedMedication,
  mockSelectedVaccination,
  mockTwoVaccinationBundle,
  mockVaccination,
  mockVaccinationBundle,
} from './__mocks__/MedicationRequestFormMocks';

expect.extend(toHaveNoViolations);

jest.mock('../store', () => ({
  useMedicationRequestStore: jest.fn(),
  getMedicationRequestStore: jest.fn(),
}));

jest.mock('../../../../hooks/useMedicationSearch');

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
  getVaccinations: jest.fn(),
  fetchMedicationOrdersMetadata: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: jest.fn(
    (medication) =>
      medication?.code?.text ?? medication?.code?.display ?? 'Unknown',
  ),
  getMedicationsFromBundle: jest.fn(
    (bundle) => bundle?.entry?.map((e: any) => e.resource) ?? [],
  ),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMedicationRequestStore = jest.mocked(useMedicationRequestStore);
const mockUseMedicationSearch = jest.mocked(useMedicationSearch);

Element.prototype.scrollIntoView = jest.fn();

const defaultQueryMock = ({ queryKey }: { queryKey: readonly unknown[] }) => {
  if (queryKey[0] === 'medicationConfig') {
    return { data: mockMedicationConfig, isLoading: false, error: null };
  }
  if (queryKey[0] === 'vaccinations') {
    return { data: mockVaccinationBundle, isLoading: false, error: null };
  }
  return { data: null, isLoading: false, error: null };
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

const vaccinationsConfig = {
  type: 'vaccinations',
  label: 'VACCINATION_FORM_TITLE',
} as any;

describe('MedicationRequestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('default_dateFormat', 'dd/MM/yyyy');
    mockUseMedicationRequestStore.mockReturnValue(makeMockStore() as any);
    mockUseMedicationSearch.mockReturnValue({
      searchResults: [],
      loading: false,
      error: null,
    });
    mockUseQuery.mockImplementation(defaultQueryMock as any);
    (getVaccinations as jest.Mock).mockResolvedValue(mockVaccinationBundle);
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  const renderForm = (inputControlConfig?: any) =>
    render(<MedicationRequestForm inputControlConfig={inputControlConfig} />, {
      wrapper: createWrapper(),
    });

  describe('Rendering', () => {
    it.each([
      ['medications', undefined, 'medications', 'Medications'],
      ['vaccinations', vaccinationsConfig, 'vaccinations', 'Vaccinations'],
    ])(
      'renders form tile, title, and combobox for %s',
      (_, inputControlConfig, inputControlType, expectedTitle) => {
        renderForm(inputControlConfig);
        expect(
          screen.getByTestId(`${inputControlType}-form-tile-test-id`),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(`${inputControlType}-form-title-test-id`),
        ).toBeInTheDocument();
        expect(screen.getByText(expectedTitle)).toBeInTheDocument();
        expect(
          screen.getByRole('combobox', {
            name: `${inputControlType}-search-combobox-aria-label`,
          }),
        ).toBeInTheDocument();
      },
    );

    it('renders translated custom label from inputControlConfig', () => {
      renderForm({ label: 'VACCINATION_FORM_TITLE' });
      expect(screen.getByText('Vaccinations')).toBeInTheDocument();
    });

    it('calls getConfig and fetchMedicationOrdersMetadata to build medication config', async () => {
      (getConfig as jest.Mock).mockResolvedValue({ doseUnits: [] });
      (fetchMedicationOrdersMetadata as jest.Mock).mockResolvedValue({
        frequencies: [],
      });
      mockUseQuery.mockImplementation(
        jest.requireActual('@tanstack/react-query').useQuery,
      );
      renderForm();
      await waitFor(() => {
        expect(
          screen.getByRole('combobox', {
            name: 'medications-search-combobox-aria-label',
          }),
        ).toBeInTheDocument();
      });
      expect(getConfig).toHaveBeenCalled();
      expect(fetchMedicationOrdersMetadata).toHaveBeenCalled();
    });
  });

  describe('Loading states', () => {
    it.each([
      ['medications', undefined, 'medications'],
      ['vaccinations', vaccinationsConfig, 'vaccinations'],
    ])(
      'shows loading skeleton and hides combobox when config is loading for %s',
      (_, inputControlConfig, inputControlType) => {
        mockUseQuery.mockImplementation(({ queryKey }: any) => {
          if (queryKey[0] === 'medicationConfig') {
            return { data: undefined, isLoading: true, error: null };
          }
          return defaultQueryMock({ queryKey }) as any;
        });
        renderForm(inputControlConfig);
        expect(
          screen.getByTestId(`${inputControlType}-loading-skeleton-test-id`),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', {
            name: `${inputControlType}-search-combobox-aria-label`,
          }),
        ).not.toBeInTheDocument();
      },
    );
  });

  describe('Error states', () => {
    it.each([
      [
        'medications',
        undefined,
        'medications',
        /error fetching medication configuration/i,
      ],
      [
        'vaccinations',
        vaccinationsConfig,
        'vaccinations',
        /error fetching vaccination configuration/i,
      ],
    ])(
      'shows config error and hides combobox when config fails for %s',
      (_, inputControlConfig, inputControlType, errorText) => {
        mockUseQuery.mockImplementation(({ queryKey }: any) => {
          if (queryKey[0] === 'medicationConfig') {
            return {
              data: undefined,
              isLoading: false,
              error: new Error('Config failed'),
            };
          }
          return defaultQueryMock({ queryKey }) as any;
        });
        renderForm(inputControlConfig);
        expect(
          screen.getByTestId(`${inputControlType}-config-error-test-id`),
        ).toBeInTheDocument();
        expect(screen.getByText(errorText)).toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', {
            name: `${inputControlType}-search-combobox-aria-label`,
          }),
        ).not.toBeInTheDocument();
      },
    );
  });

  describe('Search ComboBox dropdown states', () => {
    it.each([
      [
        'loading state',
        { searchResults: [], loading: true, error: null },
        /loading medications/i,
      ],
      [
        'error state',
        {
          searchResults: [],
          loading: false,
          error: new Error('Search failed'),
        },
        /error searching medications/i,
      ],
      [
        'no results',
        { searchResults: [], loading: false, error: null },
        /no matching medications found/i,
      ],
    ])(
      'shows %s in combobox dropdown when searching medications',
      async (_, hookResult, expectedText) => {
        const user = userEvent.setup();
        mockUseMedicationSearch.mockReturnValue(hookResult as any);
        renderForm();
        await user.type(
          screen.getByRole('combobox', {
            name: 'medications-search-combobox-aria-label',
          }),
          'test',
        );
        await waitFor(() => {
          expect(screen.getByText(expectedText)).toBeInTheDocument();
        });
      },
    );

    it.each([
      [
        'loading state',
        { data: undefined, isLoading: true, error: null },
        /loading vaccinations/i,
      ],
      [
        'error state',
        { data: undefined, isLoading: false, error: new Error('Fetch failed') },
        /error searching vaccinations/i,
      ],
      [
        'no results',
        { data: mockVaccinationBundle, isLoading: false, error: null },
        /no matching vaccinations found/i,
      ],
    ])(
      'shows %s in combobox dropdown when searching vaccinations',
      async (_, queryResult, expectedText) => {
        const user = userEvent.setup();
        mockUseQuery.mockImplementation(({ queryKey }: any) => {
          if (queryKey[0] === 'vaccinations') return queryResult;
          return defaultQueryMock({ queryKey }) as any;
        });
        renderForm(vaccinationsConfig);
        await user.type(
          screen.getByRole('combobox', {
            name: 'vaccinations-search-combobox-aria-label',
          }),
          'nonexistent',
        );
        await waitFor(() => {
          expect(screen.getByText(expectedText)).toBeInTheDocument();
        });
      },
    );

    it('filters vaccination list client-side by search term', async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return {
            data: mockTwoVaccinationBundle,
            isLoading: false,
            error: null,
          };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      renderForm(vaccinationsConfig);
      await user.type(
        screen.getByRole('combobox', {
          name: 'vaccinations-search-combobox-aria-label',
        }),
        'covid',
      );
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
        expect(
          screen.queryByText('Hepatitis B Vaccine'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Adding items', () => {
    it('adds medication when item clicked in search results', async () => {
      const user = userEvent.setup();
      const addItem = jest.fn();
      mockUseMedicationRequestStore.mockReturnValue(
        makeMockStore({ addItem }) as any,
      );
      mockUseMedicationSearch.mockReturnValue({
        searchResults: [mockMedication],
        loading: false,
        error: null,
      });
      renderForm();
      await user.type(
        screen.getByRole('combobox', {
          name: 'medications-search-combobox-aria-label',
        }),
        'paracetamol',
      );
      await waitFor(() =>
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Paracetamol 500mg'));
      await waitFor(() =>
        expect(addItem).toHaveBeenCalledWith(
          mockMedication,
          'Paracetamol 500mg',
        ),
      );
    });

    it('adds medication when item selected via keyboard', async () => {
      const user = userEvent.setup();
      const addItem = jest.fn();
      mockUseMedicationRequestStore.mockReturnValue(
        makeMockStore({ addItem }) as any,
      );
      mockUseMedicationSearch.mockReturnValue({
        searchResults: [mockMedication],
        loading: false,
        error: null,
      });
      renderForm();
      await user.type(
        screen.getByRole('combobox', {
          name: 'medications-search-combobox-aria-label',
        }),
        'paracetamol',
      );
      await waitFor(() =>
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument(),
      );
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      await waitFor(() => expect(addItem).toHaveBeenCalled());
    });

    it('adds vaccination when item clicked in search results', async () => {
      const user = userEvent.setup();
      const addItem = jest.fn();
      mockUseMedicationRequestStore.mockReturnValue(
        makeMockStore({ addItem }) as any,
      );
      renderForm(vaccinationsConfig);
      await user.type(
        screen.getByRole('combobox', {
          name: 'vaccinations-search-combobox-aria-label',
        }),
        'covid',
      );
      await waitFor(() =>
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('COVID-19 Vaccine'));
      await waitFor(() =>
        expect(addItem).toHaveBeenCalledWith(
          mockVaccination,
          'COVID-19 Vaccine',
        ),
      );
    });

    it('resets search after selecting vaccination to allow re-selection', async () => {
      const user = userEvent.setup();
      const addItem = jest.fn();
      mockUseMedicationRequestStore.mockReturnValue(
        makeMockStore({ addItem }) as any,
      );
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return {
            data: mockTwoVaccinationBundle,
            isLoading: false,
            error: null,
          };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      renderForm(vaccinationsConfig);
      const searchBox = screen.getByRole('combobox', {
        name: 'vaccinations-search-combobox-aria-label',
      });
      await user.type(searchBox, 'covid');
      await waitFor(() =>
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('COVID-19 Vaccine'));
      await waitFor(() => expect(addItem).toHaveBeenCalledTimes(1));
      await user.clear(searchBox);
      await user.type(searchBox, 'hepatitis');
      await waitFor(() =>
        expect(screen.getByText('Hepatitis B Vaccine')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Hepatitis B Vaccine'));
      await waitFor(() => expect(addItem).toHaveBeenCalledTimes(2));
    });
  });

  describe('Selected items section', () => {
    it.each([
      [
        'medications',
        undefined,
        'medications',
        mockSelectedMedication,
        'Added Medications',
        /Paracetamol 500mg/,
      ],
      [
        'vaccinations',
        vaccinationsConfig,
        'vaccinations',
        mockSelectedVaccination,
        'Added Vaccinations',
        /COVID-19 Vaccine/,
      ],
    ])(
      'shows selected items section with title and item testid for %s',
      (
        _,
        inputControlConfig,
        inputControlType,
        selectedItem,
        sectionTitle,
        itemDisplay,
      ) => {
        mockUseMedicationRequestStore.mockReturnValue(
          makeMockStore({ selectedMedicationRequests: [selectedItem] }) as any,
        );
        renderForm(inputControlConfig);
        expect(
          screen.getByTestId(
            `${inputControlType}-selected-item-${selectedItem.id}-test-id`,
          ),
        ).toBeInTheDocument();
        expect(screen.getByText(sectionTitle)).toBeInTheDocument();
        expect(screen.getByText(itemDisplay)).toBeInTheDocument();
      },
    );

    it.each([
      ['medications', undefined, /added medications/i],
      ['vaccinations', vaccinationsConfig, /added vaccinations/i],
    ])(
      'does not show selected section when no items for %s',
      (_, inputControlConfig, sectionTitle) => {
        renderForm(inputControlConfig);
        expect(screen.queryByText(sectionTitle)).not.toBeInTheDocument();
      },
    );

    it.each([
      ['medications', undefined, mockSelectedMedication],
      ['vaccinations', vaccinationsConfig, mockSelectedVaccination],
    ])(
      'removes item when close button is clicked for %s',
      async (_, inputControlConfig, selectedItem) => {
        const user = userEvent.setup();
        const removeItem = jest.fn();
        mockUseMedicationRequestStore.mockReturnValue(
          makeMockStore({
            selectedMedicationRequests: [selectedItem],
            removeItem,
          }) as any,
        );
        renderForm(inputControlConfig);
        await user.click(screen.getByRole('button', { name: /close/i }));
        await waitFor(() =>
          expect(removeItem).toHaveBeenCalledWith(selectedItem.id),
        );
      },
    );
  });

  describe('Snapshots', () => {
    it.each([
      ['medications form with no selected items', undefined, []],
      [
        'medications form with selected items',
        undefined,
        [mockSelectedMedication],
      ],
      ['vaccinations form with no selected items', vaccinationsConfig, []],
      [
        'vaccinations form with selected items',
        vaccinationsConfig,
        [mockSelectedVaccination],
      ],
    ])(
      'matches snapshot for %s',
      (_, inputControlConfig, selectedMedicationRequests) => {
        mockUseMedicationRequestStore.mockReturnValue(
          makeMockStore({ selectedMedicationRequests }) as any,
        );
        const { container } = renderForm(inputControlConfig);
        expect(container).toMatchSnapshot();
      },
    );
  });

  describe('Accessibility', () => {
    it.each([
      ['medications form with no selected items', undefined, []],
      [
        'vaccinations form with selected items',
        vaccinationsConfig,
        [mockSelectedVaccination],
      ],
    ])(
      'has no accessibility violations for %s',
      async (_, inputControlConfig, selectedMedicationRequests) => {
        mockUseMedicationRequestStore.mockReturnValue(
          makeMockStore({ selectedMedicationRequests }) as any,
        );
        const { container } = renderForm(inputControlConfig);
        await act(async () => {});
        expect(await axe(container)).toHaveNoViolations();
      },
    );
  });
});
