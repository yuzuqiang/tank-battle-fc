import { CELL, COLORS, EAGLE_POS, MAP_H, MAP_W, Tile } from './constants';
import type { MapGrid, Rect } from './types';

const CHAR_TILE: Record<string, Tile> = {
  '.': Tile.Empty,
  ' ': Tile.Empty,
  B: Tile.Brick,
  S: Tile.Steel,
  W: Tile.Water,
  G: Tile.Grass,
  I: Tile.Ice,
  E: Tile.Eagle,
};

/** Expand 13×13 stage rows into 26×26 cell grid (each char → 2×2). */
export function buildMap(rows: string[]): MapGrid {
  const grid: MapGrid = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => Tile.Empty),
  );
  for (let r = 0; r < 13; r++) {
    const line = rows[r] ?? ''.padEnd(13, '.');
    for (let c = 0; c < 13; c++) {
      const ch = line[c] ?? '.';
      const t = CHAR_TILE[ch] ?? Tile.Empty;
      const y = r * 2;
      const x = c * 2;
      if (t === Tile.Eagle) {
        // Eagle occupies bottom-center 2×2; mark all four as eagle
        grid[y][x] = Tile.Eagle;
        grid[y][x + 1] = Tile.Eagle;
        grid[y + 1][x] = Tile.Eagle;
        grid[y + 1][x + 1] = Tile.Eagle;
      } else {
        grid[y][x] = t;
        grid[y][x + 1] = t;
        grid[y + 1][x] = t;
        grid[y + 1][x + 1] = t;
      }
    }
  }
  // Ensure eagle at classic position if missing
  ensureEagle(grid);
  return grid;
}

function ensureEagle(grid: MapGrid) {
  const ex = EAGLE_POS.x / CELL;
  const ey = EAGLE_POS.y / CELL;
  let has = false;
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++)
      if (grid[y][x] === Tile.Eagle) has = true;
  if (!has) {
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++)
        grid[ey + dy][ex + dx] = Tile.Eagle;
  }
}

export function solidForTank(t: Tile): boolean {
  return t === Tile.Brick || t === Tile.Steel || t === Tile.Water || t === Tile.Eagle || t === Tile.EagleDead;
}

export function solidForBullet(t: Tile): boolean {
  return t === Tile.Brick || t === Tile.Steel || t === Tile.Eagle || t === Tile.EagleDead;
}

export function isIce(grid: MapGrid, rect: Rect): boolean {
  const x0 = Math.floor(rect.x / CELL);
  const y0 = Math.floor(rect.y / CELL);
  const x1 = Math.floor((rect.x + rect.w - 1) / CELL);
  const y1 = Math.floor((rect.y + rect.h - 1) / CELL);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (inBounds(x, y) && grid[y][x] === Tile.Ice) return true;
  return false;
}

export function inBounds(x: number, y: number) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

export function rectBlocked(grid: MapGrid, rect: Rect, ignoreGrass = true): boolean {
  const x0 = Math.floor(rect.x / CELL);
  const y0 = Math.floor(rect.y / CELL);
  const x1 = Math.floor((rect.x + rect.w - 1) / CELL);
  const y1 = Math.floor((rect.y + rect.h - 1) / CELL);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!inBounds(x, y)) return true;
      const t = grid[y][x];
      if (ignoreGrass && (t === Tile.Grass || t === Tile.Ice || t === Tile.Empty)) continue;
      if (solidForTank(t)) return true;
    }
  }
  return false;
}

/** Damage brick cells under bullet; return hit type. */
export function damageMap(
  grid: MapGrid,
  bx: number,
  by: number,
  dir: number,
  power: number,
): 'none' | 'brick' | 'steel' | 'eagle' {
  // Bullet hits a line of cells ahead based on dir
  const cells = hitCells(bx, by, dir);
  let result: 'none' | 'brick' | 'steel' | 'eagle' = 'none';
  for (const { x, y } of cells) {
    if (!inBounds(x, y)) continue;
    const t = grid[y][x];
    if (t === Tile.Brick) {
      grid[y][x] = Tile.Empty;
      result = 'brick';
    } else if (t === Tile.Steel) {
      if (power >= 3) {
        grid[y][x] = Tile.Empty;
        result = 'steel';
      } else {
        result = 'steel';
      }
    } else if (t === Tile.Eagle) {
      // Destroy entire eagle
      for (let ey = 0; ey < MAP_H; ey++)
        for (let ex = 0; ex < MAP_W; ex++)
          if (grid[ey][ex] === Tile.Eagle) grid[ey][ex] = Tile.EagleDead;
      return 'eagle';
    } else if (t === Tile.EagleDead) {
      result = 'steel';
    }
  }
  return result;
}

function hitCells(bx: number, by: number, dir: number): { x: number; y: number }[] {
  // Sample 2 cells across the bullet face
  const cx = Math.floor(bx / CELL);
  const cy = Math.floor(by / CELL);
  if (dir === 0) return [{ x: cx, y: cy }, { x: cx + (bx % CELL >= 4 ? 0 : -0), y: cy }, { x: Math.floor((bx + 3) / CELL), y: cy }];
  if (dir === 2) return [{ x: cx, y: cy }, { x: Math.floor((bx + 3) / CELL), y: cy }];
  if (dir === 1) return [{ x: cx, y: cy }, { x: cx, y: Math.floor((by + 3) / CELL) }];
  return [{ x: cx, y: cy }, { x: cx, y: Math.floor((by + 3) / CELL) }];
}

