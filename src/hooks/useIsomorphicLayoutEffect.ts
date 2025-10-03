import { useEffect, useLayoutEffect } from "react";

/**
 * Custom hook that uses useLayoutEffect on client and useEffect on server
 * to prevent hydration mismatches during SSR
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
