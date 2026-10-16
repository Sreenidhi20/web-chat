import type { ChatMessage } from "../types/chat.ts";
import type {
  ApiErrorDetail,
  ApiUser,
  Credentials,
  LoginResponse,
  RegisteredUser,
  RequestOptions,
  ValidationError,
} from "../types/api.ts";

export class ApiError extends Error {
  readonly status: number | null;
  readonly detail: ApiErrorDetail;

  constructor(
    message: string,
    status: number | null,
    detail: ApiErrorDetail = null,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

export class ApiContractError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiContractError";
  }
}

function getBaseUrl(): string {
  const configuredUrl = __BACKEND_API_BASE_URL__.trim();

  if (!configuredUrl) {
    throw new ApiConfigurationError(
      "The backend API URL is not configured. Set backend_api in the frontend environment.",
    );
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new ApiConfigurationError(
      "The configured backend API URL is invalid.",
    );
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password
  ) {
    throw new ApiConfigurationError(
      "The backend API URL must use HTTP or HTTPS and must not include credentials.",
    );
  }

  return url.toString().replace(/\/+$/, "");
}

function buildUrl(path: string): string {
  return `${getBaseUrl()}/${path}`;
}

export function buildWebSocketUrl(accessToken: string): string {
  const token = validateToken(accessToken);
  const url = new URL(`${getBaseUrl()}/ws`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", token);
  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number" && value > 0;
}

function parseValidationErrors(value: unknown): ValidationError[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const errors: ValidationError[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      !Array.isArray(item.loc) ||
      !item.loc.every(
        (part) => typeof part === "string" || typeof part === "number",
      ) ||
      typeof item.msg !== "string" ||
      typeof item.type !== "string"
    ) {
      return null;
    }

    errors.push({ loc: item.loc, msg: item.msg, type: item.type });
  }

  return errors;
}

function readErrorDetail(value: unknown): ApiErrorDetail {
  if (!isRecord(value) || !("detail" in value)) {
    return null;
  }

  if (typeof value.detail === "string") {
    return value.detail;
  }

  return parseValidationErrors(value.detail);
}

function errorMessage(detail: ApiErrorDetail, status: number): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map(({ loc, msg }) => {
        const field = loc.filter((part) => part !== "body").join(".");
        return field ? `${field}: ${msg}` : msg;
      })
      .join("; ");
  }

  return `The chat service returned an error (${status}).`;
}

function parseUser(value: unknown, context: string): ApiUser {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    typeof value.username !== "string"
  ) {
    throw new ApiContractError(`The chat service returned an invalid ${context}.`);
  }

  return { id: value.id, username: value.username };
}

function parseLoginResponse(value: unknown): LoginResponse {
  if (
    !isRecord(value) ||
    typeof value.access_token !== "string" ||
    value.access_token.length === 0 ||
    value.token_type !== "bearer" ||
    !isPositiveInteger(value.user_id)
  ) {
    throw new ApiContractError(
      "The chat service returned an invalid login response.",
    );
  }

  return {
    access_token: value.access_token,
    token_type: "bearer",
    user_id: value.user_id,
  };
}

function parseMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    throw new ApiContractError(
      "The chat service returned an invalid message history.",
    );
  }

  return value.map((item) => {
    if (
      !isRecord(item) ||
      !isPositiveInteger(item.id) ||
      !isPositiveInteger(item.sender_id) ||
      !isPositiveInteger(item.receiver_id) ||
      typeof item.content !== "string" ||
      typeof item.sent_at !== "string"
    ) {
      throw new ApiContractError(
        "The chat service returned an invalid message.",
      );
    }

    return {
      id: item.id,
      sender_id: item.sender_id,
      receiver_id: item.receiver_id,
      content: item.content,
      sent_at: item.sent_at,
    };
  });
}

function validateToken(token: string): string {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new ApiConfigurationError(
      "A valid access token is required for this request.",
    );
  }

  return normalizedToken;
}

function validateUserId(userId: number, name: string): void {
  if (!isPositiveInteger(userId)) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

async function request<T>(
  path: string,
  options: RequestOptions & {
    token?: string;
    method?: "GET" | "POST";
    body?: unknown;
  },
  parse: (value: unknown) => T,
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token !== undefined) {
    headers.set("Authorization", `Bearer ${validateToken(options.token)}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }

    throw new ApiError(
      "Unable to reach the chat service. Check your connection and try again.",
      null,
      null,
      { cause },
    );
  }

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch (cause) {
      if (response.ok) {
        throw new ApiContractError(
          "The chat service returned malformed JSON.",
          { cause },
        );
      }
    }
  }

  if (!response.ok) {
    const detail = readErrorDetail(payload);
    throw new ApiError(errorMessage(detail, response.status), response.status, detail);
  }

  return parse(payload);
}

function validateCredentials(credentials: Credentials): void {
  if (credentials.username.trim().length === 0) {
    throw new RangeError("Username cannot be blank.");
  }
  if (credentials.password.length === 0) {
    throw new RangeError("Password cannot be blank.");
  }
}

export function registerUser(
  credentials: Credentials,
  options: RequestOptions = {},
): Promise<RegisteredUser> {
  validateCredentials(credentials);

  return request(
    "register",
    { ...options, method: "POST", body: credentials },
    (value) => parseUser(value, "registration response"),
  );
}

export function login(
  credentials: Credentials,
  options: RequestOptions = {},
): Promise<LoginResponse> {
  validateCredentials(credentials);

  return request(
    "login",
    { ...options, method: "POST", body: credentials },
    parseLoginResponse,
  );
}

export function listUsers(
  token: string,
  options: RequestOptions = {},
): Promise<ApiUser[]> {
  return request(
    "users",
    { ...options, token },
    (value) => {
      if (!Array.isArray(value)) {
        throw new ApiContractError("The chat service returned an invalid user list.");
      }

      return value.map((user) => parseUser(user, "user"));
    },
  );
}

export function getOnlineUsers(
  token: string,
  options: RequestOptions = {},
): Promise<number[]> {
  return request(
    "online-users",
    { ...options, token },
    (value) => {
      if (
        !isRecord(value) ||
        !Array.isArray(value.online_user_ids) ||
        !value.online_user_ids.every(isPositiveInteger)
      ) {
        throw new ApiContractError(
          "The chat service returned an invalid online-user list.",
        );
      }

      return value.online_user_ids;
    },
  );
}

export function getMessageHistory(
  token: string,
  userId: number,
  otherUserId: number,
  options: RequestOptions = {},
): Promise<ChatMessage[]> {
  validateUserId(userId, "userId");
  validateUserId(otherUserId, "otherUserId");

  return request(
    `messages/${userId}/${otherUserId}`,
    { ...options, token },
    parseMessages,
  );
}
