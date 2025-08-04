import {
  createNotificationService,
  notificationService,
} from '../../../../../src/services/notificationService';

describe('notificationService', () => {
  describe('createNotificationService', () => {
    it('should create a notification service with the expected methods', () => {
      const service = createNotificationService();

      expect(service).toHaveProperty('register');
      expect(service).toHaveProperty('showSuccess');
      expect(service).toHaveProperty('showInfo');
      expect(service).toHaveProperty('showWarning');
      expect(service).toHaveProperty('showError');
    });

    it('should log an error when methods are called before registration', () => {
      const service = createNotificationService();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.showSuccess('Title', 'Message');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification service not properly initialized. Call register() first.',
      );

      consoleSpy.mockRestore();
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

    it('should log an error when showInfo is called before registration', () => {
      const service = createNotificationService();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.showInfo('Info Title', 'Info Message');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification service not properly initialized. Call register() first.',
      );

      consoleSpy.mockRestore();
    });

    it('should log an error when showWarning is called before registration', () => {
      const service = createNotificationService();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.showWarning('Warning Title', 'Warning Message');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification service not properly initialized. Call register() first.',
      );

      consoleSpy.mockRestore();
    });

    it('should log an error when showError is called before registration', () => {
      const service = createNotificationService();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.showError('Error Title', 'Error Message');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification service not properly initialized. Call register() first.',
      );

      consoleSpy.mockRestore();
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
