import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest, registerUser } from "../services/api.ts";
import type { Credentials, LoginResponse } from "../types/api.ts";
import { AuthContext, type AuthSession } from "./auth.ts";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  const authenticate = useCallback(async (credentials: Credentials) => {
    const response: LoginResponse = await loginRequest(credentials);
    setSession({
      accessToken: response.access_token,
      userId: response.user_id,
      username: credentials.username.trim(),
    });
  }, []);

  const createAccount = useCallback(async (credentials: Credentials) => {
    await registerUser(credentials);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, authenticate, createAccount, logout }),
    [session, authenticate, createAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
