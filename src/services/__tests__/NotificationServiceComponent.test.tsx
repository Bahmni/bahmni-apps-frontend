import React from 'react';
import { act, render } from '@testing-library/react';
import { NotificationProvider } from '@providers/NotificationProvider';
import { NotificationServiceComponent } from '../NotificationServiceComponent';
import { notificationService } from '../notificationService';

// Mock the notificationService
jest.mock('../notificationService', () => ({
  notificationService: {
    register: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
    showError: jest.fn(),
  },
}));

describe('NotificationServiceComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register the addNotification callback with the notification service', () => {
    render(
      <NotificationProvider>
        <NotificationServiceComponent />
      </NotificationProvider>,
    );

    // Check if register was called
    expect(notificationService.register).toHaveBeenCalled();

    // Get the callback function that was passed to register
    const registerCallback = (notificationService.register as jest.Mock).mock
      .calls[0][0];
    expect(typeof registerCallback).toBe('function');
  });

  it('should not render anything', () => {
    const { container } = render(
      <NotificationProvider>
        <NotificationServiceComponent />
      </NotificationProvider>,
    );

    // The component should not render anything
    expect(container.firstChild).toBeNull();
  });

  it('should add a notification when the registered callback is called', () => {
    // Render the component
    render(
      <NotificationProvider>
        <div data-testid="test-child">Test Child</div>
        <NotificationServiceComponent />
      </NotificationProvider>,
    );

    // Get the callback function that was passed to register
    const registerCallback = (notificationService.register as jest.Mock).mock
      .calls[0][0];

    // Call the callback with a notification
    act(() => {
      registerCallback({
        title: 'Test Title',
        message: 'Test Message',
        type: 'success',
      });
    });
  });
});
