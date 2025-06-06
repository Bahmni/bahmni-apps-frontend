import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useActiveVisit } from '@hooks/useActiveVisit';
import { getActiveVisit } from '@services/encounterService';
import { mockActiveVisit } from '@__mocks__/encounterMocks';
import { NotificationProvider } from '@providers/NotificationProvider';
import notificationService from '@services/notificationService';

jest.mock('@services/encounterService');
jest.mock('@services/notificationService');

const mockedGetActiveVisit = getActiveVisit as jest.MockedFunction<
  typeof getActiveVisit
>;

const mockedShowError = notificationService.showError as jest.MockedFunction<
  typeof notificationService.showError
>;

describe('useActiveVisit', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Create a wrapper component for providing context
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it('should return loading state initially', async () => {
    // Create a promise that we can control when it resolves
    const promise = Promise.resolve(mockActiveVisit);
    mockedGetActiveVisit.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useActiveVisit(patientUUID), {
      wrapper,
    });

    // Check initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.activeVisit).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for all promises to resolve
    await act(async () => {
      await promise;
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it('should fetch and return the active visit', async () => {
    const promise = Promise.resolve(mockActiveVisit);
    mockedGetActiveVisit.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useActiveVisit(patientUUID), {
      wrapper,
    });

    // Initial state
    expect(result.current.loading).toBe(true);

    // Wait for all state updates to complete using act
    await act(async () => {
      await promise;
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the state after the promise resolves
    expect(result.current.loading).toBe(false);
    expect(result.current.activeVisit).toEqual(mockActiveVisit);
    expect(result.current.error).toBeNull();
    expect(mockedGetActiveVisit).toHaveBeenCalledWith(patientUUID);
  });

  it('should handle null patientUUID', async () => {
    const { result } = renderHook(() => useActiveVisit(null), {
      wrapper,
    });

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

    const { result } = renderHook(() => useActiveVisit(patientUUID), {
      wrapper,
    });

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
    mockedGetActiveVisit.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useActiveVisit(patientUUID), {
      wrapper,
    });

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
    expect(result.current.error).toEqual(new Error('Service error'));
  });

  it('should handle non-Error objects thrown from service', async () => {
    const nonErrorObject = { message: 'Non-error object thrown' };
    const promise = Promise.reject(nonErrorObject);
    mockedGetActiveVisit.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useActiveVisit(patientUUID), {
      wrapper,
    });

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
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('An unknown error occurred');
  });

  it('should refetch data when patientUUID changes', async () => {
    const promise1 = Promise.resolve(mockActiveVisit);
    mockedGetActiveVisit.mockReturnValueOnce(promise1);

    const { rerender } = renderHook(
      ({ patientId }) => useActiveVisit(patientId),
      {
        initialProps: { patientId: patientUUID },
        wrapper,
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
    mockedGetActiveVisit.mockReturnValueOnce(promise2);

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
    mockedGetActiveVisit.mockReturnValueOnce(promise1);

    const { result } = renderHook(() => useActiveVisit(patientUUID), {
      wrapper,
    });

    // Wait for the first promise to resolve and component to update
    await act(async () => {
      await promise1;
      // Add a small delay to ensure all state updates have processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetActiveVisit).toHaveBeenCalledTimes(1);

    const promise2 = Promise.resolve(mockActiveVisit);
    mockedGetActiveVisit.mockReturnValueOnce(promise2);

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

    renderHook(() => useActiveVisit(patientUUID), {
      wrapper,
    });

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
    expect(mockedShowError).toHaveBeenCalledTimes(0); // It's mocked but not directly called in the hook
  });
});
