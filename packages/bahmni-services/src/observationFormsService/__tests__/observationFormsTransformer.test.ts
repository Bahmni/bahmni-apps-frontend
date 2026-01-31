import { FormMetadata } from '../models';
import {
  transformFormDataToObservations,
  transformObservationsToFormData,
  convertImmutableToPlainObject,
  extractNotesFromFormData,
  FormData,
  ConceptValue,
  Form2Observation,
} from '../observationFormsTransformer';

describe('observationFormsTransformer', () => {
  const mockMetadata: FormMetadata = {
    uuid: 'form-uuid',
    name: 'Test Form',
    version: '1',
    published: true,
    schema: {
      controls: [],
    },
  };

  describe('transformFormDataToObservations', () => {
    it('should return empty array for empty form data', () => {
      const formData: FormData = {
        controls: [],
        metadata: {},
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toEqual([]);
    });

    it('should transform a simple text control', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'chiefComplaint',
            conceptUuid: 'concept-uuid-1',
            type: 'text',
            value: 'Headache',
            label: 'Chief Complaint',
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        concept: { uuid: 'concept-uuid-1' },
        value: 'Headache',
        formFieldPath: 'chiefComplaint',
      });
      expect(result[0].obsDatetime).toBeDefined();
    });

    it('should transform a number control', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'temperature',
            conceptUuid: 'concept-uuid-2',
            type: 'number',
            value: 98.6,
            label: 'Temperature',
            units: '°F',
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        concept: { uuid: 'concept-uuid-2' },
        value: 98.6,
        formFieldPath: 'temperature',
      });
    });

    it('should transform a date control to ISO string', () => {
      const testDate = new Date('2024-01-15T10:30:00.000Z');
      const formData: FormData = {
        controls: [
          {
            id: 'appointmentDate',
            conceptUuid: 'concept-uuid-3',
            type: 'date',
            value: testDate,
            label: 'Appointment Date',
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        concept: { uuid: 'concept-uuid-3' },
        value: testDate.toISOString(),
        formFieldPath: 'appointmentDate',
      });
    });

    it('should transform a select control with coded value', () => {
      const conceptValue: ConceptValue = {
        uuid: 'answer-uuid-1',
        display: 'Yes',
      };
      const formData: FormData = {
        controls: [
          {
            id: 'hasSymptoms',
            conceptUuid: 'concept-uuid-4',
            type: 'select',
            value: conceptValue,
            label: 'Has Symptoms',
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        concept: { uuid: 'concept-uuid-4' },
        value: conceptValue,
        formFieldPath: 'hasSymptoms',
      });
    });

    it('should skip controls with null values', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-uuid-1',
            type: 'text',
            value: 'Has value',
          },
          {
            id: 'field2',
            conceptUuid: 'concept-uuid-2',
            type: 'text',
            value: null,
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(1);
      expect(result[0].formFieldPath).toBe('field1');
    });

    it('should skip section headers without concepts', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'section1',
            conceptUuid: '',
            type: 'section',
            value: null,
            label: 'Patient History',
          },
          {
            id: 'field1',
            conceptUuid: 'concept-uuid-1',
            type: 'text',
            value: 'Some value',
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(1);
      expect(result[0].formFieldPath).toBe('field1');
    });

    it('should handle nested group members', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'vitalSigns',
            conceptUuid: 'vital-signs-group-uuid',
            type: 'obsControl',
            value: null,
            groupMembers: [
              {
                id: 'bloodPressure',
                conceptUuid: 'bp-uuid',
                type: 'text',
                value: '120/80',
              },
              {
                id: 'pulse',
                conceptUuid: 'pulse-uuid',
                type: 'number',
                value: 72,
              },
            ],
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(1);
      expect(result[0].groupMembers).toHaveLength(2);
      expect(result[0].groupMembers![0]).toMatchObject({
        concept: { uuid: 'bp-uuid' },
        value: '120/80',
        formFieldPath: 'bloodPressure',
      });
      expect(result[0].groupMembers![1]).toMatchObject({
        concept: { uuid: 'pulse-uuid' },
        value: 72,
        formFieldPath: 'pulse',
      });
    });

    it('should skip group members with null values', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'group1',
            conceptUuid: 'group-uuid',
            type: 'obsControl',
            value: null,
            groupMembers: [
              {
                id: 'member1',
                conceptUuid: 'member1-uuid',
                type: 'text',
                value: 'Has value',
              },
            ],
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(1);
      expect(result[0].groupMembers).toHaveLength(1);
      expect(result[0].groupMembers![0].formFieldPath).toBe('member1');
    });

    it('should handle multiple controls at root level', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: 'Value 1',
          },
          {
            id: 'field2',
            conceptUuid: 'concept-2',
            type: 'number',
            value: 42,
          },
          {
            id: 'field3',
            conceptUuid: 'concept-3',
            type: 'date',
            value: new Date('2024-01-01'),
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.formFieldPath)).toEqual([
        'field1',
        'field2',
        'field3',
      ]);
    });

    it('should continue processing other controls if one has null value', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: 'Valid value',
          },
          {
            id: 'field2',
            conceptUuid: 'concept-2',
            type: 'text',
            value: null,
          },
          {
            id: 'field3',
            conceptUuid: 'concept-3',
            type: 'text',
            value: 'Another valid value',
          },
        ],
      };

      const result = transformFormDataToObservations(formData, mockMetadata);

      // Should have 2 valid results (field2 skipped because value is null)
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.formFieldPath)).toEqual(['field1', 'field3']);
    });
  });

  describe('transformObservationsToFormData', () => {
    it('should return empty form data structure for empty observations', () => {
      const observations: Form2Observation[] = [];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result).toEqual({
        controls: [],
        metadata: {},
      });
    });

    it('should transform a simple text observation', () => {
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-1' },
          value: 'Headache',
          formFieldPath: 'chiefComplaint',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(1);
      expect(result.controls[0]).toMatchObject({
        id: 'chiefComplaint',
        conceptUuid: 'concept-uuid-1',
        type: 'obsControl',
        value: 'Headache',
      });
    });

    it('should transform a number observation', () => {
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-2' },
          value: 98.6,
          formFieldPath: 'temperature',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(1);
      expect(result.controls[0]).toMatchObject({
        id: 'temperature',
        conceptUuid: 'concept-uuid-2',
        value: 98.6,
      });
    });

    it('should transform ISO date string to Date object', () => {
      const isoDate = '2024-01-15T10:30:00.000Z';
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-3' },
          value: isoDate,
          formFieldPath: 'appointmentDate',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(1);
      expect(result.controls[0].value).toBeInstanceOf(Date);
      expect((result.controls[0].value as Date).toISOString()).toBe(isoDate);
    });

    it('should transform coded value (ConceptValue)', () => {
      const conceptValue: ConceptValue = {
        uuid: 'answer-uuid-1',
        display: 'Yes',
      };
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-4' },
          value: conceptValue,
          formFieldPath: 'hasSymptoms',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(1);
      expect(result.controls[0]).toMatchObject({
        id: 'hasSymptoms',
        conceptUuid: 'concept-uuid-4',
        value: conceptValue,
      });
    });

    it('should merge multiple observations with same formFieldPath into multiselect', () => {
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-5' },
          value: { uuid: 'symptom-1', display: 'Fever' },
          formFieldPath: 'symptoms',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
        {
          concept: { uuid: 'concept-uuid-5' },
          value: { uuid: 'symptom-2', display: 'Cough' },
          formFieldPath: 'symptoms',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
        {
          concept: { uuid: 'concept-uuid-5' },
          value: { uuid: 'symptom-3', display: 'Headache' },
          formFieldPath: 'symptoms',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(1);
      expect(result.controls[0].type).toBe('multiselect');
      expect(result.controls[0].value).toBeInstanceOf(Array);
      expect(result.controls[0].value as ConceptValue[]).toHaveLength(3);
    });

    it('should use concept UUID as fallback when formFieldPath is missing', () => {
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-6' },
          value: 'Some value',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(1);
      expect(result.controls[0].id).toBe('concept-uuid-6');
    });

    it('should preserve interpretation', () => {
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-7' },
          value: 105,
          formFieldPath: 'temperature',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
          interpretation: 'ABNORMAL',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(1);
      expect(result.controls[0].interpretation).toBe('ABNORMAL');
    });

    it('should handle multiple different observations', () => {
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-1' },
          value: 'Text value',
          formFieldPath: 'field1',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
        {
          concept: { uuid: 'concept-2' },
          value: 42,
          formFieldPath: 'field2',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
        {
          concept: { uuid: 'concept-3' },
          value: '2024-01-01T00:00:00.000Z',
          formFieldPath: 'field3',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(3);
      expect(result.controls.map((c) => c.id)).toEqual([
        'field1',
        'field2',
        'field3',
      ]);
    });

    it('should handle boolean values', () => {
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-8' },
          value: true,
          formFieldPath: 'isActive',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.controls).toHaveLength(1);
      expect(result.controls[0].value).toBe(true);
    });

    it('should include metadata in result', () => {
      const observations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-1' },
          value: 'Test',
          formFieldPath: 'field1',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
        },
      ];

      const result = transformObservationsToFormData(
        observations,
        mockMetadata,
      );

      expect(result.metadata).toEqual({ formMetadata: mockMetadata });
    });
  });

  describe('convertImmutableToPlainObject', () => {
    it('should return undefined for null input', () => {
      const result = convertImmutableToPlainObject(
        null as unknown as undefined,
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = convertImmutableToPlainObject(undefined);
      expect(result).toBeUndefined();
    });

    it('should return plain object as-is', () => {
      const plainObject = { field1: 'value1', field2: 42 };
      const result = convertImmutableToPlainObject(plainObject);
      expect(result).toBe(plainObject);
      expect(result).toEqual(plainObject);
    });

    it('should call toJS() for Immutable.js structures', () => {
      const plainObject = { field1: 'value1', nested: { field2: 42 } };
      const mockToJS = jest.fn(() => plainObject);
      const immutableObject = {
        toJS: mockToJS,
        someOtherMethod: () => {},
      };

      const result = convertImmutableToPlainObject(immutableObject);

      expect(mockToJS).toHaveBeenCalledTimes(1);
      expect(result).toEqual(plainObject);
    });

    it('should handle nested plain objects', () => {
      const nestedObject = {
        level1: {
          level2: {
            value: 'deep value',
          },
        },
      };
      const result = convertImmutableToPlainObject(nestedObject);
      expect(result).toBe(nestedObject);
      expect(result).toEqual(nestedObject);
    });

    it('should return undefined for non-object types', () => {
      expect(
        convertImmutableToPlainObject('string' as unknown as undefined),
      ).toBeUndefined();
      expect(
        convertImmutableToPlainObject(123 as unknown as undefined),
      ).toBeUndefined();
      expect(
        convertImmutableToPlainObject(true as unknown as undefined),
      ).toBeUndefined();
    });
  });

  describe('extractNotesFromFormData', () => {
    it('should return early if formData is undefined', () => {
      const transformedObservations: Form2Observation[] = [];
      extractNotesFromFormData(undefined, transformedObservations);
      expect(transformedObservations).toHaveLength(0);
    });

    it('should return early if formData.children is not an array', () => {
      const formData = { someField: 'value' };
      const transformedObservations: Form2Observation[] = [];
      extractNotesFromFormData(formData, transformedObservations);
      expect(transformedObservations).toHaveLength(0);
    });

    it('should extract notes from fields without values', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'concept-uuid-1',
            value: null,
            comment: 'This is a note',
            id: 'field1',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(1);
      expect(transformedObservations[0]).toMatchObject({
        concept: { uuid: 'concept-uuid-1', datatype: undefined },
        value: null,
        comment: 'This is a note',
        formFieldPath: 'field1',
      });
    });

    it('should extract interpretation from fields without values', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'concept-uuid-1',
            value: '',
            interpretation: 'ABNORMAL',
            id: 'field1',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(1);
      expect(transformedObservations[0]).toMatchObject({
        concept: { uuid: 'concept-uuid-1', datatype: undefined },
        value: null,
        interpretation: 'ABNORMAL',
        formFieldPath: 'field1',
      });
    });

    it('should extract both comment and interpretation', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'concept-uuid-1',
            value: undefined,
            comment: 'Patient refused to answer',
            interpretation: 'NOT_APPLICABLE',
            formFieldPath: 'sensitiveQuestion',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(1);
      expect(transformedObservations[0]).toMatchObject({
        concept: { uuid: 'concept-uuid-1', datatype: undefined },
        value: null,
        comment: 'Patient refused to answer',
        interpretation: 'NOT_APPLICABLE',
        formFieldPath: 'sensitiveQuestion',
      });
    });

    it('should not extract notes if field has a value', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'concept-uuid-1',
            value: 'Some value',
            comment: 'This note should be ignored',
            id: 'field1',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(0);
    });

    it('should handle nested children recursively', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'parent-uuid',
            value: 'Parent value',
            children: [
              {
                conceptUuid: 'child-uuid',
                value: null,
                comment: 'Nested note',
                id: 'nestedField',
              },
            ],
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(1);
      expect(transformedObservations[0]).toMatchObject({
        concept: { uuid: 'child-uuid', datatype: undefined },
        value: null,
        comment: 'Nested note',
        formFieldPath: 'nestedField',
      });
    });

    it('should not create duplicate observations for existing concepts', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'concept-uuid-1',
            value: null,
            comment: 'This note should be ignored',
            id: 'field1',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [
        {
          concept: { uuid: 'concept-uuid-1', datatype: 'Text' },
          value: 'Existing value',
          obsDatetime: '2024-01-15T10:00:00.000Z',
          formNamespace: 'Bahmni',
          formFieldPath: 'field1',
        },
      ];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(1);
      expect(transformedObservations[0].value).toBe('Existing value');
    });

    it('should extract conceptUuid from nested value.concept structure', () => {
      const formData = {
        children: [
          {
            value: {
              value: null,
              comment: 'Note from value object',
              concept: { uuid: 'nested-concept-uuid' },
            },
            id: 'field1',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(1);
      expect(transformedObservations[0]).toMatchObject({
        concept: { uuid: 'nested-concept-uuid', datatype: undefined },
        value: null,
        comment: 'Note from value object',
        formFieldPath: 'field1',
      });
    });

    it('should extract conceptUuid from control.concept structure', () => {
      const formData = {
        children: [
          {
            value: null,
            comment: 'Note from control',
            control: { concept: { uuid: 'control-concept-uuid' } },
            id: 'field1',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(1);
      expect(transformedObservations[0]).toMatchObject({
        concept: { uuid: 'control-concept-uuid', datatype: undefined },
        value: null,
        comment: 'Note from control',
        formFieldPath: 'field1',
      });
    });

    it('should handle multiple notes-only fields', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'concept-uuid-1',
            value: null,
            comment: 'Note 1',
            id: 'field1',
          },
          {
            conceptUuid: 'concept-uuid-2',
            value: '',
            interpretation: 'CRITICAL',
            id: 'field2',
          },
          {
            conceptUuid: 'concept-uuid-3',
            value: undefined,
            comment: 'Note 3',
            interpretation: 'NORMAL',
            formFieldPath: 'field3',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(3);
      expect(transformedObservations[0].comment).toBe('Note 1');
      expect(transformedObservations[1].interpretation).toBe('CRITICAL');
      expect(transformedObservations[2].comment).toBe('Note 3');
      expect(transformedObservations[2].interpretation).toBe('NORMAL');
    });

    it('should skip children without conceptUuid', () => {
      const formData = {
        children: [
          {
            value: null,
            comment: 'This should be skipped',
            id: 'field1',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(0);
    });

    it('should skip children without notes', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'concept-uuid-1',
            value: null,
            id: 'field1',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(0);
    });

    it('should use formFieldPath when available, fallback to id', () => {
      const formData = {
        children: [
          {
            conceptUuid: 'concept-uuid-1',
            value: null,
            comment: 'Note with formFieldPath',
            formFieldPath: 'customPath',
            id: 'field1',
          },
          {
            conceptUuid: 'concept-uuid-2',
            value: null,
            comment: 'Note with id only',
            id: 'field2',
          },
        ],
      };
      const transformedObservations: Form2Observation[] = [];

      extractNotesFromFormData(formData, transformedObservations);

      expect(transformedObservations).toHaveLength(2);
      expect(transformedObservations[0].formFieldPath).toBe('customPath');
      expect(transformedObservations[1].formFieldPath).toBe('field2');
    });
  });
});
