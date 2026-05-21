import { renderHook } from '@testing-library/react';
import { getMedicationRequestStore, useMedicationRequestStore } from '../store';
import {
  mockDispenseUnit,
  mockDosageUnit,
  mockDurationUnit,
  mockFrequency,
  mockInstruction,
  mockMedication,
  mockMedicationAttributesWithDefaults,
  mockRequiredMedicationAttributes,
  mockRoute,
  mockVaccination,
} from './__mocks__/MedicationRequestFormMocks';

const store = () => getMedicationRequestStore('medications').getState();
const vacStore = () => getMedicationRequestStore('vaccinations').getState();

type FieldUpdateCase = [fieldName: string, actionName: string, value: unknown];

const FIELD_UPDATE_CASES: FieldUpdateCase[] = [
  ['dosage', 'updateDosage', 5],
  ['dosageUnit', 'updateDosageUnit', mockDosageUnit],
  ['frequency', 'updateFrequency', mockFrequency],
  ['route', 'updateRoute', mockRoute],
  ['duration', 'updateDuration', 7],
  ['durationUnit', 'updateDurationUnit', mockDurationUnit],
  ['instruction', 'updateInstruction', mockInstruction],
  ['isPRN', 'updateisPRN', true],
  ['isSTAT', 'updateisSTAT', true],
  ['startDate', 'updateStartDate', new Date('2025-01-01')],
  ['dispenseQuantity', 'updateDispenseQuantity', 10],
  ['dispenseUnit', 'updateDispenseUnit', mockDispenseUnit],
  ['note', 'updateNote', 'Some note'],
];

const ERROR_CLEARING_CASES: FieldUpdateCase[] = [
  ['dosage', 'updateDosage', 5],
  ['dosageUnit', 'updateDosageUnit', mockDosageUnit],
  ['frequency', 'updateFrequency', mockFrequency],
  ['route', 'updateRoute', mockRoute],
  ['duration', 'updateDuration', 7],
  ['durationUnit', 'updateDurationUnit', mockDurationUnit],
  ['instruction', 'updateInstruction', mockInstruction],
  ['note', 'updateNote', 'Some note'],
  ['prn', 'updateisPRN', true],
];

const ERROR_RETAINED_CASES: FieldUpdateCase[] = [
  ['dosage', 'updateDosage', 0],
  ['dosageUnit', 'updateDosageUnit', null],
  ['frequency', 'updateFrequency', null],
  ['route', 'updateRoute', null],
  ['duration', 'updateDuration', 0],
  ['instruction', 'updateInstruction', null],
  ['note', 'updateNote', ''],
  ['prn', 'updateisPRN', false],
];

