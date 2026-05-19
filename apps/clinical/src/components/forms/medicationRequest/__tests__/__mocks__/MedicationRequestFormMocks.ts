import { Medication } from 'fhir/r4';
import { MedicationInputEntry } from '../../../../../models/medication';
import { MedicationConfig } from '../../../../../models/medicationConfig';

export const mockMedication: Medication = {
  id: 'test-medication-1',
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
        system: 'https://snomed.info/sct',
      },
    ],
  },
};

export const mockHepatitisVaccination: Medication = {
  id: 'hep-1',
  resourceType: 'Medication',
  code: { text: 'Hepatitis B Vaccine' },
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

export const mockSelectedMedication: MedicationInputEntry = {
  id: mockMedication.id,
  display: 'Paracetamol 500mg',
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

export const makeMockStore = (overrides = {}) => ({
  selectedMedicationRequests: [],
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
  id: 'med-123',
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
