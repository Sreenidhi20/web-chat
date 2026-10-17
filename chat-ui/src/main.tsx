import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ColorModeProvider } from "./context/ColorModeContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorModeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ColorModeProvider>
  </StrictMode>,
);
