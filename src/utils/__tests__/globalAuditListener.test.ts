import { logAuditEvent } from '@services/auditLogService';
import {
  setupAuditEventListener,
  AuditEventPayload,
} from '../auditEventDispatcher';
import { initializeAuditListener } from '../globalAuditListener';

// Mock dependencies
jest.mock('../auditEventDispatcher', () => ({
  setupAuditEventListener: jest.fn(),
  AuditEventPayload: {},
}));

jest.mock('@services/auditLogService', () => ({
  logAuditEvent: jest.fn(),
}));

const mockSetupAuditEventListener =
  setupAuditEventListener as jest.MockedFunction<
    typeof setupAuditEventListener
  >;
const mockLogAuditEvent = logAuditEvent as jest.MockedFunction<
  typeof logAuditEvent
>;

describe('globalAuditListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeAuditListener', () => {
    it('should call setupAuditEventListener and return cleanup function', () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);

      const cleanup = initializeAuditListener();

      expect(mockSetupAuditEventListener).toHaveBeenCalledTimes(1);
      expect(mockSetupAuditEventListener).toHaveBeenCalledWith(
        expect.any(Function),
      );
      expect(cleanup).toBe(mockCleanup);
      expect(typeof cleanup).toBe('function');
    });

    it('should pass a handler function to setupAuditEventListener', () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);

      initializeAuditListener();

      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];
      expect(typeof passedHandler).toBe('function');
    });

    it('should handle audit events through the handler - complete payload', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({ logged: true });

      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: 'patient-123',
        messageParams: { testParam: 'testValue' },
        module: 'clinical-module',
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];
      await passedHandler(payload);

      expect(mockLogAuditEvent).toHaveBeenCalledTimes(1);
      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
        { testParam: 'testValue' },
        'clinical-module',
      );
    });

    it('should handle audit events with minimal payload', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({ logged: true });

      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];
      await passedHandler(payload);

      expect(mockLogAuditEvent).toHaveBeenCalledTimes(1);
      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        undefined,
        'EDIT_ENCOUNTER',
        undefined,
        undefined,
      );
    });

    it('should handle audit events with undefined optional fields', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({ logged: true });

      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: undefined,
        messageParams: undefined,
        module: undefined,
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];
      await passedHandler(payload);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        undefined,
        'VIEWED_CLINICAL_DASHBOARD',
        undefined,
        undefined,
      );
    });

    it('should handle audit events with only patientUuid', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({ logged: true });

      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
        patientUuid: 'patient-456',
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];
      await passedHandler(payload);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        'patient-456',
        'EDIT_ENCOUNTER',
        undefined,
        undefined,
      );
    });

    it('should handle audit events with complex messageParams', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({ logged: true });

      const complexMessageParams = {
        encounterUuid: 'encounter-789',
        encounterType: 'consultation',
        nested: {
          property: 'value',
          array: [1, 2, 3],
        },
        timestamp: '2023-01-01T10:00:00Z',
      };

      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
        patientUuid: 'patient-complex',
        messageParams: complexMessageParams,
        module: 'clinical',
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];
      await passedHandler(payload);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        'patient-complex',
        'EDIT_ENCOUNTER',
        complexMessageParams,
        'clinical',
      );
    });

    it('should handle logAuditEvent returning unsuccessful response', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({
        logged: false,
        error: 'Audit logging disabled',
      });

      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: 'patient-123',
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];

      await expect(passedHandler(payload)).resolves.toBeUndefined();
      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
        undefined,
        undefined,
      );
    });

    it('should handle logAuditEvent throwing an error', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      const testError = new Error('Network error');
      mockLogAuditEvent.mockRejectedValue(testError);

      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
        patientUuid: 'patient-error',
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];

      await expect(passedHandler(payload)).rejects.toThrow('Network error');
      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        'patient-error',
        'EDIT_ENCOUNTER',
        undefined,
        undefined,
      );
    });

    it('should handle multiple sequential audit events', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({ logged: true });

      const payload1: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: 'patient-1',
      };

      const payload2: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
        patientUuid: 'patient-2',
        messageParams: { encounterUuid: 'encounter-1' },
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];

      await passedHandler(payload1);
      await passedHandler(payload2);

      expect(mockLogAuditEvent).toHaveBeenCalledTimes(2);
      expect(mockLogAuditEvent).toHaveBeenNthCalledWith(
        1,
        'patient-1',
        'VIEWED_CLINICAL_DASHBOARD',
        undefined,
        undefined,
      );
      expect(mockLogAuditEvent).toHaveBeenNthCalledWith(
        2,
        'patient-2',
        'EDIT_ENCOUNTER',
        { encounterUuid: 'encounter-1' },
        undefined,
      );
    });

    it('should return the same cleanup function from setupAuditEventListener', () => {
      const mockCleanup1 = jest.fn();
      const mockCleanup2 = jest.fn();

      mockSetupAuditEventListener
        .mockReturnValueOnce(mockCleanup1)
        .mockReturnValueOnce(mockCleanup2);

      const cleanup1 = initializeAuditListener();
      const cleanup2 = initializeAuditListener();

      expect(cleanup1).toBe(mockCleanup1);
      expect(cleanup2).toBe(mockCleanup2);
      expect(cleanup1).not.toBe(cleanup2);
    });

    it('should call cleanup function without errors', () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);

      const cleanup = initializeAuditListener();
      cleanup();

      expect(mockCleanup).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledWith();
    });

    it('should handle empty string values in payload', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({ logged: true });

      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: '',
        messageParams: {},
        module: '',
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];
      await passedHandler(payload);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        '',
        'VIEWED_CLINICAL_DASHBOARD',
        {},
        '',
      );
    });

    it('should preserve payload data types when calling logAuditEvent', async () => {
      const mockCleanup = jest.fn();
      mockSetupAuditEventListener.mockReturnValue(mockCleanup);
      mockLogAuditEvent.mockResolvedValue({ logged: true });

      const messageParams = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        arrayValue: ['item1', 'item2'],
        objectValue: { nested: 'value' },
      };

      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
        patientUuid: 'patient-types',
        messageParams,
        module: 'test-module',
      };

      initializeAuditListener();
      const passedHandler = mockSetupAuditEventListener.mock.calls[0][0];
      await passedHandler(payload);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        'patient-types',
        'EDIT_ENCOUNTER',
        messageParams,
        'test-module',
      );

      const calledMessageParams = mockLogAuditEvent.mock.calls[0][2];
      expect(calledMessageParams).toBe(messageParams);
    });
  });

  describe('integration behavior', () => {
    it('should initialize listener only once per call', () => {
      initializeAuditListener();
      initializeAuditListener();

      expect(mockSetupAuditEventListener).toHaveBeenCalledTimes(2);
    });

    it('should work with setupAuditEventListener mock correctly', () => {
      let capturedHandler:
        | ((payload: AuditEventPayload) => Promise<void>)
        | null = null;

      mockSetupAuditEventListener.mockImplementation((handler) => {
        capturedHandler = handler;
        return jest.fn();
      });

      initializeAuditListener();

      expect(capturedHandler).not.toBeNull();
      expect(typeof capturedHandler).toBe('function');
    });
  });
});
