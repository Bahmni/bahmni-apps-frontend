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

      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: true,
          allergies: false,
          medications: false,
          observations: false,
          serviceRequests: {},
        },
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(payload);

      window.removeEventListener(CONSULTATION_SAVED_EVENT, eventListener);
    });

    it('should dispatch event with updatedConceptUuids when observations are updated', () => {
      const eventListener = jest.fn();
      window.addEventListener(CONSULTATION_SAVED_EVENT, eventListener);

      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          observations: true,
          serviceRequests: {},
        },
        updatedConceptUuids: ['concept-uuid-1', 'concept-uuid-2'],
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(payload);
      expect(event.detail.updatedConceptUuids).toEqual([
        'concept-uuid-1',
        'concept-uuid-2',
      ]);

      window.removeEventListener(CONSULTATION_SAVED_EVENT, eventListener);
    });

    it('should dispatch event with observations flag set to true', () => {
      const eventListener = jest.fn();
      window.addEventListener(CONSULTATION_SAVED_EVENT, eventListener);

      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          observations: true,
          serviceRequests: {},
        },
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.updatedResources.observations).toBe(true);

      window.removeEventListener(CONSULTATION_SAVED_EVENT, eventListener);
    });
  });

  describe('useSubscribeConsultationSaved', () => {
    it('should call callback when event is dispatched', () => {
      const callback = jest.fn();

      renderHook(() => useSubscribeConsultationSaved(callback, []));

      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: true,
          allergies: false,
          medications: false,
          observations: false,
          serviceRequests: {},
        },
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('should call callback with updatedConceptUuids when observations are updated', () => {
      const callback = jest.fn();

      renderHook(() => useSubscribeConsultationSaved(callback, []));

      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          observations: true,
          serviceRequests: {},
        },
        updatedConceptUuids: ['concept-uuid-1', 'concept-uuid-2'],
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(callback).toHaveBeenCalledWith(payload);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedConceptUuids: ['concept-uuid-1', 'concept-uuid-2'],
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
