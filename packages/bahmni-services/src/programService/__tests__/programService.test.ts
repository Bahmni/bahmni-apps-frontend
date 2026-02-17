import { get, post } from '../../api';
import { mockEnrollments, patientUUID } from '../__mocks__/mocks';
import { PROGRAM_DETAILS_URL, PATIENT_PROGRAMS_URL } from '../constants';
import { ProgramEnrollment, PatientProgramsResponse } from '../model';
import {
  extractAttributes,
  getCurrentStateName,
  getPatientPrograms,
  getProgramByUUID,
  updateProgramState,
} from '../programService';

jest.mock('../../api');

describe('programService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientProgramEnrollments', () => {
    it('should fetch and return program enrollments for a valid patient UUID', async () => {
      const mockResponse: PatientProgramsResponse = {
        results: mockEnrollments,
      };

      (get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getPatientPrograms(patientUUID);

      expect(result).toEqual(mockResponse);
      expect(get).toHaveBeenCalledWith(PATIENT_PROGRAMS_URL(patientUUID));
    });

    it('should return empty array when no enrollments exist', async () => {
      const mockResponse: PatientProgramsResponse = { results: [] };

      (get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getPatientPrograms(patientUUID);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProgramByUUID', () => {
    it('should fetch and return program enrollment for a valid program UUID', async () => {
      const programUUID = 'enrollment-1';
      const mockProgramEnrollment: ProgramEnrollment = mockEnrollments[0];

      (get as jest.Mock).mockResolvedValue(mockProgramEnrollment);

      const result = await getProgramByUUID(programUUID);

      expect(result).toEqual(mockProgramEnrollment);
      expect(get).toHaveBeenCalledWith(PROGRAM_DETAILS_URL(programUUID));
    });
  });

  describe('extractAttributes', () => {
    it('should extract return empty map if no attributes are provided', () => {
      const mockEnrollment: ProgramEnrollment = mockEnrollments[0];
      const result = extractAttributes(mockEnrollment, []);
      expect(result).toEqual({});
    });

    it('should extract attributes based on provided attribute names', () => {
      const mockEnrollment: ProgramEnrollment = {
        ...mockEnrollments[0],
      };

      const result = extractAttributes(mockEnrollment, [
        'ID_Number',
        'Patient Stage',
        'Treatment Date',
      ]);

      expect(result).toEqual({
        ID_Number: '123145',
        'Patient Stage': 'Initial Stage',
        'Treatment Date': '2026-02-04T00:00:00.000+0000',
      });
    });

    it('should return null if attribute does not exist for provided attribute names', () => {
      const mockEnrollment: ProgramEnrollment = {
        ...mockEnrollments[0],
      };

      const result = extractAttributes(mockEnrollment, [
        'Non_Existent_Attribute',
      ]);

      expect(result).toEqual({
        Non_Existent_Attribute: null,
      });
    });
  });

  describe('getCurrentStateName', () => {
    it('should return null if there are no states', () => {
      const mockEnrollment: ProgramEnrollment = {
        ...mockEnrollments[0],
        states: [],
      };

      const result = getCurrentStateName(mockEnrollment);
      expect(result).toBeNull();
    });

    it('should return the latest state name if the program is completed', () => {
      const mockEnrollment: ProgramEnrollment = mockEnrollments[2];

      const result = getCurrentStateName(mockEnrollment);
      expect(result).toBe('Phase de continuation');
    });

    it('should return the active state name if the program is not completed', () => {
      const mockEnrollment: ProgramEnrollment = mockEnrollments[1];

      const result = getCurrentStateName(mockEnrollment);
      expect(result).toBe('In Progress');
    });

    it('should return SHORT name when available', () => {
      const result = getCurrentStateName(mockEnrollments[1]);
      expect(result).toBe('In Progress');
    });

    it('should return FULLY_SPECIFIED name when SHORT not available', () => {
      const result = getCurrentStateName(mockEnrollments[2]);
      expect(result).toBe('Phase de continuation');
    });

    it('should fallback to display when names array is empty', () => {
      const result = getCurrentStateName(mockEnrollments[3]);
      expect(result).toBe('Initial Treatment');
    });
  });

  describe('updateProgramState', () => {
    it('should successfully update program state', async () => {
      const programEnrollmentUUID = 'enrollment-1';
      const stateConceptUUID = 'concept-state-1';
      const mockUpdatedEnrollment: ProgramEnrollment = {
        ...mockEnrollments[0],
        uuid: programEnrollmentUUID,
      };

      (post as jest.Mock).mockResolvedValue(mockUpdatedEnrollment);

      const result = await updateProgramState(
        programEnrollmentUUID,
        stateConceptUUID,
      );

      expect(result).toEqual(mockUpdatedEnrollment);
      expect(post).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/bahmniprogramenrollment/${programEnrollmentUUID}`,
        {
          uuid: programEnrollmentUUID,
          states: [
            {
              state: { uuid: stateConceptUUID },
            },
          ],
        },
      );
    });

    it('should call post with correct URL and body structure', async () => {
      const programEnrollmentUUID = 'enrollment-2';
      const stateConceptUUID = 'workflow-state-2';

      (post as jest.Mock).mockResolvedValue(mockEnrollments[1]);

      await updateProgramState(programEnrollmentUUID, stateConceptUUID);

      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/bahmniprogramenrollment/${programEnrollmentUUID}`,
        expect.objectContaining({
          uuid: programEnrollmentUUID,
          states: expect.arrayContaining([
            expect.objectContaining({
              state: { uuid: stateConceptUUID },
            }),
          ]),
        }),
      );
    });

    it('should handle API errors correctly', async () => {
      const programEnrollmentUUID = 'enrollment-1';
      const stateConceptUUID = 'invalid-state-uuid';
      const mockError = new Error('Failed to update program state');

      (post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        updateProgramState(programEnrollmentUUID, stateConceptUUID),
      ).rejects.toThrow('Failed to update program state');
    });
  });
});
