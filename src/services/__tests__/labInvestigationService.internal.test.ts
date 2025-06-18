import { LabTestPriority } from '@types/labInvestigation';
import { getFormattedError } from '@utils/common';
import notificationService from '../notificationService';
import {
  mapLabTestPriority,
  getPatientLabTestsByDate,
} from '../labInvestigationService';
import * as api from '../api';
import { ServiceRequest } from 'fhir/r4';

// Mock dependencies
jest.mock('@utils/common');
jest.mock('../notificationService');
jest.mock('../api');

describe('labInvestigationService internal functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFormattedError as jest.Mock).mockReturnValue({
      title: 'Error',
      message: 'Something went wrong',
    });
  });

  describe('mapLabTestPriority', () => {
    it('should map known priority values correctly', () => {
      const routineTest = { priority: 'routine' } as ServiceRequest;
      const statTest = { priority: 'stat' } as ServiceRequest;

      expect(mapLabTestPriority(routineTest)).toBe(LabTestPriority.routine);
      expect(mapLabTestPriority(statTest)).toBe(LabTestPriority.stat);
    });

    it('should default to routine for unknown, null, or undefined priority', () => {
      const unknownTest = { priority: 'unknown' } as unknown as ServiceRequest;
      const nullTest = { priority: null } as unknown as ServiceRequest;
      const undefinedTest = {
        priority: undefined,
      } as unknown as ServiceRequest;
      const emptyTest = {} as ServiceRequest;

      expect(mapLabTestPriority(unknownTest)).toBe(LabTestPriority.routine);
      expect(mapLabTestPriority(nullTest)).toBe(LabTestPriority.routine);
      expect(mapLabTestPriority(undefinedTest)).toBe(LabTestPriority.routine);
      expect(mapLabTestPriority(emptyTest)).toBe(LabTestPriority.routine);
    });
  });

  describe('getPatientLabTestsByDate', () => {
    it('should handle internal errors in the try block and return an empty array', async () => {
      // Mock the API to throw an error
      jest.spyOn(api, 'get').mockImplementation(() => {
        throw new Error('API error');
      });

      const result = await getPatientLabTestsByDate('test-patient-uuid');

      expect(result).toEqual([]);
      expect(getFormattedError).toHaveBeenCalled();
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });
});
