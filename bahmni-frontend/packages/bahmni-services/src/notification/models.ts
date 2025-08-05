export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timeout?: number; // in milliseconds, undefined means no auto-dismiss
}
