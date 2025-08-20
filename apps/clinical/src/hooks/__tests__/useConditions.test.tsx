import {
  getFormattedConditions,
  type FormattedCondition,
  useTranslation,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import { usePatientUUID } from '@bahmni-frontend/bahmni-widgets';
import { renderHook, act } from '@testing-library/react';
import useConditions from '../useConditions';

jest.mock('@bahmni-frontend/bahmni-services');
jest.mock('@bahmni-frontend/bahmni-widgets');
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockedGetFormattedConditions =
  getFormattedConditions as jest.MockedFunction<typeof getFormattedConditions>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('useConditions hook', () => {
  const mockPatientUUID = 'patient-uuid-123';
  const mockTranslate = jest.fn((key: string) => key);

  const mockConditions: FormattedCondition[] = [
    {
      uuid: 'condition-1',
      conceptName: 'Hypertension',
      status: 'active',
      onsetDate: '2023-01-15',
      recordedDate: '2023-01-15',
    },
    {
      uuid: 'condition-2',
      conceptName: 'Diabetes Type 2',
      status: 'inactive',
      onsetDate: '2022-05-10',
      recordedDate: '2022-05-10',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate });
  });

  it('initializes with default values', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);

    const { result } = renderHook(() => useConditions());

    expect(result.current.conditions).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('fetches conditions successfully', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetFormattedConditions.mockResolvedValueOnce(mockConditions);

    const { result } = renderHook(() => useConditions());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetFormattedConditions).toHaveBeenCalledWith(mockPatientUUID);
    expect(result.current.conditions).toEqual(mockConditions);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles invalid patient UUID', async () => {
    mockedUsePatientUUID.mockReturnValue(null);

    const { result } = renderHook(() => useConditions());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetFormattedConditions).not.toHaveBeenCalled();
    expect(mockTranslate).toHaveBeenCalledWith('ERROR_INVALID_PATIENT_UUID');
    expect(result.current.conditions).toEqual([]);
    expect(result.current.error?.message).toBe('ERROR_INVALID_PATIENT_UUID');
    expect(result.current.loading).toBe(false);
  });

  it('handles service error', async () => {
    const mockError = new Error('Service failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetFormattedConditions.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Service failed',
    });

    const { result } = renderHook(() => useConditions());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.conditions).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('handles non-Error rejection', async () => {
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetFormattedConditions.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Unexpected error',
    });

    const { result } = renderHook(() => useConditions());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error?.message).toBe('Unexpected error');
    expect(result.current.conditions).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('refetches data when refetch is called', async () => {
    const updatedConditions: FormattedCondition[] = [
      {
        uuid: 'condition-3',
        conceptName: 'Asthma',
        status: 'active',
        onsetDate: '2023-06-01',
        recordedDate: '2023-06-01',
      },
    ];

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetFormattedConditions
      .mockResolvedValueOnce(mockConditions)
      .mockResolvedValueOnce(updatedConditions);

    const { result } = renderHook(() => useConditions());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.conditions).toEqual(mockConditions);

    await act(async () => {
      result.current.refetch();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.conditions).toEqual(updatedConditions);
    expect(mockedGetFormattedConditions).toHaveBeenCalledTimes(2);
  });

  it('updates when patient UUID changes', async () => {
    const newPatientUUID = 'patient-uuid-456';
    const newConditions: FormattedCondition[] = [
      {
        uuid: 'condition-4',
        conceptName: 'Migraine',
        status: 'active',
        onsetDate: '2023-03-20',
        recordedDate: '2023-03-20',
      },
    ];

    mockedGetFormattedConditions
      .mockResolvedValueOnce(mockConditions)
      .mockResolvedValueOnce(newConditions);

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useConditions());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.conditions).toEqual(mockConditions);

    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.conditions).toEqual(newConditions);
    expect(mockedGetFormattedConditions).toHaveBeenCalledWith(newPatientUUID);
  });

  it('clears error on successful refetch', async () => {
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetFormattedConditions
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockConditions);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Initial error',
    });

    const { result } = renderHook(() => useConditions());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe(mockError);

    await act(async () => {
      result.current.refetch();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBeNull();
    expect(result.current.conditions).toEqual(mockConditions);
  });
});
