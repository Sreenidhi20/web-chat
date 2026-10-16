# Architecture decision log

This log records implementation decisions that are evidenced by the frontend work and approved integration direction. Status is **Accepted** unless marked **Pending**.

## ADR-001 — React, TypeScript, Vite, and MUI

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** The frontend needed a maintainable, typed application structure and a responsive chat interface.
- **Options considered:** Continue with the starter page; introduce a separate UI framework; use the existing React/Vite setup and add MUI.
- **Decision:** Keep the existing React/TypeScript/Vite application and use MUI components and theme tokens for the interface.
- **Rationale:** This matched the existing toolchain while supporting reusable, accessible, responsive interface components.
- **Consequences and trade-offs:** MUI and its Emotion dependencies are part of the browser bundle; the design uses MUI components and `sx` styling rather than adding a second styling system.
- **Alternatives rejected:** Replacing the existing application scaffold or adding another component/styling framework.

## ADR-002 — Keep `App.tsx` as a route selector

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** Authentication and chat behavior would otherwise make the top-level application component too large.
- **Options considered:** Put workspace and data-fetching behavior into `App.tsx`; split the authenticated workspace into a page and keep the root component focused.
- **Decision:** `App.tsx` selects between `LoginPage` and `ChatPage`; authenticated chat coordination lives in `ChatPage`.
- **Rationale:** This was specifically requested during implementation and leaves room for additional screens without overloading the root component.
- **Consequences and trade-offs:** The chat page coordinates several related concerns; presentational components receive their state and handlers through props.
- **Alternatives rejected:** A monolithic root component.

## ADR-003 — Typed REST service with runtime response validation

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** Backend JSON is untrusted at runtime even when the frontend has TypeScript interfaces.
- **Options considered:** Call `fetch` from components; add an HTTP client dependency; centralize REST requests and parse responses at the service boundary.
- **Decision:** Use the shared typed `fetch` service in `src/services/api.ts`, with explicit request functions and runtime validation.
- **Rationale:** A single boundary keeps headers, URL construction, abort support, error mapping, and response validation consistent.
- **Consequences and trade-offs:** Each supported endpoint and response shape must be maintained in the service and types.
- **Alternatives rejected:** Duplicated component-level requests and an additional HTTP dependency.

## ADR-004 — Keep the JWT in memory

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** The backend returns a bearer JWT; the frontend needs it for protected requests and the WebSocket.
- **Options considered:** Persist the token in browser storage; keep session data only in the running React context.
- **Decision:** Store the token, user ID, and username in the in-memory authentication context only.
- **Rationale:** Avoid persisting the credential in local or session storage.
- **Consequences and trade-offs:** Refreshing the page or closing the tab loses the session and requires a new sign-in. The WebSocket contract requires the token in its query string; the application does not log it.
- **Alternatives rejected:** Local storage or session storage persistence.

## ADR-005 — Use optimistic sender messages and reconcile with history

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** The backend sends delivered-message frames only to the recipient. The sender receives no live-delivery acknowledgement or client correlation ID.
- **Options considered:** Wait for a sender echo; show the sender's message immediately and reconcile it when history is next fetched.
- **Decision:** Render the outgoing message optimistically after the WebSocket send succeeds locally, then reconcile it with server history using sender, recipient, exact content, and a five-minute timestamp window.
- **Rationale:** Waiting for an echo would leave successful outgoing messages invisible to the sender.
- **Consequences and trade-offs:** Reconciliation is best-effort because the backend supplies no correlation identifier. Messages that are identical and close together can be ambiguous; unresolved optimistic messages remain marked as awaiting history sync. Reconnect never resends them automatically.
- **Alternatives rejected:** Treating a sender echo as a delivery guarantee or automatically retrying messages without an idempotency key.

## ADR-006 — In-memory chat state and a dedicated socket hook

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** The current application has one authenticated chat workspace and one socket connection per authenticated session.
- **Options considered:** Add a global state library or socket context; keep workspace state in `ChatPage` and socket lifecycle in a dedicated hook.
- **Decision:** Keep contacts, selection, history, drafts, and delivery notices in `ChatPage`; encapsulate the socket lifecycle in `useChatSocket`.
- **Rationale:** This keeps the current one-page application simple while isolating WebSocket cleanup and event parsing.
- **Consequences and trade-offs:** State is not shared between routes; a multi-route or multi-device synchronization design may require revisiting this choice.
- **Alternatives rejected:** Adding a state-management or socket-context dependency before the application needs it.

