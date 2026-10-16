import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import MessageBubble from "./MessageBubble.tsx";
import MessageInput from "./MessageInput.tsx";
import type { Conversation, DisplayMessage } from "../types/chat.ts";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: DisplayMessage[];
  currentUserId: number | null;
  isLoading: boolean;
  error: string | null;
  socketStatus: "connecting" | "connected" | "disconnected";
  socketError: string | null;
  sendError: string | null;
  onReconnect: () => void;
  onRefreshHistory: () => void;
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: () => void;
}

function ChatWindow({
  conversation,
  messages,
  currentUserId,
  isLoading,
  error,
  socketStatus,
  socketError,
  sendError,
  onReconnect,
  onRefreshHistory,
  draft,
  onDraftChange,
  onSend,
}: ChatWindowProps) {
  return (
    <Paper
      component="section"
      square
      elevation={0}
      aria-label={
        conversation ? `Conversation with ${conversation.username}` : "Chat"
      }
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: { xs: 320, md: 0 },
      }}
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
              {conversation?.username ?? "Your messages"}
            </Typography>
            {conversation && (
              <Typography
                variant="body2"
                color={conversation.isOnline ? "success.main" : "text.secondary"}
              >
                {conversation.isOnline ? "Online" : "Offline"}
              </Typography>
            )}
          </Box>
          {conversation && (
            <Button
              size="small"
              onClick={onRefreshHistory}
              disabled={isLoading}
            >
              Refresh history
            </Button>
          )}
        </Stack>
      </Box>
      <Divider />
      {conversation && (
        <Alert
          severity={socketStatus === "connected" ? "success" : "warning"}
          action={
            socketStatus === "disconnected" ? (
              <Button color="inherit" size="small" onClick={onReconnect}>
                Reconnect
              </Button>
            ) : undefined
          }
          sx={{ borderRadius: 0 }}
        >
          {socketStatus === "connected"
            ? "Real-time connection is active."
            : socketStatus === "connecting"
              ? "Connecting to real-time chat…"
              : "Real-time chat is disconnected. Messages cannot be sent."}
        </Alert>
      )}
      {socketError && (
        <Alert severity="error" role="alert" sx={{ borderRadius: 0 }}>
          {socketError}
        </Alert>
      )}
      {sendError && (
        <Alert severity="error" role="alert" sx={{ borderRadius: 0 }}>
          {sendError}
        </Alert>
      )}
      <Stack
        component="div"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        spacing={1.5}
        sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, sm: 3 } }}
      >
        {error ? (
          <Stack role="alert" spacing={1} sx={{ m: "auto", textAlign: "center", px: 2 }}>
            <Typography color="error.main">{error}</Typography>
            <Button onClick={onRefreshHistory} size="small">
              Retry loading history
            </Button>
          </Stack>
        ) : isLoading ? (
          <Box role="status" sx={{ m: "auto" }}>
            <Typography color="text.secondary">Loading messages…</Typography>
          </Box>
        ) : conversation && currentUserId !== null && messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              px: 2,
            }}
          >
            <Typography color="text.secondary">
              {conversation
                ? "No messages in this conversation yet."
                : "Sign in and choose a contact to start chatting."}
            </Typography>
          </Box>
        )}
      </Stack>
      <Box sx={{ p: { xs: 1.5, sm: 2 }, pt: 0 }}>
        <MessageInput
          disabled={!conversation}
          canSend={Boolean(conversation) && socketStatus === "connected"}
          placeholder={
            conversation
              ? socketStatus === "connected"
                ? "Write a message"
                : "Connect to send a message"
              : "Select a contact to start chatting"
          }
          value={draft}
          onChange={onDraftChange}
          onSend={onSend}
        />
      </Box>
    </Paper>
  );
}

export default ChatWindow;
