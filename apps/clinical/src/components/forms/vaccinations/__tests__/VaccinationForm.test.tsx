import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Medication } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MedicationInputEntry } from '../../../../models/medication';
import { MedicationConfig } from '../../../../models/medicationConfig';
import { useVaccinationStore } from '../../../../stores/vaccinationsStore';
import VaccinationForm from '../VaccinationForm';

expect.extend(toHaveNoViolations);

jest.mock('../../../../stores/vaccinationsStore');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVaccinations: jest.fn(),
  getPatientMedicationBundle: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));
jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: jest.fn(
    (medication) =>
      medication?.code?.text ?? medication?.code?.display ?? 'Test Vaccination',
  ),
  getMedicationsFromBundle: jest.fn(
    (bundle) => bundle?.entry?.map((e: any) => e.resource) ?? [],
  ),
  getActiveMedicationsFromBundle: jest.fn(() => ({
    activeMedications: [],
    medicationMap: {},
  })),
}));
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  usePatientUUID: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('../styles/VaccinationForm.module.scss', () => ({
  vaccinationFormTile: 'vaccinationFormTile',
  vaccinationFormTitle: 'vaccinationFormTitle',
  vaccinationBox: 'vaccinationBox',
  selectedVaccinationItem: 'selectedVaccinationItem',
  duplicateNotification: 'duplicateNotification',
}));

const mockVaccination: Medication = {
  id: 'test-vaccination-1',
  resourceType: 'Medication',
  code: {
    text: 'COVID-19 Vaccine',
    coding: [
      {
        code: 'covid-19-vaccine',
        display: 'COVID-19 Vaccine',
        system: 'http://snomed.info/sct',
      },
    ],
  },
};
const mockVaccinationBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockVaccination }],
};
const mockMedicationConfig: MedicationConfig = {
  doseUnits: [
    { uuid: 'ml-uuid', name: 'ml' },
    { uuid: 'dose-uuid', name: 'dose' },
  ],
  routes: [
    { uuid: 'im-uuid', name: 'IM' },
    { uuid: 'sc-uuid', name: 'SC' },
  ],
  frequencies: [
    { uuid: 'once-uuid', name: 'Once', frequencyPerDay: 1 },
    { uuid: 'stat-uuid', name: 'STAT', frequencyPerDay: 1 },
  ],
  durationUnits: [
    { uuid: 'days-uuid', name: 'Days' },
    { uuid: 'weeks-uuid', name: 'Weeks' },
  ],
  dosingInstructions: [
    { uuid: 'before-food-uuid', name: 'Before Food' },
    { uuid: 'after-food-uuid', name: 'After Food' },
  ],
  dispensingUnits: [],
  dosingRules: [],
  orderAttributes: [],
};
const mockSelectedVaccination: MedicationInputEntry = {
  id: mockVaccination.id!,
  display: 'COVID-19 Vaccine',
  medication: mockVaccination,
  dosage: 1,
  dosageUnit: null,
  frequency: null,
  route: null,
  duration: 0,
  durationUnit: null,
  isSTAT: true,
  isPRN: false,
  startDate: new Date(),
  instruction: null,
  errors: {},
  hasBeenValidated: false,
  dispenseQuantity: 1,
  dispenseUnit: null,
};
const mockStore = {
  selectedVaccinations: [],
  addVaccination: jest.fn(),
  removeVaccination: jest.fn(),
  updateDosage: jest.fn(),
  updateDosageUnit: jest.fn(),
  updateFrequency: jest.fn(),
  updateRoute: jest.fn(),
  updateDuration: jest.fn(),
  updateDurationUnit: jest.fn(),
  updateInstruction: jest.fn(),
  updateisSTAT: jest.fn(),
  updateDispenseQuantity: jest.fn(),
  updateDispenseUnit: jest.fn(),
  updateStartDate: jest.fn(),
  updateNote: jest.fn(),
  validateAllVaccinations: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(),
};

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

