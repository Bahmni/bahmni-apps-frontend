import { get } from '../../api';
import { mockEnrollments, patientUUID } from '../__mocks__/mocks';
import { ProgramEnrollment, PatientProgramsResponse } from '../model';
import {
  extractAttributes,
  getCurrentStateName,
  getPatientPrograms,
  getProgramByUUID,
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
      expect(result).toBe('Recovery');
    });

    it('should return the active state name if the program is not completed', () => {
      const mockEnrollment: ProgramEnrollment = mockEnrollments[1];

      const result = getCurrentStateName(mockEnrollment);
      expect(result).toBe('Continuation Phase');
    });
  });
});
