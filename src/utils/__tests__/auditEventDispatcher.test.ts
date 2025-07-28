import {
  dispatchAuditEvent,
  setupAuditEventListener,
  AuditEventPayload,
} from '../auditEventDispatcher';

describe('auditEventDispatcher', () => {
  // Mock window event methods
  const mockAddEventListener = jest.fn();
  const mockRemoveEventListener = jest.fn();
  const mockDispatchEvent = jest.fn();

  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window object with event methods
    Object.defineProperty(global, 'window', {
      value: {
        ...originalWindow,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: mockDispatchEvent,
      },
      writable: true,
    });
  });

  afterAll(() => {
    // Restore original window
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
    });
  });

  describe('dispatchAuditEvent', () => {
    it('should create and dispatch a custom event with the correct type and payload', () => {
      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: 'patient-123',
        messageParams: { testParam: 'testValue' },
        module: 'clinical',
      };

      dispatchAuditEvent(payload);

      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
      const dispatchedEvent = mockDispatchEvent.mock.calls[0][0];
      expect(dispatchedEvent).toBeInstanceOf(CustomEvent);
      expect(dispatchedEvent.type).toBe('bahmni-audit-log');
      expect(dispatchedEvent.detail).toEqual(payload);
    });

    it('should dispatch event with minimal payload', () => {
      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
      };

      dispatchAuditEvent(payload);

      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
      const dispatchedEvent = mockDispatchEvent.mock.calls[0][0];
      expect(dispatchedEvent.detail).toEqual(payload);
    });

    it('should dispatch event with complete payload including optional fields', () => {
      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: 'patient-456',
        messageParams: {
          encounterUuid: 'encounter-789',
          encounterType: 'consultation',
        },
        module: 'clinical-module',
      };

      dispatchAuditEvent(payload);

      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
      const dispatchedEvent = mockDispatchEvent.mock.calls[0][0];
      expect(dispatchedEvent.detail).toEqual(payload);
      expect(dispatchedEvent.detail.patientUuid).toBe('patient-456');
      expect(dispatchedEvent.detail.messageParams).toEqual({
        encounterUuid: 'encounter-789',
        encounterType: 'consultation',
      });
      expect(dispatchedEvent.detail.module).toBe('clinical-module');
    });

    it('should handle complex messageParams object', () => {
      const complexMessageParams = {
        encounterUuid: 'encounter-123',
        encounterType: 'consultation',
        nested: {
          property: 'value',
          array: [1, 2, 3],
        },
      };

      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
        messageParams: complexMessageParams,
      };

      dispatchAuditEvent(payload);

      const dispatchedEvent = mockDispatchEvent.mock.calls[0][0];
      expect(dispatchedEvent.detail.messageParams).toEqual(
        complexMessageParams,
      );
    });
  });

  describe('setupAuditEventListener', () => {
    it('should add event listener to window and return cleanup function', () => {
      const mockHandler = jest.fn();

      const cleanup = setupAuditEventListener(mockHandler);

      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'bahmni-audit-log',
        expect.any(Function),
      );
      expect(typeof cleanup).toBe('function');
    });

    it('should call handler with correct payload when event is dispatched', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: 'patient-123',
      };

      // Set up the listener
      setupAuditEventListener(mockHandler);

      // Get the listener function that was added
      const addedListener = mockAddEventListener.mock.calls[0][1];

      // Create a mock custom event
      const mockCustomEvent = {
        detail: payload,
      } as CustomEvent<AuditEventPayload>;

      addedListener(mockCustomEvent);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(payload);
    });

    it('should handle async handler properly', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
        patientUuid: 'patient-456',
        messageParams: { testParam: 'testValue' },
      };

      setupAuditEventListener(mockHandler);
      const addedListener = mockAddEventListener.mock.calls[0][1];

      const mockCustomEvent = {
        detail: payload,
      } as CustomEvent<AuditEventPayload>;

      await addedListener(mockCustomEvent);

      expect(mockHandler).toHaveBeenCalledWith(payload);
    });

    it('should remove event listener when cleanup function is called', () => {
      const mockHandler = jest.fn();

      const cleanup = setupAuditEventListener(mockHandler);
      cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'bahmni-audit-log',
        expect.any(Function),
      );
    });

    it('should remove the same listener that was added', () => {
      const mockHandler = jest.fn();

      const cleanup = setupAuditEventListener(mockHandler);
      cleanup();

      const addedListener = mockAddEventListener.mock.calls[0][1];
      const removedListener = mockRemoveEventListener.mock.calls[0][1];
      expect(addedListener).toBe(removedListener);
    });

    it('should handle multiple listeners independently', () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();

      const cleanup1 = setupAuditEventListener(mockHandler1);
      const cleanup2 = setupAuditEventListener(mockHandler2);

      expect(mockAddEventListener).toHaveBeenCalledTimes(2);

      cleanup1();

      expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);

      cleanup2();

      expect(mockRemoveEventListener).toHaveBeenCalledTimes(2);
    });

    it('should handle payload with all optional fields undefined', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: undefined,
        messageParams: undefined,
        module: undefined,
      };

      setupAuditEventListener(mockHandler);
      const addedListener = mockAddEventListener.mock.calls[0][1];

      const mockCustomEvent = {
        detail: payload,
      } as CustomEvent<AuditEventPayload>;

      await addedListener(mockCustomEvent);

      expect(mockHandler).toHaveBeenCalledWith(payload);
    });

    it('should call handler and not await the result (fire-and-forget)', () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const payload: AuditEventPayload = {
        eventType: 'EDIT_ENCOUNTER',
      };

      setupAuditEventListener(mockHandler);
      const addedListener = mockAddEventListener.mock.calls[0][1];

      const mockCustomEvent = {
        detail: payload,
      } as CustomEvent<AuditEventPayload>;

      const result = addedListener(mockCustomEvent);

      expect(result).toBeUndefined();
      expect(mockHandler).toHaveBeenCalledWith(payload);
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end: dispatch event and receive it in listener', () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const payload: AuditEventPayload = {
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        patientUuid: 'patient-integration-test',
        messageParams: { source: 'integration-test' },
      };

      // Store listener reference outside of mocks to avoid 'any' usage
      let storedListener: ((event: Event) => void) | null = null;

      // Reset mocks to use real behavior for this test
      mockAddEventListener.mockImplementation((eventType, listener) => {
        // Store the listener so we can call it
        storedListener = listener as (event: Event) => void;
      });

      mockDispatchEvent.mockImplementation((event) => {
        // Simulate event dispatching by calling the stored listener
        if (storedListener && event.type === 'bahmni-audit-log') {
          storedListener(event);
        }
      });

      const cleanup = setupAuditEventListener(mockHandler);
      dispatchAuditEvent(payload);

      expect(mockHandler).toHaveBeenCalledWith(payload);

      cleanup();
    });
  });
});
