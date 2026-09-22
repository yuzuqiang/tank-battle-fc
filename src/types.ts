import type { Dir, EnemyType, PowerType, Tile } from './constants';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TankState {
  x: number;
  y: number;
  dir: Dir;
  speed: number;
  hp: number;
  maxHp: number;
  level: number; // 0..3 star upgrades
  alive: boolean;
  isPlayer: boolean;
  enemyType?: EnemyType;
  flashing?: boolean;
  invulnUntil: number;
  freezeUntil: number;
  slideVX: number;
  slideVY: number;
  anim: number;
  shootCD: number;
  bulletsMax: number;
  bulletSpeed: number;
  bulletPower: number; // 1 = brick, 2 = can hurt steel at high level
  spawnProtect: number;
}

export interface BulletState {
  x: number;
  y: number;
  dir: Dir;
  speed: number;
  power: number;
  fromPlayer: boolean;
  ownerId: number;
  alive: boolean;
}

export interface PowerUpState {
  x: number;
  y: number;
  type: PowerType;
  alive: boolean;
  until: number;
  blink: number;
}

export type MapGrid = Tile[][];

export interface StageDef {
  name: string;
  /** 13×13 of tile chars, each char is a 2×2 block */
  rows: string[];
  /** Enemy spawn queue types (length ~20) */
  enemies: EnemyType[];
}
