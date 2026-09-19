import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Command } from '@living-world/simulation';
import type { View } from './types';
type Bridge = {
  world: View;
  selected: number;
  onSelect: (id: number) => void;
  send: (c: Command) => void;
  unit: 'all' | 'infantry' | 'spearmen' | 'archers' | 'cavalry' | 'mages';
};
export function Game({ world, selected, onSelect, send, unit }: Bridge) {
  const host = useRef<HTMLDivElement>(null),
    bridge = useRef<Bridge>({ world, selected, onSelect, send, unit });
  bridge.current = { world, selected, onSelect, send, unit };
  useEffect(() => {
    if (!host.current) return;
    const current = () => bridge.current;
    class IsoScene extends Phaser.Scene {
      g!: Phaser.GameObjects.Graphics;
      labels: Phaser.GameObjects.Text[] = [];
      last?: View;
      origin = { x: 0, y: 0 };
      sx = 22;
      sy = 11;
      down = { x: 0, y: 0 };
      create() {
        this.g = this.add.graphics();
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
          this.down = { x: p.x, y: p.y };
        });
        this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
          if (Math.hypot(p.x - this.down.x, p.y - this.down.y) > 12) return;
          this.click(p);
        });
        this.scale.on('resize', () => {
          this.last = undefined;
        });
      }
      xy(x: number, y: number) {
        return { x: this.origin.x + (x - y) * this.sx, y: this.origin.y + (x + y) * this.sy };
      }
      tile(x: number, y: number, color: number, alpha = 1) {
        const p = this.xy(x, y);
        this.g.fillStyle(color, alpha);
        this.g.beginPath();
        this.g.moveTo(p.x, p.y - this.sy);
        this.g.lineTo(p.x + this.sx, p.y);
        this.g.lineTo(p.x, p.y + this.sy);
        this.g.lineTo(p.x - this.sx, p.y);
        this.g.closePath();
        this.g.fillPath();
        this.g.lineStyle(0.5, 0x080d0e, 0.5);
        this.g.strokePath();
      }
      label(x: number, y: number, text: string, size = 10, color = '#d7d5c5') {
        this.labels.push(
          this.add
            .text(x, y, text, {
              fontFamily: 'Georgia',
              fontSize: size,
              color,
              backgroundColor: '#101515bb',
              padding: { x: 3, y: 2 },
            })
            .setOrigin(0.5),
        );
      }
      begin(cols: number, rows: number) {
        this.g.clear();
        this.labels.forEach((t) => t.destroy());
        this.labels = [];
        const width = this.scale.width,
          height = this.scale.height;
        this.sx = Math.min((width - 50) / (cols + rows), ((height - 70) * 2) / (cols + rows));
        this.sy = this.sx / 2;
        this.origin = { x: (width - (cols - rows) * this.sx) / 2, y: 30 };
      }
      click(_p: Phaser.Input.Pointer) {}
      update() {
        const b = current(),
          wanted = b.world.player?.scene ?? 'world',
          sceneKey =
            wanted === 'battle' ? 'Battle' : wanted === 'settlement' ? 'Settlement' : 'World';
        if (this.scene.key !== sceneKey) {
          this.scene.start(sceneKey);
          return;
        }
        if (this.last !== b.world) {
          this.last = b.world;
          this.draw();
        }
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
        for (const s of [...w.settlements].sort((a, b) => a.x + a.y - b.x - b.y)) {
          const color = Phaser.Display.Color.HexStringToColor(w.states[s.state].color).color;
          this.tile(s.x, s.y, color, 0.38);
          const p = this.xy(s.x, s.y);
          this.g.fillStyle(
            { plains: 0x799269, forest: 0x335849, mountain: 0x818d8b, marsh: 0x416f71 }[s.biome],
            0.65,
          );
          if (s.biome === 'mountain') this.g.fillTriangle(p.x - 5, p.y, p.x, p.y - 9, p.x + 5, p.y);
          else if (s.biome === 'forest')
            this.g.fillTriangle(p.x - 5, p.y, p.x, p.y - 7, p.x + 5, p.y);
          this.g.fillStyle(s.central ? 0xd3bc8a : 0xaaa48c, 1);
          this.g.fillRect(p.x - 2, p.y - 3, s.central ? 6 : 3, s.central ? 6 : 3);
          if (s.id === selected) {
            this.g.lineStyle(2, 0xf0ce82, 1);
            this.g.strokeEllipse(p.x, p.y, this.sx * 1.7, this.sy * 1.5);
          }
          if (s.monsters) {
            this.g.fillStyle(0xcf665b);
            this.g.fillCircle(p.x + 5, p.y - 4, 2);
          }
        }
        for (const state of w.states) {
          const cap = w.settlements[state.capital],
            p = this.xy(cap.x + 2, cap.y);
          this.label(p.x, p.y - 12, state.name, Math.max(9, this.sx * 0.48), state.color);
        }
        for (const r of w.roads.filter((r) => r.blocked)) {
          const a = w.settlements[r.a],
            b = w.settlements[r.b],
            pa = this.xy(a.x, a.y),
            pb = this.xy(b.x, b.y);
          this.g.lineStyle(2, 0xc8635b);
          this.g.lineBetween(pa.x, pa.y, pb.x, pb.y);
        }
        for (const c of w.caravans) {
          const s = w.settlements[c.journey.route[c.journey.leg]],
            p = this.xy(s.x, s.y);
          this.g.fillStyle(0xe8c973);
          this.g.fillRect(p.x - 2, p.y + 4, 5, 3);
        }
        if (w.hero) {
          const p = this.xy(w.settlements[w.hero.settlement].x, w.settlements[w.hero.settlement].y);
          if (w.player?.journey) {
            this.g.lineStyle(2, 0xf2d590, 0.7);
            const path = w.player.journey.route;
            for (let i = w.player.journey.leg; i < path.length - 1; i++) {
              const a = w.settlements[path[i]],
                b = w.settlements[path[i + 1]],
                pa = this.xy(a.x, a.y),
                pb = this.xy(b.x, b.y);
              this.g.lineBetween(pa.x, pa.y, pb.x, pb.y);
            }
          }
          this.g.fillStyle(0xffe4a3);
          this.g.fillCircle(p.x, p.y - 6, 4);
          this.g.lineStyle(1, 0xffffff);
          this.g.strokeCircle(p.x, p.y - 6, 6);
        }
      }
      click(p: Phaser.Input.Pointer) {
        const w = current().world;
        const closest = w.settlements
          .map((s) => ({
            s,
            d: Math.hypot(this.xy(s.x, s.y).x - p.x, (this.xy(s.x, s.y).y - p.y) * 2),
          }))
          .sort((a, b) => a.d - b.d)[0];
        if (closest.d < this.sx * 1.5) {
          current().onSelect(closest.s.id);
          this.last = undefined;
        }
      }
    }
    class SettlementScene extends IsoScene {
      constructor() {
        super('Settlement');
      }
      draw() {
        this.begin(13, 11);
        const { world: w } = current();
        for (let x = 0; x < 13; x++)
          for (let y = 0; y < 11; y++)
            this.tile(x, y, x === 6 || y === 5 ? 0x776d54 : 0x35483c, 0.9);
        const buildings = [
          [2, 2, 'Рынок'],
          [9, 2, 'Мастерская'],
          [3, 8, 'Дома'],
          [10, 8, 'Ратуша'],
        ];
        for (const [x, y, name] of buildings) {
          const p = this.xy(Number(x), Number(y));
          this.g.fillStyle(0x78654c);
          this.g.fillRect(p.x - 22, p.y - 28, 44, 30);
          this.g.fillStyle(0x473e39);
          this.g.fillTriangle(p.x - 28, p.y - 28, p.x, p.y - 46, p.x + 28, p.y - 28);
          this.label(p.x, p.y + 15, String(name), 12);
        }
        for (const [n, person] of w.locals.entries()) {
          const p = this.xy(4 + (n % 5), 3 + Math.floor(n / 5));
          this.g.fillStyle(person.id === w.player?.person ? 0xf1d28a : 0xafb8a7);
          this.g.fillCircle(p.x, p.y - 4, 4);
          this.g.fillRect(p.x - 3, p.y, 6, 7);
        }
        this.label(
          this.scale.width / 2,
          this.scale.height - 25,
          'Рынок, жители и контракты — в панели справа',
          13,
        );
      }
    }
    class BattleScene extends IsoScene {
      constructor() {
        super('Battle');
      }
      draw() {
        this.begin(21, 15);
        for (let x = 0; x <= 20; x++)
          for (let y = 0; y <= 14; y++) this.tile(x, y, (x + y) % 2 ? 0x30413b : 0x33463c);
        const b = current().world.battle;
        if (!b) return;
        for (const f of [...b.fighters].sort((a, b) => a.x + a.y - b.x - b.y)) {
          const p = this.xy(f.x, f.y);
          if (f.hp <= 0) {
            this.g.lineStyle(2, 0x813c3c);
            this.g.lineBetween(p.x - 3, p.y - 3, p.x + 3, p.y + 3);
            continue;
          }
          this.g.fillStyle(f.side === 'player' ? 0xe4c782 : 0xb15e54);
          this.g.fillCircle(p.x, p.y - 3, f.person === current().world.player?.person ? 6 : 4);
          this.g.fillStyle(0x12201a);
          this.g.fillRect(p.x - 8, p.y - 14, 16, 3);
          this.g.fillStyle(0x8fad78);
          this.g.fillRect(p.x - 8, p.y - 14, (16 * f.hp) / f.maxHp, 3);
        }
        this.label(
          this.scale.width / 2,
          this.scale.height - 24,
          'Щёлкните по полю, чтобы отдать приказ выбранному отряду',
          12,
        );
      }
      click(p: Phaser.Input.Pointer) {
        const dx = (p.x - this.origin.x) / this.sx,
          dy = (p.y - this.origin.y) / this.sy;
        current().send({
          type: 'battle_order',
          x: Math.max(0, Math.min(20, (dx + dy) / 2)),
          y: Math.max(0, Math.min(14, (dy - dx) / 2)),
          unitClass: current().unit,
        });
      }
    }
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      backgroundColor: '#121c1b',
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: host.current.clientWidth,
        height: host.current.clientHeight,
      },
      scene: [WorldScene, SettlementScene, BattleScene],
      render: { antialias: true },
      audio: { noAudio: true },
    });
    return () => game.destroy(true);
  }, []);
  return <div className="game" ref={host} aria-label="Изометрическая игровая карта" />;
}
