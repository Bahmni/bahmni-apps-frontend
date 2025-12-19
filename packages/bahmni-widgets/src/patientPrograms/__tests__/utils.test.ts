import { PatientProgramsResponse } from '@bahmni/services';
import {
  createProgramHeaders,
  createPatientProgramViewModal,
  extractProgramAttributeNames,
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

  describe('createProgramHeaders', () => {
    const mockT = (key: string) => key;

    it('should return empty array for empty fields', () => {
      const fields: string[] = [];
      const result = createProgramHeaders(fields, mockT);

      expect(result).toEqual([]);
    });

    it('should use translation function for headers', () => {
      const customT = (key: string) => `translated_${key}`;
      const fields = ['state'];
      const result = createProgramHeaders(fields, customT);

      expect(result).toEqual([
        { key: 'state', header: 'translated_PROGRAMS_TABLE_HEADER_STATE' },
      ]);
    });

    it.each([
      'supported_country',
      'Supported Country',
      'supported country',
      'Supported country',
      'supportedCountry',
    ])(
      'should normalize "%s" to PROGRAMS_TABLE_HEADER_SUPPORTED_COUNTRY',
      (field) => {
        const result = createProgramHeaders([field], mockT);
        expect(result).toEqual([
          {
            key: field,
            header: 'PROGRAMS_TABLE_HEADER_SUPPORTED_COUNTRY',
          },
        ]);
      },
    );
  });

  describe('createPatientProgramViewModal', () => {
    const mockState = (
      uuid: string,
      name: string,
      startDate: string,
      endDate: string | null,
    ) =>
      ({
        uuid,
        startDate,
        endDate,
        state: { concept: { display: name } },
      }) as any;

    const mockEnrollment = (overrides: any) =>
      ({
        uuid: 'enrollment-1',
        program: { name: 'Test Program' },
        dateEnrolled: '2024-01-01',
        dateCompleted: null,
        outcome: null,
        states: [],
        attributes: [],
        ...overrides,
      }) as any;

    const mockAttribute = (display: string, value: any) =>
      ({
        uuid: 'attr-1',
        attributeType: { uuid: 'attr-type-1', display },
        value,
        voided: false,
      }) as any;

    it('should return empty array when results array is empty', () => {
      const response: PatientProgramsResponse = { results: [] };
      const result = createPatientProgramViewModal(response, []);
      expect(result).toEqual([]);
    });

    it('should map enrollment with null dateCompleted to find state with null endDate', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-1',
            program: { name: 'HIV Program' },
            states: [
              mockState('state-1', 'Initial State', '2024-01-01', '2024-02-01'),
              mockState('state-2', 'Active State', '2024-02-01', null),
            ],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, []);

      expect(result).toEqual([
        {
          id: 'enrollment-uuid-1',
          uuid: 'enrollment-uuid-1',
          programName: 'HIV Program',
          dateEnrolled: '2024-01-01',
          dateCompleted: null,
          outcomeName: null,
          outcomeDetails: null,
          currentStateName: 'Active State',
          attributes: {},
        },
      ]);
    });

    it('should map enrollment with dateCompleted to find state with latest endDate', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-2',
            program: { name: 'TB Program' },
            dateCompleted: '2024-06-01',
            outcome: { name: { name: 'Cured' } },
            states: [
              mockState(
                'state-1',
                'Initial Treatment',
                '2024-01-01',
                '2024-03-01',
              ),
              mockState(
                'state-2',
                'Continuation Phase',
                '2024-03-01',
                '2024-06-01',
              ),
              mockState(
                'state-3',
                'Temporary State',
                '2024-02-01',
                '2024-02-15',
              ),
            ],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, []);

      expect(result).toEqual([
        {
          id: 'enrollment-uuid-2',
          uuid: 'enrollment-uuid-2',
          programName: 'TB Program',
          dateEnrolled: '2024-01-01',
          dateCompleted: '2024-06-01',
          outcomeName: 'Cured',
          outcomeDetails: null,
          currentStateName: 'Continuation Phase',
          attributes: {},
        },
      ]);
    });

    it('should handle multiple enrollments with correct uuid mapping', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-1',
            program: { name: 'Program 1' },
            states: [mockState('state-1', 'State 1', '2024-01-01', null)],
          }),
          mockEnrollment({
            uuid: 'enrollment-2',
            program: { name: 'Program 2' },
            dateEnrolled: '2024-02-01',
            states: [mockState('state-2', 'State 2', '2024-02-01', null)],
          }),
          mockEnrollment({
            uuid: 'enrollment-3',
            program: { name: 'Program 3' },
            dateEnrolled: '2024-03-01',
            states: [mockState('state-3', 'State 3', '2024-03-01', null)],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, []);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('enrollment-1');
      expect(result[1].id).toBe('enrollment-2');
      expect(result[2].id).toBe('enrollment-3');
      expect(result[0].programName).toBe('Program 1');
      expect(result[1].programName).toBe('Program 2');
      expect(result[2].programName).toBe('Program 3');
    });

    it('should handle undefined outcome and state with null name gracefully', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-3',
            program: { name: 'Diabetes Program' },
            dateCompleted: '2024-12-01',
            outcome: { name: null },
            states: [],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, []);
      expect(result[0].outcomeName).toBeNull();
      expect(result[0].currentStateName).toBeNull();
    });

    it('should return empty attributes object when programAttributes is empty', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-4',
            states: [mockState('state-1', 'Test State', '2024-01-01', null)],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, []);
      expect(result[0].attributes).toEqual({});
    });

    it('should extract outcomeDetails from outcome descriptions', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-10',
            dateCompleted: '2024-12-01',
            outcome: {
              uuid: 'outcome-1',
              display: 'Treatment Completed',
              name: { name: 'Treatment Completed' },
              descriptions: [
                {
                  uuid: 'desc-1',
                  description: 'Patient completed treatment successfully',
                  locale: 'en',
                },
              ],
            },
            states: [
              mockState('state-1', 'Completed', '2024-01-01', '2024-12-01'),
            ],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, []);
      expect(result[0].outcomeName).toBe('Treatment Completed');
      expect(result[0].outcomeDetails).toBe(
        'Patient completed treatment successfully',
      );
    });

    it('should return null for outcomeDetails when descriptions is empty', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-11',
            dateCompleted: '2024-12-01',
            outcome: {
              uuid: 'outcome-1',
              display: 'Treatment Completed',
              name: { name: 'Treatment Completed' },
              descriptions: [],
            },
            states: [
              mockState('state-1', 'Completed', '2024-01-01', '2024-12-01'),
            ],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, []);
      expect(result[0].outcomeName).toBe('Treatment Completed');
      expect(result[0].outcomeDetails).toBeNull();
    });

    it('should extract attribute with string value', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-5',
            states: [mockState('state-1', 'Test State', '2024-01-01', null)],
            attributes: [mockAttribute('Registration Number', 'REG123456')],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, [
        'Registration Number',
      ]);
      expect(result[0].attributes).toEqual({
        'Registration Number': 'REG123456',
      });
    });

    it('should extract attribute with Concept value', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-6',
            states: [mockState('state-1', 'Test State', '2024-01-01', null)],
            attributes: [
              mockAttribute('Treatment Category', {
                uuid: 'concept-1',
                display: 'Category I',
                name: { name: 'Category I' },
              }),
            ],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, [
        'Treatment Category',
      ]);
      expect(result[0].attributes).toEqual({
        'Treatment Category': 'Category I',
      });
    });

    it('should return null for attribute not found in enrollment', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-7',
            states: [mockState('state-1', 'Test State', '2024-01-01', null)],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, [
        'Non-Existent Attribute',
      ]);
      expect(result[0].attributes).toEqual({ 'Non-Existent Attribute': null });
    });

    it('should handle multiple attributes with mix of found and not found', () => {
      const response: PatientProgramsResponse = {
        results: [
          mockEnrollment({
            uuid: 'enrollment-uuid-8',
            states: [mockState('state-1', 'Test State', '2024-01-01', null)],
            attributes: [
              mockAttribute('Registration Number', 'REG123'),
              mockAttribute('Category', {
                uuid: 'concept-1',
                display: 'Cat A',
                name: { name: 'Cat A' },
              }),
            ],
          }),
        ],
      };

      const result = createPatientProgramViewModal(response, [
        'Registration Number',
        'Category',
        'Missing Attribute',
      ]);

      expect(result[0].attributes).toEqual({
        'Registration Number': 'REG123',
        Category: 'Cat A',
        'Missing Attribute': null,
      });
    });
  });
});
