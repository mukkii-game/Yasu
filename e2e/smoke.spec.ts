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

test.describe('犯人はヤス', () => {
  test('shows the FC-style title and opens the kana input', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('start-button')).toContainText('犯人はヤス');
    const shareDescription = 'あなたはこの謎が解けるか？　推理アドベンチャー。';
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', shareDescription);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', shareDescription);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', shareDescription);
    await expect(page.locator('.title-yasu')).toBeVisible();
    await expect(page.locator('.title-yasu')).toHaveCSS('width', '29px');
    await expect(page.locator('.title-yasu b')).toHaveCSS('width', '25px');
    await expect(page.locator('.title-yasu .title-hair')).toHaveCount(1);
    await expect.poll(() => page.locator('.title-city').evaluate((city) => getComputedStyle(city, '::after').content)).toBe('none');
    const screenRatio = await page.locator('.screen-frame').evaluate((frame) => {
      const rect = frame.getBoundingClientRect();
      return rect.width / rect.height;
    });
    expect(screenRatio).toBeCloseTo(4 / 3, 2);
    const titleYasu = await page.evaluate(() => {
      const city = document.querySelector('.title-city')!.getBoundingClientRect();
      const head = document.querySelector('.title-yasu b')!.getBoundingClientRect();
      const figure = document.querySelector('.title-yasu')!.getBoundingClientRect();
      const headStyle = getComputedStyle(document.querySelector('.title-yasu b')!);
      const tieStyle = getComputedStyle(document.querySelector('.title-yasu em')!, '::after');
      const scale = city.height / 128;
      return {
        headCenter: (head.top + head.bottom) / 2,
        horizon: city.top + 91 * scale,
        figureCenter: (figure.left + figure.right) / 2,
        cityCenter: (city.left + city.right) / 2,
        headBorder: headStyle.borderTopWidth,
        tieHeight: tieStyle.height,
      };
    });
    expect(Math.abs(titleYasu.headCenter - titleYasu.horizon)).toBeLessThanOrEqual(2);
    expect(Math.abs(titleYasu.figureCenter - titleYasu.cityCenter)).toBeLessThanOrEqual(2);
    expect(titleYasu.headBorder).toBe('1px');
    expect(titleYasu.tieHeight).toBe('11px');
    await reachInput(page);
    await expect(page.getByTestId('answer-slots')).toContainText('＿＿');
  });

  test('advances dialogue when the room itself is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    await expect(page.locator('.command-window')).toHaveCount(0);
    await expect(page.locator('.office-scene')).toHaveCSS('width', '236px');
    await expect(page.locator('.yasu .head')).toHaveCSS('width', '50px');
    await expect(page.locator('.yasu .hair')).toHaveCSS('width', '38px');
    await expect(page.locator('.yasu .hair')).toHaveCSS('left', '4px');
    await expect(page.locator('.yasu .hair')).toHaveCSS('top', '-3px');
    await expect(page.locator('.yasu .face-name')).toHaveCSS('font-size', '14px');
    await expect(page.locator('.yasu .face-name')).toHaveCSS('top', '19px');
    await expect.poll(() => page.locator('.yasu .body').evaluate((body) => getComputedStyle(body, '::before').height)).toBe('22px');
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

  test('overlays and fades the final comeback after the escort leaves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await reachInput(page);
    await page.getByRole('button', { name: 'ヤ', exact: true }).click();
    await page.getByRole('button', { name: 'ス', exact: true }).click();
    await page.getByTestId('decide').click();
    await advanceDialogue(page, 'reveal-next');

    for (const hasPunchline of [true, false, true, true, true]) {
      if (hasPunchline) await expect(page.getByTestId('punchline').locator('strong')).toHaveText('ヤスッ！');
      await page.getByTestId('ending-next').click();
    }

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
    await expect(page.getByTestId('end-punchline').locator(':scope > span')).toHaveText('このゲーム⋯', { timeout: 10_000 });
    await expect(page.locator('.walkers')).toHaveCount(0);
    await expect(page.getByTestId('end-punchline').locator('strong')).toHaveCount(0);
    await expect(page.getByTestId('end-punchline').locator('strong')).toHaveText('ヤスッ！');
    await expect(page.getByTestId('end-punchline').locator(':scope > span')).toHaveText('このゲーム⋯');
    await expect(page.getByTestId('end-punchline')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.getByTestId('end-screen')).toHaveCSS('animation-name', 'end-screen-fade');
    await expect(page.getByTestId('start-button')).toBeVisible({ timeout: 6_000 });
  });

  test('keeps the complete kana controls inside a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await expect(page.getByTestId('game-screen')).toHaveCSS('width', '256px');
    await reachInput(page);
    await expect(page.getByRole('button', { name: 'ン', exact: true })).toBeVisible();
    await expect(page.getByTestId('decide')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
