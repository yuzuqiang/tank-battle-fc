# 坦克大战 / Battle City

经典 FC《坦克大战》网页致敬复刻（Vite + TypeScript + Canvas）。

A faithful browser homage of the classic Famicom / NES **Battle City** tank game.  
**Original pixel art & maps** — no Nintendo ROM assets. WebAudio synthesized SFX only.

![Tech](https://img.shields.io/badge/Vite-TypeScript-blue) ![License](https://img.shields.io/badge/homage-fan%20project-orange)

## 功能 Features

- 13×13（展开为 26×26 单元）地图：砖块（可部分摧毁）、钢墙、草地、水域、冰面、老鹰基地
- 玩家坦克：3 条命，星标武器升级（射速 / 双发 / 破钢）
- 4 类敌军：普通、快速、强化火力、重甲（多血）
- 闪光敌军掉落道具：头盔、时钟、铲子、星星、手榴弹、坦克（命）
- 10 个手工关卡，通关推进，侧边栏显示剩余敌军 / 命数 / 关卡 / 分数
- 画面：标题、关卡开场、游戏中、暂停、过关、Game Over
- NES 风格配色与像素渲染（`imageSmoothingEnabled = false`）

## 操作 Controls

| Action | Keys |
|--------|------|
| Move | Arrow keys / WASD |
| Fire | Space / J |
| Start / Pause | Enter (P also pauses) |

## 本地运行 Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## 构建 Build

```bash
npm install
npm run build
```

Static files are emitted to `dist/`. Preview with:

```bash
npm run preview
```

GitHub Pages: `vite.config.ts` sets `base: './'` so the build works from project pages or a subpath.

## 技术栈 Stack

- Vite 6 + TypeScript
- HTML5 Canvas custom game loop (fixed ~60 Hz step)
- Modular source: `map`, `tank`, `bullet`, `ai`, `powerup`, `stages`, `ui`, `audio`, `input`

## 目录 Structure

```
src/
  main.ts      entry
  game.ts      game state machine & loop
  constants.ts
  map.ts       tiles, collision, drawing
  tank.ts      player & enemy tanks
  bullet.ts
  ai.ts        enemy behavior
  powerup.ts
  stages.ts    10 handcrafted stages
  ui.ts        HUD & screens
  audio.ts     WebAudio SFX
  input.ts
```

## 免责声明 Disclaimer

This is a **fan-made homage / clean-room recreation** for educational and entertainment purposes.  
It does **not** include copyrighted Nintendo graphics, music, or ROM data.  
Battle City™ is a trademark of its respective owners.

## License

MIT (code & original assets in this repository)
