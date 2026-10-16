# Frontend/backend integration

This document describes the backend contract as used by the frontend. The accepted source reference is [`FRONTEND_PLAN.md`](../prompts/FRONTEND_PLAN.md); this document records implementation details and limitations without copying the full plan.

## Backend URL

The frontend reads the lowercase `backend_api` environment variable through Vite and compiles its value into `__BACKEND_API_BASE_URL__`. The value must be an absolute HTTP or HTTPS base URL and must not contain URL credentials. A trailing slash is removed when requests are built.

The URL is public configuration included in the browser bundle. Do not put credentials, API keys, JWTs, or other secrets in it. See [Development setup](./DEVELOPMENT.md) for local configuration and the CI placeholder.

Relevant files:

- [`vite.config.ts`](../../chat-ui/vite.config.ts) defines the build-time value.
- [`api.ts`](../../chat-ui/src/services/api.ts) validates the URL and implements REST requests and WebSocket URL construction.
- [`useChatSocket.ts`](../../chat-ui/src/hooks/useChatSocket.ts) manages the browser socket.

## REST endpoints

| Operation | Request | Authentication | Frontend behavior |
|---|---|---|---|
| Register | `POST /register` with JSON `{ "username": "...", "password": "..." }` | None | Validates `{ id, username }`; returns to sign-in with a success notice. |
| Sign in | `POST /login` with JSON `{ "username": "...", "password": "..." }` | None | Validates `access_token`, `token_type: "bearer"`, and `user_id`; stores them in memory. |
| List contacts | `GET /users` | `Authorization: Bearer <access-token>` | Validates an array of `{ id, username }` and excludes the current user from the displayed list. |
| Online users | `GET /online-users` | `Authorization: Bearer <access-token>` | Validates `{ online_user_ids: number[] }`; refreshed every 30 seconds. |
| Conversation history | `GET /messages/{user_id}/{other_user_id}` | `Authorization: Bearer <access-token>` | Validates message IDs, sender/recipient IDs, content, and parseable timestamps. Supports aborting stale requests. |

Protected-request `401` responses end the current session and return the user to sign-in. Other HTTP errors use the backend `detail` string or validation-error array when available. Network, malformed JSON, and response-contract failures are surfaced as distinct errors by the API service.

## Authentication lifecycle

The token is kept only in React memory by [`AuthContext.tsx`](../../chat-ui/src/context/AuthContext.tsx). It is sent in the bearer authorization header for protected REST calls. The token is not persisted across reloads; after a reload the user signs in again.

Logout clears the in-memory session. A `401` from protected contacts, presence, or history requests also logs out. The frontend has no refresh-token flow.

## WebSocket and message behavior

After sign-in, [`useChatSocket.ts`](../../chat-ui/src/hooks/useChatSocket.ts) connects to `/ws?token=<access-token>`. HTTPS API URLs are converted to WSS; HTTP URLs are converted to WS. The backend contract requires the JWT in the query string, so infrastructure must avoid logging this URL or its query string.

Outgoing frames have the shape:

```json
{
  "to": 2,
  "message": "Hello"
}
```

Incoming delivered-message frames have the shape:

```json
{
  "id": 15,
  "from": 2,
  "message": "Hello",
  "sent_at": "2026-10-03T12:05:00"
}
```

An offline-delivery information frame has the shape:

```json
{
  "info": "Recipient is offline"
}
```

The exact human-readable `info` value is supplied by the backend. The application renders it as a global notice because the frame contains no conversation ID, and triggers a refresh of the currently selected conversation.

The sender does **not** receive a delivered-message echo. After `WebSocket.send` accepts a frame locally, the frontend renders an optimistic bubble marked as awaiting history sync. History refresh reconciles it against server messages using sender, recipient, exact message content, and a five-minute timestamp window. The backend supplies no client message ID, so this is best-effort and cannot reliably disambiguate identical messages sent close together.

Socket reconnect is manual. The frontend never automatically resends an outgoing message after reconnecting. The composer is enabled only when a conversation is selected and the socket is connected. Incoming frames are validated before use, and live incoming messages are applied only to the selected conversation; the page refreshes history afterward to reconcile server state.

## Known limitations and troubleshooting

- **Local browser CORS failure:** The deployed backend has blocked requests from the local frontend origin. This is not worked around by the frontend. Use the mocked test suite for local validation and configure an approved backend CORS policy or same-origin proxy before attempting live browser verification.
- **No sender acknowledgement:** A pending outgoing message means the client sent the WebSocket frame locally; it is not proof of recipient delivery. Refresh history to reconcile persisted server state.
- **Ambiguous optimistic reconciliation:** Identical content to the same recipient within the five-minute matching window can be matched ambiguously. Do not add automatic resend without a backend idempotency/correlation contract.
- **Offline notice is global:** The current info frame has no conversation identifier, so the notice cannot be assigned to a specific chat.
- **WebSocket keeps closing:** Check the backend URL scheme, the browser's network console, the query-token contract, and the backend's CORS/origin or proxy configuration. Never paste a real token into logs or support output.
- **API URL errors:** Confirm `backend_api` is an absolute HTTP(S) URL and rebuild/restart Vite after changing it.
- **Expired login:** Any protected-request `401` returns to the login screen; sign in again.

Automated API and UI tests mock the backend and WebSocket. They verify frontend handling but do not establish that the deployed backend or browser-origin policy is working.