export function setBaseSteel(grid: MapGrid, steel: boolean) {
  // Ring around eagle at cells 12-13, 24-25 (no cell below map)
  const ring = [
    [11, 23], [12, 23], [13, 23], [14, 23],
    [11, 24], [14, 24],
    [11, 25], [14, 25],
  ];
  for (const [x, y] of ring) {
    if (!inBounds(x, y)) continue;
    if (grid[y][x] === Tile.Eagle || grid[y][x] === Tile.EagleDead) continue;
    grid[y][x] = steel ? Tile.Steel : Tile.Brick;
  }
}

export function drawMap(ctx: CanvasRenderingContext2D, grid: MapGrid, tick: number) {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = grid[y][x];
      const px = x * CELL;
      const py = y * CELL;
      switch (t) {
        case Tile.Brick:
          drawBrick(ctx, px, py, x, y);
          break;
        case Tile.Steel:
          drawSteel(ctx, px, py);
          break;
        case Tile.Water:
          drawWater(ctx, px, py, tick);
          break;
        case Tile.Ice:
          ctx.fillStyle = COLORS.ice;
          ctx.fillRect(px, py, CELL, CELL);
          ctx.fillStyle = '#ffffff88';
          ctx.fillRect(px + 1, py + 1, 2, 2);
          break;
        case Tile.Eagle:
          // drawn as full 16x16 once from top-left
          if (x % 2 === 0 && y % 2 === 0) drawEagle(ctx, px, py, false);
          break;
        case Tile.EagleDead:
          if (x % 2 === 0 && y % 2 === 0) drawEagle(ctx, px, py, true);
          break;
        default:
          break;
      }
    }
  }
}

export function drawGrassOverlay(ctx: CanvasRenderingContext2D, grid: MapGrid) {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (grid[y][x] !== Tile.Grass) continue;
      const px = x * CELL;
      const py = y * CELL;
      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(px, py, CELL, CELL);
      ctx.fillStyle = COLORS.grassDark;
      ctx.fillRect(px + 1, py + 2, 2, 2);
      ctx.fillRect(px + 4, py + 1, 2, 3);
      ctx.fillRect(px + 2, py + 5, 3, 2);
    }
  }
}

function drawBrick(ctx: CanvasRenderingContext2D, px: number, py: number, cx: number, cy: number) {
  ctx.fillStyle = COLORS.brick;
  ctx.fillRect(px, py, CELL, CELL);
  ctx.fillStyle = COLORS.brickDark;
  // mortar lines vary by cell
  if ((cx + cy) % 2 === 0) {
    ctx.fillRect(px, py + 3, CELL, 1);
    ctx.fillRect(px + 3, py, 1, 3);
    ctx.fillRect(px + 7, py + 4, 1, 4);
  } else {
    ctx.fillRect(px, py + 3, CELL, 1);
    ctx.fillRect(px + 7, py, 1, 3);
    ctx.fillRect(px + 3, py + 4, 1, 4);
  }
}

function drawSteel(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = COLORS.steel;
  ctx.fillRect(px, py, CELL, CELL);
  ctx.fillStyle = COLORS.steelDark;
  ctx.fillRect(px + CELL - 2, py + 1, 1, CELL - 2);
  ctx.fillRect(px + 1, py + CELL - 2, CELL - 2, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px + 1, py + 1, CELL - 3, 1);
  ctx.fillRect(px + 1, py + 1, 1, CELL - 3);
}

function drawWater(ctx: CanvasRenderingContext2D, px: number, py: number, tick: number) {
  const phase = Math.floor(tick / 20) % 2;
  ctx.fillStyle = COLORS.water;
  ctx.fillRect(px, py, CELL, CELL);
  ctx.fillStyle = COLORS.waterLight;
  if (phase === 0) {
    ctx.fillRect(px + 1, py + 2, 3, 1);
    ctx.fillRect(px + 4, py + 5, 3, 1);
  } else {
    ctx.fillRect(px + 2, py + 3, 3, 1);
    ctx.fillRect(px + 1, py + 6, 3, 1);
  }
}

function drawEagle(ctx: CanvasRenderingContext2D, px: number, py: number, dead: boolean) {
  const s = CELL * 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(px, py, s, s);
  if (dead) {
    ctx.fillStyle = COLORS.eagleRed;
    // simple ruin X
    ctx.fillRect(px + 2, py + 2, 2, 12);
    ctx.fillRect(px + 12, py + 2, 2, 12);
    ctx.fillRect(px + 4, py + 6, 8, 2);
    return;
  }
  // stylized phoenix / eagle (original homage art)
  ctx.fillStyle = COLORS.eagle;
  // body
  ctx.fillRect(px + 6, py + 6, 4, 6);
  // wings
  ctx.fillRect(px + 2, py + 7, 4, 3);
  ctx.fillRect(px + 10, py + 7, 4, 3);
  // head
  ctx.fillRect(px + 7, py + 3, 3, 3);
  ctx.fillStyle = COLORS.eagleRed;
  ctx.fillRect(px + 8, py + 4, 1, 1);
  // base perch
  ctx.fillStyle = COLORS.brick;
  ctx.fillRect(px + 3, py + 13, 10, 2);
}
