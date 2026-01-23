import {
  getPatientMedications,
  getFormattedError,
  useTranslation,
  MedicationRequest,
  MedicationStatus,
} from '@bahmni/services';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useMedicationRequest } from '../useMedicationRequest';

jest.mock('@bahmni/services');
jest.mock('../../hooks/usePatientUUID');

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockedGetPatientMedications =
  getPatientMedications as jest.MockedFunction<typeof getPatientMedications>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('useMedicationRequest hook', () => {
  const mockPatientUUID = 'patient-uuid-123';
  const mockTranslate = jest.fn((key: string) => key);

  const mockMedications: MedicationRequest[] = [
    {
      id: 'medication-uuid-123',
      name: 'Aspirin 100mg',
      dose: {
        value: 100,
        unit: 'mg',
      },
      frequency: '1 / 1day',
      route: 'Oral',
      duration: {
        duration: 30,
        durationUnit: 'd',
      },
      status: MedicationStatus.Active,
      priority: '',
      startDate: '2023-12-01T10:30:00.000+0000',
      orderDate: '2023-12-01T09:30:00.000+0000',
      orderedBy: 'Dr. John Doe',
      instructions: 'Take with food',
      quantity: {
        value: 30,
        unit: 'tablets',
      },
      asNeeded: false,
      isImmediate: false,
    },
    {
      id: 'medication-uuid-456',
      name: 'Metformin 500mg',
      dose: {
        value: 500,
        unit: 'mg',
      },
      frequency: '2 / 1day',
      route: 'Oral',
      duration: {
        duration: 90,
        durationUnit: 'd',
      },
      status: 'completed',
      priority: '',
      startDate: '2023-11-01T10:30:00.000+0000',
      orderDate: '2023-11-01T09:30:00.000+0000',
      orderedBy: 'Dr. Jane Smith',
      instructions: 'Take after meals',
      quantity: {
        value: 180,
        unit: 'tablets',
      },
      asNeeded: false,
      isImmediate: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
  });

  it('initializes with default values', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);

    const { result } = renderHook(() => useMedicationRequest());

    expect(result.current.medications).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('fetches medications successfully', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientMedications.mockResolvedValueOnce(mockMedications);

    const { result } = renderHook(() => useMedicationRequest());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetPatientMedications).toHaveBeenCalledWith(
      mockPatientUUID,
      undefined,
      undefined,
    );
    expect(result.current.medications).toEqual(mockMedications);
    expect(result.current.error).toBeNull();
  });

  it.each([null, ''])(
    'handles invalid patient UUID: %s',
    async (invalidUUID) => {
      mockedUsePatientUUID.mockReturnValue(invalidUUID);

      const { result } = renderHook(() => useMedicationRequest());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedGetPatientMedications).not.toHaveBeenCalled();
      expect(mockTranslate).toHaveBeenCalledWith('ERROR_INVALID_PATIENT_UUID');
      expect(result.current.medications).toEqual([]);
      expect(result.current.error?.message).toBe('ERROR_INVALID_PATIENT_UUID');
    },
  );

  it('handles service error', async () => {
    const mockError = new Error('Service failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientMedications.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Service failed',
    });

    const { result } = renderHook(() => useMedicationRequest());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.medications).toEqual([]);
  });

  it('handles non-Error rejection', async () => {
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientMedications.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Unexpected error',
    });

    const { result } = renderHook(() => useMedicationRequest());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Unexpected error');
    expect(result.current.medications).toEqual([]);
  });

  it('refetches data when refetch is called', async () => {
    const updatedMedications: MedicationRequest[] = [
      {
        id: 'medication-uuid-789',
        name: 'Lisinopril 10mg',
        dose: {
          value: 10,
          unit: 'mg',
        },
        frequency: '1 / 1day',
        route: 'Oral',
        duration: {
          duration: 30,
          durationUnit: 'd',
        },
        status: 'active',
        priority: '',
        startDate: '2023-12-03T12:30:00.000+0000',
        orderDate: '2023-12-03T11:30:00.000+0000',
        orderedBy: 'Dr. Bob Wilson',
        instructions: 'Monitor blood pressure',
        quantity: {
          value: 30,
          unit: 'tablets',
        },
        asNeeded: false,
        isImmediate: false,
      },
    ];

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientMedications
      .mockResolvedValueOnce(mockMedications)
      .mockResolvedValueOnce(updatedMedications);

    const { result } = renderHook(() => useMedicationRequest());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications).toEqual(mockMedications);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.medications).toEqual(updatedMedications);
    });

    expect(mockedGetPatientMedications).toHaveBeenCalledTimes(2);
  });

  it('handles refetch error', async () => {
    const mockError = new Error('Refetch failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientMedications
      .mockResolvedValueOnce(mockMedications)
      .mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Refetch failed',
    });

    const { result } = renderHook(() => useMedicationRequest());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications).toEqual(mockMedications);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });

    expect(result.current.medications).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('updates when patient UUID changes', async () => {
    const newPatientUUID = 'patient-uuid-456';
    const newMedications: MedicationRequest[] = [
      {
        id: 'medication-uuid-999',
        name: 'Atorvastatin 20mg',
        dose: {
          value: 20,
          unit: 'mg',
        },
        frequency: '1 / 1day',
        route: 'Oral',
        duration: {
          duration: 90,
          durationUnit: 'd',
        },
        status: 'active',
        priority: '',
        startDate: '2023-12-04T15:30:00.000+0000',
        orderDate: '2023-12-04T14:30:00.000+0000',
        orderedBy: 'Dr. Alice Brown',
        instructions: 'Monitor liver function',
        quantity: {
          value: 90,
          unit: 'tablets',
        },
        asNeeded: false,
        isImmediate: false,
      },
    ];

    mockedGetPatientMedications
      .mockResolvedValueOnce(mockMedications)
      .mockResolvedValueOnce(newMedications);

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useMedicationRequest());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications).toEqual(mockMedications);

    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    await waitFor(() => {
      expect(result.current.medications).toEqual(newMedications);
    });

    expect(mockedGetPatientMedications).toHaveBeenCalledWith(
      newPatientUUID,
      undefined,
      undefined,
    );
  });

  it('clears error on successful refetch', async () => {
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientMedications
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockMedications);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Initial error',
    });

    const { result } = renderHook(() => useMedicationRequest());

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

    expect(result.current.medications).toEqual(mockMedications);
  });
});
