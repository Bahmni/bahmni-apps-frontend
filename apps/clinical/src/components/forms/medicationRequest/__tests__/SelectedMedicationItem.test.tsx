import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Medication } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DURATION_UNIT_OPTIONS } from '../../../../constants/medications';
import { MedicationInputEntry } from '../../../../models/medication';
import { MedicationConfig } from '../../../../models/medicationConfig';
import {
  calculateTotalQuantity,
  getDefaultDosingUnit,
  getDefaultRoute,
} from '../../../../services/medicationsValueCalculator';
import SelectedMedicationItem, {
  SelectedMedicationItemProps,
} from '../SelectedMedicationItem';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getTodayDate: jest.fn().mockReturnValue(new Date('2025-01-01')),
}));

// Mock the services
jest.mock('../../../../services/medicationsValueCalculator', () => ({
  getDefaultRoute: jest.fn(),
  getDefaultDosingUnit: jest.fn(),
  calculateTotalQuantity: jest.fn(),
  isImmediateFrequency: jest
    .fn()
    .mockImplementation((frequency) => frequency.uuid === '0'),
}));

// Test data factories
const createMockMedication = (overrides = {}): Medication => ({
  id: 'test-med-1',
  resourceType: 'Medication',
  code: {
    text: 'Paracetamol 500mg',
    coding: [
      {
        code: 'paracetamol-500',
        display: 'Paracetamol 500mg',
        system: 'http://snomed.info/sct',
      },
    ],
  },
  form: {
    text: 'Tablet',
  },
  ...overrides,
});

const createMockMedicationInputEntry = (
  overrides = {},
): MedicationInputEntry => ({
  id: 'entry-1',
  medication: createMockMedication(),
  display: 'Paracetamol 500mg',
  dosage: 1,
  dosageUnit: null,
  frequency: null,
  route: null,
  duration: 5,
  durationUnit: null,
  instruction: null,
  isSTAT: false,
  isPRN: false,
  startDate: new Date('2025-01-01'),
  dispenseQuantity: 0,
  dispenseUnit: null,
  errors: {},
  hasBeenValidated: false,
  ...overrides,
});

