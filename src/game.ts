/**
 * Pure game logic for the Yasu paddle demo.
 *
 * Nothing in this module touches the DOM or the canvas: every function is a
 * deterministic transformation of `GameState`, which is what makes the rules
 * testable under Vitest in a plain Node environment.
 *
 * See SPEC.md for the behaviour these functions are expected to implement.
 */

export const FIELD = {
  width: 480,
  height: 320,
} as const;

export const PADDLE = {
  width: 96,
  height: 12,
  /** Distance from the paddle's top edge to the bottom of the field. */
  bottomMargin: 16,
  /** Horizontal distance travelled per movement step, in pixels. */
  speed: 28,
} as const;

export const BALL = {
  radius: 8,
  initialSpeedX: 150,
  initialSpeedY: -180,
} as const;

export type GameStatus = 'playing' | 'over';

export interface Vec {
  x: number;
  y: number;
}

export interface Ball {
  pos: Vec;
  vel: Vec;
}

export interface GameState {
  ball: Ball;
  /** X coordinate of the paddle's left edge. */
  paddleX: number;
  score: number;
  status: GameStatus;
}

/** Y coordinate of the paddle's top edge. Constant for the whole game. */
export const PADDLE_TOP = FIELD.height - PADDLE.bottomMargin - PADDLE.height;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createGame(): GameState {
  return {
    ball: {
      pos: { x: FIELD.width / 2, y: FIELD.height / 2 },
      vel: { x: BALL.initialSpeedX, y: BALL.initialSpeedY },
    },
    paddleX: (FIELD.width - PADDLE.width) / 2,
    score: 0,
    status: 'playing',
  };
}

/**
 * Moves the paddle by `direction` steps (-1 = left, +1 = right), keeping it
 * inside the field. Returns a new state; the input is never mutated.
 */
export function movePaddle(state: GameState, direction: number): GameState {
  const paddleX = clamp(
    state.paddleX + direction * PADDLE.speed,
    0,
    FIELD.width - PADDLE.width,
  );
  return { ...state, paddleX };
}

/** Moves the paddle so that it is centred on `x`, keeping it inside the field. */
export function setPaddleCenter(state: GameState, x: number): GameState {
  const paddleX = clamp(x - PADDLE.width / 2, 0, FIELD.width - PADDLE.width);
  return { ...state, paddleX };
}

/**
 * Advances the simulation by `dt` seconds.
 *
 * A finished game is a fixed point: stepping it returns the same state.
 */
export function step(state: GameState, dt: number): GameState {
  if (state.status === 'over') return state;

  let { x, y } = state.ball.pos;
  let { x: vx, y: vy } = state.ball.vel;
  let score = state.score;

  x += vx * dt;
  y += vy * dt;

  // Side walls.
  if (x - BALL.radius < 0) {
    x = BALL.radius;
    vx = Math.abs(vx);
  } else if (x + BALL.radius > FIELD.width) {
    x = FIELD.width - BALL.radius;
    vx = -Math.abs(vx);
  }

  // Ceiling.
  if (y - BALL.radius < 0) {
    y = BALL.radius;
    vy = Math.abs(vy);
  }

  // Paddle: only a downward-moving ball can be caught.
  const reachedPaddle = y + BALL.radius >= PADDLE_TOP;
  if (reachedPaddle && vy > 0) {
    const overlapsPaddle =
      x >= state.paddleX - BALL.radius &&
      x <= state.paddleX + PADDLE.width + BALL.radius;
    if (overlapsPaddle) {
      y = PADDLE_TOP - BALL.radius;
      vy = -Math.abs(vy);
      score += 1;
    }
  }

  // Missed: the ball fell past the bottom of the field.
  const status: GameStatus = y - BALL.radius > FIELD.height ? 'over' : 'playing';

  return {
    ball: { pos: { x, y }, vel: { x: vx, y: vy } },
    paddleX: state.paddleX,
    score,
    status,
  };
}
