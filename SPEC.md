# SPEC.md

Behaviour specification for 「犯人はヤス」. Read this before changing behaviour and update it in the same change when behaviour moves.

## Purpose

「犯人はヤス」 is a very short, original parody of an 8-bit Japanese detective adventure. The joke relies on the answer already being common knowledge. It must evoke the technical and visual limits of a Famicom-era game without copying a specific game's graphics, layout, logo, characters, or audio.

## Flow

1. The title screen shows 「犯人はヤス」 and waits for tap, click, Enter, or Space.
2. Three dialogue pages jump directly to the final deduction:
   - Yasu says there are no more clues and the case will remain unsolved.
   - Yasu asks whether the player has identified the culprit.
   - The player says 「はんにんは・・・」.
3. A katakana gojūon panel accepts exactly two characters.
4. A wrong answer is cleared. Yasu replies 「いや、ちがうでしょう。」 and the player returns to the panel.
5. 「ヤス」 triggers a one-second reveal beat before any dialogue appears. The whole screen flashes, a low double-hit thunder crash plays, and Yasu shakes by four logical pixels. Input is ignored during this beat. After exactly one second the flash and large shake stop, Yasu returns to the smaller tremble, and `ヤス「な、なぜわかったんですかっ！？」` begins typing.
6. The player answers `あなた「タイトルにかいてあった」`, then asks `あなた「ヤス、なんで　ごうとうさつじんなんてしたんだ」`. The ending advances through Yasu's motive, explicitly line-broken reward (`でももらったほうしゅうは` / `３０００円でしたよ　はっはっは`), and attitude. Every punchline uses the same two-beat rhythm: its setup waits 1.25 seconds after the line and enters with a short 8-bit pop, then the larger 「ヤスッ！」 follows 700 ms later with a comic fanfare. Both are thick white text with a fine one-pixel pink outline and no box:
   - 「なぞときが」 → 「ヤスッ！」
   - 「動機がヤスッ！」
   - 「報酬もヤスッ！」
   - 「人間として」 → 「ヤスッ！」
7. The final screen is a sunset city with a lighter road and a centered sun half below the horizon. A small anonymous escort and the handcuffed detective Yasu start at X=41 pixels—halfway between their former X=82 position and the left edge—bob by one logical pixel, and walk for 2.4 seconds until they disappear beyond the left edge. They are removed before any final caption renders, so rerendering can never restart the walk. There is no foreground player. `THE END` is thick plain white text and there is no ending music. After both figures leave, 「このゲーム⋯」 enters with the lead pop. The usual 700 ms later, 「ヤスッ！」 appears on a second line with the exaggerated final sting while the setup remains above it. One second after the payoff appears, the entire ending begins a slow fade and then returns to the title automatically.
8. Any tap, click, or unmodified key on `THE END` returns to a clean title state; no retry button is shown.

## Controls

- Dialogue is typed one character at a time. Any click anywhere in the game or any unmodified non-Tab key completes the current line first, then advances on the next input.
- Select katakana with the on-screen panel. `Backspace` removes the last selected character.
- 「けす」 removes one character; 「ぜんぶけす」 removes both; 「けってい」 submits two characters.
- There is no sound control. Character-by-character dialogue has a quiet square-wave blip. Kana choices make a short click and 「けってい」 makes a two-note confirmation. Ordinary dialogue navigation remains silent; the reveal, both halves of each punchline, and the finale have their own effects.

## Presentation

- Link previews use the title 「犯人はヤス」 and the spoiler-free description 「あなたはこの謎が解けるか？　推理アドベンチャー。」 consistently for standard, Open Graph, and X/Twitter metadata.
- The small title-screen Yasu is lowered until the center of his face meets the sea horizon. His circular face uses a one-pixel black outline, and his black outfit includes the same short white tie as the in-game figure.
- In the room scene, Yasu's white tie is 22 pixels tall (about one third of its former length); the black torso still extends to the bottom of the picture.

- The logical display is exactly 256×240 pixels. Vertical scaling remains integer-only (1×, 2×, 3×), while a 1.25× horizontal pixel-aspect correction presents the complete screen at 4:3 like a consumer CRT; scale breakpoints account for the wider frame so portrait phones do not overflow.
- The CSS palette is a fixed 16-color NES-inspired subset. Scenes use flat fills; each small character sprite uses no more than four visible colors.
- The title vignette contains buildings, sky, a straight sea horizon, and one small centered Yasu without face lettering. It has no road or body outline.
- The story screen follows the recognizable early FC adventure partition: a 174×128 framed room scene at upper left, a bordered six-line command list at upper right, and a 100-pixel-tall dialogue area below. The room uses flat color blocks, a barred window, and no desk. It contains only one front-facing Yasu: blocky black hair, a round blank head with white 「ヤ」「ス」 lettering separated by two logical pixels, a black square body reaching the picture bottom, and a short white tie. The lettering has no outline, and the face has no eyes or mouth. There is no boss or foreground player. Yasu stops trembling once the first punchline appears.
- Japanese dialogue normally stays in one continuous `話者「本文」` string and wraps naturally at the screen edge. The reward line contains one intentional hard break before `３０００円`.
- Every dialogue page is absolutely pinned two pixels below the scene boundary. Its animated ▼ is inline immediately after the completed closing quote.
- Text remains readable and all kana input remains available by touch on phones.
- No copied screenshots, sprites, logos, characters, or music are used.
- Animation is reduced when `prefers-reduced-motion` is enabled.

## Structure

- `src/game.ts` — pure immutable state transitions, dialogue data, and kana list.
- `src/render.ts` — turns a `GameState` into accessible DOM markup.
- `src/main.ts` — global click/key control, character-by-character timing and blips, the locked one-second flash/thunder reveal, delayed two-stage punchlines, comic fanfare playback, the final sting, and rendering coordination.
- `src/style.css` — the complete 256×240 presentation, 16-color palette, CSS pixel scenes, and integer scaling rules.

Pure gameplay transitions belong in `src/game.ts` and stay DOM-free so Vitest can cover the full route to the ending.
