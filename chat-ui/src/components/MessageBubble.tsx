import { Box, Paper, Typography } from "@mui/material";
import type { ChatMessage } from "../types/chat.ts";

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: number;
}

function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isSent = message.sender_id === currentUserId;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isSent ? "flex-end" : "flex-start",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: "min(75%, 560px)",
          px: 1.75,
          py: 1.25,
          bgcolor: isSent ? "primary.main" : "grey.100",
          color: isSent ? "primary.contrastText" : "text.primary",
          borderRadius: 2,
        }}
      >
        <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {message.content}
        </Typography>
        <Typography
          component="time"
          dateTime={message.sent_at}
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            textAlign: "right",
            color: isSent ? "primary.contrastText" : "text.secondary",
            opacity: 0.8,
          }}
        >
          {new Date(message.sent_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </Typography>
      </Paper>
    </Box>
  );
}

export default MessageBubble;
