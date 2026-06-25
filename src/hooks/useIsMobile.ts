"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the viewport is at/under `breakpoint` px. For inline-styled
 * components that can't use CSS media queries. SSR-safe (starts false, corrects on mount).
 */
export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
