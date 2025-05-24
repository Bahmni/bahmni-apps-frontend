import { renderHook, act } from '@testing-library/react';
import useDebounce from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Happy Paths', () => {
    it('should return initial value immediately on first render', () => {
      const initialValue = 'test';
      const { result } = renderHook(() => useDebounce(initialValue));

      expect(result.current).toBe(initialValue);
    });

    it('should debounce value changes with default delay (500ms)', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } },
      );

      // Initial value should be returned immediately
      expect(result.current).toBe('initial');

      // Change the value
      rerender({ value: 'updated' });

      // Value should not change immediately
      expect(result.current).toBe('initial');

      // Advance timers by less than default delay
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(result.current).toBe('initial');

      // Advance timers to complete the delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('updated');
    });

    it('should debounce value changes with custom delay', async () => {
      const customDelay = 300;
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, customDelay),
        { initialProps: { value: 'initial' } },
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated' });
      expect(result.current).toBe('initial');

      // Advance timers by less than custom delay
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current).toBe('initial');

      // Advance timers to complete the custom delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle different data types - string', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'string value' } },
      );

      expect(result.current).toBe('string value');

      rerender({ value: 'new string' });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe('new string');
    });

    it('should handle different data types - number', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 42 } },
      );

      expect(result.current).toBe(42);

      rerender({ value: 100 });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe(100);
    });

    it('should handle different data types - boolean', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: true } },
      );

      expect(result.current).toBe(true);

      rerender({ value: false });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe(false);
    });

    it('should handle different data types - object', () => {
      const initialObj = { name: 'test', value: 123 };
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: initialObj } },
      );

      expect(result.current).toBe(initialObj);

      const newObj = { name: 'updated', value: 456 };
      rerender({ value: newObj });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe(newObj);
    });

    it('should handle different data types - array', () => {
      const initialArray = [1, 2, 3];
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: initialArray } },
      );

      expect(result.current).toBe(initialArray);

      const newArray = [4, 5, 6];
      rerender({ value: newArray });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe(newArray);
    });

    it('should handle different data types - null', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: null as string | null } },
      );

      expect(result.current).toBe(null);

      rerender({ value: 'not null' });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe('not null');
    });

    it('should handle different data types - undefined', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: undefined as string | undefined } },
      );

      expect(result.current).toBe(undefined);

      rerender({ value: 'defined' });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe('defined');
    });

    it('should cancel previous timeout when value changes rapidly', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { rerender } = renderHook(({ value }) => useDebounce(value), {
        initialProps: { value: 'initial' },
      });

      // Change value multiple times rapidly
      rerender({ value: 'change1' });
      rerender({ value: 'change2' });
      rerender({ value: 'change3' });

      // clearTimeout should be called for each change after the initial render
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(3);

      clearTimeoutSpy.mockRestore();
    });

    it('should update to new value after delay period', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } },
      );

      rerender({ value: 'updated' });

      // Advance timer to just before delay completes
      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(result.current).toBe('initial');

      // Advance timer to complete delay
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('Sad Paths', () => {
    it('should handle component unmounting during debounce period', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } },
      );

      rerender({ value: 'updated' });

      // Unmount before delay completes
      unmount();

      // This should not throw an error
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Result should remain unchanged since component unmounted
      expect(result.current).toBe('initial');
    });

    it('should handle zero delay value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } },
      );

      rerender({ value: 'updated' });

      // With zero delay, the value should update immediately
      act(() => {
        jest.advanceTimersByTime(0);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle negative delay value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, -100),
        { initialProps: { value: 'initial' } },
      );

      rerender({ value: 'updated' });

      // Negative delay should be treated as zero
      act(() => {
        jest.advanceTimersByTime(0);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle extremely large delay values', () => {
      const largeDelay = 1000000; // 1 million ms
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, largeDelay),
        { initialProps: { value: 'initial' } },
      );

      rerender({ value: 'updated' });

      // Value should not change even after a reasonable time
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });
      expect(result.current).toBe('initial');

      // Advance to complete the large delay
      act(() => {
        jest.advanceTimersByTime(largeDelay - 10000);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid consecutive value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } },
      );

      // Simulate rapid typing
      rerender({ value: 't' });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: 'te' });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: 'tes' });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: 'test' });

      // Value should still be initial
      expect(result.current).toBe('initial');

      // Complete the delay from the last change
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should have the final value
      expect(result.current).toBe('test');
    });

    it('should maintain referential equality for objects when value reference changes but content is same', () => {
      const obj1 = { name: 'test', value: 123 };
      const obj2 = { name: 'test', value: 123 }; // Same content, different reference

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: obj1 } },
      );

      expect(result.current).toBe(obj1);

      rerender({ value: obj2 });
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should update to new reference even if content is same
      expect(result.current).toBe(obj2);
      expect(result.current).not.toBe(obj1);
    });

    it('should handle delay value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } },
      );

      // Change value with initial delay
      rerender({ value: 'updated', delay: 500 });

      // Advance timer partially
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(result.current).toBe('initial');

      // Change delay while timer is running
      rerender({ value: 'updated', delay: 200 });

      // The timer should restart with new delay
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle same value being set multiple times', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'same' } },
      );

      expect(result.current).toBe('same');

      // Set the same value again
      rerender({ value: 'same' });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Value should remain the same
      expect(result.current).toBe('same');
    });
  });
});
