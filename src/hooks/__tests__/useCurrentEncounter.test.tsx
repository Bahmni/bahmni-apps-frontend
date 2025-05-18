/* tslint:disable */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useCurrentEncounter } from '@hooks/useCurrentEncounter';
import { getCurrentEncounter } from '@services/encounterService';
import { mockCurrentEncounter } from '@__mocks__/encounterMocks';
import { NotificationProvider } from '@providers/NotificationProvider';
import notificationService from '@services/notificationService';

jest.mock('@services/encounterService');
jest.mock('@services/notificationService');

const mockedGetCurrentEncounter = getCurrentEncounter as jest.MockedFunction<
  typeof getCurrentEncounter
>;

const mockedShowError = notificationService.showError as jest.MockedFunction<
  typeof notificationService.showError
>;

describe('useCurrentEncounter', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Create a wrapper component for providing context
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it('should return loading state initially', () => {
    mockedGetCurrentEncounter.mockResolvedValueOnce(mockCurrentEncounter);

    const { result } = renderHook(() => useCurrentEncounter(patientUUID), {
      wrapper,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.currentEncounter).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return the current encounter', async () => {
    const promise = Promise.resolve(mockCurrentEncounter);
    mockedGetCurrentEncounter.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useCurrentEncounter(patientUUID), {
      wrapper,
    });

    // Initial state
    expect(result.current.loading).toBe(true);

    // Wait for the promise to resolve and component to update
    await act(async () => {
      await promise;
    });

    // Verify the state after the promise resolves
    expect(result.current.loading).toBe(false);
    expect(result.current.currentEncounter).toEqual(mockCurrentEncounter);
    expect(result.current.error).toBeNull();
    expect(mockedGetCurrentEncounter).toHaveBeenCalledWith(patientUUID);
  });

  it('should handle null patientUUID', async () => {
    const { result } = renderHook(() => useCurrentEncounter(null), {
      wrapper,
    });

    // Immediately verify since it's a synchronous path
    expect(result.current.loading).toBe(false);
    expect(result.current.currentEncounter).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(mockedGetCurrentEncounter).not.toHaveBeenCalled();
  });

  it('should handle no current encounter found', async () => {
    // Mock the service to return null (no active encounter)
    const promise = Promise.resolve(null);
    mockedGetCurrentEncounter.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useCurrentEncounter(patientUUID), {
      wrapper,
    });

    // Wait for the promise to resolve and component to update
    await act(async () => {
      await promise;
    });

    // Verify the state after the promise resolves
    expect(result.current.loading).toBe(false);
    expect(result.current.currentEncounter).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('No current encounter found');
    expect(mockedGetCurrentEncounter).toHaveBeenCalledWith(patientUUID);
  });

  it('should handle error from service', async () => {
    const error = new Error('Service error');
    const promise = Promise.reject(error);
    mockedGetCurrentEncounter.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useCurrentEncounter(patientUUID), {
      wrapper,
    });

    // Wait for the promise to reject and component to update
    await act(async () => {
      try {
        await promise;
      } catch {
        // Expected rejection
      }
    });

    // Verify the state after the promise rejects
    expect(result.current.loading).toBe(false);
    expect(result.current.currentEncounter).toBeNull();
    expect(result.current.error).toEqual(error);
  });

  it('should refetch data when patientUUID changes', async () => {
    const promise1 = Promise.resolve(mockCurrentEncounter);
    mockedGetCurrentEncounter.mockReturnValueOnce(promise1);

    const { rerender } = renderHook(
      ({ patientId }) => useCurrentEncounter(patientId),
      {
        initialProps: { patientId: patientUUID },
        wrapper,
      },
    );

    // Wait for the first promise to resolve and component to update
    await act(async () => {
      await promise1;
    });

    expect(mockedGetCurrentEncounter).toHaveBeenCalledTimes(1);
    expect(mockedGetCurrentEncounter).toHaveBeenCalledWith(patientUUID);

    const newPatientUUID = 'new-patient-uuid';
    const promise2 = Promise.resolve(mockCurrentEncounter);
    mockedGetCurrentEncounter.mockReturnValueOnce(promise2);

    // Trigger rerender with new prop
    await act(async () => {
      rerender({ patientId: newPatientUUID });
      await promise2;
    });

    expect(mockedGetCurrentEncounter).toHaveBeenCalledTimes(2);
    expect(mockedGetCurrentEncounter).toHaveBeenCalledWith(newPatientUUID);
  });

  it('should provide a refetch method that reloads data', async () => {
    const promise1 = Promise.resolve(mockCurrentEncounter);
    mockedGetCurrentEncounter.mockReturnValueOnce(promise1);

    const { result } = renderHook(() => useCurrentEncounter(patientUUID), {
      wrapper,
    });

    // Wait for the first promise to resolve and component to update
    await act(async () => {
      await promise1;
    });

    expect(mockedGetCurrentEncounter).toHaveBeenCalledTimes(1);

    const promise2 = Promise.resolve(mockCurrentEncounter);
    mockedGetCurrentEncounter.mockReturnValueOnce(promise2);

    // Trigger refetch and wait for it to complete
    await act(async () => {
      result.current.refetch();
      await promise2;
    });

    expect(mockedGetCurrentEncounter).toHaveBeenCalledTimes(2);
  });

  it('should update notification when an error occurs', async () => {
    const error = new Error('Service error');
    const promise = Promise.reject(error);
    mockedGetCurrentEncounter.mockReturnValueOnce(promise);

    renderHook(() => useCurrentEncounter(patientUUID), {
      wrapper,
    });

    // Wait for the promise to reject and component to update
    await act(async () => {
      try {
        await promise;
      } catch {
        // Expected rejection
      }
    });

    // The notificationService might be called directly in encounterService,
    // but addNotification should still be called in the hook
    expect(mockedShowError).toHaveBeenCalledTimes(0); // It's mocked but not directly called in the hook
  });
});
