import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { NotificationContainer } from '../NotificationContainer';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timeout?: number; // in milliseconds, undefined means no auto-dismiss
}

// Create a decorator to provide a better layout for the fixed-position component
const NotificationDecorator = (Story: React.ComponentType) => (
  <div
    style={{
      position: 'relative',
      height: '300px',
      width: '100%',
      border: '1px dashed #ccc',
      overflow: 'hidden',
      padding: '1rem',
    }}
  >
    <Story />
  </div>
);

const meta: Meta<typeof NotificationContainer> = {
  title: 'Components/Common/NotificationContainer',
  component: NotificationContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [NotificationDecorator],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NotificationContainer>;

// Mock notifications for stories
const successNotification: Notification = {
  id: 'success-1',
  title: 'Success',
  message: 'Operation completed successfully',
  type: 'success',
  timeout: 5000,
};

const errorNotification: Notification = {
  id: 'error-1',
  title: 'Error',
  message: 'Something went wrong',
  type: 'error',
};

const warningNotification: Notification = {
  id: 'warning-1',
  title: 'Warning',
  message: 'This action might have consequences',
  type: 'warning',
  timeout: 8000,
};

const infoNotification: Notification = {
  id: 'info-1',
  title: 'Information',
  message: 'Here is some important information',
  type: 'info',
  timeout: 5000,
};

// Mock handler for onClose
const handleClose = (id: string) => {
  console.log(`Notification with id ${id} closed`);
};

// Default story with all notification types
export const Default: Story = {
  args: {
    notifications: [
      successNotification,
      errorNotification,
      warningNotification,
      infoNotification,
    ],
    onClose: handleClose,
  },
};

// Individual notification type stories
export const Success: Story = {
  args: {
    notifications: [successNotification],
    onClose: handleClose,
  },
};

export const Error: Story = {
  args: {
    notifications: [errorNotification],
    onClose: handleClose,
  },
};

export const Warning: Story = {
  args: {
    notifications: [warningNotification],
    onClose: handleClose,
  },
};

export const Info: Story = {
  args: {
    notifications: [infoNotification],
    onClose: handleClose,
  },
};

// Multiple notifications of the same type
export const MultipleSuccessNotifications: Story = {
  args: {
    notifications: [
      successNotification,
      {
        ...successNotification,
        id: 'success-2',
        title: 'Another Success',
        message: 'Another operation completed successfully',
      },
      {
        ...successNotification,
        id: 'success-3',
        title: 'Yet Another Success',
        message: 'Everything is working great!',
      },
    ],
    onClose: handleClose,
  },
};

// Empty notifications array
export const NoNotifications: Story = {
  args: {
    notifications: [],
    onClose: handleClose,
  },
};

// Long message notification
export const LongMessage: Story = {
  args: {
    notifications: [
      {
        ...infoNotification,
        id: 'long-message',
        message:
          'This is a very long message that should wrap to multiple lines. It contains a lot of text to demonstrate how the notification handles long content. The notification should still be readable and properly formatted.',
      },
    ],
    onClose: handleClose,
  },
};

// Notification with no timeout (persistent)
export const PersistentNotification: Story = {
  args: {
    notifications: [
      {
        ...warningNotification,
        id: 'persistent',
        title: 'Persistent Warning',
        message: 'This notification will not auto-dismiss',
        timeout: undefined,
      },
    ],
    onClose: handleClose,
  },
};
