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

# 2026-09-01: Align title Yasu to the horizon and shorten the tie

The small title-screen Yasu is lowered so the center of his face sits on the sea
horizon. His face outline is reduced to one pixel, and his black outfit now carries
a short white tie matching the room-scene design. The room-scene tie is reduced from
68 pixels to 22 pixels (roughly one third) so it reads as a necktie rather than a
full-length white stripe.

## 2026-09-01 — Shorten the escort lead-in again

The escort pair now starts at X=41, halfway between its previous X=82 position
and the left edge. Its route is reduced from 127 to 86 pixels and takes 2.4
seconds instead of 3.6, preserving roughly the same walking speed while reaching
the final two-beat caption 1.2 seconds earlier.

## 2026-09-01 — Keep link previews spoiler-free

The standard page description, Open Graph description, and X/Twitter description
now all read 「あなたはこの謎が解けるか？　推理アドベンチャー。」. The former
「2文字で終わる」 phrasing was removed because it gives away how quickly the
mystery resolves instead of inviting the player to deduce it.

## 2026-09-01 — Tighten the title-clue retort

The player's answer to Yasu is shortened from
`あなた「タイトルにかいてあったから」` to
`あなた「タイトルにかいてあった」`. The following two-beat
「なぞときが」「ヤスッ！」 punchline is unchanged.

## 2026-09-01 — Strengthen the early-FC adventure silhouette

The game keeps its lightweight CSS artwork and 16-color palette, but adopts the
most recognizable shared layout from early Famicom mysteries: a small framed
scene at upper left, a narrow command list at upper right, and a broad dialogue
field below. The room is rebuilt from larger flat color blocks and Yasu gains a
simple stepped hair cap without changing the blank 「ヤ」「ス」 face gag. The
256×240 logical canvas receives a 1.25× horizontal display correction so the
presented frame is 4:3 while vertical scaling stays integer-only.

## 2026-09-01 — Prefer the game-specific scene over an unused command menu

The title's abstract red sun is removed. The noninteractive command list is also
removed because this short game never uses it; the room picture expands to
236×150 and Yasu remains centered. His head grows to 50 pixels while the face
letters shrink and are inset below the hair. The dialogue area moves down and
punchlines move up so both punchline stages remain wholly inside the picture.
Wrong guesses now receive `いや、ちがうでしょう。やっぱめいきゅういりですよ。`.

## 2026-09-01 — Give Yasu a stepped 7:3 side part

Yasu's flat centered hair cap becomes an asymmetric three-piece sprite: a high
top cap, a wide left fringe that descends in two six-pixel steps, and a narrow
left side lock. This places the part near the right side without adding smooth
diagonals. The face lettering begins at Y=16, below the fringe, and keeps the
same 14-pixel size so both characters remain between the hair and chin.

## 2026-09-01 — Keep punchlines below Yasu's face

All two-stage room punchlines now begin at Y=82, two logical pixels below the
chin. Their setup and payoff sizes tighten to 28/36 pixels with 34/40-pixel line
heights, fitting both lines between the chin and the room frame's lower edge
without touching the ordinary dialogue area.

## 2026-09-01 — Remove the full-screen reveal flash

The one-second correct-answer beat keeps its low thunder, locked input, and large
Yasu shake, but no longer paints the screen white. The room colors and background
remain unchanged throughout, avoiding an uncomfortable full-screen flash before
Yasu begins speaking.

## 2026-09-01 — Use one symmetric Yasu design on the title and in the room

The asymmetric 7:3 hair is superseded by a blocky center part: equal 21-pixel
fringes fall in matching two-step shapes on the left and right, leaving a small
central gap. The title character now uses the same visual parts at roughly half
scale—a 29×39-pixel body, 25-pixel round head, matching center-parted hair, and
short tie—while continuing to omit the face lettering as previously requested.

## 2026-09-01 — Complete the final setup phrase

The finale's first caption changes from `このゲーム⋯` to
`このゲームじたいが`. It stays visible on the upper line while the unchanged
`ヤスッ！` payoff enters below after the established interval; the sound and
fade timings remain unchanged.

## 2026-09-01 — Refine the final joke and Yasu's center part

The title and room sprites now share one continuous symmetric center-part shape
with fine diagonal fringes instead of a stepped pair with a rectangular gap. The
face lettering moves two pixels upward, and Yasu's torso bobs by two pixels while
`はっはっは` is visible. Dialogue blips rise to the first punchline cue's 0.018
gain, while the payoff remains deliberately much louder.

The last setup is shortened to `このゲームが`, kept on one line, and styled as
a proportional enlargement of the room punchline before the unchanged second
beat `ヤスッ！`. All clicks and keys are ignored during `THE END`; only the
scheduled fade may return the game to its title.

## 2026-09-01 — Match Yasu's detective colors across both scenes

Yasu now uses the same reference-inspired palette and outfit at both scales: a
muted yellow face, rounded black center-parted hair, blue jacket, white shirt and
collars, and a red tie slightly longer than the former white strip. The final
setup is also tightened once more to `ゲーム全体が` before `ヤスッ！`.

## 2026-09-01 — Give the final payoff a dedicated third line

The final setup now enters as two simultaneous lines, `このゲーム` and
`ぜんたいが`. After the established interval, `ヤスッ！` lands on a third line
at 60 pixels, substantially larger than either setup line. Yasu's reference-led
silhouette is refined at the same time with an octagonal hair cap, a softly
squared face, and shoulder-shaped jacket at both title and room scales.

## 2026-09-01 — Make the last setup deliberately repetitive

The two simultaneous final setup lines are finalized as `このゲームの` and
`ぜんぶがぜんぶ`. The pause, oversized third-line `ヤスッ！`, input lock, and
automatic fade remain unchanged.

