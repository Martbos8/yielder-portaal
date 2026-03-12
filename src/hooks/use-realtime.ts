"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

type RealtimeSubscription = {
  table: string;
  events?: RealtimeEvent[];
  schema?: string;
  filter?: string;
  onEvent: (payload: RealtimePayload) => void;
};

type RealtimePayload = {
  eventType: RealtimeEvent;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  table: string;
};

/**
 * Generic hook for subscribing to Supabase Realtime events.
 * Automatically cleans up subscriptions on unmount.
 */
export function useRealtime(subscriptions: RealtimeSubscription[]) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (subscriptions.length === 0) return;

    const supabase = createClient();
    const channel = supabase.channel("portal-realtime");

    for (const sub of subscriptions) {
      const events = sub.events ?? ["INSERT", "UPDATE", "DELETE"];
      const schema = sub.schema ?? "public";

      for (const event of events) {
        channel.on(
          "postgres_changes" as "system",
          {
            event,
            schema,
            table: sub.table,
            ...(sub.filter ? { filter: sub.filter } : {}),
          } as Record<string, string>,
          (payload: Record<string, unknown>) => {
            sub.onEvent({
              eventType: event,
              new: (payload['new'] as Record<string, unknown>) ?? {},
              old: (payload['old'] as Record<string, unknown>) ?? {},
              table: sub.table,
            });
          }
        );
      }
    }

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        // Subscription failed — clean up to prevent memory leaks
        supabase.removeChannel(channel);
        channelRef.current = null;
      }
    });
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channel);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return channelRef;
}

/**
 * Hook to subscribe to ticket changes and trigger a callback.
 */
export function useTicketRealtime(onUpdate: () => void) {
  const stableCallback = useStableCallback(onUpdate);

  useRealtime([
    {
      table: "tickets",
      events: ["INSERT", "UPDATE", "DELETE"],
      onEvent: () => stableCallback(),
    },
  ]);
}

/**
 * Hook to subscribe to agreement changes and trigger a callback.
 */
export function useAgreementRealtime(onUpdate: () => void) {
  const stableCallback = useStableCallback(onUpdate);

  useRealtime([
    {
      table: "agreements",
      events: ["INSERT", "UPDATE", "DELETE"],
      onEvent: () => stableCallback(),
    },
  ]);
}

/**
 * Hook to subscribe to hardware asset changes and trigger a callback.
 */
export function useHardwareRealtime(onUpdate: () => void) {
  const stableCallback = useStableCallback(onUpdate);

  useRealtime([
    {
      table: "hardware_assets",
      events: ["INSERT", "UPDATE", "DELETE"],
      onEvent: () => stableCallback(),
    },
  ]);
}

/**
 * Hook to keep a callback reference stable across re-renders.
 */
function useStableCallback(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(() => {
    callbackRef.current();
  }, []);
}
