import { getImmunizationStore } from '../stores';
import {
  mockAllRequiredAttributes,
  mockAttributesWithOptionalAdministered,
  mockFullAttributes,
  mockImmunizationEntryWithErrors,
  mockVaccineCode,
} from './__mocks__/immunizationHistoryMocks';

const secondVaccineCode = { code: 'flu', display: 'Influenza Vaccine' };
const STORE_KEY = 'immunizationHistory';
const store = () => getImmunizationStore(STORE_KEY).getState();

type FieldUpdateCase = [fieldName: string, actionName: string, value: unknown];

const FIELD_UPDATE_CASES: FieldUpdateCase[] = [
  ['administeredOn', 'updateAdministeredOn', new Date('2025-01-01')],
  ['drug', 'updateVaccineDrug', { code: 'bcg-code', display: 'BCG Drug' }],
  [
    'administeredLocation',
    'updateAdministeredLocation',
    { display: 'Main Clinic' },
  ],
  ['route', 'updateRoute', 'im'],
  ['site', 'updateSite', 'arm'],
  ['expiryDate', 'updateExpiryDate', new Date('2026-01-01')],
  ['manufacturer', 'updateManufacturer', 'Pfizer'],
  ['batchNumber', 'updateBatchNumber', 'BATCH-001'],
  ['doseSequence', 'updateDoseSequence', 3],
];

const ERROR_RETAINED_CASES: FieldUpdateCase[] = [
  ['administeredOn', 'updateAdministeredOn', null],
  ['drug', 'updateVaccineDrug', null],
  ['administeredLocation', 'updateAdministeredLocation', null],
  [
    'administeredLocation (whitespace)',
    'updateAdministeredLocation',
    { display: '   ' },
  ],
  ['route', 'updateRoute', ''],
  ['site', 'updateSite', ''],
  ['expiryDate', 'updateExpiryDate', null],
  ['manufacturer', 'updateManufacturer', ''],
  ['manufacturer (whitespace)', 'updateManufacturer', '   '],
  ['batchNumber', 'updateBatchNumber', ''],
  ['batchNumber (whitespace)', 'updateBatchNumber', '   '],
  ['doseSequence', 'updateDoseSequence', null],
];

