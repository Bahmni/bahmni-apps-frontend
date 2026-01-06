import { ServiceRequest } from 'fhir/r4';
import { RadiologyInvestigationViewModel } from '../models';
import {
  PRIORITY_ORDER,
  getRadiologyPriority,
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
  createRadiologyInvestigationViewModels,
} from '../utils';

const createMockRadiologyInvestigation = (
  id: string,
  testName: string,
  priority: string,
  replaces?: string[],
): RadiologyInvestigationViewModel => ({
  id,
  testName,
  priority,
  orderedBy: 'Dr. Test',
  orderedDate: '2023-01-01',
  ...(replaces && replaces.length > 0 && { replaces }),
});

const mockRadiologyInvestigationsForFiltering: RadiologyInvestigationViewModel[] =
  [
    {
      id: '207172a2-27e3-4fef-bea2-85fb826575e4',
      testName: 'MRI - Replacing',
      priority: 'routine',
      orderedBy: 'Dr. Test',
      orderedDate: '2023-01-01',
      replaces: ['271f2b4f-a239-418b-ba9e-f23014093df3'],
    },
    {
      id: '271f2b4f-a239-418b-ba9e-f23014093df3',
      testName: 'MRI - Replaced',
      priority: 'completed',
      orderedBy: 'Dr. Test',
      orderedDate: '2023-01-01',
    },
    {
      id: '9c847638-295b-4e3e-933d-47d5cad34faf',
      testName: 'X-Ray - Standalone',
      priority: 'routine',
      orderedBy: 'Dr. Test',
      orderedDate: '2023-01-01',
    },
  ];

const mockRadiologyChainReplacement: RadiologyInvestigationViewModel[] = [
  {
    id: 'chain-3',
    testName: 'Third Version',
    priority: 'stat',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
    replaces: ['chain-2'],
  },
  {
    id: 'chain-2',
    testName: 'Second Version',
    priority: 'routine',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
    replaces: ['chain-1'],
  },
  {
    id: 'chain-1',
    testName: 'First Version',
    priority: 'routine',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
  },
  {
    id: 'standalone',
    testName: 'Standalone',
    priority: 'routine',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
  },
];

describe('radiologyInvestigation utilities', () => {
  describe('PRIORITY_ORDER', () => {
    it('should define correct priority order', () => {
      expect(PRIORITY_ORDER).toEqual(['stat', 'routine']);
    });
  });

  describe('getRadiologyPriority', () => {
    it('should return correct priority index for known priorities', () => {
      expect(getRadiologyPriority('stat')).toBe(0);
      expect(getRadiologyPriority('routine')).toBe(1);
    });

    it('should return 999 for unknown priority', () => {
      expect(getRadiologyPriority('unknown')).toBe(999);
      expect(getRadiologyPriority('')).toBe(999);
    });

    it('should handle case insensitive matching', () => {
      expect(getRadiologyPriority('STAT')).toBe(0);
      expect(getRadiologyPriority('Routine')).toBe(1);
    });
  });

  describe('sortRadiologyInvestigationsByPriority', () => {
    it('should sort investigations by priority', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Routine X-Ray', 'routine'),
        createMockRadiologyInvestigation('1', 'Stat CT Scan', 'stat'),
        createMockRadiologyInvestigation('3', 'Unknown MRI', 'unknown'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('stat');
      expect(sorted[1].priority).toBe('routine');
      expect(sorted[2].priority).toBe('unknown');
    });

    it('should handle empty array', () => {
      const sorted = sortRadiologyInvestigationsByPriority([]);
      expect(sorted).toEqual([]);
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
  });

  describe('filterRadiologyInvestionsReplacementEntries', () => {
    it('should filter out both replacing and replaced entries', () => {
      const filtered = filterRadiologyInvestionsReplacementEntries(
        mockRadiologyInvestigationsForFiltering,
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('9c847638-295b-4e3e-933d-47d5cad34faf');
      expect(filtered[0].testName).toBe('X-Ray - Standalone');
    });

    it('should handle investigations without any replacements', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'X-Ray', 'routine'),
        createMockRadiologyInvestigation('2', 'CT Scan', 'stat'),
      ];

      const filtered =
        filterRadiologyInvestionsReplacementEntries(investigations);

      expect(filtered).toEqual(investigations);
    });

    it('should handle empty array', () => {
      const filtered = filterRadiologyInvestionsReplacementEntries([]);
      expect(filtered).toEqual([]);
    });

    it('should handle chain of replacements', () => {
      const filtered = filterRadiologyInvestionsReplacementEntries(
        mockRadiologyChainReplacement,
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('standalone');
    });
  });

  describe('createRadiologyInvestigationViewModels', () => {
    it('should transform FHIR ServiceRequest to view model', () => {
      const serviceRequest: ServiceRequest = {
        resourceType: 'ServiceRequest',
        id: 'order-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/123' },
        code: {
          text: 'Chest X-Ray',
        },
        priority: 'stat',
        requester: {
          display: 'Dr. Smith',
        },
        occurrencePeriod: {
          start: '2023-10-15T10:30:00.000Z',
        },
      };

      const result = createRadiologyInvestigationViewModels([serviceRequest]);

      expect(result).toEqual([
        {
          id: 'order-1',
          testName: 'Chest X-Ray',
          priority: 'stat',
          orderedBy: 'Dr. Smith',
          orderedDate: '2023-10-15T10:30:00.000Z',
        },
      ]);
    });

    it('should handle ServiceRequest with replaces field', () => {
      const serviceRequest: ServiceRequest = {
        resourceType: 'ServiceRequest',
        id: 'order-new',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/123' },
        code: {
          text: 'Updated X-Ray',
        },
        priority: 'stat',
        requester: {
          display: 'Dr. Smith',
        },
        occurrencePeriod: {
          start: '2023-10-15T10:30:00.000Z',
        },
        replaces: [
          {
            reference: 'ServiceRequest/order-1',
            type: 'ServiceRequest',
          },
        ],
      };

      const result = createRadiologyInvestigationViewModels([serviceRequest]);

      expect(result[0].replaces).toEqual(['order-1']);
    });

    it('should handle ServiceRequest with note field', () => {
      const serviceRequest: ServiceRequest = {
        resourceType: 'ServiceRequest',
        id: 'order-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/123' },
        code: {
          text: 'Chest X-Ray',
        },
        priority: 'stat',
        requester: {
          display: 'Dr. Smith',
        },
        occurrencePeriod: {
          start: '2023-10-15T10:30:00.000Z',
        },
        note: [
          {
            text: 'Patient should be fasting',
          },
        ],
      };

      const result = createRadiologyInvestigationViewModels([serviceRequest]);

      expect(result[0].note).toBe('Patient should be fasting');
    });

    it('should handle empty array', () => {
      const result = createRadiologyInvestigationViewModels([]);
      expect(result).toEqual([]);
    });
  });
});
