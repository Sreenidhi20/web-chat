import { IconButton, Paper, TextField } from "@mui/material";

interface MessageInputProps {
  disabled: boolean;
}

function MessageInput({ disabled }: MessageInputProps) {
  return (
    <Paper
      component="div"
      role="group"
      aria-label="Message composer"
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <TextField
        fullWidth
        disabled={disabled}
        placeholder="Sign in to send a message"
        slotProps={{ htmlInput: { "aria-label": "Message" } }}
        variant="standard"
      />
      <IconButton
        type="submit"
        color="primary"
        aria-label="Send message"
        disabled={disabled}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
        >
          <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </IconButton>
    </Paper>
  );
}

export default MessageInput;
