import { createContext } from 'react';
import { Notification } from '@bahmni-frontend/bahmni-services';

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);
