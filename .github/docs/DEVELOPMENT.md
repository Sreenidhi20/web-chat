# Frontend development

## Prerequisites

- Node.js 22.x. The CI workflow uses Node 22; local verification has used Node 22.13.1.
- npm and the committed `chat-ui/package-lock.json`. Local verification has used npm 11.0.0.
- Access to the repository. A live backend is not required for unit and UI tests.

The repository does not currently pin a patch-level Node or npm version in an `.nvmrc`, `.node-version`, or `engines` field. CI is the executable reference for the supported Node major.

## Install

From the repository root:

```powershell
Set-Location .\chat-ui
npm ci
```

`npm ci` installs the exact dependency tree represented by the lockfile. Do not commit a local `.env` file.

## Configure the backend

Create `chat-ui/.env` for local development:

```dotenv
backend_api=https://your-backend-host
```

The variable is intentionally lowercase and is read by the Vite configuration. Its value is compiled into browser JavaScript, so it must be a public base URL, never a secret. `.env` is ignored by Git; `.env.example` contains only a safe placeholder.

If this value is missing or invalid, the API client displays a configuration error. Restart the Vite development server after changing environment configuration.

## Run and validate

Run these commands from `chat-ui/`:

```powershell
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

- `npm run dev` starts Vite for local development.
- `npm run lint` runs ESLint across the project.
- `npm test` runs the Vitest suite once in jsdom. Tests mock the REST API and WebSocket.
- `npm run build` runs `tsc -b` and then creates the production Vite bundle; this is the configured type-check and build command.
- `npm run preview` serves the most recent production build locally.

There is no separate `typecheck` script. The production build fails if the TypeScript project build fails.

## Troubleshooting

- **Missing or invalid backend URL:** Check `chat-ui/.env`, variable spelling, URL scheme, and whether Vite was restarted.
- **Browser CORS error:** The deployed backend currently blocks the local browser origin. Mocked tests are available, but do not interpret a successful build as live integration verification. An approved backend CORS configuration or same-origin proxy is needed for browser verification.
- **Dependencies cannot be installed on Windows:** A running Vite/Node process can hold native dependency files open. Stop only the development process you own, then retry `npm ci`; do not run a clean install concurrently with an active Vite server using the same `node_modules`.
- **Tests fail after a dependency change:** Run `npm ci` from `chat-ui/` and rerun `npm test`. Do not change the lockfile unless the dependency manifest intentionally changes.
- **A protected request returns 401:** The app intentionally clears the in-memory session. Sign in again.

## Contributing on `develop`

`develop` is the integration branch. For collaborative changes, create a focused branch from the latest `develop`, keep changes limited to a reviewable milestone, and open a pull request targeting `develop`. The frontend CI workflow runs for pushes to `develop` and pull requests targeting it.

Before submitting, run `npm run lint`, `npm test`, and `npm run build` in `chat-ui/`. Include tests when behavior changes, update the relevant documentation, and never commit `.env`, credentials, or real tokens. Repository branch-protection and required-check settings are managed outside this source tree and should be confirmed in GitHub settings.

See [Architecture](./ARCHITECTURE.md), [Frontend integration](./FRONTEND-INTEGRATION.md), and [CI/CD](./CI-CD.md) for implementation details.
