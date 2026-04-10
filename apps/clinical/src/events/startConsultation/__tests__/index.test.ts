import { renderHook } from '@testing-library/react';
import {
  dispatchConsultationStart,
  useSubscribeConsultationStart,
  CONSULTATION_START_EVENT,
  type ConsultationStartEvent,
} from '..';

describe('startConsultation', () => {
  describe('dispatchConsultationStart', () => {
    it.each<[ConsultationStartEvent, ConsultationStartEvent]>([
      [{ encounterType: 'OPD' }, { encounterType: 'OPD' }],
      [{}, {}],
    ])('should dispatch event with payload %o', (payload, expected) => {
      const eventListener = jest.fn();
      globalThis.addEventListener(CONSULTATION_START_EVENT, eventListener);

      dispatchConsultationStart(payload);

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(expected);

      globalThis.removeEventListener(CONSULTATION_START_EVENT, eventListener);
    });
  });

  describe('useSubscribeConsultationStart', () => {
    it('should call callback when event is dispatched', () => {
      const callback = jest.fn();
      const payload: ConsultationStartEvent = { encounterType: 'OPD' };

      renderHook(() => useSubscribeConsultationStart(callback));

      dispatchConsultationStart(payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('should cleanup listener on unmount', () => {
      const callback = jest.fn();
      const removeEventListenerSpy = jest.spyOn(
        globalThis,
        'removeEventListener',
      );

      const { unmount } = renderHook(() =>
        useSubscribeConsultationStart(callback),
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        CONSULTATION_START_EVENT,
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
