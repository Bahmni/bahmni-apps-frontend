import React from 'react';
import { InlineNotification } from '@carbon/react';
import { Notification } from '@types/notification';

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
      className="notification-container"
      style={{
        position: 'fixed',
        top: '4rem',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minWidth: '100%',
        alignItems: 'center',
      }}
    >
      {notifications.map(({ id, title, message, type }) => (
        <InlineNotification
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
