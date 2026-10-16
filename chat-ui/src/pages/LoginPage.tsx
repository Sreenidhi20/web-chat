import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AppHeader from "../components/AppHeader.tsx";
import { ApiError, ApiConfigurationError } from "../services/api.ts";
import { useAuth } from "../context/useAuth.ts";

type AuthMode = "login" | "register";

function LoginPage() {
  const { authenticate, createAccount } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    const credentials = { username: username.trim(), password };

    try {
      if (mode === "login") {
        await authenticate(credentials);
      } else {
        await createAccount(credentials);
        setMode("login");
        setPassword("");
        setNotice("Account created. Sign in with your new credentials.");
      }
    } catch (cause) {
      if (cause instanceof ApiError || cause instanceof ApiConfigurationError) {
        setError(cause.message);
      } else if (cause instanceof RangeError) {
        setError(cause.message);
      } else {
        setError("Unable to complete your request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <AppHeader />
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          flexGrow: 1,
          display: "grid",
          placeItems: "center",
          py: { xs: 3, sm: 5 },
        }}
      >
        <Paper
          component="section"
          aria-labelledby="auth-heading"
          elevation={0}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 5 },
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography
                id="auth-heading"
                component="h1"
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                {isLogin ? "Welcome back" : "Create your account"}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {isLogin
                  ? "Sign in with your username to open your chats."
                  : "Choose a username and password to get started."}
              </Typography>
            </Box>

            {notice && <Alert severity="success">{notice}</Alert>}
            {error && (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  autoComplete="username"
                  autoFocus
                  fullWidth
                  label="Username"
                  name="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isSubmitting}
                />
                <TextField
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  fullWidth
                  label="Password"
                  name="password"
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={
                    isSubmitting ||
                    username.trim().length === 0 ||
                    password.length === 0
                  }
                >
                  {isSubmitting
                    ? "Please wait…"
                    : isLogin
                      ? "Sign in"
                      : "Create account"}
                </Button>
                <Button
                  type="button"
                  variant="text"
                  disabled={isSubmitting}
                  onClick={() => {
                    setMode(isLogin ? "register" : "login");
                    setError(null);
                    setNotice(null);
                  }}
                >
                  {isLogin
                    ? "Need an account? Create one"
                    : "Already have an account? Sign in"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
