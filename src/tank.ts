import {
  BULLET_SIZE,
  CELL,
  COLORS,
  Dir,
  DIR_VEC,
  EnemyType,
  PLAY_H,
  PLAY_W,
  TANK_SIZE,
} from './constants';
import { isIce, rectBlocked } from './map';
import type { BulletState, MapGrid, TankState } from './types';

let nextId = 1;

export function createPlayer(x: number, y: number): TankState & { id: number } {
  return {
    id: nextId++,
    x,
    y,
    dir: Dir.Up,
    speed: 1.2,
    hp: 1,
    maxHp: 1,
    level: 0,
    alive: true,
    isPlayer: true,
    invulnUntil: 0,
    freezeUntil: 0,
    slideVX: 0,
    slideVY: 0,
    anim: 0,
    shootCD: 0,
    bulletsMax: 1,
    bulletSpeed: 3,
    bulletPower: 1,
    spawnProtect: 0,
  };
}

export function createEnemy(
  x: number,
  y: number,
  type: EnemyType,
  flashing: boolean,
): TankState & { id: number } {
  const base = {
    id: nextId++,
    x,
    y,
    dir: Dir.Down,
    alive: true,
    isPlayer: false,
    enemyType: type,
    flashing,
    invulnUntil: 0,
    freezeUntil: 0,
    slideVX: 0,
    slideVY: 0,
    anim: 0,
    shootCD: 40 + Math.random() * 40,
    spawnProtect: 0,
    level: 0,
  };
  switch (type) {
    case EnemyType.Fast:
      return { ...base, speed: 1.6, hp: 1, maxHp: 1, bulletsMax: 1, bulletSpeed: 3.2, bulletPower: 1 };
    case EnemyType.Power:
      return { ...base, speed: 1.1, hp: 1, maxHp: 1, bulletsMax: 1, bulletSpeed: 3.5, bulletPower: 1 };
    case EnemyType.Armor:
      return { ...base, speed: 0.9, hp: 4, maxHp: 4, bulletsMax: 1, bulletSpeed: 2.8, bulletPower: 1 };
    default:
      return { ...base, speed: 1.0, hp: 1, maxHp: 1, bulletsMax: 1, bulletSpeed: 2.8, bulletPower: 1 };
  }
}

export function applyStarUpgrade(t: TankState) {
  t.level = Math.min(3, t.level + 1);
  if (t.level === 1) {
    t.bulletSpeed = 3.5;
  } else if (t.level === 2) {
    t.bulletsMax = 2;
  } else if (t.level >= 3) {
    t.bulletPower = 3;
    t.bulletsMax = 2;
  }
}

export function tankRect(t: TankState) {
  return { x: t.x, y: t.y, w: TANK_SIZE, h: TANK_SIZE };
}

export function tryMove(
  t: TankState,
  dir: Dir,
  grid: MapGrid,
  blockers: TankState[],
  now: number,
): boolean {
  if (!t.alive) return false;
  if (now < t.freezeUntil && !t.isPlayer) return false;

  t.dir = dir;
  const v = DIR_VEC[dir];
  const speed = t.speed;
  let nx = t.x + v.x * speed;
  let ny = t.y + v.y * speed;

  // snap to grid axis for classic feel
  if (dir === Dir.Up || dir === Dir.Down) {
    const snapped = Math.round(t.x / (CELL / 2)) * (CELL / 2);
    if (Math.abs(snapped - t.x) < 2) nx = t.x; // keep x, nudge
    t.x += Math.sign(snapped - t.x) * Math.min(1, Math.abs(snapped - t.x));
    nx = t.x + v.x * speed;
    ny = t.y + v.y * speed;
  } else {
    const snapped = Math.round(t.y / (CELL / 2)) * (CELL / 2);
    t.y += Math.sign(snapped - t.y) * Math.min(1, Math.abs(snapped - t.y));
    nx = t.x + v.x * speed;
    ny = t.y + v.y * speed;
  }

  nx = Math.max(0, Math.min(PLAY_W - TANK_SIZE, nx));
  ny = Math.max(0, Math.min(PLAY_H - TANK_SIZE, ny));

  const rect = { x: nx, y: ny, w: TANK_SIZE, h: TANK_SIZE };
  if (rectBlocked(grid, rect)) {
    // ice slide decay
    t.slideVX = 0;
    t.slideVY = 0;
    return false;
  }
  for (const o of blockers) {
    if (o === t || !o.alive) continue;
    if ( overlap(rect, tankRect(o)) ) return false;
  }

  t.x = nx;
  t.y = ny;
  t.anim++;

  if (isIce(grid, rect)) {
    t.slideVX = v.x * speed * 0.9;
    t.slideVY = v.y * speed * 0.9;
  } else {
    t.slideVX = 0;
    t.slideVY = 0;
  }
  return true;
}

