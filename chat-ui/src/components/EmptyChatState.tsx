import { Box, Paper, Stack, Typography } from "@mui/material";
import ChatIcon from "./ChatIcon.tsx";

function EmptyChatState() {
  return (
    <Stack
      sx={{
        m: "auto",
        maxWidth: 440,
        px: 3,
        py: 5,
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 76,
          height: 76,
          mb: 2.5,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: "background.paper",
          color: "primary.main",
          boxShadow: (theme) => theme.shadows[1],
        }}
      >
        <ChatIcon name="chat" sx={{ fontSize: 38 }} />
      </Paper>
      <Typography component="h2" variant="h5" sx={{ fontWeight: 500 }}>
        Web Chat
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
        Choose a conversation to pick up where you left off, or start a new one
        from your contacts.
      </Typography>
      <Box sx={{ width: 48, height: 2, mt: 3, bgcolor: "primary.main", opacity: 0.45 }} />
    </Stack>
  );
}

export default EmptyChatState;
