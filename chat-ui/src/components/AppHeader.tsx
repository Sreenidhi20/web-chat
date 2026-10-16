import { Box, Button, Container, Stack, Typography } from "@mui/material";

interface AppHeaderProps {
  username?: string;
  onLogout?: () => void;
}

function AppHeader({ username, onLogout }: AppHeaderProps) {
  return (
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
          sx={{ py: 2, alignItems: "center", justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
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
          {username && onLogout && (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                Signed in as {username}
              </Typography>
              <Button onClick={onLogout} variant="outlined" size="small">
                Sign out
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default AppHeader;
