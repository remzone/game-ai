import type { Person, Profession, World } from './model.js';
import { promote } from './world.js';
import { seedHash } from './rng.js';

export interface WorldLore {
  source: 'seed' | 'openrouter';
  continent: string;
  premise: string;
  history: { year: number; title: string; detail: string }[];
  states: { id: number; title: string; summary: string; conflict: string }[];
  faiths: { id: number; title: string; summary: string; rite: string }[];
  people: {
    id: number;
    name: string;
    biography: string;
    role?: 'ruler' | 'resident';
    profession?: Profession;
  }[];
}

const realms = [
  [
    'Пепельная Марка',
    'Знатные дома держат общую корону, но сами собирают дружины.',
    'Старые роды спорят, кому вести оборону зимних дорог.',
  ],
  [
    'Высокая Корона',
    'Приказы двора переписывают на меди и развозят конными курьерами.',
    'Города просят право обжаловать сборы, которые двор считает своей прерогативой.',
  ],
  [
    'Союз Семи Печатей',
    'Новая корона требует клятв от людей, которые уже присягали друг другу.',
    'Ни один претендент не решается назвать будущего наследника.',
  ],
  [
    'Речная Республика',
    'Городские собрания решают общие дела в дни, когда сходятся речные рынки.',
    'Окраины хотят голосовать отдельно от главных городов.',
  ],
  [
    'Янтарная Лига',
    'Торговые дома ведут долговые книги на двух языках и признают оба текста законом.',
    'Цена охраны дорог раскалывает торговые дома.',
  ],
  [
    'Владения Последнего Света',
    'Публичные обеты держат вместе храмовые и мирские общины.',
    'Служители спорят, можно ли освобождать целые селения от сборов за исполненный обет.',
  ],
  [
    'Вольные Круги',
    'Решения принимают собравшиеся роды, но исполнить их может только местная община.',
    'Молодые семьи требуют собственного голоса, не зависимого от старейшин.',
  ],
  [
    'Железный Предел',
    'О редких годах мира напоминают пустые караульные башни вдоль дорог.',
    'Военные наместники не хотят возвращать полномочия гражданским властям.',
  ],
  [
    'Земли Девяти Домов',
    'Дома записывают союзы и тяжбы в общие родословные книги.',
    'У нескольких домов столько долгов, что им предлагают платить землёй.',
  ],
  [
    'Синклит Синей Башни',
    'Совет учителей доверяет только тому знанию, которое можно передать ученику.',
    'Поселения спорят, сколько зерна отдавать на содержание школ.',
  ],
] as const;
const faiths = [
  [
    'Хранители Угля',
    'Непрерывность семей и обещаний важнее непогрешимости правителей.',
    'В новый очаг кладут уголь из дома старшего родственника.',
  ],
  [
    'Обет Открытой Дороги',
    'Гостеприимство считается долгом даже перед незнакомцем и соперником.',
    'Перед дальней дорогой путник оставляет у ворот воду для следующего.',
  ],
  [
    'Память Камня',
    'Прежние поколения нельзя воскресить, но их поступки можно помнить без прикрас.',
    'На камнях у переправ пишут по одному делу умершего, а не его титул.',
  ],
] as const;

const residents = [
  [
    'farmer',
    'Меловая',
    'Меловой',
    'Старинная мера зерна до сих пор хранится в семье. Соседи просят сверяться с нею перед разделом урожая.',
  ],
  [
    'merchant',
    'Путница',
    'Путник',
    'В торговой суме хранится карта безопасных дворов, составленная по рассказам обозников. На ней нет ни одной государственной границы.',
  ],
  [
    'smith',
    'Горнильная',
    'Горнильный',
    'В мастерской лежит надломленная печать старого двора. Хозяева считают её доказательством права работать без подмастерской пошлины.',
  ],
  [
    'miner',
    'Пластовая',
    'Пластовый',
    'Ходит по заброшенным выработкам с мелом и отвесом. Одну шахту держит закрытой, хотя соседи настаивают на разведке нового пласта.',
  ],
] as const;

