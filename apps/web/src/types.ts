import type { World, Person, NPC, Settlement } from '@living-world/simulation';
export type View = Omit<World, 'people' | 'npcs' | 'settlements' | 'directorLogs'> & {
  settlements: Omit<Settlement, 'residents'>[];
  saveError?: string | null;
  population: { total: number; alive: number };
  hero: Person | null;
  heirs: Person[];
  locals: (Person & { npc?: NPC })[];
  rulers: NPC[];
  party: (Person & { npc?: NPC })[];
};
