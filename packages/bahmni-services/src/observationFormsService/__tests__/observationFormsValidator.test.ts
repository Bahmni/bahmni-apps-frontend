import { FormMetadata } from '../models';
import { FormData, FormControlData } from '../observationFormsTransformer';
import {
  validateFormData,
  hasFormData,
  validateRequiredFields,
  ValidationError,
} from '../observationFormsValidator';

describe('observationFormsValidator', () => {
  describe('validateFormData', () => {
    it('should return valid for empty form data', () => {
      const formData: FormData = {
        controls: [],
        metadata: {},
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error if form data is null', () => {
      const result = validateFormData(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'root',
        type: 'required',
      });
    });

    it('should return error if controls array is missing', () => {
      const formData = { metadata: {} } as any;

      const result = validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'controls',
        type: 'required',
      });
    });

    it('should validate text control successfully', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: 'Valid text',
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for text control with non-string value', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: 123 as any,
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'field1',
        type: 'invalid_type',
        message: 'Text field must contain a string value',
      });
    });

    it('should validate number control successfully', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'number',
            value: 42,
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for number control with non-number value', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'number',
            value: 'not a number' as any,
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'field1',
        type: 'invalid_type',
        message: 'Number field must contain a numeric value',
      });
    });

    it('should validate date control with Date object', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'date',
            value: new Date('2024-01-15'),
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate date control with ISO string', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'date',
            value: '2024-01-15T00:00:00.000Z' as any,
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for date control with invalid type', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'date',
            value: 12345 as any,
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'field1',
        type: 'invalid_type',
      });
    });

    it('should validate select control with concept value', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'select',
            value: { uuid: 'answer-uuid', display: 'Yes' },
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for select control without uuid', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'select',
            value: { display: 'Yes' } as any,
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'field1',
        type: 'invalid_type',
      });
    });

    it('should return error for control without concept UUID', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: '',
            type: 'text',
            value: 'Some value',
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'field1',
        type: 'required',
        message: 'Control must have a concept UUID',
      });
    });

    it('should skip validation for section headers', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'section1',
            conceptUuid: '',
            type: 'section',
            value: null,
            label: 'Section Header',
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate nested group members', () => {
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
                value: 'Valid',
              },
              {
                id: 'member2',
                conceptUuid: '', // Invalid
                type: 'number',
                value: 42,
              },
            ],
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('member2');
    });

    it('should collect multiple validation errors', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: '',
            type: 'text',
            value: 123 as any,
          },
          {
            id: 'field2',
            conceptUuid: 'concept-2',
            type: 'number',
            value: 'not a number' as any,
          },
        ],
      };

      const result = validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // field1: no uuid + wrong type, field2: wrong type
    });
  });

  describe('hasFormData', () => {
    it('should return false for null form data', () => {
      const result = hasFormData(null as any);

      expect(result).toBe(false);
    });

    it('should return false for form data without controls', () => {
      const formData = { metadata: {} } as any;

      const result = hasFormData(formData);

      expect(result).toBe(false);
    });

    it('should return false for empty controls array', () => {
      const formData: FormData = {
        controls: [],
        metadata: {},
      };

      const result = hasFormData(formData);

      expect(result).toBe(false);
    });

    it('should return false when all controls have null values', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: null,
          },
          {
            id: 'field2',
            conceptUuid: 'concept-2',
            type: 'text',
            value: undefined,
          },
        ],
      };

      const result = hasFormData(formData);

      expect(result).toBe(false);
    });

    it('should return true when at least one control has a value', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: null,
          },
          {
            id: 'field2',
            conceptUuid: 'concept-2',
            type: 'text',
            value: 'Has value',
          },
        ],
      };

      const result = hasFormData(formData);

      expect(result).toBe(true);
    });

    it('should check nested group members', () => {
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
                value: 'Nested value',
              },
            ],
          },
        ],
      };

      const result = hasFormData(formData);

      expect(result).toBe(true);
    });

    it('should return false when group members also have null values', () => {
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
                value: null,
              },
            ],
          },
        ],
      };

      const result = hasFormData(formData);

      expect(result).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should return valid when all required fields have values', () => {
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
            type: 'text',
            value: 'Value 2',
          },
        ],
      };

      const result = validateRequiredFields(formData, ['field1', 'field2']);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when required field is missing', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: 'Value 1',
          },
        ],
      };

      const result = validateRequiredFields(formData, [
        'field1',
        'field2', // Missing
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'field2',
        type: 'required',
      });
    });

    it('should return error when required field has null value', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: null,
          },
        ],
      };

      const result = validateRequiredFields(formData, ['field1']);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'field1',
        type: 'required',
      });
    });

    it('should find required fields in nested group members', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'group1',
            conceptUuid: 'group-uuid',
            type: 'obsControl',
            value: 'group',
            groupMembers: [
              {
                id: 'nestedField',
                conceptUuid: 'nested-uuid',
                type: 'text',
                value: 'Nested value',
              },
            ],
          },
        ],
      };

      const result = validateRequiredFields(formData, ['nestedField']);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return multiple errors for multiple missing required fields', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: 'Value 1',
          },
        ],
      };

      const result = validateRequiredFields(formData, [
        'field1',
        'field2',
        'field3',
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.map((e) => e.field)).toEqual(['field2', 'field3']);
    });

    it('should return valid when no required fields specified', () => {
      const formData: FormData = {
        controls: [
          {
            id: 'field1',
            conceptUuid: 'concept-1',
            type: 'text',
            value: null,
          },
        ],
      };

      const result = validateRequiredFields(formData, []);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
