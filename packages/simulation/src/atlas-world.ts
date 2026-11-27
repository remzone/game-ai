import type { Settlement, World } from './model.js';
import { random, seedHash } from './rng.js';

export const LANDMARK_KINDS = [
  'wizard_tower',
  'academy',
  'fortress',
  'monastery',
  'mine',
  'harbor',
  'barrow',
  'grove',
  'observatory',
  'trade_post',
] as const;
export const LANDMARK_STATUSES = ['standing', 'ruined', 'sealed', 'abandoned'] as const;
export const SCENARIO_ROLES = ['claimant', 'guardian', 'opportunist', 'independent'] as const;
export type LandmarkKind = (typeof LANDMARK_KINDS)[number];
export type LandmarkStatus = (typeof LANDMARK_STATUSES)[number];
export type ScenarioRole = (typeof SCENARIO_ROLES)[number];
type Biome = Settlement['biome'];

export interface Landmark {
  id: number;
  settlement: number;
  kind: LandmarkKind;
  status: LandmarkStatus;
  damageCause?: 'siege' | 'abandonment';
  builtDay?: number;
  name: string;
  lore: string;
  /** Founding/focal affiliation, not current control. Read this settlement's current state for the latter. */
  state: number;
}
export interface AtlasEvent {
  id: number;
  year: number;
  title: string;
  detail: string;
  site?: number;
  states: number[];
}
export interface AtlasWorld {
  scenario: {
    id: string;
    title: string;
    trigger: string;
    premise: string;
    fallenPower: string;
    focalSite: number;
    campaign?: { a: number; b: number; target: number };
    roles: { state: number; role: ScenarioRole; motive: string }[];
  };
  sites: Landmark[];
  history: AtlasEvent[];
}
interface LandmarkRule {
  label: string;
  biomes: readonly Biome[];
  statuses: readonly LandmarkStatus[];
  requiresPort?: boolean;
}
export const LANDMARK_CATALOG: Record<LandmarkKind, LandmarkRule> = {
  wizard_tower: {
    label: 'Башня мага',
    biomes: ['forest', 'mountain', 'plains'],
    statuses: ['standing', 'ruined', 'sealed', 'abandoned'],
  },
  academy: {
    label: 'Академия',
    biomes: ['forest', 'mountain', 'plains'],
    statuses: ['standing', 'ruined', 'sealed'],
  },
  fortress: {
    label: 'Крепость',
    biomes: ['mountain', 'plains', 'forest'],
    statuses: ['standing', 'ruined', 'abandoned'],
  },
  monastery: {
    label: 'Монастырь',
    biomes: ['forest', 'mountain', 'plains', 'marsh'],
    statuses: ['standing', 'ruined', 'sealed', 'abandoned'],
  },
  mine: { label: 'Шахта', biomes: ['mountain'], statuses: ['standing', 'sealed', 'abandoned'] },
  harbor: {
    label: 'Гавань',
    biomes: ['plains', 'forest', 'mountain', 'marsh'],
    statuses: ['standing', 'ruined', 'abandoned'],
    requiresPort: true,
  },
  barrow: {
    label: 'Курган',
    biomes: ['forest', 'plains', 'marsh'],
    statuses: ['standing', 'sealed', 'ruined'],
  },
  grove: {
    label: 'Священная роща',
    biomes: ['forest'],
    statuses: ['standing', 'ruined', 'sealed'],
  },
  observatory: {
    label: 'Обсерватория',
    biomes: ['mountain', 'plains'],
    statuses: ['standing', 'ruined', 'abandoned'],
  },
  trade_post: {
    label: 'Торговый двор',
    biomes: ['plains', 'forest', 'marsh'],
    statuses: ['standing', 'abandoned'],
  },
};

