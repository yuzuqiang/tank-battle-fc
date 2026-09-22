import { BULLET_SIZE, COLORS, DIR_VEC, PLAY_H, PLAY_W, TANK_SIZE } from './constants';
import { damageMap } from './map';
import type { BulletState, MapGrid, TankState } from './types';
import { tankRect } from './tank';

export function updateBullet(b: BulletState, grid: MapGrid): 'none' | 'brick' | 'steel' | 'eagle' | 'edge' {
  if (!b.alive) return 'none';
  const v = DIR_VEC[b.dir];
  b.x += v.x * b.speed;
  b.y += v.y * b.speed;

  if (b.x < -2 || b.y < -2 || b.x > PLAY_W || b.y > PLAY_H) {
    b.alive = false;
    return 'edge';
  }

  const hit = damageMap(grid, b.x, b.y, b.dir, b.power);
  if (hit !== 'none') {
    b.alive = false;
    return hit;
  }
  return 'none';
}

export function bulletHitsTank(b: BulletState, t: TankState, now: number): boolean {
  if (!b.alive || !t.alive) return false;
  if (b.fromPlayer === t.isPlayer) return false;
  if (now < t.invulnUntil) return false;
  const r = tankRect(t);
  return (
    b.x < r.x + r.w &&
    b.x + BULLET_SIZE > r.x &&
    b.y < r.y + r.h &&
    b.y + BULLET_SIZE > r.y
  );
}

export function bulletsCollide(a: BulletState, b: BulletState): boolean {
  if (!a.alive || !b.alive) return false;
  if (a.fromPlayer === b.fromPlayer) return false;
  return (
    Math.abs(a.x - b.x) < BULLET_SIZE + 2 &&
    Math.abs(a.y - b.y) < BULLET_SIZE + 2
  );
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: BulletState) {
  if (!b.alive) return;
  ctx.fillStyle = COLORS.bullet;
  const v = DIR_VEC[b.dir];
  if (v.x !== 0) {
    ctx.fillRect(b.x, b.y + 1, 4, 2);
  } else {
    ctx.fillRect(b.x + 1, b.y, 2, 4);
  }
}

export function countOwnerBullets(bullets: BulletState[], ownerId: number) {
  return bullets.filter((b) => b.alive && b.ownerId === ownerId).length;
}
