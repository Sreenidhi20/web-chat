import { useCallback, useEffect, useRef, useState } from "react";
import { ApiConfigurationError, buildWebSocketUrl } from "../services/api.ts";
import type {
  ChatSocketEvent,
  IncomingChatMessage,
  OfflineDeliveryInfo,
} from "../types/chat.ts";

export type SocketStatus = "connecting" | "connected" | "disconnected";

interface ChatSocketState {
  status: SocketStatus;
  error: string | null;
  connect: () => void;
  send: (recipientId: number, message: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseChatSocketFrame(data: string): ChatSocketEvent {
  let value: unknown;
  try {
    value = JSON.parse(data) as unknown;
  } catch (cause) {
    throw new Error("The chat server sent an unreadable message.", { cause });
  }

  if (!isRecord(value)) {
    throw new Error("The chat server sent an invalid message.");
  }

  if ("info" in value) {
    if (typeof value.info !== "string") {
      throw new Error("The chat server sent invalid delivery information.");
    }

    const info: OfflineDeliveryInfo = { info: value.info };
    return { type: "info", info };
  }

  if (
    !Number.isSafeInteger(value.id) ||
    typeof value.id !== "number" ||
    value.id <= 0 ||
    !Number.isSafeInteger(value.from) ||
    typeof value.from !== "number" ||
    value.from <= 0 ||
    typeof value.message !== "string" ||
    typeof value.sent_at !== "string" ||
    !Number.isFinite(Date.parse(value.sent_at))
  ) {
    throw new Error("The chat server sent an invalid message.");
  }

  const message: IncomingChatMessage = {
    id: value.id,
    from: value.from,
    message: value.message,
    sent_at: value.sent_at,
  };
  return { type: "message", message };
}

export function useChatSocket(
  accessToken: string,
  onEvent: (event: ChatSocketEvent) => void,
): ChatSocketState {
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let socket: WebSocket;
    try {
      socket = new WebSocket(buildWebSocketUrl(accessToken));
    } catch (cause) {
      queueMicrotask(() => {
        if (!active) {
          return;
        }
        setStatus("disconnected");
        setError(
          cause instanceof ApiConfigurationError
            ? cause.message
            : "Unable to open the real-time chat connection.",
        );
      });
      return;
    }

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      if (!active) {
        return;
      }
      setStatus("connected");
      setError(null);
    });

    socket.addEventListener("message", (event: MessageEvent<string>) => {
      if (!active) {
        return;
      }
      try {
        onEvent(parseChatSocketFrame(event.data));
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The chat server sent an invalid message.",
        );
      }
    });

    socket.addEventListener("error", () => {
      if (!active) {
        return;
      }
      setError(
        "The real-time connection failed. You may need to sign in again.",
      );
    });

    socket.addEventListener("close", () => {
      if (active && socketRef.current === socket) {
        socketRef.current = null;
        setStatus("disconnected");
      }
    });

    return () => {
      active = false;
      socketRef.current = null;
      socket.close();
    };
  }, [accessToken, connectionAttempt, onEvent]);

  const connect = useCallback(() => {
    setError(null);
    setStatus("connecting");
    setConnectionAttempt((attempt) => attempt + 1);
  }, []);

  const send = useCallback((recipientId: number, message: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("The real-time connection is not ready. Reconnect and try again.");
    }

    socket.send(JSON.stringify({ to: recipientId, message }));
  }, []);

  return { status, error, connect, send };
}
