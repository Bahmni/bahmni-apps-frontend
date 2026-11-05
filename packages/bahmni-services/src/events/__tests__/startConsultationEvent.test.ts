import { renderHook } from '@testing-library/react';
import {
  CONSULTATION_START_EVENT,
  dispatchConsultationStart,
  useSubscribeConsultationStart,
  type ConsultationEventPayload,
} from '../startConsultationEvent';

describe('startConsultationEvent', () => {
  describe('dispatchConsultationStart', () => {
    it.each<[string, ConsultationEventPayload | undefined, unknown]>([
      [
        'context and action',
        {
          context: { encounterType: 'OPD' },
          action: { type: 'create', resourceType: 'Immunization' },
        },
        {
          context: { encounterType: 'OPD' },
          action: { type: 'create', resourceType: 'Immunization' },
        },
      ],
      ['an empty payload', {}, {}],
      ['no argument', undefined, {}],
    ])('dispatches the event with %s', (_, payload, expected) => {
      const listener = jest.fn();
      globalThis.addEventListener(CONSULTATION_START_EVENT, listener);

      dispatchConsultationStart(payload);

      expect(listener).toHaveBeenCalledTimes(1);
      expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual(
        expected,
      );

      globalThis.removeEventListener(CONSULTATION_START_EVENT, listener);
    });
  });

  describe('useSubscribeConsultationStart', () => {
    it('calls the callback with the dispatched payload', () => {
      const callback = jest.fn();
      const payload: ConsultationEventPayload = {
        context: { encounterType: 'OPD' },
      };

      renderHook(() => useSubscribeConsultationStart(callback));
      dispatchConsultationStart(payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('removes the listener on unmount', () => {
      const callback = jest.fn();
      const removeSpy = jest.spyOn(globalThis, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useSubscribeConsultationStart(callback),
      );
      unmount();

      expect(removeSpy).toHaveBeenCalledWith(
        CONSULTATION_START_EVENT,
        expect.any(Function),
      );
      removeSpy.mockRestore();
    });
  });
});
