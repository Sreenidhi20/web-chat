# Frontend architecture

## Overview

The frontend is a single-page React application in [`chat-ui/`](../../chat-ui/). It uses TypeScript, Vite, and Material UI (MUI). The browser communicates with the chat backend through a typed REST client for account, user, presence, and history operations, and through one authenticated WebSocket for live messages.

The accepted integration reference is [`FRONTEND_PLAN.md`](../prompts/FRONTEND_PLAN.md). The application documents the backend behavior it actually uses in [Frontend integration](./FRONTEND-INTEGRATION.md).

## Source layout

```text
chat-ui/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme.ts
│   ├── components/
│   │   ├── AppHeader.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── Sidebar.tsx
│   ├── context/
│   │   ├── auth.ts
│   │   ├── AuthContext.tsx
│   │   └── useAuth.ts
│   ├── hooks/
│   │   ├── useChatSocket.ts
│   │   └── usePresence.ts
│   ├── pages/
│   │   ├── ChatPage.tsx
│   │   └── LoginPage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── test/
│   │   └── setup.ts
│   └── types/
│       ├── api.ts
│       └── chat.ts
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

## Responsibilities

- [`main.tsx`](../../chat-ui/src/main.tsx) initializes React, MUI theming, and the authentication provider.
- [`App.tsx`](../../chat-ui/src/App.tsx) selects the login or authenticated chat page based on the in-memory session. It remains a small route selector rather than owning workspace behavior.
- [`AuthContext.tsx`](../../chat-ui/src/context/AuthContext.tsx) owns authentication, registration, and logout operations. [`useAuth.ts`](../../chat-ui/src/context/useAuth.ts) provides guarded access to that context.
- [`LoginPage.tsx`](../../chat-ui/src/pages/LoginPage.tsx) presents sign-in and registration forms and renders user-facing request errors.
- [`ChatPage.tsx`](../../chat-ui/src/pages/ChatPage.tsx) coordinates authenticated REST requests, conversation selection, history, optimistic messages, presence, and socket events.
- [`Sidebar.tsx`](../../chat-ui/src/components/Sidebar.tsx) renders contacts, loading and error states, and presence errors. [`ConversationItem.tsx`](../../chat-ui/src/components/ConversationItem.tsx) renders one selectable contact.
- [`ChatWindow.tsx`](../../chat-ui/src/components/ChatWindow.tsx) renders conversation status, history states, socket status, and the message composer. [`MessageBubble.tsx`](../../chat-ui/src/components/MessageBubble.tsx) renders an individual message, including its pending-history-sync state. [`MessageInput.tsx`](../../chat-ui/src/components/MessageInput.tsx) owns the form-level submission behavior and delegates draft state to its parent.
- [`useChatSocket.ts`](../../chat-ui/src/hooks/useChatSocket.ts) creates and cleans up the authenticated WebSocket, validates incoming frames, exposes connection status, and sends messages only when connected.
- [`usePresence.ts`](../../chat-ui/src/hooks/usePresence.ts) refreshes online-user IDs on a 30-second interval.
- [`api.ts`](../../chat-ui/src/services/api.ts) owns REST URL construction, authentication headers, request/error handling, and runtime response validation. It also constructs the WebSocket URL.
- [`types/`](../../chat-ui/src/types/) contains the API and chat data contracts used by the service, hooks, and UI.

## State management and data flow

There is no external state-management library. Authentication is shared through React context; chat state is local to `ChatPage`; presentation components receive typed props.

1. A user submits credentials in `LoginPage`. `AuthContext` calls the API service, which validates the response, then holds the access token, user ID, and username in memory.
2. `App` renders `ChatPage` for an authenticated session. The page loads contacts and opens the authenticated socket. `usePresence` separately polls online-user IDs.
3. Selecting a contact starts an abortable history request. The page ignores results after the request is cancelled, preventing stale responses from replacing the selected conversation.
4. Submitting a message sends `{ to, message }` over the open socket. Since the backend does not acknowledge successful live delivery to the sender, the page immediately renders an optimistic pending message.
5. The recipient receives a server message frame. The sender's pending message is later reconciled against fetched history by sender, recipient, exact content, and a five-minute timestamp window.
6. A server `info` frame is shown as a global notice and triggers a history refresh for the selected conversation.

## Integration boundaries

The REST service and socket hook are the only modules that construct backend requests. UI components do not issue `fetch` calls or parse backend payloads. Runtime validation at this boundary converts unknown JSON into typed application data or raises a typed API/contract error.

The backend URL is configured at Vite build time; see [Development setup](./DEVELOPMENT.md). The application does not contain deployment logic.

## Error handling

- The API client distinguishes HTTP errors (`ApiError`), malformed or unexpected backend responses (`ApiContractError`), and invalid or missing backend URL configuration (`ApiConfigurationError`).
- FastAPI-style `detail` strings and validation-error arrays are converted into readable messages. Network failures are reported separately from HTTP failures.
- Abort errors are allowed to propagate so components can discard cancelled work without showing a spurious failure.
- A protected-request `401` ends the current in-memory session and returns the user to sign-in. Other request failures are shown near the relevant contacts, conversation, or composer with a retry where one is supported.
- Socket connection and frame errors are surfaced in the chat window. Socket reconnection is manual; messages are not automatically resent.

## Architectural trade-offs

- Keeping the session in memory avoids persistent browser storage for the JWT, but a reload requires the user to sign in again.
- A typed `fetch` client and runtime parsers avoid a separate HTTP dependency and catch backend contract drift at the boundary; new endpoints must be added explicitly.
- Chat state is deliberately page-local because the current product is a single authenticated chat view. It would need reconsideration if state must be shared across routes.
- Optimistic messages provide immediate feedback without a sender echo or client correlation ID. The time-window reconciliation is best-effort; identical messages close together can be ambiguous.
- The offline `info` frame has no conversation identifier, so its notice is global and cannot be safely assigned to a particular conversation.
- Presence uses 30-second polling instead of a separate streaming channel, trading immediacy for a simple backend integration.
- Automated integration tests mock REST and WebSocket behavior. They do not replace a live-backend browser test; local browser requests to the deployed backend have been blocked by CORS.