describe('useMedicationRequestStore', () => {
  beforeEach(() => {
    store().reset();
    vacStore().reset();
    store().setAttributes(mockRequiredMedicationAttributes);
    vacStore().setAttributes(mockRequiredMedicationAttributes);
  });

  describe('Initialization', () => {
    it('initializes with empty selectedMedicationRequests', () => {
      expect(store().selectedMedicationRequests).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('adds an entry with correct default shape', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');

      expect(store().selectedMedicationRequests).toHaveLength(1);
      const entry = store().selectedMedicationRequests[0];
      expect(entry.id).toBeTruthy();
      expect(entry).toMatchObject({
        display: 'Paracetamol 500mg',
        medication: mockMedication,
        dosage: 0,
        dosageUnit: null,
        frequency: null,
        route: null,
        duration: 0,
        durationUnit: null,
        isPRN: false,
        instruction: null,
        errors: {},
        hasBeenValidated: false,
        dispenseQuantity: 0,
        dispenseUnit: null,
        note: '',
      });
    });

    it('defaults isSTAT to false for medications key', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      expect(store().selectedMedicationRequests[0].isSTAT).toBe(false);
    });

    it('defaults isSTAT to true for vaccinations key', () => {
      vacStore().addItem(mockVaccination, 'COVID-19 Vaccine');
      expect(vacStore().selectedMedicationRequests[0].isSTAT).toBe(true);
    });

    it('applies attribute defaults for dosage, duration, stat, prn, and note on addItem', () => {
      store().reset();
      store().setAttributes(mockMedicationAttributesWithDefaults);
      store().addItem(mockMedication, 'Paracetamol 500mg');

      const entry = store().selectedMedicationRequests[0];
      expect(entry.dosage).toBe(1);
      expect(entry.duration).toBe(1);
      expect(entry.isSTAT).toBe(true);
      expect(entry.isPRN).toBe(true);
      expect(entry.note).toBe('Some note');
    });

    it('prepends each new entry and generates a unique id per entry', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      store().addItem(mockVaccination, 'COVID-19 Vaccine');

      expect(store().selectedMedicationRequests).toHaveLength(2);
      expect(store().selectedMedicationRequests[0].display).toBe(
        'COVID-19 Vaccine',
      );
      expect(store().selectedMedicationRequests[1].display).toBe(
        'Paracetamol 500mg',
      );
      expect(store().selectedMedicationRequests[0].id).not.toBe(
        store().selectedMedicationRequests[1].id,
      );
    });
  });

  describe('removeItem', () => {
    it('removes only the specified entry, leaving others intact', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      store().addItem(mockVaccination, 'COVID-19 Vaccine');
      const newestId = store().selectedMedicationRequests[0].id;

      store().removeItem(newestId);

      expect(store().selectedMedicationRequests).toHaveLength(1);
      expect(store().selectedMedicationRequests[0].display).toBe(
        'Paracetamol 500mg',
      );
    });

    it('is a no-op when the id does not exist', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      const before = [...store().selectedMedicationRequests];

      store().removeItem('non-existent-id');

      expect(store().selectedMedicationRequests).toEqual(before);
    });
  });

  describe('field updates', () => {
    it.each(FIELD_UPDATE_CASES)(
      'updates %s on the target entry without touching other entries',
      (fieldName, actionName, value) => {
        store().addItem(mockMedication, 'Paracetamol 500mg');
        store().addItem(mockVaccination, 'COVID-19 Vaccine');
        const targetId = store().selectedMedicationRequests[0].id;
        const otherEntryBefore = store().selectedMedicationRequests[1];

        store()[actionName](targetId, value);

        expect(store().selectedMedicationRequests[0][fieldName]).toEqual(value);
        expect(store().selectedMedicationRequests[1]).toEqual(otherEntryBefore);
      },
    );

    it.each(FIELD_UPDATE_CASES)(
      'is a no-op when updating %s with a non-existent id',
      (_fieldName, actionName, value) => {
        store().addItem(mockMedication, 'Paracetamol 500mg');
        const before = [...store().selectedMedicationRequests];

        store()[actionName]('non-existent-id', value);

        expect(store().selectedMedicationRequests).toEqual(before);
      },
    );

    it.each(ERROR_CLEARING_CASES)(
      'clears %s error when entry has been validated and a valid value is set',
      (fieldName, actionName, validValue) => {
        store().addItem(mockMedication, 'Paracetamol 500mg');
        const id = store().selectedMedicationRequests[0].id;

        store().validateAll();
        expect(
          store().selectedMedicationRequests[0].errors[fieldName],
        ).toBeDefined();

        store()[actionName](id, validValue);

        expect(
          store().selectedMedicationRequests[0].errors[fieldName],
        ).toBeUndefined();
      },
    );

    it.each(ERROR_RETAINED_CASES)(
      'retains %s error when entry has been validated but value does not satisfy the field constraint',
      (fieldName, actionName, invalidValue) => {
        store().addItem(mockMedication, 'Paracetamol 500mg');
        const id = store().selectedMedicationRequests[0].id;

        store().validateAll();
        store()[actionName](id, invalidValue);

        expect(
          store().selectedMedicationRequests[0].errors[fieldName],
        ).toBeDefined();
      },
    );
  });

  describe('startDate error clearing', () => {
    it('clears startDate error when entry has been validated and a valid date is set', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      const id = store().selectedMedicationRequests[0].id;

      getMedicationRequestStore('medications').setState({
        selectedMedicationRequests: [
          {
            ...store().selectedMedicationRequests[0],
            startDate: undefined,
            hasBeenValidated: true,
            errors: {
              startDate: 'MEDICATION_REQUEST_INPUT_CONTROL_START_DATE_REQUIRED',
            },
          },
        ],
      });

      expect(
        store().selectedMedicationRequests[0].errors.startDate,
      ).toBeDefined();

      store().updateStartDate(id, new Date('2025-01-01'));

      expect(
        store().selectedMedicationRequests[0].errors.startDate,
      ).toBeUndefined();
    });

    it('retains startDate error when entry has not been validated', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      const id = store().selectedMedicationRequests[0].id;

      getMedicationRequestStore('medications').setState({
        selectedMedicationRequests: [
          {
            ...store().selectedMedicationRequests[0],
            startDate: undefined,
            hasBeenValidated: false,
            errors: {
              startDate: 'MEDICATION_REQUEST_INPUT_CONTROL_START_DATE_REQUIRED',
            },
          },
        ],
      });

      store().updateStartDate(id, new Date('2025-01-01'));

      expect(
        store().selectedMedicationRequests[0].errors.startDate,
      ).toBeDefined();
    });
  });

  describe('dispenseQuantity and dispenseUnit error clearing', () => {
    it.each([
      ['dispenseQuantity', 'updateDispenseQuantity', 10],
      ['dispenseUnit', 'updateDispenseUnit', mockDispenseUnit],
    ] as const)(
      'clears %s error path when entry has been validated',
      (errorKey, actionName, value) => {
        store().addItem(mockMedication, 'Paracetamol 500mg');
        const id = store().selectedMedicationRequests[0].id;
        store().validateAll();

        store()[actionName](id, value as any);

        expect(
          store().selectedMedicationRequests[0].errors[errorKey],
        ).toBeUndefined();
      },
    );
  });

  describe('updateisSTAT', () => {
    it('clears duration and durationUnit errors when set to true after validation', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      const id = store().selectedMedicationRequests[0].id;

      store().validateAll();
      expect(
        store().selectedMedicationRequests[0].errors.duration,
      ).toBeDefined();
      expect(
        store().selectedMedicationRequests[0].errors.durationUnit,
      ).toBeDefined();

      store().updateisSTAT(id, true);

      expect(
        store().selectedMedicationRequests[0].errors.duration,
      ).toBeUndefined();
      expect(
        store().selectedMedicationRequests[0].errors.durationUnit,
      ).toBeUndefined();
    });

    it('retains duration and durationUnit errors when set to false after validation', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      const id = store().selectedMedicationRequests[0].id;

      store().validateAll();
      store().updateisSTAT(id, false);

      expect(
        store().selectedMedicationRequests[0].errors.duration,
      ).toBeDefined();
      expect(
        store().selectedMedicationRequests[0].errors.durationUnit,
      ).toBeDefined();
    });
  });

  describe('validateAll - medications', () => {
    it('returns true when there are no entries', () => {
      expect(store().validateAll()).toBe(true);
    });

    it('sets errors for all required fields and marks each entry as validated', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      store().addItem(mockVaccination, 'COVID-19 Vaccine');

      const isValid = store().validateAll();

      expect(isValid).toBe(false);
      store().selectedMedicationRequests.forEach((entry) => {
        expect(entry.hasBeenValidated).toBe(true);
        expect(entry.errors.dosage).toBeDefined();
        expect(entry.errors.dosageUnit).toBeDefined();
        expect(entry.errors.frequency).toBeDefined();
        expect(entry.errors.route).toBeDefined();
        expect(entry.errors.duration).toBeDefined();
        expect(entry.errors.durationUnit).toBeDefined();
      });
    });

    it('does not require duration or durationUnit when isSTAT is true', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      const id = store().selectedMedicationRequests[0].id;
      store().updateisSTAT(id, true);

      store().validateAll();

      expect(
        store().selectedMedicationRequests[0].errors.duration,
      ).toBeUndefined();
      expect(
        store().selectedMedicationRequests[0].errors.durationUnit,
      ).toBeUndefined();
    });

    it('returns true and clears all errors when all required fields are valid', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      const id = store().selectedMedicationRequests[0].id;
      store().updateisSTAT(id, true);
      store().updateisPRN(id, true);
      store().updateDosage(id, 5);
      store().updateDosageUnit(id, mockDosageUnit);
      store().updateFrequency(id, mockFrequency);
      store().updateRoute(id, mockRoute);
      store().updateDuration(id, 7);
      store().updateDurationUnit(id, mockDurationUnit);
      store().updateInstruction(id, mockInstruction);
      store().updateNote(id, 'Some note');

      const isValid = store().validateAll();

      expect(isValid).toBe(true);
      expect(store().selectedMedicationRequests[0].errors).toEqual({});
    });

    it('returns false when at least one entry has a validation error', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      store().addItem(mockVaccination, 'COVID-19 Vaccine');
      const validId = store().selectedMedicationRequests[1].id;
      store().updateDosage(validId, 5);
      store().updateDosageUnit(validId, mockDosageUnit);
      store().updateFrequency(validId, mockFrequency);
      store().updateRoute(validId, mockRoute);
      store().updateDuration(validId, 7);
      store().updateDurationUnit(validId, mockDurationUnit);

      const isValid = store().validateAll();

      expect(isValid).toBe(false);
      expect(store().selectedMedicationRequests[0].errors.dosage).toBeDefined();
      expect(
        store().selectedMedicationRequests[1].errors.dosage,
      ).toBeUndefined();
    });
  });

  describe('validateAll - vaccinations', () => {
    it('does not require duration or durationUnit for vaccinations', () => {
      vacStore().addItem(mockVaccination, 'COVID-19 Vaccine');

      vacStore().validateAll();

      expect(
        vacStore().selectedMedicationRequests[0].errors.duration,
      ).toBeUndefined();
      expect(
        vacStore().selectedMedicationRequests[0].errors.durationUnit,
      ).toBeUndefined();
    });

    it('still validates dosage, dosageUnit, frequency and route for vaccinations', () => {
      vacStore().addItem(mockVaccination, 'COVID-19 Vaccine');

      const isValid = vacStore().validateAll();

      expect(isValid).toBe(false);
      const errors = vacStore().selectedMedicationRequests[0].errors;
      expect(errors.dosage).toBeDefined();
      expect(errors.dosageUnit).toBeDefined();
      expect(errors.frequency).toBeDefined();
      expect(errors.route).toBeDefined();
    });
  });

  describe('reset', () => {
    it('clears all selected medication requests', () => {
      store().addItem(mockMedication, 'Paracetamol 500mg');
      store().addItem(mockVaccination, 'COVID-19 Vaccine');
      expect(store().selectedMedicationRequests).toHaveLength(2);

      store().reset();

      expect(store().selectedMedicationRequests).toHaveLength(0);
    });
  });

  it('returns the current store state', () => {
    store().addItem(mockMedication, 'Paracetamol 500mg');

    const state = store().getState();

    expect(state.selectedMedicationRequests).toHaveLength(1);
    expect(state.selectedMedicationRequests[0].display).toBe(
      'Paracetamol 500mg',
    );
  });

  describe('useMedicationRequestStore', () => {
    it.each(['medications', 'vaccinations'] as const)(
      'returns the current store state for key "%s"',
      (key) => {
        const { result } = renderHook(() => useMedicationRequestStore(key));
        expect(result.current.selectedMedicationRequests).toEqual([]);
        expect(typeof result.current.addItem).toBe('function');
      },
    );
  });
});
