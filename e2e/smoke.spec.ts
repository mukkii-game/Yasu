import { expect, test } from '@playwright/test';

async function finishDialogue(page: import('@playwright/test').Page, testId: string) {
  const box = page.getByTestId(testId);
  await expect(box.locator('.next-mark')).toBeVisible({ timeout: 10_000 });
}

async function advanceDialogue(page: import('@playwright/test').Page, testId: string) {
  await finishDialogue(page, testId);
  await page.getByTestId(testId).click();
}

async function reachInput(page: import('@playwright/test').Page) {
  await page.getByTestId('start-button').click();
  for (let index = 0; index < 3; index += 1) {
    await advanceDialogue(page, 'dialogue-next');
  }
  await expect(page.getByTestId('kana-panel')).toBeVisible();
}

async function playedSoundFiles(page: import('@playwright/test').Page) {
  return page.evaluate(() => (
    window as typeof window & { __playedSounds: string[] }
  ).__playedSounds.map((source) => new URL(source).pathname.split('/').pop()));
}

/** Every play and pause in order, so a cue that must be cut can be checked. */
async function soundLogFor(page: import('@playwright/test').Page, file: string) {
  return page.evaluate((wanted) => (
    window as typeof window & { __soundLog: string[] }
  ).__soundLog.filter((entry) => entry.endsWith(`:${wanted}`)).map((entry) => entry.split(':')[0]), file);
}

function countOf(files: readonly (string | undefined)[], file: string) {
  return files.filter((entry) => entry === file).length;
}

/** Records play/pause on every audio element, plus the ordinary played list. */
const SOUND_SPY = () => {
  const playedSounds: string[] = [];
  Object.defineProperty(window, '__playedSounds', { value: playedSounds });
  const soundLog: string[] = [];
  Object.defineProperty(window, '__soundLog', { value: soundLog });
  const nameOf = (element: HTMLMediaElement) => new URL(element.src).pathname.split('/').pop();
  HTMLMediaElement.prototype.play = function play(this: HTMLMediaElement) {
    playedSounds.push(this.src);
    soundLog.push(`play:${nameOf(this)}`);
    return Promise.resolve();
  };
  const realPause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.pause = function pause(this: HTMLMediaElement) {
    soundLog.push(`pause:${nameOf(this)}`);
    return realPause.call(this);
  };
};

