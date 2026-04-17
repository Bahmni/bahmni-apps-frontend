import { useQuery } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useClinicalConfig } from '../../../../providers/clinicalConfig';
import ImmunizationHistoryForm from '../ImmunizationHistoryForm';
import { useImmunizationHistoryStore } from '../stores';
import {
  mockClinicalConfigContext,
  mockImmunizationEntry,
  mockLocations,
  mockMixedVaccinationBundle,
  mockRoutesValueSet,
  mockSitesValueSet,
  mockStore,
  mockVaccinationBundle,
  mockVaccineValueSet,
} from './__mocks__/immunizationHistoryMocks';

jest.mock('../stores');
jest.mock('../../../../providers/clinicalConfig', () => ({
  useClinicalConfig: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

expect.extend(toHaveNoViolations);

const mockUseQuery = jest.mocked(useQuery);

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
  return { data: undefined, isLoading: false, error: null };
};

describe('ImmunizationHistoryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useImmunizationHistoryStore).mockReturnValue(mockStore);
    jest.mocked(useClinicalConfig).mockReturnValue(mockClinicalConfigContext);
    mockUseQuery.mockImplementation(defaultQueryMock as any);
  });

  describe('Rendering', () => {
    it('renders form title and search combobox', () => {
      render(<ImmunizationHistoryForm />);
      expect(screen.getByText('Immunization History')).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /search to add immunization/i }),
      ).toBeInTheDocument();
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
        render(<ImmunizationHistoryForm />);
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
      render(<ImmunizationHistoryForm />);
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
        render(<ImmunizationHistoryForm />);
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
        render(<ImmunizationHistoryForm />);
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
      render(<ImmunizationHistoryForm />);
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
      render(<ImmunizationHistoryForm />);
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
      render(<ImmunizationHistoryForm />);
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
      render(<ImmunizationHistoryForm />);
      expect(screen.getByText('Added Immunization')).toBeInTheDocument();
      expect(
        screen.getByTestId(
          `immunization-drug-name-${mockImmunizationEntry.id}-test-id`,
        ),
      ).toBeInTheDocument();
    });

    it('does not show BoxWHeader when no immunizations selected', () => {
      render(<ImmunizationHistoryForm />);
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
      render(<ImmunizationHistoryForm />);
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
      render(<ImmunizationHistoryForm />);
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
      render(<ImmunizationHistoryForm />);
      await user.click(screen.getByTestId('selected-item-close-button'));
      await waitFor(() => {
        expect(mockStore.removeImmunization).toHaveBeenCalledWith(
          mockImmunizationEntry.id,
        );
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
      const { container } = render(<ImmunizationHistoryForm />);
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
      const { container } = render(<ImmunizationHistoryForm />);
      await act(async () => {});
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
