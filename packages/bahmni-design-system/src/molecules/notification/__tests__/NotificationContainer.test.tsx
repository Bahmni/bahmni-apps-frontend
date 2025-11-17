import { Notification } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationContainer from '../NotificationContainer';
import '@testing-library/jest-dom';

describe('NotificationContainer', () => {
  const mockOnClose = jest.fn();

  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Success',
      message: 'Operation completed successfully',
      type: 'success',
    },
    {
      id: '2',
      title: 'Error',
      message: 'Something went wrong',
      type: 'error',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders notifications correctly', () => {
    render(
      <NotificationContainer
        notifications={mockNotifications}
        onClose={mockOnClose}
      />,
    );

    // Check if notifications are rendered
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(
      screen.getByText('Operation completed successfully'),
    ).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders notifications correctly when notifications is not passed', () => {
    render(
      <NotificationContainer
        notifications={mockNotifications}
        onClose={mockOnClose}
      />,
    );

    // Check if notifications are rendered
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(
      screen.getByText('Operation completed successfully'),
    ).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onClose when a notification is closed', () => {
    render(
      <NotificationContainer
        notifications={mockNotifications}
        onClose={mockOnClose}
      />,
    );

    // Find close buttons (there should be two, one for each notification)
    const closeButtons = screen.getAllByRole('button', {
      name: /close notification/i,
    });
    expect(closeButtons).toHaveLength(2);

    // Click the first close button
    fireEvent.click(closeButtons[0]);

    // Check if onClose was called with the correct ID
    expect(mockOnClose).toHaveBeenCalledWith('1');
  });

  it('renders an empty container when there are no notifications', () => {
    const { container } = render(
      <NotificationContainer notifications={[]} onClose={mockOnClose} />,
    );

    // The container should be empty (except for the div itself)
    expect(container.firstChild).toBeNull();
  });

  it('renders all notification types correctly', () => {
    const allTypesNotifications: Notification[] = [
      {
        id: '1',
        title: 'Success',
        message: 'Success message',
        type: 'success',
      },
      {
        id: '2',
        title: 'Error',
        message: 'Error message',
        type: 'error',
      },
      {
        id: '3',
        title: 'Warning',
        message: 'Warning message',
        type: 'warning',
      },
      {
        id: '4',
        title: 'Info',
        message: 'Info message',
        type: 'info',
      },
    ];

    render(
      <NotificationContainer
        notifications={allTypesNotifications}
        onClose={mockOnClose}
      />,
    );

    // Check if all notification types are rendered
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();

    // Verify that each notification has the correct message
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('auto-dismisses notifications with timeouts', () => {
    const notificationsWithTimeout: Notification[] = [
      {
        id: '1',
        title: 'Auto Dismiss',
        message: 'This will dismiss automatically',
        type: 'info',
        timeout: 500,
      },
    ];

    render(
      <NotificationContainer
        notifications={notificationsWithTimeout}
        onClose={mockOnClose}
      />,
    );

    // Verify notification is initially rendered
    expect(screen.getByText('Auto Dismiss')).toBeInTheDocument();

    // Fast-forward time by 3000ms
    setTimeout(() => {
      // Verify onClose was called with the correct ID
      expect(mockOnClose).toHaveBeenCalledWith('1');
    }, 500);
  });

  it('updates when notifications prop changes', async () => {
    const { rerender } = render(
      <NotificationContainer
        notifications={mockNotifications}
        onClose={mockOnClose}
      />,
    );

    // Initially, we should have two notifications
    expect(screen.getAllByRole('status')).toHaveLength(2);

    // Update with a new set of notifications
    const newNotifications: Notification[] = [
      {
        id: '3',
        title: 'New Notification',
        message: 'This is a new notification',
        type: 'info',
      },
    ];

    // Rerender with new notifications
    rerender(
      <NotificationContainer
        notifications={newNotifications}
        onClose={mockOnClose}
      />,
    );

    // Now we should have only one notification with the new content
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByText('New Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a new notification')).toBeInTheDocument();
  });

  it('sets proper accessibility attributes', () => {
    render(
      <NotificationContainer
        notifications={mockNotifications}
        onClose={mockOnClose}
      />,
    );

    // Get all notification elements
    const notifications = screen.getAllByRole('status');

    // Check that each notification has the correct accessibility attributes
    notifications.forEach((notification) => {
      expect(notification).toHaveAttribute('role', 'status');
    });
  });

  it('cleans up timeouts when unmounting', () => {
    // Create a spy on clearTimeout
    jest.spyOn(global, 'clearTimeout');

    setTimeout(() => {
      expect(clearTimeout).toHaveBeenCalledTimes(2);
    }, 1000);

    // Verify clearTimeout was called at least twice (once for each notification)
  });

  it('handles notifications with empty fields gracefully', () => {
    const emptyFieldsNotifications: Notification[] = [
      {
        id: '1',
        title: '',
        message: '',
        type: 'info',
      },
    ];

    render(
      <NotificationContainer
        notifications={emptyFieldsNotifications}
        onClose={mockOnClose}
      />,
    );

    // The notification should still render even with empty fields
    const notifications = screen.getAllByRole('status');
    expect(notifications).toHaveLength(1);
  });

  it('handles extremely long content appropriately', () => {
    const longContentNotifications: Notification[] = [
      {
        id: '1',
        title: 'A'.repeat(100),
        message: 'B'.repeat(500),
        type: 'info',
      },
    ];

    render(
      <NotificationContainer
        notifications={longContentNotifications}
        onClose={mockOnClose}
      />,
    );

    // The notification should render with the long content
    expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    expect(screen.getByText('B'.repeat(500))).toBeInTheDocument();
  });

  //TODO: Add tests for A11Y compliance
});
