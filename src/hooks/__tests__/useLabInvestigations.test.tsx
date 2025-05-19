import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import useLabInvestigations from '../useLabInvestigations';
import { getPatientLabTestsByDate } from '@services/labInvestigationService';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { LabTestsByDate, LabTestStatus, LabTestPriority } from '../../types/labInvestigation';

// Mock dependencies
jest.mock('@services/labInvestigationService');
jest.mock('@hooks/usePatientUUID');

// Type the mocked functions
const mockedGetPatientLabTestsByDate = getPatientLabTestsByDate as jest.MockedFunction<
  typeof getPatientLabTestsByDate
>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

describe('useLabInvestigations', () => {
  // Mock state setters
  let mockSetLabInvestigations: jest.Mock;
  let mockSetFormattedLabTests: jest.Mock;
  let mockSetLoading: jest.Mock;

  // Mock lab tests data
  const mockLabTestsByDate: LabTestsByDate[] = [
    {
      date: '05/08/2025',
      rawDate: '2025-05-08T12:44:24+00:00',
      tests: [
        {
          id: 'aba2a637-05f5-44c6-9021-c5cd05548342',
          testName: 'CD8%',
          status: LabTestStatus.Normal,
          priority: LabTestPriority.Routine,
          orderedBy: 'Super Man',
          orderedDate: '2025-05-08T12:44:24+00:00',
          formattedDate: '05/08/2025',
          result: undefined,
        },
      ],
    },
    {
      date: '04/09/2025',
      rawDate: '2025-04-09T13:21:22+00:00',
      tests: [
        {
          id: '29e240ce-5a3d-4643-8d4b-ca5b4cbf665d',
          testName: 'Absolute eosinophil count test',
          status: LabTestStatus.Normal,
          priority: LabTestPriority.Routine,
          orderedBy: 'Super Man',
          orderedDate: '2025-04-09T13:21:22+00:00',
          formattedDate: '04/09/2025',
          result: undefined,
        },
        {
          id: 'e7eca932-1d6f-44a4-bd94-e1105860ab77',
          testName: 'Clotting Panel',
          status: LabTestStatus.Normal,
          priority: LabTestPriority.Routine,
          orderedBy: 'Super Man',
          orderedDate: '2025-04-09T13:21:22+00:00',
          formattedDate: '04/09/2025',
          result: undefined,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useState mock implementation
    mockSetLabInvestigations = jest.fn();
    mockSetFormattedLabTests = jest.fn();
    mockSetLoading = jest.fn();

    // Mock React hooks
    jest
      .spyOn(React, 'useState')
      .mockImplementationOnce(() => [[], mockSetLabInvestigations])
      .mockImplementationOnce(() => [[], mockSetFormattedLabTests])
      .mockImplementationOnce(() => [true, mockSetLoading]);

    let previousDeps: string | undefined;
    jest.spyOn(React, 'useEffect').mockImplementation((effect, deps) => {
      const depsString = JSON.stringify(deps);
      if (depsString !== previousDeps) {
        effect();
        previousDeps = depsString;
      }
    });
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should fetch lab investigations when a valid patientUUID is provided', async () => {
      // Arrange
      const patientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';
      mockedUsePatientUUID.mockReturnValue(patientUUID);
      mockedGetPatientLabTestsByDate.mockResolvedValueOnce(mockLabTestsByDate);

      // Act
      const { result } = renderHook(() => useLabInvestigations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetPatientLabTestsByDate).toHaveBeenCalledWith(patientUUID);
        expect(mockSetLabInvestigations).toHaveBeenCalledWith(mockLabTestsByDate);
        
        // Check that formattedLabTests is set correctly
        const allFormattedTests = mockLabTestsByDate.flatMap(dateGroup => dateGroup.tests);
        expect(mockSetFormattedLabTests).toHaveBeenCalledWith(allFormattedTests);
        
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });

      // Assert the returned values
      expect(result.current.labInvestigations).toEqual([]);
      expect(result.current.formattedLabTests).toEqual([]);
      expect(result.current.isLoading).toBe(true);
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle null patientUUID', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(null);

      // Act
      renderHook(() => useLabInvestigations());

      // Assert
      await waitFor(() => {
        expect(mockedGetPatientLabTestsByDate).not.toHaveBeenCalled();
        expect(mockSetFormattedLabTests).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle API call failure', async () => {
      // Arrange
      const patientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';
      mockedUsePatientUUID.mockReturnValue(patientUUID);
      const error = new Error('Network error');
      mockedGetPatientLabTestsByDate.mockRejectedValueOnce(error);

      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Act
      renderHook(() => useLabInvestigations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetPatientLabTestsByDate).toHaveBeenCalledWith(patientUUID);
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching lab investigations:',
          error
        );
        expect(mockSetFormattedLabTests).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('should handle empty lab tests array from API', async () => {
      // Arrange
      const patientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';
      mockedUsePatientUUID.mockReturnValue(patientUUID);
      mockedGetPatientLabTestsByDate.mockResolvedValueOnce([]);

      // Act
      renderHook(() => useLabInvestigations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetPatientLabTestsByDate).toHaveBeenCalledWith(patientUUID);
        expect(mockSetLabInvestigations).toHaveBeenCalledWith([]);
        expect(mockSetFormattedLabTests).toHaveBeenCalledWith([]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should cleanup properly on unmount', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue('58493859-63f7-48b6-bd0b-698d5a119a21');

      // Act & Assert
      const { unmount } = renderHook(() => useLabInvestigations());
      expect(() => unmount()).not.toThrow();
    });
  });
});
