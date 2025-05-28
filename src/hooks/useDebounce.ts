import { useEffect, useState } from 'react';

/**
 * A custom React hook that debounces a value.
 *
 * Debouncing is a technique used to limit the rate at which a function can fire.
 * This hook delays updating the returned value until after the specified delay
 * has passed without the input value changing.
 *
 * Common use cases include:
 * - Search input fields to avoid excessive API calls
 * - Form validation to wait until user stops typing
 * - Autosave features to batch updates
 *
 * @template T - The type of the value being debounced
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds before updating the debounced value (default: 500ms)
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
