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
5. 「ヤス」 triggers the reveal. The room and faceless front-facing Yasu do not change color; Yasu only trembles rapidly while a quiet high-pitched two-hit-and-chord sting plays.
6. After Yasu asks why the player knows, the player answers `あなた「かおにかいてあるから」`. The ending then advances through the accusation, motive, reward, and attitude. Every punchline uses the same two-beat rhythm: its setup waits 750 ms after the line, then the larger 「ヤスッ！」 follows 550 ms later with a short comic fanfare. Both are thick white text with a pink outline and no box:
   - 「トリックが」 → 「ヤスッ！」
   - 「動機がヤスッ！」
   - 「報酬もヤスッ！」
   - 「人間として」 → 「ヤスッ！」
7. The final screen is a sunset city with a lighter road. A small anonymous escort and the handcuffed detective Yasu walk slowly from right to left. There is no foreground player. `THE END` is thick plain white text and there is no ending music. After both figures leave, a full-screen 「ヤスッ！ と つっこんでください」 appears with an exaggerated final sting.
8. Any tap, click, or unmodified key on `THE END` returns to a clean title state; no retry button is shown.

## Controls

- Dialogue is typed one character at a time. Any click anywhere in the game or any unmodified non-Tab key completes the current line first, then advances on the next input.
- Select katakana with the on-screen panel. `Backspace` removes the last selected character.
- 「けす」 removes one character; 「ぜんぶけす」 removes both; 「けってい」 submits two characters.
- There is no sound control. Character-by-character dialogue has a quiet square-wave blip. Ordinary navigation and wrong answers remain silent; the correct-answer sting and delayed comic punchline fanfares are the other effects.

## Presentation

- The logical display is exactly 256×240 pixels and scales only by integer factors (1×, 2×, 3×), preserving hard edges on phones and desktops.
- The CSS palette is a fixed 16-color NES-inspired subset. Scenes use flat fills; each small character sprite uses no more than four visible colors.
- The title vignette contains only buildings, sky, and a straight sea horizon. It has no road, body outline, or person.
- The story scene contains only one front-facing Yasu: a larger round blank head marked vertically 「ヤ」「ス」 and a square upper body. There is no boss, foreground player, or desk. Yasu stops trembling and gains only an open smiling mouth once the first punchline appears.
- Japanese dialogue stays in one continuous `話者「本文」` string and only wraps naturally at the screen edge.
- Text remains readable and all kana input remains available by touch on phones.
- No copied screenshots, sprites, logos, characters, or music are used.
- Animation is reduced when `prefers-reduced-motion` is enabled.

## Structure

- `src/game.ts` — pure immutable state transitions, dialogue data, and kana list.
- `src/render.ts` — turns a `GameState` into accessible DOM markup.
- `src/main.ts` — global click/key control, character-by-character timing and blips, delayed two-stage punchlines, the high reveal chord, comic fanfare playback, the final sting, and rendering coordination.
- `src/style.css` — the complete 256×240 presentation, 16-color palette, CSS pixel scenes, and integer scaling rules.

Pure gameplay transitions belong in `src/game.ts` and stay DOM-free so Vitest can cover the full route to the ending.
