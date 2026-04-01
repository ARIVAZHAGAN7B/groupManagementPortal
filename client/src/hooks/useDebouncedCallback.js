import { useEffect, useEffectEvent, useMemo, useRef } from "react";

export const useDebouncedCallback = (callback, delayMs = 250) => {
  const timeoutRef = useRef(null);
  const onInvoke = useEffectEvent((...args) => {
    callback?.(...args);
  });

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return useMemo(
    () =>
      (...args) => {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
          timeoutRef.current = null;
          onInvoke(...args);
        }, delayMs);
      },
    [delayMs, onInvoke]
  );
};
