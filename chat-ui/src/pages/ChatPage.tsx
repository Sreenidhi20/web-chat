import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Snackbar } from "@mui/material";
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
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
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
      className="chat-app-shell"
      sx={{
        width: "100%",
        height: "100dvh",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      <Box
        component="main"
        className="chat-app-frame"
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minHeight: 0,
          width: "100%",
          maxWidth: 1600,
          mx: "auto",
          bgcolor: "background.paper",
          overflow: "hidden",
          "@media (min-width: 1600px)": {
            height: "calc(100dvh - 48px)",
            my: 3,
            borderRadius: 1,
            boxShadow: (theme) => theme.shadows[4],
          },
          "@media (max-width: 899px)": {
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Snackbar
          open={Boolean(deliveryInfo)}
          autoHideDuration={6000}
          onClose={() => setDeliveryInfo(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity="info"
            role="status"
            onClose={() => setDeliveryInfo(null)}
            sx={{ width: "100%" }}
          >
            {deliveryInfo}
          </Alert>
        </Snackbar>
        <Box
          className="chat-workspace-grid"
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 34%) minmax(0, 1fr)",
            flex: "1 1 auto",
            minHeight: 0,
            overflow: "hidden",
            bgcolor: "background.paper",
            "@media (max-width: 899px)": {
              gridTemplateColumns: "minmax(0, 1fr)",
              gridTemplateRows: "minmax(0, 1fr)",
            },
          }}
        >
          <Box
            sx={{
              display: { xs: isMobileChatOpen ? "none" : "flex", md: "flex" },
              height: "100%",
              minHeight: 0,
              minWidth: 0,
            }}
          >
            <Sidebar
              username={username}
              onLogout={onLogout}
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(conversation) => {
                setSelectedConversationId(conversation.id);
                setIsMobileChatOpen(true);
              }}
              isLoading={isLoadingUsers}
              error={usersError}
              presenceError={presenceError}
              onRetry={() => {
                setUsersError(null);
                setIsLoadingUsers(true);
                setRetryUsers((attempt) => attempt + 1);
              }}
            />
          </Box>
          <Box
            sx={{
              display: { xs: isMobileChatOpen ? "flex" : "none", md: "flex" },
              height: "100%",
              minHeight: 0,
              minWidth: 0,
            }}
          >
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
              onBack={() => setIsMobileChatOpen(false)}
              draft={draft}
              onDraftChange={setDraft}
              onSend={handleSend}
            />
          </Box>
        </Box>
      </Box>
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
