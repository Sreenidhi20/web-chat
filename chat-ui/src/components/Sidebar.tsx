import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import ConversationItem from "./ConversationItem.tsx";
import type { Conversation } from "../types/chat.ts";

interface SidebarProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading: boolean;
  error: string | null;
  presenceError: string | null;
  onRetry: () => void;
}

function Sidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
  error,
  presenceError,
  onRetry,
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
      {presenceError && (
        <Alert severity="warning" sx={{ m: 1.5 }}>
          Online status could not be refreshed: {presenceError}
        </Alert>
      )}
      {error ? (
        <Stack spacing={1} sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
          <Button onClick={onRetry} size="small" variant="outlined">
            Retry loading contacts
          </Button>
        </Stack>
      ) : isLoading ? (
        <Typography
          role="status"
          color="text.secondary"
          variant="body2"
          sx={{ px: 2, py: 2.5 }}
        >
          Loading contacts…
        </Typography>
      ) : conversations.length > 0 ? (
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
          No other users are available yet.
        </Typography>
      )}
    </Paper>
  );
}

export default Sidebar;
