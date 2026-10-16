# Frontend CI

## Workflow

The workflow is [`FE-CI.yml`](../workflows/FE-CI.yml).

- **Push trigger:** commits pushed to `develop`.
- **Pull request trigger:** pull requests targeting `develop`.
- **Runner:** `ubuntu-latest`.
- **Working directory:** `chat-ui/`.
- **Runtime and package manager:** Node.js 22 and npm.

## Checks

The `validate` job checks out the repository, configures Node/npm caching using `chat-ui/package-lock.json`, then runs:

1. `npm ci` for reproducible installation.
2. `npm run lint`.
3. `npm test`.
4. `npm run build`, which runs the TypeScript project build followed by the production Vite build.

Every command is a required workflow step; a non-zero exit fails the job. There is no separate type-check script, deployment job, live backend test, coverage threshold, or matrix across Node versions and operating systems.

## Environment and safety

The build receives `backend_api=https://api.example.invalid`, using the reserved `.invalid` domain as a non-secret placeholder. The build validates bundling and does not make a backend request. CI does not need production credentials or deployment secrets.

The job grants only `contents: read`. `actions/checkout` and `actions/setup-node` are pinned to full commit SHAs. No automatic deployment is configured. The API base URL is part of the client bundle and must never contain a secret.

The workflow defines checks but cannot by itself make them required for merging. Configure branch protection or repository rules separately if the `validate` job must block merges.

## Diagnosing failures

- **`npm ci` fails:** Check that the lockfile and `package.json` are committed together and that the selected Node/npm runtime can install the locked dependencies.
- **Lint fails:** Reproduce with `npm run lint` from `chat-ui/`; fix lint findings rather than suppressing the workflow step.
- **Tests fail:** Reproduce with `npm test` from `chat-ui/`. The tests mock backend traffic and should not need credentials.
- **Build or TypeScript fails:** Reproduce with `npm run build`. The CI API URL is a safe placeholder; no live backend is required to compile.
- **Live browser integration still fails:** The CI job does not test deployment connectivity or CORS. See [Frontend integration](./FRONTEND-INTEGRATION.md).

To inspect a run, open the repository's **Actions** tab, select **Frontend CI**, then open the failed run and its `validate` job. No GitHub Actions run has been claimed as successful by this documentation checkpoint; local execution of the workflow commands and YAML validation are recorded in the implementation log.
