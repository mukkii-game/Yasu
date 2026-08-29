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
