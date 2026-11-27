import { useId, useState } from 'react';
import {
  emblems,
  governments,
  type DistrictKind,
  type DistrictPlan,
  type Race,
  type TownPlan,
} from '@living-world/simulation';
import { Portrait } from './portrait';
import './settlement-plan.css';

const form = {
  capital: 'Столица',
  city: 'Город',
  village: 'Деревня',
  ruins: 'Руины',
} as const;
const land = {
  capital: 'Двор и слободы',
  coast: 'Морской берег',
  mountain: 'Горные склоны',
  forest: 'Лесной край',
  marsh: 'Болотные земли',
  plains: 'Открытая равнина',
} as const;
const siteStatus = {
  standing: 'Действует',
  ruined: 'Разрушено',
  sealed: 'Запечатано',
  abandoned: 'Покинуто',
};
const runes: Record<DistrictKind, string> = {
  square: '✥',
  houses: '⌂',
  court: '♜',
  watch: '⚑',
  market: '⚖',
  forge: '✦',
  mine: '⛏',
  fields: '≋',
  wood: '♠',
  wharf: '⚓',
  site: '◇',
  shrine: '✧',
};
const propBoxes = {
  court: [167, 150, 0.85],
  house: [111, 103, 0.83],
  market: [102, 91, 0.81],
  forge: [125, 117, 0.83],
  gate: [138, 122, 0.8],
  mine: [149, 128, 0.79],
  dock: [149, 111, 0.62],
  field: [143, 120, 0.65],
  ruin: [111, 119, 0.83],
  trees: [146, 123, 0.83],
  fountain: [83, 75, 0.63],
  tower: [110, 137, 0.87],
  guild: [158, 127, 0.8],
  fort: [169, 132, 0.82],
  spire: [145, 155, 0.84],
  hearth: [105, 99, 0.78],
  memorial: [107, 92, 0.69],
  observatory: [106, 121, 0.78],
} as const;
type PropKind = keyof typeof propBoxes;
const artRoot = '/art/settlements';
const dwellings: Record<
  Race,
  { key: string; name: string; box: readonly [number, number, number] }
> = {
  Human: { key: 'human', name: 'Человеческое зодчество', box: [106, 104, 0.8] },
  Elf: { key: 'elf', name: 'Эльфийское зодчество', box: [107, 119, 0.82] },
  'Dark Elf': { key: 'dark-elf', name: 'Зодчество тёмных эльфов', box: [106, 119, 0.82] },
  Orc: { key: 'orc', name: 'Орочье зодчество', box: [122, 97, 0.8] },
  Dwarf: { key: 'dwarf', name: 'Дворфийское зодчество', box: [122, 93, 0.76] },
  Goblin: { key: 'goblin', name: 'Гоблинское зодчество', box: [102, 94, 0.79] },
};
const originNames: Record<Race, string> = {
  Human: 'Люди',
  Elf: 'Эльфы',
  'Dark Elf': 'Тёмные эльфы',
  Orc: 'Орки',
  Dwarf: 'Дворфы',
  Goblin: 'Гоблины',
};
function Building({
  type,
  damaged = false,
  flip = false,
  home,
  richer = false,
}: {
  type: PropKind;
  damaged?: boolean;
  flip?: boolean;
  home?: Race;
  richer?: boolean;
}) {
  const model = damaged ? 'ruin' : type;
  const style = model === 'house' && home ? dwellings[home] : undefined;
  const [width, height, footing] = style?.box ?? propBoxes[model];
  return (
    <image
      className="town-painted-prop"
      data-prop={model}
      data-home={style && home}
      data-variant={style ? (richer ? 1 : 0) : undefined}
      aria-hidden="true"
      href={`${artRoot}/${style ? `cultures/home-${style.key}-${richer ? 1 : 0}` : model === 'guild' || model === 'fort' || model === 'spire' || model === 'hearth' || model === 'memorial' || model === 'observatory' ? `cultures/${model}` : model}.webp`}
      x={-width / 2}
      y={-height * footing}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      transform={flip ? 'scale(-1 1)' : undefined}
    />
  );
}

