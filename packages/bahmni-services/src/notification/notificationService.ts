import { Notification } from './models';

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
// Use a global storage for the callback to ensure it works across lazy-loaded bundles
declare global {
  interface Window {
    __bahmniNotificationCallback?: (
      notification: Omit<Notification, 'id'>,
    ) => void;
    __bahmniPendingNotifications?: Array<Omit<Notification, 'id'>>;
  }
}

export const createNotificationService = (): NotificationServiceInterface & {
  register: (
    callback: (notification: Omit<Notification, 'id'>) => void,
  ) => void;
} => {
  // Initialize global storage if not exists
  if (typeof window !== 'undefined') {
    window.__bahmniPendingNotifications =
      window.__bahmniPendingNotifications ?? [];
  }

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const callback =
      typeof window !== 'undefined'
        ? window.__bahmniNotificationCallback
        : null;

    if (callback) {
      callback(notification);
    } else {
      // Queue notifications until the callback is registered
      if (typeof window !== 'undefined') {
        window.__bahmniPendingNotifications =
          window.__bahmniPendingNotifications ?? [];
        window.__bahmniPendingNotifications.push(notification);
      }
    }
  };

  return {
    // Method to register the callback
    register: (callback: (notification: Omit<Notification, 'id'>) => void) => {
      if (typeof window !== 'undefined') {
        window.__bahmniNotificationCallback = callback;

        // Flush any pending notifications
        const pending = window.__bahmniPendingNotifications ?? [];
        while (pending.length > 0) {
          const notification = pending.shift();
          if (notification) {
            callback(notification);
          }
        }
      }
    },

    // Methods to show different types of notifications
    showSuccess: (title: string, message: string, timeout?: number) => {
      showNotification({ title, message, type: 'success', timeout });
    },

    showInfo: (title: string, message: string, timeout?: number) => {
      showNotification({ title, message, type: 'info', timeout });
    },

    showWarning: (title: string, message: string, timeout?: number) => {
      showNotification({ title, message, type: 'warning', timeout });
    },

    showError: (title: string, message: string, timeout?: number) => {
      showNotification({ title, message, type: 'error', timeout });
    },
  };
};

// Create a singleton instance
export const notificationService = createNotificationService();

export default notificationService;
