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
    await expect(page.locator('.title-yasu')).toBeVisible();
    await reachInput(page);
    await expect(page.getByTestId('answer-slots')).toContainText('＿＿');
  });

  test('advances dialogue when the room itself is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    await finishDialogue(page, 'dialogue-next');
    await page.locator('.office-scene').click();
    await expect(page.getByTestId('dialogue-next')).toContainText('えっ？');
    await finishDialogue(page, 'dialogue-next');
    const gap = await page.evaluate(() => {
      const scene = document.querySelector('.office-scene')!.getBoundingClientRect();
      const copy = document.querySelector('.dialogue-copy')!.getBoundingClientRect();
      return copy.top - scene.bottom;
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
    await expect(page.getByTestId('wrong-next')).toContainText('ちがうでしょう');
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
    await expect(page.getByTestId('ending-next')).toContainText('タイトルにかいてあったから');
    await expect(page.getByTestId('punchline')).toHaveCount(0);
    await expect(page.getByTestId('punchline').locator('span')).toHaveText('なぞときが');
    await expect(page.getByTestId('punchline').locator('strong')).toHaveText('ヤスッ！');
    await expect(page.locator('[data-scene-mode="settled"]')).toBeVisible();
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
