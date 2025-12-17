import { get } from '../../api';
import { ProgramEnrollment, PatientProgramsResponse } from '../model';
import { getPatientPrograms } from '../programService';

jest.mock('../../api');
describe('programService', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
  const mockEnrollments: ProgramEnrollment[] = [
    {
      uuid: 'enrollment-1',
      display: 'HIV Program',
      patient: {
        uuid: patientUUID,
        display: 'John Doe',
        identifiers: [
          {
            uuid: 'identifier-1',
            display: 'BAH123456',
            links: [],
          },
        ],
        person: {
          uuid: 'person-1',
          display: 'John Doe',
          gender: 'M',
          age: 35,
          birthdate: '1988-01-01',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-1',
            display: 'John Doe',
          },
          preferredAddress: null,
          attributes: [],
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.0',
        },
        voided: false,
        links: [],
        resourceVersion: '1.0',
      },
      program: {
        uuid: 'program-1',
        name: 'HIV Program',
        display: 'HIV Program',
        retired: false,
        concept: {
          uuid: 'concept-1',
          display: 'HIV Program Concept',
          links: [],
          resourceVersion: '1.0',
        },
        allWorkflows: [],
        links: [],
        resourceVersion: '1.0',
      },
      dateEnrolled: '2023-01-01',
      dateCompleted: null,
      location: null,
      voided: false,
      outcome: null,
      states: [],
      attributes: [],
      episodeUuid: 'episode-1',
      auditInfo: {
        creator: {
          uuid: 'user-1',
          display: 'Admin User',
          links: [],
        },
        dateCreated: '2023-01-01T10:00:00.000+0000',
        changedBy: null,
        dateChanged: null,
      },
      links: [],
      resourceVersion: '1.0',
    },
  ];
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
});
