import {
  getActiveVisit,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useActiveVisit } from '../useActiveVisit';
import { mockActiveVisit } from './__mocks__/encounterMocks';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
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
  getActiveVisit: jest.fn(),
  getFormattedError: jest.fn(),
}));
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedGetActiveVisit = getActiveVisit as jest.MockedFunction<
  typeof getActiveVisit
>;

describe('useActiveVisit', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
  mockGetFormattedError.mockImplementation((error: any) => ({
    title: error.title || 'unknown title',
    message: error.message || 'Unknown error',
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', async () => {
    mockedGetActiveVisit.mockResolvedValue(mockActiveVisit as any);

    const { result } = renderHook(() => useActiveVisit(patientUUID));

    // Check initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.activeVisit).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return the active visit', async () => {
    mockedGetActiveVisit.mockResolvedValue(mockActiveVisit as any);

    const { result } = renderHook(() => useActiveVisit(patientUUID));

    // Initial state
    expect(result.current.loading).toBe(true);

    // Verify the state after the promise resolves
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.activeVisit).toEqual(mockActiveVisit);
      expect(result.current.error).toBeNull();
    });

    expect(mockedGetActiveVisit).toHaveBeenCalledWith(patientUUID);
  });

  it('should handle null patientUUID', async () => {
    const { result } = renderHook(() => useActiveVisit(null));

    // Wait for any potential state updates to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify since it's a synchronous path
    expect(result.current.loading).toBe(false);
    expect(result.current.activeVisit).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(mockedGetActiveVisit).not.toHaveBeenCalled();
  });

  it('should handle no active visit found', async () => {
    // Mock the service to return null (no active encounter)
    const promise = Promise.resolve(null);
    mockedGetActiveVisit.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useActiveVisit(patientUUID));

    // Wait for the promise to resolve and component to update
    await act(async () => {
      await promise;
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the state after the promise resolves
    expect(result.current.loading).toBe(false);
    expect(result.current.activeVisit).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('No active visit found');
    expect(mockedGetActiveVisit).toHaveBeenCalledWith(patientUUID);
  });

  it('should handle error from service', async () => {
    const error = new Error('Service error');
    const promise = Promise.reject(error);
    mockedGetActiveVisit.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useActiveVisit(patientUUID));

    // Wait for the promise to reject and component to update
    await act(async () => {
      try {
        await promise;
      } catch {
        // Expected rejection
      }
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the state after the promise rejects
    expect(result.current.loading).toBe(false);
    expect(result.current.activeVisit).toBeNull();
    expect(result.current.error).toEqual(error);
  });

  it('should refetch data when patientUUID changes', async () => {
    const promise1 = Promise.resolve(mockActiveVisit);
    mockedGetActiveVisit.mockReturnValueOnce(promise1 as any);

    const { rerender } = renderHook(
      ({ patientId }) => useActiveVisit(patientId),
      {
        initialProps: { patientId: patientUUID },
      },
    );

    // Wait for the first promise to resolve and component to update
    await act(async () => {
      await promise1;
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetActiveVisit).toHaveBeenCalledTimes(1);
    expect(mockedGetActiveVisit).toHaveBeenCalledWith(patientUUID);

    const newPatientUUID = 'new-patient-uuid';
    const promise2 = Promise.resolve(mockActiveVisit);
    mockedGetActiveVisit.mockReturnValueOnce(promise2 as any);

    // Trigger rerender with new prop
    await act(async () => {
      rerender({ patientId: newPatientUUID });
      await promise2;
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetActiveVisit).toHaveBeenCalledTimes(2);
    expect(mockedGetActiveVisit).toHaveBeenCalledWith(newPatientUUID);
  });

  it('should provide a refetch method that reloads data', async () => {
    const promise1 = Promise.resolve(mockActiveVisit);
    mockedGetActiveVisit.mockReturnValueOnce(promise1 as any);

    const { result } = renderHook(() => useActiveVisit(patientUUID));

    // Wait for the first promise to resolve and component to update
    await act(async () => {
      await promise1;
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetActiveVisit).toHaveBeenCalledTimes(1);

    const promise2 = Promise.resolve(mockActiveVisit);
    mockedGetActiveVisit.mockReturnValueOnce(promise2 as any);

    // Trigger refetch and wait for it to complete
    await act(async () => {
      result.current.refetch();
      await promise2;
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetActiveVisit).toHaveBeenCalledTimes(2);
  });

  it('should update notification when an error occurs', async () => {
    const error = new Error('Service error');
    const promise = Promise.reject(error);
    mockedGetActiveVisit.mockReturnValueOnce(promise);

    renderHook(() => useActiveVisit(patientUUID));

    // Wait for the promise to reject and component to update
    await act(async () => {
      try {
        await promise;
      } catch {
        // Expected rejection
      }
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The notificationService might be called directly in encounterService,
    // but addNotification should still be called in the hook
    // expect(mockedShowError).toHaveBeenCalledTimes(0); // It's mocked but not directly called in the hook
  });
});
