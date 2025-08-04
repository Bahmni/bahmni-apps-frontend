import { ToastNotification } from '@carbon/react';
import React from 'react';
import { Notification } from '../../../../bahmni-frontend/packages/bahmni-services/src/notification/notification';
import * as styles from './styles/NotificationContainer.module.scss';

interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
}) => {
  if (!notifications.length) return null;

  return (
    <div
      className={styles.notificationContainer}
      aria-live="polite"
      role="region"
      aria-label="Notifications"
    >
      {notifications.map(({ id, title, message, type }) => (
        <ToastNotification
          key={id}
          title={title}
          subtitle={message}
          kind={type}
          onCloseButtonClick={() => {
            onClose(id);
          }}
          lowContrast
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
