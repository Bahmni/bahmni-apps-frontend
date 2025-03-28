import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { NotificationProvider } from '@providers/NotificationProvider';
import { useNotification } from '../useNotification';

// Wrapper component to provide the NotificationContext
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('useNotification', () => {
  it('should add a notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.addNotification({
        title: 'Test Title',
        message: 'Test Message',
        type: 'info',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Test Title');
    expect(result.current.notifications[0].message).toBe('Test Message');
    expect(result.current.notifications[0].type).toBe('info');
  });

  it('should remove a notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    let notificationId: string;

    act(() => {
      notificationId = result.current.addNotification({
        title: 'Test Title',
        message: 'Test Message',
        type: 'info',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.addNotification({
        title: 'Test Title 1',
        message: 'Test Message 1',
        type: 'info',
      });
      result.current.addNotification({
        title: 'Test Title 2',
        message: 'Test Message 2',
        type: 'success',
      });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearAllNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should throw an error when used outside of NotificationProvider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Render the hook outside of the NotificationProvider

    expect(() => {
      const { result } = renderHook(() => useNotification());
      // Access result.current to trigger the hook's execution
      console.log(result.current);
    }).toThrow('useNotification must be used within a NotificationProvider');

    // Restore console.error
    console.error = originalConsoleError;
  });
});
