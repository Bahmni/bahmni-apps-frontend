import {
  formatMedicationRequest,
  formatMedicationRequestDate,
  getMedicationStatusPriority,
  sortMedicationsByStatus,
  sortMedicationsByPriority,
  MEDICATION_STATUS_PRIORITY_ORDER,
} from '../medicationRequest';
import {
  MedicationRequest,
  MedicationStatus,
  FormattedMedicationRequest,
} from '@types/medicationRequest';

jest.mock('@utils/date', () => ({
  formatDate: (date: string | undefined) => ({
    formattedResult: date ? `Formatted(${date})` : '',
  }),
}));

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
      notes: 'Take with food',
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startDate: undefined as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderDate: undefined as any,
      status: MedicationStatus.Active,
      quantity: { value: 5, unit: 'tablets' },
      priority: '',
      orderedBy: '',
      asNeeded: false,
      isImmediate: false,
    };

    const result = formatMedicationRequest(input);

    expect(result.startDate).toBe('');
    expect(result.orderDate).toBe('');
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: status as any,
        dosage: '',
        dosageUnit: '',
        quantity: '',
        instruction: '',
        startDate: '',
        orderDate: '',
        orderedBy: '',
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  it('sorts asNeeded medications second when not immediate', () => {
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
    ];

    const sorted = sortMedicationsByPriority(meds);
    expect(sorted.map((m: FormattedMedicationRequest) => m.id)).toEqual([
      '2',
      '1',
    ]);
  });

  it('prioritizes immediate over asNeeded when both flags are true', () => {
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

  it('sorts medications in correct priority order: immediate, asNeeded, regular', () => {
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
    expect(sorted.map((m: FormattedMedicationRequest) => m.id)).toEqual([
      '3',
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
