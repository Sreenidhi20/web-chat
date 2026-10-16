export interface Credentials {
  username: string;
  password: string;
}

export interface RegisteredUser {
  id: number;
  username: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user_id: number;
}

export type ApiUser = RegisteredUser;

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export type ApiErrorDetail = string | ValidationError[] | null;

export interface RequestOptions {
  signal?: AbortSignal;
}
