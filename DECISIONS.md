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

## 2026-08-29 — The Merge Guard fails closed on every check

The guard was hardened so that auto-merge requires positive proof that a pull
request is ordinary, rather than merely failing to look suspicious:

- pull requests from forks are refused outright, whatever they touch — a fork's
  head sits outside this repository's review and ruleset guarantees
- `previous_filename` is examined alongside `filename`, so moving a file *out*
  of `.github/` is caught even though its new path looks innocent
- the number of files returned by the API must equal the pull request's own
  `changed_files`; a mismatch means something went unexamined, so it blocks
- a change larger than the files endpoint will list (3000) blocks, because it
  cannot be inspected in full
- any API failure blocks, since `set -e` stops the job before auto-merge

The path decision runs inside jq over JSON values rather than over shell text,
so a filename containing quotes, spaces or newlines is data and never syntax.

## 2026-08-29 — Pages publishes the artifact CI verified, and runs no code

`.github/workflows/deploy-pages.yml` accepts successful `CI` runs from both
pull requests and pushes. A pull-request artifact is eligible only after that
exact head was squash-merged by `github-actions[bot]`, its Git tree matches the
merge commit, and that commit is still the head of `main`. This covers native
auto-merges performed with `GITHUB_TOKEN`, which do not start another workflow.
A push artifact covers reviewed manual merges and is eligible only while its
commit is still the head of `main`.

The workflow never checks the repository out, installs dependencies, rebuilds,
or executes artifact contents. It fetches only the triggering run's `web-build`
by `workflow_run.id`, verifies that it contains `index.html`, and hands it to
GitHub Pages. A missing artifact fails the job.

The deployment rechecks `main` immediately before publishing, so a run cannot
roll the site back if another merge lands while its artifact is being packaged.

## 2026-08-30 — Infrastructure v2 centralizes CI, Guard and Pages

The three local workflows are callers of the protected `ai-dev-infra@v2`
workflows. The test suite verifies their exact references, permissions and
concurrency settings because those caller-owned settings cannot be enforced
inside a reusable workflow.

## 2026-08-31 — The CI demo became a complete two-character mystery

The paddle demo was replaced by the requested 「犯人はヤス」 adventure while
keeping the repository's pure-logic boundary: `game.ts` now owns immutable
story transitions, `render.ts` owns DOM output, and `main.ts` owns input and
generated Web Audio. Visuals are original CSS shapes rather than copied game
assets, and all gameplay remains inside the portable Vite build already used by
the central CI and Pages workflows.

## 2026-08-31 — The presentation follows a 256×240 console budget

The screen now uses the Famicom/NES PPU's 256×240 logical picture size, a fixed
16-color subset of the hardware palette, flat CSS pixel shapes, and integer-only
1×/2×/3× scaling. Dialogue data is stored as continuous `話者「本文」` strings
and revealed one character at a time. Punchlines are attached to the Yasu line
that triggers them and enter as fast overlay sprites, instead of becoming slow
full-screen pages. The final scene has no music and any input returns to title.

## 2026-08-31 — Third-party retro assets are local and redistributable

DotGothic16 is bundled under SIL Open Font License 1.1. Three short effects from
Juhani Junkala's Essential Retro Video Game Sound Effects Collection are bundled
under CC0. Assets are served from the Pages build rather than fetched at runtime;
their upstream locations and licenses are recorded in `CREDITS.md` and alongside
the files in `public/`.

## 2026-08-31 — The culprit reveal breaks the normal room palette

The correct answer now creates one abrupt horror beat before the comedy resumes:
the daylight room switches to cold cyan/navy, Yasu's eyes and pose harden, the
other figure becomes a silhouette, alarm shapes jitter, and a 720 ms flash fires.
The sting layers the licensed impact with generated pulse, triangle, and noise
voices, matching the NES APU vocabulary without using music or borrowed audio.
