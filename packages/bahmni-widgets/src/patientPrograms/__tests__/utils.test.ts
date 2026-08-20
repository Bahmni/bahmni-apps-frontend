import { EpisodeOfCare } from 'fhir/r4';
import { ProgramField } from '../model';
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
      const fields: ProgramField[] = [
        { name: 'programName' },
        { name: 'customAttribute1' },
        { name: 'startDate' },
        { name: 'customAttribute2' },
        { name: 'outcome' },
      ];
      const result = extractProgramAttributeNames(fields);
      expect(result).toEqual(['customAttribute1', 'customAttribute2']);
    });

    it('should return all fields when none are known fields', () => {
      const fields: ProgramField[] = [
        { name: 'customAttr1' },
        { name: 'customAttr2' },
        { name: 'customAttr3' },
      ];
      const result = extractProgramAttributeNames(fields);
      expect(result).toEqual(['customAttr1', 'customAttr2', 'customAttr3']);
    });

    it('should return empty array when all fields are known fields', () => {
      const fields: ProgramField[] = [
        { name: 'programName' },
        { name: 'startDate' },
        { name: 'endDate' },
        { name: 'outcome' },
        { name: 'state' },
      ];
      const result = extractProgramAttributeNames(fields);
      expect(result).toEqual([]);
    });
  });

  describe('createProgramHeaders', () => {
    const mockT = (key: string) => key;

    it('should return empty array for empty fields', () => {
      const fields: ProgramField[] = [];
      const result = createProgramHeaders(fields, mockT);

      expect(result).toEqual([]);
    });

    it('should use translation function for headers', () => {
      const customT = (key: string) => `translated_${key}`;
      const fields: ProgramField[] = [{ name: 'state' }];
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
        const result = createProgramHeaders([{ name: field }], mockT);
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
        auditInfo: {
          creator: {
            uuid: 'user-1',
            display: 'Admin User',
            links: [],
          },
          dateCreated: startDate,
          changedBy: null,
        },
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

    it('should map enrollment with null dateCompleted to find state with null endDate', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-1',
        program: { name: 'HIV Program' },
        states: [
          mockState('state-1', 'Initial State', '2024-01-01', '2024-02-01'),
          mockState('state-2', 'Active State', '2024-02-01', null),
        ],
      });

      const result = createPatientProgramViewModal(enrollment, []);

      expect(result).toEqual({
        id: 'enrollment-uuid-1',
        uuid: 'enrollment-uuid-1',
        programName: 'HIV Program',
        dateEnrolled: '2024-01-01',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Active State',
        careManagerDisplay: null,
        attributes: {},
      });
    });

    it('should map enrollment with dateCompleted to find state with latest endDate', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-2',
        program: { name: 'TB Program' },
        dateCompleted: '2024-06-01',
        outcome: { name: { name: 'Cured' } },
        states: [
          mockState('state-1', 'Initial Treatment', '2024-01-01', '2024-03-01'),
          mockState(
            'state-2',
            'Continuation Phase',
            '2024-03-01',
            '2024-06-01',
          ),
          mockState('state-3', 'Temporary State', '2024-02-01', '2024-02-15'),
        ],
      });

      const result = createPatientProgramViewModal(enrollment, []);

      expect(result).toEqual({
        id: 'enrollment-uuid-2',
        uuid: 'enrollment-uuid-2',
        programName: 'TB Program',
        dateEnrolled: '2024-01-01',
        dateCompleted: '2024-06-01',
        outcomeName: 'Cured',
        outcomeDetails: null,
        currentStateName: 'Continuation Phase',
        careManagerDisplay: null,
        attributes: {},
      });
    });

    it('should handle undefined outcome and state with null name gracefully', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-3',
        program: { name: 'Diabetes Program' },
        dateCompleted: '2024-12-01',
        outcome: { name: null },
        states: [],
      });

      const result = createPatientProgramViewModal(enrollment, []);
      expect(result.outcomeName).toBeNull();
      expect(result.currentStateName).toBeNull();
    });

    it('should return empty attributes object when programAttributes is empty', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-4',
        states: [mockState('state-1', 'Test State', '2024-01-01', null)],
      });

      const result = createPatientProgramViewModal(enrollment, []);
      expect(result.attributes).toEqual({});
    });

    it('should extract outcomeDetails from outcome descriptions', () => {
      const enrollment = mockEnrollment({
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
        states: [mockState('state-1', 'Completed', '2024-01-01', '2024-12-01')],
      });

      const result = createPatientProgramViewModal(enrollment, []);
      expect(result.outcomeName).toBe('Treatment Completed');
      expect(result.outcomeDetails).toBe(
        'Patient completed treatment successfully',
      );
    });

    it('should return null for outcomeDetails when descriptions is empty', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-11',
        dateCompleted: '2024-12-01',
        outcome: {
          uuid: 'outcome-1',
          display: 'Treatment Completed',
          name: { name: 'Treatment Completed' },
          descriptions: [],
        },
        states: [mockState('state-1', 'Completed', '2024-01-01', '2024-12-01')],
      });

      const result = createPatientProgramViewModal(enrollment, []);
      expect(result.outcomeName).toBe('Treatment Completed');
      expect(result.outcomeDetails).toBeNull();
    });

    it('should extract attribute with string value', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-5',
        states: [mockState('state-1', 'Test State', '2024-01-01', null)],
        attributes: [mockAttribute('Registration Number', 'REG123456')],
      });

      const result = createPatientProgramViewModal(enrollment, [
        'Registration Number',
      ]);
      expect(result.attributes).toEqual({
        'Registration Number': 'REG123456',
      });
    });

    it('should extract attribute with Concept value', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-6',
        states: [mockState('state-1', 'Test State', '2024-01-01', null)],
        attributes: [
          mockAttribute('Treatment Category', {
            uuid: 'concept-1',
            display: 'Category I',
            name: { name: 'Category I' },
          }),
        ],
      });

      const result = createPatientProgramViewModal(enrollment, [
        'Treatment Category',
      ]);
      expect(result.attributes).toEqual({
        'Treatment Category': 'Category I',
      });
    });

    it('should return null for attribute not found in enrollment', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-7',
        states: [mockState('state-1', 'Test State', '2024-01-01', null)],
      });

      const result = createPatientProgramViewModal(enrollment, [
        'Non-Existent Attribute',
      ]);
      expect(result.attributes).toEqual({ 'Non-Existent Attribute': null });
    });

    it('should handle multiple attributes with mix of found and not found', () => {
      const enrollment = mockEnrollment({
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
      });

      const result = createPatientProgramViewModal(enrollment, [
        'Registration Number',
        'Category',
        'Missing Attribute',
      ]);

      expect(result.attributes).toEqual({
        'Registration Number': 'REG123',
        Category: 'Cat A',
        'Missing Attribute': null,
      });
    });

    it('should populate careManagerDisplay from the given episodeOfCare', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-9',
        episodeUuid: 'episode-9',
        states: [mockState('state-1', 'Test State', '2024-01-01', null)],
      });
      const episodeOfCare = {
        careManager: { display: 'Dr. Test' },
      } as EpisodeOfCare;

      const result = createPatientProgramViewModal(
        enrollment,
        [],
        episodeOfCare,
      );

      expect(result.careManagerDisplay).toBe('Dr. Test');
    });

    it('should return null careManagerDisplay when no episodeOfCare is provided', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-9',
        episodeUuid: 'episode-9',
        states: [mockState('state-1', 'Test State', '2024-01-01', null)],
      });

      const result = createPatientProgramViewModal(enrollment, []);

      expect(result.careManagerDisplay).toBeNull();
    });

    it('should return null careManagerDisplay when episodeOfCare has no careManager', () => {
      const enrollment = mockEnrollment({
        uuid: 'enrollment-uuid-9',
        episodeUuid: 'episode-9',
        states: [mockState('state-1', 'Test State', '2024-01-01', null)],
      });

      const result = createPatientProgramViewModal(
        enrollment,
        [],
        {} as EpisodeOfCare,
      );

      expect(result.careManagerDisplay).toBeNull();
    });
  });
});