const createMockMedicationConfig = (overrides = {}): MedicationConfig => ({
  doseUnits: [
    { uuid: 'mg-uuid', name: 'mg' },
    { uuid: 'ml-uuid', name: 'ml' },
  ],
  routes: [
    { uuid: 'oral-uuid', name: 'Oral' },
    { uuid: 'iv-uuid', name: 'IV' },
  ],
  frequencies: [
    { uuid: '0', name: 'Immediately', frequencyPerDay: 1 },
    { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
    { uuid: 'tds-uuid', name: 'TDS', frequencyPerDay: 3 },
  ],
  dosingInstructions: [
    { uuid: 'before-food', name: 'Before Food' },
    { uuid: 'after-food', name: 'After Food' },
  ],
  drugFormDefaults: {
    Tablet: { doseUnits: 'mg', route: 'Oral' },
  },
  durationUnits: [],
  dispensingUnits: [],
  dosingRules: [],
  orderAttributes: [],
  ...overrides,
});

// Helper function to create default props
const createDefaultProps = (overrides = {}): SelectedMedicationItemProps => ({
  medicationInputEntry: createMockMedicationInputEntry(),
  medicationConfig: createMockMedicationConfig(),
  updateDosage: jest.fn(),
  updateDosageUnit: jest.fn(),
  updateFrequency: jest.fn(),
  updateRoute: jest.fn(),
  updateDuration: jest.fn(),
  updateDurationUnit: jest.fn(),
  updateInstruction: jest.fn(),
  updateisPRN: jest.fn(),
  updateisSTAT: jest.fn(),
  updateStartDate: jest.fn(),
  updateDispenseQuantity: jest.fn(),
  updateDispenseUnit: jest.fn(),
  updateNote: jest.fn(),
  ...overrides,
});

describe('SelectedMedicationItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('default_dateFormat', 'dd/MM/yyyy');

    // Mock scrollIntoView which is not available in jsdom
    globalThis.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    test('renders medication display name correctly', () => {
      const props = createDefaultProps();

      render(<SelectedMedicationItem {...props} />);

      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    });

    test('renders all form controls', () => {
      const props = createDefaultProps();

      render(<SelectedMedicationItem {...props} />);

      expect(
        screen.getByRole('spinbutton', { name: /Dosage/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /Dosage Unit/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /Frequency/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /Route/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('spinbutton', { name: /Duration/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /Duration Unit/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /Instruction/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole('checkbox', { name: /STAT/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /PRN/i }),
      ).toBeInTheDocument();
    });

    test('displays total quantity calculation', () => {
      const props = createDefaultProps({
        medicationInputEntry: createMockMedicationInputEntry({
          dispenseQuantity: 30,
          dispenseUnit: { uuid: 'mg-uuid', name: 'mg' },
        }),
      });

      render(<SelectedMedicationItem {...props} />);

      expect(screen.getByText(/Total Quantity : 30 mg/i)).toBeInTheDocument();
    });
  });
  describe('User Interactions', () => {
    describe('Dosage Controls', () => {
      test('updates dosage when number input changes', async () => {
        const updateDosage = jest.fn();
        const props = createDefaultProps({ updateDosage });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);
        const dosageInput = screen.getByRole('spinbutton', { name: /Dosage/i });

        await user.clear(dosageInput);
        await user.type(dosageInput, '2');

        expect(updateDosage).toHaveBeenCalledWith('entry-1', 2);
      });

      test('handles invalid dosage input (non-numeric values)', async () => {
        const updateDosage = jest.fn();
        const props = createDefaultProps({ updateDosage });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);
        const dosageInput = screen.getByRole('spinbutton', { name: /Dosage/i });

        // Clear and type non-numeric value
        await user.clear(dosageInput);
        // Carbon NumberInput will not allow typing non-numeric characters
        await user.type(dosageInput, 'abc');

        expect(updateDosage).not.toHaveBeenCalledWith('entry-1', NaN);
      });

      test('prevents negative dosage values', async () => {
        const updateDosage = jest.fn();
        const props = createDefaultProps({ updateDosage });

        render(<SelectedMedicationItem {...props} />);
        const dosageInput = screen.getByRole('spinbutton', { name: /Dosage/i });

        expect(dosageInput).toHaveAttribute('min', '0');
      });
    });

    describe('Dropdown Selections', () => {
      test('updates dosage unit and dispense unit when unit dropdown changes', async () => {
        const updateDosageUnit = jest.fn();
        const updateDispenseUnit = jest.fn();
        const props = createDefaultProps({
          updateDosageUnit,
          updateDispenseUnit,
        });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);

        // Click on the dosage unit dropdown
        const unitDropdown = screen.getByRole('combobox', {
          name: /Dosage Unit/i,
        });
        await user.click(unitDropdown);

        // Find and click the 'ml' option
        const mlOption = await screen.findByRole('option', { name: 'ml' });
        await user.click(mlOption);

        expect(updateDosageUnit).toHaveBeenCalledWith('entry-1', {
          uuid: 'ml-uuid',
          name: 'ml',
        });
        expect(updateDispenseUnit).toHaveBeenCalledWith('entry-1', {
          uuid: 'ml-uuid',
          name: 'ml',
        });
      });

      test('updates frequency when frequency dropdown changes', async () => {
        const updateFrequency = jest.fn();
        const props = createDefaultProps({ updateFrequency });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);

        // Click on the frequency dropdown
        const frequencyDropdown = screen.getByRole('combobox', {
          name: /Frequency/i,
        });
        await user.click(frequencyDropdown);

        // Find and click the 'BD' option
        const bdOption = await screen.findByRole('option', { name: 'BD' });
        await user.click(bdOption);

        expect(updateFrequency).toHaveBeenCalledWith('entry-1', {
          uuid: 'bd-uuid',
          name: 'BD',
          frequencyPerDay: 2,
        });
      });

      test('updates route when route dropdown changes', async () => {
        const updateRoute = jest.fn();
        const props = createDefaultProps({ updateRoute });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);

        // Click on the route dropdown
        const routeDropdown = screen.getByRole('combobox', { name: /Route/i });
        await user.click(routeDropdown);

        // Find and click the 'IV' option
        const ivOption = await screen.findByRole('option', { name: 'IV' });
        await user.click(ivOption);

        expect(updateRoute).toHaveBeenCalledWith('entry-1', {
          uuid: 'iv-uuid',
          name: 'IV',
        });
      });

      test('updates duration unit when duration unit dropdown changes', async () => {
        const updateDurationUnit = jest.fn();
        const props = createDefaultProps({ updateDurationUnit });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);

        const durationUnitDropdown = screen.getByRole('combobox', {
          name: /Duration Unit/i,
        });
        await user.click(durationUnitDropdown);

        const daysOption = await screen.findByRole('option', { name: 'Days' });
        await user.click(daysOption);

        expect(updateDurationUnit).toHaveBeenCalledWith(
          'entry-1',
          DURATION_UNIT_OPTIONS[2],
        );
      });

      test('updates instruction when instruction dropdown changes', async () => {
        const updateInstruction = jest.fn();
        const props = createDefaultProps({ updateInstruction });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);

        // Wait for component to mount and useEffect hooks to complete
        await waitFor(() => {
          expect(
            screen.getByRole('combobox', { name: /Instruction/i }),
          ).toBeInTheDocument();
        });

        // Click on the instruction dropdown and select option
        await act(async () => {
          const instructionDropdown = screen.getByRole('combobox', {
            name: /Instruction/i,
          });
          await user.click(instructionDropdown);

          // Find and click the 'Before Food' option
          const beforeFoodOption = await screen.findByRole('option', {
            name: 'Before Food',
          });
          await user.click(beforeFoodOption);
        });

        await waitFor(() => {
          expect(updateInstruction).toHaveBeenCalledWith('entry-1', {
            uuid: 'before-food',
            name: 'Before Food',
          });
        });
      });
    });

    describe('Checkbox Interactions', () => {
      test('toggles STAT checkbox', async () => {
        const updateisSTAT = jest.fn();
        const props = createDefaultProps({ updateisSTAT });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);
        const statCheckbox = screen.getByRole('checkbox', { name: /STAT/i });
        await user.click(statCheckbox);

        expect(updateisSTAT).toHaveBeenCalledWith('entry-1', true);
      });

      test('toggles PRN checkbox', async () => {
        const updateisPRN = jest.fn();
        const props = createDefaultProps({ updateisPRN });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);
        const prnCheckbox = screen.getByRole('checkbox', { name: /PRN/i });
        await user.click(prnCheckbox);

        expect(updateisPRN).toHaveBeenCalledWith('entry-1', true);
      });
    });

    describe('Other Controls', () => {
      test('updates duration when number input changes', async () => {
        const updateDuration = jest.fn();
        const props = createDefaultProps({ updateDuration });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);
        const durationInput = screen.getByRole('spinbutton', {
          name: /Duration/i,
        });
        await user.clear(durationInput);
        await user.type(durationInput, '10');

        expect(updateDuration).toHaveBeenCalledWith('entry-1', 10);
      });

      test('updates start date when date picker changes', async () => {
        const updateStartDate = jest.fn();
        const props = createDefaultProps({ updateStartDate });
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);
        const dateInput = screen.getByTestId(
          'medication-start-date-input-entry-1',
        );

        // Click on the date input to open the calendar
        await user.click(dateInput);

        // Type a new date
        await user.clear(dateInput);
        await user.type(dateInput, '15/02/2025');

        // Press Enter to confirm the date selection
        await user.keyboard('{Enter}');

        await waitFor(() => {
          expect(updateStartDate).toHaveBeenCalledWith(
            'entry-1',
            expect.any(Date),
          );
          const callDate = updateStartDate.mock.calls[0][1];
          expect(callDate.getFullYear()).toBe(2025);
          expect(callDate.getMonth()).toBe(1); // February is month 1 (0-indexed)
          expect(callDate.getDate()).toBe(15);
        });
      });

      test('disables date picker when STAT is selected', async () => {
        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            isSTAT: true,
            isPRN: false,
          }),
        });

        render(<SelectedMedicationItem {...props} />);
        const dateInput = screen.getByTestId(
          'medication-start-date-input-entry-1',
        );

        expect(dateInput).toBeDisabled();
      });
    });
  });

  describe('Business Logic & Effects', () => {
    describe('Default Values', () => {
      describe('Default Instruction', () => {
        test('sets default instruction from config when instruction is not set', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: 'Before Food',
            dosingInstructions: [
              { uuid: 'before-food', name: 'Before Food' },
              { uuid: 'after-food', name: 'After Food' },
            ],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              instruction: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateInstruction).toHaveBeenCalledWith('entry-1', {
            uuid: 'before-food',
            name: 'Before Food',
          });
        });

        test('does not set default instruction when instruction already exists', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: 'Before Food',
            dosingInstructions: [
              { uuid: 'before-food', name: 'Before Food' },
              { uuid: 'after-food', name: 'After Food' },
            ],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              instruction: { uuid: 'after-food', name: 'After Food' },
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateInstruction).not.toHaveBeenCalled();
        });

        test('does not set default instruction when config is missing', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: undefined,
            dosingInstructions: [{ uuid: 'before-food', name: 'Before Food' }],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              instruction: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateInstruction).not.toHaveBeenCalled();
        });

        test('does not set default instruction when dosingInstructions is empty', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: 'Before Food',
            dosingInstructions: [],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              instruction: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateInstruction).not.toHaveBeenCalled();
        });

        test('does not set default instruction when default instruction not found in list', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: 'Non-existent Instruction',
            dosingInstructions: [
              { uuid: 'before-food', name: 'Before Food' },
              { uuid: 'after-food', name: 'After Food' },
            ],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              instruction: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateInstruction).not.toHaveBeenCalled();
        });
      });

      describe('Default Duration Unit', () => {
        test('sets default duration unit from config when duration unit is not set', () => {
          const updateDurationUnit = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultDurationUnit: 'd',
            durationUnits: [
              { uuid: 'days-uuid', name: 'Days' },
              { uuid: 'weeks-uuid', name: 'Weeks' },
            ],
          });
          const props = createDefaultProps({
            updateDurationUnit,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              durationUnit: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateDurationUnit).toHaveBeenCalledWith(
            'entry-1',
            DURATION_UNIT_OPTIONS[2],
          );
        });

        test('does not set default duration unit when duration unit already exists', () => {
          const updateDurationUnit = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultDurationUnit: 'd',
            durationUnits: [
              { uuid: 'days-uuid', name: 'Days' },
              { uuid: 'weeks-uuid', name: 'Weeks' },
            ],
          });
          const props = createDefaultProps({
            updateDurationUnit,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              durationUnit: DURATION_UNIT_OPTIONS[3], // Weeks
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateDurationUnit).not.toHaveBeenCalled();
        });

        test('does not set default duration unit when config is missing', () => {
          const updateDurationUnit = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultDurationUnit: undefined,
            durationUnits: [{ uuid: 'days-uuid', name: 'Days' }],
          });
          const props = createDefaultProps({
            updateDurationUnit,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              durationUnit: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateDurationUnit).not.toHaveBeenCalled();
        });

        test('does not set default duration unit when durationUnits is empty', () => {
          const updateDurationUnit = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultDurationUnit: 'd', // Using code instead of display
            durationUnits: [],
          });
          const props = createDefaultProps({
            updateDurationUnit,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              durationUnit: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateDurationUnit).not.toHaveBeenCalled();
        });

        test('does not set default duration unit when default unit not found in DURATION_UNIT_OPTIONS', () => {
          const updateDurationUnit = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultDurationUnit: 'Non-existent Unit',
            durationUnits: [{ uuid: 'days-uuid', name: 'Days' }],
          });
          const props = createDefaultProps({
            updateDurationUnit,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              durationUnit: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateDurationUnit).not.toHaveBeenCalled();
        });

        test('handles different duration unit codes correctly', () => {
          const updateDurationUnit = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultDurationUnit: 'wk',
            durationUnits: [
              { uuid: 'days-uuid', name: 'Days' },
              { uuid: 'weeks-uuid', name: 'Weeks' },
            ],
          });
          const props = createDefaultProps({
            updateDurationUnit,
            medicationConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              durationUnit: null,
            }),
          });

          render(<SelectedMedicationItem {...props} />);

          expect(updateDurationUnit).toHaveBeenCalledWith(
            'entry-1',
            DURATION_UNIT_OPTIONS[3],
          );
        });
      });

      describe('Default Values on Config Change', () => {
        test('sets both default instruction and duration unit when config changes', async () => {
          const updateInstruction = jest.fn();
          const updateDurationUnit = jest.fn();
          const initialConfig = createMockMedicationConfig({
            defaultInstructions: undefined,
            defaultDurationUnit: undefined,
          });
          const props = createDefaultProps({
            updateInstruction,
            updateDurationUnit,
            medicationConfig: initialConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              instruction: null,
              durationUnit: null,
            }),
          });

          const { rerender } = render(<SelectedMedicationItem {...props} />);

          // Update config with defaults
          const updatedConfig = createMockMedicationConfig({
            defaultInstructions: 'Before Food',
            defaultDurationUnit: 'd',
            dosingInstructions: [{ uuid: 'before-food', name: 'Before Food' }],
            durationUnits: [{ uuid: 'days-uuid', name: 'Days' }],
          });

          await act(async () => {
            rerender(
              <SelectedMedicationItem
                {...props}
                medicationConfig={updatedConfig}
              />,
            );
          });

          await waitFor(() => {
            expect(updateInstruction).toHaveBeenCalledWith('entry-1', {
              uuid: 'before-food',
              name: 'Before Food',
            });
            expect(updateDurationUnit).toHaveBeenCalledWith(
              'entry-1',
              DURATION_UNIT_OPTIONS[2], // Days
            );
          });
        });

        test('does not override existing values when config changes', async () => {
          const updateInstruction = jest.fn();
          const updateDurationUnit = jest.fn();
          const initialConfig = createMockMedicationConfig();
          const props = createDefaultProps({
            updateInstruction,
            updateDurationUnit,
            medicationConfig: initialConfig,
            medicationInputEntry: createMockMedicationInputEntry({
              instruction: { uuid: 'existing', name: 'Existing Instruction' },
              durationUnit: DURATION_UNIT_OPTIONS[1], // Hours
            }),
          });

          const { rerender } = render(<SelectedMedicationItem {...props} />);

          // Update config with defaults
          const updatedConfig = createMockMedicationConfig({
            defaultInstructions: 'Before Food',
            defaultDurationUnit: 'Days',
          });

          await act(async () => {
            rerender(
              <SelectedMedicationItem
                {...props}
                medicationConfig={updatedConfig}
              />,
            );
          });

          await waitFor(() => {
            expect(updateInstruction).not.toHaveBeenCalled();
            expect(updateDurationUnit).not.toHaveBeenCalled();
          });
        });
      });

      test('sets default route based on medication form', () => {
        const updateRoute = jest.fn();
        const updateDosageUnit = jest.fn();
        const updateDispenseUnit = jest.fn();
        const medication = createMockMedication({ form: { text: 'Tablet' } });
        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            medication,
            route: null,
            dosageUnit: null,
          }),
          updateRoute,
          updateDosageUnit,
          updateDispenseUnit,
        });
        (getDefaultRoute as jest.Mock).mockReturnValue({
          uuid: 'oral-uuid',
          name: 'Oral',
        });
        (getDefaultDosingUnit as jest.Mock).mockReturnValue({
          uuid: 'mg-uuid',
          name: 'mg',
        });

        render(<SelectedMedicationItem {...props} />);

        expect(updateRoute).toHaveBeenCalledWith('entry-1', {
          uuid: 'oral-uuid',
          name: 'Oral',
        });
        expect(updateDosageUnit).toHaveBeenCalledWith('entry-1', {
          uuid: 'mg-uuid',
          name: 'mg',
        });
        expect(updateDispenseUnit).toHaveBeenCalledWith('entry-1', {
          uuid: 'mg-uuid',
          name: 'mg',
        });
      });

      test('does not set defaults when medication has no form', () => {
        const updateRoute = jest.fn();
        const updateDosageUnit = jest.fn();
        const medication = createMockMedication({ form: undefined });
        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            medication,
            route: null,
            dosageUnit: null,
          }),
          updateRoute,
          updateDosageUnit,
        });
        (getDefaultRoute as jest.Mock).mockReturnValue(undefined);
        (getDefaultDosingUnit as jest.Mock).mockReturnValue(undefined);

        render(<SelectedMedicationItem {...props} />);

        expect(updateRoute).not.toHaveBeenCalled();
        expect(updateDosageUnit).not.toHaveBeenCalled();
      });

      test('does not override existing values with defaults', () => {
        const updateRoute = jest.fn();
        const updateDosageUnit = jest.fn();
        const existingRoute = { uuid: 'iv-uuid', name: 'IV' };
        const existingUnit = { uuid: 'ml-uuid', name: 'ml' };
        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            route: existingRoute,
            dosageUnit: existingUnit,
          }),
          updateRoute,
          updateDosageUnit,
        });

        render(<SelectedMedicationItem {...props} />);

        expect(updateRoute).not.toHaveBeenCalled();
        expect(updateDosageUnit).not.toHaveBeenCalled();
      });
    });

    describe('Total Quantity Calculation', () => {
      test('updates dispense quantity when dosage, frequency, duration change', () => {
        const updateDispenseQuantity = jest.fn();
        (calculateTotalQuantity as jest.Mock).mockReturnValue(20);

        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            dosage: 2,
            frequency: { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
            duration: 5,
            durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
          }),
          updateDispenseQuantity,
        });

        render(<SelectedMedicationItem {...props} />);

        expect(calculateTotalQuantity).toHaveBeenCalled();
        expect(updateDispenseQuantity).toHaveBeenCalledWith('entry-1', 20);
      });

      test('updates dispense quantity when calculation returns 0', () => {
        const updateDispenseQuantity = jest.fn();
        (calculateTotalQuantity as jest.Mock).mockReturnValue(0);

        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            dosage: 0,
            frequency: { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
            duration: 5,
            durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
          }),
          updateDispenseQuantity,
        });

        render(<SelectedMedicationItem {...props} />);

        expect(calculateTotalQuantity).toHaveBeenCalled();
        expect(updateDispenseQuantity).toHaveBeenCalledWith('entry-1', 0);
      });

      test('updates dispense quantity for immediate frequency', () => {
        const updateDispenseQuantity = jest.fn();
        (calculateTotalQuantity as jest.Mock).mockReturnValue(5);

        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            dosage: 5,
            frequency: { uuid: '0', name: 'Immediately', frequencyPerDay: 1 },
            duration: 10,
            durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
          }),
          updateDispenseQuantity,
        });

        render(<SelectedMedicationItem {...props} />);

        expect(calculateTotalQuantity).toHaveBeenCalled();
        expect(updateDispenseQuantity).toHaveBeenCalledWith('entry-1', 5);
      });

      test('calculates total quantity when duration is 0', () => {
        const updateDispenseQuantity = jest.fn();
        (calculateTotalQuantity as jest.Mock).mockReturnValue(0);

        const durationUnit = { code: 'd', display: 'Days', daysMultiplier: 1 };
        const frequency = { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 };

        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            dosage: 2,
            frequency,
            duration: 0,
            durationUnit,
          }),
          updateDispenseQuantity,
        });

        render(<SelectedMedicationItem {...props} />);
        expect(calculateTotalQuantity).toHaveBeenCalledWith(
          2,
          frequency,
          0,
          durationUnit,
        );
        expect(updateDispenseQuantity).toHaveBeenCalledWith('entry-1', 0);
      });
    });

    describe('STAT/PRN Logic', () => {
      test('when STAT is selected without PRN', () => {
        const updateFrequency = jest.fn();
        const updateStartDate = jest.fn();
        const updateDuration = jest.fn();
        const updateDurationUnit = jest.fn();
        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            isSTAT: true,
            isPRN: false,
          }),
          updateFrequency,
          updateStartDate,
          updateDuration,
          updateDurationUnit,
        });

        render(<SelectedMedicationItem {...props} />);

        expect(updateFrequency).toHaveBeenCalledWith('entry-1', {
          uuid: '0',
          name: 'Immediately',
          frequencyPerDay: 1,
        });
        expect(updateStartDate).toHaveBeenCalledWith(
          'entry-1',
          expect.any(Date),
        );
        expect(updateDuration).not.toHaveBeenCalled();
        expect(updateDurationUnit).not.toHaveBeenCalled();
      });

      test('disables controls when STAT is selected without PRN', () => {
        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            isSTAT: true,
            isPRN: false,
          }),
        });

        render(<SelectedMedicationItem {...props} />);

        expect(
          screen.getByRole('combobox', { name: /Frequency/i }),
        ).toBeDisabled();
        expect(
          screen.getByRole('spinbutton', { name: /Duration/i }),
        ).toBeDisabled();
        expect(
          screen.getByRole('combobox', { name: /Duration Unit/i }),
        ).toBeDisabled();
        expect(
          screen.getByTestId('medication-start-date-input-entry-1'),
        ).toBeDisabled();
      });

      test('clears frequency when PRN is selected', () => {
        const updateFrequency = jest.fn();
        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({ isPRN: true }),
          updateFrequency,
        });

        render(<SelectedMedicationItem {...props} />);

        expect(updateFrequency).toHaveBeenCalledWith('entry-1', null);
      });

      test('does not set immediate frequency when both STAT and PRN are selected', () => {
        const updateFrequency = jest.fn();
        const props = createDefaultProps({
          medicationInputEntry: createMockMedicationInputEntry({
            isSTAT: true,
            isPRN: true,
          }),
          updateFrequency,
        });

        render(<SelectedMedicationItem {...props} />);

        expect(updateFrequency).toHaveBeenCalledWith('entry-1', null);
      });
      test('sets immediate frequency, start date, and preserves duration when STAT is true and PRN is false', () => {
        const updateFrequency = jest.fn();
        const updateStartDate = jest.fn();
        const updateDuration = jest.fn();
        const updateDurationUnit = jest.fn();

        const immediateFrequency = {
          uuid: '0',
          name: 'Immediately',
          frequencyPerDay: 1,
        };
        const mockConfig = createMockMedicationConfig({
          frequencies: [
            immediateFrequency,
            { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
            { uuid: 'tds-uuid', name: 'TDS', frequencyPerDay: 3 },
          ],
        });

        const props = createDefaultProps({
          updateFrequency,
          updateStartDate,
          updateDuration,
          updateDurationUnit,
          medicationConfig: mockConfig,
          medicationInputEntry: createMockMedicationInputEntry({
            isSTAT: true,
            isPRN: false,
            frequency: { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
            duration: 7,
            durationUnit: DURATION_UNIT_OPTIONS[2], // Days
          }),
        });

        render(<SelectedMedicationItem {...props} />);

        expect(updateFrequency).toHaveBeenCalledWith(
          'entry-1',
          immediateFrequency,
        );

        expect(updateStartDate).toHaveBeenCalledWith(
          'entry-1',
          expect.any(Date),
        );
        expect(updateDuration).not.toHaveBeenCalled();
        expect(updateDurationUnit).not.toHaveBeenCalled();
      });

      test('does not update frequency if immediate frequency is not found in config', () => {
        const updateFrequency = jest.fn();
        const updateStartDate = jest.fn();
        const updateDuration = jest.fn();
        const updateDurationUnit = jest.fn();

        // Config without immediate frequency
        const mockConfig = createMockMedicationConfig({
          frequencies: [
            { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
            { uuid: 'tds-uuid', name: 'TDS', frequencyPerDay: 3 },
          ],
        });

        const props = createDefaultProps({
          updateFrequency,
          updateStartDate,
          updateDuration,
          updateDurationUnit,
          medicationConfig: mockConfig,
          medicationInputEntry: createMockMedicationInputEntry({
            isSTAT: true,
            isPRN: false,
          }),
        });

        render(<SelectedMedicationItem {...props} />);

        // Should not call updateFrequency since immediate frequency is not found
        expect(updateFrequency).not.toHaveBeenCalled();

        // But should still update start date
        expect(updateStartDate).toHaveBeenCalledWith(
          'entry-1',
          expect.any(Date),
        );
        expect(updateDuration).not.toHaveBeenCalled();
        expect(updateDurationUnit).not.toHaveBeenCalled();
      });

      test('preserves duration and recalculates total quantity when STAT is toggled on then off', async () => {
        const updateFrequency = jest.fn();
        const updateStartDate = jest.fn();
        const updateDuration = jest.fn();
        const updateDurationUnit = jest.fn();
        const updateDispenseQuantity = jest.fn();

        const duration = 7;
        const durationUnit = DURATION_UNIT_OPTIONS[2]; // Days
        const bdFrequency = { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 };
        const immediateFrequency = {
          uuid: '0',
          name: 'Immediately',
          frequencyPerDay: 1,
        };

        (calculateTotalQuantity as jest.Mock).mockReturnValue(28);

        const baseProps = createDefaultProps({
          updateFrequency,
          updateStartDate,
          updateDuration,
          updateDurationUnit,
          updateDispenseQuantity,
        });

        // Step 1: initial render — STAT off, duration=7
        const { rerender } = render(
          <SelectedMedicationItem
            {...baseProps}
            medicationInputEntry={createMockMedicationInputEntry({
              isSTAT: false,
              isPRN: false,
              duration,
              durationUnit,
              frequency: bdFrequency,
            })}
          />,
        );

        // Step 2: STAT on — parent updates entry with isSTAT=true
        await act(async () => {
          rerender(
            <SelectedMedicationItem
              {...baseProps}
              medicationInputEntry={createMockMedicationInputEntry({
                isSTAT: true,
                isPRN: false,
                duration,
                durationUnit,
                frequency: immediateFrequency,
              })}
            />,
          );
        });

        // Step 3: STAT off — parent clears frequency but duration stays unchanged
        await act(async () => {
          rerender(
            <SelectedMedicationItem
              {...baseProps}
              medicationInputEntry={createMockMedicationInputEntry({
                isSTAT: false,
                isPRN: false,
                duration,
                durationUnit,
                frequency: null,
              })}
            />,
          );
        });

        expect(updateDuration).not.toHaveBeenCalled();
        expect(updateDurationUnit).not.toHaveBeenCalled();

        // the preserved duration (not 0 or undefined)
        await waitFor(() => {
          expect(calculateTotalQuantity).toHaveBeenCalledWith(
            expect.anything(),
            null,
            duration,
            durationUnit,
          );
          expect(updateDispenseQuantity).toHaveBeenCalledWith('entry-1', 28);
        });
      });
    });

    describe('Frequency Filtering', () => {
      test('filters out immediate frequency from dropdown', async () => {
        const props = createDefaultProps();
        const user = userEvent.setup();

        render(<SelectedMedicationItem {...props} />);
        const frequencyDropdown = screen.getByRole('combobox', {
          name: /Frequency/i,
        });
        await user.click(frequencyDropdown);

        expect(
          screen.queryByRole('option', { name: 'Immediately' }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'BD' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'TDS' })).toBeInTheDocument();
      });
    });
  });

  describe('Validation & Error Handling', () => {
    test('shows invalid state for inputs with errors', () => {
      const props = createDefaultProps({
        medicationInputEntry: createMockMedicationInputEntry({
          errors: {
            dosage: 'INPUT_VALUE_REQUIRED',
            dosageUnit: 'DROPDOWN_VALUE_REQUIRED',
            frequency: 'DROPDOWN_VALUE_REQUIRED',
            route: 'DROPDOWN_VALUE_REQUIRED',
            duration: 'INPUT_VALUE_REQUIRED',
            durationUnit: 'DROPDOWN_VALUE_REQUIRED',
          },
        }),
      });

      render(<SelectedMedicationItem {...props} />);

      // Check that error messages are displayed
      expect(screen.getAllByText('Please enter a value')).toHaveLength(2);
      expect(screen.getAllByText('Please select a value')).toHaveLength(4); // For dosage unit, duration unit, and frequency
      expect(
        screen
          .getByRole('combobox', { name: /Route/i })
          .closest('.cds--dropdown'),
      ).toHaveAttribute('data-invalid', 'true');
      expect(
        screen
          .getByRole('combobox', { name: /Dosage Unit/i })
          .closest('.cds--dropdown'),
      ).toHaveAttribute('data-invalid', 'true');
      expect(
        screen
          .getByRole('combobox', { name: /Frequency/i })
          .closest('.cds--dropdown'),
      ).toHaveAttribute('data-invalid', 'true');
    });
  });

  describe('Edge Cases', () => {
    test('handles missing medication config gracefully', () => {
      const props = createDefaultProps({
        medicationConfig: {
          ...createMockMedicationConfig(),
          drugFormDefaults: undefined,
          routes: undefined,
          doseUnits: undefined,
        },
      });

      expect(() => render(<SelectedMedicationItem {...props} />)).not.toThrow();
    });

    test('handles medication without form information', () => {
      const updateRoute = jest.fn();
      const medication = createMockMedication({ form: undefined });
      const props = createDefaultProps({
        medicationInputEntry: createMockMedicationInputEntry({ medication }),
        updateRoute,
      });

      render(<SelectedMedicationItem {...props} />);

      expect(updateRoute).not.toHaveBeenCalled();
    });

    test('handles null values gracefully', () => {
      const props = createDefaultProps({
        medicationInputEntry: createMockMedicationInputEntry({
          dosageUnit: null,
          frequency: null,
          route: null,
          durationUnit: null,
          instruction: null,
        }),
      });

      expect(() => render(<SelectedMedicationItem {...props} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const props = createDefaultProps();

      const { container } = render(<SelectedMedicationItem {...props} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('all form controls have proper labels', () => {
      const props = createDefaultProps();

      render(<SelectedMedicationItem {...props} />);

      expect(
        screen.getByRole('spinbutton', { name: /Dosage/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /Dosage Unit/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /Frequency/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /STAT/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /PRN/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    test('matches snapshot with default props', () => {
      const props = createDefaultProps();

      const { container } = render(<SelectedMedicationItem {...props} />);

      expect(container).toMatchSnapshot();
    });

    test('matches snapshot with errors', () => {
      const props = createDefaultProps({
        medicationInputEntry: createMockMedicationInputEntry({
          errors: {
            dosage: 'INPUT_VALUE_REQUIRED',
            dosageUnit: 'DROPDOWN_VALUE_REQUIRED',
            frequency: 'DROPDOWN_VALUE_REQUIRED',
            route: 'DROPDOWN_VALUE_REQUIRED',
            duration: 'INPUT_VALUE_REQUIRED',
            durationUnit: 'DROPDOWN_VALUE_REQUIRED',
          },
        }),
      });

      const { container } = render(<SelectedMedicationItem {...props} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Date Picker Validation', () => {
    test('prevents selection of past dates in date picker', async () => {
      const updateStartDate = jest.fn();
      const props = createDefaultProps({ updateStartDate });
      const user = userEvent.setup();

      render(<SelectedMedicationItem {...props} />);
      const dateInput = screen.getByTestId(
        'medication-start-date-input-entry-1',
      );

      // Try to enter a past date
      await user.click(dateInput);
      await user.clear(dateInput);
      await user.type(dateInput, '1/1/2020');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(updateStartDate).not.toHaveBeenCalled();
      });
    });

    test('allows selection of today and future dates', async () => {
      const updateStartDate = jest.fn();
      const props = createDefaultProps({ updateStartDate });
      const user = userEvent.setup();

      // Get tomorrow's date in d/m/Y format (matching dd/MM/yyyy locale)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day = tomorrow.getDate();
      const month = tomorrow.getMonth() + 1;
      const year = tomorrow.getFullYear();
      const tomorrowString = `${day}/${month}/${year}`;

      render(<SelectedMedicationItem {...props} />);
      const dateInput = screen.getByTestId(
        'medication-start-date-input-entry-1',
      );

      await user.click(dateInput);
      await user.clear(dateInput);
      await user.type(dateInput, tomorrowString);
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(updateStartDate).toHaveBeenCalledWith(
          'entry-1',
          expect.any(Date),
        );
        const callDate = updateStartDate.mock.calls[0][1];
        expect(callDate.getFullYear()).toBe(tomorrow.getFullYear());
        expect(callDate.getMonth()).toBe(tomorrow.getMonth());
        expect(callDate.getDate()).toBe(tomorrow.getDate());
      });
    });
  });
});
