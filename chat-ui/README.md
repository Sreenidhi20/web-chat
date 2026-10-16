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

## Project documentation

- [Development and local commands](../.github/docs/DEVELOPMENT.md)
- [Architecture](../.github/docs/ARCHITECTURE.md)
- [Backend integration and limitations](../.github/docs/FRONTEND-INTEGRATION.md)
- [CI workflow](../.github/docs/CI-CD.md)
- [Architecture decisions](../.github/docs/DECISIONS.md)
- [Implementation history](../.github/docs/IMPLEMENTATION-LOG.md)
