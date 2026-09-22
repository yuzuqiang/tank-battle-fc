import { Dir, EAGLE_POS, EnemyType, TANK_SIZE } from './constants';
import { canShoot, makeBullet, tryMove } from './tank';
import { countOwnerBullets } from './bullet';
import type { BulletState, MapGrid, TankState } from './types';

const DIRS = [Dir.Up, Dir.Right, Dir.Down, Dir.Left];

interface AiMem {
  turnTimer: number;
  stuck: number;
  lastX: number;
  lastY: number;
}

const aiMem = new WeakMap<object, AiMem>();

function mem(e: object): AiMem {
  let m = aiMem.get(e);
  if (!m) {
    m = { turnTimer: 30, stuck: 0, lastX: 0, lastY: 0 };
    aiMem.set(e, m);
  }
  return m;
}

export function updateEnemyAI(
  e: TankState & { id: number },
  grid: MapGrid,
  player: TankState | null,
  allTanks: TankState[],
  bullets: BulletState[],
  now: number,
): BulletState | null {
  if (!e.alive) return null;
  if (now < e.freezeUntil) return null;

  e.shootCD = Math.max(0, e.shootCD - 1);

  const ai = mem(e);
  ai.turnTimer--;

  const moved = tryMove(e, e.dir, grid, allTanks, now);
  if (!moved) {
    ai.stuck++;
    if (ai.stuck > 2 || ai.turnTimer <= 0) {
      e.dir = pickDir(e, player);
      ai.turnTimer = 20 + Math.floor(Math.random() * 40);
      ai.stuck = 0;
    }
  } else {
    ai.stuck = 0;
    ai.lastX = e.x;
    ai.lastY = e.y;
    if (ai.turnTimer <= 0) {
      if (Math.random() < 0.35) e.dir = pickDir(e, player);
      ai.turnTimer = 40 + Math.floor(Math.random() * 60);
    }
  }

  const shouldShoot =
    Math.random() < (e.enemyType === EnemyType.Power ? 0.04 : 0.025) ||
    alignedWith(e, player) ||
    alignedWithBase(e);

  if (shouldShoot && canShoot(e, countOwnerBullets(bullets, e.id))) {
    return makeBullet(e);
  }
  return null;
}

function pickDir(e: TankState, player: TankState | null): Dir {
  const r = Math.random();
  if (player && player.alive && r < 0.45) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? Dir.Right : Dir.Left;
    return dy > 0 ? Dir.Down : Dir.Up;
  }
  if (r < 0.7) {
    const dx = EAGLE_POS.x - e.x;
    const dy = EAGLE_POS.y - e.y;
    if (Math.abs(dy) >= Math.abs(dx)) return dy > 0 ? Dir.Down : Dir.Up;
    return dx > 0 ? Dir.Right : Dir.Left;
  }
  return DIRS[Math.floor(Math.random() * 4)];
}

function alignedWith(e: TankState, player: TankState | null): boolean {
  if (!player || !player.alive) return false;
  const tol = TANK_SIZE;
  if (Math.abs(e.x - player.x) < tol) {
    return (player.y < e.y && e.dir === Dir.Up) || (player.y > e.y && e.dir === Dir.Down);
  }
  if (Math.abs(e.y - player.y) < tol) {
    return (player.x < e.x && e.dir === Dir.Left) || (player.x > e.x && e.dir === Dir.Right);
  }
  return false;
}

function alignedWithBase(e: TankState): boolean {
  const bx = EAGLE_POS.x;
  const by = EAGLE_POS.y;
  const tol = TANK_SIZE;
  if (Math.abs(e.x - bx) < tol && e.dir === Dir.Down && e.y < by) return Math.random() < 0.08;
  return false;
}
