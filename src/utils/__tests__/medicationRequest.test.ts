import {
  formatMedicationRequest,
  formatMedicationRequestDate,
  getMedicationStatusPriority,
  sortMedicationsByStatus,
  MEDICATION_STATUS_PRIORITY_ORDER,
} from '../medicationRequest';
import { MedicationRequest, MedicationStatus } from '@types/medicationRequest';

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
      startDate: '2025-01-01',
      orderDate: '2025-01-02',
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
      startDate: 'Formatted(2025-01-01)',
      orderDate: 'Formatted(2025-01-02)',
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
      status: MedicationStatus.Scheduled,
      quantity: { value: 10, unit: 'ml' },
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
      orderedBy: undefined,
      quantity: '10 ml',
      status: 'scheduled',
      asNeeded: undefined,
      isImmediate: undefined,
    });
  });

  it('formats quantity correctly when only quantity is provided', () => {
    const input: MedicationRequest = {
      id: '321',
      name: 'Ciprofloxacin',
      quantity: { value: 20, unit: 'tablets' },
      status: MedicationStatus.Active,
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
      orderedBy: undefined,
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
      startDate: undefined,
      orderDate: undefined,
      status: MedicationStatus.Cancelled,
      quantity: { value: 10, unit: 'ml' },
      isActive: false,
      isScheduled: false,
    };

    const result = formatMedicationRequest(input);

    expect(result.startDate).toBe('');
    expect(result.orderDate).toBe('');
    expect(result.asNeeded).toBeUndefined();
    expect(result.isImmediate).toBeUndefined();
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

  it('is case-insensitive', () => {
    expect(getMedicationStatusPriority('Active')).toBe(0);
    expect(getMedicationStatusPriority('COMPLETED')).toBe(3);
  });
});

describe('sortMedicationsByStatus', () => {
  it('sorts medications by full status priority list', () => {
    const meds: MedicationRequest[] = MEDICATION_STATUS_PRIORITY_ORDER.map(
      (status, i) => ({
        id: `${i}`,
        name: `Med-${status}`,
        status,
        isActive: false,
        isScheduled: false,
      }),
    ).reverse(); // reverse order to test sorting

    const sorted = sortMedicationsByStatus(meds);
    const sortedStatuses = sorted.map((m) => m.status);

    expect(sortedStatuses).toEqual(MEDICATION_STATUS_PRIORITY_ORDER);
  });

  it('maintains stable sort for same priority', () => {
    const meds: MedicationRequest[] = [
      {
        id: '1',
        name: 'A',
        status: 'active',
        isActive: true,
        isScheduled: false,
      },
      {
        id: '2',
        name: 'B',
        status: 'active',
        isActive: true,
        isScheduled: false,
      },
    ];

    const sorted = sortMedicationsByStatus(meds);
    expect(sorted.map((m) => m.id)).toEqual(['1', '2']);
  });

  it('places unknown statuses at the end', () => {
    const meds: MedicationRequest[] = [
      {
        id: '1',
        name: 'Valid',
        status: 'active',
        isActive: true,
        isScheduled: false,
      },
      {
        id: '2',
        name: 'Invalid',
        status: 'bogus',
        isActive: false,
        isScheduled: false,
      },
    ];

    const sorted = sortMedicationsByStatus(meds);
    expect(sorted.map((m) => m.id)).toEqual(['1', '2']);
  });
});
