import {
  MedicationRequest,
  MedicationStatus,
  FormattedMedicationRequest,
} from '@bahmni-frontend/bahmni-services';
import { differenceInDays, parseISO } from 'date-fns';
import {
  formatMedicationRequest,
  formatMedicationRequestDate,
  getMedicationStatusPriority,
  getMedicationPriority,
  sortMedicationsByStatus,
  sortMedicationsByPriority,
  sortMedicationsByDateDistance,
  MEDICATION_STATUS_PRIORITY_ORDER,
} from '../utils';
import '@testing-library/jest-dom';

// Mock date-fns functions for consistent testing
jest.mock('date-fns', () => ({
  differenceInDays: jest.fn(),
  parseISO: jest.fn(),
}));

const mockedDifferenceInDays = differenceInDays as jest.MockedFunction<
  typeof differenceInDays
>;
const mockedParseISO = parseISO as jest.MockedFunction<typeof parseISO>;

describe('formatMedicationRequestDate', () => {
  it('returns correct long form of duration units', () => {
    expect(formatMedicationRequestDate('s')).toBe('seconds');
    expect(formatMedicationRequestDate('min')).toBe('minutes');
    expect(formatMedicationRequestDate('h')).toBe('hours');
    expect(formatMedicationRequestDate('d')).toBe('days');
    expect(formatMedicationRequestDate('wk')).toBe('weeks');
    expect(formatMedicationRequestDate('mo')).toBe('months');
    expect(formatMedicationRequestDate('a')).toBe('years');
  });
});

describe('formatMedicationRequest', () => {
  it('formats a complete medication request correctly', () => {
    const input: MedicationRequest = {
      id: '123',
      name: 'Paracetamol',
      dose: { value: 500, unit: 'mg' },
      frequency: '2x/day',
      route: 'oral',
      duration: { duration: 5, durationUnit: 'd' },
      startDate: '2025-03-25T06:48:32+00:00',
      orderDate: '2025-03-25T06:48:32+00:00',
      orderedBy: 'Dr. Smith',
      instructions: 'Take with food',
      status: MedicationStatus.Active,
      quantity: { value: 10, unit: 'ml' },
      priority: 'stat',
      asNeeded: true,
      isImmediate: false,
    };

    const result = formatMedicationRequest(input);

    expect(result).toEqual({
      id: '123',
      name: 'Paracetamol',
      dosage: '500 mg | 2x/day | 5 days',
      dosageUnit: 'mg',
      instruction: 'oral | Take with food',
      startDate: '2025-03-25T06:48:32+00:00',
      orderDate: '2025-03-25T06:48:32+00:00',
      orderedBy: 'Dr. Smith',
      quantity: '10 ml',
      status: 'active',
      asNeeded: true,
      isImmediate: false,
    });
  });

  it('handles missing optional fields gracefully', () => {
    const input: MedicationRequest = {
      id: '456',
      name: 'Ibuprofen',
      status: MedicationStatus.OnHold,
      quantity: { value: 10, unit: 'ml' },
      priority: '',
      startDate: '',
      orderDate: '',
      orderedBy: '',
      instructions: '',
      asNeeded: false,
      isImmediate: false,
    };

    const result = formatMedicationRequest(input);

    expect(result).toEqual({
      id: '456',
      name: 'Ibuprofen',
      dosage: '',
      dosageUnit: '',
      instruction: '',
      startDate: '',
      orderDate: '',
      orderedBy: '',
      quantity: '10 ml',
      status: 'on-hold',
      asNeeded: false,
      isImmediate: false,
    });
  });

  it('formats quantity correctly when only quantity is provided', () => {
    const input: MedicationRequest = {
      id: '321',
      name: 'Ciprofloxacin',
      quantity: { value: 20, unit: 'tablets' },
      status: MedicationStatus.Active,
      priority: '',
      startDate: '',
      orderDate: '',
      orderedBy: '',
      instructions: '',
      asNeeded: true,
      isImmediate: false,
    };

    const result = formatMedicationRequest(input);

    expect(result).toEqual({
      id: '321',
      name: 'Ciprofloxacin',
      dosage: '',
      dosageUnit: '',
      instruction: '',
      startDate: '',
      orderDate: '',
      orderedBy: '',
      quantity: '20 tablets',
      status: 'active',
      asNeeded: true,
      isImmediate: false,
    });
  });

  it('formats date fields correctly even if null/undefined', () => {
    const input: MedicationRequest = {
      id: '789',
      name: 'Amoxicillin',
      startDate: '',
      orderDate: '',
      status: MedicationStatus.Cancelled,
      quantity: { value: 10, unit: 'ml' },
      priority: '',
      orderedBy: '',
      instructions: '',
      asNeeded: false,
      isImmediate: false,
    };

    const result = formatMedicationRequest(input);

    expect(result.startDate).toBe('');
    expect(result.orderDate).toBe('');
    expect(result.asNeeded).toBe(false);
    expect(result.isImmediate).toBe(false);
  });

  it('formats date fields with nullish coalescing when undefined', () => {
    const input: MedicationRequest = {
      id: '790',
      name: 'Penicillin',

      startDate: undefined as any,

      orderDate: undefined as any,
      status: MedicationStatus.Active,
      quantity: { value: 5, unit: 'tablets' },
      priority: '',
      orderedBy: '',
      instructions: '',
      asNeeded: false,
      isImmediate: false,
    };

    const result = formatMedicationRequest(input);

    expect(result.startDate).toBe('');
    expect(result.orderDate).toBe('');
  });

  it('includes additionalInstructions in instruction when provided', () => {
    const input: MedicationRequest = {
      id: '999',
      name: 'Metformin',
      status: MedicationStatus.Active,
      quantity: { value: 30, unit: 'tablets' },
      priority: '',
      startDate: '2025-01-01T00:00:00+00:00',
      orderDate: '2025-01-01T00:00:00+00:00',
      orderedBy: 'Dr. Johnson',
      instructions: 'Take with meals',
      additionalInstructions: 'Monitor blood sugar levels',
      route: 'oral',
      asNeeded: false,
      isImmediate: false,
    };

    const result = formatMedicationRequest(input);

    expect(result.instruction).toBe(
      'oral | Take with meals | Monitor blood sugar levels',
    );
  });
});

