import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Container } from "@mui/material";
import AppHeader from "../components/AppHeader.tsx";
import ChatWindow from "../components/ChatWindow.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { useAuth } from "../context/useAuth.ts";
import { usePresence } from "../hooks/usePresence.ts";
import { ApiError, getMessageHistory, listUsers } from "../services/api.ts";
import type { ApiUser } from "../types/api.ts";
import type { ChatMessage, Conversation } from "../types/chat.ts";

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
    messages: ChatMessage[];
    error: string | null;
  } | null>(null);
  const [retryUsers, setRetryUsers] = useState(0);
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
        const history = await getMessageHistory(
          accessToken,
          userId,
          otherUserId,
          { signal: controller.signal },
        );
        setHistory({
          conversationId: otherUserId,
          messages: history,
          error: null,
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
  }, [accessToken, userId, selectedConversationId, handleUnauthorized]);

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
        sx={{ flexGrow: 1, display: "flex", py: { xs: 2, sm: 3, md: 5 } }}
      >
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
          />
        </Box>
      </Container>
    </Box>
  );
}

export default ChatPage;
