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
5. 「ヤス」 triggers a one-second reveal beat before any dialogue appears. The background and screen colors remain unchanged: the supplied `ショック1.mp3` effect plays and Yasu shakes by four logical pixels, with no full-screen flash. Input is ignored during this beat. After exactly one second the large shake stops, Yasu returns to the smaller tremble, and `ヤス「な、なぜわかったんですかっ！？」` begins typing.
6. The player answers `あなた「タイトルにかいてあったよ」` and presses it with `あなた「もじどおり　かおにもかいてある」`, then asks `あなた「ヤス、なんで　ごうとうさつじんなんてしたんだ」`. The ending advances through Yasu's motive, explicitly line-broken reward (`でももらったほうしゅうは` / `３０００円でしたよ　はっはっは`), and attitude. Every punchline uses the same two-beat rhythm: its setup waits 1.25 seconds after the line and enters with a short 8-bit pop, then the larger 「ヤスッ！」 follows 700 ms later with the supplied `ビシッとツッコミ2.mp3` effect. Both are thick white text with a fine one-pixel pink outline and no box:
   - 「なぞときが」 → 「ヤスッ！」
   - 「表現が」 → 「ヤスッ！」
   - 「動機がヤスッ！」
   - 「報酬もヤスッ！」
   - 「人として」 → 「ヤスッ！」
   - 「みとおしが」 → 「ヤスッ！」
   Once a 「ヤスッ！」 has appeared it is protected for 900 ms, so a tap cannot skip past a comeback that has only just landed.
7. Two pages then close the room. First the player states the sentence, `あなた「ごうとうさつじんだから` / `しけいか　むきちょうえきだぞ」`, with a hard break before 「しけいか」 and no comeback of its own: the moment it finishes typing the supplied `ショック1.mp3` effect plays and Yasu shakes by four logical pixels for exactly one second, identical to the reveal, while the line stays on screen and input is ignored. Yasu then pleads `ヤス「エッ？　しっこうゆうよはつかないですか！？」`, and that page takes the last comeback on the ordinary rhythm and with the ordinary cues, since the gag only reads as a repeat when it sounds like one.
8. After 「みとおしが」 / 「ヤスッ！」 appears, input is locked. Exactly one second later a short synthesized 8-bit handcuff clack plays and the room drains to black over 1.8 seconds, losing saturation and brightness together, before the sunset final screen begins. A small anonymous escort and the handcuffed detective Yasu start at X=152 pixels, near the right of the street, bob by one logical pixel, and walk for 3.2 seconds until they disappear beyond the left edge, so the walk crosses the frame rather than beginning half off it. They are removed before any final caption renders, so rerendering can never restart the walk. There is no foreground player. `THE END` is thick plain white text and there is no ending music. After both figures leave, 「このゲーム」 and 「なにもかも」 enter together on two lines with the lead pop. The usual 700 ms later, 「ヤスッ！」 appears on a third line with the supplied `ドーン.mp3` effect while both setup lines remain above it. All three lines are nowrap enlargements of the room punchline typography, sized so every character fits inside the screen. Each 「ヤスッ！」 in the game plays its pop exactly once: a redraw of the same page leaves a landed payoff standing rather than replaying it. One second after the payoff appears, the entire ending begins a slow fade and then returns to the title automatically.
9. The kana grid offers 「ボ」 where 「ホ」 used to be, so 「ボス」 can be entered, and the three letters either ending needs — 「ヤ」「ス」「ボ」 — are drawn one pixel thicker than the rest as a nudge. Naming the boss opens Yasu's own ending instead of the arrest, over four pages: `ヤス「ボス　じはくとして` / `ろくおんさせてもらいましたよ」` opens on the same unease cue Yasu first walked in on; `ヤス「それ　そのままじじつに` / `させてもらいますわ」` finishes typing, and his shoulders start shaking with a stifled laugh on that same cue again; then `ヤス「はんにん　ていこうのため` / `やむなくせいあつ」`, which opens on a synthesized clack as a plain round muzzle appears beside Yasu — he draws on the line that justifies it, and it stays up for the rest of the route — and then `ヤス「ボス　ありがとう` / `そしてさようなら」`. Advancing past the last line runs the rest unattended, with all input ignored: the supplied `ドーン.mp3` fires 700 ms later as the room floods red over 1.6 seconds, `THE END` appears on the red once the flood completes, and 「ボスのいのち」 / 「ヤスッ！」 then lands on the ordinary two-beat rhythm with the ordinary comeback effect, at the same 36-pixel size the room's comebacks use so that all four characters fit inside the screen. The screen fades and returns to the title on its own. Any other two characters are still refused as before.
10. Taps, clicks, and unmodified keys are ignored throughout `THE END`, preventing the player from skipping the final joke. Input becomes active again only after the automatic return to a clean title state; no retry button is shown.

