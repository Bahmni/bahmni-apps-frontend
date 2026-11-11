import type { Bundle, ServiceRequest } from 'fhir/r4';
import { mapDispositions } from '../utils';

const bundle = (...resources: ServiceRequest[]): Bundle<ServiceRequest> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: resources.map((resource) => ({ resource })),
});

const base: ServiceRequest = {
  resourceType: 'ServiceRequest',
  id: 'sr-1',
  status: 'active',
  intent: 'order',
  subject: {},
  code: { text: 'Admit' },
  occurrencePeriod: { start: '2026-08-14T10:00:00.000Z' },
  note: [{ text: 'Some note' }],
  authoredOn: '2026-08-14T11:45:00.000Z',
  requester: { display: 'Super Man' },
};

describe('mapDispositions', () => {
  it('maps all columns', () => {
    expect(mapDispositions(bundle(base))).toEqual([
      {
        id: 'sr-1',
        type: 'Admit',
        date: '2026-08-14T10:00:00.000Z',
        notes: 'Some note',
        recordedTime: '2026-08-14T11:45:00.000Z',
        recordedBy: 'Super Man',
      },
    ]);
  });

  it('falls back to occurrenceDateTime when occurrencePeriod is missing', () => {
    const result = mapDispositions(
      bundle({
        ...base,
        occurrencePeriod: undefined,
        occurrenceDateTime: '2026-08-01T00:00:00.000Z',
      }),
    );
    expect(result[0].date).toBe('2026-08-01T00:00:00.000Z');
  });

  it('falls back to coding display for type and tolerates missing fields', () => {
    const result = mapDispositions(
      bundle({
        ...base,
        code: { coding: [{ display: 'Discharge' }] },
        note: undefined,
        requester: undefined,
      }),
    );
    expect(result[0].type).toBe('Discharge');
    expect(result[0].notes).toBeUndefined();
    expect(result[0].recordedBy).toBeUndefined();
  });

  it('sorts newest first and keeps same-day entries ordered by recorded time', () => {
    const result = mapDispositions(
      bundle(
        {
          ...base,
          id: 'old',
          occurrencePeriod: { start: '2026-08-01T00:00:00Z' },
        },
        { ...base, id: 'early', authoredOn: '2026-08-14T08:00:00Z' },
        { ...base, id: 'late', authoredOn: '2026-08-14T15:00:00Z' },
      ),
    );
    expect(result.map((r) => r.id)).toEqual(['late', 'early', 'old']);
  });

  it('returns an empty list for an empty bundle', () => {
    expect(
      mapDispositions({ resourceType: 'Bundle', type: 'searchset' }),
    ).toEqual([]);
  });
});
