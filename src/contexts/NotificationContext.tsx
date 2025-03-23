import { createContext } from 'react';
import { Notification } from '@types/notification';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);
