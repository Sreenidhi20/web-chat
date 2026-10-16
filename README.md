# Web Chat

A real-time, one-to-one chat application. The repository contains the React frontend in [`chat-ui/`](./chat-ui/) and integrates with a separate backend over HTTP and WebSockets.

## What it does

- Register and sign in with a username and password.
- Browse registered users and see their online status.
- Load previous messages and chat with a selected contact.
- Exchange messages in real time through an authenticated WebSocket connection.

## How the frontend connects to the backend

The frontend reads `backend_api` at build time. Set it to the backend's public HTTP(S) base URL; the value is compiled into browser code, so **never put credentials, API keys, or tokens in it**.

After a successful `POST /login`, the frontend keeps the returned JWT in memory. It uses that token as a bearer credential for protected REST calls:

- `GET /users` loads the contacts.
- `GET /online-users` refreshes presence every 30 seconds.
- `GET /messages/{user_id}/{other_user_id}` loads the selected conversation's history.

At sign-in, the frontend also opens a WebSocket to `/ws?token=<jwt>` (using `wss://` when the backend URL is HTTPS). When a user sends a message, the browser sends this JSON frame over the socket:

```json
{
  "to": 2,
  "message": "Hello!"
}
```

The backend routes the message to its recipient. A delivered-message frame is sent **to the recipient**, not echoed to the sender. The UI therefore displays the sender's message optimistically after the socket accepts the send, marks it as awaiting history sync, and reconciles it when history is refreshed. Incoming frames are validated and displayed in the matching open conversation. If the recipient is offline, the backend may return an informational `info` frame; the UI shows it as a global notice and refreshes the currently selected history.

The WebSocket token is in the connection query string because that is the backend contract. Ensure backend/proxy/access logs do not expose query strings containing tokens. The frontend supports manual reconnect and does not automatically resend messages.

## Run locally

Prerequisites: Node.js 22.x and npm.

```powershell
cd chat-ui
npm ci
Copy-Item .env.example .env
# Edit .env and set backend_api to the backend's public base URL.
npm run dev
```

Useful checks, from `chat-ui/`:

```powershell
npm run lint
npm test
npm run build
```

Tests use mocked REST and WebSocket services; they do not require live backend credentials. The backend must permit the frontend's browser origin for live REST and WebSocket use. Local browser integration has previously been blocked by CORS, so a successful frontend build does not by itself prove a live backend connection.

## Project guides

- [Frontend development](./.github/docs/DEVELOPMENT.md)
- [Architecture](./.github/docs/ARCHITECTURE.md)
- [Backend integration details and limitations](./.github/docs/FRONTEND-INTEGRATION.md)
- [CI workflow](./.github/docs/CI-CD.md)
- [Architecture decisions](./.github/docs/DECISIONS.md)
- [Implementation history](./.github/docs/IMPLEMENTATION-LOG.md)

Frontend CI is defined in [`.github/workflows/FE-CI.yml`](./.github/workflows/FE-CI.yml). It checks pushes to `develop` and pull requests targeting `develop`; it does not deploy the application.
