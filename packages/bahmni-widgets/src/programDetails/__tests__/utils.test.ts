import { ProgramEnrollment } from '@bahmni/services';
import {
  extractProgramAttributeNames,
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
        allowedStates: [],
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
        allowedStates: [],
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

    it('should map allowedStates with uuid and display from concept', () => {
      const enrollment = mockEnrollment({
        allowedStates: [
          {
            uuid: 'state-1',
            concept: { display: 'Treatment Phase' },
          } as any,
          {
            uuid: 'state-2',
            concept: { display: 'Follow-up Phase' },
          } as any,
          { uuid: 'state-3', concept: { display: 'Completed' } } as any,
        ],
      });

      const result = createProgramDetailsViewModel(enrollment, []);

      expect(result.allowedStates).toEqual([
        { uuid: 'state-1', display: 'Treatment Phase' },
        { uuid: 'state-2', display: 'Follow-up Phase' },
        { uuid: 'state-3', display: 'Completed' },
      ]);
    });

    it('should handle empty allowedStates array', () => {
      const enrollment = mockEnrollment({ allowedStates: [] });

      const result = createProgramDetailsViewModel(enrollment, []);

      expect(result.allowedStates).toEqual([]);
    });
  });
});
