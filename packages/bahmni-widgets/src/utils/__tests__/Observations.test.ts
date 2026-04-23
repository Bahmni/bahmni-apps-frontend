import { Observation } from 'fhir/r4';
import { ExtractedObservation } from '../../observations/models';
import {
  extractId,
  isAbnormalInterpretation,
  extractObservationValue,
  getObservationDisplayInfo,
  sortObservationsBySortId,
  groupMultiSelectObservations,
  transformObservations,
} from '../Observations';

describe('Observations Utils', () => {
  describe('extractId', () => {
    it('should extract ID from string reference', () => {
      expect(extractId('Observation/obs-123')).toBe('obs-123');
    });

    it('should extract ID from Reference object', () => {
      expect(extractId({ reference: 'Patient/patient-456' })).toBe(
        'patient-456',
      );
    });

    it('should return empty string for empty string', () => {
      expect(extractId('')).toBe('');
    });

    it('should handle references without slashes', () => {
      expect(extractId('obs-789')).toBe('obs-789');
    });
  });

  describe('isAbnormalInterpretation', () => {
    it('should return true for abnormal interpretation code A', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        interpretation: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'A',
              },
            ],
          },
        ],
      };

      expect(isAbnormalInterpretation(observation)).toBe(true);
    });

    it('should return false for normal interpretation', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        interpretation: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'N',
              },
            ],
          },
        ],
      };

      expect(isAbnormalInterpretation(observation)).toBe(false);
    });

    it('should return false when no interpretation exists', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
      };

      expect(isAbnormalInterpretation(observation)).toBe(false);
    });
  });

  describe('extractObservationValue', () => {
    it('should extract valueQuantity with reference range', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueQuantity: {
          value: 100,
          unit: 'mg/dL',
        },
        referenceRange: [
          {
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'normal',
                },
              ],
            },
            low: { value: 70 },
            high: { value: 120 },
          },
        ],
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: 100,
        unit: 'mg/dL',
        type: 'quantity',
        isAbnormal: false,
        referenceRange: {
          low: { value: 70, unit: undefined },
          high: { value: 120, unit: undefined },
        },
      });
    });

    it('should extract valueQuantity without reference range', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueQuantity: {
          value: 98.6,
          unit: '°F',
        },
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: 98.6,
        unit: '°F',
        type: 'quantity',
        isAbnormal: false,
      });
    });

    it('should extract valueCodeableConcept from text', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueCodeableConcept: {
          text: 'Positive',
        },
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: 'Positive',
        type: 'codeable',
        isAbnormal: false,
      });
    });

    it('should extract valueCodeableConcept from coding display', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueCodeableConcept: {
          coding: [{ display: 'Negative' }],
        },
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: 'Negative',
        type: 'codeable',
        isAbnormal: false,
      });
    });

    it('should extract valueString', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueString: 'Result text',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: 'Result text',
        type: 'string',
        isAbnormal: false,
      });
    });

    it('should extract valueBoolean', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueBoolean: true,
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: true,
        type: 'boolean',
        isAbnormal: false,
      });
    });

    it('should extract valueInteger', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueInteger: 42,
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: 42,
        type: 'integer',
        isAbnormal: false,
      });
    });

    it('should extract valueDateTime', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueDateTime: '2024-01-01T12:00:00Z',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: '2024-01-01T12:00:00Z',
        type: 'dateTime',
        isAbnormal: false,
      });
    });

    it('should extract valueTime', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueTime: '14:30:00',
      };

      const result = extractObservationValue(observation);

      expect(result).toEqual({
        value: '14:30:00',
        type: 'time',
        isAbnormal: false,
      });
    });

    it('should mark as abnormal when interpretation is abnormal', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
        valueQuantity: {
          value: 200,
          unit: 'mg/dL',
        },
        interpretation: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'A',
              },
            ],
          },
        ],
      };

      const result = extractObservationValue(observation);

      expect(result?.isAbnormal).toBe(true);
    });

    it('should return undefined when no value exists', () => {
      const observation: Observation = {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Test' },
      };

      const result = extractObservationValue(observation);

      expect(result).toBeUndefined();
    });
  });

  describe('getObservationDisplayInfo', () => {
    it('should return range string with low and high values', () => {
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Test',
        observationValue: {
          value: 100,
          unit: 'mg/dL',
          type: 'quantity',
          referenceRange: {
            low: { value: 70 },
            high: { value: 120 },
          },
        },
      };

      const result = getObservationDisplayInfo(observation);

      expect(result).toEqual({
        rangeString: ' (70 - 120)',
        isAbnormal: false,
      });
    });

    it('should return range string with only low value', () => {
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Test',
        observationValue: {
          value: 13,
          unit: 'g/dL',
          type: 'quantity',
          referenceRange: {
            low: { value: 12 },
          },
        },
      };

      const result = getObservationDisplayInfo(observation);

      expect(result).toEqual({
        rangeString: ' (>12)',
        isAbnormal: false,
      });
    });

    it('should return range string with only high value', () => {
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Test',
        observationValue: {
          value: 115,
          unit: 'mmHg',
          type: 'quantity',
          referenceRange: {
            high: { value: 120 },
          },
        },
      };

      const result = getObservationDisplayInfo(observation);

      expect(result).toEqual({
        rangeString: ' (<120)',
        isAbnormal: false,
      });
    });

    it('should return empty range string when no reference range', () => {
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Test',
        observationValue: {
          value: 100,
          unit: 'mg/dL',
          type: 'quantity',
        },
      };

      const result = getObservationDisplayInfo(observation);

      expect(result).toEqual({
        rangeString: '',
        isAbnormal: false,
      });
    });

    it('should return isAbnormal as true when observation is abnormal', () => {
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Test',
        observationValue: {
          value: 200,
          unit: 'mg/dL',
          type: 'quantity',
          isAbnormal: true,
        },
      };

      const result = getObservationDisplayInfo(observation);

      expect(result.isAbnormal).toBe(true);
    });

    it('should return empty values when no observationValue', () => {
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Test',
      };

      const result = getObservationDisplayInfo(observation);

      expect(result).toEqual({
        rangeString: '',
        isAbnormal: false,
      });
    });
  });

  describe('sortObservationsBySortId', () => {
    it('should sort observations by sortId in numeric order', () => {
      const observations: ExtractedObservation[] = [
        {
          id: 'obs-3',
          display: 'Third',
          sortId: '10',
        },
        {
          id: 'obs-1',
          display: 'First',
          sortId: '1',
        },
        {
          id: 'obs-2',
          display: 'Second',
          sortId: '2',
        },
      ];

      const sorted = sortObservationsBySortId(observations);

      expect(sorted.map((o) => o.id)).toEqual(['obs-1', 'obs-2', 'obs-3']);
    });

    it('should handle observations without sortId', () => {
      const observations: ExtractedObservation[] = [
        {
          id: 'obs-2',
          display: 'Second',
          sortId: '2',
        },
        {
          id: 'obs-no-sort',
          display: 'No Sort',
        },
        {
          id: 'obs-1',
          display: 'First',
          sortId: '1',
        },
      ];

      const sorted = sortObservationsBySortId(observations);

      expect(sorted[0].id).toBe('obs-no-sort');
      expect(sorted[1].id).toBe('obs-1');
      expect(sorted[2].id).toBe('obs-2');
    });
  });

  describe('groupMultiSelectObservations', () => {
    it('should group observations with same conceptId', () => {
      const observations: ExtractedObservation[] = [
        {
          id: 'obs-1',
          display: 'Test',
          conceptId: 'concept-123',
          observationValue: {
            value: 'Option A',
            type: 'string',
          },
        },
        {
          id: 'obs-2',
          display: 'Test',
          conceptId: 'concept-123',
          observationValue: {
            value: 'Option B',
            type: 'string',
          },
        },
      ];

      const grouped = groupMultiSelectObservations(observations);

      expect(grouped).toHaveLength(1);
      expect(grouped[0].observationValue?.value).toBe('Option A, Option B');
    });
  });

  describe('transformObservations', () => {
    it('should transform simple observation', () => {
      const observations: Observation[] = [
        {
          resourceType: 'Observation',
          id: 'obs-1',
          status: 'final',
          code: {
            text: 'Heart Rate',
            coding: [{ code: 'concept-123' }],
          },
          valueQuantity: {
            value: 72,
            unit: 'bpm',
          },
        },
      ];

      const result = transformObservations(observations);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'obs-1',
        display: 'Heart Rate',
        conceptId: 'concept-123',
        observationValue: {
          value: 72,
          unit: 'bpm',
          type: 'quantity',
          isAbnormal: false,
        },
        effectiveDateTime: undefined,
        issued: undefined,
        members: undefined,
        sortId: '',
        comment: undefined,
      });
    });

    it('should transform grouped observations with members', () => {
      const observations: Observation[] = [
        {
          resourceType: 'Observation',
          id: 'group-1',
          status: 'final',
          code: {
            text: 'Blood Pressure',
          },
          hasMember: [
            { reference: 'Observation/member-1' },
            { reference: 'Observation/member-2' },
          ],
        },
        {
          resourceType: 'Observation',
          id: 'member-1',
          status: 'final',
          code: {
            text: 'Systolic',
          },
          valueQuantity: {
            value: 120,
            unit: 'mmHg',
          },
        },
        {
          resourceType: 'Observation',
          id: 'member-2',
          status: 'final',
          code: {
            text: 'Diastolic',
          },
          valueQuantity: {
            value: 80,
            unit: 'mmHg',
          },
        },
      ];

      const result = transformObservations(observations);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('group-1');
      expect(result[0].members).toHaveLength(2);
      expect(result[0].members?.[0].id).toBe('member-1');
      expect(result[0].members?.[1].id).toBe('member-2');
    });

    it('should extract comment from note field', () => {
      const observations: Observation[] = [
        {
          resourceType: 'Observation',
          id: 'obs-1',
          status: 'final',
          code: {
            text: 'Temperature',
          },
          valueQuantity: {
            value: 38.5,
            unit: '°C',
          },
          note: [{ text: 'Patient has fever' }],
        },
      ];

      const result = transformObservations(observations);

      expect(result[0].comment).toBe('Patient has fever');
    });

    it('should extract sortId from form-namespace-path extension', () => {
      const observations: Observation[] = [
        {
          resourceType: 'Observation',
          id: 'obs-1',
          status: 'final',
          code: {
            text: 'Test',
          },
          valueString: 'Result',
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
              valueString: 'FormName.1/5-2',
            },
          ],
        },
      ];

      const result = transformObservations(observations);

      expect(result[0].sortId).toBe('5-2');
    });

    it('should filter out child observations from top level', () => {
      const observations: Observation[] = [
        {
          resourceType: 'Observation',
          id: 'parent',
          status: 'final',
          code: {
            text: 'Parent',
          },
          hasMember: [{ reference: 'Observation/child' }],
        },
        {
          resourceType: 'Observation',
          id: 'child',
          status: 'final',
          code: {
            text: 'Child',
          },
          valueString: 'Value',
        },
      ];

      const result = transformObservations(observations);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('parent');
      expect(result[0].members).toHaveLength(1);
      expect(result[0].members?.[0].id).toBe('child');
    });

    it('should handle observations without required fields gracefully', () => {
      const observations: Observation[] = [
        {
          resourceType: 'Observation',
          status: 'final',
          code: {
            text: 'Test',
          },
        },
      ];

      const result = transformObservations(observations);

      expect(result).toHaveLength(0);
    });

    it('should use coding display if text is not available', () => {
      const observations: Observation[] = [
        {
          resourceType: 'Observation',
          id: 'obs-1',
          status: 'final',
          code: {
            coding: [{ display: 'Coded Display' }],
          },
          valueString: 'Result',
        },
      ];

      const result = transformObservations(observations);

      expect(result[0].display).toBe('Coded Display');
    });

    it('should group multi-select members with same conceptId', () => {
      const observations: Observation[] = [
        {
          resourceType: 'Observation',
          id: 'parent',
          status: 'final',
          code: {
            text: 'Image quality reason',
          },
          valueString: 'Combined values',
          hasMember: [
            { reference: 'Observation/member-1' },
            { reference: 'Observation/member-2' },
          ],
        },
        {
          resourceType: 'Observation',
          id: 'member-1',
          status: 'final',
          code: {
            text: 'Image quality issue',
            coding: [{ code: 'quality-issue-concept' }],
          },
          valueCodeableConcept: {
            text: 'Blurring',
          },
        },
        {
          resourceType: 'Observation',
          id: 'member-2',
          status: 'final',
          code: {
            text: 'Image quality issue',
            coding: [{ code: 'quality-issue-concept' }],
          },
          valueCodeableConcept: {
            text: 'Rotation',
          },
        },
      ];

      const result = transformObservations(observations);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('parent');
      expect(result[0].members).toHaveLength(1);
      expect(result[0].members?.[0].display).toBe('Image quality issue');
      expect(result[0].members?.[0].observationValue?.value).toBe(
        'Blurring, Rotation',
      );
    });
  });
});
