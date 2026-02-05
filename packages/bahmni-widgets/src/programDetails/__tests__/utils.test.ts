import { ProgramEnrollment } from '@bahmni/services';
import {
  extractProgramAttributeNames,
  createProgramHeader,
  createProgramDetailsViewModel,
} from '../utils';

describe('Utils', () => {
  describe('extractProgramAttributeNames', () => {
    it('should return empty array when fields is empty', () => {
      const emptyResult = extractProgramAttributeNames([]);
      expect(emptyResult).toEqual([]);
      const undefinedResult = extractProgramAttributeNames(undefined);
      expect(undefinedResult).toEqual([]);
    });

    it('should filter out known fields', () => {
      const fields = [
        'programName',
        'customAttribute1',
        'startDate',
        'customAttribute2',
        'outcome',
      ];
      const result = extractProgramAttributeNames(fields);
      expect(result).toEqual(['customAttribute1', 'customAttribute2']);
    });

    it('should return all fields when none are known fields', () => {
      const fields = ['customAttr1', 'customAttr2', 'customAttr3'];
      const result = extractProgramAttributeNames(fields);
      expect(result).toEqual(['customAttr1', 'customAttr2', 'customAttr3']);
    });

    it('should return empty array when all fields are known fields', () => {
      const fields = [
        'programName',
        'startDate',
        'endDate',
        'outcome',
        'state',
      ];
      const result = extractProgramAttributeNames(fields);
      expect(result).toEqual([]);
    });
  });

  describe('createProgramHeader', () => {
    it('should convert field to SCREAMING_SNAKE_CASE with prefix', () => {
      expect(createProgramHeader('programName')).toBe(
        'PROGRAMS_TABLE_HEADER_PROGRAM_NAME',
      );
      expect(createProgramHeader('state')).toBe('PROGRAMS_TABLE_HEADER_STATE');
      expect(createProgramHeader('dateEnrolled')).toBe(
        'PROGRAMS_TABLE_HEADER_DATE_ENROLLED',
      );
    });
  });

  describe('createProgramDetailsViewModel', () => {
    const mockEnrollment = (overrides: Partial<ProgramEnrollment> = {}) =>
      ({
        uuid: 'enrollment-1',
        program: { name: 'HIV Program' },
        dateEnrolled: '2024-01-01',
        dateCompleted: null,
        outcome: null,
        states: [],
        attributes: [],
        ...overrides,
      }) as ProgramEnrollment;

    it('should map enrollment to view model', () => {
      const enrollment = mockEnrollment();
      const result = createProgramDetailsViewModel(enrollment, []);

      expect(result).toEqual({
        id: 'enrollment-1',
        uuid: 'enrollment-1',
        programName: 'HIV Program',
        dateEnrolled: '2024-01-01',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: null,
        attributes: {},
      });
    });

    it('should extract outcome name and details', () => {
      const enrollment = mockEnrollment({
        outcome: {
          name: { name: 'Cured' },
          descriptions: [{ description: 'Treatment completed' }],
        } as any,
      });

      const result = createProgramDetailsViewModel(enrollment, []);

      expect(result.outcomeName).toBe('Cured');
      expect(result.outcomeDetails).toBe('Treatment completed');
    });

    it('should handle null outcome gracefully', () => {
      const enrollment = mockEnrollment({
        outcome: { name: null, descriptions: [] } as any,
      });

      const result = createProgramDetailsViewModel(enrollment, []);

      expect(result.outcomeName).toBeNull();
      expect(result.outcomeDetails).toBeNull();
    });

    it('should extract attributes', () => {
      const enrollment = mockEnrollment({
        attributes: [
          {
            attributeType: { display: 'Registration Number' },
            value: 'REG123',
          } as any,
        ],
      });

      const result = createProgramDetailsViewModel(enrollment, [
        'Registration Number',
      ]);

      expect(result.attributes['Registration Number']).toBe('REG123');
    });

    it('should return null for missing attributes', () => {
      const enrollment = mockEnrollment();

      const result = createProgramDetailsViewModel(enrollment, [
        'Missing Attribute',
      ]);

      expect(result.attributes['Missing Attribute']).toBeNull();
    });
  });
});
