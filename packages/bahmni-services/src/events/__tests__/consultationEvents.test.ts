import { renderHook } from '@testing-library/react';
import {
  dispatchConsultationSaved,
  useSubscribeConsultationSaved,
  CONSULTATION_SAVED_EVENT,
  type ConsultationSavedEventPayload,
} from '../consultationEvents';

describe('consultationEvents', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('dispatchConsultationSaved', () => {
    it('should dispatch event with correct payload', () => {
      const eventListener = jest.fn();
      window.addEventListener(CONSULTATION_SAVED_EVENT, eventListener);

      const updatedConcepts = new Map<string, string>();
      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: true,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
        updatedConcepts,
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(payload);

      window.removeEventListener(CONSULTATION_SAVED_EVENT, eventListener);
    });

    it('should dispatch event with updatedConcepts', () => {
      const eventListener = jest.fn();
      window.addEventListener(CONSULTATION_SAVED_EVENT, eventListener);

      const updatedConcepts = new Map<string, string>();
      updatedConcepts.set('concept-uuid-1', 'Concept 1');
      updatedConcepts.set('concept-uuid-2', 'Concept 2');

      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
        updatedConcepts,
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(payload);
      expect(event.detail.updatedConcepts).toEqual(updatedConcepts);
      expect(event.detail.updatedConcepts.get('concept-uuid-1')).toBe(
        'Concept 1',
      );
      expect(event.detail.updatedConcepts.get('concept-uuid-2')).toBe(
        'Concept 2',
      );

      window.removeEventListener(CONSULTATION_SAVED_EVENT, eventListener);
    });
  });

  describe('useSubscribeConsultationSaved', () => {
    it('should call callback when event is dispatched', () => {
      const callback = jest.fn();

      renderHook(() => useSubscribeConsultationSaved(callback, []));

      const updatedConcepts = new Map<string, string>();
      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: true,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
        updatedConcepts,
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('should call callback with updatedConcepts', () => {
      const callback = jest.fn();

      renderHook(() => useSubscribeConsultationSaved(callback, []));

      const updatedConcepts = new Map<string, string>();
      updatedConcepts.set('concept-uuid-1', 'Concept 1');
      updatedConcepts.set('concept-uuid-2', 'Concept 2');

      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
        updatedConcepts,
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(callback).toHaveBeenCalledWith(payload);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedConcepts: expect.any(Map),
        }),
      );
    });

    it('should cleanup listener on unmount', () => {
      const callback = jest.fn();
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useSubscribeConsultationSaved(callback, []),
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        CONSULTATION_SAVED_EVENT,
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
