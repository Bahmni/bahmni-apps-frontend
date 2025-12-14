import { get } from '../../api';
import { ProgramEnrollment } from '../model';
import {
  getPatientProgramEnrollments,
  getPatientPrograms,
  getCurrentProgramState,
  getEndDate,
  getProgramStates,
  formatProgramEnrollment,
} from '../programService';

// Mock dependencies
jest.mock('../../api');

const mockGet = get as jest.MockedFunction<typeof get>;

describe('programService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientProgramEnrollments', () => {
    it('should fetch and return program enrollments for a valid patient UUID', async () => {
      const mockEnrollments: ProgramEnrollment[] = [
        {
          uuid: 'enrollment-1',
          display: 'HIV Program',
          patient: { uuid: 'patient-123', display: 'John Doe' },
          program: {
            uuid: 'program-1',
            name: 'HIV Program',
            display: 'HIV Program',
          },
          dateEnrolled: '2023-01-01',
          dateCompleted: null,
          states: [],
          attributes: [],
        },
      ];

      mockGet.mockResolvedValue({ results: mockEnrollments });

      const result = await getPatientProgramEnrollments('patient-123');

      expect(result).toEqual(mockEnrollments);
      expect(mockGet).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmniprogramenrollment?patient=patient-123&v=full',
      );
    });

    it('should return empty array when no enrollments exist', async () => {
      mockGet.mockResolvedValue({ results: [] });

      const result = await getPatientProgramEnrollments('patient-456');

      expect(result).toEqual([]);
    });

    describe('getPatientPrograms', () => {
      it('should fetch and categorize patient programs', async () => {
        const mockEnrollments: ProgramEnrollment[] = [
          {
            uuid: 'enrollment-1',
            display: 'Active Program',
            patient: { uuid: 'patient-1', display: 'Patient 1' },
            program: { uuid: 'prog-1', name: 'Active', display: 'Active' },
            dateEnrolled: '2023-01-01',
            dateCompleted: null,
            states: [],
            attributes: [],
          },
          {
            uuid: 'enrollment-2',
            display: 'Ended Program',
            patient: { uuid: 'patient-1', display: 'Patient 1' },
            program: { uuid: 'prog-2', name: 'Ended', display: 'Ended' },
            dateEnrolled: '2022-01-01',
            dateCompleted: '2023-01-01',
            states: [],
            attributes: [],
          },
        ];

        mockGet.mockResolvedValue({ results: mockEnrollments });

        const result = await getPatientPrograms('patient-123');

        expect(result.activePrograms).toHaveLength(1);
        expect(result.endedPrograms).toHaveLength(1);
      });
    });

    describe('getCurrentProgramState', () => {
      it('should return the last state from states array', () => {
        const enrollment: ProgramEnrollment = {
          uuid: 'enrollment-1',
          display: 'Program',
          patient: { uuid: 'patient-1', display: 'Patient 1' },
          program: { uuid: 'prog-1', name: 'Program', display: 'Program' },
          dateEnrolled: '2023-01-01',
          dateCompleted: null,
          states: [
            {
              uuid: 'state-1',
              startDate: '2023-01-01',
              endDate: '2023-06-01',
              state: {
                uuid: 'state-concept-1',
                display: 'Initial',
                concept: {
                  uuid: 'concept-1',
                  display: 'Initial State',
                },
              },
            },
            {
              uuid: 'state-2',
              startDate: '2023-06-01',
              endDate: null,
              state: {
                uuid: 'state-concept-2',
                display: 'Current',
                concept: {
                  uuid: 'concept-2',
                  display: 'Current State',
                },
              },
            },
          ],
          attributes: [],
        };

        const result = getCurrentProgramState(enrollment);

        expect(result).toEqual(enrollment.states[1]);
      });

      it('should return null when states array is empty', () => {
        const enrollment: ProgramEnrollment = {
          uuid: 'enrollment-1',
          display: 'Program',
          patient: { uuid: 'patient-1', display: 'Patient 1' },
          program: { uuid: 'prog-1', name: 'Program', display: 'Program' },
          dateEnrolled: '2023-01-01',
          dateCompleted: null,
          states: [],
          attributes: [],
        };

        const result = getCurrentProgramState(enrollment);

        expect(result).toBeNull();
      });
    });

    describe('getEndDate', () => {
      it('should return dateCompleted when available', () => {
        const enrollment: ProgramEnrollment = {
          uuid: 'enrollment-1',
          display: 'Program',
          patient: { uuid: 'patient-1', display: 'Patient 1' },
          program: { uuid: 'prog-1', name: 'Program', display: 'Program' },
          dateEnrolled: '2023-01-01',
          dateCompleted: '2023-12-31',
          dateEnded: '2023-12-30',
          states: [],
          attributes: [],
        };

        expect(getEndDate(enrollment)).toBe('2023-12-31');
      });

      it('should return dateEnded when dateCompleted is null', () => {
        const enrollment: ProgramEnrollment = {
          uuid: 'enrollment-1',
          display: 'Program',
          patient: { uuid: 'patient-1', display: 'Patient 1' },
          program: { uuid: 'prog-1', name: 'Program', display: 'Program' },
          dateEnrolled: '2023-01-01',
          dateCompleted: null,
          dateEnded: '2023-12-30',
          states: [],
          attributes: [],
        };

        expect(getEndDate(enrollment)).toBe('2023-12-30');
      });

      it('should return null when both dates are null', () => {
        const enrollment: ProgramEnrollment = {
          uuid: 'enrollment-1',
          display: 'Program',
          patient: { uuid: 'patient-1', display: 'Patient 1' },
          program: { uuid: 'prog-1', name: 'Program', display: 'Program' },
          dateEnrolled: '2023-01-01',
          dateCompleted: null,
          states: [],
          attributes: [],
        };

        expect(getEndDate(enrollment)).toBeNull();
      });
    });

    describe('getProgramStates', () => {
      it('should return states array', () => {
        const mockStates = [
          {
            uuid: 'state-1',
            startDate: '2023-01-01',
            endDate: null,
            state: {
              uuid: 'state-concept-1',
              display: 'Active',
              concept: {
                uuid: 'concept-1',
                display: 'Active State',
              },
            },
          },
        ];

        const enrollment: ProgramEnrollment = {
          uuid: 'enrollment-1',
          display: 'Program',
          patient: { uuid: 'patient-1', display: 'Patient 1' },
          program: { uuid: 'prog-1', name: 'Program', display: 'Program' },
          dateEnrolled: '2023-01-01',
          dateCompleted: null,
          states: mockStates,
          attributes: [],
        };

        expect(getProgramStates(enrollment)).toEqual(mockStates);
      });

      it('should return empty array when states are not available', () => {
        const enrollment: ProgramEnrollment = {
          uuid: 'enrollment-1',
          display: 'Program',
          patient: { uuid: 'patient-1', display: 'Patient 1' },
          program: { uuid: 'prog-1', name: 'Program', display: 'Program' },
          dateEnrolled: '2023-01-01',
          dateCompleted: null,
          states: [],
          attributes: [],
        };

        expect(getProgramStates(enrollment)).toEqual([]);
      });
    });

    describe('formatProgramEnrollment', () => {
      it('should format enrollment with all fields', () => {
        const enrollment: ProgramEnrollment = {
          uuid: 'enrollment-1',
          display: 'HIV Program',
          patient: { uuid: 'patient-1', display: 'Patient 1' },
          program: {
            uuid: 'program-1',
            name: 'HIV Program',
            display: 'HIV Program',
          },
          dateEnrolled: '2023-01-01',
          dateCompleted: null,
          outcome: null,
          states: [
            {
              uuid: 'state-1',
              startDate: '2023-01-01',
              endDate: null,
              state: {
                uuid: 'state-concept-1',
                display: 'Active',
                concept: {
                  uuid: 'concept-1',
                  display: 'Active State',
                },
              },
            },
          ],
          attributes: [],
        };

        const result = formatProgramEnrollment(enrollment);

        expect(result).toEqual({
          uuid: 'enrollment-1',
          programName: 'HIV Program',
          programUUID: 'program-1',
          dateEnrolled: '2023-01-01',
          dateEnded: null,
          outcome: null,
          attributes: [],
          states: enrollment.states,
          currentState: enrollment.states[0],
          isActive: true,
        });
      });
    });
  });
});
