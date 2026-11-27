import type {
  PlayerMapView,
  RoadActor,
  World,
  Person,
  NPC,
  Settlement,
  PortraitAppearance,
} from '@living-world/simulation';
type VisualPerson = Person & { appearance?: PortraitAppearance };
type VisualNPC = NPC & { appearance?: PortraitAppearance };
export type View = Omit<World, 'people' | 'npcs' | 'settlements' | 'directorLogs' | 'roadLife'> & {
  settlements: Omit<Settlement, 'residents'>[];
  mapKnowledge?: PlayerMapView;
  roadActors?: RoadActor[];
  saveError?: string | null;
  population: { total: number; alive: number };
  hero: VisualPerson | null;
  heirs: VisualPerson[];
  locals: (VisualPerson & { npc?: NPC })[];
  rulers: VisualNPC[];
  wardrobe?: {
    equipped: PortraitAppearance['outfit'];
    outfitIds: PortraitAppearance['outfit'][];
  } | null;
  party: (VisualPerson & { npc?: NPC })[];
};
