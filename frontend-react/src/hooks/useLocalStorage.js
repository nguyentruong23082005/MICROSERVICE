import { useCallback, useState } from 'react';

/**
 * Persist state to localStorage, syncing across reads/writes.
 * @param {string} key - localStorage key
 * @param {*} initialValue - fallback when key is absent
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue((currentValue) => {
        const valueToStore = value instanceof Function ? value(currentValue) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(`useLocalStorage[${key}]:`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
