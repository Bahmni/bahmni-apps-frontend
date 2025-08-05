import { createContext } from 'react';
import { NotificationContextType } from './notification';

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);