interface ScenarioSeed {
  id: string;
  title: string;
  trigger: string;
  premise: string;
  fallenPower: string;
  focal: { kind: LandmarkKind; status: LandmarkStatus; name: string; lore: string };
  oldEvent: [string, string];
  lossEvent: [string, string];
  laterEvent: [string, string];
  presentEvent: [string, string];
  motives: Record<ScenarioRole, string>;
}
const scenarios: readonly ScenarioSeed[] = [
  {
    id: 'academy-cinders',
    title: 'Война за пепельную печать',
    trigger:
      'Некроманты сожгли единственную аккредитованную магическую академию и уничтожили книгу коронационных клятв.',
    premise:
      'Академия обучала магов всех областей империи и заверяла клятвы живых наследников. На пепле учителя нашли половину печати и ни одного признанного завещания. Ныне два двора добиваются права открыть архив, а свободные области готовы признать только собственные суды.',
    fallenPower: 'Коронная империя Астэр',
    focal: {
      kind: 'academy',
      status: 'ruined',
      name: 'Академия Единой Печати',
      lore: 'Долгие годы только здесь новые маги приносили публичную клятву. Под развалинами архива осталось место, куда прежде складывали копии коронационных договоров.',
    },
    oldEvent: [
      'Клятва Единой Печати',
      'Первые областные судьи передали академии книги клятв. Это было единое учреждение; позднейшие частные башни не обладали его полномочиями.',
    ],
    lossEvent: [
      'Ночь пепельных часов',
      'Заговор некромантов уничтожил академию в одну ночь. Уцелевшие судьи смогли восстановить только перечень сожжённых книг.',
    ],
    laterEvent: [
      'Два наследства',
      'Два двора предъявили разные копии договоров. Свободные области отложили признание до очной сверки печатей.',
    ],
    presentEvent: [
      'Архив под золой',
      'После последнего паводка показалась запертая лестница. Послы добиваются допуска; общего решения о том, кто вправе открыть архив, ещё нет.',
    ],
    motives: {
      claimant: 'Ищет заверенную клятву, которая укрепит притязание на старую корону.',
      guardian: 'Охраняет руины и требует, чтобы архив открывался при свидетелях.',
      opportunist: 'Хочет подлинные свидетельства раньше, чем объявится их законный владелец.',
      independent: 'Признаёт собственные суды и не принимает над собой старую корону.',
    },
  },
  {
    id: 'sealed-bells',
    title: 'Последняя зимняя месса',
    trigger:
      'После смертей в зимних домах монастырь запечатали изнутри, а центральный двор лишился единственной признанной службы поминовения.',
    premise:
      'Союз провинций держался на общей клятве: умирающего правителя мог отпеть только настоятель Серых Колоколов. Когда звон прекратился, провинции стали короновать наследников по своим обычаям. Теперь у ворот находят свежие записи в давно опечатанной книге.',
    fallenPower: 'Венчальная лига Эдруна',
    focal: {
      kind: 'monastery',
      status: 'sealed',
      name: 'Монастырь Серых Колоколов',
      lore: 'Западный вход запечатан воском зимних свидетелей. На подсвечниках снаружи неделю за неделей прибавляются новые зарубки, хотя ключи исчезли вместе с настоятелем.',
    },
    oldEvent: [
      'Право одного звона',
      'Города согласились считать коронацию законной лишь после монастырского поминовения прежнего правителя.',
    ],
    lossEvent: [
      'Служба без конца',
      'Серые Колокола звонили всю ночь, а монастырская община запечатала двери изнутри. Центральная власть осталась без признанного преемства.',
    ],
    laterEvent: [
      'Отдельные обеты',
      'Провинции стали короновать правителей по местному обряду. Не все общины приняли новый порядок.',
    ],
    presentEvent: [
      'Книга за дверью',
      'На крыльце найдена свежая страница с именами покойных. Служители спорят, считать ли её доказательством подлинной службы.',
    ],
    motives: {
      claimant: 'Ищет свидетельство настоятеля, чтобы другие общины признали местный обряд.',
      guardian:
        'Удерживает старые печати в целости и не даёт объявить происходящее чудом без проверки.',
      opportunist: 'Предлагает обменять копии книги на привилегии для своих общин.',
      independent: 'Считает местные обеты достаточными и держится в стороне от спора о преемстве.',
    },
  },
  {
    id: 'broken-chain',
    title: 'Падение Бронзовой Цепи',
    trigger:
      'Крепость, хранившая меру пошлин и залоги областей, потеряла гарнизон после обвала моста и была оставлена.',
    premise:
      'В старой державе никто не взимал второй сбор с прошедшего бронзовые ворота обоза. Когда рухнул мост, хранилище залогов закрыли, а дороги разошлись по заставам. Две державы требуют вернуть единую меру, но каждая хочет держать ключ у себя.',
    fallenPower: 'Бронзовая держава Ройна',
    focal: {
      kind: 'fortress',
      status: 'abandoned',
      name: 'Крепость Бронзовых Ворот',
      lore: 'Сохранились палаты сборщиков и весы, на которых некогда проверяли гири всего двора. Гарнизон оставил крепость после обвала моста; новой присяги не было.',
    },
    oldEvent: [
      'Единая мера',
      'Области заложили на хранение первые гири и согласились признавать одну дорожную печать.',
    ],
    lossEvent: [
      'Обвал ключевого моста',
      'Река снесла опору, а гарнизон и хранители мер оставили крепость в конце зимы.',
    ],
    laterEvent: [
      'Книга разных пошлин',
      'Заставы вновь ввели свои сборы. Позднейшие копии единого тарифа стали противоречить друг другу.',
    ],
    presentEvent: [
      'Гири Безымянного двора',
      'В уцелевшей палате видели бронзовый ларец. Открытие потребует согласия тех, кто до сих пор называет залог своим.',
    ],
    motives: {
      claimant: 'Хочет держать эталон торговых гирь и тем самым устанавливать общий тариф.',
      guardian: 'Не признаёт права собственности без сверки настоящих держателей залога.',
      opportunist: 'Пытается превратить спор о мерах в выгодное торговое посредничество.',
      independent: 'Предпочитает сохранять собственные меры и двусторонние соглашения.',
    },
  },
  {
    id: 'drowned-charter',
    title: 'Гавань без Государя',
    trigger:
      'Шторм разрушил старую имперскую гавань и унёс хартию, по которой побережье выбирало единого покровителя.',
    premise:
      'Прибрежные города знают свои родословные по книгам отправленных судов. Но хартию, определявшую право на последний голос, хранили только в маячной палате. После затопления два двора считают себя наследниками, а часть портовых общин признаёт лишь местных старейшин.',
    fallenPower: 'Морское содружество Вейры',
    focal: {
      kind: 'harbor',
      status: 'ruined',
      name: 'Затонувшие Причалы',
      lore: 'Старый причал лежит ниже линии прилива. В тихую погоду видны ступени к основанию маяка, где прежде хранилась книга избраний.',
    },
    oldEvent: [
      'Пять сигнальных огней',
      'Города поручили одной маячной палате сохранять списки избраний морского покровителя.',
    ],
    lossEvent: [
      'Двойной прилив',
      'Шторм обрушил маячную площадку вместе с единственным экземпляром хартии.',
    ],
    laterEvent: [
      'Береговые старейшины',
      'Общины стали вносить решения в разные книги. При старом порядке эти списки считались только копиями.',
    ],
    presentEvent: [
      'Фонарь на мелководье',
      'После отлива рыбаки заметили фонарь у старых свай. Власти расходятся во взглядах на то, следует ли проверять руины.',
    ],
    motives: {
      claimant: 'Хочет доказать, что последний выбор покровителя принадлежал его предшественнику.',
      guardian: 'Берёт остатки гавани под охрану и защищает права поселений на её документы.',
      opportunist: 'Уговаривает свидетелей уступить право вывоза найденных книг.',
      independent: 'Признаёт власть местных общин, а не общеберегового покровителя.',
    },
  },
  {
    id: 'star-breach',
    title: 'Сломанный звёздный счёт',
    trigger:
      'В высокогорной обсерватории рухнул привод водяного календаря; архив был покинут после трёх противоречащих друг другу предсказаний.',
    premise:
      'Союз удерживали не общие гербы, а общие сроки клятв, долгов и выборов. После разрыва звёздного счёта каждая провинция назначила свою годовщину. Теперь в двух столицах спорят о том, чей срок старше, а горцы не признают ни один чужой календарь.',
    fallenPower: 'Союз общей меры Нейра',
    focal: {
      kind: 'observatory',
      status: 'abandoned',
      name: 'Обсерватория Трёх Небес',
      lore: 'Медное колесо остановилось на середине летнего круга. В наблюдательном журнале на последней странице три несовместимые записи, сделанные одной рукой.',
    },
    oldEvent: [
      'Договор о последней звезде',
      'Соседние области признали таблицы обсерватории обязательными для расчёта начала срока правления.',
    ],
    lossEvent: [
      'Разрыв счёта',
      'При падении водяного привода архив пришлось оставить; три записи об одном затмении называют разные дни.',
    ],
    laterEvent: [
      'Несогласованные годы',
      'Дворы назначили годовщины без сверки. Печати одного двора иногда истекают ещё до начала срока по другому календарю.',
    ],
    presentEvent: [
      'Возврат звёздных листов',
      'Ремесленники нашли непогнутый лист измерений и ищут трёх свидетелей с разных сторон спорных границ.',
    ],
    motives: {
      claimant: 'Ищет расчёт, подтверждающий старшинство собственной присяги.',
      guardian: 'Хранит листы и требует независимой сверки времени.',
      opportunist: 'Рассчитывает получить отсрочку долгов, привязанных к спорной дате.',
      independent: 'Ведёт собственный календарь и сохраняет прежние местные сроки.',
    },
  },
];