## Controls

- Dialogue is typed one character at a time. Any click anywhere in the game or any unmodified non-Tab key completes the current line first, then advances on the next input.
- Select katakana with the on-screen panel. `Backspace` removes the last selected character.
- 「けす」 removes one character; 「ぜんぶけす」 removes both; 「けってい」 submits two characters.
- There is no sound control. The supplied `不安（ピアノ演奏）.mp3` starts once at the beginning of the opening Yasu dialogue. Character-by-character dialogue has a square-wave blip at the same 0.018 gain as the first punchline cue. Kana choices make a short click and 「けってい」 makes a two-note confirmation. Ordinary dialogue navigation remains silent; the reveal, both halves of each punchline, and the finale have their own effects. The second punchline cue remains intentionally much louder.

## Presentation

- Link previews use the title 「犯人はヤス」 and the spoiler-free description 「あなたはこの謎が解けるか？　推理アドベンチャー。」 consistently for standard, Open Graph, and X/Twitter metadata.
- The small title-screen Yasu is lowered until the center of his face meets the sea horizon. His circular face uses a one-pixel black outline, and his black outfit includes the same short white tie as the in-game figure.
- In the room scene, Yasu's white tie is 22 pixels tall (about one third of its former length); the black torso still extends to the bottom of the picture.

- The logical display is exactly 256×240 pixels. A 1.25× horizontal pixel-aspect correction presents the complete screen at 4:3 like a consumer CRT. Desktop scaling remains 1×, 2×, or 3×; below 660 CSS pixels, a continuous outer scale fills the available phone width without changing any logical coordinates.
- The CSS palette is a fixed 16-color NES-inspired subset. Scenes use flat fills; each small character sprite uses no more than four visible colors.
- The title vignette contains buildings, sky, a straight sea horizon, and one small centered Yasu without face lettering. He is a roughly half-scale 29×39-pixel version of the room character, with the same round head, symmetric center-parted hair, black body, and short white tie. It has no road or body outline.
- The story screen uses a broad 236×150 framed room scene above an 80-pixel-tall dialogue area. There is no unused command list. The room uses flat color blocks, a barred window, and no desk. It contains only one centered, front-facing Yasu rendered from the author's supplied 32×48 transparent PNG. The title uses the untouched source at 1× and omits face lettering. The room uses exact 2× nearest-neighbor scaling for the source image and overlays smaller white 「ヤ」「ス」 lettering entirely inside its yellow face. The source's final row is continued vertically with identical color runs until the room body reaches the scene bottom; the title continues it only five pixels. The image is split at source row 26 into head and torso display layers so each existing animation can move only its intended half. There is no boss or foreground player. Yasu stops trembling once the first punchline appears. While 「はっはっは」 is visible, only his torso bobs vertically by two pixels.
- Two-stage punchlines begin two logical pixels below Yasu's chin, sit entirely within the framed room scene, and end above the dialogue area; they never overlap his face or ordinary text.
- When the completed 「まあ しょはんだし」 page is visible and before its comeback begins, only Yasu's head nods down and up twice, by six logical pixels; the body remains still.
- Japanese dialogue normally stays in one continuous `話者「本文」` string and wraps naturally at the screen edge. The reward line contains one intentional hard break before `３０００円`.
- Every dialogue page is absolutely pinned two pixels below the scene boundary. Its animated ▼ is inline immediately after the completed closing quote.
- Text remains readable and all kana input remains available by touch on phones.
- No copied screenshots, sprites, logos, characters, or music are used.
- Story timing, character animation, the escort walk, text typing, punchline cues, and sound triggers remain identical across phones and desktop browsers even when the operating system reports `prefers-reduced-motion: reduce`. These movements carry the joke and are treated as essential game content rather than optional interface motion.

## Structure

- `src/game.ts` — pure immutable state transitions, dialogue data, and kana list.
- `src/render.ts` — turns a `GameState` into accessible DOM markup.
- `src/main.ts` — global click/key control, character-by-character timing and blips, playback of the supplied opening/reveal/punchline/finale effects, the locked one-second reveal shake, delayed two-stage punchlines, and rendering coordination.
- `src/style.css` — the complete 256×240 presentation, 16-color palette, CSS pixel scenes, and integer scaling rules.

Pure gameplay transitions belong in `src/game.ts` and stay DOM-free so Vitest can cover the full route to the ending.
