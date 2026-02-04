import { get } from '../../api';
import { mockEnrollments, patientUUID } from '../__mocks__/mocks';
import { ProgramEnrollment, PatientProgramsResponse } from '../model';
import { getPatientPrograms, getProgramByUUID } from '../programService';

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
      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/bahmniprogramenrollment?patient=${patientUUID}&v=full`,
      );
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
      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/rest/v1/bahmniprogramenrollment/${programUUID}?v=full`,
      );
    });
  });
});
