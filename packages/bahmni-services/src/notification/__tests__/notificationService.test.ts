import {
  createNotificationService,
  notificationService,
} from '../notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    delete (window as any).__bahmniNotificationCallback;
    delete (window as any).__bahmniPendingNotifications;
  });

  describe('createNotificationService', () => {
    it('should create a notification service with the expected methods', () => {
      const service = createNotificationService();

      expect(service).toHaveProperty('register');
      expect(service).toHaveProperty('showSuccess');
      expect(service).toHaveProperty('showInfo');
      expect(service).toHaveProperty('showWarning');
      expect(service).toHaveProperty('showError');
    });

    it('should queue notifications when called before registration', () => {
      const service = createNotificationService();

      service.showSuccess('Title', 'Message');

      expect((window as any).__bahmniPendingNotifications).toHaveLength(1);
      expect((window as any).__bahmniPendingNotifications[0]).toEqual({
        title: 'Title',
        message: 'Message',
        type: 'success',
      });
    });

    it('should call the registered callback with the correct notification data', () => {
      const service = createNotificationService();
      const mockCallback = jest.fn();

      service.register(mockCallback);

      service.showSuccess('Success Title', 'Success Message', 3000);
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Success Title',
        message: 'Success Message',
        type: 'success',
        timeout: 3000,
      });

      service.showInfo('Info Title', 'Info Message');
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Info Title',
        message: 'Info Message',
        type: 'info',
      });

      service.showWarning('Warning Title', 'Warning Message');
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Warning Title',
        message: 'Warning Message',
        type: 'warning',
      });

      service.showError('Error Title', 'Error Message');
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Error Title',
        message: 'Error Message',
        type: 'error',
      });
    });

    it('should flush queued notifications when callback is registered', () => {
      const service = createNotificationService();
      const mockCallback = jest.fn();

      // Queue some notifications before registration
      service.showSuccess('Queued 1', 'Message 1');
      service.showInfo('Queued 2', 'Message 2');

      // Now register the callback
      service.register(mockCallback);

      // Both queued notifications should have been flushed
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Queued 1',
        message: 'Message 1',
        type: 'success',
      });
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Queued 2',
        message: 'Message 2',
        type: 'info',
      });
    });

    it('should store callback in window object', () => {
      const service = createNotificationService();
      const mockCallback = jest.fn();

      service.register(mockCallback);

      // Callback should be stored in window
      expect((window as any).__bahmniNotificationCallback).toBe(mockCallback);
    });
  });

  describe('notificationService singleton', () => {
    it('should be an instance of the notification service', () => {
      expect(notificationService).toHaveProperty('register');
      expect(notificationService).toHaveProperty('showSuccess');
      expect(notificationService).toHaveProperty('showInfo');
      expect(notificationService).toHaveProperty('showWarning');
      expect(notificationService).toHaveProperty('showError');
    });
  });
});
