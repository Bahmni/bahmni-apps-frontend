import {
  FhirLabTest,
  LabTestStatus,
  LabTestPriority,
} from '../../types/labInvestigation';
import { getFormattedError } from '../../utils/common';
import notificationService from '../notificationService';
import {
  mapLabTestStatus,
  mapLabTestPriority,
  getPatientLabTestsByDate,
} from '../labInvestigationService';
import * as api from '../api';

// Mock dependencies
jest.mock('../../utils/common');
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

  describe('mapLabTestStatus', () => {
    it('should map known status values correctly', () => {
      const pendingTest = { status: 'Pending' } as FhirLabTest;
      const abnormalTest = { status: 'Abnormal' } as FhirLabTest;
      const normalTest = { status: 'Normal' } as FhirLabTest;

      expect(mapLabTestStatus(pendingTest)).toBe(LabTestStatus.Pending);
      expect(mapLabTestStatus(abnormalTest)).toBe(LabTestStatus.Abnormal);
      expect(mapLabTestStatus(normalTest)).toBe(LabTestStatus.Normal);
    });

    it('should default to Normal for unknown, null, or undefined status', () => {
      const unknownTest = { status: 'Unknown' } as FhirLabTest;
      const nullTest = { status: null } as unknown as FhirLabTest;
      const undefinedTest = { status: undefined } as unknown as FhirLabTest;
      const emptyTest = {} as FhirLabTest;

      expect(mapLabTestStatus(unknownTest)).toBe(LabTestStatus.Normal);
      expect(mapLabTestStatus(nullTest)).toBe(LabTestStatus.Normal);
      expect(mapLabTestStatus(undefinedTest)).toBe(LabTestStatus.Normal);
      expect(mapLabTestStatus(emptyTest)).toBe(LabTestStatus.Normal);
    });
  });

  describe('mapLabTestPriority', () => {
    it('should map known priority values correctly', () => {
      const routineTest = { priority: 'routine' } as FhirLabTest;
      const statTest = { priority: 'stat' } as FhirLabTest;

      expect(mapLabTestPriority(routineTest)).toBe(LabTestPriority.routine);
      expect(mapLabTestPriority(statTest)).toBe(LabTestPriority.stat);
    });

    it('should default to routine for unknown, null, or undefined priority', () => {
      const unknownTest = { priority: 'unknown' } as FhirLabTest;
      const nullTest = { priority: null } as unknown as FhirLabTest;
      const undefinedTest = { priority: undefined } as unknown as FhirLabTest;
      const emptyTest = {} as FhirLabTest;

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