const details: Record<LandmarkKind, { names: [string, string, string, string]; lore: string }> = {
  wizard_tower: {
    names: [
      'Башня Медной Иглы',
      'Башня Перелётных Звёзд',
      'Башня Сумеречного Стекла',
      'Башня Ольхового Сна',
    ],
    lore: 'Каменные ступени ведут в круглый наблюдательный зал, устроенный для работы одного хранителя.',
  },
  academy: {
    names: ['Школа Семи Кругов', 'Двор Тихих Зеркал', 'Академия Второго Света', 'Свод Учителей'],
    lore: 'Здесь новым ученикам читали основания стихий; местные жители обслуживали архив и судили о школе по её долгам.',
  },
  fortress: {
    names: [
      'Крепость Каменного Следа',
      'Форт Последнего Брода',
      'Красный Бастион',
      'Крепость Клинка',
    ],
    lore: 'Над тальвегом расположен дозорный ход; по его огням путники прежде узнавали, открыт ли путь.',
  },
  monastery: {
    names: [
      'Монастырь Пяти Ветров',
      'Обитель Незакрытых Врат',
      'Сад Белого Воска',
      'Скит Туманного Круга',
    ],
    lore: 'На выщербленных ступенях вырезаны стихи, посвящённые людям, укрывавшимся здесь зимой.',
  },
  mine: {
    names: [
      'Медные Штольни',
      'Шахта Оловянной Звезды',
      'Каменоломня Тёмной Соли',
      'Серебряный Клин',
    ],
    lore: 'Три штрека следуют по одной жиле; у ворот лежат старые гири и дощечка учёта смен.',
  },
  harbor: {
    names: [
      'Гавань Двух Фонарей',
      'Тростниковая Пристань',
      'Причал Белых Канатов',
      'Причалы Закатного Ветра',
    ],
    lore: 'Лоцманы мерили глубину по зарубкам на сваях; соседние посёлки узнавали о прибывших лодках по колоколу.',
  },
  barrow: {
    names: [
      'Курган Синих Колец',
      'Холм Восьми Свидетелей',
      'Курган Тихого Хлеба',
      'Камни Старого Перехода',
    ],
    lore: 'Под внешним венцом камней отмечали и могилы, и имена тех, чьи тела не вернулись домой.',
  },
  grove: {
    names: ['Роща Первой Речи', 'Святилище Ольх', 'Роща Зимней Нити', 'Священный Лес Грачей'],
    lore: 'Старые межевые камни прячутся под корнями; люди соседних общин приносили сюда клятвы без чужого суда.',
  },
  observatory: {
    names: [
      'Уступ Зимней Луны',
      'Обсерватория Стеклянного Неба',
      'Звёздная Палата Берега',
      'Площадка Четырёх Теней',
    ],
    lore: 'Метки в полу связывали движение теней с началом торгового года.',
  },
  trade_post: {
    names: [
      'Двор Серебряных Мер',
      'Верхний Караванный Двор',
      'Двор Разбитых Весов',
      'Межевой Рынок',
    ],
    lore: 'Торговые книги перечисляют грузы не только по владельцам, но и по дорогам, которыми их доставили.',
  },
};
const condition: Record<LandmarkStatus, string> = {
  standing: 'Её приметы внесены в путевые книги соседних дорог.',
  ruined: 'Сохранились только обломки стен, следы прежних помещений и несколько уцелевших арок.',
  sealed: 'Вход закрыт старой печатью; на карте отмечено только его положение.',
  abandoned: 'Здание стоит, но прежние хранители ушли, и постоянной службы здесь нет.',
};

