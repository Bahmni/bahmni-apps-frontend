import { getAvailableStocks, getUserLoginLocation } from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
  useQuery,
} from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useClinicalConfig } from '../../../../providers/clinicalConfig';
import ImmunizationHistoryForm from '../ImmunizationHistoryForm';
import { useImmunizationHistoryStore } from '../stores';
import {
  mockAdministrationInputControlConfig,
  mockAvailableStockResponse,
  mockClinicalConfigContext,
  mockFetchedMedication,
  mockImmunizationEntry,
  mockImmunizationEntryWithBasedOn,
  mockImmunizationInputControlConfig,
  mockImmunizationInputControlConfigWithFetchStockBatches,
  mockLocations,
  mockMedicationRequest,
  mockMixedVaccinationBundle,
  mockRoutesValueSet,
  mockSitesValueSet,
  mockStore,
  mockVaccinationBundle,
  mockVaccineValueSet,
} from './__mocks__/immunizationHistoryMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getAvailableStocks: jest.fn(),
  getUserLoginLocation: jest.fn(),
}));
jest.mock('../stores');
jest.mock('../../../../providers/clinicalConfig', () => ({
  useClinicalConfig: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueries: jest.fn(),
}));

const mockGetAvailableStocks = jest.mocked(getAvailableStocks);
const mockGetUserLoginLocation = jest.mocked(getUserLoginLocation);

expect.extend(toHaveNoViolations);

const mockUseQuery = jest.mocked(useQuery);
const mockUseQueries = jest.mocked(useQueries);

Element.prototype.scrollIntoView = jest.fn();

const defaultQueryMock = ({ queryKey }: { queryKey: readonly unknown[] }) => {
  if (queryKey[0] === 'vaccineConceptSetUuid') {
    return { data: mockVaccineValueSet, isLoading: false, error: null };
  }
  if (queryKey[0] === 'administeredLocationTag') {
    return { data: mockLocations, isLoading: false, error: null };
  }
  if (queryKey[0] === 'routesConceptSet') {
    return { data: mockRoutesValueSet, isLoading: false, error: null };
  }
  if (queryKey[0] === 'sitesConceptSet') {
    return { data: mockSitesValueSet, isLoading: false, error: null };
  }
  if (queryKey[0] === 'vaccinations') {
    return { data: mockVaccinationBundle, isLoading: false, error: null };
  }
  if (queryKey[0] === 'medication') {
    return { data: undefined, isLoading: false, error: null };
  }
  return { data: undefined, isLoading: false, error: null };
};

