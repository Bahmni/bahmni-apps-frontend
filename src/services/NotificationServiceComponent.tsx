import React, { useEffect } from 'react';
import { useNotification } from '@hooks/useNotification';
import { notificationService } from './notificationService';

/**
 * Component that connects the notification service to the notification context
 * This should be rendered inside the NotificationProvider
 */
export const NotificationServiceComponent: React.FC = () => {
  const { addNotification } = useNotification();

  useEffect(() => {
    // Register the addNotification callback with the notification service
    notificationService.register((notification) => {
      addNotification(notification);
    });

    // No cleanup needed as this is a singleton service
  }, [addNotification]);

  // This component doesn't render anything
  return null;
};

export default NotificationServiceComponent;