function residentCast(w: World, rulers: number[]): WorldLore['people'] {
  const used = new Set<number>();
  const excluded = new Set([
    ...rulers,
    w.player?.person,
    ...(w.player ? (w.people[w.player.person]?.parents ?? []) : []),
  ]);
  return residents.flatMap(([job, female, male, biography], i) => {
    const preferred = [
      i === 0 ? 0 : (i * 2 + (seedHash(w.seed) % 3)) % 10,
      ...w.states.map((s) => s.id),
    ];
    let person: Person | undefined;
    for (const stateId of preferred) {
      if (used.has(stateId)) continue;
      for (const s of w.settlements) {
        if (s.state !== stateId) continue;
        person = s.residents
          .map((id) => w.people[id])
          .find((p) => p?.alive && !p.undead && p.profession === job && !excluded.has(p.id));
        if (person) break;
      }
      if (person) break;
    }
    if (!person) return [];
    used.add(person.state);
    const women = ['Мира', 'Альва', 'Рада', 'Саэла'];
    const men = ['Эрин', 'Торен', 'Рен', 'Грим'];
    const femalePerson = person.sex === 'female';
    return [
      {
        id: person.id,
        name:
          w.npcs[person.id]?.name ??
          `${(femalePerson ? women : men)[i]} ${femalePerson ? female : male}`,
        biography,
        role: 'resident' as const,
        profession: job,
      },
    ];
  });
}

export function seededLore(w: World, newNames = false): WorldLore {
  const variant = seedHash(w.seed) % 4;
  const rulers = [...new Set(w.states.map((s) => s.ruler))];
  return {
    source: 'seed',
    continent: ['Эрдайн', 'Ордена', 'Астерн', 'Веллар'][variant],
    premise:
      'С падением старой столицы исчезли общие меры, единый суд и право прохода по великим дорогам. ' +
      'Нынешние державы унаследовали обрывки её закона; жители помнят, кто открыл амбары в первую голодную зиму.',
    history: [
      {
        year: -94 - variant,
        title: 'Год последней печати',
        detail:
          'Старый двор перестал посылать судей за пределы столицы. Города начали хранить собственные своды решений.',
      },
      {
        year: -82 - variant,
        title: 'Падение столицы',
        detail:
          'Пожар уничтожил двор и главную палату мер. О причинах катастрофы до сих пор спорят, а подлинник последнего указа не найден.',
      },
      {
        year: -40 - variant,
        title: 'Хлебный договор',
        detail:
          'Пограничные общины договорились пускать обозы через заставы зимой, но срок договора истёк вместе с последним из его свидетелей.',
      },
      {
        year: -2 - variant,
        title: 'Разные календари',
        detail:
          'Послы не договорились о единой дате сбора податей. Торговцы снова стали сверять цены и сроки на каждой заставе.',
      },
    ],
    states: w.states.map((s) => {
      const realm = realms[s.id];
      return {
        id: s.id,
        title: newNames && realm ? realm[0] : s.name,
        summary: realm?.[1] ?? 'Летописцы ещё сводят показания о происхождении этой державы.',
        conflict: realm?.[2] ?? 'На местах спорят о том, кому теперь выплачивать сборы.',
      };
    }),
    faiths: w.religions.map((f) => {
      const entry = faiths[f.id];
      return {
        id: f.id,
        title: newNames && entry ? entry[0] : f.name,
        summary: entry?.[1] ?? f.doctrine,
        rite: entry?.[2] ?? 'Обычаи различаются от общины к общине.',
      };
    }),
    people: [
      ...rulers
        .filter((id) => w.people[id] && w.npcs[id])
        .map((id) => {
          const npc = w.npcs[id];
          const settlement = w.settlements[w.people[id].settlement]?.name ?? 'родное поселение';
          return {
            id,
            role: 'ruler' as const,
            profession: w.people[id].profession,
            name: npc.name,
            biography:
              'Будущего правителя знали в окрестностях ' +
              settlement +
              ' задолго до новой должности. ' +
              [
                'В старых письмах сохранился спор о складе, который пришлось открыть на зиму.',
                'Двор много лет обсуждает этот путь к власти, но расходится в именах первых союзников.',
                'У местных торговцев осталось несколько подписанных этим именем договоров о безопасном проезде.',
                'В семейном архиве хранят список дорог, восстановленных после первого неурожая.',
              ][(id + variant) % 4],
          };
        }),
      ...(newNames ? residentCast(w, rulers) : []),
    ],
  };
}

export function applyWorldLore(w: World, lore: WorldLore) {
  w.worldLore = lore;
  for (const book of lore.states) {
    const state = w.states.find(({ id }) => id === book.id);
    if (state) state.name = book.title;
  }
  for (const book of lore.faiths) {
    const faith = w.religions.find(({ id }) => id === book.id);
    if (faith) faith.name = book.title;
  }
  // Materialize existing NPC identities with a local RNG so lore has no effect on simulation rolls.
  const npcSeed = { ...w, rng: seedHash(w.seed + ':lore-cast') };
  for (const entry of lore.people) {
    if (!w.people[entry.id] || w.player?.person === entry.id) continue;
    const npc = w.npcs[entry.id] ?? promote(npcSeed, entry.id);
    npc.name = entry.name;
    npc.biography = entry.biography;
  }
}
