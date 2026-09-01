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
    for (const filename of ['anxiety.mp3', 'punchline-hit.mp3', 'reveal-shock.mp3', 'final-boom.mp3']) {
      const response = await request.get(`/audio/${filename}`);
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('audio/mpeg');
      expect((await response.body()).length).toBeGreaterThan(10_000);
    }
  });

  test('overlays and fades the final comeback after the escort leaves', async ({ page }) => {
    await page.addInitScript(() => {
      const playedSounds: string[] = [];
      Object.defineProperty(window, '__playedSounds', { value: playedSounds });
      HTMLMediaElement.prototype.play = function play() {
        playedSounds.push(this.src);
        return Promise.resolve();
      };
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

    for (const [index, hasPunchline] of [true, false, true, true, true].entries()) {
      if (index === 3) await expect(page.locator('.office-scene')).toHaveClass(/laughing/);
      if (index === 4) {
        await expect(page.locator('.office-scene')).toHaveClass(/nodding/);
        await expect(page.locator('.yasu .head')).toHaveCSS('animation-name', 'nod-twice');
        await expect(page.locator('.yasu .body')).not.toHaveCSS('animation-name', 'nod-twice');
      }
      if (hasPunchline) await expect(page.getByTestId('punchline').locator('strong')).toHaveText('ヤスッ！');
      if (hasPunchline) expect(await playedSoundFiles(page)).toContain('punchline-hit.mp3');
      if (index === 4) {
        await expect(page.getByTestId('punchline').locator('span')).toHaveText('人として');
      }
      await page.getByTestId('ending-next').click();
      if (index === 4) {
        await expect(page.getByTestId('punchline').locator('strong')).toHaveText('ヤスッ！');
      }
    }

    await expect(page.getByTestId('the-end')).toBeVisible();
    await expect(page.getByTestId('end-screen')).not.toHaveAttribute('data-action');
    await page.getByTestId('end-screen').click({ position: { x: 120, y: 100 } });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('the-end')).toBeVisible();
    const escortTiming = await page.evaluate(() => {
      const escortRule = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .find((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === '.walkers');
      return {
        left: escortRule?.style.left,
        duration: escortRule?.style.animationDuration,
      };
    });
    expect(escortTiming).toEqual({ left: '41px', duration: '2.4s' });
    await expect(page.getByTestId('end-punchline').locator('.end-setup b')).toHaveText(['このゲーム', 'なにもかも'], { timeout: 10_000 });
    await expect(page.locator('.walkers')).toHaveCount(0);
    await expect(page.getByTestId('end-punchline').locator('strong')).toHaveCount(0);
    await expect(page.getByTestId('end-punchline').locator('strong')).toHaveText('ヤスッ！');
    expect(await playedSoundFiles(page)).toContain('final-boom.mp3');
    await expect(page.getByTestId('end-punchline').locator('.end-setup b')).toHaveText(['このゲーム', 'なにもかも']);
    await expect(page.getByTestId('end-punchline').locator('strong')).toHaveCSS('font-size', '60px');
    await expect(page.getByTestId('end-punchline')).toHaveCSS('white-space', 'nowrap');
    await expect(page.getByTestId('end-punchline')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.getByTestId('end-screen')).toHaveCSS('animation-name', 'end-screen-fade');
    await expect(page.getByTestId('start-button')).toBeVisible({ timeout: 6_000 });
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
