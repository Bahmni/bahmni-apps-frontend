import type { CDSCard } from '@bahmni/services';
import { renderHook } from '@testing-library/react';
import {
  dispatchCDSSCheck,
  dispatchCDSSResults,
  useCDSSCheckListener,
  useCDSSResultsListener,
  CDSS_CHECK_EVENT,
  CDSS_RESULTS_EVENT,
} from '..';
import type { CDSSCheckEventDetail, CDSSResultsEventDetail } from '../models';

describe('cdssEvents', () => {
  describe('dispatchCDSSCheck', () => {
    it.each<[CDSSCheckEventDetail, CDSSCheckEventDetail]>([
      [
        {
          controlKey: 'immunizationHistory',
          itemId: 'item-123',
          event: 'onLoad',
        },
        {
          controlKey: 'immunizationHistory',
          itemId: 'item-123',
          event: 'onLoad',
        },
      ],
      [
        {
          controlKey: 'medication',
          itemId: 'med-456',
          event: 'onSelect',
        },
        {
          controlKey: 'medication',
          itemId: 'med-456',
          event: 'onSelect',
        },
      ],
    ])('should dispatch event with payload %o', (payload, expected) => {
      const eventListener = jest.fn();
      globalThis.addEventListener(CDSS_CHECK_EVENT, eventListener);

      dispatchCDSSCheck(payload);

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(expected);

      globalThis.removeEventListener(CDSS_CHECK_EVENT, eventListener);
    });
  });

  describe('dispatchCDSSResults', () => {
    const mockCard: CDSCard = {
      summary: 'Test warning',
      indicator: 'warning',
      source: { label: 'Test' },
      suggestions: [],
    };

    const mockCriticalCard: CDSCard = {
      summary: 'Critical alert',
      indicator: 'critical',
      source: { label: 'Test' },
      suggestions: [],
    };

    it.each<[CDSSResultsEventDetail, CDSSResultsEventDetail]>([
      [
        {
          cards: [mockCard],
          triggerItemId: 'item-123',
          controlKey: 'immunizationHistory',
        },
        {
          cards: [mockCard],
          triggerItemId: 'item-123',
          controlKey: 'immunizationHistory',
        },
      ],
      [
        {
          cards: [mockCard, mockCriticalCard],
          triggerItemId: 'item-456',
          controlKey: 'medication',
        },
        {
          cards: [mockCard, mockCriticalCard],
          triggerItemId: 'item-456',
          controlKey: 'medication',
        },
      ],
      [
        {
          cards: [],
          triggerItemId: 'item-789',
          controlKey: 'immunizationAdministration',
        },
        {
          cards: [],
          triggerItemId: 'item-789',
          controlKey: 'immunizationAdministration',
        },
      ],
    ])('should dispatch event with payload %o', (payload, expected) => {
      const eventListener = jest.fn();
      globalThis.addEventListener(CDSS_RESULTS_EVENT, eventListener);

      dispatchCDSSResults(payload);

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(expected);

      globalThis.removeEventListener(CDSS_RESULTS_EVENT, eventListener);
    });
  });

  describe('useCDSSCheckListener', () => {
    it('should call callback when event is dispatched', () => {
      const callback = jest.fn();
      const payload: CDSSCheckEventDetail = {
        controlKey: 'immunizationHistory',
        itemId: 'item-123',
        event: 'onLoad',
      };

      renderHook(() => useCDSSCheckListener(callback));

      dispatchCDSSCheck(payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('should cleanup listener on unmount', () => {
      const callback = jest.fn();
      const removeEventListenerSpy = jest.spyOn(
        globalThis,
        'removeEventListener',
      );

      const { unmount } = renderHook(() => useCDSSCheckListener(callback));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        CDSS_CHECK_EVENT,
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('useCDSSResultsListener', () => {
    const mockCard: CDSCard = {
      summary: 'Test warning',
      indicator: 'warning',
      source: { label: 'Test' },
      suggestions: [],
    };

    it('should call callback when event is dispatched', () => {
      const callback = jest.fn();
      const payload: CDSSResultsEventDetail = {
        cards: [mockCard],
        triggerItemId: 'item-123',
        controlKey: 'immunizationHistory',
      };

      renderHook(() => useCDSSResultsListener(callback));

      dispatchCDSSResults(payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('should cleanup listener on unmount', () => {
      const callback = jest.fn();
      const removeEventListenerSpy = jest.spyOn(
        globalThis,
        'removeEventListener',
      );

      const { unmount } = renderHook(() => useCDSSResultsListener(callback));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        CDSS_RESULTS_EVENT,
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