describe('getMedicationStatusPriority', () => {
  it('returns correct priority index for each known status', () => {
    MEDICATION_STATUS_PRIORITY_ORDER.forEach((status, index) => {
      expect(getMedicationStatusPriority(status)).toBe(index);
    });
  });

  it('returns fallback priority for unknown status', () => {
    expect(getMedicationStatusPriority('bogus-status')).toBe(999);
  });
});

describe('sortMedicationsByStatus', () => {
  it('sorts medications by full status priority list', () => {
    const meds: FormattedMedicationRequest[] =
      MEDICATION_STATUS_PRIORITY_ORDER.map((status, i) => ({
        id: `${i}`,
        name: `Med-${status}`,

        status: status as any,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        instructions: '',
        asNeeded: false,
        isImmediate: false,
      })).reverse(); // reverse order to test sorting

    const sorted = sortMedicationsByStatus(meds);
    const sortedStatuses = sorted.map(
      (m: FormattedMedicationRequest) => m.status,
    );

    expect(sortedStatuses).toEqual(MEDICATION_STATUS_PRIORITY_ORDER);
  });

  it('maintains stable sort for same priority', () => {
    const meds: FormattedMedicationRequest[] = [
      {
        id: '1',
        name: 'A',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: false,
      },
      {
        id: '2',
        name: 'B',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: false,
      },
    ];

    const sorted = sortMedicationsByStatus(meds);
    expect(sorted.map((m: FormattedMedicationRequest) => m.id)).toEqual([
      '1',
      '2',
    ]);
  });

  it('places unknown statuses at the end', () => {
    const meds: FormattedMedicationRequest[] = [
      {
        id: '1',
        name: 'Valid',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: false,
      },
      {
        id: '2',
        name: 'Invalid',

        status: 'bogus' as any,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: false,
      },
    ];

    const sorted = sortMedicationsByStatus(meds);
    expect(sorted.map((m: FormattedMedicationRequest) => m.id)).toEqual([
      '1',
      '2',
    ]);
  });
});

