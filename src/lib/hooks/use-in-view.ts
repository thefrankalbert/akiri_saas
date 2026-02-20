'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook that detects when a referenced element enters the viewport.
 * Uses a callback ref pattern (compatible with React 19 strict lint rules).
 * Disconnects after first intersection (one-shot animation trigger).
 *
 * Returns `inViewRef` (callback ref for JSX) and `inView` (boolean state).
 */
export function useInView(threshold = 0.15) {
  const [inView, setInView] = useState(false);

  const inViewRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || inView) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { threshold }
      );

      observer.observe(node);
    },
    [threshold, inView]
  );

  return { inViewRef, inView };
}
