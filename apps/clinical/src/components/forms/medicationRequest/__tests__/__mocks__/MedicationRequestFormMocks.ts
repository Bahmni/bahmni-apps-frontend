import { Medication } from 'fhir/r4';
import {
  createMockCDSCard,
  createMockCriticalCDSCard,
} from '../../../../../../__mocks__/cdssMocks';
import { MedicationInputEntry } from '../../../../../models/medication';
import { MedicationConfig } from '../../../../../models/medicationConfig';
import { InputControlAttributes } from '../../../../../providers/clinicalConfig/models';

export const mockMedicationAttributesWithDefaults: InputControlAttributes[] = [
  { name: 'stat', default: true },
  { name: 'prn', default: true },
  { name: 'dosage', default: 1 },
  { name: 'dosageUnit' },
  { name: 'frequency' },
  { name: 'duration', default: 1 },
  { name: 'durationUnit' },
  { name: 'instruction' },
  { name: 'route' },
  { name: 'startDate' },
  { name: 'note', default: 'Some note' },
];

export const mockFullMedicationAttributes: InputControlAttributes[] = [
  { name: 'stat' },
  { name: 'prn' },
  { name: 'dosage', required: true, default: 5 },
  { name: 'dosageUnit' },
  { name: 'frequency', default: 'BD' },
  { name: 'duration' },
  { name: 'durationUnit' },
  { name: 'instruction' },
  { name: 'route' },
  { name: 'startDate' },
  { name: 'note' },
];

export const mockFullMedicationAttributesReadOnly: InputControlAttributes[] = [
  { name: 'stat', readOnly: true },
  { name: 'prn', readOnly: true },
  { name: 'dosage', readOnly: true },
  { name: 'dosageUnit', readOnly: true },
  { name: 'frequency', readOnly: true },
  { name: 'duration', readOnly: true },
  { name: 'durationUnit', readOnly: true },
  { name: 'instruction', readOnly: true },
  { name: 'route', readOnly: true },
  { name: 'startDate', readOnly: true },
  { name: 'note', readOnly: true },
];

export const mockMedication: Medication = {
  id: 'test-medication-1',
  resourceType: 'Medication',
  code: {
    text: 'Paracetamol 500mg',
    coding: [
      {
        code: 'paracetamol-500',
        display: 'Paracetamol 500mg',
        system: 'http://snomed.info/sct', // NOSONAR
      },
    ],
  },
};

export const mockVaccination: Medication = {
  id: 'test-vaccination-1',
  resourceType: 'Medication',
  code: {
    text: 'COVID-19 Vaccine',
    coding: [
      {
        code: 'covid-19-vaccine',
        display: 'COVID-19 Vaccine',
        system: 'https://snomed.info/sct', // NOSONAR
      },
    ],
  },
};

export const mockHepatitisVaccination: Medication = {
  id: 'hep-1',
  resourceType: 'Medication',
  code: { text: 'Hepatitis B Vaccine' },
};

export const mockMedicationWithForm: Medication = {
  ...mockMedication,
  form: { text: 'Tablet' },
};

export const mockMedicationConfig: MedicationConfig = {
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

export const mockMedicationConfigWithDrugFormDefaults: MedicationConfig = {
  ...mockMedicationConfig,
  drugFormDefaults: {
    Tablet: { route: 'Oral', doseUnits: 'mg' },
  },
};

export const mockSelectedMedication: MedicationInputEntry = {
  id: mockMedication.id,
  display: 'Magnesium sulfate 500 mg/ml (Injection)',
  medication: mockMedication,
  dosage: 1,
  dosageUnit: { uuid: 'mg-uuid', name: 'mg' },
  frequency: { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
  route: { uuid: 'oral-uuid', name: 'Oral' },
  duration: 5,
  durationUnit: { code: 'd', display: 'Days', daysMultiplier: 1 },
  isSTAT: false,
  isPRN: false,
  startDate: new Date('2025-01-01T00:00:00.000Z'),
  instruction: null,
  errors: {},
  hasBeenValidated: false,
  dispenseQuantity: 10,
  dispenseUnit: { uuid: 'mg-uuid', name: 'mg' },
  note: '',
  doseForm: 'Injection',
};

export const mockMinimalMedicationEntry: MedicationInputEntry = {
  id: mockMedication.id,
  display: 'Simple Medication',
  medication: mockMedication,
  dosage: 0,
  dosageUnit: null,
  frequency: null,
  route: null,
  duration: 0,
  durationUnit: null,
  isSTAT: false,
  isPRN: false,
  instruction: null,
  errors: {},
  hasBeenValidated: false,
  dispenseQuantity: 0,
  dispenseUnit: null,
  note: 'existing note',
};

export const mockMinimalMedicationEntryWithForm: MedicationInputEntry = {
  ...mockMinimalMedicationEntry,
  medication: mockMedicationWithForm,
};

export const mockEmptyMedicationEntry: MedicationInputEntry = {
  id: 'med-empty',
  display: 'Empty Medication',
  medication: mockMedicationWithForm,
  dosage: 0,
  dosageUnit: null,
  frequency: null,
  route: null,
  duration: 0,
  durationUnit: null,
  isSTAT: false,
  isPRN: false,
  instruction: null,
  errors: {},
  hasBeenValidated: false,
  dispenseQuantity: 0,
  dispenseUnit: null,
  note: '',
};

export const mockSelectedVaccination: MedicationInputEntry = {
  id: mockVaccination.id,
  display: 'COVID-19 Vaccine',
  medication: mockVaccination,
  dosage: 1,
  dosageUnit: { uuid: 'ml-uuid', name: 'ml' },
  frequency: { uuid: '0', name: 'Immediately', frequencyPerDay: 1 },
  route: { uuid: 'oral-uuid', name: 'Oral' },
  duration: 0,
  durationUnit: null,
  isSTAT: true,
  isPRN: false,
  startDate: new Date('2025-01-01T00:00:00.000Z'),
  instruction: null,
  errors: {},
  hasBeenValidated: false,
  dispenseQuantity: 1,
  dispenseUnit: { uuid: 'ml-uuid', name: 'ml' },
  note: '',
};

export const mockVaccinationBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockVaccination }],
};

