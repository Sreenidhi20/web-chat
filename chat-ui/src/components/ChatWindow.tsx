import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import MessageBubble from "./MessageBubble.tsx";
import MessageInput from "./MessageInput.tsx";
import type { ChatMessage, Conversation } from "../types/chat.ts";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  currentUserId: number | null;
  isLoading: boolean;
  error: string | null;
}

function ChatWindow({
  conversation,
  messages,
  currentUserId,
  isLoading,
  error,
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
        <Typography
          component="h2"
          variant="h6"
          sx={{ fontWeight: 700 }}
        >
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
      <Divider />
      <Stack
        component="div"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        spacing={1.5}
        sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, sm: 3 } }}
      >
        {error ? (
          <Box role="alert" sx={{ m: "auto", textAlign: "center", px: 2 }}>
            <Typography color="error.main">{error}</Typography>
          </Box>
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
          disabled
          placeholder={
            conversation
              ? "Message sending will be enabled soon"
              : "Select a contact to start chatting"
          }
        />
      </Box>
    </Paper>
  );
}

export default ChatWindow;
