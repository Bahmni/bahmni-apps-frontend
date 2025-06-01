import {
  mapDiagnosisCertainty,
  formatDiagnoses,
  groupDiagnosesByDateAndRecorder,
} from '../diagnosisService';
import { mockFhirDiagnoses, mockFormattedDiagnoses, mockDiagnosesByDate } from '@/__mocks__/diagnosisMocks';
import { DiagnosisCertainty } from '@/types/diagnosis';
import * as utils from '@/utils/common';
import notificationService from '../notificationService';

// Mock the notification service
jest.mock('../notificationService', () => ({
  showError: jest.fn(),
}));

// Mock the utils
jest.mock('@/utils/common', () => ({
  getFormattedError: jest.fn().mockReturnValue({
    title: 'Error Title',
    message: 'Error Message',
  }),
}));

describe('diagnosisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapDiagnosisCertainty', () => {
    it('maps Confirmed status correctly', () => {
      const diagnosis = mockFhirDiagnoses[0]; // Confirmed diagnosis
      expect(mapDiagnosisCertainty(diagnosis)).toBe(DiagnosisCertainty.Confirmed);
    });

    it('maps Provisional status correctly', () => {
      const diagnosis = mockFhirDiagnoses[1]; // Provisional diagnosis
      expect(mapDiagnosisCertainty(diagnosis)).toBe(DiagnosisCertainty.Provisional);
    });

    it('returns Provisional for missing or invalid status', () => {
      const diagnosisWithoutStatus = {
        ...mockFhirDiagnoses[0],
        verificationStatus: {
          coding: []
        }
      };
      expect(mapDiagnosisCertainty(diagnosisWithoutStatus)).toBe(DiagnosisCertainty.Provisional);
    });
  });

  describe('formatDiagnoses', () => {
    it('formats diagnoses correctly', () => {
      const formattedDiagnoses = formatDiagnoses(mockFhirDiagnoses);
      
      // Check that we have the right number of diagnoses
      expect(formattedDiagnoses.length).toBe(mockFhirDiagnoses.length);
      
      // Check that the first diagnosis is formatted correctly
      expect(formattedDiagnoses[0].id).toBe(mockFhirDiagnoses[0].id);
      expect(formattedDiagnoses[0].display).toBe(mockFhirDiagnoses[0].code.text);
      expect(formattedDiagnoses[0].certainty).toBe(DiagnosisCertainty.Confirmed);
      expect(formattedDiagnoses[0].recorder).toBe(mockFhirDiagnoses[0].recorder.display);
    });

    it('handles errors and shows notifications', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function with invalid data that will cause an error
      const result = formatDiagnoses([
        {
          ...mockFhirDiagnoses[0],
          code: null as any, // This will cause an error
        },
      ]);
      
      // Check that the error was handled and notification was shown
      expect(utils.getFormattedError).toHaveBeenCalled();
      expect(notificationService.showError).toHaveBeenCalledWith('Error Title', 'Error Message');
      expect(result).toEqual([]);
    });
  });

  describe('groupDiagnosesByDateAndRecorder', () => {
    it('groups diagnoses by date correctly', () => {
      const groupedDiagnoses = groupDiagnosesByDateAndRecorder(mockFormattedDiagnoses);
      
      // Check that we have the right number of date groups
      expect(groupedDiagnoses.length).toBe(2); // Two dates: Jan 15 and Jan 10
      
      // Check the first date group (Jan 15)
      expect(groupedDiagnoses[0].date).toBe('Jan 15, 2025');
      expect(groupedDiagnoses[0].diagnoses.length).toBe(2); // Two diagnoses
      expect(groupedDiagnoses[0].diagnoses[0].recorder).toBe('Dr. Jane Smith');
      expect(groupedDiagnoses[0].diagnoses[1].recorder).toBe('Dr. Jane Smith');
      
      // Check the second date group (Jan 10)
      expect(groupedDiagnoses[1].date).toBe('Jan 10, 2025');
      expect(groupedDiagnoses[1].diagnoses.length).toBe(1); // One diagnosis
      expect(groupedDiagnoses[1].diagnoses[0].recorder).toBe('Dr. Robert Johnson');
    });
  });
});
