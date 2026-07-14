import { getImmunizationStore } from '../stores';
import {
  mockAllRequiredAttributes,
  mockAttributesWithOptionalAdministered,
  mockCDSCard,
  mockCriticalCDSCard,
  mockFullAttributes,
  mockImmunizationEntryWithErrors,
  mockVaccineCode,
} from './__mocks__/immunizationMocks';

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
  ['note', 'updateNote', 'Some note'],
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
  ['note', 'updateNote', ''],
  ['note (whitespace)', 'updateNote', '   '],
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
        stockLocation: null,
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
        stockLocation: null,
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
      store().updateNote(id, 'Some note');

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
        'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON',
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
        'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON',
      ],
      ['on', new Date('2025-06-01'), undefined],
      ['after', new Date('2026-01-01'), undefined],
      ['null', null, undefined],
    ])(
      'updateExpiryDate: sets expiryDate error when new value is %s administeredOn',
      (_label, newExpiryDate, expectedError) => {
        store().setAttributes([]);
        store().addImmunization(mockVaccineCode);
        const id = store().selectedImmunizations[0].id;
        store().updateAdministeredOn(id, new Date('2025-06-01'));
        store().validateAll();

        store().updateExpiryDate(id, new Date('2025-01-01'));
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
        'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON',
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

  describe('updateStatusReason', () => {
    it('updates statusReason on the target entry without touching other entries', () => {
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode);
      const targetId = store().selectedImmunizations[0].id;
      const otherEntryBefore = store().selectedImmunizations[1];

      store().updateStatusReason(targetId, {
        code: 'not-age-appropriate',
        display: 'Not age appropriate',
      });

      expect(store().selectedImmunizations[0].statusReason).toEqual({
        code: 'not-age-appropriate',
        display: 'Not age appropriate',
      });
      expect(store().selectedImmunizations[1]).toEqual(otherEntryBefore);
    });

    it('is a no-op for a non-existent id', () => {
      store().addImmunization(mockVaccineCode);
      const before = [...store().selectedImmunizations];

      store().updateStatusReason('non-existent-id', {
        code: 'x',
        display: 'X',
      });

      expect(store().selectedImmunizations).toEqual(before);
    });

    it('clears statusReason error when entry has been validated and a value is set', () => {
      store().setAttributes([{ name: 'statusReason', required: true }]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;

      store().validateAll();
      expect(
        store().selectedImmunizations[0].errors.statusReason,
      ).toBeDefined();

      store().updateStatusReason(id, { code: 'other', display: 'Other' });

      expect(
        store().selectedImmunizations[0].errors.statusReason,
      ).toBeUndefined();
    });

    it('retains statusReason error when set to null after validation', () => {
      store().setAttributes([{ name: 'statusReason', required: true }]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;

      store().validateAll();
      store().updateStatusReason(id, null);

      expect(
        store().selectedImmunizations[0].errors.statusReason,
      ).toBeDefined();
    });

    it('allows clearing statusReason back to null', () => {
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateStatusReason(id, { code: 'x', display: 'X' });

      store().updateStatusReason(id, null);

      expect(store().selectedImmunizations[0].statusReason).toBeNull();
    });
  });

  describe('setWaiverReasonConfig', () => {
    it('sets the waiverReasonConfig used for conditional validation', () => {
      store().setWaiverReasonConfig({ otherReasonConceptUuid: 'other-uuid' });

      expect(store().waiverReasonConfig).toEqual({
        otherReasonConceptUuid: 'other-uuid',
      });
    });
  });

  describe('validateAll - conditional note requirement for the "Other" reason', () => {
    const OTHER_UUID = 'other-uuid';

    it('requires note when statusReason matches otherReasonConceptUuid, even if note is not marked required', () => {
      store().setWaiverReasonConfig({ otherReasonConceptUuid: OTHER_UUID });
      store().setAttributes([{ name: 'note', required: false }]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateStatusReason(id, { code: OTHER_UUID, display: 'Other' });

      const isValid = store().validateAll();

      expect(isValid).toBe(false);
      expect(store().selectedImmunizations[0].errors.note).toBe(
        'IMMUNIZATION_INPUT_CONTROL_NOTE_REQUIRED',
      );
    });

    it('passes validation once a note is provided for the "Other" reason', () => {
      store().setWaiverReasonConfig({ otherReasonConceptUuid: OTHER_UUID });
      store().setAttributes([{ name: 'note', required: false }]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateStatusReason(id, { code: OTHER_UUID, display: 'Other' });
      store().updateNote(id, 'Some explanation');

      const isValid = store().validateAll();

      expect(isValid).toBe(true);
      expect(store().selectedImmunizations[0].errors.note).toBeUndefined();
    });

    it('does not require note when statusReason does not match otherReasonConceptUuid', () => {
      store().setWaiverReasonConfig({ otherReasonConceptUuid: OTHER_UUID });
      store().setAttributes([{ name: 'note', required: false }]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateStatusReason(id, {
        code: 'not-age-appropriate',
        display: 'Not age appropriate',
      });

      const isValid = store().validateAll();

      expect(isValid).toBe(true);
      expect(store().selectedImmunizations[0].errors.note).toBeUndefined();
    });

    it('clears a previously-set "Other reason" note error once the reason changes away from Other', () => {
      store().setWaiverReasonConfig({ otherReasonConceptUuid: OTHER_UUID });
      store().setAttributes([{ name: 'note', required: false }]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateStatusReason(id, { code: OTHER_UUID, display: 'Other' });
      store().validateAll();
      expect(store().selectedImmunizations[0].errors.note).toBeDefined();

      store().updateStatusReason(id, {
        code: 'not-age-appropriate',
        display: 'Not age appropriate',
      });
      store().validateAll();

      expect(store().selectedImmunizations[0].errors.note).toBeUndefined();
    });

    it('still enforces note as required via attribute config regardless of reason', () => {
      store().setWaiverReasonConfig({ otherReasonConceptUuid: OTHER_UUID });
      store().setAttributes([{ name: 'note', required: true }]);
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateStatusReason(id, {
        code: 'not-age-appropriate',
        display: 'Not age appropriate',
      });

      const isValid = store().validateAll();

      expect(isValid).toBe(false);
      expect(store().selectedImmunizations[0].errors.note).toBe(
        'IMMUNIZATION_INPUT_CONTROL_NOTE_REQUIRED',
      );
    });
  });

  describe('updateStockLocation', () => {
    it('updates stockLocation on the target entry without touching other entries', () => {
      store().addImmunization(mockVaccineCode);
      store().addImmunization(secondVaccineCode);
      const targetId = store().selectedImmunizations[0].id;
      const otherEntryBefore = store().selectedImmunizations[1];

      store().updateStockLocation(targetId, 'Nurse Station');

      expect(store().selectedImmunizations[0].stockLocation).toBe(
        'Nurse Station',
      );
      expect(store().selectedImmunizations[1]).toEqual(otherEntryBefore);
    });

    it('clears stockLocation when called with null', () => {
      store().addImmunization(mockVaccineCode);
      const id = store().selectedImmunizations[0].id;
      store().updateStockLocation(id, 'Nurse Station');

      store().updateStockLocation(id, null);

      expect(store().selectedImmunizations[0].stockLocation).toBeNull();
    });

    it('is a no-op for a non-existent id', () => {
      store().addImmunization(mockVaccineCode);
      const before = [...store().selectedImmunizations];

      store().updateStockLocation('non-existent-id', 'Nurse Station');

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

  describe('CDSS functionality', () => {
    beforeEach(() => {
      store().reset();
      store().setAttributes(mockAllRequiredAttributes);
    });

    describe('updateItemCDSCards', () => {
      it('updates CDS cards for specific item', () => {
        const itemId = store().addImmunization(mockVaccineCode);
        store().updateItemCDSCards(itemId, [mockCDSCard]);

        const item = store().selectedImmunizations.find((i) => i.id === itemId);
        expect(item?.cdsCards).toEqual([mockCDSCard]);
      });

      it('updates only the specified item', () => {
        const itemId1 = store().addImmunization(mockVaccineCode);
        const itemId2 = store().addImmunization(secondVaccineCode);

        store().updateItemCDSCards(itemId1, [mockCDSCard]);

        const item1 = store().selectedImmunizations.find(
          (i) => i.id === itemId1,
        );
        const item2 = store().selectedImmunizations.find(
          (i) => i.id === itemId2,
        );

        expect(item1?.cdsCards).toEqual([mockCDSCard]);
        expect(item2?.cdsCards).toBeUndefined();
      });

      it('replaces existing CDS cards', () => {
        const itemId = store().addImmunization(mockVaccineCode);
        store().updateItemCDSCards(itemId, [mockCDSCard]);
        store().updateItemCDSCards(itemId, [mockCriticalCDSCard]);

        const item = store().selectedImmunizations.find((i) => i.id === itemId);
        expect(item?.cdsCards).toEqual([mockCriticalCDSCard]);
      });
    });

    describe('hasCriticalCDSCards', () => {
      it('returns false when no items have cards', () => {
        store().addImmunization(mockVaccineCode);
        expect(store().hasCriticalCDSCards()).toBe(false);
      });

      it('returns false when items only have non-critical cards', () => {
        const itemId = store().addImmunization(mockVaccineCode);
        store().updateItemCDSCards(itemId, [mockCDSCard]);

        expect(store().hasCriticalCDSCards()).toBe(false);
      });

      it('returns true when at least one item has a critical card', () => {
        const itemId = store().addImmunization(mockVaccineCode);
        store().updateItemCDSCards(itemId, [mockCriticalCDSCard]);

        expect(store().hasCriticalCDSCards()).toBe(true);
      });

      it('returns true when one of multiple items has a critical card', () => {
        const itemId1 = store().addImmunization(mockVaccineCode);
        const itemId2 = store().addImmunization(secondVaccineCode);

        store().updateItemCDSCards(itemId1, [mockCDSCard]);
        store().updateItemCDSCards(itemId2, [mockCriticalCDSCard]);

        expect(store().hasCriticalCDSCards()).toBe(true);
      });

      it('returns true when item has both critical and non-critical cards', () => {
        const itemId = store().addImmunization(mockVaccineCode);
        store().updateItemCDSCards(itemId, [mockCDSCard, mockCriticalCDSCard]);

        expect(store().hasCriticalCDSCards()).toBe(true);
      });
    });
  });
});
