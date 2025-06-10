import { FormattedDiagnosis } from '@types/diagnosis';
import {
  CERTAINTY_PRIORITY_ORDER,
  getCertaintyPriority,
  sortDiagnosesByCertainty,
} from '../diagnosis';

// Mock diagnosis data for testing
const createMockDiagnosis = (
  id: string,
  display: string,
  certaintyCode: string,
): FormattedDiagnosis => ({
  id,
  display,
  certainty: {
    code: certaintyCode,
    display: certaintyCode,
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
  recordedDate: '2023-01-01',
  recorder: 'Dr. Test',
});

describe('diagnosis utilities', () => {
  describe('CERTAINTY_PRIORITY_ORDER', () => {
    it('should define correct priority order', () => {
      expect(CERTAINTY_PRIORITY_ORDER).toEqual(['confirmed', 'provisional']);
    });
  });

  describe('getCertaintyPriority', () => {
    it('should return 0 for confirmed certainty', () => {
      expect(getCertaintyPriority('confirmed')).toBe(0);
    });

    it('should return 1 for provisional certainty', () => {
      expect(getCertaintyPriority('provisional')).toBe(1);
    });

    it('should return 999 for unknown certainty', () => {
      expect(getCertaintyPriority('unknown')).toBe(999);
    });

    it('should handle empty string', () => {
      expect(getCertaintyPriority('')).toBe(999);
    });

    it('should handle case sensitivity (all lowercase expected)', () => {
      expect(getCertaintyPriority('confirmed')).toBe(0);
      expect(getCertaintyPriority('provisional')).toBe(1);
    });
  });

  describe('sortDiagnosesByCertainty', () => {
    it('should sort confirmed before provisional', () => {
      const diagnoses = [
        createMockDiagnosis('2', 'Provisional Diagnosis', 'provisional'),
        createMockDiagnosis('1', 'Confirmed Diagnosis', 'confirmed'),
      ];

      const sorted = sortDiagnosesByCertainty(diagnoses);

      expect(sorted[0].certainty.code).toBe('confirmed');
      expect(sorted[1].certainty.code).toBe('provisional');
    });

    it('should maintain stable sorting for same certainty level', () => {
      const diagnoses = [
        createMockDiagnosis('1', 'First Confirmed', 'confirmed'),
        createMockDiagnosis('2', 'Second Confirmed', 'confirmed'),
        createMockDiagnosis('3', 'Third Confirmed', 'confirmed'),
      ];

      const sorted = sortDiagnosesByCertainty(diagnoses);

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should handle mixed certainty levels correctly', () => {
      const diagnoses = [
        createMockDiagnosis('3', 'Unknown', 'unknown'),
        createMockDiagnosis('2', 'Provisional', 'provisional'),
        createMockDiagnosis('1', 'Confirmed', 'confirmed'),
        createMockDiagnosis('4', 'Another Confirmed', 'confirmed'),
      ];

      const sorted = sortDiagnosesByCertainty(diagnoses);

      expect(sorted[0].certainty.code).toBe('confirmed');
      expect(sorted[1].certainty.code).toBe('confirmed');
      expect(sorted[2].certainty.code).toBe('provisional');
      expect(sorted[3].certainty.code).toBe('unknown');
    });

    it('should handle empty array', () => {
      const sorted = sortDiagnosesByCertainty([]);
      expect(sorted).toEqual([]);
    });

    it('should handle single item array', () => {
      const diagnoses = [
        createMockDiagnosis('1', 'Single Diagnosis', 'confirmed'),
      ];
      const sorted = sortDiagnosesByCertainty(diagnoses);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('1');
    });

    it('should not mutate original array', () => {
      const diagnoses = [
        createMockDiagnosis('2', 'Provisional', 'provisional'),
        createMockDiagnosis('1', 'Confirmed', 'confirmed'),
      ];
      const originalOrder = [...diagnoses];

      sortDiagnosesByCertainty(diagnoses);

      expect(diagnoses).toEqual(originalOrder);
    });

    it('should handle all confirmed diagnoses', () => {
      const diagnoses = [
        createMockDiagnosis('1', 'First Confirmed', 'confirmed'),
        createMockDiagnosis('2', 'Second Confirmed', 'confirmed'),
      ];

      const sorted = sortDiagnosesByCertainty(diagnoses);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].certainty.code).toBe('confirmed');
      expect(sorted[1].certainty.code).toBe('confirmed');
    });

    it('should handle all provisional diagnoses', () => {
      const diagnoses = [
        createMockDiagnosis('1', 'First Provisional', 'provisional'),
        createMockDiagnosis('2', 'Second Provisional', 'provisional'),
      ];

      const sorted = sortDiagnosesByCertainty(diagnoses);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].certainty.code).toBe('provisional');
      expect(sorted[1].certainty.code).toBe('provisional');
    });
  });
});
