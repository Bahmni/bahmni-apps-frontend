import { FormMetadata } from '../models';
import {
  transformFormDataToObservations,
  transformObservationsToFormData,
  FormData,
  FormControlData,
  ConceptValue,
  ObservationDataInFormControls,
} from '../observationFormsTransformer';

describe('observationFormsTransformer', () => {
  describe('transformFormDataToObservations', () => {
    it('should return empty array for empty form data', () => {
      const formData: FormData = {
        controls: [],
        metadata: {},
      };

      const result = transformFormDataToObservations(formData);

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

      const result = transformFormDataToObservations(formData);

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

      const result = transformFormDataToObservations(formData);

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

      const result = transformFormDataToObservations(formData);

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

      const result = transformFormDataToObservations(formData);

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
          {
            id: 'field3',
            conceptUuid: 'concept-uuid-3',
            type: 'text',
            value: undefined,
          },
        ],
      };

      const result = transformFormDataToObservations(formData);

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

      const result = transformFormDataToObservations(formData);

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
            value: 'group',
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

      const result = transformFormDataToObservations(formData);

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
            value: 'group',
            groupMembers: [
              {
                id: 'member1',
                conceptUuid: 'member1-uuid',
                type: 'text',
                value: 'Has value',
              },
              {
                id: 'member2',
                conceptUuid: 'member2-uuid',
                type: 'text',
                value: null,
              },
            ],
          },
        ],
      };

      const result = transformFormDataToObservations(formData);

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

      const result = transformFormDataToObservations(formData);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.formFieldPath)).toEqual([
        'field1',
        'field2',
        'field3',
      ]);
    });

    it('should continue processing other controls if one fails', () => {
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
            value: null, // This will cause an error
          },
          {
            id: 'field3',
            conceptUuid: 'concept-3',
            type: 'text',
            value: 'Another valid value',
          },
        ],
      };

      // Mock console.error to avoid cluttering test output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = transformFormDataToObservations(formData);

      // Should have 2 valid results (field2 skipped because value is null)
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.formFieldPath)).toEqual(['field1', 'field3']);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('transformObservationsToFormData', () => {
    it('should return empty form data structure', () => {
      const observations: ObservationPayload[] = [];
      const metadata: FormMetadata = {
        uuid: 'form-uuid',
        name: 'Test Form',
        version: '1',
        published: true,
        schema: {},
      };

      const result = transformObservationsToFormData(observations, metadata);

      expect(result).toEqual({
        controls: [],
        metadata: {},
      });
    });

    // TODO: Implement actual transformation from observations to form data
    // This is a placeholder test for the function that needs implementation
  });
});