function stamp(kind: DistrictKind, idx: number, d: DistrictPlan, plan: TownPlan): PropKind {
  if (d.site)
    return d.site.status === 'ruined' || d.site.status === 'abandoned'
      ? 'ruin'
      : d.site.kind === 'mine'
        ? 'mine'
        : d.site.kind === 'harbor'
          ? 'dock'
          : d.site.kind === 'grove'
            ? 'trees'
            : d.site.kind === 'fortress'
              ? 'gate'
              : 'tower';
  if (kind === 'watch') return 'gate';
  if (kind === 'court') return plan.culture.civic;
  if (kind === 'shrine') return d.faith?.style ?? 'hearth';
  if (kind === 'forge') return idx ? 'house' : 'forge';
  if (kind === 'market') return 'market';
  if (kind === 'fields') return idx ? 'house' : 'field';
  if (kind === 'wood') return idx ? 'house' : 'trees';
  if (kind === 'mine') return 'mine';
  if (kind === 'wharf') return idx ? 'house' : 'dock';
  return 'house';
}

function SettlementDrawing({
  plan,
  active,
  pick,
  onTalk,
}: {
  plan: TownPlan;
  active: string;
  pick: (id: string) => void;
  onTalk: (id: number) => void;
}) {
  const k = useId();
  const terrain = plan.biome === 'forest' ? 'woodland' : 'moor';
  const station = plan.biome === 'mountain' ? '#5b5c55' : '#635d4d';
  const isWet = plan.water !== 'none';
  const rand = (i: number) =>
    ((Math.imul((plan.seed + i * 7919) ^ (i * 523), 1597334677) >>> 0) % 1000) / 1000;
  const shore = plan.mirror ? 'translate(1000 0) scale(-1 1)' : undefined;
  const center = plan.districts.find((x) => x.kind === 'square')!.at;
  const districts = [...plan.districts].sort((a, b) => a.at[1] - b.at[1]);
  const city = plan.size === 'city' || plan.size === 'capital';
  const { civic, emblem, homes } = plan.culture;
  const bearing = emblem ? emblems[emblem] : undefined;
  const homeAt = (i: number) => homes[i % homes.length];
  const bannerShape =
    civic === 'guild'
      ? 'M2-43h30l-3 18-11-5-16 5Z'
      : civic === 'fort'
        ? 'M2-43h31l-12 9 12 9H2Z'
        : civic === 'spire'
          ? 'M2-43h24v13L14-20 2-30Z'
          : 'M2-43h27l-5 7 5 7H2Z';
  const fortified = plan.fortification > 0;
  const gate = districts.find((d) => d.kind === 'watch')?.at ?? [500, 452];
  const gateX = plan.mirror ? 1000 - gate[0] : gate[0];
  const gateY = gate[1] - 4;
  const wallLine =
    plan.water === 'sea'
      ? `M 143 458 Q 117 375 124 310 Q 202 228 295 196 Q 437 161 615 161 Q 720 193 785 272 M 143 458 Q 295 500 ${gateX - 25} ${gateY}`
      : `M ${gateX - 26} ${gateY} Q 258 498 167 447 Q 124 387 132 301 Q 174 216 276 193 Q 413 156 611 161 Q 734 195 809 268 Q 851 349 812 431 Q 669 480 ${gateX + 25} ${gateY}`;
  const outerRoad = `M${gate[0] + 50 * (rand(2) - 0.5)} 575 Q${gate[0] + 20} 505 ${gate[0]} ${gate[1]} T${center[0]} ${center[1]}`;
  const streets = districts
    .filter((d) => d.kind !== 'square' && d.kind !== 'watch')
    .map((d, i) => {
      const [x, y] = d.at;
      const variant = rand(i + 38) - 0.5;
      const trunk = d.kind === 'fields' || d.kind === 'forge' || d.kind === 'wharf';
      const from = trunk ? [center[0] + 35 * (x < center[0] ? -1 : 1), center[1] + 48] : center;
      const dx = x - from[0],
        dy = y - from[1];
      return {
        id: d.id,
        lane: `M${from[0]} ${from[1]}C${from[0] + dx * 0.2 + variant * 43} ${from[1] + dy * 0.53} ${x - dx * 0.42} ${y - dy * 0.23 + variant * 37} ${x} ${y}`,
        width: city ? 11 + rand(i + 4) * 4 : 7 + rand(i + 4) * 3,
      };
    });
  return (
    <svg
      viewBox="0 0 1000 565"
      className="town-drawing"
      data-civic={civic}
      role="group"
      aria-label={`План поселения ${plan.title}`}
    >
      <defs>
        <filter id={k + '-weathered'} x="-10%" y="-15%" width="120%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".23"
            numOctaves="3"
            seed={plan.seed % 71}
            result="stone"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="stone"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="G"
            result="surface"
          />
          <feColorMatrix in="stone" type="saturate" values="0" result="gray" />
          <feComponentTransfer in="gray" result="faded">
            <feFuncA type="linear" slope=".52" />
          </feComponentTransfer>
          <feComposite in="faded" in2="surface" operator="in" result="material" />
          <feBlend in="surface" in2="material" mode="overlay" />
        </filter>
        <linearGradient id={k + '-water'} x2="0" y2="100%">
          <stop stopColor="#686e67" />
          <stop offset="1" stopColor="#263944" />
        </linearGradient>
        <linearGradient id={k + '-dusk'} x2="0" y2="100%">
          <stop stopColor={plan.biome === 'forest' ? '#071d1b' : '#171022'} stopOpacity=".36" />
          <stop offset=".60" stopColor="#080b11" stopOpacity=".04" />
          <stop offset="1" stopColor="#0a0b10" stopOpacity=".24" />
        </linearGradient>
        <radialGradient id={k + '-vignette'}>
          <stop offset=".42" stopColor="#1b1519" stopOpacity="0" />
          <stop offset="1" stopColor="#1b1519" stopOpacity=".68" />
        </radialGradient>
        <filter id={k + '-grain'}>
          <feTurbulence baseFrequency=".45" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="1000" height="565" fill="#292b24" />
      <image
        className="town-painted-land"
        href={`${artRoot}/land-${terrain}.webp`}
        width="1000"
        height="565"
        preserveAspectRatio="xMidYMid slice"
      />
      {isWet && (
        <g transform={shore}>
          <path
            d={
              plan.water === 'sea'
                ? 'M834 217Q803 319 849 396T790 565H1000V205Z'
                : 'M901 212Q822 253 837 318T773 403Q755 455 903 565H1000Q913 519 873 478T893 375Q952 295 945 213Z'
            }
            fill={`url(#${k}-water)`}
            filter={`url(#${k}-weathered)`}
            stroke="#989082"
            strokeOpacity=".31"
            strokeWidth="4"
          />
          {Array.from({ length: 14 }, (_, i) => (
            <path
              key={i}
              transform={`translate(${865 + 90 * rand(i)} ${250 + i * 21})`}
              d="M0 5q16-5 36 0t35-1"
              fill="none"
              stroke="#a1ada2"
              opacity=".36"
            />
          ))}
        </g>
      )}
      {plan.biome === 'forest' &&
        [123, 902].map((x, i) => (
          <g key={x} transform={`translate(${x} ${255 + i * 36}) scale(.85)`}>
            <Building type="trees" flip={i === 1} />
          </g>
        ))}
      {fortified && (
        <g filter={`url(#${k}-weathered)`} transform={shore} fill="none" strokeLinejoin="round">
          <path
            d={wallLine}
            transform="translate(4 8)"
            stroke="#211d1a"
            strokeOpacity=".58"
            strokeWidth="28"
          />
          <path d={wallLine} transform="translate(0 4)" stroke="#33312d" strokeWidth="23" />
          <path d={wallLine} stroke={station} strokeWidth="13" />
          <path
            d={wallLine}
            transform="translate(0 -3)"
            stroke="#978c73"
            opacity=".7"
            strokeWidth="3.5"
            strokeDasharray="5 4 9 4 3 4"
          />
        </g>
      )}
      {city && (
        <g transform={shore} fill="none" strokeLinecap="round" filter={`url(#${k}-weathered)`}>
          <path
            d="M256 397Q223 286 330 244T520 222Q624 226 695 295T713 398Q639 453 481 443T256 397"
            stroke="#6a5d4c"
            strokeWidth="9"
            opacity=".54"
          />
        </g>
      )}
      <g fill="none" strokeLinecap="round" pointerEvents="none" filter={`url(#${k}-weathered)`}>
        <path d={outerRoad} stroke="#4d4030" strokeWidth={city ? 22 : 17} opacity=".54" />
        <path d={outerRoad} stroke="#867258" strokeWidth={city ? 14 : 9} opacity=".60" />
        {streets.map(({ id, lane, width }) => (
          <g key={id}>
            <path d={lane} stroke="#483b2c" strokeWidth={width + 6} opacity=".42" />
            <path d={lane} stroke="#79664f" strokeWidth={width} opacity=".64" />
          </g>
        ))}
      </g>
      <g transform={`translate(${center[0]} ${center[1] - 4}) scale(${city ? 1 : 0.8})`}>
        <ellipse rx="51" ry="28" fill="#786854" opacity=".62" filter={`url(#${k}-weathered)`} />
        {city && <Building type="fountain" />}
      </g>
      {plan.size !== 'ruins' && (
        <g
          aria-hidden="true"
          className="town-ensign"
          transform={`translate(${center[0] - 38} ${center[1]}) scale(${plan.size === 'village' ? 0.76 : 1})`}
        >
          <path d="M0 3v-46" stroke="#453629" strokeWidth="4" />
          <path d={bannerShape} fill={plan.banner} stroke="#af906c" strokeWidth="1.2" />
          {bearing && (
            <text x="14" y="-31" textAnchor="middle" fill="#f0d2a1" fontSize="11">
              {bearing}
            </text>
          )}
        </g>
      )}
      {districts.map((d, idx) => {
        const [x, y] = d.at;
        const offs = [
          [-3, 0],
          [-62, -12],
          [57, -14],
          [-37, -39],
          [39, -40],
          [-95, -36],
          [98, -38],
        ];
        return (
          <g key={d.id} aria-hidden="true">
            {offs
              .slice(0, d.houses)
              .map(([dx, dy], i) => ({ dx, dy, i }))
              .sort((a, b) => a.dy - b.dy)
              .map(({ dx, dy, i }) => {
                const type = stamp(d.kind, i, d, plan);
                const damaged =
                  !d.site &&
                  d.kind !== 'court' &&
                  (plan.size === 'ruins' ||
                    (!!plan.damage && type === 'house' && rand(8 * idx + i) < plan.damage * 0.22));
                const sz =
                  (city ? 1 : 0.9) * (0.72 + (y + dy) * 0.00065 + rand(idx * 9 + i) * 0.14);
                return (
                  <g key={i} transform={`translate(${x + dx} ${y + dy}) scale(${sz})`}>
                    <Building
                      type={type}
                      damaged={damaged}
                      home={homeAt(d.kind === 'houses' ? i : idx + i + 5)}
                      richer={(i + idx + plan.seed) % 2 === 0}

                      flip={type === 'dock' ? plan.mirror : rand(idx * 5 + i) < 0.33}
                    />
                  </g>
                );
              })}
          </g>
        );
      })}
      {Array.from({ length: city ? 12 : 5 }, (_, i) => {
        const [rawX, y] = city
          ? [
              [272, 248],
              [394, 249],
              [386, 302],
              [600, 273],
              [648, 365],
              [316, 322],
              [386, 410],
              [591, 401],
              [450, 358],
              [633, 455],
              [320, 453],
              [749, 339],
            ][i]
          : [
              [129, 335],
              [222, 389],
              [816, 349],
              [708, 225],
              [569, 466],
            ][i];
        const x = plan.mirror ? 1000 - rawX : rawX;
        if (
          districts.some((d) => Math.hypot(x - d.at[0], y - d.at[1]) < 58) ||
          (isWet && rawX > 800)
        )
          return null;
        const scale = (city ? 0.48 : 0.4) + rand(i + 99) * 0.18;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
            <Building
              type="house"
              damaged={plan.size === 'ruins'}
              flip={i % 3 === 0}
              home={homeAt(i + 7)}
              richer={i % 2 === 0}
            />
          </g>
        );
      })}
      <rect
        width="1000"
        height="565"
        filter={`url(#${k}-grain)`}
        opacity=".075"
        style={{ mixBlendMode: 'multiply' }}
        pointerEvents="none"
      />
      <rect width="1000" height="565" fill={`url(#${k}-dusk)`} pointerEvents="none" />
      <rect width="1000" height="565" fill={`url(#${k}-vignette)`} pointerEvents="none" />
      {districts.map((d) => {
        const [x, y] = d.at,
          label = d.title.length > 20 ? d.title.slice(0, 19) + '…' : d.title;
        return (
          <g
            key={d.id}
            className={`town-map-pin${active === d.id ? ' is-open' : ''}`}
            data-district={d.id}
            role="button"
            tabIndex={0}
            aria-label={d.title}
            aria-pressed={active === d.id}
            transform={`translate(${x} ${y + 18})`}
            onClick={() => pick(d.id)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                pick(d.id);
              }
            }}
          >
            <title>{d.title}</title>
            <circle r="17" className="town-pin-hit" />
            <circle r="12" className="town-pin-face" />
            <text y="5" textAnchor="middle" className="town-pin-icon">
              {runes[d.kind]}
            </text>
            <text y="31" className="town-pin-label" textAnchor="middle">
              {label}
            </text>
          </g>
        );
      })}
      {plan.districts
        .filter((d) => d.id === active)
        .flatMap((d) =>
          d.people.map((p, i) => (
            <g
              key={p.id}
              className="town-resident-pin"
              role="button"
              tabIndex={0}
              aria-label={`Поговорить: ${p.name}`}
              transform={`translate(${d.at[0] + 37 + i * 29} ${d.at[1] + 13})`}
              onClick={() => onTalk(p.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onTalk(p.id);
                }
              }}
            >
              <title>{p.name}</title>
              <circle r="13" className="town-pin-face" />
              <circle cy="-4" r="3.5" fill="#e1bf89" />
              <path d="M-6 7V4q6-7 12 0v3Z" fill="#e1bf89" />
            </g>
          )),
        )}
    </svg>
  );
}

