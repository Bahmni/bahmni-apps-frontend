import { formatDateTime } from '@bahmni/services';
import {
  buildVisitLocationMap,
  formatVisitDateRange,
  isIpdVisit,
  toVisitViewModels,
  translateVisitType,
} from '../utils';
import {
  mockActiveIpdEncounter,
  mockAllPatientEncounters,
  mockEncounters,
  mockMultiDayIpdEncounter,
  mockOneDayOpdEncounter,
  mockVisitViewModel,
} from './__mocks__/visitMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(),
}));

const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;

describe('visits utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatDateTime.mockImplementation((date) => ({
      formattedResult: `formatted(${date})`,
    }));
  });

  describe('buildVisitLocationMap', () => {
    it('maps each visit to the login location on its child encounters', () => {
      const map = buildVisitLocationMap(mockAllPatientEncounters);
      expect(map.get('visit-active-ipd')).toBe('OPD-1');
      expect(map.get('visit-multi-day-ipd')).toBe('Pediatric Ward');
    });

    it('keeps the first child encounter per visit when several exist', () => {
      // mockAllPatientEncounters has OPD-1 before OPD-2 for the active visit;
      // getPatientEncounters returns -_lastUpdated order, so first = most recent.
      expect(
        buildVisitLocationMap(mockAllPatientEncounters).get('visit-active-ipd'),
      ).toBe('OPD-1');
    });

    it('omits visits that have no child encounter', () => {
      expect(
        buildVisitLocationMap(mockAllPatientEncounters).has(
          'visit-one-day-opd',
        ),
      ).toBe(false);
    });

    it('ignores the visit resources themselves, which carry the facility not the login location', () => {
      // mockEncounters are the visit-tagged resources: no partOf, so no entries.
      expect(buildVisitLocationMap(mockEncounters).size).toBe(0);
    });

    it('skips child encounters missing a location', () => {
      const map = buildVisitLocationMap([
        { ...mockAllPatientEncounters[3], location: undefined },
      ]);
      expect(map.size).toBe(0);
    });
  });

  describe('toVisitViewModels', () => {
    it('resolves location from the supplied visit-location map', () => {
      const [visit] = toVisitViewModels(
        [mockActiveIpdEncounter],
        4,
        new Map([['visit-active-ipd', 'OPD-1']]),
      );
      expect(visit.location).toBe('OPD-1');
    });

    it('leaves location null when no map is supplied, ignoring the visit facility', () => {
      const [visit] = toVisitViewModels([mockActiveIpdEncounter], 4);
      expect(visit.location).toBeNull();
    });

    it('maps FHIR Encounters to a flat view model', () => {
      const result = toVisitViewModels([mockOneDayOpdEncounter]);
      expect(result).toEqual([
        {
          id: 'visit-one-day-opd',
          startDate: '2025-03-24T06:00:00.000+00:00',
          endDate: '2025-03-24T07:00:00.000+00:00',
          isActive: false,
          visitType: 'OPD',
          location: null,
        },
      ]);
    });

    it('marks a visit with no period.end as active', () => {
      const result = toVisitViewModels([mockActiveIpdEncounter]);
      expect(result[0].isActive).toBe(true);
      expect(result[0].endDate).toBeNull();
    });

    it('sorts by period.start descending regardless of input order (AC 6/7)', () => {
      const result = toVisitViewModels(mockEncounters, 10);
      expect(result.map((v) => v.id)).toEqual([
        mockActiveIpdEncounter.id,
        mockMultiDayIpdEncounter.id,
        mockOneDayOpdEncounter.id,
      ]);
    });

    it('caps results to maximumNoOfVisits (AC 6)', () => {
      const result = toVisitViewModels(mockEncounters, 2);
      expect(result).toHaveLength(2);
    });

    it('defaults maximumNoOfVisits to 4 when not provided (AC 7)', () => {
      const manyEncounters = Array.from({ length: 6 }, (_, i) => ({
        ...mockOneDayOpdEncounter,
        id: `visit-${i}`,
        period: { start: `2025-01-0${i + 1}T00:00:00.000+00:00` },
      }));
      const result = toVisitViewModels(manyEncounters);
      expect(result).toHaveLength(4);
    });

    it('filters out encounters missing an id or a period.start', () => {
      const result = toVisitViewModels([
        { ...mockOneDayOpdEncounter, id: undefined },
        { ...mockOneDayOpdEncounter, period: undefined },
      ]);
      expect(result).toEqual([]);
    });
  });

  describe('formatVisitDateRange', () => {
    const mockT = jest.fn((key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    );

    it('includes time for the active visit', () => {
      const activeVisit = {
        ...mockVisitViewModel,
        isActive: true,
        endDate: null,
        startDate: '2026-08-12T21:21:00.000+00:00',
      };
      formatVisitDateRange(activeVisit, mockT);
      expect(mockFormatDateTime).toHaveBeenCalledWith(
        activeVisit.startDate,
        mockT,
        true,
      );
    });

    it('shows only the start date for a one-day visit (AC 3)', () => {
      const oneDayVisit = {
        ...mockVisitViewModel,
        startDate: '2025-03-24T06:00:00.000+00:00',
        endDate: '2025-03-24T07:00:00.000+00:00',
      };
      const result = formatVisitDateRange(oneDayVisit, mockT);
      expect(result).toBe(`formatted(${oneDayVisit.startDate})`);
    });

    it('shows a start-to-end range for a multi-day visit (AC 4)', () => {
      const multiDayVisit = {
        ...mockVisitViewModel,
        startDate: '2025-07-15T09:00:00.000+00:00',
        endDate: '2025-07-18T10:00:00.000+00:00',
      };
      formatVisitDateRange(multiDayVisit, mockT);
      expect(mockT).toHaveBeenCalledWith('VISIT_DATE_RANGE', {
        start: `formatted(${multiDayVisit.startDate})`,
        end: `formatted(${multiDayVisit.endDate})`,
      });
    });
  });

  describe('translateVisitType', () => {
    it('translates using the VISIT_TYPE_<SCREAMING_SNAKE> key with a raw fallback (AC 12)', () => {
      const mockT = jest.fn(
        (key: string, options?: Record<string, unknown>) =>
          (options?.defaultValue as string) ?? key,
      );
      translateVisitType('IPD', mockT);
      expect(mockT).toHaveBeenCalledWith('VISIT_TYPE_IPD', {
        defaultValue: 'IPD',
      });
    });

    it('returns the raw value untranslated for an empty visit type', () => {
      const mockT = jest.fn();
      expect(translateVisitType('', mockT)).toBe('');
      expect(mockT).not.toHaveBeenCalled();
    });
  });

  describe('isIpdVisit', () => {
    it('matches case-insensitively against the configured IPD visit types', () => {
      expect(isIpdVisit('IPD', ['ipd'])).toBe(true);
      expect(isIpdVisit('ipd', ['IPD'])).toBe(true);
    });

    it('returns false when the visit type is not in the configured list', () => {
      expect(isIpdVisit('OPD', ['IPD'])).toBe(false);
    });
  });
});
