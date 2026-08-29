import { BALL, FIELD, PADDLE, PADDLE_TOP, type GameState } from './game';

const COLORS = {
  background: '#10141c',
  paddle: '#6ee7b7',
  ball: '#f8fafc',
  overlay: 'rgba(16, 20, 28, 0.72)',
  overlayText: '#f8fafc',
} as const;

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  ctx.fillStyle = COLORS.paddle;
  ctx.fillRect(state.paddleX, PADDLE_TOP, PADDLE.width, PADDLE.height);

  ctx.beginPath();
  ctx.arc(state.ball.pos.x, state.ball.pos.y, BALL.radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ball;
  ctx.fill();

  if (state.status === 'over') {
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = COLORS.overlayText;
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over — press R to restart', FIELD.width / 2, FIELD.height / 2);
  }
}