## ADR-007 — Configure the API URL at build time

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** Vite must provide a backend base URL to browser code, but the project must not expose credentials through its frontend bundle.
- **Options considered:** Hard-code the URL; use Vite's `backend_api` setting and map it to a compile-time constant; put secrets in the browser environment.
- **Decision:** Read `backend_api` through Vite's environment loader and define `__BACKEND_API_BASE_URL__` at build time. Keep `.env` ignored and provide only a safe placeholder in `.env.example`.
- **Rationale:** The endpoint can vary by environment without placing secrets in source control.
- **Consequences and trade-offs:** The URL is public in the generated browser bundle and must never contain credentials or other secrets. Changing it requires rebuilding the frontend.
- **Alternatives rejected:** Embedding secret-bearing values in client configuration.

## ADR-008 — Mocked Vitest and Testing Library coverage

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** The frontend needs repeatable API and user-flow checks that do not depend on live accounts or a production backend.
- **Options considered:** Rely only on manual browser testing; add mocked unit and UI integration tests with Vitest and Testing Library.
- **Decision:** Use Vitest in jsdom for API contract tests and application interaction tests, with mocked `fetch` and WebSocket behavior.
- **Rationale:** The test suite is deterministic and avoids creating production data or exposing backend credentials.
- **Consequences and trade-offs:** Mocked tests do not prove that the deployed backend, browser CORS policy, or real WebSocket deployment works end to end.
- **Alternatives rejected:** Making the ordinary test suite depend on live backend availability.

## ADR-009 — GitHub Actions validates but does not deploy

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** Frontend changes need repeatable checks on the integration branch and its pull requests.
- **Options considered:** Add a validation workflow; couple validation to a deployment and require deployment credentials.
- **Decision:** `.github/workflows/FE-CI.yml` runs on pushes and pull requests targeting `develop`, uses Node 22 and `npm ci`, then runs lint, tests, and the production build. Actions are pinned to commit SHAs, token permissions are read-only, and the build receives only a reserved non-secret placeholder URL.
- **Rationale:** Ordinary frontend validation should not need backend or deployment secrets.
- **Consequences and trade-offs:** The workflow does not deploy, run a live integration test, or configure GitHub branch protection. Whether the check is mandatory is controlled separately in repository settings.
- **Alternatives rejected:** Automatic deployment or secret-dependent checks in the validation workflow.

## ADR-010 — Use the approved frontend plan as the integration reference

- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** The requested `FE-integration.md` was not present in the repository when implementation began.
- **Options considered:** Stop until that file is supplied; use the existing `FRONTEND_PLAN.md` as the integration reference.
- **Decision:** The user approved `.github/prompts/FRONTEND_PLAN.md` as the canonical integration guide. It remains unchanged.
- **Rationale:** The existing plan describes the relevant backend endpoints and frontend implementation direction.
- **Consequences and trade-offs:** This repository's accepted integration reference has a different filename from the originally named `FE-integration.md`; documentation links to the existing file rather than creating a duplicate contract.
- **Alternatives rejected:** Inventing a second integration specification or modifying the supplied prompt files.

## ADR-011 — Live backend browser verification remains pending

- **Date:** 2026-10-16
- **Status:** Pending
- **Context:** Requests from the local browser to the deployed backend were blocked by CORS, so a real browser-to-backend integration run has not been verified.
- **Options considered:** Adjust backend CORS policy to allow the frontend origin; provide a same-origin development proxy; defer the live test until the deployment setup is available.
- **Decision:** No CORS, proxy, or deployment change has been selected in this frontend milestone.
- **Rationale:** Changing backend or deployment configuration is outside the frontend-only CI and documentation checkpoints.
- **Consequences and trade-offs:** Mocked tests and local build checks pass, but live REST and WebSocket behavior remains unverified.
- **Alternatives rejected:** Claiming a live integration result without evidence.
