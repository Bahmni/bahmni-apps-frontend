import { renderHook } from '@testing-library/react';
import {
  dispatchConsultationSaved,
  useConsultationSaved,
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
        },
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(payload);

      window.removeEventListener(CONSULTATION_SAVED_EVENT, eventListener);
    });
  });

  describe('useConsultationSaved', () => {
    it('should call callback when event is dispatched', () => {
      const callback = jest.fn();

      renderHook(() => useConsultationSaved(callback, []));

      const payload: ConsultationSavedEventPayload = {
        patientUUID: 'patient-123',
        updatedResources: { conditions: true, allergies: false },
      };

      dispatchConsultationSaved(payload);
      jest.runAllTimers();

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('should cleanup listener on unmount', () => {
      const callback = jest.fn();
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useConsultationSaved(callback, []));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        CONSULTATION_SAVED_EVENT,
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