describe('ImmunizationHistoryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useImmunizationHistoryStore).mockReturnValue(mockStore);
    jest.mocked(useClinicalConfig).mockReturnValue(mockClinicalConfigContext);
    mockUseQuery.mockImplementation(defaultQueryMock as any);
    mockUseQueries.mockReturnValue([] as any);
    mockGetUserLoginLocation.mockReturnValue({
      uuid: 'loc-uuid',
      display: 'Login Location',
      name: 'Login Location',
    });
  });

  describe('Rendering', () => {
    it('renders form title and search combobox', () => {
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      expect(screen.getByText('Immunization History')).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /search to add immunization/i }),
      ).toBeInTheDocument();
    });

    it('hides search combobox when disableAdditionalAdministrations is true in metadata', () => {
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockAdministrationInputControlConfig}
        />,
      );
      expect(
        screen.queryByRole('combobox', { name: /search to add immunization/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it.each(['routesConceptSet', 'sitesConceptSet', 'administeredLocationTag'])(
      'when %s is loading: shows skeleton and hides BoxWHeader',
      (queryKey) => {
        jest.mocked(useImmunizationHistoryStore).mockReturnValue({
          ...mockStore,
          selectedImmunizations: [mockImmunizationEntry],
        });
        mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
          if (qk[0] === queryKey) {
            return { data: undefined, isLoading: true, error: null };
          }
          return defaultQueryMock({ queryKey: qk }) as any;
        });
        render(
          <ImmunizationHistoryForm
            encounterSessionStartContext={{}}
            inputControlConfig={mockImmunizationInputControlConfig}
          />,
        );
        expect(
          screen.getByTestId('immunization-history-loading-test-id'),
        ).toBeInTheDocument();
        expect(
          screen.queryByText('Added Immunization'),
        ).not.toBeInTheDocument();
      },
    );

    it('does not show loading skeleton when a concept set is loading but no immunizations are selected', () => {
      mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
        if (qk[0] === 'routesConceptSet') {
          return { data: undefined, isLoading: true, error: null };
        }
        return defaultQueryMock({ queryKey: qk }) as any;
      });
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      expect(
        screen.queryByTestId('immunization-history-loading-test-id'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Error states', () => {
    it.each(['routesConceptSet', 'sitesConceptSet', 'administeredLocationTag'])(
      'when %s errors: shows error message and hides BoxWHeader',
      (queryKey) => {
        jest.mocked(useImmunizationHistoryStore).mockReturnValue({
          ...mockStore,
          selectedImmunizations: [mockImmunizationEntry],
        });
        mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
          if (qk[0] === queryKey) {
            return {
              data: undefined,
              isLoading: false,
              error: new Error('Failed'),
            };
          }
          return defaultQueryMock({ queryKey: qk }) as any;
        });
        render(
          <ImmunizationHistoryForm
            encounterSessionStartContext={{}}
            inputControlConfig={mockImmunizationInputControlConfig}
          />,
        );
        expect(
          screen.getByTestId('immunization-history-error-test-id'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Error loading immunization details'),
        ).toBeInTheDocument();
        expect(
          screen.queryByText('Added Immunization'),
        ).not.toBeInTheDocument();
      },
    );
  });

  describe('Search ComboBox dropdown states', () => {
    it.each([
      [
        'loading state',
        { data: undefined, isLoading: true, error: null },
        /loading immunizations/i,
      ],
      [
        'error state',
        { data: undefined, isLoading: false, error: new Error('Failed') },
        /error searching immunizations/i,
      ],
      [
        'no results',
        {
          data: { resourceType: 'ValueSet', expansion: { contains: [] } },
          isLoading: false,
          error: null,
        },
        /no matching immunizations found/i,
      ],
    ])(
      'shows %s in combobox dropdown when searching',
      async (_, queryResult, expectedText) => {
        const user = userEvent.setup();
        mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
          if (qk[0] === 'vaccineConceptSetUuid') return queryResult;
          return defaultQueryMock({ queryKey: qk }) as any;
        });
        render(
          <ImmunizationHistoryForm
            encounterSessionStartContext={{}}
            inputControlConfig={mockImmunizationInputControlConfig}
          />,
        );
        await user.type(
          screen.getByRole('combobox', { name: /search to add immunization/i }),
          'test',
        );
        await waitFor(() => {
          expect(screen.getByText(expectedText)).toBeInTheDocument();
        });
      },
    );

    it('filters vaccine results by search term', async () => {
      const user = userEvent.setup();
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      await user.type(
        screen.getByRole('combobox', { name: /search to add immunization/i }),
        'covid',
      );
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
        expect(screen.queryByText('Influenza Vaccine')).not.toBeInTheDocument();
      });
    });
  });

  describe('Adding immunizations', () => {
    it('calls addImmunization with code and display when item selected', async () => {
      const user = userEvent.setup();
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      await user.type(
        screen.getByRole('combobox', { name: /search to add immunization/i }),
        'covid',
      );
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
      });
      await user.click(screen.getByText('COVID-19 Vaccine'));
      await waitFor(() => {
        expect(mockStore.addImmunization).toHaveBeenCalledWith({
          code: 'covid-19',
          display: 'COVID-19 Vaccine',
        });
      });
    });

    it('does not call addImmunization when selection is cleared', async () => {
      const user = userEvent.setup();
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      await user.type(
        screen.getByRole('combobox', { name: /search to add immunization/i }),
        'covid',
      );
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
      });
      await user.click(screen.getByText('COVID-19 Vaccine'));
      mockStore.addImmunization.mockClear();
      await user.click(
        screen.getByRole('button', { name: 'Clear selected item' }),
      );
      expect(mockStore.addImmunization).not.toHaveBeenCalled();
    });
  });

  describe('BoxWHeader and selected immunizations', () => {
    it('shows BoxWHeader with selected immunization items', () => {
      jest.mocked(useImmunizationHistoryStore).mockReturnValue({
        ...mockStore,
        selectedImmunizations: [mockImmunizationEntry],
      });
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      expect(screen.getByText('Added Immunization')).toBeInTheDocument();
      expect(
        screen.getByTestId(
          `immunization-drug-name-${mockImmunizationEntry.id}-test-id`,
        ),
      ).toBeInTheDocument();
    });

    it('does not show BoxWHeader when no immunizations selected', () => {
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      expect(screen.queryByText('Added Immunization')).not.toBeInTheDocument();
    });

    it.each([
      ['loading', { data: undefined, isLoading: true, error: null }],
      [
        'error',
        { data: undefined, isLoading: false, error: new Error('Failed') },
      ],
    ])('hides BoxWHeader when vaccinations is %s', (_, queryResult) => {
      jest.mocked(useImmunizationHistoryStore).mockReturnValue({
        ...mockStore,
        selectedImmunizations: [mockImmunizationEntry],
      });
      mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
        if (qk[0] === 'vaccinations') return queryResult;
        return defaultQueryMock({ queryKey: qk }) as any;
      });
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      expect(screen.queryByText('Added Immunization')).not.toBeInTheDocument();
    });

    it('filters out non-Medication entries from vaccineDrugs', async () => {
      const user = userEvent.setup();
      jest.mocked(useImmunizationHistoryStore).mockReturnValue({
        ...mockStore,
        selectedImmunizations: [mockImmunizationEntry],
      });
      mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
        if (qk[0] === 'vaccinations') {
          return {
            data: mockMixedVaccinationBundle,
            isLoading: false,
            error: null,
          };
        }
        return defaultQueryMock({ queryKey: qk }) as any;
      });
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      const drugCombobox = screen.getByPlaceholderText('Search drug name');
      await user.type(drugCombobox, 'Paracetamol');
      await waitFor(() => {
        expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      });
      await user.clear(drugCombobox);
      await user.type(drugCombobox, 'ShouldBeExcluded');
      await waitFor(() => {
        expect(screen.queryByText('ShouldBeExcluded')).not.toBeInTheDocument();
      });
    });

    it('calls removeImmunization when close button clicked', async () => {
      const user = userEvent.setup();
      jest.mocked(useImmunizationHistoryStore).mockReturnValue({
        ...mockStore,
        selectedImmunizations: [mockImmunizationEntry],
      });
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={mockImmunizationInputControlConfig}
        />,
      );
      await user.click(screen.getByTestId('selected-item-close-button'));
      await waitFor(() => {
        expect(mockStore.removeImmunization).toHaveBeenCalledWith(
          mockImmunizationEntry.id,
        );
      });
    });
  });

  describe('basedOn pre-population', () => {
    const consultationPayloadWithBasedOn = { basedOn: mockMedicationRequest };

    it.each([
      ['basedOn is absent', {}, () => {}],
      [
        'medication is loading',
        consultationPayloadWithBasedOn,
        () => {
          mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
            if (qk[0] === 'medication')
              return { data: undefined, isLoading: true, error: null };
            return defaultQueryMock({ queryKey: qk }) as any;
          });
        },
      ],
    ])('does not call addImmunization when %s', (_, payload, setupMocks) => {
      setupMocks();
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={payload}
          inputControlConfig={mockAdministrationInputControlConfig}
        />,
      );
      expect(mockStore.addImmunization).not.toHaveBeenCalled();
    });

    it('calls addImmunization with drug code from basedOnMedication', async () => {
      mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
        if (qk[0] === 'medication')
          return {
            data: mockFetchedMedication,
            isLoading: false,
            error: null,
          };
        return defaultQueryMock({ queryKey: qk }) as any;
      });
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={consultationPayloadWithBasedOn}
          inputControlConfig={mockAdministrationInputControlConfig}
        />,
      );
      await waitFor(() => {
        expect(mockStore.addImmunization).toHaveBeenCalledWith(
          { code: 'covid-19', display: 'COVID-19 Drug' },
          expect.objectContaining({
            drug: { code: 'covid-drug-uuid', display: 'COVID-19 Drug' },
          }),
        );
      });
    });

    it('calls addImmunization with administeredLocation and basedOnReference', async () => {
      mockGetUserLoginLocation.mockReturnValue({
        uuid: 'login-loc-uuid',
        display: 'Login Location',
        name: 'Login Location',
      });
      mockUseQuery.mockImplementation(({ queryKey: qk }: any) => {
        if (qk[0] === 'medication')
          return { data: mockFetchedMedication, isLoading: false, error: null };
        if (qk[0] === 'vaccinations')
          return { data: mockVaccinationBundle, isLoading: false, error: null };
        return defaultQueryMock({ queryKey: qk }) as any;
      });
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={consultationPayloadWithBasedOn}
          inputControlConfig={mockAdministrationInputControlConfig}
        />,
      );
      await waitFor(() => {
        expect(mockStore.addImmunization).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            administeredLocation: {
              uuid: 'login-loc-uuid',
              display: 'Login Location',
            },
            basedOnReference: 'med-request-uuid',
            administeredOn: expect.any(Date),
          }),
        );
      });
    });
  });

  describe('Stock batch queries', () => {
    it.each([
      [
        'no drug code or administered location set',
        mockImmunizationEntry,
        mockImmunizationInputControlConfig,
        ['availableStocks', undefined, undefined],
        false,
      ],
      [
        'drug code and administered location uuid set but fetchStockBatches absent',
        mockImmunizationEntryWithBasedOn,
        mockImmunizationInputControlConfig,
        ['availableStocks', 'covid-drug-uuid', 'location-uuid-1'],
        false,
      ],
      [
        'drug code and administered location uuid set and fetchStockBatches is true',
        mockImmunizationEntryWithBasedOn,
        mockImmunizationInputControlConfigWithFetchStockBatches,
        ['availableStocks', 'covid-drug-uuid', 'location-uuid-1'],
        true,
      ],
    ])(
      'calls useQueries with correct queryKey and enabled when %s',
      (_, immunization, config, expectedQueryKey, expectedEnabled) => {
        jest.mocked(useImmunizationHistoryStore).mockReturnValue({
          ...mockStore,
          selectedImmunizations: [immunization],
        });
        render(
          <ImmunizationHistoryForm
            encounterSessionStartContext={{}}
            inputControlConfig={config}
          />,
        );
        expect(mockUseQueries).toHaveBeenCalledWith(
          expect.objectContaining({
            queries: expect.arrayContaining([
              expect.objectContaining({
                queryKey: expectedQueryKey,
                enabled: expectedEnabled,
              }),
            ]),
          }),
        );
      },
    );

    it('calls getAvailableStocks with drug code and location uuid when enabled', async () => {
      mockUseQueries.mockImplementation(
        jest.requireActual('@tanstack/react-query').useQueries,
      );
      mockGetAvailableStocks.mockResolvedValue(mockAvailableStockResponse);
      jest.mocked(useImmunizationHistoryStore).mockReturnValue({
        ...mockStore,
        selectedImmunizations: [mockImmunizationEntryWithBasedOn],
      });
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={queryClient}>
          <ImmunizationHistoryForm
            encounterSessionStartContext={{}}
            inputControlConfig={
              mockImmunizationInputControlConfigWithFetchStockBatches
            }
          />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(mockGetAvailableStocks).toHaveBeenCalledWith(
          'covid-drug-uuid',
          'location-uuid-1',
        );
      });
    });

    it('passes availableStocks from useQueries to the batch number dropdown', async () => {
      const user = userEvent.setup();
      jest.mocked(useImmunizationHistoryStore).mockReturnValue({
        ...mockStore,
        selectedImmunizations: [mockImmunizationEntryWithBasedOn],
      });
      mockUseQueries.mockReturnValue([
        { data: mockAvailableStockResponse, isLoading: false, isError: false },
      ] as any);
      render(
        <ImmunizationHistoryForm
          encounterSessionStartContext={{}}
          inputControlConfig={{
            ...mockImmunizationInputControlConfig,
            attributes: [{ name: 'batchNumber', required: false }],
          }}
        />,
      );
      await user.click(screen.getByPlaceholderText('Enter batch number'));
      await waitFor(() => {
        expect(screen.getByText('BATCH-001')).toBeInTheDocument();
        expect(screen.getByText('BATCH-002')).toBeInTheDocument();
      });
    });
  });

  describe('Snapshots', () => {
    it.each([
      ['no immunizations', mockStore],
      [
        'selected immunizations',
        { ...mockStore, selectedImmunizations: [mockImmunizationEntry] },
      ],
    ])('matches snapshot with %s', (_, storeOverride) => {
      jest.mocked(useImmunizationHistoryStore).mockReturnValue(storeOverride);
      const { container } = render(
        <ImmunizationHistoryForm encounterSessionStartContext={{}} />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it.each([
      ['no immunizations', mockStore],
      [
        'selected immunizations',
        { ...mockStore, selectedImmunizations: [mockImmunizationEntry] },
      ],
    ])('has no accessibility violations with %s', async (_, storeOverride) => {
      jest.mocked(useImmunizationHistoryStore).mockReturnValue(storeOverride);
      const { container } = render(
        <ImmunizationHistoryForm encounterSessionStartContext={{}} />,
      );
      await act(async () => {});
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
