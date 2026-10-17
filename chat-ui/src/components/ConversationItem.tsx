import { Avatar, Badge, Box, ButtonBase, Typography } from "@mui/material";
import { useColorMode } from "../context/colorMode.ts";
import { avatarColor } from "../utils/avatarColor.ts";
import type { Conversation } from "../types/chat.ts";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversation: Conversation) => void;
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const { mode } = useColorMode();
  const status = conversation.isOnline ? "online" : "offline";

  return (
    <ButtonBase
      component="button"
      onClick={() => onSelect(conversation)}
      aria-current={isSelected ? "true" : undefined}
      aria-label={`${conversation.username} ${conversation.isOnline ? "Online" : "Offline"}`}
      sx={{
        display: "flex",
        width: "100%",
        minHeight: 72,
        justifyContent: "flex-start",
        gap: 1.5,
        px: 1.75,
        py: 1,
        textAlign: "left",
        bgcolor: isSelected ? "action.selected" : "transparent",
        borderBottom: 1,
        borderColor: "divider",
        transition: "background-color 120ms ease",
        "&:hover": { bgcolor: "action.hover" },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: -2,
        },
      }}
    >
      <Badge
        overlap="circular"
        variant="dot"
        invisible={!conversation.isOnline}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{
          "& .MuiBadge-badge": {
            bgcolor: "#25D366",
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid",
            borderColor: "background.paper",
          },
        }}
      >
        <Avatar
          aria-hidden="true"
          sx={{
            width: 48,
            height: 48,
            bgcolor: avatarColor(conversation.username, mode),
            color: mode === "dark" ? "#E9EDEF" : "#111B21",
            fontWeight: 600,
          }}
        >
          {conversation.username.slice(0, 1).toUpperCase()}
        </Avatar>
      </Badge>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography component="span" variant="body1" noWrap sx={{ fontWeight: 600 }}>
          {conversation.username}
        </Typography>
        <Typography
          component="span"
          variant="body2"
          color={conversation.isOnline ? "success.main" : "text.secondary"}
          sx={{ display: "block", mt: 0.25 }}
        >
          {status}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export default ConversationItem;
