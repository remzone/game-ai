import type { World } from './model.js';
import type { Command } from './commands.js';
export interface Conversation {
  person: number;
  name: string;
  role: string;
  portrait: 'citizen' | 'soldier';
  lines: string[];
  choices: {
    label: string;
    detail: string;
    command?: Command;
    panel?: 'market' | 'army' | 'quests' | 'states';
  }[];
}
/** Every line is derived from this settlement; the dialogue never creates a world problem. */
export function conversation(w: World, id: number): Conversation {
  const person = w.people[id],
    npc = w.npcs[id],
    p = w.player!;
  const s = w.settlements[person.settlement];
  const jobs: Record<string, string> = {
    farmer: 'Земледелец',
    woodcutter: 'Лесоруб',
    miner: 'Горняк',
    smith: 'Кузнец',
    merchant: 'Торговец',
    soldier: 'Воин',
    child: 'Ребёнок',
  };
  const role = w.states.some((st) => st.ruler === id) ? 'Правитель' : jobs[person.profession];
  const lines = [`Меня зовут ${npc.name}. Я живу в ${s.name}.`];
  if (s.monsters > 0)
    lines.push(`В окрестностях ${s.monsters} волков. Караваны рискуют потерять груз.`);
  if (s.shortageDays > 0)
    lines.push(
      `Не хватает еды уже ${s.shortageDays} дней. Зерно стоит ${s.prices.grain.toFixed(1)} монеты.`,
    );
  if (!s.monsters && !s.shortageDays)
    lines.push('Сейчас в поселении спокойно. Можно торговать, работать и готовиться к дороге.');
  lines.push(
    `Лояльность совету: ${Math.floor(s.loyalty)}. Местный сбор: ${Math.round(s.governance.localTax * 100)}%.`,
  );
  if (s.governance.unrestDays > 0)
    lines.push(
      `Недоверие управляющему длится ${s.governance.unrestDays} дней. На четырнадцатый совет отзовёт мандат.`,
    );
  const choices: Conversation['choices'] = [
    {
      label: 'Как мне служить поселению?',
      detail: 'Совет, назначение управляющим, налоги и общественное хозяйство',
      panel: 'states',
    },
  ];
  for (const q of w.quests.filter(
    (q) => q.settlement === s.id && ['open', 'accepted'].includes(q.status),
  )) {
    const ready =
      q.type === 'hunt' ? q.objectiveMet || s.monsters === 0 : p.inventory.grain >= q.need;
    if (q.status === 'accepted' && !ready) {
      lines.push(
        q.type === 'hunt'
          ? 'Вы уже обещали помочь с волками. Мы ждём новостей.'
          : `По вашему контракту нужно привезти ${q.need} зерна.`,
      );
      continue;
    }
    choices.push({
      label:
        q.status === 'open'
          ? q.type === 'hunt'
            ? 'Я возьмусь за волков.'
            : `Я привезу ${q.need} зерна.`
          : 'Я выполнил контракт. Вот результат.',
      detail: `Награда: ${q.reward} монет`,
      command: { type: q.status === 'open' ? 'accept_quest' : 'complete_quest', quest: q.id },
    });
  }
  choices.push({
    label: 'Покажи товары и цены.',
    detail: 'Открыть рынок этого поселения',
    panel: 'market',
  });
  choices.push({
    label: 'Мне нужны спутники.',
    detail: 'Набор, обучение и снабжение отряда',
    panel: 'army',
  });
  choices.push({
    label: 'Есть работа на день?',
    detail: 'Работа в поле · 10 монет, проходит один день',
    command: { type: 'work', job: 'farm' },
  });
  if (person.profession === 'smith')
    choices.push({
      label: 'Помогу в кузнице.',
      detail: '16 монет · 2 железа и 2 дерева со склада · один день',
      command: { type: 'work', job: 'smith' },
    });
  return {
    person: id,
    name: npc.name,
    role,
    portrait: person.profession === 'soldier' ? 'soldier' : 'citizen',
    lines,
    choices,
  };
}
