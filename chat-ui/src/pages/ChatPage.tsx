import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Container } from "@mui/material";
import AppHeader from "../components/AppHeader.tsx";
import ChatWindow from "../components/ChatWindow.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { useAuth } from "../context/useAuth.ts";
import { useChatSocket } from "../hooks/useChatSocket.ts";
import { usePresence } from "../hooks/usePresence.ts";
import { ApiError, getMessageHistory, listUsers } from "../services/api.ts";
import type { ApiUser } from "../types/api.ts";
import type {
  ChatMessage,
  ChatSocketEvent,
  Conversation,
  DisplayMessage,
} from "../types/chat.ts";

const OPTIMISTIC_HISTORY_MATCH_WINDOW_MS = 5 * 60_000;

function ChatPage() {
  const { session, logout } = useAuth();
  if (!session) {
    throw new Error("ChatPage requires an authenticated session.");
  }

  return (
    <AuthenticatedChatPage
      accessToken={session.accessToken}
      userId={session.userId}
      username={session.username}
      onLogout={logout}
    />
  );
}

interface AuthenticatedChatPageProps {
  accessToken: string;
  userId: number;
  username: string;
  onLogout: () => void;
}

function AuthenticatedChatPage({
  accessToken,
  userId,
  username,
  onLogout,
}: AuthenticatedChatPageProps) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [history, setHistory] = useState<{
    conversationId: number;
    messages: DisplayMessage[];
    error: string | null;
  } | null>(null);
  const [retryUsers, setRetryUsers] = useState(0);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);
  const nextOptimisticIdRef = useRef(-1);
  const selectedConversationIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const handleUnauthorized = useCallback(
    (cause: unknown) => {
      if (cause instanceof ApiError && cause.status === 401) {
        onLogout();
        return true;
      }
      return false;
    },
    [onLogout],
  );
  const handleSocketEvent = useCallback(
    (event: ChatSocketEvent) => {
      if (event.type === "info") {
        setDeliveryInfo(event.info.info);
        setHistoryRevision((revision) => revision + 1);
        return;
      }

      const incoming = event.message;
      const conversationId = incoming.from;
      if (selectedConversationIdRef.current === conversationId) {
        const message: ChatMessage = {
          id: incoming.id,
          sender_id: incoming.from,
          receiver_id: userId,
          content: incoming.message,
          sent_at: incoming.sent_at,
        };
        setHistory((current) => {
          const messages =
            current?.conversationId === conversationId
              ? current.messages
              : [];
          if (messages.some((item) => item.id === message.id)) {
            return current;
          }
          return {
            conversationId,
            messages: [...messages, message],
            error: null,
          };
        });
        setHistoryRevision((revision) => revision + 1);
      }
    },
    [userId],
  );
  const {
    status: socketStatus,
    error: socketError,
    connect: reconnectSocket,
    send: sendSocketMessage,
  } = useChatSocket(accessToken, handleSocketEvent);
  const { onlineUserIds, error: presenceError } = usePresence(
    accessToken,
    onLogout,
  );

  const conversations = useMemo<Conversation[]>(
    () =>
      users
        .filter((user) => user.id !== userId)
        .map((user) => ({
          ...user,
          isOnline: onlineUserIds.has(user.id),
        })),
    [users, userId, onlineUserIds],
  );
  const selectedConversation =
    conversations.find((user) => user.id === selectedConversationId) ?? null;
  const currentHistory =
    history?.conversationId === selectedConversationId ? history : null;

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      try {
        const response = await listUsers(accessToken, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }
        setUsers(response);
      } catch (cause) {
        if (controller.signal.aborted) {
          return;
        }
        if (!handleUnauthorized(cause)) {
          setUsersError(
            cause instanceof Error
              ? cause.message
              : "Unable to load contacts. Please try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingUsers(false);
        }
      }
    }

    void loadUsers();
    return () => controller.abort();
  }, [accessToken, handleUnauthorized, retryUsers]);

  useEffect(() => {
    if (selectedConversationId === null) {
      return;
    }

    const controller = new AbortController();
    const otherUserId = selectedConversationId;

    async function loadMessages() {
      try {
        const conversationHistory = await getMessageHistory(
          accessToken,
          userId,
          otherUserId,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) {
          return;
        }
        setHistory((current) => {
          const existing =
            current?.conversationId === otherUserId ? current.messages : [];
          return {
            conversationId: otherUserId,
            messages: reconcileHistory(conversationHistory, existing),
            error: null,
          };
        });
      } catch (cause) {
        if (controller.signal.aborted) {
          return;
        }
        if (!handleUnauthorized(cause)) {
          setHistory({
            conversationId: otherUserId,
            messages: [],
            error:
              cause instanceof Error
                ? cause.message
                : "Unable to load this conversation. Please try again.",
          });
        }
      }
    }

    void loadMessages();
    return () => controller.abort();
  }, [
    accessToken,
    userId,
    selectedConversationId,
    historyRevision,
    handleUnauthorized,
  ]);

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content || selectedConversationId === null) {
      return;
    }

    try {
      sendSocketMessage(selectedConversationId, content);
      const optimisticMessage: DisplayMessage = {
        id: nextOptimisticIdRef.current,
        sender_id: userId,
        receiver_id: selectedConversationId,
        content,
        sent_at: new Date().toISOString(),
        isPendingDelivery: true,
      };
      nextOptimisticIdRef.current -= 1;
      setHistory((current) => {
        const messages =
          current?.conversationId === selectedConversationId
            ? current.messages
            : [];
        return {
          conversationId: selectedConversationId,
          messages: [...messages, optimisticMessage],
          error: null,
        };
      });
      setDraft("");
      setSendError(null);
      setDeliveryInfo(null);
    } catch (cause) {
      setSendError(
        cause instanceof Error
          ? cause.message
          : "Unable to send the message. Your draft has been kept.",
      );
    }
  }, [draft, selectedConversationId, sendSocketMessage, userId]);

  const refreshHistory = useCallback(() => {
    setHistoryRevision((revision) => revision + 1);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <AppHeader username={username} onLogout={onLogout} />

      <Container
        component="main"
        maxWidth="xl"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          py: { xs: 2, sm: 3, md: 5 },
        }}
      >
        {deliveryInfo && (
          <Alert severity="info" role="status">
            {deliveryInfo}
          </Alert>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" },
            flexGrow: 1,
            minHeight: { xs: "70vh", md: "min(700px, calc(100vh - 170px))" },
            overflow: "hidden",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Sidebar
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={(conversation) =>
              setSelectedConversationId(conversation.id)
            }
            isLoading={isLoadingUsers}
            error={usersError}
            presenceError={presenceError}
            onRetry={() => {
              setUsersError(null);
              setIsLoadingUsers(true);
              setRetryUsers((attempt) => attempt + 1);
            }}
          />
          <ChatWindow
            conversation={selectedConversation}
            messages={currentHistory?.messages ?? []}
            currentUserId={userId}
            isLoading={
              selectedConversationId !== null && currentHistory === null
            }
            error={currentHistory?.error ?? null}
            socketStatus={socketStatus}
            socketError={socketError}
            sendError={sendError}
            onReconnect={reconnectSocket}
            onRefreshHistory={refreshHistory}
            draft={draft}
            onDraftChange={setDraft}
            onSend={handleSend}
          />
        </Box>
      </Container>
    </Box>
  );
}