describe('useImmunizationHistoryStore', () => {
  beforeEach(() => {
    store().reset();
  });

  describe('Initialization', () => {
    it('initializes with empty selectedImmunizations and undefined attributes', () => {
      expect(store().selectedImmunizations).toEqual([]);
      expect(store().attributes).toBeUndefined();
    });
  });

  describe('addImmunization', () => {
    it('adds an entry with correct default shape', () => {
      store().addImmunization(mockVaccineCode);

      expect(store().selectedImmunizations).toHaveLength(1);
      const entry = store().selectedImmunizations[0];
      expect(entry.id).toBeTruthy();
      expect(entry).toMatchObject({
        vaccineCode: mockVaccineCode,
        drug: null,
        administeredOn: null,
        administeredLocation: null,
        route: null,
        site: null,
        expiryDate: null,
        manufacturer: null,
        batchNumber: null,
        errors: {},
        hasBeenValidated: false,
      });
    });

    it('prepends each new entry and generates a unique id per entry', () => {
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode);

      expect(store().selectedImmunizations).toHaveLength(2);
      expect(store().selectedImmunizations[0].vaccineCode).toEqual(
        secondVaccineCode,
      );
      expect(store().selectedImmunizations[1].vaccineCode).toEqual(
        mockVaccineCode,
      );
      expect(store().selectedImmunizations[0].id).not.toBe(
        store().selectedImmunizations[1].id,
      );
    });
  });

  describe('addImmunization with defaults', () => {
    const defaults = {
      basedOnReference: 'med-request-uuid',
      drug: { code: 'covid-drug-uuid', display: 'COVID-19 Drug' },
      administeredOn: new Date('2025-06-01'),
      administeredLocation: { uuid: 'loc-uuid', display: 'Main Clinic' },
    };

    it('adds an entry with the correct shape from defaults', () => {
      store().addImmunization(mockVaccineCode, defaults);

      expect(store().selectedImmunizations).toHaveLength(1);
      const entry = store().selectedImmunizations[0];
      expect(entry.id).toBeTruthy();
      expect(entry).toMatchObject({
        vaccineCode: mockVaccineCode,
        drug: defaults.drug,
        administeredOn: defaults.administeredOn,
        administeredLocation: defaults.administeredLocation,
        basedOnReference: defaults.basedOnReference,
        route: null,
        site: null,
        expiryDate: null,
        manufacturer: null,
        batchNumber: null,
        doseSequence: null,
        errors: {},
        hasBeenValidated: false,
      });
    });

    it('prepends the new entry and generates a unique id per entry', () => {
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode, defaults);

      expect(store().selectedImmunizations).toHaveLength(2);
      expect(store().selectedImmunizations[0].vaccineCode).toEqual(
        secondVaccineCode,
      );
      expect(store().selectedImmunizations[0].id).not.toBe(
        store().selectedImmunizations[1].id,
      );
    });
  });

  describe('removeImmunization', () => {
    it('removes only the specified entry, leaving others intact', () => {
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode);
      const newestId = store().selectedImmunizations[0].id;

      store().removeImmunization(newestId);

      expect(store().selectedImmunizations).toHaveLength(1);
      expect(store().selectedImmunizations[0].vaccineCode).toEqual(
        mockVaccineCode,
      );
    });

    it('is a no-op when the id does not exist', () => {
      store().addImmunization(mockVaccineCode);
      const before = [...store().selectedImmunizations];

      store().removeImmunization('non-existent-id');

      expect(store().selectedImmunizations).toEqual(before);
    });
  });

  describe('field updates', () => {
    it.each(FIELD_UPDATE_CASES)(
      'updates %s on the target entry without touching other entries',
      (fieldName, actionName, validValue) => {
        store().addImmunization(mockVaccineCode);
        store().addImmunization(secondVaccineCode);
        const targetId = store().selectedImmunizations[0].id;
        const otherEntryBefore = store().selectedImmunizations[1];

        store()[actionName](targetId, validValue);

        expect(store().selectedImmunizations[0][fieldName]).toEqual(validValue);
        expect(store().selectedImmunizations[1]).toEqual(otherEntryBefore);
      },
    );

    it.each(FIELD_UPDATE_CASES)(
      'is a no-op when updating %s with a non-existent id',
      (_fieldName, actionName, validValue) => {
        store().addImmunization(mockVaccineCode);
        const before = [...store().selectedImmunizations];

        store()[actionName]('non-existent-id', validValue);

        expect(store().selectedImmunizations).toEqual(before);
      },
    );

    it.each(FIELD_UPDATE_CASES)(
      'clears %s error when entry has been validated and a valid value is set',
      (fieldName, actionName, validValue) => {
        store().setAttributes(mockAllRequiredAttributes);
        store().addImmunization(mockVaccineCode);
        const id = store().selectedImmunizations[0].id;

        store().validateAll();
        expect(
          store().selectedImmunizations[0].errors[fieldName],
        ).toBeDefined();

        store()[actionName](id, validValue);

        expect(
          store().selectedImmunizations[0].errors[fieldName],
        ).toBeUndefined();
      },
    );

    it.each(ERROR_RETAINED_CASES)(
      'retains %s error when entry has been validated but value does not satisfy the field constraint',
      (fieldName, actionName, emptyOrWhitespace) => {
        store().setAttributes(mockAllRequiredAttributes);
        store().addImmunization(mockVaccineCode);
        const id = store().selectedImmunizations[0].id;

        store().validateAll();
        store()[actionName](id, emptyOrWhitespace);

        const errorKey = fieldName.replace(' (whitespace)', '');
        expect(store().selectedImmunizations[0].errors[errorKey]).toBeDefined();
      },
    );
  });

  describe('validateAll', () => {
    it('returns true when there are no immunization entries', () => {
      expect(store().validateAll()).toBe(true);
    });

    it('sets errors for all required fields and marks each entry as validated, treating whitespace-only values as empty', () => {
      store().setAttributes(mockAllRequiredAttributes);
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode);
      const firstId = store().selectedImmunizations[0].id;
      store().updateAdministeredLocation(firstId, { display: '   ' });

      const isValid = store().validateAll();

      expect(isValid).toBe(false);
      store().selectedImmunizations.forEach((entry) => {
        expect(entry.hasBeenValidated).toBe(true);
        expect(entry.errors).toMatchObject(
          mockImmunizationEntryWithErrors.errors,
        );
      });
    });

    it('skips validation for fields whose required flag is false or absent', () => {
      store().setAttributes(mockAttributesWithOptionalAdministered);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateVaccineDrug(id, { code: 'bcg-code', display: 'BCG Drug' });

      store().validateAll();

      expect(store().selectedImmunizations[0].errors).toEqual({});
    });

    it('returns true and clears all errors when all required fields are filled', () => {
      store().setAttributes(mockAllRequiredAttributes);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateVaccineDrug(id, { code: 'bcg-code', display: 'BCG Drug' });
      store().updateAdministeredOn(id, new Date('2025-01-01'));
      store().updateAdministeredLocation(id, { display: 'Main Clinic' });
      store().updateRoute(id, 'im');
      store().updateSite(id, 'arm');
      store().updateExpiryDate(id, new Date('2026-01-01'));
      store().updateManufacturer(id, 'Pfizer');
      store().updateBatchNumber(id, 'BATCH-001');
      store().updateDoseSequence(id, 3);

      const isValid = store().validateAll();

      expect(isValid).toBe(true);
      expect(store().selectedImmunizations[0].errors).toEqual({});
    });

    it.each([
      [
        'before',
        '2025-01-01',
        '2024-06-01',
        false,
        'IMMUNIZATION_HISTORY_EXPIRY_DATE_BEFORE_ADMINISTERED_ON',
      ],
      ['same as', '2025-01-01', '2025-01-01', true, undefined],
      ['after', '2025-01-01', '2026-01-01', true, undefined],
    ])(
      'returns %s result when expiryDate is %s administeredOn',
      (
        _label,
        administeredOnStr,
        expiryDateStr,
        expectedValid,
        expectedError,
      ) => {
        store().setAttributes([]);
        store().addImmunization(mockVaccineCode);
        const id = store().selectedImmunizations[0].id;
        store().updateAdministeredOn(id, new Date(administeredOnStr));
        store().updateExpiryDate(id, new Date(expiryDateStr));

        const isValid = store().validateAll();

        expect(isValid).toBe(expectedValid);
        expect(store().selectedImmunizations[0].errors.expiryDate).toBe(
          expectedError,
        );
      },
    );

    it('does not set cross-field expiryDate error when administeredOn is absent', () => {
      store().setAttributes([]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateExpiryDate(id, new Date('2024-01-01'));

      const isValid = store().validateAll();

      expect(isValid).toBe(true);
      expect(
        store().selectedImmunizations[0].errors.expiryDate,
      ).toBeUndefined();
    });

    it('returns false when at least one entry has a validation error', () => {
      store().setAttributes([{ name: 'drug', required: true }]);
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode);
      const validId = store().selectedImmunizations[1].id;
      store().updateVaccineDrug(validId, {
        code: 'bcg-code',
        display: 'BCG Drug',
      });

      const isValid = store().validateAll();

      expect(isValid).toBe(false);
      expect(store().selectedImmunizations[0].errors.drug).toBeDefined();
      expect(store().selectedImmunizations[1].errors.drug).toBeUndefined();
    });
  });

  describe('cross-field expiryDate validation (inline, post-validateAll)', () => {
    it.each([
      [
        'before',
        new Date('2025-01-01'),
        'IMMUNIZATION_HISTORY_EXPIRY_DATE_BEFORE_ADMINISTERED_ON',
      ],
      ['on', new Date('2025-06-01'), undefined],
      ['after', new Date('2026-01-01'), undefined],
    ])(
      'updateExpiryDate: sets expiryDate error when new value is %s administeredOn',
      (_label, newExpiryDate, expectedError) => {
        store().setAttributes([]);
        store().addImmunization(mockVaccineCode);
        const id = store().selectedImmunizations[0].id;
        store().updateAdministeredOn(id, new Date('2025-06-01'));
        store().validateAll();

        store().updateExpiryDate(id, newExpiryDate);

        expect(store().selectedImmunizations[0].errors.expiryDate).toBe(
          expectedError,
        );
      },
    );

    it.each([
      [
        'after expiryDate',
        new Date('2025-06-01'),
        'IMMUNIZATION_HISTORY_EXPIRY_DATE_BEFORE_ADMINISTERED_ON',
      ],
      ['before expiryDate', new Date('2024-12-01'), undefined],
      ['null', null, undefined],
    ])(
      'updateAdministeredOn: sets expiryDate error when new administeredOn is %s',
      (_label, newAdministeredOn, expectedError) => {
        store().setAttributes([]);
        store().addImmunization(mockVaccineCode);
        const id = store().selectedImmunizations[0].id;
        store().updateExpiryDate(id, new Date('2025-01-01'));
        store().validateAll();

        store().updateAdministeredOn(id, newAdministeredOn);

        expect(store().selectedImmunizations[0].errors.expiryDate).toBe(
          expectedError,
        );
      },
    );
  });

  describe('updateNote', () => {
    it('updates note on the target entry without touching other entries', () => {
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode);
      const targetId = store().selectedImmunizations[0].id;
      const otherEntryBefore = store().selectedImmunizations[1];

      store().updateNote(targetId, 'Some note text');

      expect(store().selectedImmunizations[0].note).toBe('Some note text');
      expect(store().selectedImmunizations[1]).toEqual(otherEntryBefore);
    });

    it('is a no-op for a non-existent id', () => {
      store().addImmunization(mockVaccineCode);
      const before = [...store().selectedImmunizations];

      store().updateNote('non-existent-id', 'Another note');

      expect(store().selectedImmunizations).toEqual(before);
    });
  });

  describe('updateDoseSequence sanitization', () => {
    it.each([
      ['float', 2.7, 2],
      ['negative', -1, 0],
      ['zero', 0, 0],
      ['positive integer', 3, 3],
      ['null', null, null],
    ])(
      'stores %s value as sanitized non-negative integer or null',
      (_label, input, expected) => {
        store().addImmunization(mockVaccineCode);
        const id = store().selectedImmunizations[0].id;

        store().updateDoseSequence(id, input);

        expect(store().selectedImmunizations[0].doseSequence).toBe(expected);
      },
    );

    it('retains doseSequence error when zero is set after validation', () => {
      store().setAttributes([{ name: 'doseSequence', required: true }]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;

      store().validateAll();
      store().updateDoseSequence(id, 0);

      expect(
        store().selectedImmunizations[0].errors.doseSequence,
      ).toBeDefined();
    });
  });

  describe('reset', () => {
    it('clears all selected immunizations', () => {
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode);
      expect(store().selectedImmunizations).toHaveLength(2);

      store().reset();

      expect(store().selectedImmunizations).toHaveLength(0);
    });
  });

  describe('getState', () => {
    it('returns the current store state including attributes set via setAttributes', () => {
      store().setAttributes(mockFullAttributes);
      store().addImmunization(mockVaccineCode);

      const state = store().getState();
      expect(state.selectedImmunizations).toHaveLength(1);
      expect(state.attributes).toEqual(mockFullAttributes);
    });
  });
});
