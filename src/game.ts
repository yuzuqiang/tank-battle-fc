import {
  CLOCK_MS,
  ENEMY_SPAWNS,
  ENEMIES_PER_STAGE,
  FLASH_ENEMY_CHANCE,
  GameState,
  HELMET_MS,
  INVULN_SPAWN_MS,
  MAX_ENEMIES_ON_FIELD,
  PLAYER_LIVES,
  PLAYER_SPAWN,
  PowerType,
  SHOVEL_MS,
  SPAWN_DELAY_MS,
} from './constants';
import { AudioSys } from './audio';
import { Input } from './input';
import {
  buildMap,
  drawGrassOverlay,
  drawMap,
  setBaseSteel,
} from './map';
import {
  applySlide,
  applyStarUpgrade,
  canShoot,
  createEnemy,
  createPlayer,
  drawTank,
  makeBullet,
  tryMove,
} from './tank';
import {
  bulletHitsTank,
  bulletsCollide,
  countOwnerBullets,
  drawBullet,
  updateBullet,
} from './bullet';
import { updateEnemyAI } from './ai';
import { drawPowerUp, powerOverlapsTank, spawnPowerUp } from './powerup';
import { getStage, STAGES } from './stages';
import type { BulletState, MapGrid, PowerUpState, TankState } from './types';
import {
  beginFrame,
  drawGameOver,
  drawPause,
  drawSidebar,
  drawStageClear,
  drawStageIntro,
  drawTitle,
  endPlay,
  playContext,
  setupCanvas,
} from './ui';

type Tank = TankState & { id: number };

export class Game {
  private ctx: CanvasRenderingContext2D;
  private input = new Input();
  private audio = new AudioSys();

  private state = GameState.Title;
  private stageIndex = 0;
  private score = 0;
  private lives = PLAYER_LIVES;
  private playerLevel = 0;

  private grid: MapGrid = [];
  private player: Tank | null = null;
  private enemies: Tank[] = [];
  private bullets: BulletState[] = [];
  private powerups: PowerUpState[] = [];