## 2026-09-01 — Rebuild Yasu from one outlined FC portrait system

The room and title sprites no longer pair an outlined face with an unoutlined
shirt block. Both begin with one black face/torso silhouette, then layer the same
muted-yellow skin, octagonal center-parted hair, bright-blue jacket panels, navy
lapels, white shirt, black-edged white collars, and black-edged red tie. The room
sprite widens to 70 pixels for reference-like shoulders; the title version uses
the same construction at approximately half scale and still omits face letters.

## 2026-09-01 — Restore the coarse simple Yasu sprite

The layered portrait above was rejected as too high-resolution and visually
unlike an early Famicom sprite. Restore the earlier round face, stepped black
hair, rectangular torso, and single white tie at both scales. The only change
from that earlier sprite is replacing the black torso with palette navy
`#00003c`. Do not add jacket outlines, lapels, collars, shirt panels, or a red
tie.

## 2026-09-01 — Shorten the final setup and nod twice

The final setup is shortened to simultaneous lines `このゲーム` and
`なにもかも`; the usual pause and oversized `ヤスッ！` remain unchanged. On
the completed `まあ しょはんだし` page, only Yasu's head nods twice before the
punchline starts. His torso remains still.

## 2026-09-01 — Use the author's 32×48 Yasu sprite directly

Replace the CSS-drawn title and room figures with the supplied transparent PNG.
Render it unmodified at 1× on the title and at an exact pixelated 2× in the room.
Split the room rendering at source row 26 so the existing body laugh and head
nod remain independent. Overlay the white vertical `ヤ` / `ス` only on the
room sprite, bounded inside the yellow face.

## 2026-09-01 — Extend the supplied torso and delay the arrest cut

Repeat the supplied sprite's final source row straight down so the room torso
reaches the scene bottom; add only five continuation pixels on the title. Change
the clue reply to `タイトルにかいてあったよ`. After the final `人として` /
`ヤスッ！`, lock input, wait one second, play a synthesized two-click handcuff
clack, and enter the sunset screen automatically. On sub-660-pixel portrait
viewports, continuously scale the unchanged 256×240 game to the full available
width instead of leaving the former margins.

## 2026-09-01 — Replace the major cues with the author's free audio

Play the supplied anxious piano once when the opening Yasu line begins. Replace
the generated reveal crash with `ショック1.mp3`, every ordinary second-beat
`ヤスッ！` jingle with `ビシッとツッコミ2.mp3`, and the final oversized
`ヤスッ！` sting with `ドーン.mp3`. Keep the small synthesized setup pop,
typing blips, input clicks, and handcuff clack unchanged. The supplied temple
bell is deliberately left unused because no scene was assigned to it.

## 2026-09-02 — Keep essential game motion identical on every device

Do not shorten timers, skip character animation, or collapse the escort walk in
response to `prefers-reduced-motion`. The shake, laugh, nod, punchline entries,
typing rhythm, sound triggers, escort walk, and final fade are essential comedy
and story beats. Their programmed timing must remain the same on Android, iOS,
Windows, and macOS, including devices whose accessibility settings request less
interface motion.

## 2026-09-02 — The sentence beat reuses the reveal's impact rather than a new effect

The closing 「刑期の見積もりが」 / 「ヤスッ！」 is the one punchline that lands on a
shock instead of a pop, so `DialogueStep` carries an `impact` flag and the
existing reveal cue and tremble are reused verbatim. Adding a second shock
treatment would have made the two moments merely similar; sharing one makes the
callback read as deliberate.

The drain to black is a single `filter` animation losing saturation and
brightness together, applied to the whole screen rather than to any one element,
so the room dims as one picture on the way to the sunset.

## 2026-09-02 — One comeback per setup, and the shock belongs to the line

「まあ しょはんだし すぐでてこれますよねｗ」 lost its own 「人としてヤスッ！」. The
player's correction is the answer to that boast, so landing a comeback on the
boast and another on the correction punched the same setup twice and blunted
both. The boast now just sits there, which is funnier.

The correction's shock moved off its comeback and onto the line: the cue and the
tremble fire the instant 「むきちょうえきだぞ？」 finishes typing, and the comeback
that follows uses the same lead blip and hit as every other one. A repeating gag
reads as a repeat only when it sounds like one, so the callback is carried by the
shock on the line rather than by a different-sounding punchline.

A landed 「ヤスッ！」 is held for 900 ms against input. The two-beat rhythm is the
joke, and letting a tap cut it short threw away the beat it was building.

## 2026-09-02 — The sentence and the plea are two pages, not one

An earlier revision removed 「人としてヤスッ！」 on the theory that the player's
correction already answered the boast. That was the wrong call: the boast is a
joke in its own right and the author wanted it kept.

The ending instead grew a beat. The player states the sentence and Yasu takes the
shock on that line; Yasu then pleads for a suspended sentence, and the final
comeback lands on the plea rather than on the statement. Splitting them gives the
shock a page of its own to breathe in and puts the comeback on the line that
actually earns it.

## 2026-09-02 — Naming the boss is a second ending, not a wrong answer

Swapping 「ホ」 for 「ボ」 in the kana grid costs nothing — 「ホ」 spelled no name
the game accepts — and it lets the player type 「ボス」. Doing so turns the
confession into evidence and ends the game on Yasu's terms: the gun, the shot,
the red flood, and 「ボスのいのちヤスッ！」.

The payoff deliberately uses the ordinary comeback cue rather than the gunshot.
The running gag is what closes both endings, so it has to sound the same in both.

Scene reactions are now keyed off the lines themselves rather than their index in
ENDING. Inserting 「もじどおり　かおにもかいてある」 moved every later page by one
and silently shifted the laugh and the nod onto the wrong lines; matching on the
text means the next inserted page cannot repeat that.
