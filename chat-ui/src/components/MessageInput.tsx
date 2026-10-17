import { IconButton, Paper, TextField } from "@mui/material";
import type { FormEvent, KeyboardEvent } from "react";
import ChatIcon from "./ChatIcon.tsx";

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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (canSend) {
        onSend();
      }
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
        gap: 0.75,
        px: 1.25,
        py: 0.75,
        border: 1,
        borderColor: "divider",
        borderRadius: 4,
        bgcolor: "background.paper",
      }}
    >
      <TextField
        fullWidth
        multiline
        minRows={1}
        maxRows={6}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{
          htmlInput: {
            "aria-label": "Message",
            style: { lineHeight: 1.4, padding: "8px 0" },
            onKeyDown: handleKeyDown,
          },
        }}
        variant="standard"
        sx={{
          "& .MuiInput-root::before, & .MuiInput-root::after": { display: "none" },
          "& textarea": { resize: "none" },
        }}
      />
      <IconButton
        type="submit"
        aria-label="Send message"
        disabled={!canSend || value.trim().length === 0}
        sx={{
          flex: "0 0 auto",
          width: 42,
          height: 42,
          color: value.trim() ? "#FFFFFF" : "text.secondary",
          bgcolor: value.trim()
            ? (theme) =>
                theme.palette.mode === "dark" ? "#00745F" : "success.main"
            : "transparent",
          transition: "background-color 140ms ease, color 140ms ease",
          "&:hover": {
            bgcolor: value.trim()
              ? (theme) =>
                  theme.palette.mode === "dark" ? "#006052" : "success.dark"
              : "action.hover",
          },
          "&.Mui-disabled": {
            color: "action.disabled",
            bgcolor: "transparent",
          },
        }}
      >
        <ChatIcon name="send" />
      </IconButton>
    </Paper>
  );
}

export default MessageInput;
