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
5. 「ヤス」 triggers the reveal. The daylight room snaps to a cold cyan/navy palette, the boss falls into silhouette, Yasu grows larger with sharply angled red eyes and a rigid expression, alarm streaks appear, the screen jolts and flashes, and a dissonant pulse/triangle/noise sting plays. The effect remains through Yasu's shocked reply, then the comedy returns to the normal room palette.
6. The ending advances through Yasu's motive, reward, and attitude. When each Yasu line finishes typing, its large colored punchline sprite immediately flies in from the right above the dialogue area; it does not consume a separate page:
   - 「動機がヤスッ！」
   - 「報酬もヤスッ！」
   - 「人間としてヤスッ！」
7. The final screen shows a large `THE END`, Yasu being led away in handcuffs, and the player watching in the foreground. There is no ending music.
8. Any tap, click, or unmodified key on `THE END` returns to a clean title state; no retry button is shown.

## Controls

- Dialogue is typed one character at a time. Tap/click or Enter/Space completes the current line first, then advances on the next input.
- Select katakana with the on-screen panel. `Backspace` removes the last selected character.
- 「けす」 removes one character; 「ぜんぶけす」 removes both; 「けってい」 submits two characters.
- The `♪` control toggles short sound effects. The game has no background or ending music.

## Presentation

- The logical display is exactly 256×240 pixels and scales only by integer factors (1×, 2×, 3×), preserving hard edges on phones and desktops.
- The CSS palette is a fixed 16-color NES-inspired subset. Scenes use flat fills; each small character sprite uses no more than four visible colors.
- The title shows a daytime city street, a chalk body outline, and an anonymous detective silhouette. The story scene is a normal daylight office rather than a night scene.
- Japanese dialogue stays in one continuous `話者「本文」` string and only wraps naturally at the screen edge.
- Text remains readable and all kana input remains available by touch on phones.
- No copied screenshots, sprites, logos, characters, or music are used.
- Animation is reduced when `prefers-reduced-motion` is enabled.

## Structure

- `src/game.ts` — pure immutable state transitions, dialogue data, and kana list.
- `src/render.ts` — turns a `GameState` into accessible DOM markup.
- `src/main.ts` — event delegation, keyboard/touch control, character-by-character timing, pulse-wave text blips, licensed sound playback, and rendering coordination.
- `src/style.css` — the complete 256×240 presentation, 16-color palette, CSS pixel scenes, and integer scaling rules.

Pure gameplay transitions belong in `src/game.ts` and stay DOM-free so Vitest can cover the full route to the ending.
