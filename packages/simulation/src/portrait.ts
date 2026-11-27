import { RACES, type Person, type Race, type World } from './model.js';
import { seedHash } from './rng.js';

export const HAIR_COLORS = ['black', 'brown', 'auburn', 'blond', 'silver'] as const;
export const EYE_COLORS = ['brown', 'hazel', 'green', 'blue', 'gray'] as const;
export const FACE_SHAPES = ['angular', 'rounded'] as const;
export const HAIR_STYLES = ['bald', 'cropped', 'swept', 'braided'] as const;
export const SKIN_TONES = ['pale', 'warm', 'deep', 'olive', 'slate'] as const;
export const PORTRAIT_VARIANTS = [1, 2, 3, 4, 5, 6] as const;
export const OUTFITS = ['traveler', 'warrior', 'trader', 'healer'] as const;
export type HairColor = (typeof HAIR_COLORS)[number];
export type EyeColor = (typeof EYE_COLORS)[number];
export type FaceShape = (typeof FACE_SHAPES)[number];
export type HairStyle = (typeof HAIR_STYLES)[number];
export type SkinTone = (typeof SKIN_TONES)[number];
export type Outfit = (typeof OUTFITS)[number];
export type PortraitVariant = (typeof PORTRAIT_VARIANTS)[number];
export interface AppearanceChoices {
  /** Ready portrait number for this ancestry and sex. Older snapshots omit it. */
  variant?: PortraitVariant;
  // Earlier clients used portrait layers. Keep their values readable in existing saves.
  hair?: HairColor;
  eyes?: EyeColor;
  face?: FaceShape;
  hairStyle?: HairStyle;
  skin?: SkinTone;
}
export interface PortraitAppearance extends Required<AppearanceChoices> {
  race: Race;
  sex: Person['sex'];
  outfit: Outfit;
}
export interface Wardrobe {
  equipped: Outfit;
  outfitIds: Outfit[];
}

const raceHair: Record<Race, readonly HairColor[]> = {
  Human: ['black', 'brown', 'brown', 'auburn', 'blond'],
  Elf: ['blond', 'silver', 'brown', 'blond', 'silver'],
  'Dark Elf': ['silver', 'black', 'silver', 'black', 'auburn'],
  Orc: ['black', 'black', 'brown', 'brown', 'silver'],
  Dwarf: ['auburn', 'brown', 'blond', 'black', 'auburn'],
  Goblin: ['brown', 'black', 'auburn', 'black', 'silver'],
};
const raceEyes: Record<Race, readonly EyeColor[]> = {
  Human: ['brown', 'hazel', 'green', 'blue', 'gray'],
  Elf: ['green', 'blue', 'gray', 'green', 'hazel'],
  'Dark Elf': ['gray', 'green', 'gray', 'brown', 'blue'],
  Orc: ['hazel', 'brown', 'green', 'brown', 'hazel'],
  Dwarf: ['blue', 'hazel', 'brown', 'gray', 'brown'],
  Goblin: ['hazel', 'green', 'brown', 'green', 'gray'],
};

const raceSkin: Record<Race, readonly SkinTone[]> = {
  Human: ['pale', 'warm', 'deep', 'olive'],
  Elf: ['pale', 'warm', 'deep', 'olive'],
  'Dark Elf': ['slate', 'deep', 'slate'],
  Orc: ['olive', 'slate', 'deep'],
  Dwarf: ['pale', 'warm', 'deep', 'olive'],
  Goblin: ['olive', 'slate', 'warm'],
};

// Avalanche the salted hash so adjacent IDs and power-of-two palettes don't share low-bit patterns.
function aspect<T>(palette: readonly T[], key: string, salt: string): T {
  let h = seedHash(key + ':' + salt);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return palette[((h ^ (h >>> 16)) >>> 0) % palette.length];
}

export function dominantRace(person: Pick<Person, 'ancestry'>): Race {
  let best = 0;
  for (let i = 1; i < RACES.length; i++)
    if ((person.ancestry[i] ?? 0) > (person.ancestry[best] ?? 0)) best = i;
  return RACES[best];
}

export function professionOutfit(person: Person): Outfit {
  if (person.profession === 'soldier') return person.unitClass === 'mages' ? 'healer' : 'warrior';
  if (person.profession === 'merchant') return 'trader';
  return 'traveler';
}

export const createWardrobe = (base: Outfit): Wardrobe => ({
  equipped: base,
  outfitIds: base === 'traveler' ? ['traveler'] : ['traveler', base],
});

export function wardrobeFor(w: Pick<World, 'player'>, person: Person): Wardrobe {
  const player = w.player;
  const training =
    player?.person === person.id && player.biography?.name === player.name
      ? player.biography.training
      : undefined;
  return (
    person.wardrobe ??
    createWardrobe(
      training === 'healer' || training === 'trader' || training === 'warrior'
        ? training
        : professionOutfit(person),
    )
  );
}

/** Cosmetic projection only: uses neither the simulation RNG nor browser randomness. */
export function appearanceFor(
  w: Pick<World, 'seed' | 'player'>,
  person: Person,
): PortraitAppearance {
  const race = dominantRace(person);
  const key = `${w.seed}:portrait:${person.id}:${person.sex}:${person.ancestry.join(',')}`;
  const savedVariant = person.appearance?.variant;
  const hair = raceHair[race],
    eyes = raceEyes[race];
  return {
    race,
    sex: person.sex,
    variant:
      savedVariant && PORTRAIT_VARIANTS.includes(savedVariant)
        ? savedVariant
        : aspect(PORTRAIT_VARIANTS, key, 'ready-portrait'),
    hair: person.appearance?.hair ?? hair[seedHash(key + ':hair') % hair.length],
    eyes: person.appearance?.eyes ?? eyes[seedHash(key + ':eyes') % eyes.length],
    face: person.appearance?.face ?? aspect(FACE_SHAPES, key, 'face-shape'),
    hairStyle: person.appearance?.hairStyle ?? aspect(HAIR_STYLES, key, 'hair-style'),
    skin: person.appearance?.skin ?? aspect(raceSkin[race], key, 'skin-tone'),
    outfit: wardrobeFor(w, person).equipped,
  };
}
