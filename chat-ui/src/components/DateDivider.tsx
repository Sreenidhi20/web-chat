import { Box, Chip } from "@mui/material";

function DateDivider({ label }: { label: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 1.25 }}>
      <Chip
        label={label}
        size="small"
        sx={{
          px: 0.75,
          bgcolor: "background.paper",
          color: "text.secondary",
          fontWeight: 500,
          boxShadow: (theme) => theme.shadows[1],
        }}
      />
    </Box>
  );
}

export default DateDivider;
