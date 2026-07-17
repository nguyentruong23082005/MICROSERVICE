import { useState, useEffect } from 'react';

/**
 * Delay updating a value until after the specified delay.
 * Useful for search inputs to avoid firing on every keystroke.
 * @param {*} value - The value to debounce
 * @param {number} delay - Milliseconds to wait (default 300ms)
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
