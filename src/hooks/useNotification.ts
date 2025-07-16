import { useContext } from 'react';
import { NotificationContext } from '@contexts/NotificationContext';
import { NotificationContextType } from '@types/notification';

/**
 * Custom hook to use the notification service
 * @returns {NotificationContextType} The notification context
 * @throws {Error} If used outside of a NotificationProvider
 */
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  }

  return context;
};

export default useNotification;
