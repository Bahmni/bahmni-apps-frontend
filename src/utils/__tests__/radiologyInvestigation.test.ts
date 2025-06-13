import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import {
  PRIORITY_ORDER,
  getRadiologyPriority,
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
} from '../radiologyInvestigation';
import {
  createMockRadiologyInvestigation,
  mockRadiologyInvestigationsForFiltering,
  mockRadiologyChainReplacement,
} from '@__mocks__/radiologyInvestigationMocks';

describe('radiologyInvestigation utilities', () => {
  describe('PRIORITY_ORDER', () => {
    it('should define correct priority order', () => {
      expect(PRIORITY_ORDER).toEqual(['stat', 'routine']);
    });
  });

  describe('getRadiologyPriority', () => {
    it('should return 0 for stat priority', () => {
      expect(getRadiologyPriority('stat')).toBe(0);
    });

    it('should return 1 for routine priority', () => {
      expect(getRadiologyPriority('routine')).toBe(1);
    });

    it('should return 999 for unknown priority', () => {
      expect(getRadiologyPriority('unknown')).toBe(999);
    });

    it('should handle empty string', () => {
      expect(getRadiologyPriority('')).toBe(999);
    });

    it('should handle case insensitive matching', () => {
      expect(getRadiologyPriority('STAT')).toBe(0);
      expect(getRadiologyPriority('Routine')).toBe(1);
      expect(getRadiologyPriority('URGENT')).toBe(999);
    });
  });

  describe('sortRadiologyInvestigationsByPriority', () => {
    it('should sort stat before routine', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Routine X-Ray', 'routine'),
        createMockRadiologyInvestigation('1', 'Stat CT Scan', 'stat'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('stat');
      expect(sorted[1].priority).toBe('routine');
    });

    it('should sort stat before unknown priority', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Unknown MRI', 'unknown'),
        createMockRadiologyInvestigation('1', 'Stat CT Scan', 'stat'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('stat');
      expect(sorted[1].priority).toBe('unknown');
    });

    it('should sort routine before unknown priority', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Unknown MRI', 'unknown'),
        createMockRadiologyInvestigation('1', 'Routine X-Ray', 'routine'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('routine');
      expect(sorted[1].priority).toBe('unknown');
    });

    it('should maintain stable sorting for same priority level', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'First Stat', 'stat'),
        createMockRadiologyInvestigation('2', 'Second Stat', 'stat'),
        createMockRadiologyInvestigation('3', 'Third Stat', 'stat'),
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
        createMockRadiologyInvestigation('1', 'Another Stat', 'stat'),
        createMockRadiologyInvestigation('5', 'Another Routine', 'routine'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('stat');
      expect(sorted[1].priority).toBe('stat');
      expect(sorted[2].priority).toBe('routine');
      expect(sorted[3].priority).toBe('routine');
      expect(sorted[4].priority).toBe('unknown');
    });

    it('should handle empty array', () => {
      const sorted = sortRadiologyInvestigationsByPriority([]);
      expect(sorted).toEqual([]);
    });

    it('should handle single item array', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'Single Investigation', 'stat'),
      ];
      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('1');
    });

    it('should not mutate original array', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Routine', 'routine'),
        createMockRadiologyInvestigation('1', 'Stat', 'stat'),
      ];
      const originalOrder = [...investigations];

      sortRadiologyInvestigationsByPriority(investigations);

      expect(investigations).toEqual(originalOrder);
    });

    it('should handle all stat investigations', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'First Stat', 'stat'),
        createMockRadiologyInvestigation('2', 'Second Stat', 'stat'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].priority).toBe('stat');
      expect(sorted[1].priority).toBe('stat');
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
        createMockRadiologyInvestigation('1', 'Unknown CT', 'UNKNOWN'),
        createMockRadiologyInvestigation('2', 'Stat MRI', 'STAT'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('STAT');
      expect(sorted[1].priority).toBe('ROUTINE');
      expect(sorted[2].priority).toBe('UNKNOWN');
    });
  });

  describe('filterReplacementEntries', () => {
    const createMockInvestigationWithReplaces = (
      id: string,
      testName: string,
      priority: string,
      replaces?: string[],
    ): RadiologyInvestigation => ({
      id,
      testName,
      priority,
      orderedBy: 'Dr. Test',
      orderedDate: '2023-01-01',
      ...(replaces && replaces.length > 0 && { replaces }),
    });

    it('should filter out both replacing and replaced entries', async () => {
      const filtered = filterRadiologyInvestionsReplacementEntries(
        mockRadiologyInvestigationsForFiltering,
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('9c847638-295b-4e3e-933d-47d5cad34faf');
      expect(filtered[0].testName).toBe('X-Ray - Standalone');
    });

    it('should handle single replacement relationship', async () => {
      const investigations = [
        createMockInvestigationWithReplaces(
          'replacing-1',
          'New Order',
          'stat',
          ['replaced-1'],
        ),
        createMockInvestigationWithReplaces(
          'replaced-1',
          'Old Order',
          'routine',
        ),
      ];

      const filtered =
        filterRadiologyInvestionsReplacementEntries(investigations);

      expect(filtered).toHaveLength(0);
    });

    it('should handle multiple replacements by single entry', async () => {
      const investigations = [
        createMockInvestigationWithReplaces(
          'replacing-1',
          'New Combined Order',
          'stat',
          ['replaced-1', 'replaced-2'],
        ),
        createMockInvestigationWithReplaces(
          'replaced-1',
          'Old Order 1',
          'routine',
        ),
        createMockInvestigationWithReplaces(
          'replaced-2',
          'Old Order 2',
          'routine',
        ),
        createMockInvestigationWithReplaces(
          'standalone-1',
          'Standalone Order',
          'routine',
        ),
      ];

      const filtered =
        filterRadiologyInvestionsReplacementEntries(investigations);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('standalone-1');
    });

    it('should handle investigations without any replacements', async () => {
      const investigations = [
        createMockInvestigationWithReplaces('1', 'X-Ray', 'routine'),
        createMockInvestigationWithReplaces('2', 'CT Scan', 'stat'),
        createMockInvestigationWithReplaces('3', 'MRI', 'routine'),
      ];

      const filtered =
        filterRadiologyInvestionsReplacementEntries(investigations);

      expect(filtered).toHaveLength(3);
      expect(filtered).toEqual(investigations);
    });

    it('should handle empty array', async () => {
      const filtered = filterRadiologyInvestionsReplacementEntries([]);
      expect(filtered).toEqual([]);
    });

    it('should handle chain of replacements', async () => {
      const filtered = filterRadiologyInvestionsReplacementEntries(
        mockRadiologyChainReplacement,
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('standalone');
    });

    it('should not mutate original array', async () => {
      const investigations = [
        createMockInvestigationWithReplaces('replacing', 'New', 'stat', [
          'replaced',
        ]),
        createMockInvestigationWithReplaces('replaced', 'Old', 'routine'),
      ];
      const originalLength = investigations.length;

      filterRadiologyInvestionsReplacementEntries(investigations);

      expect(investigations).toHaveLength(originalLength);
      expect(investigations[0].id).toBe('replacing');
      expect(investigations[1].id).toBe('replaced');
    });

    it('should handle investigations with empty replaces array', async () => {
      const investigations = [
        createMockInvestigationWithReplaces('1', 'Test 1', 'routine', []),
        createMockInvestigationWithReplaces('2', 'Test 2', 'stat'),
      ];

      const filtered =
        filterRadiologyInvestionsReplacementEntries(investigations);

      expect(filtered).toHaveLength(2);
      expect(filtered).toEqual(investigations);
    });

    it('should handle complex scenario with multiple replacement relationships', async () => {
      const investigations = [
        // Standalone entries (should remain)
        createMockInvestigationWithReplaces(
          'standalone-1',
          'Standalone 1',
          'routine',
        ),
        createMockInvestigationWithReplaces(
          'standalone-2',
          'Standalone 2',
          'stat',
        ),

        // First replacement pair (both should be filtered)
        createMockInvestigationWithReplaces(
          'replacing-a',
          'Replacing A',
          'stat',
          ['replaced-a'],
        ),
        createMockInvestigationWithReplaces(
          'replaced-a',
          'Replaced A',
          'routine',
        ),

        // Second replacement (multiple replaces, all should be filtered)
        createMockInvestigationWithReplaces(
          'replacing-b',
          'Replacing B',
          'routine',
          ['replaced-b1', 'replaced-b2'],
        ),
        createMockInvestigationWithReplaces(
          'replaced-b1',
          'Replaced B1',
          'routine',
        ),
        createMockInvestigationWithReplaces(
          'replaced-b2',
          'Replaced B2',
          'stat',
        ),
      ];

      const filtered =
        filterRadiologyInvestionsReplacementEntries(investigations);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((i: RadiologyInvestigation) => i.id)).toEqual([
        'standalone-1',
        'standalone-2',
      ]);
    });
  });
});
