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
import SelectedVaccinationItem, {
  SelectedVaccinationItemProps,
} from '../SelectedVaccinationItem';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getTodayDate: jest.fn().mockReturnValue(new Date('2025-01-01')),
  DATE_PICKER_INPUT_FORMAT: 'd/m/Y',
}));

jest.mock('../../../../services/medicationsValueCalculator', () => ({
  getDefaultRoute: jest.fn(),
  getDefaultDosingUnit: jest.fn(),
  calculateTotalQuantity: jest.fn(),
  isImmediateFrequency: jest
    .fn()
    .mockImplementation((frequency) => frequency.uuid === '0'),
}));

jest.mock('../styles/SelectedVaccinationItem.module.scss', () => ({
  vaccinationTitle: 'vaccinationTitle',
  vaccineDetails: 'vaccineDetails',
  vaccinationActions: 'vaccinationActions',
  statControl: 'statControl',
  dosageControls: 'dosageControls',
  dosageInput: 'dosageInput',
  dosageUnit: 'dosageUnit',
  column: 'column',
  durationControls: 'durationControls',
  durationInput: 'durationInput',
  durationUnit: 'durationUnit',
  footerRow: 'footerRow',
}));

const createMockMedication = (overrides = {}): Medication => ({
  id: 'test-vac-1',
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
  form: {
    text: 'Injection',
  },
  ...overrides,
});

const createMockVaccinationInputEntry = (
  overrides = {},
): MedicationInputEntry => ({
  id: 'entry-1',
  medication: createMockMedication(),
  display: 'COVID-19 Vaccine',
  dosage: 1,
  dosageUnit: null,
  frequency: null,
  route: null,
  duration: 0,
  durationUnit: null,
  instruction: null,
  isSTAT: false,
  isPRN: false,
  startDate: new Date('2025-01-01'),
  dispenseQuantity: 0,
  dispenseUnit: null,
  note: '',
  errors: {},
  hasBeenValidated: false,
  ...overrides,
});

