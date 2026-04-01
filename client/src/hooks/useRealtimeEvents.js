import { useEffect, useEffectEvent } from "react";
import { subscribeRealtime } from "../lib/realtime";

export const useRealtimeEvents = (eventNames, handler) => {
  const onEvent = useEffectEvent((payload) => {
    handler?.(payload);
  });
  const normalizedEvents = (Array.isArray(eventNames) ? eventNames : [eventNames]).filter(Boolean);
  const eventKey = normalizedEvents.join("|");

  useEffect(() => {
    if (normalizedEvents.length === 0) return undefined;

    const unsubscribers = normalizedEvents.map((eventName) =>
      subscribeRealtime(eventName, (payload) => {
        onEvent(payload);
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [eventKey, onEvent]);
};
