import type { World, Settlement } from './model.js';
import { event } from './world.js';

export const officeTitle = (s: Pick<Settlement, 'name'>) => `Управляющий ${s.name}`;

/** A delegated office belongs to a person, not to the player slot or their heirs. */
export function revokeOffice(w: World, s: Settlement, reason: string) {
  const id = s.governance.steward;
  if (id === null) return;
  const title = officeTitle(s);
  const npc = w.npcs[id];
  if (npc) npc.titles = npc.titles.filter((t) => t !== title);
  s.governance = { steward: null, localTax: 0, unrestDays: 0, eligibleDay: w.day + 30 };
  if (w.player?.person === id) {
    w.player.legitimacy = Math.max(0, w.player.legitimacy - 10);
    if (w.player.title === title) {
      const other = w.settlements.find((t) => t.governance.steward === id);
      w.player.title = other ? officeTitle(other) : 'Бывший управляющий';
    }
  }
  event(
    w,
    'office_revoked',
    `${s.name}: мандат управляющего прекращён — ${reason}.`,
    [`settlement:${s.id}`, `person:${id}`],
    true,
  );
}

export function localGovernance(w: World) {
  for (const s of w.settlements) {
    if (s.governance.steward === null) continue;
    if (!w.people[s.governance.steward]?.alive) {
      revokeOffice(w, s, 'смерть должностного лица');
      continue;
    }
    s.governance.unrestDays = s.loyalty <= 25 ? s.governance.unrestDays + 1 : 0;
    if (s.governance.unrestDays >= 14)
      revokeOffice(w, s, 'совет отозвал доверие после 14 дней лояльности не выше 25');
  }
}
