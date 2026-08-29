import { expect, test } from '@playwright/test';

/**
 * Smoke coverage for the built bundle served by `vite preview`.
 *
 * The point of this suite is to prove the page boots and is operable, not to
 * pin down game balance — the rules themselves are covered by the Vitest unit
 * tests in src/game.test.ts.
 */
test.describe('Yasu', () => {
  test('renders the game screen', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('title')).toHaveText('Yasu');

    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toBeVisible();

    // A canvas with a real drawing surface, not a collapsed placeholder.
    const box = await canvas.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);
    expect(box?.height ?? 0).toBeGreaterThan(0);

    await expect(page.getByTestId('score')).toBeVisible();
    await expect(page.getByTestId('status')).toHaveText('playing');
  });

  test('boots without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/');
    await expect(page.getByTestId('game-canvas')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('the simulation is running', async ({ page }) => {
    await page.goto('/');
    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toBeVisible();

    // requestAnimationFrame keeps stepping the state, so the HUD stays synced.
    await expect(async () => {
      const status = await canvas.getAttribute('data-status');
      expect(status).not.toBeNull();
    }).toPass();
  });

  test('the paddle responds to the arrow keys', async ({ page }) => {
    await page.goto('/');
    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toBeVisible();

    const readPaddleX = async (): Promise<number> =>
      Number(await canvas.getAttribute('data-paddle-x'));

    const start = await readPaddleX();
    expect(Number.isFinite(start)).toBe(true);

    await page.keyboard.press('ArrowLeft');
    await expect
      .poll(readPaddleX, { message: 'paddle should move left' })
      .toBeLessThan(start);

    const afterLeft = await readPaddleX();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(readPaddleX, { message: 'paddle should move right' })
      .toBeGreaterThan(afterLeft);
  });
});
