import { Box, Paper, Tooltip, Typography } from "@mui/material";
import ChatIcon from "./ChatIcon.tsx";
import type { DisplayMessage } from "../types/chat.ts";

interface MessageBubbleProps {
  message: DisplayMessage;
  currentUserId: number;
  isGroupStart: boolean;
}

function MessageBubble({
  message,
  currentUserId,
  isGroupStart,
}: MessageBubbleProps) {
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
          maxWidth: "min(78%, 600px)",
          px: 1.5,
          py: 0.9,
          bgcolor: isSent
            ? (theme) => theme.palette.mode === "dark" ? "#005C4B" : "#D9FDD3"
            : (theme) => theme.palette.mode === "dark" ? "#202C33" : "#FFFFFF",
          color: "text.primary",
          borderRadius: "8px",
          borderTopRightRadius: isSent && isGroupStart ? 0 : "8px",
          borderTopLeftRadius: !isSent && isGroupStart ? 0 : "8px",
          boxShadow: (theme) => theme.shadows[1],
          overflowWrap: "anywhere",
        }}
      >
        <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
          {message.content}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 0.4,
            mt: 0.25,
            ml: 2,
          }}
        >
          <Typography
            component="time"
            dateTime={message.sent_at}
            variant="caption"
            sx={{
              fontSize: 11,
              lineHeight: 1.2,
              color: (theme) =>
                isSent
                  ? theme.palette.text.primary
                  : theme.palette.text.secondary,
            }}
          >
            {new Date(message.sent_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Typography>
          {isSent && (
            <Tooltip title={message.isPendingDelivery ? "Pending; awaiting history sync" : "Sent"}>
              <ChatIcon
                name={message.isPendingDelivery ? "clock" : "check"}
                titleAccess={
                  message.isPendingDelivery
                    ? "Pending; awaiting history sync"
                    : "Sent"
                }
                sx={{
                  fontSize: 14,
                  color: "text.primary",
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default MessageBubble;