describe('getMedicationPriority', () => {
  it('returns 0 only for immediate medications', () => {
    const immediateMed: FormattedMedicationRequest = {
      id: '1',
      name: 'Immediate Med',
      status: MedicationStatus.Active,
      dosage: '',
      dosageUnit: '',
      quantity: '',
      instruction: '',
      startDate: '',
      orderDate: '',
      orderedBy: '',
      asNeeded: false,
      isImmediate: true,
    };

    expect(getMedicationPriority(immediateMed)).toBe(0);
  });

  it('returns 1 for all non-immediate medications (asNeeded and regular)', () => {
    const asNeededMed: FormattedMedicationRequest = {
      id: '1',
      name: 'AsNeeded Med',
      status: MedicationStatus.Active,
      dosage: '',
      dosageUnit: '',
      quantity: '',
      instruction: '',
      startDate: '',
      orderDate: '',
      orderedBy: '',
      asNeeded: true,
      isImmediate: false,
    };

    const regularMed: FormattedMedicationRequest = {
      id: '2',
      name: 'Regular Med',
      status: MedicationStatus.Active,
      dosage: '',
      dosageUnit: '',
      quantity: '',
      instruction: '',
      startDate: '',
      orderDate: '',
      orderedBy: '',
      asNeeded: false,
      isImmediate: false,
    };

    expect(getMedicationPriority(asNeededMed)).toBe(1);
    expect(getMedicationPriority(regularMed)).toBe(1);
  });

  it('returns 0 for immediate medications regardless of asNeeded flag', () => {
    const immediateAsNeededMed: FormattedMedicationRequest = {
      id: '1',
      name: 'Immediate AsNeeded Med',
      status: MedicationStatus.Active,
      dosage: '',
      dosageUnit: '',
      quantity: '',
      instruction: '',
      startDate: '',
      orderDate: '',
      orderedBy: '',
      asNeeded: true,
      isImmediate: true,
    };

    expect(getMedicationPriority(immediateAsNeededMed)).toBe(0);
  });
});

describe('sortMedicationsByPriority', () => {
  it('sorts immediate medications first', () => {
    const meds: FormattedMedicationRequest[] = [
      {
        id: '1',
        name: 'Regular Med',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: false,
      },
      {
        id: '2',
        name: 'Immediate Med',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: true,
      },
    ];

    const sorted = sortMedicationsByPriority(meds);
    expect(sorted.map((m: FormattedMedicationRequest) => m.id)).toEqual([
      '2',
      '1',
    ]);
  });

  it('sorts medications in correct priority order: immediate vs non-immediate only', () => {
    const meds: FormattedMedicationRequest[] = [
      {
        id: '1',
        name: 'Regular Med',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: false,
      },
      {
        id: '2',
        name: 'AsNeeded Med',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: true,
        isImmediate: false,
      },
      {
        id: '3',
        name: 'Immediate Med',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: true,
      },
    ];

    const sorted = sortMedicationsByPriority(meds);
    // Immediate first, then non-immediate in original order (stable sort)
    expect(sorted.map((m: FormattedMedicationRequest) => m.id)).toEqual([
      '3',
      '1',
      '2',
    ]);
  });

  it('prioritizes immediate medications regardless of asNeeded flag', () => {
    const meds: FormattedMedicationRequest[] = [
      {
        id: '1',
        name: 'AsNeeded Med',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: true,
        isImmediate: false,
      },
      {
        id: '2',
        name: 'Immediate+AsNeeded Med',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: true,
        isImmediate: true,
      },
    ];

    const sorted = sortMedicationsByPriority(meds);
    expect(sorted.map((m: FormattedMedicationRequest) => m.id)).toEqual([
      '2',
      '1',
    ]);
  });

  it('maintains stable sort within same priority group', () => {
    const meds: FormattedMedicationRequest[] = [
      {
        id: '1',
        name: 'First Immediate',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: true,
      },
      {
        id: '2',
        name: 'Second Immediate',
        status: MedicationStatus.Active,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
        asNeeded: false,
        isImmediate: true,
      },
    ];

    const sorted = sortMedicationsByPriority(meds);
    expect(sorted.map((m: FormattedMedicationRequest) => m.id)).toEqual([
      '1',
      '2',
    ]);
  });

  it('handles empty array', () => {
    const sorted = sortMedicationsByPriority([]);
    expect(sorted).toEqual([]);
  });
});

