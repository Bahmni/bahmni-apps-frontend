import { renderHook, act, waitFor } from '@testing-library/react';
import {
  getPatientDiagnoses,
  getFormattedError,
  useTranslation,
  Diagnosis,
} from 'bahmni-services';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useDiagnoses } from '../useDiagnoses';

jest.mock('bahmni-services');
jest.mock('../../hooks/usePatientUUID');

const mockedGetPatientDiagnoses = getPatientDiagnoses as jest.MockedFunction<
  typeof getPatientDiagnoses
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

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

describe('useDiagnoses hook', () => {
  const mockPatientUUID = 'patient-uuid-123';
  const mockTranslate = jest.fn((key: string) => key);

  const mockDiagnoses: Diagnosis[] = [
    {
      id: 'diagnosis-uuid-123',
      display: 'Hypertension',
      certainty: {
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
        display: 'Confirmed',
      },
      recordedDate: '2023-12-01T10:30:00.000+0000',
      recorder: 'Dr. John Doe',
    },
    {
      id: 'diagnosis-uuid-456',
      display: 'Diabetes',
      certainty: {
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
        display: 'Confirmed',
      },
      recordedDate: '2023-12-02T11:30:00.000+0000',
      recorder: 'Dr. Jane Smith',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
  });

  it('initializes with default values', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);

    const { result } = renderHook(() => useDiagnoses());

    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches diagnoses successfully', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses.mockResolvedValueOnce(mockDiagnoses);

    const { result } = renderHook(() => useDiagnoses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetPatientDiagnoses).toHaveBeenCalledWith(mockPatientUUID);
    expect(result.current.diagnoses).toEqual(mockDiagnoses);
    expect(result.current.error).toBeNull();
  });

  it.each([null, ''])(
    'handles invalid patient UUID: %s',
    async (invalidUUID) => {
      mockedUsePatientUUID.mockReturnValue(invalidUUID);

      const { result } = renderHook(() => useDiagnoses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedGetPatientDiagnoses).not.toHaveBeenCalled();
      expect(mockTranslate).toHaveBeenCalledWith('ERROR_INVALID_PATIENT_UUID');
      expect(result.current.diagnoses).toEqual([]);
      expect(result.current.error?.message).toBe('ERROR_INVALID_PATIENT_UUID');
    },
  );

  it('handles service error', async () => {
    const mockError = new Error('Service failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Service failed',
    });

    const { result } = renderHook(() => useDiagnoses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.diagnoses).toEqual([]);
  });

  it('handles non-Error rejection', async () => {
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Unexpected error',
    });

    const { result } = renderHook(() => useDiagnoses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Unexpected error');
    expect(result.current.diagnoses).toEqual([]);
  });

  it('refetches data when refetch is called', async () => {
    const updatedDiagnoses: Diagnosis[] = [
      {
        id: 'diagnosis-uuid-789',
        display: 'Asthma',
        certainty: {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed',
        },
        recordedDate: '2023-12-03T12:30:00.000+0000',
        recorder: 'Dr. Bob Wilson',
      },
    ];

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses
      .mockResolvedValueOnce(mockDiagnoses)
      .mockResolvedValueOnce(updatedDiagnoses);

    const { result } = renderHook(() => useDiagnoses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.diagnoses).toEqual(mockDiagnoses);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.diagnoses).toEqual(updatedDiagnoses);
    });

    expect(mockedGetPatientDiagnoses).toHaveBeenCalledTimes(2);
  });

  it('handles refetch error', async () => {
    const mockError = new Error('Refetch failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses
      .mockResolvedValueOnce(mockDiagnoses)
      .mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Refetch failed',
    });

    const { result } = renderHook(() => useDiagnoses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.diagnoses).toEqual(mockDiagnoses);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });

    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('updates when patient UUID changes', async () => {
    const newPatientUUID = 'patient-uuid-456';
    const newDiagnoses: Diagnosis[] = [
      {
        id: 'diagnosis-uuid-999',
        display: 'Migraine',
        certainty: {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed',
        },
        recordedDate: '2023-12-04T15:30:00.000+0000',
        recorder: 'Dr. Alice Brown',
      },
    ];

    mockedGetPatientDiagnoses
      .mockResolvedValueOnce(mockDiagnoses)
      .mockResolvedValueOnce(newDiagnoses);

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useDiagnoses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.diagnoses).toEqual(mockDiagnoses);

    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    await waitFor(() => {
      expect(result.current.diagnoses).toEqual(newDiagnoses);
    });

    expect(mockedGetPatientDiagnoses).toHaveBeenCalledWith(newPatientUUID);
  });

  it('clears error on successful refetch', async () => {
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockDiagnoses);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Initial error',
    });

    const { result } = renderHook(() => useDiagnoses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });

    expect(result.current.diagnoses).toEqual(mockDiagnoses);
  });
});
