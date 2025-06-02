import { renderHook, waitFor, act } from '@testing-library/react';
import useDiagnoses from '../useDiagnoses';
import * as diagnosisService from '@/services/diagnosisService';
import { mockFormattedDiagnoses, mockDiagnosesByDate } from '@/__mocks__/diagnosisMocks';
import { usePatientUUID } from '../usePatientUUID';

// Mock the dependencies
jest.mock('../usePatientUUID');
jest.mock('@/services/diagnosisService');

describe('useDiagnoses', () => {
  const mockPatientUUID = 'patient-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
  });

  it('should return loading state initially', () => {
    // Mock the service functions
    (diagnosisService.getDiagnoses as jest.Mock).mockResolvedValue([]);
    (diagnosisService.formatDiagnoses as jest.Mock).mockReturnValue([]);
    (diagnosisService.groupDiagnosesByDateAndRecorder as jest.Mock).mockReturnValue([]);

    const { result } = renderHook(() => useDiagnoses());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.diagnosesByDate).toEqual([]);
  });

  it('should fetch and format diagnoses when patientUUID is available', async () => {
    // Mock the service functions
    (diagnosisService.getDiagnoses as jest.Mock).mockResolvedValue([]);
    (diagnosisService.formatDiagnoses as jest.Mock).mockReturnValue(mockFormattedDiagnoses);
    (diagnosisService.groupDiagnosesByDateAndRecorder as jest.Mock).mockReturnValue(mockDiagnosesByDate);

    const { result } = renderHook(() => useDiagnoses());

    // Wait for the hook to finish fetching
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    // Check that the service functions were called
    expect(diagnosisService.getDiagnoses).toHaveBeenCalledWith(mockPatientUUID);
    expect(diagnosisService.formatDiagnoses).toHaveBeenCalled();
    expect(diagnosisService.groupDiagnosesByDateAndRecorder).toHaveBeenCalledWith(mockFormattedDiagnoses);

    // Check the final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.diagnoses).toEqual(mockFormattedDiagnoses);
    expect(result.current.diagnosesByDate).toEqual(mockDiagnosesByDate);
  });

  it('should handle errors', async () => {
    // Mock the service functions to throw an error
    (diagnosisService.getDiagnoses as jest.Mock).mockRejectedValue(new Error('Test error'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDiagnoses());

    // Wait for the hook to finish fetching
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    // Check the final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.diagnosesByDate).toEqual([]);
  });

  it('should not fetch when patientUUID is not available', async () => {
    // Mock patientUUID to be undefined
    (usePatientUUID as jest.Mock).mockReturnValue(undefined);

    const { result } = renderHook(() => useDiagnoses());

    // Wait for the hook to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    // Check that the service functions were not called
    expect(diagnosisService.getDiagnoses).not.toHaveBeenCalled();
    expect(diagnosisService.formatDiagnoses).not.toHaveBeenCalled();
    expect(diagnosisService.groupDiagnosesByDateAndRecorder).not.toHaveBeenCalled();

    // Check the final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.diagnosesByDate).toEqual([]);
  });
});
