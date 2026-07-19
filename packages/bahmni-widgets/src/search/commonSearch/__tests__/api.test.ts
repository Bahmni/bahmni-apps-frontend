import { post } from '../api';

const makePayload = (entity: string) => ({
  entity,
  criteria: { operator: 'AND' as const, conditions: [] },
});

describe('post', () => {
  it.each([
    {
      entity: 'patient',
      expectedFields: [
        'name',
        'applicantId',
        'birthdate',
        'age',
        'sex',
        'phone',
        'email',
      ],
    },
    {
      entity: 'appointment',
      expectedFields: [
        'appointmentNumber',
        'status',
        'date',
        'time',
        'reason',
        'service',
        'patient',
      ],
    },
    {
      entity: 'episodeOfCare',
      expectedFields: [
        'umi',
        'hapid',
        'startDate',
        'endDate',
        'status',
        'programType',
        'destinationCountry',
        'careProvider',
        'patient',
      ],
    },
  ])(
    'resolves with mock $entity results containing expected fields',
    async ({ entity, expectedFields }) => {
      const result = await post<{ results: Record<string, unknown>[] }>(
        'http://example.com/search',
        makePayload(entity),
      );
      expect(result.results.length).toBeGreaterThan(0);
      for (const field of expectedFields) {
        expect(result.results[0]).toHaveProperty(field);
      }
    },
  );

  it.each(['appointment', 'episodeOfCare'])(
    '%s results include a nested patient object with name, applicantId, birthdate, age, sex',
    async (entity) => {
      const result = await post<{
        results: { patient: Record<string, unknown> }[];
      }>('http://example.com/search', makePayload(entity));
      const patient = result.results[0].patient;
      expect(patient).toHaveProperty('name');
      expect(patient).toHaveProperty('applicantId');
      expect(patient).toHaveProperty('birthdate');
      expect(patient).toHaveProperty('age');
      expect(patient).toHaveProperty('sex');
    },
  );

  it('resolves with empty results for an unknown entity', async () => {
    const result = await post<{ results: unknown[] }>(
      'http://example.com/search',
      { entity: 'unknown' },
    );
    expect(result).toEqual({ results: [] });
  });
});
