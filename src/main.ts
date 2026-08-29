import { FIELD, createGame, movePaddle, setPaddleCenter, step } from './game';
import { render } from './render';

function required<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Yasu: ${what} is missing`);
  return value;
}

const canvas = required(
  document.querySelector<HTMLCanvasElement>('[data-testid="game-canvas"]'),
  'the game canvas',
);
const scoreEl = required(
  document.querySelector<HTMLElement>('[data-testid="score"]'),
  'the score display',
);
const statusEl = required(
  document.querySelector<HTMLElement>('[data-testid="status"]'),
  'the status display',
);
const ctx = required(canvas.getContext('2d'), 'the 2D canvas context');

canvas.width = FIELD.width;
canvas.height = FIELD.height;

let state = createGame();

/**
 * Mirrors state onto the HUD and onto data attributes, so the end-to-end suite
 * can assert on the simulation without reading pixels.
 */
function syncHud(): void {
  scoreEl.textContent = String(state.score);
  statusEl.textContent = state.status;
  canvas.dataset.paddleX = String(state.paddleX);
  canvas.dataset.status = state.status;
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    state = movePaddle(state, -1);
  } else if (event.key === 'ArrowRight') {
    state = movePaddle(state, 1);
  } else if (event.key === 'r' || event.key === 'R') {
    state = createGame();
  } else {
    return;
  }
  event.preventDefault();
  syncHud();
});

canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * FIELD.width;
  state = setPaddleCenter(state, x);
  syncHud();
});

let lastTime = performance.now();

function frame(now: number): void {
  // Clamp dt so a backgrounded tab cannot teleport the ball through the paddle.
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  state = step(state, dt);
  render(ctx, state);
  syncHud();

  requestAnimationFrame(frame);
}

render(ctx, state);
syncHud();
requestAnimationFrame(frame);
