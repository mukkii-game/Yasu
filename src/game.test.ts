import { describe, expect, it } from 'vitest';
import {
  BALL,
  FIELD,
  PADDLE,
  PADDLE_TOP,
  createGame,
  movePaddle,
  setPaddleCenter,
  step,
  type GameState,
} from './game';

/** Builds a state with only the fields a test cares about overridden. */
function stateWith(overrides: Partial<GameState>): GameState {
  return { ...createGame(), ...overrides };
}

describe('createGame', () => {
  it('starts playable, centred and scoreless', () => {
    const state = createGame();
    expect(state.status).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.paddleX).toBe((FIELD.width - PADDLE.width) / 2);
  });
});

describe('movePaddle', () => {
  it('moves by one step in the given direction', () => {
    const state = createGame();
    expect(movePaddle(state, 1).paddleX).toBe(state.paddleX + PADDLE.speed);
    expect(movePaddle(state, -1).paddleX).toBe(state.paddleX - PADDLE.speed);
  });

  it('clamps the paddle inside the field', () => {
    expect(movePaddle(stateWith({ paddleX: 0 }), -1).paddleX).toBe(0);
    const maxX = FIELD.width - PADDLE.width;
    expect(movePaddle(stateWith({ paddleX: maxX }), 1).paddleX).toBe(maxX);
  });

  it('does not mutate the input state', () => {
    const state = createGame();
    movePaddle(state, 1);
    expect(state.paddleX).toBe((FIELD.width - PADDLE.width) / 2);
  });
});

describe('setPaddleCenter', () => {
  it('centres the paddle on the given x', () => {
    const state = setPaddleCenter(createGame(), 200);
    expect(state.paddleX).toBe(200 - PADDLE.width / 2);
  });

  it('clamps against both edges', () => {
    expect(setPaddleCenter(createGame(), -50).paddleX).toBe(0);
    expect(setPaddleCenter(createGame(), FIELD.width + 50).paddleX).toBe(
      FIELD.width - PADDLE.width,
    );
  });
});

describe('step', () => {
  it('moves the ball by velocity * dt', () => {
    const state = stateWith({
      ball: { pos: { x: 100, y: 100 }, vel: { x: 60, y: 40 } },
    });
    const next = step(state, 0.5);
    expect(next.ball.pos.x).toBeCloseTo(130);
    expect(next.ball.pos.y).toBeCloseTo(120);
  });

  it('bounces off the left and right walls', () => {
    const left = step(
      stateWith({ ball: { pos: { x: BALL.radius, y: 100 }, vel: { x: -100, y: 0 } } }),
      0.1,
    );
    expect(left.ball.vel.x).toBeGreaterThan(0);
    expect(left.ball.pos.x).toBeGreaterThanOrEqual(BALL.radius);

    const right = step(
      stateWith({
        ball: { pos: { x: FIELD.width - BALL.radius, y: 100 }, vel: { x: 100, y: 0 } },
      }),
      0.1,
    );
    expect(right.ball.vel.x).toBeLessThan(0);
    expect(right.ball.pos.x).toBeLessThanOrEqual(FIELD.width - BALL.radius);
  });

  it('bounces off the ceiling', () => {
    const next = step(
      stateWith({ ball: { pos: { x: 100, y: BALL.radius }, vel: { x: 0, y: -100 } } }),
      0.1,
    );
    expect(next.ball.vel.y).toBeGreaterThan(0);
    expect(next.ball.pos.y).toBeGreaterThanOrEqual(BALL.radius);
  });

  it('bounces off the paddle and scores', () => {
    const paddleX = 100;
    const next = step(
      stateWith({
        paddleX,
        ball: {
          pos: { x: paddleX + PADDLE.width / 2, y: PADDLE_TOP - BALL.radius - 1 },
          vel: { x: 0, y: 120 },
        },
      }),
      0.1,
    );
    expect(next.score).toBe(1);
    expect(next.ball.vel.y).toBeLessThan(0);
    expect(next.status).toBe('playing');
  });

  it('does not score when the ball misses the paddle horizontally', () => {
    const next = step(
      stateWith({
        paddleX: 0,
        ball: {
          pos: { x: FIELD.width - BALL.radius, y: PADDLE_TOP - BALL.radius - 1 },
          vel: { x: 0, y: 120 },
        },
      }),
      0.1,
    );
    expect(next.score).toBe(0);
    expect(next.ball.vel.y).toBeGreaterThan(0);
  });

  it('ends the game once the ball falls past the bottom', () => {
    const next = step(
      stateWith({
        paddleX: 0,
        ball: { pos: { x: 400, y: FIELD.height }, vel: { x: 0, y: 400 } },
      }),
      0.5,
    );
    expect(next.status).toBe('over');
  });

  it('treats a finished game as a fixed point', () => {
    const over = stateWith({ status: 'over' });
    expect(step(over, 0.5)).toBe(over);
  });
});
