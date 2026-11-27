import { LANDMARK_CATALOG, type LandmarkStatus } from './atlas-world.js';
import type { Settlement, Siege, World } from './model.js';
import { event } from './world.js';

export type DamageCause = 'siege' | 'abandonment';

function damageLandmarks(w: World, s: Settlement, cause: DamageCause) {
  for (const site of w.atlasWorld?.sites ?? []) {
    if (site.settlement !== s.id || site.status !== 'standing') continue;
    const valid = LANDMARK_CATALOG[site.kind].statuses;
    const preferred: LandmarkStatus = cause === 'siege' ? 'ruined' : 'abandoned';
    const substitute: LandmarkStatus = cause === 'siege' ? 'abandoned' : 'ruined';
    const status = valid.includes(preferred)
      ? preferred
      : valid.includes(substitute)
        ? substitute
        : null;
    if (!status) continue;
    site.status = status;
    site.damageCause = cause;
    event(
      w,
      'landmark_damage',
      `${site.name}: ${cause === 'siege' ? 'пострадал при осаде' : 'лишился постоянных хранителей'}.`,
      [`site:${site.id}`, `settlement:${s.id}`],
      true,
    );
  }
}

function damageSettlement(w: World, s: Settlement, cause: DamageCause, walls: boolean) {
  const prior = s.structuralDamage ?? 0;
  if (s.infrastructure === 0 && (!walls || s.fortification === 0) && prior >= 3) return;
  s.infrastructure = Math.max(0, s.infrastructure - 1);
  if (walls) s.fortification = Math.max(0, s.fortification - 1);
  s.structuralDamage = Math.min(3, prior + 1);
  event(
    w,
    'settlement_damage',
    `${s.name}: ${cause === 'siege' ? 'осада повредила постройки' : 'пустующие постройки ветшают'}.`,
    [`settlement:${s.id}`],
    true,
  );
  if (cause === 'abandonment' || s.structuralDamage >= 2) damageLandmarks(w, s, cause);
}

/** A blockade, surrender or a change of banner does not imply structural destruction. */
export function recordSiegeDamage(w: World, siege: Siege, walls: boolean) {
  if (siege.status !== 'active' || siege.damageDay === w.day) return;
  const settlement = w.settlements[siege.settlement];
  if (!settlement) return;
  siege.damageDay = w.day;
  damageSettlement(w, settlement, 'siege', walls);
}

export function settleAbandonment(w: World, settlement: Settlement) {
  if (settlement.population > 0) return;
  if (settlement.kind !== 'ruins' || settlement.infrastructure > 0 || settlement.fortification > 0)
    damageSettlement(w, settlement, 'abandonment', true);
}

export const canImproveSettlement = (settlement: Settlement) =>
  (settlement.structuralDamage ?? 0) > 0 || settlement.infrastructure < 10;

/** Call only after the normal construction path pays its resources and, if applicable, wages. */
export function completeSettlementWork(w: World, s: Settlement) {
  const prior = s.structuralDamage ?? 0;
  s.infrastructure = Math.min(10, s.infrastructure + 1);
  if (!prior) return false;
  s.structuralDamage = prior - 1;
  event(
    w,
    'settlement_reconstruction',
    `${s.name}: восстановлена часть пострадавших построек.`,
    [`settlement:${s.id}`],
    true,
  );
  if (s.structuralDamage === 0 && s.population > 0) {
    for (const site of w.atlasWorld?.sites ?? []) {
      if (site.settlement !== s.id || !site.damageCause) continue;
      site.status = 'standing';
      delete site.damageCause;
      event(
        w,
        'landmark_reconstruction',
        `${site.name}: восстановлен после возврата рабочих.`,
        [`site:${site.id}`, `settlement:${s.id}`],
        true,
      );
    }
  }
  return true;
}

/** A paid fortification can establish one new landmark; the wall improvement already paid for it. */
export function recordFortification(w: World, s: Settlement) {
  const atlas = w.atlasWorld;
  if (
    !atlas ||
    s.population < 1 ||
    s.kind === 'ruins' ||
    !LANDMARK_CATALOG.fortress.biomes.includes(s.biome) ||
    w.sieges.some((siege) => siege.status === 'active' && siege.settlement === s.id) ||
    atlas.sites.some(
      (site) =>
        site.kind === 'fortress' &&
        site.settlement === s.id &&
        (site.builtDay !== undefined || site.status === 'standing'),
    )
  )
    return;
  const id = Math.max(0, ...atlas.sites.map((site) => site.id)) + 1;
  atlas.sites.push({
    id,
    kind: 'fortress',
    status: 'standing',
    state: s.state,
    settlement: s.id,
    name: `Сторожевая башня · ${s.name}`,
    lore: 'Местные мастера подняли башню, чтобы держать под наблюдением дороги к поселению.',
    builtDay: w.day,
  });
  event(
    w,
    'landmark_built',
    `${s.name}: возведена сторожевая башня.`,
    [`site:${id}`, `settlement:${s.id}`],
    true,
  );
}