  private enemyQueue: number[] = [];
  private remainingToSpawn = 0;
  private spawnTimer = 0;
  private spawnIndex = 0;
  private now = 0;
  private tick = 0;
  private stateTimer = 0;
  private shovelUntil = 0;
  private shovelWasActive = false;
  private freezeEnemiesUntil = 0;
  private eagleAlive = true;
  private playerRespawnTimer = 0;
  private blink = true;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = setupCanvas(canvas);
  }

  start() {
    let last = performance.now();
    let acc = 0;
    const step = 1000 / 60;

    const loop = (t: number) => {
      const dt = Math.min(100, t - last);
      last = t;
      acc += dt;
      while (acc >= step) {
        this.update(step);
        acc -= step;
      }
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private update(dt: number) {
    this.now += dt;
    this.tick++;
    if (this.tick % 30 === 0) this.blink = !this.blink;

    switch (this.state) {
      case GameState.Title:
        if (this.input.start || this.input.fire) {
          this.audio.stageStart();
          this.resetCampaign();
          this.enterStageIntro();
        }
        break;
      case GameState.StageIntro:
        this.stateTimer -= dt;
        if (this.stateTimer <= 0 || this.input.start) {
          this.state = GameState.Playing;
        }
        break;
      case GameState.Playing:
        this.updatePlaying(dt);
        break;
      case GameState.Paused:
        if (this.input.pause) {
          this.audio.pause();
          this.state = GameState.Playing;
        }
        break;
      case GameState.StageClear:
        this.stateTimer -= dt;
        if (this.stateTimer <= 0 || this.input.start) {
          this.stageIndex++;
          if (this.stageIndex >= STAGES.length) {
            // loop stages with higher difficulty feel — restart at 0 keep score
            this.stageIndex = 0;
          }
          this.enterStageIntro();
        }
        break;
      case GameState.GameOver:
        if (this.input.start) {
          this.state = GameState.Title;
        }
        break;
    }
    this.input.endFrame();
  }

  private resetCampaign() {
    this.stageIndex = 0;
    this.score = 0;
    this.lives = PLAYER_LIVES;
    this.playerLevel = 0;
  }

  private enterStageIntro() {
    this.state = GameState.StageIntro;
    this.stateTimer = 1500;
    this.audio.stageStart();
    this.initStage();
  }

  private initStage() {
    const stage = getStage(this.stageIndex);
    this.grid = buildMap(stage.rows);
    this.bullets = [];
    this.powerups = [];
    this.enemies = [];
    this.eagleAlive = true;
    this.shovelUntil = 0;
    this.shovelWasActive = false;
    this.freezeEnemiesUntil = 0;
    this.playerRespawnTimer = 0;
    this.spawnIndex = 0;
    this.enemyQueue = stage.enemies.slice(0, ENEMIES_PER_STAGE);
    this.remainingToSpawn = this.enemyQueue.length;
    this.spawnTimer = 400;

    this.player = createPlayer(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
    this.player.invulnUntil = this.now + INVULN_SPAWN_MS;
    // restore star level across stages
    for (let i = 0; i < this.playerLevel; i++) applyStarUpgrade(this.player);
  }

  private updatePlaying(dt: number) {
    if (this.input.pause) {
      this.audio.pause();
      this.state = GameState.Paused;
      return;
    }

    // shovel expiry → revert to brick
    if (this.shovelWasActive && this.now >= this.shovelUntil) {
      setBaseSteel(this.grid, false);
      this.shovelWasActive = false;
    }

    this.handlePlayer();
    this.handleSpawns(dt);
    this.handleEnemies();
    this.handleBullets();
    this.handlePowerups();
    this.checkStageEnd();
  }

  private handlePlayer() {
    if (this.playerRespawnTimer > 0) {
      this.playerRespawnTimer -= 1000 / 60;
      if (this.playerRespawnTimer <= 0) {
        this.spawnPlayer();
      }
      return;
    }
    const p = this.player;
    if (!p || !p.alive) return;

    p.shootCD = Math.max(0, p.shootCD - 1);
    const all = this.allTanks();

    const dir = this.input.moveDir;
    if (dir !== null) {
      tryMove(p, dir, this.grid, all, this.now);
    } else {
      applySlide(p, this.grid, all);
    }

    if (this.input.fire && canShoot(p, countOwnerBullets(this.bullets, p.id))) {
      this.bullets.push(makeBullet(p));
      this.audio.shoot();
    }
  }

  private spawnPlayer() {
    if (this.lives < 0) return;
    this.player = createPlayer(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
    this.player.invulnUntil = this.now + INVULN_SPAWN_MS;
    for (let i = 0; i < this.playerLevel; i++) applyStarUpgrade(this.player);
  }

  private handleSpawns(dt: number) {
    if (this.remainingToSpawn <= 0) return;
    const onField = this.enemies.filter((e) => e.alive).length;
    if (onField >= MAX_ENEMIES_ON_FIELD) return;

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const type = this.enemyQueue[this.enemyQueue.length - this.remainingToSpawn];
    const spot = ENEMY_SPAWNS[this.spawnIndex % ENEMY_SPAWNS.length];
    this.spawnIndex++;

    // don't spawn on top of existing tank
    const blocked = this.allTanks().some(
      (t) => t.alive && Math.abs(t.x - spot.x) < 16 && Math.abs(t.y - spot.y) < 16,
    );
    if (blocked) {
      this.spawnTimer = 300;
      return;
    }

    const flashing = Math.random() < FLASH_ENEMY_CHANCE;
    const e = createEnemy(spot.x, spot.y, type, flashing);
    e.invulnUntil = this.now + 1000;
    this.enemies.push(e);
    this.remainingToSpawn--;
    this.spawnTimer = SPAWN_DELAY_MS;
  }

  private handleEnemies() {
    const all = this.allTanks();
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (this.now < this.freezeEnemiesUntil) {
        e.freezeUntil = this.freezeEnemiesUntil;
        continue;
      }
      const b = updateEnemyAI(e, this.grid, this.player, all, this.bullets, this.now);
      if (b) {
        this.bullets.push(b);
        // quiet enemy shots
      }
      applySlide(e, this.grid, all);
    }
  }

  private handleBullets() {
    // bullet vs bullet
    for (let i = 0; i < this.bullets.length; i++) {
      for (let j = i + 1; j < this.bullets.length; j++) {
        if (bulletsCollide(this.bullets[i], this.bullets[j])) {
          this.bullets[i].alive = false;
          this.bullets[j].alive = false;
        }
      }
    }

    for (const b of this.bullets) {
      if (!b.alive) continue;
      const hit = updateBullet(b, this.grid);
      if (hit === 'brick') this.audio.hitBrick();
      else if (hit === 'steel') this.audio.hitSteel();
      else if (hit === 'eagle') {
        this.eagleAlive = false;
        this.audio.explode();
        this.triggerGameOver();
      }

      // tanks
      const targets: Tank[] = [];
      if (b.fromPlayer) targets.push(...this.enemies);
      else if (this.player) targets.push(this.player);

      for (const t of targets) {
        if (!bulletHitsTank(b, t, this.now)) continue;
        b.alive = false;
        this.damageTank(t, b.fromPlayer);
        break;
      }
    }

    this.bullets = this.bullets.filter((b) => b.alive);
  }

  private damageTank(t: Tank, fromPlayer: boolean) {
    if (!t.alive) return;
    t.hp--;
    if (t.hp > 0) {
      this.audio.hitSteel();
      return;
    }
    t.alive = false;
    this.audio.explode();

    if (t.isPlayer) {
      this.playerLevel = 0; // lose stars on death like classic
      this.lives--;
      if (this.lives < 0 || !this.eagleAlive) {
        this.triggerGameOver();
      } else {
        this.playerRespawnTimer = 1000;
        this.player = null;
      }
    } else {
      const pts = scoreFor(t);
      this.score += pts;
      if (t.flashing) {
        this.powerups.push(spawnPowerUp(this.now));
        this.audio.powerup();
      }
    }
  }

  private handlePowerups() {
    for (const p of this.powerups) {
      if (!p.alive) continue;
      if (this.now > p.until) {
        p.alive = false;
        continue;
      }
      if (this.player && powerOverlapsTank(p, this.player)) {
        p.alive = false;
        this.applyPower(p.type);
      }
    }
    this.powerups = this.powerups.filter((p) => p.alive);
  }

  private applyPower(type: PowerType) {
    this.audio.pickup();
    const p = this.player;
    switch (type) {
      case PowerType.Helmet:
        if (p) p.invulnUntil = this.now + HELMET_MS;
        break;
      case PowerType.Clock:
        this.freezeEnemiesUntil = this.now + CLOCK_MS;
        this.audio.freeze();
        break;
      case PowerType.Shovel:
        setBaseSteel(this.grid, true);
        this.shovelUntil = this.now + SHOVEL_MS;
        this.shovelWasActive = true;
        break;
      case PowerType.Star:
        if (p) {
          applyStarUpgrade(p);
          this.playerLevel = p.level;
        }
        break;
      case PowerType.Grenade:
        for (const e of this.enemies) {
          if (e.alive) {
            e.alive = false;
            this.score += scoreFor(e);
          }
        }
        this.audio.explode();
        break;
      case PowerType.Tank:
        this.lives++;
        this.audio.life();
        break;
    }
  }

  private checkStageEnd() {
    if (!this.eagleAlive) return;
    const aliveEnemies = this.enemies.some((e) => e.alive);
    if (!aliveEnemies && this.remainingToSpawn <= 0) {
      this.state = GameState.StageClear;
      this.stateTimer = 2500;
      if (this.player) this.playerLevel = this.player.level;
    }
  }

  private triggerGameOver() {
    this.state = GameState.GameOver;
    this.audio.gameOver();
  }

  private allTanks(): TankState[] {
    const list: TankState[] = [...this.enemies];
    if (this.player) list.push(this.player);
    return list;
  }

  private remainingEnemies(): number {
    return this.remainingToSpawn + this.enemies.filter((e) => e.alive).length;
  }

  private render() {
    const ctx = this.ctx;

    if (this.state === GameState.Title) {
      drawTitle(ctx, this.blink);
      return;
    }
    if (this.state === GameState.StageIntro) {
      drawStageIntro(ctx, this.stageIndex);
      return;
    }

    beginFrame(ctx);
    playContext(ctx);
    drawMap(ctx, this.grid, this.tick);

    for (const p of this.powerups) drawPowerUp(ctx, p, this.now);
    if (this.player) drawTank(ctx, this.player, this.now);
    for (const e of this.enemies) drawTank(ctx, e, this.now);
    for (const b of this.bullets) drawBullet(ctx, b);

    drawGrassOverlay(ctx, this.grid);
    endPlay(ctx);

    drawSidebar(
      ctx,
      this.remainingEnemies(),
      Math.max(0, this.lives),
      this.stageIndex,
      this.score,
    );

    if (this.state === GameState.Paused) drawPause(ctx);
    if (this.state === GameState.StageClear) drawStageClear(ctx, this.stageIndex, this.score);
    if (this.state === GameState.GameOver) drawGameOver(ctx, this.score);
  }
}

function scoreFor(t: TankState): number {
  switch (t.enemyType) {
    case 1: return 200;
    case 2: return 300;
    case 3: return 400;
    default: return 100;
  }
}

