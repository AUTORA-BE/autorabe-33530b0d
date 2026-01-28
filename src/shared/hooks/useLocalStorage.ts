import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for persisting state to localStorage with type safety
 * Handles SSR scenarios and JSON serialization automatically
 * 
 * @template T - Type of the stored value
 * @param key - localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 * 
 * @example
 * ```tsx
 * const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
 * 
 * // Add to favorites
 * setFavorites([...favorites, 'new-id']);
 * 
 * // Remove from localStorage
 * removeValue();
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state with value from localStorage or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Wrapped setter that handles both direct values and updater functions
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;
      return nextValue;
    });
  }, []);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
