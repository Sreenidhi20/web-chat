import { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ConversationItem from "./ConversationItem.tsx";
import ChatIcon from "./ChatIcon.tsx";
import { useColorMode } from "../context/colorMode.ts";
import { avatarColor } from "../utils/avatarColor.ts";
import type { Conversation } from "../types/chat.ts";

interface SidebarProps {
  username: string;
  onLogout: () => void;
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading: boolean;
  error: string | null;
  presenceError: string | null;
  onRetry: () => void;
}

function Sidebar({
  username,
  onLogout,
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
  error,
  presenceError,
  onRetry,
}: SidebarProps) {
  const { mode, toggleMode } = useColorMode();
  const [search, setSearch] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const visibleConversations = useMemo(
    () =>
      conversations
        .filter((conversation) =>
          conversation.username.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
        )
        .sort(
          (first, second) =>
            Number(second.isOnline) - Number(first.isOnline) ||
            first.username.localeCompare(second.username),
        ),
    [conversations, search],
  );

  return (
    <Paper
      component="aside"
      square
      elevation={0}
      aria-labelledby="conversations-heading"
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
        borderRight: { md: 1 },
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack
        component="header"
        direction="row"
        spacing={1}
        sx={{
          minHeight: 68,
          px: 2,
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: mode === "dark" ? "#202C33" : "#F0F2F5",
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: "center" }}>
          <Avatar
            aria-hidden="true"
            sx={{
              width: 42,
              height: 42,
              bgcolor: avatarColor(username, mode),
              color: "text.primary",
              fontWeight: 700,
            }}
          >
            {username.slice(0, 1).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Web Chat
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Signed in as {username}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0} sx={{ alignItems: "center" }}>
          <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
            <IconButton
              aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
              onClick={toggleMode}
              size="small"
            >
              <ChatIcon name={mode === "light" ? "darkMode" : "lightMode"} />
            </IconButton>
          </Tooltip>
          <Tooltip title="More options">
            <IconButton
              aria-label="More options"
              aria-controls={menuAnchor ? "chat-account-menu" : undefined}
              aria-haspopup="menu"
              aria-expanded={menuAnchor ? "true" : undefined}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              size="small"
            >
              <ChatIcon name="more" />
            </IconButton>
          </Tooltip>
          <Menu
            id="chat-account-menu"
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            slotProps={{ list: { "aria-label": "Account options" } }}
          >
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                onLogout();
              }}
            >
              <ChatIcon name="logout" sx={{ mr: 1.5 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>
      <Box sx={{ px: 1.5, py: 1.25, bgcolor: "background.paper" }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search or start a new chat"
          variant="outlined"
          slotProps={{
            htmlInput: { "aria-label": "Search contacts" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <ChatIcon name="search" fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Clear contact search"
                    onClick={() => setSearch("")}
                    edge="end"
                    size="small"
                  >
                    <ChatIcon name="close" fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: mode === "dark" ? "#202C33" : "#F0F2F5",
              "& fieldset": { border: 0 },
            },
          }}
        />
      </Box>
      <Divider />
      <Box sx={{ px: 2, py: 1.25 }}>
        <Typography
          id="conversations-heading"
          component="h2"
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: ".08em" }}
        >
          Conversations
        </Typography>
      </Box>
      {presenceError && (
        <Alert severity="warning" sx={{ mx: 1.5, mb: 1 }}>
          Online status could not be refreshed: {presenceError}
        </Alert>
      )}
      <Box sx={{ flex: "1 1 auto", overflowY: "auto", minHeight: 0 }}>
        {error ? (
          <Stack spacing={1} sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
            <MenuItem onClick={onRetry} sx={{ justifyContent: "center" }}>
              Retry loading contacts
            </MenuItem>
          </Stack>
        ) : isLoading ? (
          <Stack role="status" aria-label="Loading contacts" spacing={0.5} sx={{ px: 1.5 }}>
            {Array.from({ length: 6 }, (_, index) => (
              <Stack key={index} direction="row" spacing={1.5} sx={{ alignItems: "center", py: 1 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="58%" height={20} />
                  <Skeleton width="34%" height={17} />
                </Box>
              </Stack>
            ))}
          </Stack>
        ) : visibleConversations.length > 0 ? (
          <List disablePadding aria-label="Contact list">
            {visibleConversations.map((conversation) => (
              <ListItem key={conversation.id} component="li" disablePadding>
                <ConversationItem
                  conversation={conversation}
                  isSelected={conversation.id === selectedConversationId}
                  onSelect={onSelectConversation}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ px: 2, py: 2.5, textAlign: "center" }}
          >
            {search ? "No contacts match your search." : "No other users are available yet."}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default Sidebar;
