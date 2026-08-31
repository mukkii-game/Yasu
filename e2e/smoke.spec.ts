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
    await reachInput(page);
    await expect(page.getByTestId('answer-slots')).toContainText('＿＿');
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
    await finishDialogue(page, 'reveal-next');
    await expect(page.getByTestId('reveal-next')).toContainText('なぜわかったんですかっ');
  });

  test('shows a punchline on the same beat as Yasu finishes speaking', async ({ page }) => {
    await page.goto('/');
    await reachInput(page);
    await page.getByRole('button', { name: 'ヤ', exact: true }).click();
    await page.getByRole('button', { name: 'ス', exact: true }).click();
    await page.getByTestId('decide').click();
    await advanceDialogue(page, 'reveal-next');
    await advanceDialogue(page, 'ending-next');
    await finishDialogue(page, 'ending-next');
    await expect(page.getByTestId('punchline')).toHaveText('動機がヤスッ！');
  });

  test('boots without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await expect(page.getByTestId('game-screen')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('keeps the complete kana controls inside a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByTestId('game-screen')).toHaveCSS('width', '256px');
    await reachInput(page);
    await expect(page.getByRole('button', { name: 'ン', exact: true })).toBeVisible();
    await expect(page.getByTestId('decide')).toBeVisible();
  });
});
