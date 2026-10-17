import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import MessageBubble from "./MessageBubble.tsx";
import MessageInput from "./MessageInput.tsx";
import EmptyChatState from "./EmptyChatState.tsx";
import ChatIcon from "./ChatIcon.tsx";
import DateDivider from "./DateDivider.tsx";
import { useColorMode } from "../context/colorMode.ts";
import { useAutoScroll } from "../hooks/useAutoScroll.ts";
import { avatarColor } from "../utils/avatarColor.ts";
import type { Conversation, DisplayMessage } from "../types/chat.ts";
import { groupMessages } from "../utils/groupMessages.ts";
import { useState } from "react";

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
  onBack?: () => void;
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
  onBack,
  draft,
  onDraftChange,
  onSend,
}: ChatWindowProps) {
  const { mode } = useColorMode();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const messageItems = groupMessages(messages);
  const {
    containerRef,
    handleScroll,
    scrollToLatest,
    showScrollButton,
  } = useAutoScroll(conversation?.id ?? null, messages.length);
  const chatBackground = mode === "dark" ? "#0B141A" : "#EFEAE2";
  const patternColor =
    mode === "dark" ? "rgba(233,237,239,0.025)" : "rgba(17,27,33,0.045)";

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
        flex: "1 1 auto",
        minWidth: 0,
        minHeight: 0,
        bgcolor: chatBackground,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${patternColor} 1px, transparent 0)`,
        backgroundSize: "24px 24px",
      }}
    >
      {conversation ? (
        <Stack
          component="header"
          direction="row"
          spacing={1.25}
          sx={{
            minHeight: 68,
            px: { xs: 1, sm: 2 },
            py: 1,
            alignItems: "center",
            bgcolor: mode === "dark" ? "#202C33" : "#F0F2F5",
          }}
        >
          {onBack && (
            <Tooltip title="Back to conversations">
              <IconButton
                aria-label="Back to conversations"
                onClick={onBack}
                sx={{ display: { md: "none" } }}
              >
                <ChatIcon name="back" />
              </IconButton>
            </Tooltip>
          )}
          <Avatar
            aria-hidden="true"
            sx={{
              width: 42,
              height: 42,
              bgcolor: avatarColor(conversation.username, mode),
              color: mode === "dark" ? "#E9EDEF" : "#111B21",
            }}
          >
            {conversation.username.slice(0, 1).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography component="h2" variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
              {conversation.username}
            </Typography>
            <Typography
              variant="body2"
              color={conversation.isOnline ? "success.main" : "text.secondary"}
            >
              {conversation.isOnline ? "online" : "offline"}
            </Typography>
          </Box>
          <Tooltip title="Conversation options">
            <IconButton
              aria-label="Conversation options"
              aria-haspopup="menu"
              aria-expanded={menuAnchor ? "true" : undefined}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
            >
              <ChatIcon name="more" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            slotProps={{ list: { "aria-label": "Conversation options" } }}
          >
            <MenuItem
              disabled={isLoading}
              onClick={() => {
                setMenuAnchor(null);
                onRefreshHistory();
              }}
            >
              <ChatIcon name="refresh" sx={{ mr: 1.5 }} />
              Refresh history
            </MenuItem>
          </Menu>
        </Stack>
      ) : null}
      {conversation && (
        <Divider />
      )}
      {conversation &&
        (socketStatus !== "connected" || socketError || sendError) && (
          <Stack spacing={0.5} sx={{ px: 1.5, py: 0.75 }}>
            {socketStatus !== "connected" && (
              <Alert
                severity={socketStatus === "disconnected" ? "warning" : "info"}
                action={
                  socketStatus === "disconnected" ? (
                    <Button color="inherit" size="small" onClick={onReconnect}>
                      Reconnect
                    </Button>
                  ) : undefined
                }
                sx={{ py: 0, alignItems: "center", "& .MuiAlert-message": { py: 0.5 } }}
              >
                {socketStatus === "connecting"
                  ? "Connecting to real-time chat…"
                  : "Real-time chat is disconnected. Messages cannot be sent."}
              </Alert>
            )}
            {socketError && (
              <Alert severity="error" role="alert" sx={{ py: 0, "& .MuiAlert-message": { py: 0.5 } }}>
                {socketError}
              </Alert>
            )}
            {sendError && (
              <Alert severity="error" role="alert" sx={{ py: 0, "& .MuiAlert-message": { py: 0.5 } }}>
                {sendError}
              </Alert>
            )}
          </Stack>
        )}
      <Box sx={{ position: "relative", flex: "1 1 auto", minHeight: 0 }}>
        <Stack
          ref={containerRef}
          onScroll={handleScroll}
          component="div"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          spacing={0}
          sx={{
            height: "100%",
            minHeight: 0,
            overflowY: "auto",
            p: { xs: 1.5, sm: 3 },
            scrollbarGutter: "stable",
          }}
        >
          {error ? (
            <Stack role="alert" spacing={1} sx={{ m: "auto", textAlign: "center", px: 2 }}>
              <Typography color="error.main">{error}</Typography>
              <Button onClick={onRefreshHistory} size="small">
                Retry loading history
              </Button>
            </Stack>
          ) : isLoading ? (
            <Stack role="status" aria-label="Loading messages" spacing={1} sx={{ mt: "auto" }}>
              <Skeleton variant="rounded" width="42%" height={42} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" width="56%" height={54} sx={{ alignSelf: "flex-end", borderRadius: 2 }} />
              <Skeleton variant="rounded" width="34%" height={42} sx={{ borderRadius: 2 }} />
            </Stack>
          ) : conversation && currentUserId !== null && messages.length > 0 ? (
            messageItems.map((item) =>
              item.type === "date" ? (
                <DateDivider key={item.key} label={item.label} />
              ) : (
                <Stack key={item.key} spacing={0.25} sx={{ mt: 1 }}>
                  {item.messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      currentUserId={currentUserId}
                      isGroupStart={index === 0}
                    />
                  ))}
                </Stack>
              ),
            )
          ) : conversation ? (
            <Typography color="text.secondary" sx={{ m: "auto", textAlign: "center" }}>
              No messages in this conversation yet.
            </Typography>
          ) : (
            <EmptyChatState />
          )}
        </Stack>
        {showScrollButton && (
          <Tooltip title="Scroll to latest">
            <IconButton
              aria-label="Scroll to latest"
              onClick={scrollToLatest}
              sx={{
                position: "absolute",
                right: { xs: 14, sm: 24 },
                bottom: 16,
                bgcolor: "background.paper",
                color: "primary.main",
                boxShadow: (theme) => theme.shadows[3],
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              <ChatIcon name="arrowDown" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {conversation && (
        <Box sx={{ p: { xs: 1, sm: 1.5 }, pt: 0 }}>
          <MessageInput
            disabled={!conversation}
            canSend={Boolean(conversation) && socketStatus === "connected"}
            placeholder={
              socketStatus === "connected"
                ? "Write a message"
                : "Connect to send a message"
            }
            value={draft}
            onChange={onDraftChange}
            onSend={onSend}
          />
        </Box>
      )}
    </Paper>
  );
}

export default ChatWindow;
