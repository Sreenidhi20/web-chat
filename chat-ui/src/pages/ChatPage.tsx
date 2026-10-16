import { Box, Container, Paper, Stack, Typography } from "@mui/material";

function ChatPage() {
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
        <Paper
          component="section"
          aria-labelledby="workspace-title"
          elevation={0}
          sx={{
            flexGrow: 1,
            minHeight: { xs: "65vh", md: "min(700px, calc(100vh - 170px))" },
            display: "grid",
            placeItems: "center",
            p: { xs: 3, sm: 6 },
            border: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            spacing={1.5}
            sx={{ alignItems: "center", textAlign: "center", maxWidth: 480 }}
          >
            <Typography
              id="workspace-title"
              component="h1"
              variant="h4"
              sx={{ fontWeight: 700 }}
            >
              Your chat workspace
            </Typography>
            <Typography color="text.secondary">
              Sign-in, conversations, and messaging will be connected in the
              next implementation milestones.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default ChatPage;
