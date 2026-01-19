import { Bundle, Observation, Encounter } from 'fhir/r4';
import { extractObservationsFromBundle } from '../utils';

describe('observationUtils', () => {
  describe('extractObservationsFromBundle', () => {
    it('should extract observation with correct values', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              status: 'final',
              code: {
                text: 'Systolic blood pressure',
                coding: [{ code: '5085', display: 'Systolic blood pressure' }],
              },
              valueQuantity: {
                value: 120,
                unit: 'mmHg',
              },
              effectiveDateTime: '2026-01-19T12:35:58+00:00',
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-2',
              status: 'final',
              code: {
                text: 'Chief Complaint Duration',
              },
              valueCodeableConcept: {
                text: 'Days',
                coding: [{ code: '1072', display: 'Days' }],
              },
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-3',
              status: 'final',
              code: {
                text: 'Chief Complaint Record',
              },
              valueString: 'Fever, 2.0, Days',
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(bundle);

      expect(result.observations).toHaveLength(3);
      expect(result.observations[0]).toEqual({
        id: 'obs-1',
        display: 'Systolic blood pressure',
        observationValue: {
          value: 120,
          unit: 'mmHg',
          type: 'quantity',
        },
        effectiveDateTime: '2026-01-19T12:35:58+00:00',
        issued: undefined,
        encounter: undefined,
        members: undefined,
      });
      expect(result.observations[1]).toEqual({
        id: 'obs-2',
        display: 'Chief Complaint Duration',
        observationValue: {
          value: 'Days',
          unit: undefined,
          type: 'codeable',
        },
        effectiveDateTime: undefined,
        issued: undefined,
        encounter: undefined,
        members: undefined,
      });
      expect(result.observations[2]).toEqual({
        id: 'obs-3',
        display: 'Chief Complaint Record',
        observationValue: {
          value: 'Fever, 2.0, Days',
          unit: undefined,
          type: 'string',
        },
        effectiveDateTime: undefined,
        issued: undefined,
        encounter: undefined,
        members: undefined,
      });
      expect(result.groupedObservations).toHaveLength(0);
    });

    it('should handle empty bundle', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      const result = extractObservationsFromBundle(bundle);

      expect(result.observations).toHaveLength(0);
      expect(result.groupedObservations).toHaveLength(0);
    });

    it('should handle bundle with no entries', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
      };

      const result = extractObservationsFromBundle(bundle);

      expect(result.observations).toHaveLength(0);
      expect(result.groupedObservations).toHaveLength(0);
    });

    it('should extract observation with encounter details', () => {
      const bundle: Bundle<Observation | Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Encounter',
              id: 'enc-1',
              status: 'finished',
              class: { code: 'AMB' },
              type: [{ coding: [{ display: 'Consultation' }] }],
              period: { start: '2026-01-19T10:00:00+00:00' },
              participant: [{ individual: { display: 'Dr. Smith' } }],
              location: [{ location: { display: 'OPD' } }],
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              status: 'final',
              code: { text: 'Temperature' },
              valueQuantity: { value: 98.6, unit: 'F' },
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(bundle);

      expect(result.observations[0].encounter).toEqual({
        id: 'enc-1',
        type: 'Consultation',
        date: '2026-01-19T10:00:00+00:00',
        provider: 'Dr. Smith',
        location: 'OPD',
      });
    });

    it('should handle grouped observations with hasMember', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'child-1',
              status: 'final',
              code: { text: 'Systolic' },
              valueQuantity: { value: 120, unit: 'mmHg' },
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'parent-1',
              status: 'final',
              code: { text: 'Blood Pressure' },
              hasMember: [{ reference: 'Observation/child-1' }],
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(bundle);

      expect(result.groupedObservations).toHaveLength(1);
      expect(result.observations).toHaveLength(0);
      expect(result.groupedObservations[0].display).toBe('Blood Pressure');
      expect(result.groupedObservations[0].children).toHaveLength(1);
      expect(result.groupedObservations[0].children[0].display).toBe(
        'Systolic',
      );
    });

    it('should handle observation without value type', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              status: 'final',
              code: { text: 'Notes' },
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(bundle);

      expect(result.observations[0].observationValue).toBeUndefined();
    });

    it('should handle missing optional fields', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              status: 'final',
              code: { coding: [{ display: 'Lab Test' }] },
              valueCodeableConcept: {
                coding: [{ display: 'Positive' }],
              },
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(bundle);

      expect(result.observations[0].display).toBe('Lab Test');
      expect(result.observations[0].observationValue?.value).toBe('Positive');
    });

    it('should handle all optional values gracefully', () => {
      const bundle: Bundle<Observation | Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Encounter',
              status: 'finished',
              class: { code: 'AMB' },
              type: [],
              period: {},
              participant: [],
              location: [],
            },
          },
          {
            resource: {
              resourceType: 'Encounter',
              id: 'enc-minimal',
              status: 'finished',
              class: { code: 'AMB' },
              type: [],
              period: {},
              participant: [],
              location: [],
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-with-string-ref',
              status: 'final',
              code: {},
              valueQuantity: {},
              encounter: { reference: 'Encounter/enc-minimal' },
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-parent',
              status: 'final',
              code: {},
              hasMember: [
                { reference: 'Observation/obs-child-valid' },
                { reference: 'Observation/non-existent' },
              ],
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-child-valid',
              status: 'final',
              code: {},
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              status: 'final',
              code: {},
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(bundle);

      expect(result.observations).toHaveLength(1);
      expect(result.observations[0].id).toBe('obs-with-string-ref');
      expect(result.observations[0].display).toBe('');
      expect(result.observations[0].observationValue?.value).toBe('');
      expect(result.observations[0].observationValue?.type).toBe('quantity');
      expect(result.observations[0].encounter).toEqual({
        id: 'enc-minimal',
        type: 'Unknown',
        date: '',
        provider: undefined,
        location: undefined,
      });

      expect(result.groupedObservations).toHaveLength(1);
      expect(result.groupedObservations[0].id).toBe('obs-parent');
      expect(result.groupedObservations[0].children).toHaveLength(1);
      expect(result.groupedObservations[0].children[0].id).toBe(
        'obs-child-valid',
      );
    });
  });
});
