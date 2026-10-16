import { useEffect, useState } from "react";
import { ApiError, getOnlineUsers } from "../services/api.ts";

const PRESENCE_REFRESH_INTERVAL_MS = 30_000;

interface PresenceState {
  onlineUserIds: ReadonlySet<number>;
  error: string | null;
}

export function usePresence(
  accessToken: string,
  onUnauthorized: () => void,
): PresenceState {
  const [onlineUserIds, setOnlineUserIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function refreshPresence() {
      controller = new AbortController();
      try {
        const onlineIds = await getOnlineUsers(accessToken, {
          signal: controller.signal,
        });
        if (active) {
          setOnlineUserIds(new Set(onlineIds));
          setError(null);
        }
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 401) {
          if (active) {
            onUnauthorized();
          }
          return;
        }
        if (
          active &&
          !(cause instanceof DOMException && cause.name === "AbortError")
        ) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to refresh online status.",
          );
        }
      } finally {
        if (active) {
          timeoutId = setTimeout(
            refreshPresence,
            PRESENCE_REFRESH_INTERVAL_MS,
          );
        }
      }
    }

    void refreshPresence();
    return () => {
      active = false;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      controller?.abort();
    };
  }, [accessToken, onUnauthorized]);

  return { onlineUserIds, error };
}
