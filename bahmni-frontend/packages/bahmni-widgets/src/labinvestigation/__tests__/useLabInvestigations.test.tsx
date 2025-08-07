import { renderHook, waitFor } from '@testing-library/react';
import {
  getPatientLabInvestigations,
  FormattedLabTest,
  LabTestPriority,
} from '@bahmni-frontend/bahmni-services';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import useLabInvestigations from '../useLabInvestigations';

jest.mock('@bahmni-frontend/bahmni-services');
jest.mock('../../hooks/usePatientUUID');

const mockedGetPatientLabInvestigations =
  getPatientLabInvestigations as jest.MockedFunction<
    typeof getPatientLabInvestigations
  >;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

describe('useLabInvestigations hook', () => {
  const mockPatientUUID = 'patient-uuid-123';

  const mockLabTests: FormattedLabTest[] = [
    {
      id: 'test-uuid-123',
      testName: 'Complete Blood Count',
      priority: LabTestPriority.routine,
      orderedBy: 'Dr. John Smith',
      orderedDate: '2025-01-15T10:30:00.000Z',
      formattedDate: '01/15/2025',
      result: undefined,
      testType: 'Panel',
    },
    {
      id: 'test-uuid-456',
      testName: 'Blood Glucose',
      priority: LabTestPriority.stat,
      orderedBy: 'Dr. Jane Doe',
      orderedDate: '2025-01-16T14:15:00.000Z',
      formattedDate: '01/16/2025',
      result: '95 mg/dL',
      testType: 'Single Test',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);

    const { result } = renderHook(() => useLabInvestigations());

    expect(result.current.labTests).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasError).toBe(false);
  });

  it('fetches lab investigations successfully', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientLabInvestigations.mockResolvedValueOnce(mockLabTests);

    const { result } = renderHook(() => useLabInvestigations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedGetPatientLabInvestigations).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(result.current.labTests).toEqual(mockLabTests);
    expect(result.current.hasError).toBe(false);
  });

  it.each([null, ''])(
    'handles invalid patient UUID: %s',
    async (invalidUUID) => {
      mockedUsePatientUUID.mockReturnValue(invalidUUID);

      const { result } = renderHook(() => useLabInvestigations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedGetPatientLabInvestigations).not.toHaveBeenCalled();
      expect(result.current.labTests).toEqual([]);
      expect(result.current.hasError).toBe(false);
    },
  );

  it('handles service error', async () => {
    const mockError = new Error('Service failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientLabInvestigations.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useLabInvestigations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedGetPatientLabInvestigations).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(result.current.hasError).toBe(true);
    expect(result.current.labTests).toEqual([]);
  });

  it('handles non-Error rejection', async () => {
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientLabInvestigations.mockRejectedValueOnce(nonErrorObject);

    const { result } = renderHook(() => useLabInvestigations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.labTests).toEqual([]);
  });

  it('handles empty lab tests array from API', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientLabInvestigations.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useLabInvestigations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedGetPatientLabInvestigations).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(result.current.labTests).toEqual([]);
    expect(result.current.hasError).toBe(false);
  });

  it('updates when patient UUID changes', async () => {
    const newPatientUUID = 'patient-uuid-456';
    const newLabTests: FormattedLabTest[] = [
      {
        id: 'test-uuid-789',
        testName: 'Lipid Panel',
        priority: LabTestPriority.routine,
        orderedBy: 'Dr. Bob Wilson',
        orderedDate: '2025-01-17T09:00:00.000Z',
        formattedDate: '01/17/2025',
        result: undefined,
        testType: 'Panel',
      },
    ];

    mockedGetPatientLabInvestigations
      .mockResolvedValueOnce(mockLabTests)
      .mockResolvedValueOnce(newLabTests);

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useLabInvestigations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.labTests).toEqual(mockLabTests);

    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    await waitFor(() => {
      expect(result.current.labTests).toEqual(newLabTests);
    });

    expect(mockedGetPatientLabInvestigations).toHaveBeenCalledWith(
      newPatientUUID,
    );
  });

  it('sets loading state correctly during fetch', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientLabInvestigations.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockLabTests), 100)),
    );

    const { result } = renderHook(() => useLabInvestigations());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.labTests).toEqual(mockLabTests);
  });

  it('resets error state on successful fetch after previous error', async () => {
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientLabInvestigations
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockLabTests);

    const { result, rerender } = renderHook(() => useLabInvestigations());

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.labTests).toEqual([]);

    mockedUsePatientUUID.mockReturnValue('different-patient-uuid');
    rerender();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.labTests).toEqual(mockLabTests);
    });
  });
});
