import { FHIRObservationBundle } from '../models';
import { extractObservationValue, formatObservations } from '../utils';

const mockT = (key: string) => key;

describe('observationService utils', () => {
  describe('extractObservationValue', () => {
    it('should extract valueString when present', () => {
      const observation = {
        resourceType: 'Observation' as const,
        id: 'obs-1',
        code: { text: 'Temperature' },
        valueString: 'Normal',
        effectiveDateTime: '2024-01-01T10:00:00Z',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({ value: 'Normal' });
    });

    it('should extract valueQuantity with unit when present', () => {
      const observation = {
        resourceType: 'Observation' as const,
        id: 'obs-2',
        code: { text: 'Temperature' },
        valueQuantity: { value: 98.6, unit: 'F' },
        effectiveDateTime: '2024-01-01T10:00:00Z',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({ value: '98.6', unit: 'F' });
    });

    it('should extract valueQuantity without unit when unit is not present', () => {
      const observation = {
        resourceType: 'Observation' as const,
        id: 'obs-2b',
        code: { text: 'Count' },
        valueQuantity: { value: 5 },
        effectiveDateTime: '2024-01-01T10:00:00Z',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({ value: '5', unit: undefined });
    });

    it('should extract valueCodeableConcept text when present', () => {
      const observation = {
        resourceType: 'Observation' as const,
        id: 'obs-3',
        code: { text: 'Blood Type' },
        valueCodeableConcept: { text: 'A+' },
        effectiveDateTime: '2024-01-01T10:00:00Z',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({ value: 'A+' });
    });

    it('should return empty value when no value is present', () => {
      const observation = {
        resourceType: 'Observation' as const,
        id: 'obs-4',
        code: { text: 'Test' },
        effectiveDateTime: '2024-01-01T10:00:00Z',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({ value: '' });
    });

    it('should prioritize valueString over other value types', () => {
      const observation = {
        resourceType: 'Observation' as const,
        id: 'obs-5',
        code: { text: 'Test' },
        valueString: 'String value',
        valueQuantity: { value: 100, unit: 'mg' },
        valueCodeableConcept: { text: 'Codeable value' },
        effectiveDateTime: '2024-01-01T10:00:00Z',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({ value: 'String value' });
    });

    it('should return empty value for Encounter resources', () => {
      const observation = {
        resourceType: 'Encounter' as const,
        id: 'enc-1',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({ value: '' });
    });
  });

  describe('formatObservations', () => {
    it('should return empty array for empty bundle', () => {
      const bundle: FHIRObservationBundle = {
        resourceType: 'Bundle',
        total: 0,
        entry: [],
      };

      const result = formatObservations(bundle, mockT);

      expect(result).toEqual([]);
    });

    it('should return empty array when bundle has no entry', () => {
      const bundle = {
        resourceType: 'Bundle' as const,
        total: 0,
      };

      const result = formatObservations(bundle as FHIRObservationBundle, mockT);

      expect(result).toEqual([]);
    });

    it('should format a simple observation without children', () => {
      const bundle: FHIRObservationBundle = {
        resourceType: 'Bundle',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              code: { text: 'Temperature' },
              valueQuantity: { value: 98.6 },
              effectiveDateTime: '2024-01-01T10:00:00Z',
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
        ],
      };

      const result = formatObservations(bundle, mockT);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'obs-1',
        conceptName: 'Temperature',
        value: '98.6',
        isParent: false,
        children: [],
      });
      expect(result[0].date).toBeDefined();
    });

    it('should format observation with parent-child relationships', () => {
      const bundle: FHIRObservationBundle = {
        resourceType: 'Bundle',
        total: 3,
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-parent',
              code: { text: 'Vital Signs' },
              effectiveDateTime: '2024-01-01T10:00:00Z',
              hasMember: [
                { reference: 'Observation/obs-child-1' },
                { reference: 'Observation/obs-child-2' },
              ],
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-child-1',
              code: { text: 'Heart Rate' },
              valueQuantity: { value: 75 },
              effectiveDateTime: '2024-01-01T10:00:00Z',
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-child-2',
              code: { text: 'Blood Pressure' },
              valueString: '120/80',
              effectiveDateTime: '2024-01-01T10:00:00Z',
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
        ],
      };

      const result = formatObservations(bundle, mockT);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'obs-parent',
        conceptName: 'Vital Signs',
        value: '',
        isParent: true,
      });
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0]).toMatchObject({
        id: 'obs-child-1',
        conceptName: 'Heart Rate',
        value: '75',
        isParent: false,
        children: [],
      });
      expect(result[0].children[1]).toMatchObject({
        id: 'obs-child-2',
        conceptName: 'Blood Pressure',
        value: '120/80',
        isParent: false,
        children: [],
      });
    });

    it('should include practitioner name from encounter when available', () => {
      const bundle: FHIRObservationBundle = {
        resourceType: 'Bundle',
        total: 2,
        entry: [
          {
            resource: {
              resourceType: 'Encounter',
              id: 'enc-1',
              participant: [
                {
                  individual: {
                    display: 'Dr. John Smith',
                  },
                },
              ],
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              code: { text: 'Temperature' },
              valueQuantity: { value: 98.6 },
              effectiveDateTime: '2024-01-01T10:00:00Z',
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
        ],
      };

      const result = formatObservations(bundle, mockT);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'obs-1',
        conceptName: 'Temperature',
        value: '98.6',
        recordedBy: 'Dr. John Smith',
        isParent: false,
        children: [],
      });
    });

    it('should handle observations without encounter reference', () => {
      const bundle: FHIRObservationBundle = {
        resourceType: 'Bundle',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              code: { text: 'Temperature' },
              valueQuantity: { value: 98.6 },
              effectiveDateTime: '2024-01-01T10:00:00Z',
            },
          },
        ],
      };

      const result = formatObservations(bundle, mockT);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'obs-1',
        conceptName: 'Temperature',
        value: '98.6',
        isParent: false,
        children: [],
      });
      expect(result[0].recordedBy).toBeUndefined();
    });

    it('should filter out child observations from top-level results', () => {
      const bundle: FHIRObservationBundle = {
        resourceType: 'Bundle',
        total: 2,
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-parent',
              code: { text: 'Panel' },
              effectiveDateTime: '2024-01-01T10:00:00Z',
              hasMember: [{ reference: 'Observation/obs-child' }],
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-child',
              code: { text: 'Child Obs' },
              valueString: 'value',
              effectiveDateTime: '2024-01-01T10:00:00Z',
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
        ],
      };

      const result = formatObservations(bundle, mockT);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('obs-parent');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('obs-child');
    });

    it('should handle non-observation resources in bundle', () => {
      const bundle: FHIRObservationBundle = {
        resourceType: 'Bundle',
        total: 2,
        entry: [
          {
            resource: {
              resourceType: 'Encounter',
              id: 'enc-1',
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              code: { text: 'Temperature' },
              valueQuantity: { value: 98.6 },
              effectiveDateTime: '2024-01-01T10:00:00Z',
            },
          },
        ],
      };

      const result = formatObservations(bundle, mockT);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('obs-1');
    });

    it('should handle parent observation with empty value when hasMember exists', () => {
      const bundle: FHIRObservationBundle = {
        resourceType: 'Bundle',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-parent',
              code: { text: 'Panel' },
              effectiveDateTime: '2024-01-01T10:00:00Z',
              hasMember: [{ reference: 'Observation/obs-child' }],
              valueString: 'This should be ignored',
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
        ],
      };

      const result = formatObservations(bundle, mockT);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('');
      expect(result[0].isParent).toBe(true);
    });
  });
});
