import { Medication } from 'fhir/r4';
import { Concept } from '@types/encounterConcepts';
import { DurationUnitOption } from '@types/medication';
import { DrugFormDefault, Frequency } from '@types/medicationConfig';
import {
  getDefaultRoute,
  getDefaultDosingUnit,
  calculateTotalQuantity,
  isImmediateFrequency,
} from '../medicationsValueCalculator';

describe('medicationsValueCalculator', () => {
  describe('getDefaultRoute', () => {
    const mockRoutes: Concept[] = [
      { name: 'Oral', uuid: 'route-1' },
      { name: 'Intravenous', uuid: 'route-2' },
      { name: 'Intramuscular', uuid: 'route-3' },
    ];

    const mockDrugFormDefaults: Record<string, DrugFormDefault> = {
      Tablet: { route: 'Oral', doseUnits: 'mg' },
      Injection: { route: 'Intravenous', doseUnits: 'ml' },
      Capsule: { route: 'Oral', doseUnits: 'mg' },
    };

    it('should return the correct route when medication has a valid form', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        form: { text: 'Tablet' },
      };

      const result = getDefaultRoute(
        medication,
        mockDrugFormDefaults,
        mockRoutes,
      );

      expect(result).toEqual({ name: 'Oral', uuid: 'route-1' });
    });

    it('should return undefined when medication has no form', () => {
      const medication: Medication = {
        resourceType: 'Medication',
      };

      const result = getDefaultRoute(
        medication,
        mockDrugFormDefaults,
        mockRoutes,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when medication form has no text', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        form: {},
      };

      const result = getDefaultRoute(
        medication,
        mockDrugFormDefaults,
        mockRoutes,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when drug form is not in defaults', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        form: { text: 'Syrup' },
      };

      const result = getDefaultRoute(
        medication,
        mockDrugFormDefaults,
        mockRoutes,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when route name is not found in routes list', () => {
      const customDefaults: Record<string, DrugFormDefault> = {
        Tablet: { route: 'Topical', doseUnits: 'mg' },
      };
      const medication: Medication = {
        resourceType: 'Medication',
        form: { text: 'Tablet' },
      };

      const result = getDefaultRoute(medication, customDefaults, mockRoutes);

      expect(result).toBeUndefined();
    });

    it('should return undefined when drug form default has no route', () => {
      const customDefaults: Record<string, DrugFormDefault> = {
        Tablet: { doseUnits: 'mg' },
      };
      const medication: Medication = {
        resourceType: 'Medication',
        form: { text: 'Tablet' },
      };

      const result = getDefaultRoute(medication, customDefaults, mockRoutes);

      expect(result).toBeUndefined();
    });
  });

  describe('getDefaultDosingUnit', () => {
    const mockDosingUnits: Concept[] = [
      { name: 'mg', uuid: 'unit-1' },
      { name: 'ml', uuid: 'unit-2' },
      { name: 'g', uuid: 'unit-3' },
    ];

    const mockDrugFormDefaults: Record<string, DrugFormDefault> = {
      Tablet: { route: 'Oral', doseUnits: 'mg' },
      Injection: { route: 'Intravenous', doseUnits: 'ml' },
      Powder: { route: 'Oral', doseUnits: 'g' },
    };

    it('should return the correct dosing unit when medication has a valid form', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        form: { text: 'Injection' },
      };

      const result = getDefaultDosingUnit(
        medication,
        mockDrugFormDefaults,
        mockDosingUnits,
      );

      expect(result).toEqual({ name: 'ml', uuid: 'unit-2' });
    });

    it('should return undefined when medication has no form', () => {
      const medication: Medication = {
        resourceType: 'Medication',
      };

      const result = getDefaultDosingUnit(
        medication,
        mockDrugFormDefaults,
        mockDosingUnits,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when medication form has no text', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        form: {},
      };

      const result = getDefaultDosingUnit(
        medication,
        mockDrugFormDefaults,
        mockDosingUnits,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when drug form is not in defaults', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        form: { text: 'Cream' },
      };

      const result = getDefaultDosingUnit(
        medication,
        mockDrugFormDefaults,
        mockDosingUnits,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when dosing unit name is not found in units list', () => {
      const customDefaults: Record<string, DrugFormDefault> = {
        Tablet: { route: 'Oral', doseUnits: 'mcg' },
      };
      const medication: Medication = {
        resourceType: 'Medication',
        form: { text: 'Tablet' },
      };

      const result = getDefaultDosingUnit(
        medication,
        customDefaults,
        mockDosingUnits,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when drug form default has no dose units', () => {
      const customDefaults: Record<string, DrugFormDefault> = {
        Tablet: { route: 'Oral' },
      };
      const medication: Medication = {
        resourceType: 'Medication',
        form: { text: 'Tablet' },
      };

      const result = getDefaultDosingUnit(
        medication,
        customDefaults,
        mockDosingUnits,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('calculateTotalQuantity', () => {
    const mockDurationUnit: DurationUnitOption = {
      code: 'd',
      display: 'Day(s)',
      daysMultiplier: 1,
    };

    const mockFrequency: Frequency = {
      name: 'Twice daily',
      uuid: 'freq-1',
      frequencyPerDay: 2,
    };

    it('should calculate correct total quantity for valid inputs', () => {
      const result = calculateTotalQuantity(
        10,
        mockFrequency,
        5,
        mockDurationUnit,
      );

      expect(result).toBe(100); // 10 * 2 * 5 * 1 = 100
    });

    it('should return dosage for immediate frequency', () => {
      const immediateFrequency: Frequency = {
        name: 'Immediately',
        uuid: '0',
        frequencyPerDay: 1,
      };

      const result = calculateTotalQuantity(
        25,
        immediateFrequency,
        5,
        mockDurationUnit,
      );

      expect(result).toBe(25);
    });

    it('should return 0 when dosage is 0', () => {
      const result = calculateTotalQuantity(
        0,
        mockFrequency,
        5,
        mockDurationUnit,
      );

      expect(result).toBe(0);
    });

    it('should return 0 when dosage is negative', () => {
      const result = calculateTotalQuantity(
        -10,
        mockFrequency,
        5,
        mockDurationUnit,
      );

      expect(result).toBe(0);
    });

    it('should return 0 when duration is 0', () => {
      const result = calculateTotalQuantity(
        10,
        mockFrequency,
        0,
        mockDurationUnit,
      );

      expect(result).toBe(0);
    });

    it('should return 0 when duration is negative', () => {
      const result = calculateTotalQuantity(
        10,
        mockFrequency,
        -5,
        mockDurationUnit,
      );

      expect(result).toBe(0);
    });

    it('should return 0 when frequency is null', () => {
      const result = calculateTotalQuantity(10, null, 5, mockDurationUnit);

      expect(result).toBe(0);
    });

    it('should return 0 when frequency has no frequencyPerDay', () => {
      const invalidFrequency = {
        name: 'Invalid',
        uuid: 'invalid',
        frequencyPerDay: undefined,
      } as unknown as Frequency;

      const result = calculateTotalQuantity(
        10,
        invalidFrequency,
        5,
        mockDurationUnit,
      );

      expect(result).toBe(0);
    });

    it('should return 0 when frequency has 0 frequencyPerDay', () => {
      const zeroFrequency: Frequency = {
        name: 'Zero',
        uuid: 'zero',
        frequencyPerDay: 0,
      };

      const result = calculateTotalQuantity(
        10,
        zeroFrequency,
        5,
        mockDurationUnit,
      );

      expect(result).toBe(0);
    });

    it('should handle different duration units correctly', () => {
      const weekDurationUnit: DurationUnitOption = {
        code: 'wk',
        display: 'Week(s)',
        daysMultiplier: 7,
      };

      const result = calculateTotalQuantity(
        5,
        mockFrequency,
        2,
        weekDurationUnit,
      );

      expect(result).toBe(140); // 5 * 2 * 2 * 7 = 140
    });

    it('should handle fractional dosage and round up', () => {
      const result = calculateTotalQuantity(
        2.5,
        mockFrequency,
        3,
        mockDurationUnit,
      );

      expect(result).toBe(15); // Math.ceil(2.5 * 2 * 3 * 1) = 15
    });

    it('should return 0 when durationUnit is null', () => {
      const result = calculateTotalQuantity(10, mockFrequency, 5, null);

      expect(result).toBe(0);
    });

    it('should return at least the dosage when calculated result is less than dosage', () => {
      // Test case where frequency * duration * daysMultiplier < 1
      const lowFrequency: Frequency = {
        name: 'Once every 3 days',
        uuid: 'low-freq',
        frequencyPerDay: 0.33, // Once every 3 days
      };

      const result = calculateTotalQuantity(
        10,
        lowFrequency,
        1,
        mockDurationUnit,
      );

      // 10 * 0.33 * 1 * 1 = 3.3, rounded up to 4
      // Since 4 < 10 (dosage), should return 10
      expect(result).toBe(10);
    });

    it('should return calculated result when it equals or exceeds dosage', () => {
      // Test case where calculated result >= dosage
      const result = calculateTotalQuantity(
        5,
        mockFrequency,
        3,
        mockDurationUnit,
      );

      // 5 * 2 * 3 * 1 = 30, which is >= 5
      expect(result).toBe(30);
    });

    it('should return 0 when calculated result is 0 even if less than dosage', () => {
      // This tests that the minimum dosage logic only applies to non-zero results
      const zeroFrequency: Frequency = {
        name: 'Zero frequency',
        uuid: 'zero-freq',
        frequencyPerDay: 0,
      };

      const result = calculateTotalQuantity(
        10,
        zeroFrequency,
        5,
        mockDurationUnit,
      );

      // Should return 0, not 10, because the result is 0
      expect(result).toBe(0);
    });

    it('should handle edge case with very small frequency resulting in 1 after ceiling', () => {
      const veryLowFrequency: Frequency = {
        name: 'Very low frequency',
        uuid: 'very-low-freq',
        frequencyPerDay: 0.01, // Very small frequency
      };

      const result = calculateTotalQuantity(
        100,
        veryLowFrequency,
        1,
        mockDurationUnit,
      );

      // 100 * 0.01 * 1 * 1 = 1
      // Since 1 < 100 (dosage), should return 100
      expect(result).toBe(100);
    });

    it('should handle fractional calculation that rounds up to exactly dosage', () => {
      const customFrequency: Frequency = {
        name: 'Custom frequency',
        uuid: 'custom-freq',
        frequencyPerDay: 0.4,
      };

      const result = calculateTotalQuantity(
        5,
        customFrequency,
        2,
        mockDurationUnit,
      );

      // 5 * 0.4 * 2 * 1 = 4, which is < 5
      // Should return 5 (the dosage)
      expect(result).toBe(5);
    });
  });

  describe('isImmediateFrequency', () => {
    it("should return true when frequency uuid is '0'", () => {
      const frequency: Frequency = {
        name: 'Immediately',
        uuid: '0',
        frequencyPerDay: 1,
      };

      const result = isImmediateFrequency(frequency);

      expect(result).toBe(true);
    });

    it("should return false when frequency uuid is not '0'", () => {
      const frequency: Frequency = {
        name: 'Twice daily',
        uuid: 'freq-1',
        frequencyPerDay: 2,
      };

      const result = isImmediateFrequency(frequency);

      expect(result).toBe(false);
    });

    it('should return false for empty string uuid', () => {
      const frequency: Frequency = {
        name: 'Empty',
        uuid: '',
        frequencyPerDay: 1,
      };

      const result = isImmediateFrequency(frequency);

      expect(result).toBe(false);
    });

    it('should return false for numeric zero uuid', () => {
      const frequency: Frequency = {
        name: 'Numeric Zero',
        uuid: '00',
        frequencyPerDay: 1,
      };

      const result = isImmediateFrequency(frequency);

      expect(result).toBe(false);
    });
  });
});
