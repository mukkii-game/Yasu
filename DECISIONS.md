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

## 2026-08-31 — Restraint replaces the horror reveal

The later direction deliberately removes the palette swap, facial detail,
foreground furniture, navigation sounds, wrong-answer sound, and screen effects.
One centered faceless Yasu carries the whole story: he trembles after the answer,
then stops and opens a simple smiling mouth when the first punchline appears.
Punchlines wait 500 ms, use large unboxed text, and share one short CC0 comic
fanfare. The ending contrasts the blue title with a gray-building sunset and a
small escort pair moving right-to-left, with no foreground protagonist.

## 2026-09-01 — Every joke lands in the same two-beat cadence

Dialogue typing regains a quiet generated square-wave blip while navigation and
wrong answers stay silent. Yasu's larger blank face now literally carries the
vertical clue 「ヤ」「ス」, so the new answer 「かおにかいてあるから」 can lead
directly into 「トリックが」 and, after a short pause, the larger 「ヤスッ！」.
The motive, reward, and human-worth punchlines use that same setup/payoff timing,
white-on-pink sprite lettering, and a single fanfare on the payoff.

The sunset road is lighter so both escort sprites remain readable. Their walk is
now finite; once they leave, a full-screen 「ヤスッ！ と つっこんでください」
closes the game with a deliberately oversized generated chord.

## 2026-09-01 — The clue fills Yasu's face and the scene survives the last joke

The vertical name is now the entire facial feature: two large white, navy-edged
glyphs on orange, with no eyes or mouth and a thinner circular outline. Dialogue
starts almost flush with the picture. Every setup-to-「ヤスッ！」 pause is the
same slightly longer 700 ms.

The setting sun is centered and half hidden by the horizon. The final joke no
longer replaces the sunset with black: 「このゲームのつくり」 and
「ヤスッ！！！！」 overlay the scene below `THE END`, hold for one second, and
then fade away slowly.

## 2026-09-01 — Dialogue and sound now share one strict adventure rhythm

Every dialogue copy block is pinned to the top of its black panel, and its ▼ is
inline after the closing quote rather than floating in a corner. Kana selection
and confirmation gain distinct generated square-wave clicks. Punchline setups
wait an additional half-second and now have their own brief lead sound before
the existing payoff jingle.

The face lettering is slightly smaller, unoutlined white, with a two-pixel gap.
Punchline outlines shrink to one logical pixel. The last wording becomes
「このゲームじたいが⋯　ヤスッ！！！！」; it remains visible while the whole
sunset screen fades, after which the title returns automatically.

## 2026-09-01 — The final joke reuses the exact two-beat punchline grammar

The finale now stages 「このゲームじたい」 first with the same lead pop, waits
700 ms, then adds a slightly larger 「ヤスッ！！！！」 with the final jingle.
Both use the established white text and one-pixel pink outline. Only after the
payoff has remained fully visible for one second does the whole sunset begin its
slow fade to the automatically restored title.

## 2026-09-01 — The finale uses two exclusive cuts

To make the final timing unmistakable, its setup and payoff no longer coexist:
the oversized 「このゲーム⋯」 cut is replaced after 700 ms by an even larger
「ヤスッ！！」 cut. The payoff alone remains during the one-second hold and the
subsequent full-screen fade to title.

## 2026-09-01 — The escort crosses once and never respawns

The pair now begins just left of the centered sun, walks a shorter 5.4-second
route with a restrained one-pixel bob, and fully clears the left edge. Final
caption renders omit the walkers from the DOM, preventing the CSS entrance
animation from restarting when either caption cut appears.

## 2026-09-01 — The final setup remains above its payoff

The setup 「このゲーム⋯」 now stays visible after the usual 700 ms interval,
with 「ヤスッ！」 added beneath it rather than replacing it. The shorter wording
keeps the larger 38 px and 50 px sizes. The escort crossing is also accelerated
from 5.4 to 3.6 seconds, exactly 1.5× the previous speed.

## 2026-09-01 — The face clue is phrased as a direct retort

Immediately after Yasu asks how the player knew, the response is now the more
direct `あなた「おまえのかおにかいてあるよ」`, leading into the unchanged
two-beat 「なぞときが」「ヤスッ！」 punchline.

## 2026-09-01 — The reveal earns a silent second before dialogue

The correct answer now locks input for one second while the screen flashes, a
generated low thunder crash sounds, and Yasu shakes much farther than his normal
tremble. Only after that beat does his question begin typing. The player's clue
is now `タイトルにかいてあったから`, and the accusation specifies
`ごうとうさつじん`. The reward forces `３０００円` to the head of line two.

Yasu's black body reaches the bottom of the room picture, while the title gains
a small centered version without the face lettering to fill its empty skyline.
