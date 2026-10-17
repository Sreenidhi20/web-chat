# Web Chat frontend

This directory contains the React, TypeScript, and Vite frontend for the Web Chat application. It uses MUI for the interface and integrates with the backend over REST and an authenticated WebSocket.

## Quick start

```powershell
npm ci
Copy-Item .env.example .env
# Edit .env and set backend_api to the public backend base URL.
npm run dev
```

The `backend_api` value is compiled into the browser bundle. It must be a public HTTP(S) URL and must not contain credentials or secrets. Local browser access to the deployed backend may be blocked by CORS; see the integration notes before diagnosing that as an application failure.

## Screenshots and responsive layout

The interface uses a single-pane navigation below 900px and a centered, two-pane workspace on desktop. The following describes the intended rendered layout at representative viewport widths in both color modes:

| Viewport | Light mode | Dark mode |
|---|---|---|
| 375px | Full-screen contacts home with search, signed-in profile/actions, and online-first rows. Opening a contact replaces the list with the conversation; a back arrow returns to contacts and the composer remains pinned at the bottom. | The same single-pane navigation with dark panels, readable contact status, dark message wallpaper, and contrasting sent/received bubbles. |
| 768px | Still uses single-pane navigation (the breakpoint is 900px), with more room for the contact rows and message bubbles. | Same mobile navigation and dimensions using the dark palette; the color-mode choice is retained. |
| 1440px | Full-height two-pane layout: 320–420px contact sidebar, chat wallpaper, grouped bubbles, centered date chips, and a bottom composer. | The same desktop structure with the dark sidebar/header, dark wallpaper, dark received bubbles, and teal-green sent bubbles. |

No real user or conversation data is included in screenshots or examples. The browser UI should be checked with test accounts after configuring backend CORS; mocked automated tests do not establish live backend connectivity.

## Project documentation

- [Development and local commands](../.github/docs/DEVELOPMENT.md)
- [Architecture](../.github/docs/ARCHITECTURE.md)
- [Backend integration and limitations](../.github/docs/FRONTEND-INTEGRATION.md)
- [CI workflow](../.github/docs/CI-CD.md)
- [Architecture decisions](../.github/docs/DECISIONS.md)
- [Implementation history](../.github/docs/IMPLEMENTATION-LOG.md)