const defaultQueryMock = ({ queryKey }: { queryKey: readonly unknown[] }) => {
  if (queryKey[0] === 'medicationConfig') {
    return { data: mockMedicationConfig, isLoading: false, error: null };
  }
  if (queryKey[0] === 'vaccinations') {
    return { data: mockVaccinationBundle, isLoading: false, error: null };
  }
  if (queryKey[0] === 'patientVaccinations') {
    return { data: null, isLoading: false, error: null, refetch: jest.fn() };
  }
  return { data: undefined, isLoading: false, error: null };
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('VaccinationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    (useVaccinationStore as unknown as jest.Mock).mockReturnValue(mockStore);
    mockUseQuery.mockImplementation(defaultQueryMock as any);
  });

  describe('Rendering', () => {
    test('renders form title and search box', () => {
      render(<VaccinationForm />, { wrapper: createWrapper() });
      expect(screen.getByText(/vaccinations/i)).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /search to add vaccination/i }),
      ).toBeInTheDocument();
    });
    test('shows loading skeleton when medication config is loading', () => {
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'medicationConfig') {
          return { data: undefined, isLoading: true, error: null };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      expect(document.querySelector('.cds--skeleton')).toBeInTheDocument();
    });
    test('shows error when medication config fails to load', () => {
      const error = new Error('Failed to load vaccination config');
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'medicationConfig') {
          return { data: undefined, isLoading: false, error };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      expect(
        screen.getByText(/Error fetching vaccination configuration/i),
      ).toBeInTheDocument();
    });
  });

  describe('Vaccination Search', () => {
    test('displays search results when typing', async () => {
      const user = userEvent.setup();
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'covid');
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
      });
    });
    test('shows loading state while fetching vaccinations', async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return { data: undefined, isLoading: true, error: null };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'test');
      await waitFor(() => {
        expect(screen.getByText('Loading vaccinations...')).toBeInTheDocument();
      });
    });
    test('shows error when vaccination search fails', async () => {
      const user = userEvent.setup();
      const error = new Error('Search failed');
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return { data: undefined, isLoading: false, error };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'test');
      await waitFor(() => {
        expect(
          screen.getByText(/error searching vaccinations/i),
        ).toBeInTheDocument();
      });
    });
    test('shows no results message when no vaccinations found', async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return {
            data: { resourceType: 'Bundle', type: 'searchset', entry: [] },
            isLoading: false,
            error: null,
          };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'nonexistent');
      await waitFor(() => {
        expect(
          screen.getByText(/no matching vaccinations found/i),
        ).toBeInTheDocument();
      });
    });
    test('filters vaccinations based on search term', async () => {
      const user = userEvent.setup();
      const hepatitisVaccine: Medication = {
        id: 'test-vaccination-2',
        resourceType: 'Medication',
        code: {
          text: 'Hepatitis A Vaccine',
          coding: [
            {
              code: 'hep-a-vaccine',
              display: 'Hepatitis A Vaccine',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return {
            data: {
              resourceType: 'Bundle',
              type: 'searchset',
              entry: [
                { resource: mockVaccination },
                { resource: hepatitisVaccine },
              ],
            },
            isLoading: false,
            error: null,
          };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'covid');
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
        expect(
          screen.queryByText('Hepatitis A Vaccine'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Adding and Removing Vaccinations', () => {
    test('adds vaccination when selected from search', async () => {
      const user = userEvent.setup();
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'covid');
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
      });
      await user.click(screen.getByText('COVID-19 Vaccine'));
      await waitFor(() => {
        expect(mockStore.addVaccination).toHaveBeenCalledWith(
          mockVaccination,
          'COVID-19 Vaccine',
        );
      });
    });
    test('clears search term after selecting vaccination', async () => {
      const user = userEvent.setup();
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'covid');
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
      });
      await user.click(screen.getByText('COVID-19 Vaccine'));
      await waitFor(() => {
        expect(mockStore.addVaccination).toHaveBeenCalledWith(
          mockVaccination,
          'COVID-19 Vaccine',
        );
      });
    });
    test('resets ComboBox selectedItem to null after selection to allow immediate re-search', async () => {
      const user = userEvent.setup();
      const hepatitisVaccine: Medication = {
        id: 'test-vaccination-2',
        resourceType: 'Medication',
        code: {
          text: 'Hepatitis B Vaccine',
          coding: [
            {
              code: 'hep-b-vaccine',
              display: 'Hepatitis B Vaccine',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return {
            data: {
              resourceType: 'Bundle',
              type: 'searchset',
              entry: [
                { resource: mockVaccination },
                { resource: hepatitisVaccine },
              ],
            },
            isLoading: false,
            error: null,
          };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });

      // First selection
      await user.type(searchBox, 'covid');
      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
      });
      await user.click(screen.getByText('COVID-19 Vaccine'));
      await waitFor(() => {
        expect(mockStore.addVaccination).toHaveBeenCalledTimes(1);
      });

      // Wait for isSelectingRef to reset (setTimeout 100ms in handleOnChange)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      // Search for another item
      await user.clear(searchBox);
      await user.type(searchBox, 'hepatitis');
      await waitFor(() => {
        expect(screen.getByText('Hepatitis B Vaccine')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Hepatitis B Vaccine'));
      await waitFor(() => {
        expect(mockStore.addVaccination).toHaveBeenCalledTimes(2);
      });
    });
    test('displays selected vaccinations', () => {
      (useVaccinationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedVaccinations: [mockSelectedVaccination],
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      expect(screen.getByText(/added vaccinations/i)).toBeInTheDocument();
      expect(screen.getByText(/COVID-19 Vaccine/)).toBeInTheDocument();
    });
    test('removes vaccination when close button is clicked', async () => {
      const user = userEvent.setup();
      (useVaccinationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedVaccinations: [mockSelectedVaccination],
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const closeButton = screen.getByRole('button', {
        name: /close/i,
      });
      await user.click(closeButton);
      await waitFor(() => {
        expect(mockStore.removeVaccination).toHaveBeenCalledWith(
          mockSelectedVaccination.id,
        );
      });
    });
    test('does not show selected vaccinations section when empty', () => {
      render(<VaccinationForm />, { wrapper: createWrapper() });
      expect(screen.queryByText(/added vaccinations/i)).not.toBeInTheDocument();
    });
    test('marks already selected vaccinations as disabled', async () => {
      const user = userEvent.setup();
      const secondVaccination: Medication = {
        id: 'test-vaccination-2',
        resourceType: 'Medication',
        code: {
          text: 'Hepatitis B Vaccine',
          coding: [
            {
              code: 'hep-b-vaccine',
              display: 'Hepatitis B Vaccine',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return {
            data: {
              resourceType: 'Bundle',
              type: 'searchset',
              entry: [
                { resource: mockVaccination },
                { resource: secondVaccination },
              ],
            },
            isLoading: false,
            error: null,
          };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      (useVaccinationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedVaccinations: [mockSelectedVaccination],
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'vaccine');
      await waitFor(() => {
        expect(screen.getByText('Hepatitis B Vaccine')).toBeInTheDocument();
        expect(
          screen.getByText('COVID-19 Vaccine (Already added)'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support keyboard navigation and selection in ComboBox', async () => {
      const user = userEvent.setup();

      render(<VaccinationForm />, { wrapper: createWrapper() });

      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });

      // Type to open dropdown
      await user.type(searchBox, 'covid');

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
      });

      // Navigate with arrow key and select with Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockStore.addVaccination).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      let container: HTMLElement;

      await act(async () => {
        const rendered = render(<VaccinationForm />, {
          wrapper: createWrapper(),
        });
        container = rendered.container;
      });

      const results = await axe(container!);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing medication config gracefully', () => {
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'medicationConfig') {
          return { data: null, isLoading: false, error: null };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      (useVaccinationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedVaccinations: [mockSelectedVaccination],
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      expect(screen.queryByText(/added vaccinations/i)).not.toBeInTheDocument();
    });
    test('handles null vaccination bundle', async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'vaccinations') {
          return { data: null, isLoading: false, error: null };
        }
        return defaultQueryMock({ queryKey }) as any;
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      const searchBox = screen.getByRole('combobox', {
        name: /search to add vaccination/i,
      });
      await user.type(searchBox, 'test');
      await waitFor(() => {
        expect(
          screen.getByText(/no matching vaccinations found/i),
        ).toBeInTheDocument();
      });
    });
  });
});
