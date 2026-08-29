# SPEC.md

Behaviour specification for the Yasu demo. Read this before changing behaviour;
update it in the same change when behaviour moves.

## Purpose

Yasu is a deliberately small Canvas game. Its primary job is to exercise the
central CI in `mukkii-game/ai-dev-infra` end to end: install, typecheck, unit
test, build, and browser test. Gameplay depth is explicitly a non-goal.

## Field

- Play field is 480 x 320 logical pixels, drawn on a `<canvas>`.
- The origin is the top-left corner; y grows downward.

## Entities

- **Ball** — radius 8. Starts at the centre of the field moving right and up
  (150, -180) px/s.
- **Paddle** — 96 x 12, fixed 16 px above the bottom edge. Starts centred
  horizontally. Only its x position changes.

## Rules

1. Each simulation step advances the ball by `velocity * dt` seconds.
2. The ball reflects off the left, right, and top edges of the field.
3. A ball moving downward that reaches the paddle's top edge while horizontally
   overlapping the paddle (within one ball radius of either end) reflects
   upward and increases the score by 1.
4. A ball that falls entirely past the bottom edge ends the game
   (`status: 'over'`).
5. A finished game is a fixed point: stepping it changes nothing.
6. The paddle is always clamped inside the field.

## Controls

- `ArrowLeft` / `ArrowRight` — move the paddle one step (28 px).
- Pointer movement over the canvas — centre the paddle on the pointer.
- `R` — restart from the initial state.

## Displayed state

The HUD shows the current score and status. The canvas also mirrors state onto
`data-paddle-x` and `data-status` attributes so the end-to-end tests can assert
on the simulation without reading pixels. These attributes are part of the
contract with `e2e/`; renaming them requires updating those tests.

## Structure

- `src/game.ts` — pure, DOM-free rules. All of the above is implemented and
  unit-tested here.
- `src/render.ts` — draws a `GameState` onto a canvas context.
- `src/main.ts` — input handling and the animation loop.

Keep the rules in `src/game.ts` pure. That separation is what makes the
behaviour above testable under Vitest without a browser.
