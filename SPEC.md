# SPEC.md

Behaviour specification for 「犯人はヤス」. Read this before changing behaviour and update it in the same change when behaviour moves.

## Purpose

「犯人はヤス」 is a very short, original parody of an 8-bit Japanese detective adventure. The joke relies on the answer already being common knowledge. It must evoke the technical and visual limits of a Famicom-era game without copying a specific game's graphics, layout, logo, characters, or audio.

## Flow

1. The title screen shows 「犯人はヤス」 and waits for tap, click, Enter, or Space.
2. Three dialogue pages jump directly to the final deduction:
   - Yasu says there are no more clues and the case will remain unsolved.
   - Yasu asks whether the player has identified the culprit.
   - The player says 「はんにんは⋯」.
3. A katakana gojūon panel accepts exactly two characters.
4. A wrong answer is cleared. Yasu replies 「いや、ちがうでしょう。」 and the player returns to the panel.
5. 「ヤス」 triggers the reveal, a generated 8-bit shock sound, and flashing effects.
6. The ending advances through Yasu's motive, reward, and attitude. Each receives a full-screen cut-in:
   - 「動機がヤスッ！」
   - 「報酬もヤスッ！」
   - 「人間としてヤスッ！」
7. The final screen shows a large `THE END`, Yasu being led away in handcuffs, the player watching in the foreground, a looping walk animation, and looping generated ending music.
8. 「もういちど」 returns to a clean title state.

## Controls

- Tap/click dialogue windows or press Enter/Space to advance.
- Select katakana with the on-screen panel. `Backspace` removes the last selected character.
- 「けす」 removes one character; 「クリア」 removes both; 「けってい」 submits two characters.
- The `♪` control toggles generated sound effects and ending music.

## Presentation

- The game stays inside a responsive 4:3 display with scanlines, a limited navy/cream/gold/cyan/red palette, hard pixel-like edges, and CSS-built silhouettes.
- Text remains readable and controls remain touch-sized on phones.
- No copied screenshots, sprites, logos, characters, or music are used.
- Animation is reduced when `prefers-reduced-motion` is enabled.

## Structure

- `src/game.ts` — pure immutable state transitions, dialogue data, and kana list.
- `src/render.ts` — turns a `GameState` into accessible DOM markup.
- `src/main.ts` — event delegation, keyboard/touch control, generated Web Audio effects, and rendering coordination.
- `src/style.css` — the complete 8-bit visual presentation and responsive rules.

Pure gameplay transitions belong in `src/game.ts` and stay DOM-free so Vitest can cover the full route to the ending.
