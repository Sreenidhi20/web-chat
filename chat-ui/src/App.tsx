import ChatPage from "./pages/ChatPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import { useAuth } from "./context/useAuth.ts";

function App() {
  const { session } = useAuth();
  return session ? <ChatPage /> : <LoginPage />;
}

export default App;
