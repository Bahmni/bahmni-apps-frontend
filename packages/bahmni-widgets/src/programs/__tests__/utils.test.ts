import { ProgramEnrollment } from '@bahmni/services';
import { ProgramStatus } from '../model';
import { createProgramViewModels } from '../utils';

describe('Program Utils', () => {
  const mockBaseProgram: ProgramEnrollment = {
    uuid: 'program-uuid-1',
    display: 'Test Program',
    patient: {
      uuid: 'patient-uuid',
      display: 'John Doe',
    },
    program: {
      uuid: 'program-type-uuid',
      name: 'HIV Program',
      display: 'HIV Program',
    },
    dateEnrolled: '2023-01-15T10:00:00.000Z',
    dateCompleted: null,
    states: [],
    attributes: [],
  };

  describe('createProgramViewModels', () => {
    it('should transform an array of program enrollments into view models', () => {
      const programs: ProgramEnrollment[] = [
        mockBaseProgram,
        {
          ...mockBaseProgram,
          uuid: 'program-uuid-2',
          program: {
            uuid: 'program-type-uuid-2',
            name: 'TB Program',
            display: 'TB Program',
          },
        },
      ];

      const result = createProgramViewModels(programs);

      expect(result).toHaveLength(2);
      expect(result[0].programName).toBe('HIV Program');
      expect(result[1].programName).toBe('TB Program');
    });

    it('should return empty array for empty input', () => {
      const result = createProgramViewModels([]);
      expect(result).toEqual([]);
    });

    it('should handle program with all fields populated', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        dateCompleted: '2023-12-31T10:00:00.000Z',
        location: {
          uuid: 'location-uuid',
          display: 'Main Hospital',
        },
        states: [
          {
            uuid: 'state-uuid',
            startDate: '2023-01-15T10:00:00.000Z',
            endDate: null,
            state: {
              uuid: 'state-concept-uuid',
              display: 'Active Treatment',
              concept: {
                uuid: 'concept-uuid',
                display: 'Active Treatment',
              },
            },
          },
        ],
        attributes: [
          {
            uuid: 'attr-uuid',
            display: 'Reference Number',
            attributeType: {
              uuid: 'attr-type-uuid',
              display: 'Reference',
              description: 'Reference Number',
              retired: false,
              format: 'string',
            },
            value: 'REF-12345',
          },
        ],
      };

      const result = createProgramViewModels([program]);

      expect(result[0]).toMatchObject({
        id: 'program-uuid-1',
        uuid: 'program-uuid-1',
        programName: 'HIV Program',
        referenceNumber: 'REF-12345',
        destination: 'Main Hospital',
        dateEnrolled: '2023-01-15T10:00:00.000Z',
        dateEnded: '2023-12-31T10:00:00.000Z',
        outcome: 'Active Treatment',
        outcomeDetails: null,
        status: ProgramStatus.Completed,
        statusKey: 'PROGRAMS_STATUS_COMPLETED',
        statusClassName: 'completedStatus',
      });
    });

    it('should determine InProgress status for active program', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        dateEnrolled: '2023-01-15T10:00:00.000Z',
        dateCompleted: null,
      };

      const result = createProgramViewModels([program]);

      expect(result[0].status).toBe(ProgramStatus.InProgress);
      expect(result[0].statusKey).toBe('PROGRAMS_STATUS_IN_PROGRESS');
      expect(result[0].statusClassName).toBe('inProgressStatus');
    });

    it('should determine Completed status when dateCompleted is set', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        dateCompleted: '2023-12-31T10:00:00.000Z',
      };

      const result = createProgramViewModels([program]);

      expect(result[0].status).toBe(ProgramStatus.Completed);
      expect(result[0].statusKey).toBe('PROGRAMS_STATUS_COMPLETED');
      expect(result[0].statusClassName).toBe('completedStatus');
    });

    it('should determine Completed status when dateEnded is set', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        dateEnded: '2023-12-31T10:00:00.000Z',
      };

      const result = createProgramViewModels([program]);

      expect(result[0].status).toBe(ProgramStatus.Completed);
      expect(result[0].dateEnded).toBe('2023-12-31T10:00:00.000Z');
    });

    it('should extract outcome from current state (endDate = null)', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        states: [
          {
            uuid: 'state-1',
            startDate: '2023-01-15T10:00:00.000Z',
            endDate: '2023-06-15T10:00:00.000Z',
            state: {
              uuid: 'state-concept-1',
              display: 'Initial State',
              concept: {
                uuid: 'concept-1',
                display: 'Initial State',
              },
            },
          },
          {
            uuid: 'state-2',
            startDate: '2023-06-15T10:00:00.000Z',
            endDate: null,
            state: {
              uuid: 'state-concept-2',
              display: 'Current State',
              concept: {
                uuid: 'concept-2',
                display: 'Current State',
              },
            },
          },
        ],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].outcome).toBe('Current State');
    });

    it('should extract outcome from most recent state when all have endDate', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        states: [
          {
            uuid: 'state-1',
            startDate: '2023-01-15T10:00:00.000Z',
            endDate: '2023-06-15T10:00:00.000Z',
            state: {
              uuid: 'state-concept-1',
              display: 'Initial State',
              concept: {
                uuid: 'concept-1',
                display: 'Initial State',
              },
            },
          },
          {
            uuid: 'state-2',
            startDate: '2023-06-15T10:00:00.000Z',
            endDate: '2023-12-15T10:00:00.000Z',
            state: {
              uuid: 'state-concept-2',
              display: 'Most Recent State',
              concept: {
                uuid: 'concept-2',
                display: 'Most Recent State',
              },
            },
          },
        ],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].outcome).toBe('Most Recent State');
    });

    it('should return null outcome when no states exist', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        states: [],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].outcome).toBeNull();
    });

    it('should use current state start date as dateEnrolled when available', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        dateEnrolled: '2023-01-15T10:00:00.000Z',
        states: [
          {
            uuid: 'state-1',
            startDate: '2023-02-01T10:00:00.000Z',
            endDate: null,
            state: {
              uuid: 'state-concept-1',
              display: 'Current State',
              concept: {
                uuid: 'concept-1',
                display: 'Current State',
              },
            },
          },
        ],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].dateEnrolled).toBe('2023-02-01T10:00:00.000Z');
    });

    it('should extract reference number from first non-voided attribute with string value', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        attributes: [
          {
            uuid: 'attr-1',
            display: 'Voided Attribute',
            attributeType: {
              uuid: 'attr-type-1',
              display: 'Type 1',
              description: 'Description',
              retired: false,
              format: 'string',
            },
            value: 'VOIDED-REF',
            voided: true,
          },
          {
            uuid: 'attr-2',
            display: 'Valid Attribute',
            attributeType: {
              uuid: 'attr-type-2',
              display: 'Type 2',
              description: 'Description',
              retired: false,
              format: 'string',
            },
            value: 'REF-67890',
          },
        ],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].referenceNumber).toBe('REF-67890');
    });

    it('should extract reference number from attribute with Concept value', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        attributes: [
          {
            uuid: 'attr-1',
            display: 'Concept Attribute',
            attributeType: {
              uuid: 'attr-type-1',
              display: 'Type 1',
              description: 'Description',
              retired: false,
              format: 'concept',
            },
            value: {
              uuid: 'concept-uuid',
              display: 'Concept Reference',
            },
          },
        ],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].referenceNumber).toBe('Concept Reference');
    });

    it('should return empty string for reference number when no valid attributes', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        attributes: [],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].referenceNumber).toBe('');
    });

    it('should use program.display as program name when program.name is null', () => {
      const program: ProgramEnrollment = {
        uuid: 'program-uuid-1',
        display: 'Enrollment Display',
        patient: {
          uuid: 'patient-uuid',
          display: 'John Doe',
        },
        program: {
          uuid: 'program-type-uuid',
          display: 'Program Display',
          name: null as any,
        },
        dateEnrolled: '2023-01-15T10:00:00.000Z',
        dateCompleted: null,
        states: [],
        attributes: [],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].programName).toBe('Program Display');
    });

    it('should use program.display as program name when program.name is undefined', () => {
      const program: ProgramEnrollment = {
        uuid: 'program-uuid-1',
        display: 'Enrollment Display',
        patient: {
          uuid: 'patient-uuid',
          display: 'John Doe',
        },
        program: {
          uuid: 'program-type-uuid',
          display: 'Program Display',
          name: undefined as any,
        },
        dateEnrolled: '2023-01-15T10:00:00.000Z',
        dateCompleted: null,
        states: [],
        attributes: [],
      };

      const result = createProgramViewModels([program]);

      expect(result[0].programName).toBe('Program Display');
    });

    it('should handle null location', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
        location: null,
      };

      const result = createProgramViewModels([program]);

      expect(result[0].destination).toBeNull();
    });

    it('should handle undefined location', () => {
      const program: ProgramEnrollment = {
        ...mockBaseProgram,
      };

      const result = createProgramViewModels([program]);

      expect(result[0].destination).toBeNull();
    });
  });
});