export function SettlementPlan({ plan, onTalk }: { plan: TownPlan; onTalk: (id: number) => void }) {
  const [selected, setSelected] = useState('square');
  const [view, setView] = useState<'district' | 'history'>('district');
  const district = plan.districts.find((d) => d.id === selected) ?? plan.districts[0];
  const pick = (id: string) => {
    setSelected(id);
    setView('district');
  };
  return (
    <section className="local-town" aria-label={`Поселение: ${plan.title}`}>
      <div className="local-town-plate">
        <SettlementDrawing plan={plan} active={district.id} pick={pick} onTalk={onTalk} />
        <div className="local-town-inscription" aria-hidden="true">
          <span>
            {form[plan.size]} · {land[plan.profile]}
          </span>
          <strong>{plan.title}</strong>
        </div>
      </div>
      <div className="local-town-register">
        <div className="local-town-facts">
          <span>
            {plan.region} · {plan.owner}
          </span>
          <span>
            Жителей: {plan.residents} · Дорог: {plan.roads}
          </span>
          <span className="town-culture-summary">
            {governments[plan.culture.government]?.name ?? plan.owner}
            {plan.culture.communities[0] &&
              ` · ${dwellings[plan.culture.communities[0].race].name.toLowerCase()}`}
          </span>
          {plan.occupations && <span className="town-alert">Оккупация</span>}
          {plan.damage > 0 && <span className="town-alert">Повреждения: {plan.damage}/3</span>}
        </div>
        <nav aria-label="Места в поселении" className="local-town-tabs">
          {plan.districts.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={view === 'district' && d.id === district.id}
              onClick={() => pick(d.id)}
            >
              <span aria-hidden="true">{runes[d.kind]}</span>
              {d.title}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={view === 'history'}
            onClick={() => setView('history')}
          >
            ✧ Местная летопись
          </button>
        </nav>
        {view === 'district' ? (
          <article className="local-town-detail">
            <h3>{district.title}</h3>
            {district.site && (
              <span className="town-status">{siteStatus[district.site.status]}</span>
            )}
            {district.detail && <p>{district.detail}</p>}
            {district.faith && (
              <span className="town-status">Последователей: {district.faith.followers}</span>
            )}
            {district.kind === 'houses' && plan.culture.communities.length > 0 && (
              <p>
                Жители:{' '}
                {plan.culture.communities
                  .slice(0, 3)
                  .map((c) => `${originNames[c.race]} ${Math.round(c.share * 100)}%`)
                  .join(' · ')}
              </p>
            )}
            {district.kind === 'court' && plan.culture.officialFaith && (
              <p>Государственная вера: {plan.culture.officialFaith}</p>
            )}
            {district.people.length > 0 && (
              <div className="local-town-people">
                {district.people.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onTalk(p.id)}
                    aria-label={`Поговорить с ${p.name}`}
                  >
                    <Portrait value={p.appearance} decorative />
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {p.role}
                        {p.faith ? ` · ${p.faith}` : ''}
                      </small>
                      {p.note && <small className="town-npc-note">{p.note}</small>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </article>
        ) : (
          <article className="local-town-detail">
            <h3>Местная летопись</h3>
            <ul>
              {plan.lore.map((entry, i) => (
                <li key={i}>
                  <strong>{entry.title}</strong>
                  <p>{entry.text}</p>
                </li>
              ))}
            </ul>
          </article>
        )}
      </div>
    </section>
  );
}
