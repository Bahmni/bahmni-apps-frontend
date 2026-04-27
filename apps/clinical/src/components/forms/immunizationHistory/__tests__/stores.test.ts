import { act, renderHook } from '@testing-library/react';
import { useImmunizationHistoryStore } from '../stores';
import {
  mockAllRequiredAttributes,
  mockAttributesWithOptionalAdministered,
  mockFullAttributes,
  mockVaccineCode,
} from './__mocks__/immunizationHistoryMocks';

const secondVaccineCode = { code: 'flu', display: 'Influenza Vaccine' };

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
];

describe('useImmunizationHistoryStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useImmunizationHistoryStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initialization', () => {
    it('initializes with empty selectedImmunizations and undefined attributes', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());
      expect(result.current.selectedImmunizations).toEqual([]);
      expect(result.current.attributes).toBeUndefined();
    });
  });

  describe('addImmunization', () => {
    it('adds an entry with correct default shape', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.addImmunization(mockVaccineCode);
      });

      expect(result.current.selectedImmunizations).toHaveLength(1);
      const entry = result.current.selectedImmunizations[0];
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
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.addImmunization(mockVaccineCode);
        result.current.addImmunization(secondVaccineCode);
      });

      expect(result.current.selectedImmunizations).toHaveLength(2);
      expect(result.current.selectedImmunizations[0].vaccineCode).toEqual(
        secondVaccineCode,
      );
      expect(result.current.selectedImmunizations[1].vaccineCode).toEqual(
        mockVaccineCode,
      );
      expect(result.current.selectedImmunizations[0].id).not.toBe(
        result.current.selectedImmunizations[1].id,
      );
    });
  });

  describe('removeImmunization', () => {
    it('removes only the specified entry, leaving others intact', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.addImmunization(mockVaccineCode);
        result.current.addImmunization(secondVaccineCode);
      });
      const newestId = result.current.selectedImmunizations[0].id;

      act(() => {
        result.current.removeImmunization(newestId);
      });

      expect(result.current.selectedImmunizations).toHaveLength(1);
      expect(result.current.selectedImmunizations[0].vaccineCode).toEqual(
        mockVaccineCode,
      );
    });

    it('is a no-op when the id does not exist', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.addImmunization(mockVaccineCode);
      });
      const before = [...result.current.selectedImmunizations];

      act(() => {
        result.current.removeImmunization('non-existent-id');
      });

      expect(result.current.selectedImmunizations).toEqual(before);
    });
  });

  describe('field updates', () => {
    it.each(FIELD_UPDATE_CASES)(
      'updates %s on the target entry without touching other entries',
      (fieldName, actionName, validValue) => {
        const { result } = renderHook(() => useImmunizationHistoryStore());

        act(() => {
          result.current.addImmunization(mockVaccineCode);
          result.current.addImmunization(secondVaccineCode);
        });
        const targetId = result.current.selectedImmunizations[0].id;
        const otherEntryBefore = result.current.selectedImmunizations[1];

        act(() => {
          result.current[actionName](targetId, validValue);
        });

        expect(result.current.selectedImmunizations[0][fieldName]).toEqual(
          validValue,
        );
        expect(result.current.selectedImmunizations[1]).toEqual(
          otherEntryBefore,
        );
      },
    );

    it.each(FIELD_UPDATE_CASES)(
      'is a no-op when updating %s with a non-existent id',
      (_fieldName, actionName, validValue) => {
        const { result } = renderHook(() => useImmunizationHistoryStore());

        act(() => {
          result.current.addImmunization(mockVaccineCode);
        });
        const before = [...result.current.selectedImmunizations];

        act(() => {
          result.current[actionName]('non-existent-id', validValue);
        });

        expect(result.current.selectedImmunizations).toEqual(before);
      },
    );

    it.each(FIELD_UPDATE_CASES)(
      'clears %s error when entry has been validated and a valid value is set',
      (fieldName, actionName, validValue) => {
        const { result } = renderHook(() => useImmunizationHistoryStore());

        act(() => {
          result.current.setAttributes(mockAllRequiredAttributes);
          result.current.addImmunization(mockVaccineCode);
        });
        const id = result.current.selectedImmunizations[0].id;

        act(() => {
          result.current.validateAll();
        });
        expect(
          result.current.selectedImmunizations[0].errors[fieldName],
        ).toBeDefined();

        act(() => {
          result.current[actionName](id, validValue);
        });

        expect(
          result.current.selectedImmunizations[0].errors[fieldName],
        ).toBeUndefined();
      },
    );

    it.each(ERROR_RETAINED_CASES)(
      'retains %s error when entry has been validated but value does not satisfy the field constraint',
      (fieldName, actionName, emptyOrWhitespace) => {
        const { result } = renderHook(() => useImmunizationHistoryStore());

        act(() => {
          result.current.setAttributes(mockAllRequiredAttributes);
          result.current.addImmunization(mockVaccineCode);
        });
        const id = result.current.selectedImmunizations[0].id;

        act(() => {
          result.current.validateAll();
        });

        act(() => {
          result.current[actionName](id, emptyOrWhitespace);
        });

        const errorKey = fieldName.replace(' (whitespace)', '');
        expect(
          result.current.selectedImmunizations[0].errors[errorKey],
        ).toBeDefined();
      },
    );
  });

  describe('validateAll', () => {
    it('returns true when there are no immunization entries', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());
      let isValid = false;

      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(true);
    });

    it('validates drug as required when drug attribute has required: true', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.setAttributes([{ name: 'drug', required: true }]);
        result.current.addImmunization(mockVaccineCode);
      });
      let isValid = true;

      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedImmunizations[0].errors.drug).toBe(
        'IMMUNIZATION_HISTORY_DRUG_CODE_REQUIRED',
      );
    });

    it('skips drug validation when drug attribute is absent', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.setAttributes([]);
        result.current.addImmunization(mockVaccineCode);
      });
      let isValid = true;

      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(true);
      expect(
        result.current.selectedImmunizations[0].errors.drug,
      ).toBeUndefined();
    });

    it('sets errors for all required fields and marks each entry as validated, treating whitespace-only values as empty', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.setAttributes(mockAllRequiredAttributes);
        result.current.addImmunization(mockVaccineCode);
        result.current.addImmunization(secondVaccineCode);
      });
      const firstId = result.current.selectedImmunizations[0].id;
      act(() => {
        result.current.updateAdministeredLocation(firstId, { display: '   ' });
      });
      let isValid = true;

      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      result.current.selectedImmunizations.forEach((entry) => {
        expect(entry.hasBeenValidated).toBe(true);
        expect(entry.errors.drug).toBe(
          'IMMUNIZATION_HISTORY_DRUG_CODE_REQUIRED',
        );
        expect(entry.errors.administeredOn).toBe(
          'IMMUNIZATION_HISTORY_ADMINISTERED_ON_REQUIRED',
        );
        expect(entry.errors.administeredLocation).toBe(
          'IMMUNIZATION_HISTORY_ADMINISTERED_LOCATION_REQUIRED',
        );
        expect(entry.errors.route).toBe('IMMUNIZATION_HISTORY_ROUTE_REQUIRED');
        expect(entry.errors.site).toBe('IMMUNIZATION_HISTORY_SITE_REQUIRED');
        expect(entry.errors.expiryDate).toBe(
          'IMMUNIZATION_HISTORY_EXPIRY_DATE_REQUIRED',
        );
        expect(entry.errors.manufacturer).toBe(
          'IMMUNIZATION_HISTORY_MANUFACTURER_REQUIRED',
        );
        expect(entry.errors.batchNumber).toBe(
          'IMMUNIZATION_HISTORY_BATCH_NUMBER_REQUIRED',
        );
      });
    });

    it('skips validation for fields whose required flag is false or absent', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.setAttributes(mockAttributesWithOptionalAdministered);
        result.current.addImmunization(mockVaccineCode);
      });
      const id = result.current.selectedImmunizations[0].id;
      act(() => {
        result.current.updateVaccineDrug(id, {
          code: 'bcg-code',
          display: 'BCG Drug',
        });
      });

      act(() => {
        result.current.validateAll();
      });

      const { errors } = result.current.selectedImmunizations[0];
      expect(errors.administeredOn).toBeUndefined();
      expect(errors.administeredLocation).toBeUndefined();
      expect(errors.route).toBeUndefined();
      expect(errors.site).toBeUndefined();
      expect(errors.manufacturer).toBeUndefined();
      expect(errors.batchNumber).toBeUndefined();
      expect(errors.expiryDate).toBeUndefined();
    });

    it('returns true and clears all errors when all required fields are filled', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.setAttributes(mockAllRequiredAttributes);
        result.current.addImmunization(mockVaccineCode);
      });
      const id = result.current.selectedImmunizations[0].id;
      act(() => {
        result.current.updateVaccineDrug(id, {
          code: 'bcg-code',
          display: 'BCG Drug',
        });
        result.current.updateAdministeredOn(id, new Date('2025-01-01'));
        result.current.updateAdministeredLocation(id, {
          display: 'Main Clinic',
        });
        result.current.updateRoute(id, 'im');
        result.current.updateSite(id, 'arm');
        result.current.updateExpiryDate(id, new Date('2026-01-01'));
        result.current.updateManufacturer(id, 'Pfizer');
        result.current.updateBatchNumber(id, 'BATCH-001');
      });
      let isValid = false;

      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(true);
      expect(result.current.selectedImmunizations[0].errors).toEqual({});
    });

    it('returns false when at least one entry has a validation error', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.setAttributes([{ name: 'drug', required: true }]);
        result.current.addImmunization(mockVaccineCode);
        result.current.addImmunization(secondVaccineCode);
      });
      const validId = result.current.selectedImmunizations[1].id;
      act(() => {
        result.current.updateVaccineDrug(validId, {
          code: 'bcg-code',
          display: 'BCG Drug',
        });
      });
      let isValid = true;

      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedImmunizations[0].errors.drug).toBeDefined();
      expect(
        result.current.selectedImmunizations[1].errors.drug,
      ).toBeUndefined();
    });
  });

  describe('updateNote', () => {
    it('updates note on the target entry without touching other entries, and is a no-op for a non-existent id', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.addImmunization(mockVaccineCode);
        result.current.addImmunization(secondVaccineCode);
      });
      const targetId = result.current.selectedImmunizations[0].id;
      const otherEntryBefore = result.current.selectedImmunizations[1];

      act(() => {
        result.current.updateNote(targetId, 'Some note text');
      });

      expect(result.current.selectedImmunizations[0].note).toBe(
        'Some note text',
      );
      expect(result.current.selectedImmunizations[1]).toEqual(otherEntryBefore);

      const before = [...result.current.selectedImmunizations];
      act(() => {
        result.current.updateNote('non-existent-id', 'Another note');
      });
      expect(result.current.selectedImmunizations).toEqual(before);
    });
  });

  describe('reset', () => {
    it('clears all selected immunizations', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.addImmunization(mockVaccineCode);
        result.current.addImmunization(secondVaccineCode);
      });
      expect(result.current.selectedImmunizations).toHaveLength(2);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedImmunizations).toHaveLength(0);
    });
  });

  describe('getState', () => {
    it('returns the current store state including attributes set via setAttributes', () => {
      const { result } = renderHook(() => useImmunizationHistoryStore());

      act(() => {
        result.current.setAttributes(mockFullAttributes);
        result.current.addImmunization(mockVaccineCode);
      });

      const state = result.current.getState();
      expect(state.selectedImmunizations).toHaveLength(1);
      expect(state.attributes).toEqual(mockFullAttributes);
    });
  });
});