function reconcileHistory(
  serverMessages: ChatMessage[],
  existingMessages: DisplayMessage[],
): DisplayMessage[] {
  const reconciled: DisplayMessage[] = [...serverMessages];
  const serverIds = new Set(serverMessages.map((message) => message.id));
  const usedServerIds = new Set<number>();
  const unresolvedOptimistic: DisplayMessage[] = [];

  for (const pending of existingMessages.filter(
    (message) => message.isPendingDelivery,
  )) {
    const pendingTime = Date.parse(pending.sent_at);
    const match = serverMessages
      .filter(
        (message) =>
          !usedServerIds.has(message.id) &&
          message.sender_id === pending.sender_id &&
          message.receiver_id === pending.receiver_id &&
          message.content === pending.content &&
          Number.isFinite(pendingTime) &&
          Number.isFinite(Date.parse(message.sent_at)) &&
          Math.abs(Date.parse(message.sent_at) - pendingTime) <=
            OPTIMISTIC_HISTORY_MATCH_WINDOW_MS,
      )
      .sort(
        (first, second) =>
          Math.abs(Date.parse(first.sent_at) - pendingTime) -
          Math.abs(Date.parse(second.sent_at) - pendingTime),
      )[0];

    if (match) {
      usedServerIds.add(match.id);
    } else {
      unresolvedOptimistic.push(pending);
    }
  }

  const knownServerIds = new Set(serverIds);
  for (const localMessage of existingMessages) {
    if (
      !localMessage.isPendingDelivery &&
      !knownServerIds.has(localMessage.id)
    ) {
      reconciled.push(localMessage);
    }
  }

  return [...reconciled, ...unresolvedOptimistic];
}

export default ChatPage;
