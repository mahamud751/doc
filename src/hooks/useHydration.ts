import { useState, useEffect } from "react";

/**
 * Custom hook to detect if the component has mounted on the client
 * Useful for preventing hydration mismatches in SSR
 *
 * @returns {boolean} true if component has mounted on client, false otherwise
 */
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

/**
 * Custom hook to safely access browser-only APIs
 * Returns undefined during SSR and the actual value on client
 *
 * @param getValue - Function that returns the browser API value
 * @returns The value or undefined during SSR
 */
export function useBrowserOnly<T>(getValue: () => T): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    setValue(getValue());
  }, [getValue]);

  return value;
}
