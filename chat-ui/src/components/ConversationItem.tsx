import { Avatar, Badge, Box, ButtonBase, Typography } from "@mui/material";
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
  return (
    <ButtonBase
      component="button"
      onClick={() => onSelect(conversation)}
      aria-current={isSelected ? "true" : undefined}
      sx={{
        display: "flex",
        width: "100%",
        justifyContent: "flex-start",
        gap: 1.5,
        px: 2,
        py: 1.5,
        textAlign: "left",
        bgcolor: isSelected ? "action.selected" : "transparent",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Badge
        overlap="circular"
        variant="dot"
        color={conversation.isOnline ? "success" : "default"}
        invisible={!conversation.isOnline}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Avatar aria-hidden="true">
          {conversation.username.slice(0, 1).toUpperCase()}
        </Avatar>
      </Badge>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          variant="body1"
          noWrap
          sx={{ fontWeight: 600 }}
        >
          {conversation.username}
        </Typography>
        <Typography
          component="span"
          variant="body2"
          color={conversation.isOnline ? "success.main" : "text.secondary"}
          sx={{ display: "block" }}
        >
          {conversation.isOnline ? "Online" : "Offline"}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export default ConversationItem;