export const mockTwoVaccinationBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    { resource: mockVaccination },
    { resource: mockHepatitisVaccination },
  ],
};

export const mockRequiredMedicationAttributes: InputControlAttributes[] = [
  { name: 'stat', required: true },
  { name: 'prn', required: true },
  { name: 'dosage', required: true },
  { name: 'dosageUnit', required: true },
  { name: 'frequency', required: true },
  { name: 'duration', required: true },
  { name: 'durationUnit', required: true },
  { name: 'instruction', required: true },
  { name: 'route', required: true },
  { name: 'startDate', required: true },
  { name: 'note', required: true },
];

export const mockSelectedMedicationWithAllErrors: MedicationInputEntry = {
  ...mockSelectedMedication,
  dosage: 0,
  dosageUnit: null,
  frequency: null,
  route: null,
  duration: 0,
  durationUnit: null,
  instruction: null,
  isSTAT: false,
  isPRN: false,
  startDate: undefined,
  note: '',
  errors: {
    stat: 'MEDICATION_REQUEST_INPUT_CONTROL_STAT_REQUIRED',
    prn: 'MEDICATION_REQUEST_INPUT_CONTROL_PRN_REQUIRED',
    dosage: 'MEDICATION_REQUEST_INPUT_CONTROL_DOSAGE_REQUIRED',
    dosageUnit: 'MEDICATION_REQUEST_INPUT_CONTROL_DOSAGE_UNIT_REQUIRED',
    frequency: 'MEDICATION_REQUEST_INPUT_CONTROL_FREQUENCY_REQUIRED',
    duration: 'MEDICATION_REQUEST_INPUT_CONTROL_DURATION_REQUIRED',
    durationUnit: 'MEDICATION_REQUEST_INPUT_CONTROL_DURATION_UNIT_REQUIRED',
    instruction: 'MEDICATION_REQUEST_INPUT_CONTROL_INSTRUCTION_REQUIRED',
    route: 'MEDICATION_REQUEST_INPUT_CONTROL_ROUTE_REQUIRED',
    startDate: 'MEDICATION_REQUEST_INPUT_CONTROL_START_DATE_REQUIRED',
    note: 'MEDICATION_REQUEST_INPUT_CONTROL_NOTE_REQUIRED',
  },
  hasBeenValidated: true,
};

export const mockEncounterSubject = { reference: 'Patient/123' };
export const mockEncounterReference = 'urn:uuid:12345';
export const mockPractitionerUUID = 'd7a669e7-5e07-11ef-8f7c-0242ac120002';

export const mockDosageUnit = { uuid: 'mg-uuid', name: 'mg' };
export const mockFrequency = {
  uuid: 'bd-uuid',
  name: 'BD',
  frequencyPerDay: 2,
};
export const mockRoute = { uuid: 'oral-uuid', name: 'Oral' };
export const mockDurationUnit = {
  code: 'd' as const,
  display: 'Days',
  daysMultiplier: 1,
};
export const mockInstruction = {
  uuid: 'before-food-uuid',
  name: 'Before Food',
};
export const mockDispenseUnit = { uuid: 'mg-uuid', name: 'mg' };

export const makeMockStore = (overrides = {}) => ({
  selectedMedicationRequests: [],
  attributes: undefined,
  setAttributes: jest.fn(),
  addItem: jest.fn(),
  removeItem: jest.fn(),
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
  validateAll: jest.fn().mockReturnValue(true),
  reset: jest.fn(),
  getState: jest.fn(),
  ...overrides,
});

export const mockMedicationEntry: MedicationInputEntry = {
  id: 'uuid-med-123',
  medication: {
    resourceType: 'Medication',
    id: 'med-123',
  },
  display: 'Aspirin 100mg',
  dosage: 100,
  dosageUnit: null,
  frequency: null,
  instruction: null,
  route: null,
  duration: 7,
  durationUnit: null,
  isSTAT: false,
  isPRN: false,
  dispenseQuantity: 14,
  dispenseUnit: null,
  errors: {},
  hasBeenValidated: true,
};

export const mockCDSCard = createMockCDSCard(
  'MedicationRequest',
  'med-123',
  'Drug interaction warning',
  'Consider alternative medication',
);

export const mockCriticalCDSCard = createMockCriticalCDSCard(
  'MedicationRequest',
  'med-123',
  'Critical drug allergy alert',
  'Do not prescribe',
);

export const mockInputControlConfigWithCDSS = {
  type: 'medication',
  label: 'MEDICATION_REQUEST_FORM_TITLE',
  cdss: [
    {
      server: 'test-cdss-server',
      service: 'medication-prescribe',
      event: 'onSelect',
    },
  ],
};
