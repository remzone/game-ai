export const RACES = ['Human', 'Elf', 'Dark Elf', 'Orc', 'Dwarf', 'Goblin'] as const;
export type Race = (typeof RACES)[number];
export type Ancestry = [number, number, number, number, number, number];
export const GOODS = ['grain', 'wood', 'stone', 'iron', 'tools', 'weapons', 'horses'] as const;
export type Good = (typeof GOODS)[number];
export type Stocks = Record<Good, number>;
export type Profession =
  'farmer' | 'woodcutter' | 'miner' | 'smith' | 'merchant' | 'child' | 'soldier';
export type UnitClass = 'infantry' | 'spearmen' | 'archers' | 'cavalry' | 'mages';
export interface Person {
  id: number;
  parents: number[];
  children: number[];
  ancestry: Ancestry;
  sex: 'female' | 'male';
  born: number;
  alive: boolean;
  health: number;
  profession: Profession;
  homeProfession?: Profession;
  settlement: number;
  state: number;
  wealth: number;
  experience: number;
  spouse?: number;
  lastBirth?: number;
}
export interface NPC {
  person: number;
  name: string;
  biography: string;
  traits: string[];
  memory: string[];
  titles: string[];
  relationships: Record<number, number>;
}
export interface Settlement {
  id: number;
  name: string;
  region: number;
  state: number;
  x: number;
  y: number;
  biome: 'forest' | 'plains' | 'mountain' | 'marsh';
  kind: 'village' | 'town' | 'city' | 'ruins';
  central: boolean;
  residents: number[];
  population: number;
  workers: Record<Profession, number>;
  stocks: Stocks;
  prices: Stocks;
  treasury: number;
  loyalty: number;
  infrastructure: number;
  shortageDays: number;
  monsters: number;
  governance: { steward: number | null; localTax: number; unrestDays: number; eligibleDay: number };
}
export interface State {
  id: number;
  name: string;
  color: string;
  government: string;
  doctrines: string[];
  ruler: number;
  capital: number;
  legitimacy: number;
  tax: number;
  treasury: number;
  claims: number[];
  relations: Record<number, number>;
}
export interface Region {
  id: number;
  state: number;
  name: string;
  capital: number;
  treasury: number;
}
export interface Road {
  a: number;
  b: number;
  days: number;
  blocked: boolean;
  traffic: number;
}
export interface Journey {
  route: number[];
  leg: number;
  remaining: number;
  total: number;
}
export interface Caravan {
  id: string;
  from: number;
  to: number;
  good: Good;
  amount: number;
  paid: number;
  journey: Journey;
  status: 'traveling' | 'delivered' | 'lost';
}
export interface Army {
  id: string;
  state: number;
  settlement: number;
  members: number[];
  unitClass: UnitClass;
  food: number;
  morale: number;
  player: boolean;
  mounts?: number;
}
export interface War {
  id: string;
  a: number;
  b: number;
  reason: string;
  started: number;
  active: boolean;
  target: number;
}
export interface Quest {
  id: string;
  settlement: number;
  type: 'deliver' | 'hunt';
  status: 'open' | 'accepted' | 'completed' | 'resolved';
  need: number;
  reward: number;
  created: number;
  reason: string;
  objectiveMet?: boolean;
}
export interface GameEvent {
  id: string;
  day: number;
  type: string;
  text: string;
  entities: string[];
  historical: boolean;
}
export interface Chronicle {
  id: string;
  day: number;
  title: string;
  text: string;
  evidence: string[];
  subjective: true;
}
export interface Player {
  person: number;
  name: string;
  gold: number;
  inventory: Stocks;
  skills: Record<string, number>;
  attributes: Record<string, number>;
  reputation: Record<string, number>;
  legitimacy: number;
  title: string;
  army: string;
  biography: Record<string, string>;
  journey?: Journey;
  visited: number[];
  scene: 'world' | 'settlement' | 'battle';
  heirs: number[];
  gameOver: boolean;
}
export interface Fighter {
  id: string;
  person?: number;
  side: 'player' | 'enemy';
  unitClass: UnitClass;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  cooldown: number;
  order?: 'move' | 'attack' | 'hold';
}
export interface Battle {
  id: string;
  settlement: number;
  fighters: Fighter[];
  status: 'active' | 'victory' | 'defeat' | 'retreated';
  elapsed: number;
}
export interface DirectorSettings {
  enabled: boolean;
  model: string;
  cooldownDays: number;
  budget: number;
  calls: number;
  lastDay: number;
}
export interface DirectorLog {
  day: number;
  model: string;
  request: unknown;
  response: unknown;
  accepted: boolean;
  reason: string;
}
export interface World {
  version: 3;
  seed: string;
  rng: number;
  nextId: number;
  day: number;
  speed: 0 | 1 | 2 | 5 | 10;
  people: Person[];
  npcs: Record<number, NPC>;
  settlements: Settlement[];
  regions: Region[];
  states: State[];
  roads: Road[];
  caravans: Caravan[];
  armies: Army[];
  wars: War[];
  quests: Quest[];
  events: GameEvent[];
  chronicles: Chronicle[];
  player: Player | null;
  battle: Battle | null;
  director: DirectorSettings;
  directorLogs: DirectorLog[];
}
export const emptyStocks = (): Stocks => ({
  grain: 0,
  wood: 0,
  stone: 0,
  iron: 0,
  tools: 0,
  weapons: 0,
  horses: 0,
});
export const emptyWorkers = (): Settlement['workers'] => ({
  farmer: 0,
  woodcutter: 0,
  miner: 0,
  smith: 0,
  merchant: 0,
  child: 0,
  soldier: 0,
});
export const BASE_PRICES: Stocks = {
  grain: 2,
  wood: 4,
  stone: 4,
  iron: 8,
  tools: 14,
  weapons: 24,
  horses: 60,
};
export function season(day: number): string {
  return ['Весна', 'Лето', 'Осень', 'Зима'][Math.floor((day % 360) / 90)];
}
export function date(day: number): string {
  return `${(day % 30) + 1}.${Math.floor((day % 360) / 30) + 1}.${Math.floor(day / 360) + 1}`;
}
