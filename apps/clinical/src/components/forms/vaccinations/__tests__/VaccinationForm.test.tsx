import { getVaccinations } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Medication } from 'fhir/r4';
import useMedicationConfig from '../../../../hooks/useMedicationConfig';
import { MedicationInputEntry } from '../../../../models/medication';
import { MedicationConfig } from '../../../../models/medicationConfig';
import { useVaccinationStore } from '../../../../stores/vaccinationsStore';
import VaccinationForm from '../VaccinationForm';

jest.mock('../../../../stores/vaccinationsStore');
jest.mock('../../../../hooks/useMedicationConfig');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVaccinations: jest.fn(),
}));
jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: jest.fn(
    (medication) =>
      medication?.code?.text ?? medication?.code?.display ?? 'Test Vaccination',
  ),
  getMedicationsFromBundle: jest.fn(
    (bundle) => bundle?.entry?.map((e: any) => e.resource) ?? [],
  ),
}));
jest.mock('../styles/VaccinationForm.module.scss', () => ({
  vaccinationFormTile: 'vaccinationFormTile',
  vaccinationFormTitle: 'vaccinationFormTitle',
  vaccinationBox: 'vaccinationBox',
  selectedVaccinationItem: 'selectedVaccinationItem',
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
  updateisPRN: jest.fn(),
  updateisSTAT: jest.fn(),
  updateDispenseQuantity: jest.fn(),
  updateDispenseUnit: jest.fn(),
  updateStartDate: jest.fn(),
  updateNote: jest.fn(),
  validateAllVaccinations: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(),
};
const mockMedicationConfigHook = {
  medicationConfig: mockMedicationConfig,
  loading: false,
  error: null,
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
    (useMedicationConfig as jest.Mock).mockReturnValue(
      mockMedicationConfigHook,
    );
    (getVaccinations as jest.Mock).mockResolvedValue(mockVaccinationBundle);
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
      (useMedicationConfig as jest.Mock).mockReturnValue({
        ...mockMedicationConfigHook,
        loading: true,
      });
      render(<VaccinationForm />, { wrapper: createWrapper() });
      expect(document.querySelector('.cds--skeleton')).toBeInTheDocument();
    });
    test('shows error when medication config fails to load', () => {
      const error = new Error('Failed to load vaccination config');
      (useMedicationConfig as jest.Mock).mockReturnValue({
        ...mockMedicationConfigHook,
        loading: false,
        error,
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
      (getVaccinations as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      );
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
      (getVaccinations as jest.Mock).mockRejectedValue(error);
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
      (getVaccinations as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
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
      (getVaccinations as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: mockVaccination }, { resource: hepatitisVaccine }],
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
      (getVaccinations as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: mockVaccination }, { resource: secondVaccination }],
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
  describe('Edge Cases', () => {
    test('handles missing medication config gracefully', () => {
      (useMedicationConfig as jest.Mock).mockReturnValue({
        medicationConfig: null,
        loading: false,
        error: null,
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
      (getVaccinations as jest.Mock).mockResolvedValue(null);
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
