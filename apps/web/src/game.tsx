import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Command } from '@living-world/simulation';
import type { View } from './types';
import { ART } from './art';
type Bridge = {
  world: View;
  selected: number;
  onTalk: (id: number) => void;
  onSelect: (id: number) => void;
  send: (c: Command) => void;
  unit: 'all' | 'infantry' | 'spearmen' | 'archers' | 'cavalry' | 'mages';
};
// Visual variation is coordinate-based, independent of the simulation's RNG.
const noise = (x: number, y: number, salt = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
export function Game({ world, selected, onSelect, send, unit, onTalk }: Bridge) {
  const host = useRef<HTMLDivElement>(null),
    gameRef = useRef<Phaser.Game | null>(null);
  const bridge = useRef<Bridge>({ world, selected, onSelect, send, unit, onTalk });
  bridge.current = { world, selected, onSelect, send, unit, onTalk };
  useEffect(() => {
    if (!host.current) return;
    const current = () => bridge.current;
    class IsoScene extends Phaser.Scene {
      ground!: Phaser.GameObjects.Graphics;
      overlay!: Phaser.GameObjects.Graphics;
      decor!: Phaser.GameObjects.Container;
      last?: View;
      lastSelected = -1;
      lastUnit = '';
      origin = { x: 0, y: 0 };
      sx = 24;
      sy = 12;
      down = { x: 0, y: 0 };
      hover = -1;
      framed = false;
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        this.framed = false;
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
            c.setZoom(Phaser.Math.Clamp(c.zoom * (dy > 0 ? 0.9 : 1.1), 0.18, 3.2));
          },
        );
        const resize = () => {
          this.last = undefined;
          this.framed = false;
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
        g.lineStyle(0.6, 0x9aab89, 0.025);
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
        this.tweens.killAll();
        this.decor.removeAll(true);
        const width = this.scale.width,
          height = this.scale.height;
        this.sx =
          this.scene.key === 'World'
            ? 82
            : Math.max(22, Math.min(width / (this.scene.key === 'Battle' ? 25 : 20), height / 11));
        this.sy = this.sx / 2;
        this.origin = {
          x: width / 2 - ((cols - rows) * this.sx) / 2,
          y: height / 2 - ((cols + rows) * this.sy) / 2 + 25,
        };
        const g = this.ground;
        g.fillStyle(this.scene.key === 'World' ? 0x213b43 : 0x35463c);
        g.fillRect(-10000, -10000, 20000, 20000);
        for (let i = 0; i < 100; i++) {
          const x = noise(i, 11) * width,
            y = noise(i, 23) * height;
          g.lineStyle(1, 0x7c99a4, 0.035);
          g.lineBetween(x, y, x + 15 + noise(i, 29) * 60, y - 5);
        }
      }
      frameCamera(overview = false) {
        const camera = this.cameras.main;
        if (this.scene.key === 'World' && !overview) {
          const w = current().world;
          const home = w.settlements[w.hero?.settlement ?? current().selected];
          const p = this.xy(home.x, home.y);
          camera.setZoom(1);
          camera.centerOn(p.x + 120, p.y + 100);
        } else {
          camera.setZoom(
            overview && this.scene.key === 'World'
              ? Math.min(
                  (this.scale.width - 90) / (40 * this.sx),
                  (this.scale.height - 150) / (40 * this.sy),
                )
              : 1,
          );
          camera.centerOn(this.scale.width / 2, this.scale.height / 2);
        }
        this.framed = true;
      }
      finish() {
        if (!this.framed) this.frameCamera();
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
        if (this.last !== b.world || this.lastSelected !== b.selected || this.lastUnit !== b.unit) {
          const selectedChanged = this.lastSelected !== -1 && this.lastSelected !== b.selected;
          this.last = b.world;
          this.lastSelected = b.selected;
          this.lastUnit = b.unit;
          this.draw();
          if (selectedChanged && this.scene.key === 'World') {
            const s = b.world.settlements[b.selected],
              p = this.xy(s.x, s.y);
            this.cameras.main.centerOn(p.x, p.y);
          }
        }
        // Cosmetic pulse only; never advances world time or spends simulation RNG.
        this.overlay.setAlpha(this.reducedMotion ? 1 : 0.93 + Math.sin(time * 0.002) * 0.06);
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
          plains: [0x465440, 0x485540, 0x43523e],
          forest: [0x394c3f, 0x3c4e41, 0x3a4c40],
          mountain: [0x4c5952, 0x4e5b53, 0x4b574f],
          marsh: [0x3d514b, 0x40554e, 0x3b514d],
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
            r.blocked ? 4 : 3,
            r.blocked ? 0xb06555 : 0xb6a680,
            r.blocked ? 0.8 : 0.44,
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
          if (s.central && s.id !== selected) this.label(p.x, p.y + size * 0.38, s.name, 12);
          if (s.id === selected) {
            this.overlay.lineStyle(1.6, 0xe1c88e, 0.9);
            this.overlay.strokeEllipse(p.x, p.y, size * 1.9, this.sy * 1.6);
            this.label(p.x, p.y + size * 0.7, s.name, 14, '#f0d8a2');
          }
        }
        for (const state of w.states) {
          const cap = w.settlements[state.capital],
            p = this.xy(cap.x + 2, cap.y - 0.25);
          this.label(p.x, p.y - this.sx * 1.45, state.name, 15, '#c6b995');
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
                  ? 0x787560
                  : 0x77735e
                : noise(x, y) > 0.5
                  ? 0x36483d
                  : 0x37493d,
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
          [10, 3, 'market', 'Торговые ряды', 3.4],
          [3, 9, 'smith', 'Кузница', 3],
          [10, 9, 'house', 'Жилой квартал', 2.7],
          [2, 2, here.central ? 'castle' : 'house', here.central ? 'Крепость' : 'Дом старосты', 4],
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
        const locals = w.locals.filter((p) => p.id !== w.hero!.id).slice(0, 12);
        for (const [n, person] of locals.entries()) {
          const p = this.xy(5.8 + (n % 3) * 0.65, 2 + Math.floor(n / 3) * 1.6);
          const npcSprite = this.stamp(
            person.profession === 'soldier' ? 'soldier' : 'citizen',
            p.x,
            p.y,
            this.sx * 1.25,
          );
          npcSprite.setInteractive({ useHandCursor: true });
          npcSprite.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (Math.hypot(pointer.x - this.down.x, pointer.y - this.down.y) <= 8)
              current().onTalk(person.id);
          });
        }
        const player = this.xy(7, 9);
        this.stamp('hero', player.x, player.y, this.sx * 1.65);
        this.overlay.lineStyle(1, 0xd7bd83, 0.9);
        this.overlay.strokeEllipse(player.x, player.y + 2, this.sx * 0.65, this.sy * 0.55);
        this.finish();
      }
    }
    class BattleScene extends IsoScene {
      actors = new Map<
        string,
        { container: Phaser.GameObjects.Container; hp: number; cooldown: number }
      >();
      battleId = '';
      constructor() {
        super('Battle');
      }
      draw() {
        const { world: w, unit } = current();
        const b = w.battle;
        const previous = new Map(
          [...this.actors].map(([id, a]) => [
            id,
            { x: a.container.x, y: a.container.y, hp: a.hp, cooldown: a.cooldown },
          ]),
        );
        if (this.battleId !== b?.id || !this.framed) previous.clear();
        this.battleId = b?.id ?? '';
        this.actors.clear();
        this.begin(21, 15);
        for (let x = -5; x <= 25; x++)
          for (let y = -5; y <= 20; y++) this.tile(x, y, noise(x, y) > 0.6 ? 0x38493c : 0x35463c);
        // A worn trail crosses the fighting ground; all orders still use simulation coordinates.
        const roadStart = this.xy(0, 8),
          roadEnd = this.xy(21, 8);
        this.ground.lineStyle(this.sx * 1.5, 0x797359, 0.32);
        this.ground.lineBetween(roadStart.x, roadStart.y, roadEnd.x, roadEnd.y);
        for (let i = 0; i < 34; i++) {
          const x = i < 17 ? -1 : 22;
          const p = this.xy(x + noise(i, 12), (i % 17) - 1);
          this.stamp(i % 7 === 0 ? 'rock' : 'pine', p.x, p.y, this.sx * (i % 7 === 0 ? 1.2 : 2.3));
        }
        const ruins = this.xy(15, -1);
        this.stamp('ruins', ruins.x, ruins.y, this.sx * 2.5);
        if (!b) {
          this.finish();
          return;
        }
        for (const f of b.fighters) {
          const p = this.xy(f.x, f.y),
            hero = f.person === w.player?.person;
          const old = previous.get(f.id);
          const size = this.sx * (hero ? 1.8 : 1.55);
          const selected = f.side === 'player' && (unit === 'all' || f.unitClass === unit);
          const actor = this.add.container(old?.x ?? p.x, old?.y ?? p.y).setDepth(p.y);
          this.decor.add(actor);
          const ring = this.add.graphics();
          if (selected && f.hp > 0) {
            ring.lineStyle(hero ? 2 : 1, hero ? 0xe5c889 : 0xa6be90, 0.8);
            ring.strokeEllipse(0, 2, this.sx * 0.8, this.sy * 0.7);
          }
          const sprite = this.add
            .image(0, 0, f.side === 'enemy' ? 'wolf' : hero ? 'hero' : 'soldier')
            .setOrigin(0.5, 0.91)
            .setDisplaySize(size, size);
          const health = this.add.graphics();
          if (!hero && f.side === 'player' && f.unitClass === 'archers') sprite.setTint(0x98b9a3);
          if (!hero && f.side === 'player' && f.unitClass === 'cavalry') sprite.setTint(0xb7a5d2);
          actor.add([ring, sprite, health]);
          if (f.hp <= 0) {
            sprite
              .setAngle(75)
              .setAlpha(0.35)
              .setScale(sprite.scaleX * 0.75, sprite.scaleY * 0.75);
          } else {
            const width = this.sx * 0.7;
            health.fillStyle(0x111e24, 0.95);
            health.fillRect(-width / 2 - 1, -size * 0.87 - 1, width + 2, 6);
            health.fillStyle(f.side === 'enemy' ? 0xbe826d : 0xa9bc8a);
            health.fillRect(-width / 2, -size * 0.87, (width * f.hp) / f.maxHp, 4);
            if (old && !this.reducedMotion) {
              const moving = Math.hypot(p.x - old.x, p.y - old.y) > 0.5;
              if (moving) this.tweens.add({ targets: sprite, y: -2.5, duration: 100, yoyo: true });
              if (f.cooldown > old.cooldown)
                this.tweens.add({
                  targets: sprite,
                  angle: f.side === 'player' ? 11 : -11,
                  duration: 90,
                  yoyo: true,
                });
              if (f.hp < old.hp) {
                sprite.setTint(0xffc2a0);
                this.tweens.add({
                  targets: sprite,
                  alpha: 0.6,
                  duration: 100,
                  yoyo: true,
                  onComplete: () => sprite.clearTint(),
                });
              }
            }
          }
          if (old && !this.reducedMotion)
            this.tweens.add({
              targets: actor,
              x: p.x,
              y: p.y,
              duration: 230,
              onUpdate: () => {
                actor.setDepth(actor.y);
                this.decor.sort('depth');
              },
            });
          else actor.setPosition(p.x, p.y);
          this.actors.set(f.id, { container: actor, hp: f.hp, cooldown: f.cooldown });
          if (selected && f.hp > 0 && b.status === 'active') {
            const target = this.xy(f.targetX, f.targetY);
            this.overlay.lineStyle(1, 0xd6bd7e, 0.3);
            this.overlay.lineBetween(p.x, p.y, target.x, target.y);
            this.overlay.strokeEllipse(target.x, target.y, 13, 7);
          }
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
      (scene as Phaser.Scene & { frameCamera: (overview: boolean) => void }).frameCamera(true);
    } else if (factor === -1) {
      (scene as Phaser.Scene & { frameCamera: (overview: boolean) => void }).frameCamera(false);
    } else c.setZoom(Phaser.Math.Clamp(c.zoom * factor, 0.18, 3.2));
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
        <button aria-label="К герою" onClick={() => zoom(-1)}>
          ♟
        </button>
        <button aria-label="Показать всю карту" onClick={() => zoom(0)}>
          ⌖
        </button>
      </div>
      <div className="camera-hint">Перетаскивание — камера · Колесо — масштаб</div>
    </div>
  );
}
