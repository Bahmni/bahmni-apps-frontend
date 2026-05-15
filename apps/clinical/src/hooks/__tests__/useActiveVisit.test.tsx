import { getVisits, getFormattedError } from '@bahmni/services';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientVisit } from '../usePatientVisit';
import { mockActiveVisit, mockVisitBundle } from './__mocks__/encounterMocks';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      switch (key) {
        case 'ERROR_INVALID_PATIENT_UUID':
          return 'Invalid patient UUID';
        case 'ERROR_NO_ACTIVE_VISIT_FOUND':
          return 'No active visit found';
        default:
          return key;
      }
    },
  }),
  getVisits: jest.fn(),
  getFormattedError: jest.fn(),
}));

const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedGetVisits = getVisits as jest.MockedFunction<typeof getVisits>;

const allVisits = mockVisitBundle.entry.map((e) => e.resource);
// entry[2] has the latest period.start among ended visits (2025-03-24)
const mostRecentEndedVisit = mockVisitBundle.entry[2].resource;

describe('usePatientVisit', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  mockGetFormattedError.mockImplementation((error: any) => ({
    title: error.title ?? 'unknown title',
    message: error.message ?? 'Unknown error',
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', async () => {
    mockedGetVisits.mockResolvedValue(allVisits as any);

    const { result } = renderHook(() => usePatientVisit(patientUUID));

    expect(result.current.loading).toBe(true);
    expect(result.current.activeVisit).toBeNull();
    expect(result.current.lastVisit).toBeNull();
    expect(result.current.error).toBeNull();

    // Drain the pending promise so it doesn't leak into the next test's act() context
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should derive activeVisit when a visit without period.end exists', async () => {
    mockedGetVisits.mockResolvedValue(allVisits as any);

    const { result } = renderHook(() => usePatientVisit(patientUUID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeVisit).toEqual(mockActiveVisit);
    expect(result.current.lastVisit).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockedGetVisits).toHaveBeenCalledWith(patientUUID);
  });

  it('should derive lastVisit as the most recently ended visit when no active visit', async () => {
    const endedVisits = allVisits.filter((v: any) => v.period?.end);
    mockedGetVisits.mockResolvedValue(endedVisits as any);

    const { result } = renderHook(() => usePatientVisit(patientUUID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeVisit).toBeNull();
    expect(result.current.lastVisit).toEqual(mostRecentEndedVisit);
    expect(result.current.error?.message).toBe('No active visit found');
  });

  it('should set lastVisit to null when there are no visits at all', async () => {
    mockedGetVisits.mockResolvedValue([]);

    const { result } = renderHook(() => usePatientVisit(patientUUID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeVisit).toBeNull();
    expect(result.current.lastVisit).toBeNull();
    expect(result.current.error?.message).toBe('No active visit found');
  });

  it('should handle null patientUUID without calling the API', async () => {
    const { result } = renderHook(() => usePatientVisit(null));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.activeVisit).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(mockedGetVisits).not.toHaveBeenCalled();
  });

  it('should handle error from getVisits service', async () => {
    const error = new Error('Service error');
    mockedGetVisits.mockRejectedValueOnce(error);

    const { result } = renderHook(() => usePatientVisit(patientUUID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeVisit).toBeNull();
    expect(result.current.lastVisit).toBeNull();
    expect(result.current.error).toEqual(error);
  });

  it('should refetch data when patientUUID changes', async () => {
    const promise1 = Promise.resolve(allVisits);
    mockedGetVisits.mockReturnValueOnce(promise1 as any);

    const { rerender } = renderHook(
      ({ patientId }) => usePatientVisit(patientId),
      { initialProps: { patientId: patientUUID } },
    );

    await act(async () => {
      await promise1;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetVisits).toHaveBeenCalledTimes(1);
    expect(mockedGetVisits).toHaveBeenCalledWith(patientUUID);

    const newPatientUUID = 'new-patient-uuid';
    const promise2 = Promise.resolve(allVisits);
    mockedGetVisits.mockReturnValueOnce(promise2 as any);

    await act(async () => {
      rerender({ patientId: newPatientUUID });
      await promise2;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetVisits).toHaveBeenCalledTimes(2);
    expect(mockedGetVisits).toHaveBeenCalledWith(newPatientUUID);
  });

  it('should provide a refetch method that reloads data', async () => {
    const promise1 = Promise.resolve(allVisits);
    mockedGetVisits.mockReturnValueOnce(promise1 as any);

    const { result } = renderHook(() => usePatientVisit(patientUUID));

    await act(async () => {
      await promise1;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetVisits).toHaveBeenCalledTimes(1);

    const promise2 = Promise.resolve(allVisits);
    mockedGetVisits.mockReturnValueOnce(promise2 as any);

    await act(async () => {
      result.current.refetch();
      await promise2;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetVisits).toHaveBeenCalledTimes(2);
  });
});
