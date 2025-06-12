import { RadiologyInvestigation } from '@/types/radiologyInvestigation';
import {
  PRIORITY_ORDER,
  getRadiologyPriority,
  sortRadiologyInvestigationsByPriority,
} from '../radiologyInvestigation';

// Mock radiology investigation data for testing
const createMockRadiologyInvestigation = (
  id: string,
  testName: string,
  priority: string,
): RadiologyInvestigation => ({
  id,
  testName,
  priority,
  orderedBy: 'Dr. Test',
  orderedDate: '2023-01-01',
});

describe('radiologyInvestigation utilities', () => {
  describe('PRIORITY_ORDER', () => {
    it('should define correct priority order', () => {
      expect(PRIORITY_ORDER).toEqual(['urgent', 'routine', 'stat']);
    });
  });

  describe('getRadiologyPriority', () => {
    it('should return 0 for urgent priority', () => {
      expect(getRadiologyPriority('urgent')).toBe(0);
    });

    it('should return 1 for routine priority', () => {
      expect(getRadiologyPriority('routine')).toBe(1);
    });

    it('should return 2 for stat priority', () => {
      expect(getRadiologyPriority('stat')).toBe(2);
    });

    it('should return 999 for unknown priority', () => {
      expect(getRadiologyPriority('unknown')).toBe(999);
    });

    it('should handle empty string', () => {
      expect(getRadiologyPriority('')).toBe(999);
    });

    it('should handle case insensitive matching', () => {
      expect(getRadiologyPriority('URGENT')).toBe(0);
      expect(getRadiologyPriority('Routine')).toBe(1);
      expect(getRadiologyPriority('STAT')).toBe(2);
    });
  });

  describe('sortRadiologyInvestigationsByPriority', () => {
    it('should sort urgent before routine', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Routine X-Ray', 'routine'),
        createMockRadiologyInvestigation('1', 'Urgent CT Scan', 'urgent'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[1].priority).toBe('routine');
    });

    it('should sort urgent before stat', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Stat MRI', 'stat'),
        createMockRadiologyInvestigation('1', 'Urgent CT Scan', 'urgent'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[1].priority).toBe('stat');
    });

    it('should sort routine before stat', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Stat MRI', 'stat'),
        createMockRadiologyInvestigation('1', 'Routine X-Ray', 'routine'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('routine');
      expect(sorted[1].priority).toBe('stat');
    });

    it('should maintain stable sorting for same priority level', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'First Urgent', 'urgent'),
        createMockRadiologyInvestigation('2', 'Second Urgent', 'urgent'),
        createMockRadiologyInvestigation('3', 'Third Urgent', 'urgent'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should handle mixed priority levels correctly', () => {
      const investigations = [
        createMockRadiologyInvestigation('4', 'Unknown Priority', 'unknown'),
        createMockRadiologyInvestigation('3', 'Stat MRI', 'stat'),
        createMockRadiologyInvestigation('2', 'Routine X-Ray', 'routine'),
        createMockRadiologyInvestigation('1', 'Urgent CT', 'urgent'),
        createMockRadiologyInvestigation('5', 'Another Urgent', 'urgent'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[1].priority).toBe('urgent');
      expect(sorted[2].priority).toBe('routine');
      expect(sorted[3].priority).toBe('stat');
      expect(sorted[4].priority).toBe('unknown');
    });

    it('should handle empty array', () => {
      const sorted = sortRadiologyInvestigationsByPriority([]);
      expect(sorted).toEqual([]);
    });

    it('should handle single item array', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'Single Investigation', 'urgent'),
      ];
      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('1');
    });

    it('should not mutate original array', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Routine', 'routine'),
        createMockRadiologyInvestigation('1', 'Urgent', 'urgent'),
      ];
      const originalOrder = [...investigations];

      sortRadiologyInvestigationsByPriority(investigations);

      expect(investigations).toEqual(originalOrder);
    });

    it('should handle all urgent investigations', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'First Urgent', 'urgent'),
        createMockRadiologyInvestigation('2', 'Second Urgent', 'urgent'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[1].priority).toBe('urgent');
    });

    it('should handle all routine investigations', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'First Routine', 'routine'),
        createMockRadiologyInvestigation('2', 'Second Routine', 'routine'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].priority).toBe('routine');
      expect(sorted[1].priority).toBe('routine');
    });

    it('should handle case insensitive priority matching', () => {
      const investigations = [
        createMockRadiologyInvestigation('3', 'Routine X-Ray', 'ROUTINE'),
        createMockRadiologyInvestigation('1', 'Urgent CT', 'URGENT'),
        createMockRadiologyInvestigation('2', 'Stat MRI', 'STAT'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('URGENT');
      expect(sorted[1].priority).toBe('ROUTINE');
      expect(sorted[2].priority).toBe('STAT');
    });
  });
});
