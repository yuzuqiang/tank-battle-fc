import { CELL, COLORS, PowerType, POWERUP_MS, TANK_SIZE } from './constants';
import type { PowerUpState, TankState } from './types';

const TYPES = [
  PowerType.Helmet,
  PowerType.Clock,
  PowerType.Shovel,
  PowerType.Star,
  PowerType.Grenade,
  PowerType.Tank,
];

export function spawnPowerUp(now: number): PowerUpState {
  // random empty-ish position in playfield (avoid bottom eagle area somewhat)
  const gx = 1 + Math.floor(Math.random() * 11);
  const gy = 1 + Math.floor(Math.random() * 10);
  return {
    x: gx * 2 * CELL,
    y: gy * 2 * CELL,
    type: TYPES[Math.floor(Math.random() * TYPES.length)],
    alive: true,
    until: now + POWERUP_MS,
    blink: 0,
  };
}

export function powerOverlapsTank(p: PowerUpState, t: TankState): boolean {
  if (!p.alive || !t.alive) return false;
  return (
    t.x < p.x + TANK_SIZE &&
    t.x + TANK_SIZE > p.x &&
    t.y < p.y + TANK_SIZE &&
    t.y + TANK_SIZE > p.y
  );
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUpState, now: number) {
  if (!p.alive) return;
  if (p.until - now < 5000 && Math.floor(now / 150) % 2 === 0) return;

  const x = p.x;
  const y = p.y;
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = '#FC9838';
  ctx.fillRect(x + 1, y + 1, 14, 14);
  ctx.fillStyle = '#FCFCFC';

  switch (p.type) {
    case PowerType.Helmet:
      // star-ish helmet
      ctx.fillRect(x + 5, y + 3, 6, 2);
      ctx.fillRect(x + 3, y + 5, 10, 6);
      ctx.fillStyle = '#5C94FC';
      ctx.fillRect(x + 6, y + 7, 4, 3);
      break;
    case PowerType.Clock:
      ctx.beginPath();
      ctx.arc(x + 8, y + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 7, y + 4, 2, 5);
      ctx.fillRect(x + 7, y + 8, 4, 2);
      break;
    case PowerType.Shovel:
      ctx.fillRect(x + 7, y + 2, 2, 10);
      ctx.fillRect(x + 4, y + 10, 8, 3);
      break;
    case PowerType.Star:
      ctx.fillStyle = '#FCF45C';
      drawStar(ctx, x + 8, y + 8, 5);
      break;
    case PowerType.Grenade:
      ctx.fillStyle = '#D82800';
      ctx.fillRect(x + 5, y + 4, 6, 8);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 7, y + 2, 2, 3);
      break;
    case PowerType.Tank:
      ctx.fillStyle = COLORS.playerYellow;
      ctx.fillRect(x + 3, y + 5, 10, 7);
      ctx.fillRect(x + 6, y + 2, 4, 5);
      break;
  }
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const b = a + Math.PI / 5;
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    const x2 = cx + Math.cos(b) * (r * 0.4);
    const y2 = cy + Math.sin(b) * (r * 0.4);
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();
}

export const POWER_LABELS: Record<PowerType, string> = {
  [PowerType.Helmet]: 'HELMET',
  [PowerType.Clock]: 'CLOCK',
  [PowerType.Shovel]: 'SHOVEL',
  [PowerType.Star]: 'STAR',
  [PowerType.Grenade]: 'GRENADE',
  [PowerType.Tank]: 'LIFE',
};
