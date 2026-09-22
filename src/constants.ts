/** Cell size in pixels (half-tile). Classic map is 26×26 cells. */
export const CELL = 8;
export const MAP_W = 26;
export const MAP_H = 26;
export const PLAY_W = MAP_W * CELL; // 208
export const PLAY_H = MAP_H * CELL; // 208
export const SIDEBAR_W = 48;
export const CANVAS_W = PLAY_W + SIDEBAR_W; // 256 (NES width)
export const CANVAS_H = PLAY_H + 16; // pad for HUD feel → use 224 classic; we use 208+sidebar in 256x224 frame
export const VIEW_W = 256;
export const VIEW_H = 224;
export const PLAY_OX = 16; // playfield offset X inside 256x224
export const PLAY_OY = 8;

export const TANK_SIZE = 16;
export const BULLET_SIZE = 4;

export const SCALE = 2; // display scale (512×448)

export enum Dir {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3,
}

export const DIR_VEC: Record<Dir, { x: number; y: number }> = {
  [Dir.Up]: { x: 0, y: -1 },
  [Dir.Right]: { x: 1, y: 0 },
  [Dir.Down]: { x: 0, y: 1 },
  [Dir.Left]: { x: -1, y: 0 },
};

/** Tile cell types */
export enum Tile {
  Empty = 0,
  Brick = 1,
  Steel = 2,
  Water = 3,
  Grass = 4,
  Ice = 5,
  Eagle = 6,
  EagleDead = 7,
}

export enum EnemyType {
  Basic = 0,
  Fast = 1,
  Power = 2,
  Armor = 3,
}

export enum PowerType {
  Helmet = 0,
  Clock = 1,
  Shovel = 2,
  Star = 3,
  Grenade = 4,
  Tank = 5,
}

export enum GameState {
  Title = 0,
  StageIntro = 1,
  Playing = 2,
  Paused = 3,
  StageClear = 4,
  GameOver = 5,
}

export const PLAYER_SPAWN = { x: 8 * CELL, y: 24 * CELL };
export const EAGLE_POS = { x: 12 * CELL, y: 24 * CELL };
export const ENEMY_SPAWNS = [
  { x: 0 * CELL, y: 0 * CELL },
  { x: 12 * CELL, y: 0 * CELL },
  { x: 24 * CELL, y: 0 * CELL },
];

export const MAX_ENEMIES_ON_FIELD = 4;
export const ENEMIES_PER_STAGE = 20;
export const SPAWN_DELAY_MS = 1800;
export const PLAYER_LIVES = 3;
export const INVULN_SPAWN_MS = 3000;
export const HELMET_MS = 10000;
export const CLOCK_MS = 10000;
export const SHOVEL_MS = 20000;
export const POWERUP_MS = 20000;
export const FLASH_ENEMY_CHANCE = 0.25;

export const COLORS = {
  bg: '#000000',
  gray: '#636363',
  brick: '#C84C0C',
  brickDark: '#7A2800',
  steel: '#C0C0C0',
  steelDark: '#787878',
  water: '#2038EC',
  waterLight: '#5C94FC',
  grass: '#00A800',
  grassDark: '#007800',
  ice: '#B0E0F8',
  eagle: '#FCFCFC',
  eagleRed: '#B80000',
  playerYellow: '#FCF45C',
  playerOlive: '#B8B000',
  enemyGray: '#A0A0A0',
  enemyDark: '#606060',
  enemyGreen: '#00D800',
  enemyRed: '#D82800',
  bullet: '#FCFCFC',
  ui: '#FCFCFC',
  sidebar: '#636363',
};