export function landmarkFits(
  w: World,
  settlement: number,
  kind: LandmarkKind,
  status: LandmarkStatus,
) {
  const s = w.settlements[settlement],
    cell = w.geography?.cells[settlement],
    rule = LANDMARK_CATALOG[kind];
  return (
    !!s &&
    !!cell &&
    cell.settlement === settlement &&
    !!rule &&
    rule.biomes.includes(s.biome) &&
    rule.statuses.includes(status) &&
    (!rule.requiresPort || cell.port)
  );
}

const choose = <T>(rng: { rng: number }, list: readonly T[]): T =>
  list[Math.floor(random(rng) * list.length)];

export function createAtlasWorld(w: World, variation = 0): AtlasWorld | undefined {
  if (!w.geography || !w.states.length) return undefined;
  const branch = Number.isSafeInteger(variation) && variation >= 0 ? variation : 0;
  const rng = { rng: seedHash(`${w.seed}:atlas-world:${branch}`) };
  // The title seed opens on the Academy. Other seeds still distribute across every premise.
  const offset = scenarios.length - (seedHash('ashen-crown:origin') % scenarios.length);
  const seed =
    scenarios[
      ((seedHash(w.seed + ':origin') % scenarios.length) + offset + (branch % scenarios.length)) %
        scenarios.length
    ];
  const used = new Set<number>(),
    sites: Landmark[] = [];
  const center = w.geography.cells[0]?.center ?? [550, 310];
  const cellDistance = (a: number, b: number) => {
    const ac = w.geography!.cells[a]?.center,
      bc = w.geography!.cells[b]?.center;
    return ac && bc ? Math.hypot(ac[0] - bc[0], ac[1] - bc[1]) : Infinity;
  };
  const stakes = (state: number) => sites.filter((s) => s.state === state).length;
  function add(
    kind: LandmarkKind,
    status: LandmarkStatus,
    name?: string,
    lore?: string,
    focal = false,
  ) {
    const candidates = w.settlements.filter(
      (s) => !used.has(s.id) && landmarkFits(w, s.id, kind, status),
    );
    if (!candidates.length) return undefined;
    const ranked = candidates
      .map((s) => ({
        s,
        rank:
          random(rng) +
          (focal
            ? Number(s.central) * 0.7 +
              (1 -
                Math.min(
                  1,
                  Math.hypot(
                    w.geography!.cells[s.id].center[0] - center[0],
                    w.geography!.cells[s.id].center[1] - center[1],
                  ) / 700,
                )) *
                0.3
            : 0.35 / (1 + stakes(s.state)) +
              Math.min(...sites.map((site) => cellDistance(s.id, site.settlement)), 100) / 270 +
              Number(kind === 'trade_post' && s.central) * 0.35),
      }))
      .sort((a, b) => b.rank - a.rank || a.s.id - b.s.id);
    const s = ranked[0].s,
      card = details[kind];
    const display =
      name ??
      choose(
        rng,
        card.names.filter((candidate) => !sites.some((site) => site.name === candidate)),
      );
    const site = {
      id: sites.length + 1,
      settlement: s.id,
      kind,
      status,
      name: display,
      lore: lore ?? `${card.lore} ${condition[status]}`,
      state: s.state,
    };
    sites.push(site);
    used.add(s.id);
    return site;
  }
  const focal = add(seed.focal.kind, seed.focal.status, seed.focal.name, seed.focal.lore, true);
  if (!focal) return undefined;
  add('wizard_tower', 'standing');
  add('wizard_tower', 'ruined');
  add('fortress', 'standing');
  add('monastery', 'standing');
  add('mine', choose(rng, ['standing', 'sealed', 'abandoned'] as const));
  add('harbor', 'standing');
  add('barrow', 'sealed');
  add('grove', 'standing');
  add('trade_post', 'standing');
  add('observatory', choose(rng, ['standing', 'ruined'] as const));
  // A second academy is deliberately never added to the single academy timeline.
  const extraKinds: LandmarkKind[] = [
    'wizard_tower',
    'fortress',
    'monastery',
    'mine',
    'harbor',
    'barrow',
    'grove',
    'trade_post',
    'observatory',
  ];
  for (let i = 0; i < 8; i++) {
    const kind = choose(rng, extraKinds);
    if (sites.filter((s) => s.kind === kind).length >= 3) continue;
    add(kind, choose(rng, LANDMARK_CATALOG[kind].statuses));
  }
  const rivals = w.states
    .filter((s) => s.id !== focal.state)
    .map((s) => ({
      s,
      score:
        cellDistance(s.capital, focal.settlement) +
        (w.treaties.some(
          (t) =>
            t.type === 'trade' &&
            ((t.a === s.id && t.b === focal.state) || (t.a === focal.state && t.b === s.id)),
        )
          ? 145
          : 0) -
        Math.min(s.treasury / 200, 45),
    }))
    .sort((a, b) => a.score - b.score || a.s.id - b.s.id);
  // A war is not applied here. For the academy branch only, nominate a real frontier
  // objective for the server's separate authorized launch/normal campaign rules.
  const campaign =
    seed.id === 'academy-cinders'
      ? w.roads
          .filter((road) => !road.blocked)
          .flatMap((road) => {
            const left = w.settlements[road.a],
              right = w.settlements[road.b];
            if (
              !left ||
              !right ||
              left.state === right.state ||
              left.state === focal.state ||
              right.state === focal.state
            )
              return [];
            const [near, far] =
              cellDistance(left.id, focal.settlement) <= cellDistance(right.id, focal.settlement)
                ? [left, right]
                : [right, left];
            const treaty = w.treaties.some(
              (t) =>
                t.until > w.day &&
                ((t.a === near.state && t.b === far.state) ||
                  (t.a === far.state && t.b === near.state)),
            );
            return [
              {
                a: near.state,
                b: far.state,
                target: far.id,
                score:
                  cellDistance(near.id, focal.settlement) +
                  cellDistance(far.id, focal.settlement) +
                  Number(treaty) * 400,
              },
            ];
          })
          .sort((a, b) => a.score - b.score || a.target - b.target)
          .map(({ a, b, target }) => ({ a, b, target }))[0]
      : undefined;
  const contest = campaign ? [campaign.a, campaign.b] : rivals.slice(0, 2).map(({ s }) => s.id);
  const opportunists = rivals
    .filter(({ s }) => !contest.includes(s.id))
    .slice(0, 2)
    .map(({ s }) => s.id);
  const roles = w.states.map(({ id: state }) => {
    const role: ScenarioRole =
      state === focal.state
        ? 'guardian'
        : contest.includes(state)
          ? 'claimant'
          : opportunists.includes(state)
            ? 'opportunist'
            : 'independent';
    return { state, role, motive: seed.motives[role] };
  });
  const loss = 35 + Math.floor(random(rng) * 75);
  const event = (
    id: number,
    year: number,
    copy: [string, string],
    states: number[],
    site?: number,
  ): AtlasEvent => ({
    id,
    year,
    title: copy[0],
    detail: copy[1],
    states: [...new Set(states)],
    ...(site === undefined ? {} : { site }),
  });
  return {
    scenario: {
      id: seed.id,
      title: seed.title,
      trigger: seed.trigger,
      premise: seed.premise,
      fallenPower: seed.fallenPower,
      focalSite: focal.id,
      roles,
      ...(campaign ? { campaign } : {}),
    },
    sites,
    history: [
      event(1, -loss - 80, seed.oldEvent, [focal.state], focal.id),
      event(2, -loss, seed.lossEvent, [focal.state], focal.id),
      event(3, -Math.floor(loss / 2), seed.laterEvent, [focal.state, ...contest]),
      event(4, -1, seed.presentEvent, [focal.state, ...contest, ...opportunists], focal.id),
    ],
  };
}
