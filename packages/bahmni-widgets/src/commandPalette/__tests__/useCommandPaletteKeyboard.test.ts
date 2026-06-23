import { renderHook, act } from '@testing-library/react';
import type { TriggerConfig } from '../models';
import { useCommandPaletteKeyboard } from '../useCommandPaletteKeyboard';

const dispatchKeyDown = (options: KeyboardEventInit) => {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, ...options }),
  );
};

describe('useCommandPaletteKeyboard', () => {
  const toggle = jest.fn();

  beforeEach(() => {
    toggle.mockClear();
  });

  describe('Escape key', () => {
    it('calls toggle when Escape is pressed and palette is open', () => {
      const trigger: TriggerConfig = { type: 'combination', keys: ['meta+k'] };
      renderHook(() => useCommandPaletteKeyboard(true, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'Escape' });
      });

      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('does not call toggle when Escape is pressed and palette is closed', () => {
      const trigger: TriggerConfig = { type: 'combination', keys: ['meta+k'] };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'Escape' });
      });

      expect(toggle).not.toHaveBeenCalled();
    });
  });

  describe('combination trigger', () => {
    it('calls toggle when combination keys are pressed', () => {
      const trigger: TriggerConfig = { type: 'combination', keys: ['meta+k'] };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'k', metaKey: true });
      });

      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('does not call toggle when key is pressed without modifier', () => {
      const trigger: TriggerConfig = { type: 'combination', keys: ['meta+k'] };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'k' });
      });

      expect(toggle).not.toHaveBeenCalled();
    });

    it('does not call toggle when a different key is pressed', () => {
      const trigger: TriggerConfig = { type: 'combination', keys: ['meta+k'] };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'p', metaKey: true });
      });

      expect(toggle).not.toHaveBeenCalled();
    });

    it('supports ctrl combination', () => {
      const trigger: TriggerConfig = { type: 'combination', keys: ['ctrl+p'] };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'p', ctrlKey: true });
      });

      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('removes event listener on unmount', () => {
      const trigger: TriggerConfig = { type: 'combination', keys: ['meta+k'] };
      const { unmount } = renderHook(() =>
        useCommandPaletteKeyboard(false, toggle, trigger),
      );

      unmount();

      act(() => {
        dispatchKeyDown({ key: 'k', metaKey: true });
      });

      expect(toggle).not.toHaveBeenCalled();
    });
  });

  describe('double trigger', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls toggle when key is pressed twice within interval', () => {
      const trigger: TriggerConfig = {
        type: 'double',
        keys: ['k'],
        interval: 350,
      };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'k' });
      });

      act(() => {
        jest.advanceTimersByTime(100);
        dispatchKeyDown({ key: 'k' });
      });

      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('does not call toggle on single press', () => {
      const trigger: TriggerConfig = {
        type: 'double',
        keys: ['k'],
        interval: 350,
      };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'k' });
      });

      expect(toggle).not.toHaveBeenCalled();
    });

    it('does not call toggle when second press is outside the interval', () => {
      const trigger: TriggerConfig = {
        type: 'double',
        keys: ['k'],
        interval: 350,
      };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'k' });
      });

      act(() => {
        jest.advanceTimersByTime(400);
        dispatchKeyDown({ key: 'k' });
      });

      expect(toggle).not.toHaveBeenCalled();
    });

    it('uses DEFAULT_DOUBLE_INTERVAL when interval is not specified', () => {
      const trigger: TriggerConfig = { type: 'double', keys: ['k'] };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      act(() => {
        dispatchKeyDown({ key: 'k' });
      });

      act(() => {
        jest.advanceTimersByTime(300);
        dispatchKeyDown({ key: 'k' });
      });

      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('does not fire when active element is an input (isTyping)', () => {
      const trigger: TriggerConfig = {
        type: 'double',
        keys: ['k'],
        interval: 350,
      };
      renderHook(() => useCommandPaletteKeyboard(false, toggle, trigger));

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      act(() => {
        dispatchKeyDown({ key: 'k' });
      });

      act(() => {
        jest.advanceTimersByTime(100);
        dispatchKeyDown({ key: 'k' });
      });

      expect(toggle).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });
});