test.describe('犯人はヤス', () => {
  test('shows the FC-style title and opens the kana input', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('start-button')).toContainText('犯人はヤス');
    const shareDescription = 'あなたはこの謎が解けるか？　推理アドベンチャー。';
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', shareDescription);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', shareDescription);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', shareDescription);
    await expect(page.locator('.title-yasu')).toBeVisible();
    await expect(page.locator('.title-yasu')).toHaveCSS('width', '32px');
    await expect(page.locator('.title-yasu')).toHaveCSS('height', '48px');
    await expect(page.locator('.title-yasu img')).toHaveCSS('image-rendering', 'pixelated');
    await expect.poll(() => page.locator('.title-yasu').evaluate((sprite) => getComputedStyle(sprite, '::after').height)).toBe('5px');
    await expect.poll(() => page.locator('.title-city').evaluate((city) => getComputedStyle(city, '::after').content)).toBe('none');
    const screenRatio = await page.locator('.screen-frame').evaluate((frame) => {
      const rect = frame.getBoundingClientRect();
      return rect.width / rect.height;
    });
    expect(screenRatio).toBeCloseTo(4 / 3, 2);
    const titleYasu = await page.evaluate(() => {
      const city = document.querySelector('.title-city')!.getBoundingClientRect();
      const figure = document.querySelector('.title-yasu')!.getBoundingClientRect();
      const sprite = document.querySelector('.title-yasu img') as HTMLImageElement;
      const scale = city.height / 128;
      return {
        faceCenter: figure.top + figure.height / 3,
        horizon: city.top + 91 * scale,
        figureCenter: (figure.left + figure.right) / 2,
        cityCenter: (city.left + city.right) / 2,
        naturalWidth: sprite.naturalWidth,
        naturalHeight: sprite.naturalHeight,
      };
    });
    expect(Math.abs(titleYasu.faceCenter - titleYasu.horizon)).toBeLessThanOrEqual(4);
    expect(Math.abs(titleYasu.figureCenter - titleYasu.cityCenter)).toBeLessThanOrEqual(2);
    expect(titleYasu.naturalWidth).toBe(32);
    expect(titleYasu.naturalHeight).toBe(48);
    await reachInput(page);
    await expect(page.getByTestId('answer-slots')).toContainText('＿＿');
  });

  test('advances dialogue when the room itself is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    await expect(page.locator('.command-window')).toHaveCount(0);
    await expect(page.locator('.office-scene')).toHaveCSS('width', '236px');
    await expect(page.locator('.yasu')).toHaveCSS('width', '64px');
    await expect(page.locator('.yasu')).toHaveCSS('height', '132px');
    await expect(page.locator('.yasu .head')).toHaveCSS('width', '64px');
    await expect(page.locator('.yasu .head')).toHaveCSS('height', '52px');
    await expect(page.locator('.yasu .body')).toHaveCSS('height', '80px');
    await expect(page.locator('.yasu img')).toHaveCount(2);
    await expect(page.locator('.yasu img').first()).toHaveCSS('image-rendering', 'pixelated');
    await expect(page.locator('.yasu .face-name')).toHaveCSS('font-size', '13px');
    await expect(page.locator('.yasu .face-name')).toHaveCSS('top', '16px');
    const spriteSources = await page.locator('.yasu img').evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src));
    expect(new Set(spriteSources).size).toBe(1);
    const bodyReachesSceneBottom = await page.evaluate(() => {
      const body = document.querySelector('.yasu .body')!.getBoundingClientRect();
      const scene = document.querySelector('.office-scene')!.getBoundingClientRect();
      return Math.abs(body.bottom - scene.bottom) <= 4;
    });
    expect(bodyReachesSceneBottom).toBe(true);
    await finishDialogue(page, 'dialogue-next');
    await page.locator('.office-scene').click();
    await expect(page.getByTestId('dialogue-next')).toContainText('えっ？');
    await finishDialogue(page, 'dialogue-next');
    const gap = await page.evaluate(() => {
      const screen = document.querySelector('.game-screen')!.getBoundingClientRect();
      const scene = document.querySelector('.office-scene')!.getBoundingClientRect();
      const copy = document.querySelector('.dialogue-copy')!.getBoundingClientRect();
      const verticalScale = screen.height / 240;
      return (copy.top - scene.bottom) / verticalScale;
    });
    expect(gap).toBeLessThanOrEqual(5);
    await expect(page.getByTestId('dialogue-next').locator('.dialogue-copy > .next-mark')).toBeVisible();
  });

  test('rejects a wrong name and allows another try', async ({ page }) => {
    await page.goto('/');
    await reachInput(page);
    await page.getByRole('button', { name: 'ア', exact: true }).click();
    await page.getByRole('button', { name: 'イ', exact: true }).click();
    await page.getByTestId('decide').click();
    await finishDialogue(page, 'wrong-next');
    await expect(page.getByTestId('wrong-next')).toContainText('いや、ちがうでしょう。やっぱめいきゅういりですよ。');
    await page.getByTestId('wrong-next').click();
    await expect(page.getByTestId('kana-panel')).toBeVisible();
  });

  test('reveals Yasu for the correct two characters', async ({ page }) => {
    await page.goto('/');
    await reachInput(page);
    await page.getByRole('button', { name: 'ヤ', exact: true }).click();
    await page.getByRole('button', { name: 'ス', exact: true }).click();
    await expect(page.getByTestId('answer-slots')).toContainText('ヤス');
    await page.getByTestId('decide').click();
    await expect(page.locator('[data-scene-mode="impact"]')).toBeVisible();
    await expect(page.getByTestId('game-screen')).toHaveClass(/reveal-impact/);
    await expect.poll(() => page.getByTestId('game-screen').evaluate((screen) => getComputedStyle(screen, '::after').content)).toBe('none');
    await expect(page.getByTestId('reveal-next')).toHaveCount(0);
    await expect(page.locator('.face-name')).toHaveText('ヤス');
    await finishDialogue(page, 'reveal-next');
    await expect(page.locator('[data-scene-mode="nervous"]')).toBeVisible();
    await expect(page.getByTestId('reveal-next')).toContainText('なぜわかったんですかっ');
  });

  test('reveals the face clue with a two-beat punchline', async ({ page }) => {
    await page.goto('/');
    await reachInput(page);
    await page.getByRole('button', { name: 'ヤ', exact: true }).click();
    await page.getByRole('button', { name: 'ス', exact: true }).click();
    await page.getByTestId('decide').click();
    await advanceDialogue(page, 'reveal-next');
    await finishDialogue(page, 'ending-next');
    await expect(page.getByTestId('ending-next')).toContainText('タイトルにかいてあった');
    await expect(page.getByTestId('ending-next')).not.toContainText('タイトルにかいてあったから');
    await expect(page.getByTestId('punchline')).toHaveCount(0);
    await expect(page.getByTestId('punchline').locator('span')).toHaveText('なぞときが');
    await expect(page.getByTestId('punchline').locator('strong')).toHaveText('ヤスッ！');

    // An eager tap must not skip 「ヤスッ！」 before it has finished landing.
    const survivedTap = await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="ending-next"]')?.click();
      return document.querySelector('[data-testid="punchline"] span')?.textContent ?? null;
    });
    expect(survivedTap).toBe('なぞときが');
    await expect(page.locator('[data-scene-mode="settled"]')).toBeVisible();
    const punchlineBounds = await page.evaluate(() => {
      const scene = document.querySelector('.office-scene')!.getBoundingClientRect();
      const head = document.querySelector('.yasu .head')!.getBoundingClientRect();
      const punchline = document.querySelector('.sprite-punchline')!.getBoundingClientRect();
      const dialogue = document.querySelector('.dialogue-box')!.getBoundingClientRect();
      return {
        insideScene: punchline.top >= scene.top && punchline.bottom <= scene.bottom,
        belowFace: punchline.top >= head.bottom,
        aboveDialogue: punchline.bottom <= dialogue.top,
      };
    });
    expect(punchlineBounds).toEqual({ insideScene: true, belowFace: true, aboveDialogue: true });
  });

  test('boots without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await expect(page.getByTestId('game-screen')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('serves every supplied MP3 cue', async ({ request }) => {
    for (const filename of [
      'anxiety.mp3', 'punchline-hit.mp3', 'reveal-shock.mp3', 'final-boom.mp3',
      'dissonance.mp3', 'comic-pratfall.mp3', 'magazine-release.mp3', 'leather-steps.mp3',
      'scene-change.mp3',
    ]) {
      const response = await request.get(`/audio/${filename}`);
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('audio/mpeg');
      expect((await response.body()).length).toBeGreaterThan(10_000);
    }
  });

  test('lands each comeback exactly once, then walks Yasu off', async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(SOUND_SPY);
    await page.addInitScript(() => {
      // Every 「ヤスッ！」 that pops, so a re-render replaying one is caught.
      const pops: string[] = [];
      Object.defineProperty(window, '__pops', { value: pops });
      document.addEventListener('animationstart', (event) => {
        const animation = event as AnimationEvent;
        if (animation.animationName !== 'punch-pop') return;
        const element = animation.target as HTMLElement;
        if (!element.textContent?.includes('ヤスッ')) return;
        pops.push(element.closest('[data-testid]')?.getAttribute('data-testid') ?? '?');
      }, true);
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await reachInput(page);
    expect(await playedSoundFiles(page)).toContain('anxiety.mp3');
    await page.getByRole('button', { name: 'ヤ', exact: true }).click();
    await page.getByRole('button', { name: 'ス', exact: true }).click();
    await page.getByTestId('decide').click();
    expect(await playedSoundFiles(page)).toContain('reveal-shock.mp3');
    await advanceDialogue(page, 'reveal-next');

    const shocksBeforeSentence = (await playedSoundFiles(page)).filter((file) => file === 'reveal-shock.mp3').length;

    for (const [index, hasPunchline] of [true, true, false, true, true, true].entries()) {
      await finishDialogue(page, 'ending-next');
      if (index === 1) await expect(page.getByTestId('ending-next')).toContainText('かおにかいてある');
      if (index === 4) await expect(page.locator('.office-scene')).toHaveClass(/laughing/);
      if (index === 5) {
        await expect(page.locator('.office-scene')).toHaveClass(/nodding/);
        await expect(page.locator('.yasu .head')).toHaveCSS('animation-name', 'nod-twice');
        await expect(page.locator('.yasu .body')).not.toHaveCSS('animation-name', 'nod-twice');
      }
      if (hasPunchline) await expect(page.getByTestId('punchline').locator('strong')).toHaveText('ヤスッ！', { timeout: 10_000 });
      if (hasPunchline) expect(await playedSoundFiles(page)).toContain('punchline-hit.mp3');
      if (index === 1) await expect(page.getByTestId('punchline').locator('span')).toHaveText('表現が');
      if (index === 5) await expect(page.getByTestId('punchline').locator('span')).toHaveText('人として');
      // A landed comeback holds input, so wait it out rather than tapping into it.
      if (hasPunchline) await page.waitForTimeout(1_000);
      await page.getByTestId('ending-next').click();
    }

    // The sentence sets the plea up and carries neither the shock nor a comeback.
    await finishDialogue(page, 'ending-next');
    await expect(page.getByTestId('ending-next')).toContainText('むきちょうえき');
    await expect(page.getByTestId('punchline')).toHaveCount(0);
    expect((await playedSoundFiles(page)).filter((file) => file === 'reveal-shock.mp3').length)
      .toBe(shocksBeforeSentence);
    await page.getByTestId('ending-next').click();

    // The shock strikes before the plea, exactly as it does at the reveal: the
    // box drops away, the room shakes, and only then does he speak.
    await expect(page.getByTestId('game-screen')).toHaveClass(/reveal-impact/);
    await expect(page.getByTestId('ending-next')).toHaveCount(0);
    await expect(page.locator('.office-scene')).toHaveClass(/impact/);
    await expect(page.locator('.yasu')).toHaveCSS('animation-name', 'impact-tremble');
    expect((await playedSoundFiles(page)).filter((file) => file === 'reveal-shock.mp3').length)
      .toBe(shocksBeforeSentence + 1);
    await finishDialogue(page, 'ending-next');
    await expect(page.getByTestId('ending-next')).toContainText('しっこうゆうよ');
    // Once the strike is over he keeps shaking: the gag pages settle him, this
    // one must not.
    await expect(page.locator('.office-scene')).toHaveAttribute('data-scene-mode', 'nervous');
    await expect(page.locator('.office-scene .yasu')).toHaveCSS('animation-name', 'tremble');
    const hitsBeforePlea = (await playedSoundFiles(page)).filter((file) => file === 'punchline-hit.mp3').length;
    await expect(page.getByTestId('punchline').locator('span')).toHaveText('みとおしが', { timeout: 10_000 });
    await expect(page.getByTestId('punchline').locator('strong')).toHaveText('ヤスッ！');
    expect((await playedSoundFiles(page)).filter((file) => file === 'punchline-hit.mp3').length)
      .toBe(hitsBeforePlea + 1);

    // Then the room drains of colour and light on the way to the sunset.
    await expect(page.getByTestId('game-screen')).toHaveCSS('animation-name', 'verdict-fade', { timeout: 10_000 });
    await expect(page.getByTestId('the-end')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('end-screen')).not.toHaveAttribute('data-action');
    await page.getByTestId('end-screen').click({ position: { x: 120, y: 100 } });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('the-end')).toBeVisible();
    const escortTiming = await page.evaluate(() => {
      const walkers = document.querySelector('.walkers');
      const escortRule = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .find((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === '.walkers');
      return {
        left: escortRule?.style.left,
        duration: escortRule?.style.animationDuration,
        computedDuration: walkers ? getComputedStyle(walkers).animationDuration : undefined,
      };
    });
    expect(escortTiming).toEqual({ left: '41px', duration: '2.4s', computedDuration: '2.4s' });
    // Leather shoes carry the walk, and the clip is far longer than it.
    expect(await playedSoundFiles(page)).toContain('leather-steps.mp3');
    await expect(page.getByTestId('end-punchline').locator('.end-setup b')).toHaveText(['このゲーム', 'なにもかも'], { timeout: 10_000 });
    await expect(page.locator('.walkers')).toHaveCount(0);
    // By the time they are off the screen the footsteps have been cut, so the
    // clip never runs on under the comeback.
    await expect.poll(() => soundLogFor(page, 'leather-steps.mp3').then((log) => log.at(-1)))
      .toBe('pause');
    await expect(page.getByTestId('end-punchline').locator('strong')).toHaveCount(0);
    await expect(page.getByTestId('end-punchline').locator('strong')).toHaveText('ヤスッ！');
    expect(await playedSoundFiles(page)).toContain('final-boom.mp3');
    await expect(page.getByTestId('end-punchline').locator('.end-setup b')).toHaveText(['このゲーム', 'なにもかも']);
    const endFits = await page.evaluate(() => {
      const screen = (document.querySelector('[data-testid="game-screen"]') as HTMLElement).offsetWidth;
      return (document.querySelector('[data-testid="end-punchline"] strong') as HTMLElement).offsetWidth <= screen;
    });
    expect(endFits).toBe(true);

    // Both comebacks stay, and each lands once. Re-rendering used to recreate
    // the node and restart its animation, so 「みとおしが ヤスッ！」 popped a
    // second time when the custody transition redrew the page.
    const pops = await page.evaluate(() => (window as typeof window & { __pops: string[] }).__pops);
    expect(pops.filter((where) => where === 'punchline')).toHaveLength(6);
    expect(pops.filter((where) => where === 'end-punchline')).toHaveLength(1);
    await expect(page.getByTestId('end-punchline')).toHaveCSS('white-space', 'nowrap');
    await expect(page.getByTestId('end-punchline')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.getByTestId('end-screen')).toHaveCSS('animation-name', 'end-screen-fade');
    await expect(page.getByTestId('start-button')).toBeVisible({ timeout: 6_000 });
  });

  test('lets Yasu turn the confession on the boss', async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(SOUND_SPY);
    await page.goto('/');
    await reachInput(page);

    // ホ is gone from the grid so that ボ can be there instead.
    await expect(page.getByRole('button', { name: 'ボ', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ホ', exact: true })).toHaveCount(0);

    // ヤ, ス and ボ are drawn a pixel thicker; nothing else in the grid is.
    const hinted = await page.evaluate(() => {
      const shadow = (kana: string) => getComputedStyle(
        document.querySelector(`[data-kana="${kana}"]`)!,
      ).textShadow;
      return { ya: shadow('ヤ'), su: shadow('ス'), bo: shadow('ボ'), plain: shadow('ア') };
    });
    expect(hinted.plain).toBe('none');
    expect(hinted.ya).not.toBe('none');
    expect(hinted.su).toBe(hinted.ya);
    expect(hinted.bo).toBe(hinted.ya);

    const uneaseBeforeRoute = (await playedSoundFiles(page))
      .filter((file) => file === 'anxiety.mp3').length;

    await page.getByRole('button', { name: 'ボ', exact: true }).click();
    await page.getByRole('button', { name: 'ス', exact: true }).click();
    await page.getByTestId('decide').click();

    // He opens laughing it off on the bright cue, with no gun yet. The laugh is
    // the reward line's shoulder bob and nothing else: no tremble underneath.
    await expect(page.getByTestId('boss-next')).toContainText('ごじょうだんを');
    await expect(page.getByTestId('gun')).toHaveCount(0);
    await expect(page.locator('.office-scene.laughing .yasu .body'))
      .toHaveCSS('animation-name', 'laugh-bob');
    await expect(page.locator('.office-scene')).toHaveAttribute('data-scene-mode', 'plain');
    await expect(page.locator('.office-scene .yasu')).toHaveCSS('animation-name', 'none');
    expect(await playedSoundFiles(page)).toContain('comic-pratfall.mp3');
    expect(countOf(await playedSoundFiles(page), 'anxiety.mp3')).toBe(uneaseBeforeRoute);
    await advanceDialogue(page, 'boss-next');

    // The recording lands on the player: the cue hits from the first character,
    // not once the line has finished, and he freezes solid under it.
    await expect(page.getByTestId('boss-next')).toContainText('でも');
    expect(countOf(await playedSoundFiles(page), 'anxiety.mp3')).toBe(uneaseBeforeRoute + 1);
    await expect(page.locator('.office-scene')).toHaveAttribute('data-scene-mode', 'plain');
    await expect(page.locator('.office-scene.laughing')).toHaveCount(0);
    await expect(page.locator('.office-scene .yasu')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.office-scene .yasu .body')).toHaveCSS('animation-name', 'none');
    await finishDialogue(page, 'boss-next');
    await expect(page.getByTestId('boss-next')).toContainText('ろくおんさせて');
    await expect(page.getByTestId('game-screen')).not.toHaveClass(/boss-shock/);
    await page.getByTestId('boss-next').click();

    // 「これ」, not 「それ」 — and the page opens on the dissonance. He only
    // trembles here; the laugh is done.
    await expect(page.getByTestId('boss-next')).toContainText('これ');
    expect(await playedSoundFiles(page)).toContain('dissonance.mp3');
    await finishDialogue(page, 'boss-next');
    await expect(page.getByTestId('boss-next')).toContainText('これ　そのままじじつに');
    await expect(page.locator('.office-scene.laughing')).toHaveCount(0);
    await expect(page.locator('.office-scene')).toHaveAttribute('data-scene-mode', 'nervous');
    await page.getByTestId('boss-next').click();

    // He draws on the line that justifies it, not once the screen has gone: the
    // magazine drops out and the unease comes back with it.
    await expect(page.getByTestId('boss-next')).toContainText('はんにん');
    await expect(page.getByTestId('gun')).toBeVisible();
    expect(await playedSoundFiles(page)).toContain('magazine-release.mp3');
    expect(countOf(await playedSoundFiles(page), 'anxiety.mp3')).toBe(uneaseBeforeRoute + 2);
    await finishDialogue(page, 'boss-next');
    await expect(page.getByTestId('boss-next')).toContainText('やむなくせいあつ　ってね');
    await page.getByTestId('boss-next').click();

    // He nods on the thanks, then signs off; the gun stays up for both.
    await finishDialogue(page, 'boss-next');
    await expect(page.getByTestId('boss-next')).toContainText('ボス　いままでありがとう');
    await expect(page.locator('.office-scene.nodding-once .yasu .head'))
      .toHaveCSS('animation-name', 'nod-once');
    await expect(page.getByTestId('gun')).toBeVisible();
    await page.getByTestId('boss-next').click();

    await finishDialogue(page, 'boss-next');
    await expect(page.getByTestId('boss-next')).toContainText('そしてさようなら');
    await expect(page.getByTestId('gun')).toBeVisible();
    await page.getByTestId('boss-next').click();

    await expect(page.getByTestId('gun')).toBeVisible();
    await expect(page.getByTestId('the-end')).toHaveCount(0);

    // The shot floods the room red, and only then does THE END arrive.
    await expect(page.locator('.redout')).toHaveCSS('animation-name', 'redout', { timeout: 10_000 });
    await expect(page.getByTestId('gun')).toHaveCSS('animation-name', 'muzzle-flash');
    expect(await playedSoundFiles(page)).toContain('final-boom.mp3');
    await expect(page.getByTestId('the-end')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.redout')).toHaveCSS('opacity', '1');
    // THE END has to read on top of the flood, not behind it.
    const stacking = await page.evaluate(() => ({
      theEnd: Number(getComputedStyle(document.querySelector('.the-end')!).zIndex),
      redout: Number(getComputedStyle(document.querySelector('.redout')!).zIndex),
    }));
    expect(stacking.theEnd).toBeGreaterThan(stacking.redout);

    // The last comeback lands on the same boom the arrest ending closes on, not
    // on the room's ordinary hit. The shot has already sounded one by now.
    const hitsBeforePayoff = countOf(await playedSoundFiles(page), 'punchline-hit.mp3');
    const boomsBeforePayoff = countOf(await playedSoundFiles(page), 'final-boom.mp3');
    expect(boomsBeforePayoff).toBe(1);
    await expect(page.getByTestId('boss-punchline').locator('.end-setup b')).toHaveText(['ボスのいのち'], { timeout: 10_000 });
    await expect(page.getByTestId('boss-punchline').locator('strong')).toHaveText('ヤスッ！');

    // The payoff has to fit the screen. At 60px 「ヤスッ！」 ran 108 logical
    // pixels off each edge and the player only ever saw 「スッ」.
    const payoffFits = await page.evaluate(() => {
      // offsetWidth, not getBoundingClientRect: the latter includes the pop's
      // scale(2.4) and makes a caption that fits look like it overflows.
      const screen = (document.querySelector('[data-testid="game-screen"]') as HTMLElement).offsetWidth;
      const inside = (selector: string) => (document.querySelector(selector) as HTMLElement).offsetWidth <= screen;
      return {
        payoff: inside('[data-testid="boss-punchline"] strong'),
        setup: inside('[data-testid="boss-punchline"] .end-setup'),
        theEnd: inside('[data-testid="the-end"]'),
      };
    });
    expect(payoffFits).toEqual({ payoff: true, setup: true, theEnd: true });
    await expect.poll(() => playedSoundFiles(page).then((files) => countOf(files, 'final-boom.mp3')))
      .toBe(boomsBeforePayoff + 1);
    expect(countOf(await playedSoundFiles(page), 'punchline-hit.mp3')).toBe(hitsBeforePayoff);

    // Input stays locked, then it returns to the title on its own.
    await page.getByTestId('boss-screen').click({ position: { x: 120, y: 100 } });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('boss-punchline')).toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible({ timeout: 15_000 });
  });

  test('keeps the complete kana controls inside a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await expect(page.getByTestId('game-screen')).toHaveCSS('width', '256px');
    const phoneFrame = await page.locator('.screen-frame').boundingBox();
    expect(phoneFrame?.width).toBeCloseTo(360, 0);
    await reachInput(page);
    await expect(page.getByRole('button', { name: 'ン', exact: true })).toBeVisible();
    await expect(page.getByTestId('decide')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
