import { createContext } from 'react';
import { NotificationContextType } from '@types/notification';

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);
