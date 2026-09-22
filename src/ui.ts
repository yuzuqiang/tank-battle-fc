import {
  COLORS,
  ENEMIES_PER_STAGE,
  GameState,
  PLAY_H,
  PLAY_OX,
  PLAY_OY,
  PLAY_W,
  SCALE,
  SIDEBAR_W,
  VIEW_H,
  VIEW_W,
} from './constants';

export function setupCanvas(canvas: HTMLCanvasElement) {
  canvas.width = VIEW_W * SCALE;
  canvas.height = VIEW_H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

export function beginFrame(ctx: CanvasRenderingContext2D) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // gray border around playfield like NES
  ctx.fillStyle = COLORS.sidebar;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#000';
  ctx.fillRect(PLAY_OX, PLAY_OY, PLAY_W, PLAY_H);
}

export function playContext(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.translate(PLAY_OX, PLAY_OY);
}

export function endPlay(ctx: CanvasRenderingContext2D) {
  ctx.restore();
}

export function drawSidebar(
  ctx: CanvasRenderingContext2D,
  remaining: number,
  lives: number,
  stage: number,
  score: number,
) {
  const sx = PLAY_OX + PLAY_W + 8;
  const sy = PLAY_OY;

  // enemy icons
  ctx.fillStyle = '#000';
  let drawn = 0;
  for (let i = 0; i < remaining; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = sx + col * 10;
    const y = sy + row * 10;
    drawEnemyIcon(ctx, x, y);
    drawn++;
    if (drawn >= ENEMIES_PER_STAGE) break;
  }

  // lives / stage
  const iy = sy + 120;
  ctx.fillStyle = '#000';
  drawPlayerIcon(ctx, sx, iy);
  ctx.fillStyle = COLORS.ui;
  drawText(ctx, String(Math.max(0, lives)), sx + 12, iy + 4, 8);

  drawFlag(ctx, sx, iy + 28);
  drawText(ctx, String(stage + 1).padStart(2, '0'), sx + 4, iy + 48, 8);

  // score tiny
  drawText(ctx, String(score).padStart(6, '0'), 8, VIEW_H - 10, 8);
}

function drawEnemyIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, 8, 8);
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(x + 1, y + 2, 6, 5);
  ctx.fillRect(x + 3, y, 2, 3);
}

function drawPlayerIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = COLORS.playerYellow;
  ctx.fillRect(x, y + 2, 8, 6);
  ctx.fillRect(x + 2, y, 4, 4);
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#B80000';
  ctx.fillRect(x + 2, y, 2, 14);
  ctx.fillRect(x + 4, y, 8, 6);
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 8,
  color = COLORS.ui,
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

export function drawCenterText(
  ctx: CanvasRenderingContext2D,
  lines: { text: string; color?: string; size?: number }[],
) {
  let y = VIEW_H / 2 - lines.length * 8;
  for (const line of lines) {
    const size = line.size ?? 10;
    ctx.font = `${size}px monospace`;
    ctx.fillStyle = line.color ?? COLORS.ui;
    const w = ctx.measureText(line.text).width;
    ctx.fillText(line.text, (VIEW_W - w) / 2, y);
    y += size + 6;
  }
}

export function drawTitle(ctx: CanvasRenderingContext2D, blink: boolean) {
  beginFrame(ctx);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  drawText(ctx, 'BATTLE CITY', 56, 48, 16, '#D82800');
  drawText(ctx, '坦克大战', 88, 72, 14, '#FCF45C');

  // decorative tanks
  ctx.fillStyle = COLORS.playerYellow;
  ctx.fillRect(100, 100, 16, 16);
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(140, 100, 16, 16);

  drawText(ctx, 'I  PLAYER', 88, 140, 10);
  if (blink) drawText(ctx, '►', 72, 140, 10, '#FCF45C');

  drawText(ctx, 'PRESS ENTER', 80, 180, 10, blink ? '#FCFCFC' : '#636363');
  drawText(ctx, 'ARROWS/WASD MOVE  J/SPACE FIRE', 28, 200, 8, '#A0A0A0');
  drawText(ctx, 'HOMAGE / ORIGINAL ASSETS', 48, 212, 8, '#787878');
}

export function drawStageIntro(ctx: CanvasRenderingContext2D, stage: number) {
  beginFrame(ctx);
  ctx.fillStyle = COLORS.sidebar;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawCenterText(ctx, [{ text: `STAGE ${stage + 1}`, size: 14, color: '#000' }]);
}

export function drawPause(ctx: CanvasRenderingContext2D) {
  drawCenterText(ctx, [{ text: 'PAUSE', size: 14, color: '#D82800' }]);
}

export function drawGameOver(ctx: CanvasRenderingContext2D, score: number) {
  drawCenterText(ctx, [
    { text: 'GAME OVER', size: 14, color: '#D82800' },
    { text: `SCORE ${score}`, size: 10 },
    { text: 'ENTER - RETRY', size: 8, color: '#A0A0A0' },
  ]);
}

export function drawStageClear(ctx: CanvasRenderingContext2D, stage: number, score: number) {
  drawCenterText(ctx, [
    { text: 'STAGE CLEAR', size: 12, color: '#FCF45C' },
    { text: `STAGE ${stage + 1}`, size: 10 },
    { text: `SCORE ${score}`, size: 10 },
  ]);
}

export { GameState, PLAY_OX, PLAY_OY, VIEW_H, VIEW_W };
