import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { NotificationContainer } from '@components/common/notification/NotificationContainer';
import { NotificationContext } from '@contexts/NotificationContext';
import { Notification } from './notification';
import { generateId } from '@utils/common';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> =
  React.memo(({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timeoutsRef = useMemo(() => new Map<string, NodeJS.Timeout>(), []);

    const addNotification = useCallback(
      (notification: Omit<Notification, 'id'>): string => {
        const id = generateId();

        setNotifications((prev) => {
          const existingNotification = prev.find(
            (n) =>
              n.title === notification.title &&
              n.message === notification.message &&
              n.type === notification.type,
          );

          if (existingNotification) {
            return prev.map((n) =>
              n.id === existingNotification.id
                ? { ...n, timeout: notification.timeout }
                : n,
            );
          }
          return [...prev, { ...notification, id }];
        });

        return id;
      },
      [],
    );

    const removeNotification = useCallback(
      (id: string): void => {
        if (!notifications.some((n) => n.id === id)) return;

        setNotifications((prev) => prev.filter((n) => n.id !== id));

        if (timeoutsRef.has(id)) {
          clearTimeout(timeoutsRef.get(id));
          timeoutsRef.delete(id);
        }
      },
      [notifications, timeoutsRef],
    );

    const clearAllNotifications = useCallback((): void => {
      if (notifications.length === 0) return;

      timeoutsRef.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.clear();

      setNotifications([]);
    }, [notifications, timeoutsRef]);

    useEffect(() => {
      notifications.forEach(({ id, timeout }) => {
        if (timeout && timeout > 0 && !timeoutsRef.has(id)) {
          const timeoutId = setTimeout(() => removeNotification(id), timeout);
          timeoutsRef.set(id, timeoutId);
        }
      });

      return () => {
        timeoutsRef.forEach((timeout) => clearTimeout(timeout));
        timeoutsRef.clear();
      };
    }, [notifications, removeNotification, timeoutsRef]);

    return (
      <NotificationContext.Provider
        value={{
          notifications,
          addNotification,
          removeNotification,
          clearAllNotifications,
        }}
      >
        {children}
        <NotificationContainer
          notifications={notifications}
          onClose={removeNotification}
        />
      </NotificationContext.Provider>
    );
  });

NotificationProvider.displayName = 'NotificationProvider';
