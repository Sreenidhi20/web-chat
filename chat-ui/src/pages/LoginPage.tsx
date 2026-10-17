import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ChatIcon from "../components/ChatIcon.tsx";
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
  const [showPassword, setShowPassword] = useState(false);

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
        minHeight: "100dvh",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflowY: "auto",
      }}
    >
      <Box
        component="header"
        sx={{
          minHeight: { xs: 225, sm: 270 },
          px: 3,
          pt: { xs: 4, sm: 5 },
          color: "primary.contrastText",
          bgcolor: "primary.dark",
          backgroundImage:
            "radial-gradient(circle at 88% 12%, rgba(255,255,255,0.12) 0 95px, transparent 96px), radial-gradient(circle at 78% 72%, rgba(255,255,255,0.07) 0 150px, transparent 151px)",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ maxWidth: 1040, mx: "auto", alignItems: "center" }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(255,255,255,0.42)",
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.12)",
              fontSize: 21,
              fontWeight: 700,
            }}
          >
            W
          </Box>
          <Box>
            <Typography component="p" variant="h6" sx={{ fontWeight: 700 }}>
              Web Chat
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
              A little closer, wherever you are.
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          flex: "1 0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          mt: { xs: -10, sm: -12 },
          pb: 5,
        }}
      >
        <Paper
          component="section"
          aria-labelledby="auth-heading"
          elevation={0}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 4.5 },
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            boxShadow: (theme) => theme.shadows[5],
          }}
        >
          <Stack spacing={2.75}>
            <Box>
              <Typography
                id="auth-heading"
                component="h1"
                variant="h4"
                sx={{ fontWeight: 700, letterSpacing: "-0.025em" }}
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
                    type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              onClick={() =>
                                setShowPassword((visible) => !visible)
                              }
                              edge="end"
                              disabled={isSubmitting}
                            >
                              <ChatIcon
                                name={showPassword ? "visibilityOff" : "visibility"}
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
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
