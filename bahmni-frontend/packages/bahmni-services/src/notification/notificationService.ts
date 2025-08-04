import { Notification } from './notification';

/**
 * Interface for the notification service
 */
interface NotificationServiceInterface {
  showSuccess: (title: string, message: string, timeout?: number) => void;
  showInfo: (title: string, message: string, timeout?: number) => void;
  showWarning: (title: string, message: string, timeout?: number) => void;
  showError: (title: string, message: string, timeout?: number) => void;
}

/**
 * Creates a notification service that can be used outside of React components
 * (e.g., in API interceptors, services, etc.)
 */
export const createNotificationService = (): NotificationServiceInterface & {
  register: (
    callback: (notification: Omit<Notification, 'id'>) => void,
  ) => void;
} => {
  let addNotificationCallback:
    | ((notification: Omit<Notification, 'id'>) => void)
    | null = null;

  return {
    // Method to register the callback
    register: (callback: (notification: Omit<Notification, 'id'>) => void) => {
      addNotificationCallback = callback;
    },

    // Methods to show different types of notifications
    showSuccess: (title: string, message: string, timeout?: number) => {
      if (addNotificationCallback) {
        addNotificationCallback({ title, message, type: 'success', timeout });
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'Notification service not properly initialized. Call register() first.',
        );
      }
    },

    showInfo: (title: string, message: string, timeout?: number) => {
      if (addNotificationCallback) {
        addNotificationCallback({ title, message, type: 'info', timeout });
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'Notification service not properly initialized. Call register() first.',
        );
      }
    },

    showWarning: (title: string, message: string, timeout?: number) => {
      if (addNotificationCallback) {
        addNotificationCallback({ title, message, type: 'warning', timeout });
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'Notification service not properly initialized. Call register() first.',
        );
      }
    },

    showError: (title: string, message: string, timeout?: number) => {
      if (addNotificationCallback) {
        addNotificationCallback({ title, message, type: 'error', timeout });
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'Notification service not properly initialized. Call register() first.',
        );
      }
    },
  };
};

// Create a singleton instance
export const notificationService = createNotificationService();

export default notificationService;
