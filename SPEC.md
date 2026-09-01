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
5. 「ヤス」 triggers a one-second reveal beat before any dialogue appears. The background and screen colors remain unchanged: a low double-hit thunder crash plays and Yasu shakes by four logical pixels, with no full-screen flash. Input is ignored during this beat. After exactly one second the large shake stops, Yasu returns to the smaller tremble, and `ヤス「な、なぜわかったんですかっ！？」` begins typing.
6. The player answers `あなた「タイトルにかいてあった」`, then asks `あなた「ヤス、なんで　ごうとうさつじんなんてしたんだ」`. The ending advances through Yasu's motive, explicitly line-broken reward (`でももらったほうしゅうは` / `３０００円でしたよ　はっはっは`), and attitude. Every punchline uses the same two-beat rhythm: its setup waits 1.25 seconds after the line and enters with a short 8-bit pop, then the larger 「ヤスッ！」 follows 700 ms later with a comic fanfare. Both are thick white text with a fine one-pixel pink outline and no box:
   - 「なぞときが」 → 「ヤスッ！」
   - 「動機がヤスッ！」
   - 「報酬もヤスッ！」
   - 「人として」 → 「ヤスッ！」
7. The final screen is a sunset city with a lighter road and a centered sun half below the horizon. A small anonymous escort and the handcuffed detective Yasu start at X=41 pixels—halfway between their former X=82 position and the left edge—bob by one logical pixel, and walk for 2.4 seconds until they disappear beyond the left edge. They are removed before any final caption renders, so rerendering can never restart the walk. There is no foreground player. `THE END` is thick plain white text and there is no ending music. After both figures leave, 「このゲームの」 and 「ぜんぶがぜんぶ」 enter together on two lines with the lead pop. The usual 700 ms later, a notably larger 60-pixel 「ヤスッ！」 appears on a third line with the exaggerated final sting while both setup lines remain above it. All three lines are nowrap enlargements of the room punchline typography. One second after the payoff appears, the entire ending begins a slow fade and then returns to the title automatically.
8. Taps, clicks, and unmodified keys are ignored throughout `THE END`, preventing the player from skipping the final joke. Input becomes active again only after the automatic return to a clean title state; no retry button is shown.

## Controls

- Dialogue is typed one character at a time. Any click anywhere in the game or any unmodified non-Tab key completes the current line first, then advances on the next input.
- Select katakana with the on-screen panel. `Backspace` removes the last selected character.
- 「けす」 removes one character; 「ぜんぶけす」 removes both; 「けってい」 submits two characters.
- There is no sound control. Character-by-character dialogue has a square-wave blip at the same 0.018 gain as the first punchline cue. Kana choices make a short click and 「けってい」 makes a two-note confirmation. Ordinary dialogue navigation remains silent; the reveal, both halves of each punchline, and the finale have their own effects. The second punchline cue remains intentionally much louder.

## Presentation

- Link previews use the title 「犯人はヤス」 and the spoiler-free description 「あなたはこの謎が解けるか？　推理アドベンチャー。」 consistently for standard, Open Graph, and X/Twitter metadata.
- The small title-screen Yasu is lowered until the center of his face meets the sea horizon. His circular face uses a one-pixel black outline, and his black outfit includes the same short white tie as the in-game figure.
- In the room scene, Yasu's white tie is 22 pixels tall (about one third of its former length); the black torso still extends to the bottom of the picture.

- The logical display is exactly 256×240 pixels. Vertical scaling remains integer-only (1×, 2×, 3×), while a 1.25× horizontal pixel-aspect correction presents the complete screen at 4:3 like a consumer CRT; scale breakpoints account for the wider frame so portrait phones do not overflow.
- The CSS palette is a fixed 16-color NES-inspired subset. Scenes use flat fills; each small character sprite uses no more than four visible colors.
- The title vignette contains buildings, sky, a straight sea horizon, and one small centered Yasu without face lettering. He is a roughly half-scale 29×39-pixel version of the room character, with the same round head, symmetric center-parted hair, black body, and short white tie. It has no road or body outline.
- The story screen uses a broad 236×150 framed room scene above an 80-pixel-tall dialogue area. There is no unused command list. The room uses flat color blocks, a barred window, and no desk. It contains only one centered, front-facing Yasu: symmetric center-parted hair made from one continuous black polygon with an octagonal rounded top, fine diagonal fringes, and no central gap; a 50-pixel softly squared blank head in muted yellow skin with smaller white 「ヤ」「ス」 lettering raised two pixels; and a shoulder-shaped blue jacket reaching the picture bottom over a white shirt, paired white collars, and a 26-pixel red tie. The title uses the same colors and proportions at half scale. The lettering has no outline, and the face has no eyes or mouth. There is no boss or foreground player. Yasu stops trembling once the first punchline appears. While 「はっはっは」 is visible, only his torso bobs vertically by two pixels.
- Two-stage punchlines begin two logical pixels below Yasu's chin, sit entirely within the framed room scene, and end above the dialogue area; they never overlap his face or ordinary text.
- Japanese dialogue normally stays in one continuous `話者「本文」` string and wraps naturally at the screen edge. The reward line contains one intentional hard break before `３０００円`.
- Every dialogue page is absolutely pinned two pixels below the scene boundary. Its animated ▼ is inline immediately after the completed closing quote.
- Text remains readable and all kana input remains available by touch on phones.
- No copied screenshots, sprites, logos, characters, or music are used.
- Animation is reduced when `prefers-reduced-motion` is enabled.

## Structure

- `src/game.ts` — pure immutable state transitions, dialogue data, and kana list.
- `src/render.ts` — turns a `GameState` into accessible DOM markup.
- `src/main.ts` — global click/key control, character-by-character timing and blips, the locked one-second thunder/shake reveal, delayed two-stage punchlines, comic fanfare playback, the final sting, and rendering coordination.
- `src/style.css` — the complete 256×240 presentation, 16-color palette, CSS pixel scenes, and integer scaling rules.

Pure gameplay transitions belong in `src/game.ts` and stay DOM-free so Vitest can cover the full route to the ending.
