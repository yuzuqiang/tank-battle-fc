export class Input {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private just = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(e.key.toLowerCase()) ||
          ['w', 'a', 's', 'd', 'j', 'k', 'p'].includes(k)) {
        e.preventDefault();
      }
      if (!this.keys.has(k)) this.just.add(k);
      this.keys.add(k);
      this.pressed.add(k);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  /** Call once per frame after game logic */
  endFrame() {
    this.just.clear();
  }

  down(k: string) {
    return this.keys.has(k.toLowerCase());
  }

  justPressed(k: string) {
    return this.just.has(k.toLowerCase());
  }

  get moveDir(): number | null {
    if (this.down('arrowup') || this.down('w')) return 0;
    if (this.down('arrowright') || this.down('d')) return 1;
    if (this.down('arrowdown') || this.down('s')) return 2;
    if (this.down('arrowleft') || this.down('a')) return 3;
    return null;
  }

  get fire() {
    return this.justPressed(' ') || this.justPressed('j');
  }

  get fireHeld() {
    return this.down(' ') || this.down('j');
  }

  get start() {
    return this.justPressed('enter');
  }

  get pause() {
    return this.justPressed('enter') || this.justPressed('p');
  }
}
