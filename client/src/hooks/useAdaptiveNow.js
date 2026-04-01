import { useEffect, useState } from "react";

const getNextDelay = (targetTimeMs) => {
  if (!Number.isFinite(targetTimeMs)) return 60000;

  const remainingMs = targetTimeMs - Date.now();

  if (remainingMs <= 60000) return 1000;
  if (remainingMs <= 3600000) return 15000;
  if (remainingMs <= 86400000) return 60000;
  return 300000;
};

export const useAdaptiveNow = (targetTimeMs) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let timeoutId = null;

    const scheduleTick = () => {
      const delay = getNextDelay(targetTimeMs);
      timeoutId = window.setTimeout(() => {
        setNowMs(Date.now());
        scheduleTick();
      }, delay);
    };

    setNowMs(Date.now());
    scheduleTick();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [targetTimeMs]);

  return nowMs;
};
