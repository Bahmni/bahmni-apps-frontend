import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import {
  mockPatientUUID,
  mockFormattedRadiologyInvestigations,
  createMockRadiologyInvestigation,
} from '../__mocks__/mocks';
import {
  getPatientRadiologyInvestigations,
  RadiologyInvestigation,
  getFormattedError,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useRadiologyInvestigation } from '../useRadiologyInvestigation';

jest.mock('@bahmni-frontend/bahmni-services');
jest.mock('../../hooks/usePatientUUID');
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockedGetPatientRadiologyInvestigations =
  getPatientRadiologyInvestigations as jest.MockedFunction<
    typeof getPatientRadiologyInvestigations
  >;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('useRadiologyInvestigation hook', () => {
  const mockRadiologyInvestigations =
    mockFormattedRadiologyInvestigations.slice(0, 2);

  const mockTranslate = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should initialize with correct default values', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);

    const { result } = renderHook(() => useRadiologyInvestigation());

    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should fetch and return radiology investigations successfully', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations.mockResolvedValueOnce(
      mockRadiologyInvestigations,
    );

    const { result } = renderHook(() => useRadiologyInvestigation());

    expect(result.current.loading).toBe(true);
    expect(result.current.radiologyInvestigations).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyInvestigations,
    );
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors correctly', async () => {
    const mockError = new Error('Failed to fetch radiology investigations');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error Title',
      message: 'Failed to fetch radiology investigations',
    });

    const { result } = renderHook(() => useRadiologyInvestigation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.radiologyInvestigations).toEqual([]);
  });

  it('should refetch data when refetch is called', async () => {
    const updatedInvestigations: RadiologyInvestigation[] = [
      createMockRadiologyInvestigation('order-uuid-789', 'MRI', 'stat'),
    ];

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations
      .mockResolvedValueOnce(mockRadiologyInvestigations)
      .mockResolvedValueOnce(updatedInvestigations);

    const { result } = renderHook(() => useRadiologyInvestigation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyInvestigations,
    );

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.radiologyInvestigations).toEqual(
        updatedInvestigations,
      );
    });

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenCalledTimes(2);
  });

  it('should handle invalid patient UUID', async () => {
    mockedUsePatientUUID.mockReturnValue(null);

    const { result } = renderHook(() => useRadiologyInvestigation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetPatientRadiologyInvestigations).not.toHaveBeenCalled();
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.error?.message).toBe('ERROR_INVALID_PATIENT_UUID');
  });

  it('should handle empty string patient UUID', async () => {
    mockedUsePatientUUID.mockReturnValue('');

    const { result } = renderHook(() => useRadiologyInvestigation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetPatientRadiologyInvestigations).not.toHaveBeenCalled();
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.error?.message).toBe('ERROR_INVALID_PATIENT_UUID');
  });

  it('should handle non-Error objects thrown by API', async () => {
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations.mockRejectedValueOnce(
      nonErrorObject,
    );
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'An unexpected error occurred',
    });

    const { result } = renderHook(() => useRadiologyInvestigation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('An unexpected error occurred');
    expect(result.current.radiologyInvestigations).toEqual([]);
  });

  it('should refetch data when patient UUID changes', async () => {
    const newPatientUUID = 'patient-uuid-456';
    const newInvestigations: RadiologyInvestigation[] = [
      {
        id: 'order-uuid-999',
        testName: 'Ultrasound',
        priority: 'routine',
        orderedBy: 'Dr. Alice Brown',
        orderedDate: '2023-12-04T09:00:00.000Z',
      },
    ];

    mockedGetPatientRadiologyInvestigations
      .mockResolvedValueOnce(mockRadiologyInvestigations)
      .mockResolvedValueOnce(newInvestigations);

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useRadiologyInvestigation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyInvestigations,
    );

    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    await waitFor(() => {
      expect(result.current.radiologyInvestigations).toEqual(newInvestigations);
    });

    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenCalledTimes(2);
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenNthCalledWith(
      1,
      mockPatientUUID,
    );
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenNthCalledWith(
      2,
      newPatientUUID,
    );
  });

  it('should clear error state on successful refetch', async () => {
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockRadiologyInvestigations);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Initial error',
    });

    const { result } = renderHook(() => useRadiologyInvestigation());

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });

    expect(result.current.radiologyInvestigations).toEqual([]);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });

    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyInvestigations,
    );
    expect(result.current.loading).toBe(false);
  });
});
