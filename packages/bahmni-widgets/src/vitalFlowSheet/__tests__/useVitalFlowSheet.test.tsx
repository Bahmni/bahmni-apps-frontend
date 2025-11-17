import {
  getVitalFlowSheetData,
  getFormattedError,
  VitalFlowSheetData,
} from '@bahmni/services';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import { useVitalFlowSheet } from '../useVitalFlowSheet';

jest.mock('@bahmni/services', () => ({
  getVitalFlowSheetData: jest.fn(),
  getFormattedError: jest.fn(),
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));
jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockedGetVitalFlowSheetData =
  getVitalFlowSheetData as jest.MockedFunction<typeof getVitalFlowSheetData>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

describe('useVitalFlowSheet hook', () => {
  const mockPatientUUID = 'patient-uuid-123';
  const mockAddNotification = jest.fn();
  const mockParams = {
    latestCount: 5,
    obsConcepts: ['Temperature', 'Blood Pressure'],
    groupBy: 'obstime',
  };

  const mockVitalFlowSheetData: VitalFlowSheetData = {
    tabularData: {
      '2024-01-01 10:00:00': {
        Temperature: { value: '36.5', abnormal: false },
        'Blood Pressure': { value: '120/80', abnormal: false },
      },
      '2024-01-02 10:00:00': {
        Temperature: { value: '37.2', abnormal: true },
        'Blood Pressure': { value: '130/85', abnormal: false },
      },
    },
    conceptDetails: [
      {
        name: 'Temperature',
        fullName: 'Temperature (C)',
        units: '°C',
        hiNormal: 37.5,
        lowNormal: 36.0,
        attributes: {},
      },
      {
        name: 'Blood Pressure',
        fullName: 'Blood Pressure (mmHg)',
        units: 'mmHg',
        hiNormal: 140,
        lowNormal: 90,
        attributes: {},
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
    } as any);

    // Add small delay to mocks to better simulate real async behavior
    mockedGetVitalFlowSheetData.mockImplementation(
      (patientUUID, latestCount, obsConcepts, groupBy) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockVitalFlowSheetData), 0);
        });
      },
    );
  });

  it('initializes with default values', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('fetches vital flow sheet data successfully', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData.mockResolvedValueOnce(mockVitalFlowSheetData);

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetVitalFlowSheetData).toHaveBeenCalledWith(
      mockPatientUUID,
      mockParams.latestCount,
      mockParams.obsConcepts,
      mockParams.groupBy,
    );
    expect(result.current.data).toEqual(mockVitalFlowSheetData);
    expect(result.current.error).toBeNull();
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it.each([null, ''])(
    'handles invalid patient UUID: %s',
    async (invalidUUID) => {
      mockedUsePatientUUID.mockReturnValue(invalidUUID);

      const { result } = renderHook(() => useVitalFlowSheet(mockParams));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedGetVitalFlowSheetData).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockAddNotification).not.toHaveBeenCalled();
    },
  );

  it('handles service error', async () => {
    const mockError = new Error('Service failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Service failed',
    });

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBeNull();
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Service failed',
    });
  });

  it('handles non-Error rejection', async () => {
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Unexpected error',
    });

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Unexpected error');
    expect(result.current.data).toBeNull();
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Unexpected error',
    });
  });

  it('refetches data when refetch is called', async () => {
    const updatedVitalFlowSheetData: VitalFlowSheetData = {
      tabularData: {
        '2024-01-03 10:00:00': {
          Temperature: { value: '36.8', abnormal: false },
          'Blood Pressure': { value: '125/82', abnormal: false },
        },
      },
      conceptDetails: [
        {
          name: 'Temperature',
          fullName: 'Temperature (C)',
          units: '°C',
          hiNormal: 37.5,
          lowNormal: 36.0,
          attributes: {},
        },
        {
          name: 'Blood Pressure',
          fullName: 'Blood Pressure (mmHg)',
          units: 'mmHg',
          hiNormal: 140,
          lowNormal: 90,
          attributes: {},
        },
      ],
    };

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData
      .mockResolvedValueOnce(mockVitalFlowSheetData)
      .mockResolvedValueOnce(updatedVitalFlowSheetData);

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockVitalFlowSheetData);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedVitalFlowSheetData);
    });

    expect(mockedGetVitalFlowSheetData).toHaveBeenCalledTimes(2);
  });

  it('handles refetch error', async () => {
    const mockError = new Error('Refetch failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData
      .mockResolvedValueOnce(mockVitalFlowSheetData)
      .mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Refetch failed',
    });

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockVitalFlowSheetData);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
      expect(result.current.loading).toBe(false);
    });

    // The hook doesn't clear data on error, it keeps the previous data
    expect(result.current.data).toEqual(mockVitalFlowSheetData);
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Refetch failed',
    });
  });

  it('updates when patient UUID changes', async () => {
    const newPatientUUID = 'patient-uuid-456';
    const newVitalFlowSheetData: VitalFlowSheetData = {
      tabularData: {
        '2024-01-04 10:00:00': {
          Temperature: { value: '37.0', abnormal: false },
        },
      },
      conceptDetails: [
        {
          name: 'Temperature',
          fullName: 'Temperature (C)',
          units: '°C',
          hiNormal: 37.5,
          lowNormal: 36.0,
          attributes: {},
        },
      ],
    };

    mockedGetVitalFlowSheetData
      .mockResolvedValueOnce(mockVitalFlowSheetData)
      .mockResolvedValueOnce(newVitalFlowSheetData);

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() =>
      useVitalFlowSheet(mockParams),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockVitalFlowSheetData);

    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    await waitFor(() => {
      expect(result.current.data).toEqual(newVitalFlowSheetData);
    });

    expect(mockedGetVitalFlowSheetData).toHaveBeenCalledWith(
      newPatientUUID,
      mockParams.latestCount,
      mockParams.obsConcepts,
      mockParams.groupBy,
    );
  });

  it('updates when params change', async () => {
    const newParams = {
      latestCount: 10,
      obsConcepts: ['Temperature', 'Heart Rate'],
      groupBy: 'encounter',
    };

    const newVitalFlowSheetData: VitalFlowSheetData = {
      tabularData: {
        '2024-01-05 10:00:00': {
          Temperature: { value: '36.9', abnormal: false },
          'Heart Rate': { value: '72', abnormal: false },
        },
      },
      conceptDetails: [
        {
          name: 'Temperature',
          fullName: 'Temperature (C)',
          units: '°C',
          hiNormal: 37.5,
          lowNormal: 36.0,
          attributes: {},
        },
        {
          name: 'Heart Rate',
          fullName: 'Heart Rate (bpm)',
          units: 'bpm',
          hiNormal: 100,
          lowNormal: 60,
          attributes: {},
        },
      ],
    };

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData
      .mockResolvedValueOnce(mockVitalFlowSheetData)
      .mockResolvedValueOnce(newVitalFlowSheetData);

    const { result, rerender } = renderHook(
      ({ params }) => useVitalFlowSheet(params),
      {
        initialProps: { params: mockParams },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockVitalFlowSheetData);

    rerender({ params: newParams });

    await waitFor(() => {
      expect(result.current.data).toEqual(newVitalFlowSheetData);
    });

    expect(mockedGetVitalFlowSheetData).toHaveBeenCalledWith(
      mockPatientUUID,
      newParams.latestCount,
      newParams.obsConcepts,
      newParams.groupBy,
    );
  });

  it('sets loading state correctly during fetch', async () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockVitalFlowSheetData), 100),
        ),
    );

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    // Initially loading should be true during initial fetch
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockVitalFlowSheetData);
  });

  it('clears error on successful refetch', async () => {
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockVitalFlowSheetData);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Initial error',
    });

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(mockError);
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockVitalFlowSheetData);
  });

  it('handles empty vital flow sheet data from API', async () => {
    const emptyVitalFlowSheetData: VitalFlowSheetData = {
      tabularData: {},
      conceptDetails: [],
    };

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetVitalFlowSheetData.mockResolvedValueOnce(emptyVitalFlowSheetData);

    const { result } = renderHook(() => useVitalFlowSheet(mockParams));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetVitalFlowSheetData).toHaveBeenCalledWith(
      mockPatientUUID,
      mockParams.latestCount,
      mockParams.obsConcepts,
      mockParams.groupBy,
    );
    expect(result.current.data).toEqual(emptyVitalFlowSheetData);
    expect(result.current.error).toBeNull();
  });
});
