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

    it('returns Unknown for missing or invalid status', () => {
      const diagnosisWithoutStatus = {
        ...mockFhirDiagnoses[0],
        verificationStatus: {
          coding: []
        }
      };
      expect(mapDiagnosisCertainty(diagnosisWithoutStatus)).toBe(DiagnosisCertainty.Unknown);
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
      expect(formattedDiagnoses[0].note).toEqual(['Patient has a family history of diabetes.']);
    });

    it('handles errors and shows notifications', () => {
      // Mock an error being thrown
      const errorMock = new Error('Test error');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a mock implementation that throws an error
      const mockFormatDate = jest.fn().mockImplementation(() => {
        throw errorMock;
      });
      
      // Replace the real formatDate with our mock
      jest.mock('@/utils/date', () => ({
        formatDate: mockFormatDate,
      }));
      
      // Call the function that should now throw an error
      const result = formatDiagnoses([
        {
          ...mockFhirDiagnoses[0],
          recordedDate: 'invalid-date',
        },
      ]);
      
      // Check that the error was handled and notification was shown
      expect(utils.getFormattedError).toHaveBeenCalled();
      expect(notificationService.showError).toHaveBeenCalledWith('Error Title', 'Error Message');
      expect(result).toEqual([]);
    });
  });

  describe('groupDiagnosesByDateAndRecorder', () => {
    it('groups diagnoses by date and recorder correctly', () => {
      const groupedDiagnoses = groupDiagnosesByDateAndRecorder(mockFormattedDiagnoses);
      
      // Check that we have the right number of date groups
      expect(groupedDiagnoses.length).toBe(2); // Two dates: Jan 15 and Jan 10
      
      // Check the first date group (Jan 15)
      expect(groupedDiagnoses[0].date).toBe('Jan 15, 2025');
      expect(groupedDiagnoses[0].recorderGroups.length).toBe(1); // One recorder: Dr. Jane Smith
      expect(groupedDiagnoses[0].recorderGroups[0].recorder).toBe('Dr. Jane Smith');
      expect(groupedDiagnoses[0].recorderGroups[0].diagnoses.length).toBe(2); // Two diagnoses
      
      // Check the second date group (Jan 10)
      expect(groupedDiagnoses[1].date).toBe('Jan 10, 2025');
      expect(groupedDiagnoses[1].recorderGroups.length).toBe(1); // One recorder: Dr. Robert Johnson
      expect(groupedDiagnoses[1].recorderGroups[0].recorder).toBe('Dr. Robert Johnson');
      expect(groupedDiagnoses[1].recorderGroups[0].diagnoses.length).toBe(1); // One diagnosis
    });

    it('handles errors and shows notifications', () => {
      // Mock an error being thrown
      const errorMock = new Error('Test error');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a mock implementation that throws an error
      const mockMap = jest.spyOn(Array.prototype, 'forEach').mockImplementation(() => {
        throw errorMock;
      });
      
      // Call the function that should now throw an error
      const result = groupDiagnosesByDateAndRecorder(mockFormattedDiagnoses);
      
      // Check that the error was handled and notification was shown
      expect(utils.getFormattedError).toHaveBeenCalled();
      expect(notificationService.showError).toHaveBeenCalledWith('Error Title', 'Error Message');
      expect(result).toEqual([]);
      
      // Clean up
      mockMap.mockRestore();
    });
  });
});
