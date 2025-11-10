import { render } from '@testing-library/react';
import { notificationService } from 'bahmni-services';
import { NotificationProvider } from '../NotificationProvider';
import { NotificationServiceComponent } from '../NotificationServiceComponent';

// Mock the notificationService
jest.mock('bahmni-services', () => ({
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
});
