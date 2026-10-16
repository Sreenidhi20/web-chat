# Frontend implementation log

This log records the completed frontend milestones on `develop`. The integration reference approved for this work is [`FRONTEND_PLAN.md`](../prompts/FRONTEND_PLAN.md); it was left unchanged.

## Completed milestones

| Date | Commit | Milestone and key changes | Verification and outstanding items |
|---|---|---|---|
| 2026-10-16 | `ee41caa` | Refactored the root application to keep the workspace in a dedicated `ChatPage`. | Prevented `App.tsx` from owning the full chat workspace. |
| 2026-10-16 | `6bf9544` | Added the responsive MUI chat application shell and reusable presentation components. | Component-based UI structure established. |
| 2026-10-16 | `84dcec6` | Added the typed backend API client, runtime response checks, and `.env.example`. | API client and production build were checked; the configured API URL is public build-time configuration. |
| 2026-10-16 | `00ddc5c` | Integrated in-memory authentication, contacts, presence, and conversation history. | Mocked browser flows were exercised. Protected requests use bearer authentication. |
| 2026-10-16 | `92e208b` | Added authenticated WebSocket send/receive handling and optimistic outgoing messages. | Mocked WebSocket and UI flows were exercised. The sender receives no live-delivery echo. |
| 2026-10-16 | `c07b9cb` | Hardened stale-request/socket lifecycle handling, timestamp validation, and offline info notices. | Mocked lifecycle and safe text-rendering behavior were checked. |
| 2026-10-16 | `aff29fa` | Added Vitest API and application integration coverage. | Latest suite: 2 test files and 11 tests passed; lint and production build passed. Tests mock REST and WebSocket traffic. |
| 2026-10-16 | `4986881` | Added `.github/workflows/FE-CI.yml` for frontend validation. | Workflow YAML and develop triggers were parsed/checked. A clean isolated `npm ci`, lint, test (11 passed), and build succeeded. No GitHub-hosted workflow run or live backend test is claimed. |

## Outstanding issues and limitations

- A local browser request to the deployed backend has been blocked by CORS. Live REST/WebSocket integration remains unverified until an approved backend CORS policy or same-origin proxy is available.
- The sender gets no delivery acknowledgement or correlation ID. Optimistic history reconciliation is best-effort and messages are not automatically resent after reconnect.
- Offline delivery info has no conversation ID and is shown globally.
- The CI workflow validates but does not deploy. Whether its status check is required is configured outside the repository.

## Approved deviations

- The originally referenced `FE-integration.md` was absent. The user approved the existing `.github/prompts/FRONTEND_PLAN.md` as the integration source of truth; that supplied file was kept intact.
- Sender bubbles are rendered optimistically and reconciled from history rather than waiting for an echo, because the backend sends delivered-message frames only to the recipient.

## Documentation checkpoint

The Phase 8 documentation set was committed as `6719eaf` (`docs: document frontend architecture and decisions`). This line was added in a follow-up commit so the checkpoint hash is recorded in the log.
