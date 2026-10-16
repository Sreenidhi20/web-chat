import { useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import ChatWindow from "../components/ChatWindow.tsx";
import Sidebar from "../components/Sidebar.tsx";
import type { ChatMessage, Conversation } from "../types/chat.ts";

function ChatPage() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const conversations: Conversation[] = [];
  const messages: ChatMessage[] = [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Box
        component="header"
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ py: 2, alignItems: "center" }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 38,
                height: 38,
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 700,
              }}
            >
              W
            </Box>
            <Typography component="p" variant="h6" sx={{ fontWeight: 700 }}>
              Web Chat
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container
        component="main"
        maxWidth="xl"
        sx={{ flexGrow: 1, display: "flex", py: { xs: 2, sm: 3, md: 5 } }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" },
            flexGrow: 1,
            minHeight: { xs: "70vh", md: "min(700px, calc(100vh - 170px))" },
            overflow: "hidden",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Sidebar
            conversations={conversations}
            selectedConversationId={selectedConversation?.id ?? null}
            onSelectConversation={setSelectedConversation}
          />
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUserId={null}
          />
        </Box>
      </Container>
    </Box>
  );
}

export default ChatPage;