const createMockMedicationConfig = (overrides = {}): MedicationConfig => ({
  doseUnits: [
    { uuid: 'ml-uuid', name: 'ml' },
    { uuid: 'dose-uuid', name: 'dose' },
  ],
  routes: [
    { uuid: 'im-uuid', name: 'IM' },
    { uuid: 'sc-uuid', name: 'SC' },
  ],
  frequencies: [
    { uuid: '0', name: 'Immediately', frequencyPerDay: 1 },
    { uuid: 'once-uuid', name: 'Once', frequencyPerDay: 1 },
    { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
  ],
  dosingInstructions: [
    { uuid: 'left-arm', name: 'Left Arm' },
    { uuid: 'right-arm', name: 'Right Arm' },
  ],
  drugFormDefaults: {
    Injection: { doseUnits: 'ml', route: 'IM' },
  },
  durationUnits: [],
  dispensingUnits: [],
  dosingRules: [],
  orderAttributes: [],
  ...overrides,
});

const createDefaultProps = (overrides = {}): SelectedVaccinationItemProps => ({
  vaccinationInputEntry: createMockVaccinationInputEntry(),
  medicationConfig: createMockMedicationConfig(),
  updateDosage: jest.fn(),
  updateDosageUnit: jest.fn(),
  updateFrequency: jest.fn(),
  updateRoute: jest.fn(),
  updateDuration: jest.fn(),
  updateDurationUnit: jest.fn(),
  updateInstruction: jest.fn(),
  updateisSTAT: jest.fn(),
  updateStartDate: jest.fn(),
  updateDispenseQuantity: jest.fn(),
  updateDispenseUnit: jest.fn(),
  updateNote: jest.fn(),
  ...overrides,
});

describe('SelectedVaccinationItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  describe('Component Rendering', () => {
    test('renders vaccination display name correctly', () => {
      const props = createDefaultProps();
      render(<SelectedVaccinationItem {...props} />);
      expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
    });
    test('renders vaccination name and details when display includes parentheses', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          display: 'COVID-19 Vaccine (Pfizer-BioNTech)',
        }),
      });
      render(<SelectedVaccinationItem {...props} />);
      expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
      expect(screen.getByText('(Pfizer-BioNTech)')).toBeInTheDocument();
    });
    test('renders vaccination name without details when display has no parentheses', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          display: 'Hepatitis B Vaccine',
        }),
      });
      render(<SelectedVaccinationItem {...props} />);
      expect(screen.getByText('Hepatitis B Vaccine')).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });
    test('handles multiple parentheses in display name correctly', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          display: 'Vaccine Name (Detail 1) (Detail 2)',
        }),
      });
      render(<SelectedVaccinationItem {...props} />);
      expect(screen.getByText('Vaccine Name')).toBeInTheDocument();
      expect(screen.getByText('(Detail 1) (Detail 2)')).toBeInTheDocument();
    });
    test('displays total quantity without unit when dispenseUnit is null', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          dispenseQuantity: 5,
          dispenseUnit: null,
        }),
      });
      render(<SelectedVaccinationItem {...props} />);
      expect(screen.getByText(/Total quantity : 5/i)).toBeInTheDocument();
    });
    test('renders all form controls', () => {
      const props = createDefaultProps();
      render(<SelectedVaccinationItem {...props} />);
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
        screen.getByRole('combobox', { name: /Vaccination Instructions/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /STAT/i }),
      ).toBeInTheDocument();
    });
    test('displays total quantity calculation', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          dispenseQuantity: 2,
          dispenseUnit: { uuid: 'ml-uuid', name: 'ml' },
        }),
      });
      render(<SelectedVaccinationItem {...props} />);
      expect(screen.getByText(/Total quantity : 2 ml/i)).toBeInTheDocument();
    });
  });
  describe('Note Functionality', () => {
    test('shows "Add note" link when note is not present', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          note: '',
        }),
      });
      render(<SelectedVaccinationItem {...props} />);
      expect(screen.getByText('Add Note')).toBeInTheDocument();
      expect(
        screen.queryByTestId('vaccination-note-entry-1'),
      ).not.toBeInTheDocument();
    });
    test('shows note textarea when "Add note" link is clicked', async () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          note: '',
        }),
      });
      const user = userEvent.setup();
      render(<SelectedVaccinationItem {...props} />);
      const addNoteLink = screen.getByText('Add Note');
      await user.click(addNoteLink);
      await waitFor(() => {
        expect(
          screen.getByTestId('vaccination-note-entry-1'),
        ).toBeInTheDocument();
      });
    });
    test('updates note when text is entered', async () => {
      const updateNote = jest.fn();
      const props = createDefaultProps({
        updateNote,
        vaccinationInputEntry: createMockVaccinationInputEntry({
          note: '',
        }),
      });
      const user = userEvent.setup();
      render(<SelectedVaccinationItem {...props} />);
      const addNoteLink = screen.getByText('Add Note');
      await user.click(addNoteLink);
      const noteTextarea = await screen.findByTestId(
        'vaccination-note-entry-1',
      );
      await user.type(noteTextarea, 'Test note');
      await waitFor(() => {
        expect(updateNote).toHaveBeenCalled();
        expect(updateNote).toHaveBeenCalledWith('entry-1', expect.any(String));
        const calls = updateNote.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        expect(calls[0][0]).toBe('entry-1');
      });
    });
    test('clears note and hides textarea when close button is clicked', async () => {
      const updateNote = jest.fn();
      const props = createDefaultProps({
        updateNote,
        vaccinationInputEntry: createMockVaccinationInputEntry({
          note: 'Some note',
        }),
      });
      const user = userEvent.setup();
      render(<SelectedVaccinationItem {...props} />);
      const noteTextarea = screen.getByTestId('vaccination-note-entry-1');
      expect(noteTextarea).toBeInTheDocument();
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      await waitFor(() => {
        expect(updateNote).toHaveBeenCalledWith('entry-1', '');
        expect(
          screen.queryByTestId('vaccination-note-entry-1'),
        ).not.toBeInTheDocument();
      });
    });
  });
  describe('User Interactions', () => {
    describe('Dosage Controls', () => {
      test('updates dosage when number input changes', async () => {
        const updateDosage = jest.fn();
        const props = createDefaultProps({ updateDosage });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        const dosageInput = screen.getByRole('spinbutton', { name: /Dosage/i });
        await user.clear(dosageInput);
        await user.type(dosageInput, '2');
        expect(updateDosage).toHaveBeenCalledWith('entry-1', 2);
      });
      test('handles invalid dosage input (non-numeric values)', async () => {
        const updateDosage = jest.fn();
        const props = createDefaultProps({ updateDosage });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        const dosageInput = screen.getByRole('spinbutton', { name: /Dosage/i });
        await user.clear(dosageInput);
        await user.type(dosageInput, 'abc');
        expect(updateDosage).not.toHaveBeenCalledWith('entry-1', NaN);
      });
      test('prevents negative dosage values', () => {
        const props = createDefaultProps();
        render(<SelectedVaccinationItem {...props} />);
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
        render(<SelectedVaccinationItem {...props} />);
        const unitDropdown = screen.getByRole('combobox', {
          name: /Dosage Unit/i,
        });
        await user.click(unitDropdown);
        const doseOption = await screen.findByRole('option', { name: 'dose' });
        await user.click(doseOption);
        expect(updateDosageUnit).toHaveBeenCalledWith('entry-1', {
          uuid: 'dose-uuid',
          name: 'dose',
        });
        expect(updateDispenseUnit).toHaveBeenCalledWith('entry-1', {
          uuid: 'dose-uuid',
          name: 'dose',
        });
      });
      test('updates frequency when frequency dropdown changes', async () => {
        const updateFrequency = jest.fn();
        const props = createDefaultProps({ updateFrequency });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        const frequencyDropdown = screen.getByRole('combobox', {
          name: /Frequency/i,
        });
        await user.click(frequencyDropdown);
        const onceOption = await screen.findByRole('option', { name: 'Once' });
        await user.click(onceOption);
        expect(updateFrequency).toHaveBeenCalledWith('entry-1', {
          uuid: 'once-uuid',
          name: 'Once',
          frequencyPerDay: 1,
        });
      });
      test('updates route when route dropdown changes', async () => {
        const updateRoute = jest.fn();
        const props = createDefaultProps({ updateRoute });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        const routeDropdown = screen.getByRole('combobox', { name: /Route/i });
        await user.click(routeDropdown);
        const scOption = await screen.findByRole('option', { name: 'SC' });
        await user.click(scOption);
        expect(updateRoute).toHaveBeenCalledWith('entry-1', {
          uuid: 'sc-uuid',
          name: 'SC',
        });
      });
      test('updates duration unit when duration unit dropdown changes', async () => {
        const updateDurationUnit = jest.fn();
        const props = createDefaultProps({ updateDurationUnit });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        await waitFor(() => {
          expect(
            screen.getByRole('combobox', { name: /Duration Unit/i }),
          ).toBeInTheDocument();
        });
        await act(async () => {
          const durationUnitDropdown = screen.getByRole('combobox', {
            name: /Duration Unit/i,
          });
          await user.click(durationUnitDropdown);
          const daysOption = await screen.findByRole('option', {
            name: 'Days',
          });
          await user.click(daysOption);
        });
        await waitFor(() => {
          expect(updateDurationUnit).toHaveBeenCalledWith(
            'entry-1',
            DURATION_UNIT_OPTIONS[2],
          );
        });
      });
      test('updates instruction when instruction dropdown changes', async () => {
        const updateInstruction = jest.fn();
        const props = createDefaultProps({ updateInstruction });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        await waitFor(() => {
          expect(
            screen.getByRole('combobox', { name: /Vaccination Instructions/i }),
          ).toBeInTheDocument();
        });
        await act(async () => {
          const instructionDropdown = screen.getByRole('combobox', {
            name: /Vaccination Instructions/i,
          });
          await user.click(instructionDropdown);
          const leftArmOption = await screen.findByRole('option', {
            name: 'Left Arm',
          });
          await user.click(leftArmOption);
        });
        await waitFor(() => {
          expect(updateInstruction).toHaveBeenCalledWith('entry-1', {
            uuid: 'left-arm',
            name: 'Left Arm',
          });
        });
      });
    });
    describe('Checkbox Interactions', () => {
      test('toggles STAT checkbox', async () => {
        const updateisSTAT = jest.fn();
        const props = createDefaultProps({ updateisSTAT });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        const statCheckbox = screen.getByRole('checkbox', { name: /STAT/i });
        await user.click(statCheckbox);
        expect(updateisSTAT).toHaveBeenCalledWith('entry-1', true);
      });
    });
    describe('Other Controls', () => {
      test('updates duration when number input changes', async () => {
        const updateDuration = jest.fn();
        const props = createDefaultProps({ updateDuration });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        const durationInput = screen.getByRole('spinbutton', {
          name: /Duration/i,
        });
        await user.clear(durationInput);
        await user.type(durationInput, '7');
        expect(updateDuration).toHaveBeenCalledWith('entry-1', 7);
      });
      test('updates start date when date picker changes', async () => {
        const updateStartDate = jest.fn();
        const props = createDefaultProps({ updateStartDate });
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        const dateInput = screen.getByPlaceholderText('d/m/Y');
        await user.click(dateInput);
        await user.clear(dateInput);
        await user.type(dateInput, '15/02/2025');
        await user.keyboard('{Enter}');
        await waitFor(() => {
          expect(updateStartDate).toHaveBeenCalledWith(
            'entry-1',
            expect.any(Date),
          );
          const callDate = updateStartDate.mock.calls[0][1];
          expect(callDate.getFullYear()).toBe(2025);
          expect(callDate.getMonth()).toBe(1);
          expect(callDate.getDate()).toBe(15);
        });
      });
      test('disables date picker when STAT is selected', () => {
        const props = createDefaultProps({
          vaccinationInputEntry: createMockVaccinationInputEntry({
            isSTAT: true,
          }),
        });
        render(<SelectedVaccinationItem {...props} />);
        const dateInput = screen.getByPlaceholderText('d/m/Y');
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
            defaultInstructions: 'Left Arm',
            dosingInstructions: [
              { uuid: 'left-arm', name: 'Left Arm' },
              { uuid: 'right-arm', name: 'Right Arm' },
            ],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            vaccinationInputEntry: createMockVaccinationInputEntry({
              instruction: null,
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
          expect(updateInstruction).toHaveBeenCalledWith('entry-1', {
            uuid: 'left-arm',
            name: 'Left Arm',
          });
        });
        test('does not set default instruction when instruction already exists', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: 'Left Arm',
            dosingInstructions: [
              { uuid: 'left-arm', name: 'Left Arm' },
              { uuid: 'right-arm', name: 'Right Arm' },
            ],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            vaccinationInputEntry: createMockVaccinationInputEntry({
              instruction: { uuid: 'right-arm', name: 'Right Arm' },
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
          expect(updateInstruction).not.toHaveBeenCalled();
        });
        test('does not set default instruction when config is missing', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: undefined,
            dosingInstructions: [{ uuid: 'left-arm', name: 'Left Arm' }],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            vaccinationInputEntry: createMockVaccinationInputEntry({
              instruction: null,
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
          expect(updateInstruction).not.toHaveBeenCalled();
        });
        test('does not set default instruction when dosingInstructions is empty', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: 'Left Arm',
            dosingInstructions: [],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            vaccinationInputEntry: createMockVaccinationInputEntry({
              instruction: null,
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
          expect(updateInstruction).not.toHaveBeenCalled();
        });
        test('does not set default instruction when default instruction not found in list', () => {
          const updateInstruction = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultInstructions: 'Non-existent Instruction',
            dosingInstructions: [
              { uuid: 'left-arm', name: 'Left Arm' },
              { uuid: 'right-arm', name: 'Right Arm' },
            ],
          });
          const props = createDefaultProps({
            updateInstruction,
            medicationConfig,
            vaccinationInputEntry: createMockVaccinationInputEntry({
              instruction: null,
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
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
            vaccinationInputEntry: createMockVaccinationInputEntry({
              durationUnit: null,
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
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
            vaccinationInputEntry: createMockVaccinationInputEntry({
              durationUnit: DURATION_UNIT_OPTIONS[3],
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
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
            vaccinationInputEntry: createMockVaccinationInputEntry({
              durationUnit: null,
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
          expect(updateDurationUnit).not.toHaveBeenCalled();
        });
        test('does not set default duration unit when durationUnits is empty', () => {
          const updateDurationUnit = jest.fn();
          const medicationConfig = createMockMedicationConfig({
            defaultDurationUnit: 'd',
            durationUnits: [],
          });
          const props = createDefaultProps({
            updateDurationUnit,
            medicationConfig,
            vaccinationInputEntry: createMockVaccinationInputEntry({
              durationUnit: null,
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
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
            vaccinationInputEntry: createMockVaccinationInputEntry({
              durationUnit: null,
            }),
          });
          render(<SelectedVaccinationItem {...props} />);
          expect(updateDurationUnit).not.toHaveBeenCalled();
        });
      });
      test('sets default route based on medication form', () => {
        const updateRoute = jest.fn();
        const updateDosageUnit = jest.fn();
        const updateDispenseUnit = jest.fn();
        const medication = createMockMedication({
          form: { text: 'Injection' },
        });
        const props = createDefaultProps({
          vaccinationInputEntry: createMockVaccinationInputEntry({
            medication,
            route: null,
            dosageUnit: null,
          }),
          updateRoute,
          updateDosageUnit,
          updateDispenseUnit,
        });
        (getDefaultRoute as jest.Mock).mockReturnValue({
          uuid: 'im-uuid',
          name: 'IM',
        });
        (getDefaultDosingUnit as jest.Mock).mockReturnValue({
          uuid: 'ml-uuid',
          name: 'ml',
        });
        render(<SelectedVaccinationItem {...props} />);
        expect(updateRoute).toHaveBeenCalledWith('entry-1', {
          uuid: 'im-uuid',
          name: 'IM',
        });
        expect(updateDosageUnit).toHaveBeenCalledWith('entry-1', {
          uuid: 'ml-uuid',
          name: 'ml',
        });
        expect(updateDispenseUnit).toHaveBeenCalledWith('entry-1', {
          uuid: 'ml-uuid',
          name: 'ml',
        });
      });
      test('does not override existing values with defaults', () => {
        const updateRoute = jest.fn();
        const updateDosageUnit = jest.fn();
        const existingRoute = { uuid: 'sc-uuid', name: 'SC' };
        const existingUnit = { uuid: 'ml-uuid', name: 'ml' };
        const props = createDefaultProps({
          vaccinationInputEntry: createMockVaccinationInputEntry({
            route: existingRoute,
            dosageUnit: existingUnit,
          }),
          updateRoute,
          updateDosageUnit,
        });
        render(<SelectedVaccinationItem {...props} />);
        expect(updateRoute).not.toHaveBeenCalled();
        expect(updateDosageUnit).not.toHaveBeenCalled();
      });
    });
    describe('Total Quantity Calculation', () => {
      test('updates dispense quantity when dosage, frequency, duration change', () => {
        const updateDispenseQuantity = jest.fn();
        (calculateTotalQuantity as jest.Mock).mockReturnValue(10);
        const props = createDefaultProps({
          vaccinationInputEntry: createMockVaccinationInputEntry({
            dosage: 1,
            frequency: { uuid: 'once-uuid', name: 'Once', frequencyPerDay: 1 },
            duration: 10,
            durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
          }),
          updateDispenseQuantity,
        });
        render(<SelectedVaccinationItem {...props} />);
        expect(calculateTotalQuantity).toHaveBeenCalled();
        expect(updateDispenseQuantity).toHaveBeenCalledWith('entry-1', 10);
      });
    });
    describe('STAT Logic', () => {
      test('when STAT is selected', () => {
        const updateFrequency = jest.fn();
        const updateStartDate = jest.fn();
        const updateDuration = jest.fn();
        const updateDurationUnit = jest.fn();
        const props = createDefaultProps({
          vaccinationInputEntry: createMockVaccinationInputEntry({
            isSTAT: true,
          }),
          updateFrequency,
          updateStartDate,
          updateDuration,
          updateDurationUnit,
        });
        render(<SelectedVaccinationItem {...props} />);
        expect(updateFrequency).toHaveBeenCalledWith('entry-1', {
          uuid: '0',
          name: 'Immediately',
          frequencyPerDay: 1,
        });
        expect(updateStartDate).toHaveBeenCalledWith(
          'entry-1',
          expect.any(Date),
        );
        expect(updateDuration).toHaveBeenCalledWith('entry-1', 0);
        expect(updateDurationUnit).toHaveBeenCalledWith('entry-1', null);
      });
      test('disables controls when STAT is selected', () => {
        const props = createDefaultProps({
          vaccinationInputEntry: createMockVaccinationInputEntry({
            isSTAT: true,
          }),
        });
        render(<SelectedVaccinationItem {...props} />);
        expect(
          screen.getByRole('combobox', { name: /Frequency/i }),
        ).toBeDisabled();
        expect(
          screen.getByRole('spinbutton', { name: /Duration/i }),
        ).toBeDisabled();
        expect(
          screen.getByRole('combobox', { name: /Duration Unit/i }),
        ).toBeDisabled();
        expect(screen.getByPlaceholderText('d/m/Y')).toBeDisabled();
      });
      test('does not update frequency if immediate frequency is not found in config', () => {
        const updateFrequency = jest.fn();
        const updateStartDate = jest.fn();
        const updateDuration = jest.fn();
        const updateDurationUnit = jest.fn();
        const mockConfig = createMockMedicationConfig({
          frequencies: [
            { uuid: 'once-uuid', name: 'Once', frequencyPerDay: 1 },
            { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
          ],
        });
        const props = createDefaultProps({
          updateFrequency,
          updateStartDate,
          updateDuration,
          updateDurationUnit,
          medicationConfig: mockConfig,
          vaccinationInputEntry: createMockVaccinationInputEntry({
            isSTAT: true,
          }),
        });
        render(<SelectedVaccinationItem {...props} />);
        expect(updateFrequency).not.toHaveBeenCalled();
        expect(updateStartDate).toHaveBeenCalledWith(
          'entry-1',
          expect.any(Date),
        );
        expect(updateDuration).toHaveBeenCalledWith('entry-1', 0);
        expect(updateDurationUnit).toHaveBeenCalledWith('entry-1', null);
      });
    });
    describe('Frequency Filtering', () => {
      test('filters out immediate frequency from dropdown', async () => {
        const props = createDefaultProps();
        const user = userEvent.setup();
        render(<SelectedVaccinationItem {...props} />);
        const frequencyDropdown = screen.getByRole('combobox', {
          name: /Frequency/i,
        });
        await user.click(frequencyDropdown);
        expect(
          screen.queryByRole('option', { name: 'Immediately' }),
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: 'Once' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'BD' })).toBeInTheDocument();
      });
    });
  });
  describe('Validation & Error Handling', () => {
    test('shows invalid state for inputs with errors', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
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
      render(<SelectedVaccinationItem {...props} />);
      expect(screen.getAllByText('Please enter a value')).toHaveLength(2);
      expect(screen.getAllByText('Please select a value')).toHaveLength(4);
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
      expect(() =>
        render(<SelectedVaccinationItem {...props} />),
      ).not.toThrow();
    });
    test('handles medication without form information', () => {
      const medication = createMockMedication({ form: undefined });
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({ medication }),
      });
      expect(() =>
        render(<SelectedVaccinationItem {...props} />),
      ).not.toThrow();
    });
  });
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const props = createDefaultProps();
      const { container } = render(<SelectedVaccinationItem {...props} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    test('all form controls have proper labels', () => {
      const props = createDefaultProps();
      render(<SelectedVaccinationItem {...props} />);
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
    });
  });
  describe('Snapshot Tests', () => {
    test('matches snapshot with default props', () => {
      const props = createDefaultProps();
      const { container } = render(<SelectedVaccinationItem {...props} />);
      expect(container).toMatchSnapshot();
    });
    test('matches snapshot with errors', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
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
      const { container } = render(<SelectedVaccinationItem {...props} />);
      expect(container).toMatchSnapshot();
    });
    test('matches snapshot with note visible', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          note: 'Patient has allergies',
        }),
      });
      const { container } = render(<SelectedVaccinationItem {...props} />);
      expect(container).toMatchSnapshot();
    });
  });
  describe('Date Picker Validation', () => {
    test('prevents selection of past dates in date picker', async () => {
      const updateStartDate = jest.fn();
      const props = createDefaultProps({ updateStartDate });
      const user = userEvent.setup();
      render(<SelectedVaccinationItem {...props} />);
      const dateInput = screen.getByPlaceholderText('d/m/Y');
      await user.click(dateInput);
      await user.clear(dateInput);
      await user.type(dateInput, '1/1/2020');
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(updateStartDate).not.toHaveBeenCalled();
      });
    });
    test('allows selection of future dates', async () => {
      const updateStartDate = jest.fn();
      const props = createDefaultProps({ updateStartDate });
      const user = userEvent.setup();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day = tomorrow.getDate();
      const month = tomorrow.getMonth() + 1;
      const year = tomorrow.getFullYear();
      const tomorrowString = `${day}/${month}/${year}`;
      render(<SelectedVaccinationItem {...props} />);
      const dateInput = screen.getByPlaceholderText('d/m/Y');
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
  describe('Additional Edge Cases', () => {
    test('handles null values gracefully', () => {
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          dosageUnit: null,
          frequency: null,
          route: null,
          durationUnit: null,
          instruction: null,
        }),
      });
      expect(() =>
        render(<SelectedVaccinationItem {...props} />),
      ).not.toThrow();
    });
    test('does not set defaults when medication has no form', () => {
      const updateRoute = jest.fn();
      const updateDosageUnit = jest.fn();
      const medication = createMockMedication({ form: undefined });
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          medication,
          route: null,
          dosageUnit: null,
        }),
        updateRoute,
        updateDosageUnit,
      });
      (getDefaultRoute as jest.Mock).mockReturnValue(undefined);
      (getDefaultDosingUnit as jest.Mock).mockReturnValue(undefined);
      render(<SelectedVaccinationItem {...props} />);
      expect(updateRoute).not.toHaveBeenCalled();
      expect(updateDosageUnit).not.toHaveBeenCalled();
    });
    test('updates dispense quantity when calculation returns 0', () => {
      const updateDispenseQuantity = jest.fn();
      (calculateTotalQuantity as jest.Mock).mockReturnValue(0);
      const props = createDefaultProps({
        vaccinationInputEntry: createMockVaccinationInputEntry({
          dosage: 0,
          frequency: { uuid: 'once-uuid', name: 'Once', frequencyPerDay: 1 },
          duration: 0,
          durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
        }),
        updateDispenseQuantity,
      });
      render(<SelectedVaccinationItem {...props} />);
      expect(calculateTotalQuantity).toHaveBeenCalled();
      expect(updateDispenseQuantity).toHaveBeenCalledWith('entry-1', 0);
    });
  });
});
