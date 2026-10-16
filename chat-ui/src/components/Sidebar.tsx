import {
  Box,
  Divider,
  List,
  ListItem,
  Paper,
  Typography,
} from "@mui/material";
import ConversationItem from "./ConversationItem.tsx";
import type { Conversation } from "../types/chat.ts";

interface SidebarProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (conversation: Conversation) => void;
}

function Sidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: SidebarProps) {
  return (
    <Paper
      component="aside"
      square
      elevation={0}
      aria-labelledby="conversations-heading"
      sx={{
        minWidth: 0,
        borderRight: { md: 1 },
        borderBottom: { xs: 1, md: 0 },
        borderColor: "divider",
      }}
    >
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          id="conversations-heading"
          component="h2"
          variant="h6"
          sx={{ fontWeight: 700 }}
        >
          Conversations
        </Typography>
      </Box>
      <Divider />
      {conversations.length > 0 ? (
        <List disablePadding>
          {conversations.map((conversation) => (
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
          sx={{ px: 2, py: 2.5 }}
        >
          Contacts will appear here after you sign in.
        </Typography>
      )}
    </Paper>
  );
}

export default Sidebar;
