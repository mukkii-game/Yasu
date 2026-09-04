# DECISIONS.md

The few decisions that still shape this code. The full history, including the
ones reversed along the way, is in `git log`; this file was cut down from 560
lines on 2026-09-04 because nobody was reading it and every agent was paying to
load it.

## CI is delegated, and tracks the central repository's main

`.github/workflows/*.yml` are thin callers into `mukkii-game/ai-dev-infra`.
They reference `@main`; the immutable-tag-plus-canary policy was dropped as a
safety valve that cost more manual merges than it protected.

## Game rules are pure and separate from rendering

`src/game.ts` holds the rules as pure functions over `GameState` and touches
neither the DOM nor the canvas. `src/render.ts` draws a state; `src/main.ts`
owns input, timing and audio. Vitest covers the rules in Node; Playwright covers
only what needs a browser.

## The script decides motion and sound, not the renderer

A `DialogueStep` names its own cues (`cues`), motion (`laughing`, `still`,
`shiver`, `nod`) and props (`gun`). The renderer and the timing code read those
flags; they never infer a beat from an index or a phase. Inserting a page cannot
move a beat onto its neighbour.

## Playwright tests the built bundle, Chromium only

`playwright.config.ts` serves `dist/` through `vite preview`, so the suite
exercises the artifact CI publishes. Instrumentation is chosen to observe the
phenomenon under test: `animationstart` counts rather than DOM text for a
replayed pop, `offsetWidth` rather than `getBoundingClientRect()` under a
transform, an ordered play/pause log for a cue that must be cut.

## Vite base is `./`

The built bundle works from any sub-path, so the same artifact serves GitHub
Pages and itch.io without a second build.
