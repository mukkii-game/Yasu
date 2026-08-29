# DECISIONS.md

Durable design decisions. Append briefly; do not rewrite history.

## 2026-08-29 — CI is delegated to a central reusable workflow

`.github/workflows/ci.yml` only calls
`mukkii-game/ai-dev-infra/.github/workflows/verify-web.yml@v1`. The CI steps are
never copied into this repository, so every web app repository gets the same
verification and one change updates them all. The caller is pinned to the `v1`
tag rather than `@main`, so central CI changes cannot silently alter this
repository's builds.

## 2026-08-29 — CODEOWNERS covers `.github/**` only

Only CI and repository plumbing require a human owner's review. Game code and
docs are intentionally left unowned so that AI agents can land ordinary changes
without a human review gate.

## 2026-08-29 — Game rules are pure and separate from rendering

`src/game.ts` holds the rules as pure functions over `GameState` and touches
neither the DOM nor the canvas. Rendering and input live in `src/render.ts` and
`src/main.ts`. This lets Vitest cover the rules in a plain Node environment,
leaving Playwright to cover only what genuinely needs a browser.

## 2026-08-29 — Playwright tests the built bundle, Chromium only

`playwright.config.ts` serves `dist/` through `vite preview` rather than the dev
server, so the end-to-end suite exercises the artifact CI actually produces. Only
the Chromium project is configured, matching the central workflow's
`playwright install --with-deps chromium`.

## 2026-08-29 — Vite `base` is `./`

Relative asset paths keep the built bundle usable from any sub-path, so the CI
artifact can be opened or hosted without a rebuild.

## 2026-08-29 — The best score survives a restart

`restart()` carries `bestScore` over instead of returning a wholly fresh state,
so pressing `R` clears the round without erasing what the player has already
achieved. `createGame()` stays the true zero state and is what the unit tests
build on.

## 2026-08-29 — Auto-merge is gated by a Merge Guard, not granted repo-wide

`.github/workflows/merge-guard.yml` enables GitHub's native auto-merge for pull
requests, but fails and enables nothing when a pull request touches
`.github/**`. Turning auto-merge on repository-wide would mean CI, workflow
permissions and CODEOWNERS could all be changed with no human in the loop —
including changes to the very checks that are supposed to gate the merge. Those
files stay a human decision; ordinary game code does not.

The guard runs on `pull_request_target` because a `pull_request` run from a
fork gets a read-only token and cannot enable auto-merge. That trigger hands
out a write-capable token in the base branch's context, so the workflow never
checks out or executes anything from the pull request: it reads the changed
paths from the API and treats them purely as data. Drafts are skipped and
re-evaluated on `ready_for_review`.