export function applySlide(t: TankState, grid: MapGrid, blockers: TankState[]) {
  if (!t.slideVX && !t.slideVY) return;
  const nx = Math.max(0, Math.min(PLAY_W - TANK_SIZE, t.x + t.slideVX));
  const ny = Math.max(0, Math.min(PLAY_H - TANK_SIZE, t.y + t.slideVY));
  const rect = { x: nx, y: ny, w: TANK_SIZE, h: TANK_SIZE };
  if (rectBlocked(grid, rect)) {
    t.slideVX = 0;
    t.slideVY = 0;
    return;
  }
  for (const o of blockers) {
    if (o === t || !o.alive) continue;
    if (overlap(rect, tankRect(o))) {
      t.slideVX = 0;
      t.slideVY = 0;
      return;
    }
  }
  t.x = nx;
  t.y = ny;
  t.slideVX *= 0.92;
  t.slideVY *= 0.92;
  if (Math.abs(t.slideVX) < 0.05) t.slideVX = 0;
  if (Math.abs(t.slideVY) < 0.05) t.slideVY = 0;
}

function overlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function canShoot(t: TankState, activeBullets: number): boolean {
  return t.alive && t.shootCD <= 0 && activeBullets < t.bulletsMax;
}

export function makeBullet(t: TankState & { id: number }): BulletState {
  const v = DIR_VEC[t.dir];
  const cx = t.x + TANK_SIZE / 2 - BULLET_SIZE / 2;
  const cy = t.y + TANK_SIZE / 2 - BULLET_SIZE / 2;
  t.shootCD = t.isPlayer ? 12 : 35;
  return {
    x: cx + v.x * 10,
    y: cy + v.y * 10,
    dir: t.dir,
    speed: t.bulletSpeed,
    power: t.bulletPower,
    fromPlayer: t.isPlayer,
    ownerId: t.id,
    alive: true,
  };
}

export function drawTank(ctx: CanvasRenderingContext2D, t: TankState, now: number) {
  if (!t.alive) return;
  if (now < t.invulnUntil && Math.floor(now / 100) % 2 === 0) {
    // blink invuln
  }

  const colors = tankColors(t);
  const { x, y, dir } = t;
  const s = TANK_SIZE;
  const frame = Math.floor(t.anim / 4) % 2;

  ctx.save();
  ctx.translate(x + s / 2, y + s / 2);
  ctx.rotate((dir * Math.PI) / 2);
  ctx.translate(-s / 2, -s / 2);

  // body
  ctx.fillStyle = colors.body;
  ctx.fillRect(2, 4, 12, 10);
  // treads
  ctx.fillStyle = colors.tread;
  ctx.fillRect(0, 2, 3, 14);
  ctx.fillRect(13, 2, 3, 14);
  if (frame) {
    ctx.fillStyle = colors.body;
    ctx.fillRect(0, 4, 3, 2);
    ctx.fillRect(13, 8, 3, 2);
  } else {
    ctx.fillStyle = colors.body;
    ctx.fillRect(0, 8, 3, 2);
    ctx.fillRect(13, 4, 3, 2);
  }
  // turret / barrel
  ctx.fillStyle = colors.turret;
  ctx.fillRect(6, 0, 4, 8);
  ctx.fillRect(7, -2, 2, 4);

  // armor HP dots for armor tanks
  if (t.enemyType === EnemyType.Armor) {
    const hpColors = ['#FCFCFC', '#C0C0C0', '#D82800', '#FCF45C'];
    ctx.fillStyle = hpColors[Math.max(0, Math.min(3, t.hp - 1))];
    ctx.fillRect(5, 6, 6, 4);
  }

  if (t.flashing && Math.floor(now / 120) % 2 === 0) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#FC9838';
    ctx.fillRect(2, 4, 12, 10);
  }

  if (now < t.invulnUntil) {
    ctx.strokeStyle = '#5C94FC';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, s, s);
  }

  ctx.restore();
}

function tankColors(t: TankState) {
  if (t.isPlayer) {
    if (t.level >= 3) return { body: '#FC9838', tread: '#B8B000', turret: '#FCF45C' };
    if (t.level >= 1) return { body: '#FCF45C', tread: '#B8B000', turret: '#FCFCFC' };
    return { body: COLORS.playerYellow, tread: COLORS.playerOlive, turret: '#D8D800' };
  }
  switch (t.enemyType) {
    case EnemyType.Fast:
      return { body: '#A0E0A0', tread: '#007800', turret: '#FCFCFC' };
    case EnemyType.Power:
      return { body: '#D82800', tread: '#880000', turret: '#FCFCFC' };
    case EnemyType.Armor:
      return { body: COLORS.enemyGray, tread: COLORS.enemyDark, turret: '#FCFCFC' };
    default:
      return { body: '#C0C0C0', tread: '#606060', turret: '#FCFCFC' };
  }
}
