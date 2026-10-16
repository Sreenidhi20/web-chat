import { IconButton, Paper, TextField } from "@mui/material";
import type { FormEvent } from "react";

interface MessageInputProps {
  disabled: boolean;
  canSend: boolean;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

function MessageInput({
  disabled,
  canSend,
  placeholder,
  value,
  onChange,
  onSend,
}: MessageInputProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  }

  return (
    <Paper
      component="form"
      aria-label="Message composer"
      elevation={0}
      onSubmit={handleSubmit}
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
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{ htmlInput: { "aria-label": "Message" } }}
        variant="standard"
      />
      <IconButton
        type="submit"
        color="primary"
        aria-label="Send message"
        disabled={!canSend || value.trim().length === 0}
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
