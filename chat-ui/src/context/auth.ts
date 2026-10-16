import { createContext } from "react";
import type { Credentials } from "../types/api.ts";

export interface AuthSession {
  accessToken: string;
  userId: number;
  username: string;
}

export interface AuthContextValue {
  session: AuthSession | null;
  authenticate: (credentials: Credentials) => Promise<void>;
  createAccount: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
