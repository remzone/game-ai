import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Command } from '@living-world/simulation';
import type { View } from './types';
import { ART } from './art';
type Bridge = {
  world: View;
  selected: number;
  onSelect: (id: number) => void;
  send: (c: Command) => void;
  unit: 'all' | 'infantry' | 'spearmen' | 'archers' | 'cavalry' | 'mages';
};
// Visual variation is coordinate-based, independent of the simulation's RNG.
const noise = (x: number, y: number, salt = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
export function Game({ world, selected, onSelect, send, unit }: Bridge) {
  const host = useRef<HTMLDivElement>(null),
    gameRef = useRef<Phaser.Game | null>(null);
  const bridge = useRef<Bridge>({ world, selected, onSelect, send, unit });
  bridge.current = { world, selected, onSelect, send, unit };
  useEffect(() => {
    if (!host.current) return;
    const current = () => bridge.current;
    class IsoScene extends Phaser.Scene {
      ground!: Phaser.GameObjects.Graphics;
      overlay!: Phaser.GameObjects.Graphics;
      decor!: Phaser.GameObjects.Container;
      last?: View;
      lastSelected = -1;
      origin = { x: 0, y: 0 };
      sx = 24;
      sy = 12;
      down = { x: 0, y: 0 };
      hover = -1;
      preload() {
        for (const [key, source] of Object.entries(ART))
          if (!this.textures.exists(key))
            this.load.svg(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source), {
              width: 256,
              height: 256,
            });
      }
      create() {
        this.ground = this.add.graphics();
        this.decor = this.add.container(0, 0);
        this.overlay = this.add.graphics();
        this.last = undefined;
        this.lastSelected = -1;
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
          this.down = { x: p.x, y: p.y };
        });
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
          if (p.isDown) {
            const c = this.cameras.main;
            c.scrollX -= (p.x - p.prevPosition.x) / c.zoom;
            c.scrollY -= (p.y - p.prevPosition.y) / c.zoom;
          }
        });
        this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
          if (Math.hypot(p.x - this.down.x, p.y - this.down.y) <= 8) this.click(p);
        });
        this.input.on(
          'wheel',
          (_p: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) => {
            const c = this.cameras.main;
            c.setZoom(Phaser.Math.Clamp(c.zoom * (dy > 0 ? 0.9 : 1.1), 0.65, 3.2));
          },
        );
        const resize = () => {
          this.last = undefined;
        };
        this.scale.on('resize', resize);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', resize));
      }
      xy(x: number, y: number) {
        return { x: this.origin.x + (x - y) * this.sx, y: this.origin.y + (x + y) * this.sy };
      }
      point(p: Phaser.Input.Pointer) {
        return this.cameras.main.getWorldPoint(p.x, p.y);
      }
      stamp(key: string, x: number, y: number, size: number, depth = y) {
        const image = this.add
          .image(x, y, key)
          .setOrigin(0.5, 0.91)
          .setDisplaySize(size, size)
          .setDepth(depth);
        this.decor.add(image);
        return image;
      }
      label(x: number, y: number, text: string, size = 11, color = '#d6c8a7') {
        const label = this.add
          .text(x, y, text, {
            fontFamily: 'Georgia',
            fontSize: size,
            color,
            stroke: '#101a20',
            strokeThickness: 3,
            padding: { x: 4, y: 3 },
          })
          .setOrigin(0.5)
          .setDepth(100000);
        this.decor.add(label);
      }
      tile(x: number, y: number, color: number) {
        const p = this.xy(x, y),
          g = this.ground;
        // Thick shoreline gives the continent a stone-and-earth silhouette.
        g.fillStyle(0x162328);
        g.fillPoints(
          [
            { x: p.x - this.sx, y: p.y },
            { x: p.x, y: p.y + this.sy },
            { x: p.x + this.sx, y: p.y },
            { x: p.x + this.sx, y: p.y + 6 },
            { x: p.x, y: p.y + this.sy + 6 },
            { x: p.x - this.sx, y: p.y + 6 },
          ],
          true,
        );
        g.fillStyle(color);
        g.fillPoints(
          [
            { x: p.x, y: p.y - this.sy },
            { x: p.x + this.sx, y: p.y },
            { x: p.x, y: p.y + this.sy },
            { x: p.x - this.sx, y: p.y },
          ],
          true,
        );
        g.lineStyle(0.6, 0x9aab89, 0.09);
        g.strokePoints(
          [
            { x: p.x, y: p.y - this.sy },
            { x: p.x + this.sx, y: p.y },
            { x: p.x, y: p.y + this.sy },
            { x: p.x - this.sx, y: p.y },
          ],
          true,
        );
        // Fine ground detail, repeatable at every zoom level.
        for (let i = 0; i < 4; i++) {
          const dx = (noise(x, y, i) - 0.5) * this.sx,
            dy = (noise(y, x, i + 7) - 0.5) * this.sy;
          g.lineStyle(1, 0xc9c3a1, 0.12);
          g.lineBetween(p.x + dx, p.y + dy, p.x + dx + 2, p.y + dy - 1);
        }
      }
      begin(cols: number, rows: number) {
        this.ground.clear();
        this.overlay.clear();
        this.decor.removeAll(true);
        const width = this.scale.width,
          height = this.scale.height;
        this.sx = Math.min((width - 80) / (cols + rows), ((height - 130) * 2) / (cols + rows));
        this.sy = this.sx / 2;
        this.origin = {
          x: width / 2 - ((cols - rows) * this.sx) / 2,
          y: height / 2 - ((cols + rows) * this.sy) / 2 + 25,
        };
        const g = this.ground;
        g.fillStyle(0x111e27);
        g.fillRect(-2000, -2000, 5000, 5000);
        for (let i = 0; i < 100; i++) {
          const x = noise(i, 11) * width,
            y = noise(i, 23) * height;
          g.lineStyle(1, 0x7c99a4, 0.035);
          g.lineBetween(x, y, x + 15 + noise(i, 29) * 60, y - 5);
        }
      }
      finish() {
        this.decor.sort('depth');
      }
      click(_p: Phaser.Input.Pointer) {}
      update(time: number) {
        const b = current(),
          wanted = b.world.player?.scene ?? 'world';
        const key =
          wanted === 'battle' ? 'Battle' : wanted === 'settlement' ? 'Settlement' : 'World';
        if (this.scene.key !== key) {
          this.scene.start(key);
          return;
        }
        if (this.last !== b.world || this.lastSelected !== b.selected) {
          this.last = b.world;
          this.lastSelected = b.selected;
          this.draw();
        }
        // Cosmetic pulse only; never advances world time or spends simulation RNG.
        this.overlay.setAlpha(0.83 + Math.sin(time * 0.002) * 0.13);
      }
      draw() {}
    }
    class WorldScene extends IsoScene {
      constructor() {
        super('World');
      }
      draw() {
        this.begin(30, 10);
        const { world: w, selected } = current();
        const winter = Math.floor((w.day % 360) / 90) === 3;
        const palettes = {
          plains: [0x62694e, 0x6d7256, 0x555f49],
          forest: [0x394f43, 0x425b48, 0x33473e],
          mountain: [0x5c6966, 0x68736c, 0x505e5d],
          marsh: [0x3d5858, 0x466461, 0x354d50],
        };
        const sorted = [...w.settlements].sort((a, b) => a.x + a.y - b.x - b.y);
        for (const s of sorted) {
          let color = palettes[s.biome][Math.floor(noise(s.x, s.y) * 3)];
          if (winter)
            color =
              Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(color),
                Phaser.Display.Color.ValueToColor(0xb7c5be),
                100,
                42,
              ).color ?? color;
          this.tile(s.x, s.y, color);
        }
        for (const r of w.roads) {
          const a = w.settlements[r.a],
            b = w.settlements[r.b],
            pa = this.xy(a.x, a.y),
            pb = this.xy(b.x, b.y);
          this.ground.lineStyle(
            r.blocked ? 1.8 : 1,
            r.blocked ? 0xb06555 : 0xb6a680,
            r.blocked ? 0.8 : 0.23,
          );
          this.ground.lineBetween(pa.x, pa.y, pb.x, pb.y);
        }
        for (const s of sorted) {
          const p = this.xy(s.x, s.y),
            size = this.sx;
          if (s.biome === 'forest') {
            this.stamp('pine', p.x - size * 0.35, p.y - size * 0.08, size * 1.1);
            this.stamp('pine', p.x + size * 0.24, p.y - size * 0.19, size * 0.9);
          } else if (s.biome === 'mountain')
            this.stamp('mountain', p.x - size * 0.22, p.y - size * 0.15, size * 1.3);
          else if (s.biome === 'marsh') this.stamp('reeds', p.x - size * 0.34, p.y, size * 0.95);
          if (s.kind === 'ruins') this.stamp('ruins', p.x, p.y + 3, size * 1.25);
          else
            this.stamp(
              s.central ? 'castle' : 'house',
              p.x + size * 0.15,
              p.y + size * 0.15,
              size * (s.central ? 1.75 : 0.95),
            );
          if (s.central) {
            const color = Phaser.Display.Color.HexStringToColor(w.states[s.state].color).color;
            this.overlay.fillStyle(color);
            this.overlay.fillTriangle(p.x + 6, p.y - 21, p.x + 15, p.y - 18, p.x + 6, p.y - 15);
          }
          if (s.monsters) {
            this.overlay.fillStyle(0xd88970, 0.9);
            this.overlay.fillCircle(p.x + size * 0.6, p.y + size * 0.15, 2);
          }
          if (s.id === selected) {
            this.overlay.lineStyle(1.6, 0xe1c88e, 0.9);
            this.overlay.strokeEllipse(p.x, p.y, size * 1.9, this.sy * 1.6);
            this.label(p.x, p.y + size * 0.7, s.name, 11, '#f0d8a2');
          }
        }
        for (const state of w.states) {
          const cap = w.settlements[state.capital],
            p = this.xy(cap.x + 2, cap.y - 0.25);
          this.label(p.x, p.y - this.sx * 0.85, state.name, 11, '#c6b995');
        }
        for (const c of w.caravans) {
          const a = w.settlements[c.journey.route[c.journey.leg]],
            p = this.xy(a.x, a.y);
          this.stamp('cart', p.x, p.y + 7, this.sx * 1.1, 10000);
        }
        if (w.hero) {
          const s = w.settlements[w.hero.settlement],
            p = this.xy(s.x, s.y);
          if (w.player?.journey) {
            const path = w.player.journey.route;
            for (let i = w.player.journey.leg; i < path.length - 1; i++) {
              const a = w.settlements[path[i]],
                b = w.settlements[path[i + 1]],
                pa = this.xy(a.x, a.y),
                pb = this.xy(b.x, b.y);
              this.overlay.lineStyle(2, 0xf3d394, 0.85);
              this.overlay.lineBetween(pa.x, pa.y, pb.x, pb.y);
            }
          }
          this.overlay.lineStyle(2, 0xf2d18b);
          this.overlay.strokeEllipse(p.x, p.y + 3, this.sx * 0.95, this.sy * 0.8);
          this.stamp('hero', p.x, p.y + 2, this.sx * 1.65, 20000);
        }
        this.finish();
      }
      click(p: Phaser.Input.Pointer) {
        const pt = this.point(p),
          w = current().world;
        const nearest = w.settlements
          .map((s) => ({
            s,
            d: Math.hypot(this.xy(s.x, s.y).x - pt.x, (this.xy(s.x, s.y).y - pt.y) * 2),
          }))
          .sort((a, b) => a.d - b.d)[0];
        if (nearest.d < this.sx * 1.5) current().onSelect(nearest.s.id);
      }
    }
    class SettlementScene extends IsoScene {
      constructor() {
        super('Settlement');
      }
      draw() {
        this.begin(14, 12);
        const { world: w } = current();
        const here = w.settlements[w.hero!.settlement];
        for (let x = 0; x < 14; x++)
          for (let y = 0; y < 12; y++) {
            const road = x === 6 || x === 7 || y === 5 || y === 6;
            this.tile(
              x,
              y,
              road
                ? noise(x, y) > 0.5
                  ? 0x737364
                  : 0x686c60
                : noise(x, y) > 0.5
                  ? 0x465c46
                  : 0x3c5140,
            );
          }
        // Trees define the outskirts rather than covering interactive characters.
        for (let i = 0; i < 16; i++) {
          const x = i < 8 ? i * 1.6 : 13,
            y = i < 8 ? 0 : (i - 8) * 1.4;
          const p = this.xy(x, y);
          this.stamp('pine', p.x, p.y, this.sx * (1.9 + noise(i, 4) * 0.6));
        }
        const buildings: [number, number, string, string, number][] = [
          [2, 3, 'market', 'Торговые ряды', 3.4],
          [10, 3, 'smith', 'Кузница', 3],
          [3, 9, 'house', 'Жилой квартал', 2.7],
          [10, 9, here.central ? 'castle' : 'house', here.central ? 'Крепость' : 'Дом старосты', 4],
        ];
        for (const [x, y, key, name, size] of buildings) {
          const p = this.xy(x, y);
          this.stamp(key, p.x, p.y, this.sx * size);
          this.label(p.x, p.y + this.sy * 0.7, name, 12);
        }
        for (const [x, y] of [
          [1, 7],
          [4, 2],
          [11, 6],
        ]) {
          const p = this.xy(x, y);
          this.stamp('house', p.x, p.y, this.sx * 2);
        }
        const cart = this.xy(6, 3);
        this.stamp('cart', cart.x, cart.y, this.sx * 1.7);
        const fire = this.xy(7, 7);
        this.stamp('fire', fire.x, fire.y, this.sx * 1.4);
        this.overlay.fillStyle(0xedb76a, 0.05);
        this.overlay.fillEllipse(fire.x, fire.y, this.sx * 3, this.sx * 1.5);
        const locals = w.locals.filter((p) => p.id !== w.hero!.id);
        for (const [n, person] of locals.entries()) {
          const p = this.xy(5.8 + (n % 3) * 0.55, 2 + Math.floor(n / 3) * 1.1);
          this.stamp(
            person.profession === 'soldier' ? 'soldier' : 'citizen',
            p.x,
            p.y,
            this.sx * 1.25,
          );
        }
        const player = this.xy(7, 9);
        this.stamp('hero', player.x, player.y, this.sx * 1.65);
        this.overlay.lineStyle(1, 0xd7bd83, 0.9);
        this.overlay.strokeEllipse(player.x, player.y + 2, this.sx * 0.65, this.sy * 0.55);
        this.finish();
      }
    }
    class BattleScene extends IsoScene {
      constructor() {
        super('Battle');
      }
      draw() {
        this.begin(21, 15);
        const { world: w } = current();
        for (let x = 0; x <= 20; x++)
          for (let y = 0; y <= 14; y++) this.tile(x, y, noise(x, y) > 0.6 ? 0x555c47 : 0x424f3e);
        for (let i = 0; i < 16; i++) {
          const x = i < 8 ? i * 2.6 : 20,
            y = i < 8 ? 0 : (i - 8) * 1.9,
            p = this.xy(x, y);
          this.stamp(i % 5 === 0 ? 'rock' : 'pine', p.x, p.y, this.sx * (i % 5 === 0 ? 1.2 : 2));
        }
        const b = w.battle;
        if (!b) return;
        for (const f of [...b.fighters].sort((a, b) => a.x + a.y - b.x - b.y)) {
          const p = this.xy(f.x, f.y);
          if (f.hp <= 0) {
            this.ground.fillStyle(0x633e34, 0.6);
            this.ground.fillEllipse(p.x, p.y, 13, 6);
            this.stamp(f.side === 'enemy' ? 'wolf' : 'soldier', p.x, p.y, this.sx * 0.8)
              .setAngle(75)
              .setAlpha(0.4);
            continue;
          }
          const hero = f.person === w.player?.person;
          this.stamp(
            f.side === 'enemy' ? 'wolf' : hero ? 'hero' : 'soldier',
            p.x,
            p.y,
            this.sx * (hero ? 1.8 : 1.55),
          );
          if (f.side === 'player') {
            this.ground.lineStyle(1, hero ? 0xe5c889 : 0x93aba0, 0.7);
            this.ground.strokeEllipse(p.x, p.y + 2, this.sx * 0.75, this.sy * 0.65);
          }
          const width = Math.max(13, this.sx * 0.65),
            y = p.y - this.sx * 1.35;
          this.overlay.fillStyle(0x121c20, 0.9);
          this.overlay.fillRoundedRect(p.x - width / 2 - 1, y - 1, width + 2, 5, 1);
          this.overlay.fillStyle(f.side === 'enemy' ? 0xb77966 : 0x9eaf86);
          this.overlay.fillRect(p.x - width / 2, y, (width * f.hp) / f.maxHp, 3);
        }
        this.finish();
      }
      click(p: Phaser.Input.Pointer) {
        if (current().world.battle?.status !== 'active') return;
        const pt = this.point(p),
          dx = (pt.x - this.origin.x) / this.sx,
          dy = (pt.y - this.origin.y) / this.sy;
        const x = (dx + dy) / 2,
          y = (dy - dx) / 2;
        if (x < 0 || x > 20 || y < 0 || y > 14) return;
        current().send({ type: 'battle_order', x, y, unitClass: current().unit });
      }
    }
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      backgroundColor: '#111e27',
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: host.current.clientWidth,
        height: host.current.clientHeight,
      },
      scene: [WorldScene, SettlementScene, BattleScene],
      render: { antialias: true, roundPixels: false },
      audio: { noAudio: true },
    });
    gameRef.current = game;
    return () => {
      gameRef.current = null;
      game.destroy(true);
    };
  }, []);
  const zoom = (factor: number) => {
    const scene = gameRef.current?.scene.getScenes(true)[0];
    if (!scene) return;
    const c = scene.cameras.main;
    if (factor === 0) {
      c.setZoom(1);
      c.setScroll(0, 0);
    } else c.setZoom(Phaser.Math.Clamp(c.zoom * factor, 0.65, 3.2));
  };
  return (
    <div className="game-stage">
      <div className="game" ref={host} aria-label="Изометрическая игровая карта" />
      <div className="atmosphere" aria-hidden="true" />
      <div className="compass" aria-hidden="true">
        <span>С</span>✧
      </div>
      <div className="map-controls">
        <button aria-label="Приблизить карту" onClick={() => zoom(1.25)}>
          +
        </button>
        <button aria-label="Отдалить карту" onClick={() => zoom(0.8)}>
          −
        </button>
        <button aria-label="Показать всю карту" onClick={() => zoom(0)}>
          ⌖
        </button>
      </div>
      <div className="camera-hint">Перетаскивание — камера · Колесо — масштаб</div>
    </div>
  );
}
