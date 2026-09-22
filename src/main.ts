import { Game } from './game';
import './style.css';

const canvas = document.getElementById('game') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas #game not found');

const game = new Game(canvas);
game.start();