describe('sortMedicationsByDateDistance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the current date to be consistent
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-07T00:00:00.000Z')); // Set to January 7, 2025
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockMedication = (
    id: string,
    name: string,
    startDate: string,
  ): FormattedMedicationRequest => ({
    id,
    name,
    startDate,
    status: MedicationStatus.Active,
    dosage: '',
    dosageUnit: '',
    quantity: '',
    instruction: '',
    orderDate: '',
    orderedBy: '',
    asNeeded: false,
    isImmediate: false,
  });

  it("should sort medications with today's date first", () => {
    const todayDate = '2025-01-07T00:00:00.000Z';
    const yesterdayDate = '2025-01-06T00:00:00.000Z';

    // Mock date functions
    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(
      (date1: Date | string | number, date2: Date | string | number) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.floor(
          (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diff;
      },
    );

    const meds: FormattedMedicationRequest[] = [
      createMockMedication('2', 'Yesterday Med', yesterdayDate),
      createMockMedication('1', 'Today Med', todayDate),
    ];

    const sorted = sortMedicationsByDateDistance(meds);
    expect(sorted.map((m) => m.id)).toEqual(['1', '2']);
  });

  it("should sort yesterday's medications second", () => {
    const todayDate = '2025-01-07T00:00:00.000Z';
    const yesterdayDate = '2025-01-06T00:00:00.000Z';
    const dayBeforeDate = '2025-01-05T00:00:00.000Z';

    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(
      (date1: Date | string | number, date2: Date | string | number) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.floor(
          (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diff;
      },
    );

    const meds: FormattedMedicationRequest[] = [
      createMockMedication('3', 'Day Before Med', dayBeforeDate),
      createMockMedication('1', 'Today Med', todayDate),
      createMockMedication('2', 'Yesterday Med', yesterdayDate),
    ];

    const sorted = sortMedicationsByDateDistance(meds);
    expect(sorted.map((m) => m.id)).toEqual(['1', '2', '3']);
  });

  it('should sort day before yesterday third', () => {
    const todayDate = '2025-01-07T00:00:00.000Z';
    const yesterdayDate = '2025-01-06T00:00:00.000Z';
    const dayBeforeDate = '2025-01-05T00:00:00.000Z';

    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(
      (date1: Date | string | number, date2: Date | string | number) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.floor(
          (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diff;
      },
    );

    const meds: FormattedMedicationRequest[] = [
      createMockMedication('3', 'Day Before Med', dayBeforeDate),
      createMockMedication('2', 'Yesterday Med', yesterdayDate),
      createMockMedication('1', 'Today Med', todayDate),
    ];

    const sorted = sortMedicationsByDateDistance(meds);
    expect(sorted.map((m) => m.id)).toEqual(['1', '2', '3']);
  });

  it('should handle medications from multiple different past dates', () => {
    const todayDate = '2025-01-07T00:00:00.000Z';
    const yesterdayDate = '2025-01-06T00:00:00.000Z';
    const threeDaysAgoDate = '2025-01-04T00:00:00.000Z';
    const weekAgoDate = '2025-01-01T00:00:00.000Z';

    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(
      (date1: Date | string | number, date2: Date | string | number) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.floor(
          (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diff;
      },
    );

    const meds: FormattedMedicationRequest[] = [
      createMockMedication('4', 'Week Ago Med', weekAgoDate),
      createMockMedication('2', 'Yesterday Med', yesterdayDate),
      createMockMedication('1', 'Today Med', todayDate),
      createMockMedication('3', 'Three Days Ago Med', threeDaysAgoDate),
    ];

    const sorted = sortMedicationsByDateDistance(meds);
    expect(sorted.map((m) => m.id)).toEqual(['1', '2', '3', '4']);
  });

  it('should handle empty array', () => {
    const sorted = sortMedicationsByDateDistance([]);
    expect(sorted).toEqual([]);
  });

  it('should handle array with single medication', () => {
    const todayDate = '2025-01-07T00:00:00.000Z';

    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(() => 0);

    const meds: FormattedMedicationRequest[] = [
      createMockMedication('1', 'Single Med', todayDate),
    ];

    const sorted = sortMedicationsByDateDistance(meds);
    expect(sorted).toEqual(meds);
  });

  it('should maintain original order for same-date medications (stable sort)', () => {
    const todayDate = '2025-01-07T00:00:00.000Z';

    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(() => 0); // All same day

    const meds: FormattedMedicationRequest[] = [
      createMockMedication('1', 'First Med', todayDate),
      createMockMedication('2', 'Second Med', todayDate),
      createMockMedication('3', 'Third Med', todayDate),
    ];

    const sorted = sortMedicationsByDateDistance(meds);
    expect(sorted.map((m) => m.id)).toEqual(['1', '2', '3']);
  });

  it('should handle mixed dates (today, yesterday, last week)', () => {
    const todayDate = '2025-01-07T00:00:00.000Z';
    const yesterdayDate = '2025-01-06T00:00:00.000Z';
    const lastWeekDate = '2024-12-31T00:00:00.000Z';

    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(
      (date1: Date | string | number, date2: Date | string | number) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.floor(
          (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diff;
      },
    );

    const meds: FormattedMedicationRequest[] = [
      createMockMedication('3', 'Last Week Med', lastWeekDate),
      createMockMedication('1', 'Today Med', todayDate),
      createMockMedication('2', 'Yesterday Med', yesterdayDate),
    ];

    const sorted = sortMedicationsByDateDistance(meds);
    expect(sorted.map((m) => m.id)).toEqual(['1', '2', '3']);
  });

  it('should work with actual FormattedMedicationRequest objects', () => {
    const todayDate = '2025-01-07T00:00:00.000Z';
    const yesterdayDate = '2025-01-06T00:00:00.000Z';

    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(
      (date1: Date | string | number, date2: Date | string | number) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.floor(
          (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diff;
      },
    );

    const meds: FormattedMedicationRequest[] = [
      {
        id: '2',
        name: 'Ibuprofen',
        startDate: yesterdayDate,
        status: MedicationStatus.Active,
        dosage: '400mg',
        dosageUnit: 'mg',
        quantity: '20 tablets',
        instruction: 'Take with food',
        orderDate: yesterdayDate,
        orderedBy: 'Dr. Smith',
        asNeeded: false,
        isImmediate: false,
      },
      {
        id: '1',
        name: 'Paracetamol',
        startDate: todayDate,
        status: MedicationStatus.Active,
        dosage: '500mg',
        dosageUnit: 'mg',
        quantity: '10 tablets',
        instruction: 'Take as needed',
        orderDate: todayDate,
        orderedBy: 'Dr. Jones',
        asNeeded: true,
        isImmediate: false,
      },
    ];

    const sorted = sortMedicationsByDateDistance(meds);
    expect(sorted[0].name).toBe('Paracetamol'); // Today's medication first
    expect(sorted[1].name).toBe('Ibuprofen'); // Yesterday's medication second
    expect(sorted[0].dosage).toBe('500mg'); // Preserve all properties
    expect(sorted[1].instruction).toBe('Take with food');
  });

  it('should preserve all other medication properties', () => {
    const todayDate = '2025-01-07T00:00:00.000Z';

    mockedParseISO.mockImplementation(
      (dateString: string) => new Date(dateString),
    );
    mockedDifferenceInDays.mockImplementation(() => 0);

    const originalMed: FormattedMedicationRequest = {
      id: '1',
      name: 'Test Medicine',
      startDate: todayDate,
      status: MedicationStatus.Active,
      dosage: '250mg',
      dosageUnit: 'mg',
      quantity: '30 tablets',
      instruction: 'Take twice daily',
      orderDate: todayDate,
      orderedBy: 'Dr. Test',
      asNeeded: true,
      isImmediate: true,
    };

    const sorted = sortMedicationsByDateDistance([originalMed]);
    expect(sorted[0]).toEqual(originalMed);
  });
});
