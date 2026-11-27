import {
  PORTRAIT_VARIANTS,
  RACES,
  type Person,
  type PortraitAppearance,
  type PortraitVariant,
  type Race,
} from '@living-world/simulation';

const raceArt = ['human', 'elf', 'darkelf', 'orc', 'dwarf', 'goblin'] as const;
export type PortraitPreset = Pick<PortraitAppearance, 'race' | 'sex' | 'variant'>;
export const outfitNames: Record<PortraitAppearance['outfit'], string> = {
  traveler: 'Дорожная одежда',
  warrior: 'Доспех воина',
  trader: 'Плащ торговца',
  healer: 'Одеяние лекаря',
};

export function portraitKey(race: Race, sex: PortraitAppearance['sex'], variant: PortraitVariant) {
  const slug = raceArt[Math.max(0, RACES.indexOf(race))];
  return `${slug}-${sex}-${PORTRAIT_VARIANTS.includes(variant) ? variant : 1}`;
}

export function portraitForPerson(person: Person, appearance?: PortraitAppearance): PortraitPreset {
  return (
    appearance ?? {
      race: RACES[person.ancestry.indexOf(Math.max(...person.ancestry))] ?? 'Human',
      sex: person.sex,
      variant: 1,
    }
  );
}

/** One finished illustration per preset. Equipment state does not alter the portrait. */
export function Portrait({
  value,
  className = '',
  label,
  decorative = false,
  eager = false,
}: {
  value: PortraitPreset;
  className?: string;
  label?: string;
  decorative?: boolean;
  eager?: boolean;
}) {
  const key = portraitKey(value.race, value.sex, value.variant);
  return (
    <div
      className={`character-portrait ${className}`}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      data-portrait-base={key}
      data-portrait-variant={value.variant}
    >
      <img
        className="portrait-illustration"
        src={`/art/presets/${key}.webp`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        width="640"
        height="640"
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}
