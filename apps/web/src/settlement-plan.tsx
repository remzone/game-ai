import { useId, useState } from 'react';
import type { DistrictKind, DistrictPlan, TownPlan } from '@living-world/simulation';
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
};
const palette = {
  plains: ['#76734a', '#53523b', '#2b3428', '#725948', '#b28b62', '#54423c'],
  forest: ['#566449', '#394c3b', '#202c24', '#59453d', '#99785b', '#433633'],
  marsh: ['#526a59', '#394f48', '#242e30', '#66594b', '#a58b69', '#443f42'],
  mountain: ['#6a6e64', '#48514c', '#2e3537', '#555554', '#a1a090', '#474d54'],
} as const;

function Building({
  type,
  damaged,
  roof,
  wall,
  stone,
}: {
  type: string;
  damaged: boolean;
  roof: string;
  wall: string;
  stone: string;
}) {
  if (type === 'trees')
    return (
      <g>
        {[-24, -8, 11, 25].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i % 2 ? -10 : 0})`}>
            <path d="M0 0v-28" stroke="#1c241d" strokeWidth="3" />
            <path
              d="M0-54 12-31H7l9 16H4l9 9H-13l9-9h-12l9-16h-5Z"
              fill={i % 2 ? '#34483b' : '#49624b'}
              stroke="#223029"
              strokeWidth="2"
            />
            <path d="M0-49-7-32h6l-7 16h7" fill="none" stroke="#91a076" strokeOpacity=".46" />
          </g>
        ))}
      </g>
    );
  if (type === 'field')
    return (
      <g transform="translate(-6 -8)">
        <path d="m-65 19 29-57 99-4-23 56Z" fill="#8c7451" stroke="#342b20" strokeWidth="2" />
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M${-61 + 12 * i} 17q12-30 28-54`}
            fill="none"
            stroke={i % 2 ? '#c1a370' : '#554d2f'}
            strokeWidth="4"
          />
        ))}
        <path
          d="M-50 9v20m24-27v20m24-26v20m24-24v20M-53 18l79-12"
          fill="none"
          stroke="#c7ac77"
          strokeWidth="2"
        />
      </g>
    );
  if (type === 'market')
    return (
      <g>
        <path
          d="M-25 0v-24m50 23v-25m-30 21v-21M-24-8h47l-8 6h-35Z"
          stroke="#3e2b24"
          strokeWidth="3"
          fill={wall}
        />
        <path d="m-33-21 14-24h38l14 24-9 5h-48Z" fill={roof} stroke="#302623" strokeWidth="2" />
        <path
          d="m-16-44-8 26h8l5-26Zm14 0-2 26H5l-1-26Zm13 0 5 26h8l-8-26Z"
          fill="#d4b381"
          opacity=".8"
        />
        <path d="M-17-8h9m5 0h7m6 0h6" stroke="#ecd28d" strokeWidth="3" />
      </g>
    );
  if (type === 'dock')
    return (
      <g>
        <path d="m-25-3 64-28 23 10L-3 11Z" fill="#a7865e" stroke="#483529" strokeWidth="2" />
        <path
          d="M-24-3v9m21 5v11m64-43v9m-22-19v9M-13-7 7 6M0-13 20 0m-6-19L34-6m-5-19L49-12"
          fill="none"
          stroke="#5c4432"
          strokeWidth="2"
        />
        <path d="M22 22Q47-3 78-2l-10 13-25 13Z" fill="#4c3528" stroke="#26201d" strokeWidth="2" />
        <path d="M53 13v-44q-15 19-22 40Z" fill="#c8bc92" stroke="#605140" strokeWidth="1.4" />
      </g>
    );
  if (type === 'mine')
    return (
      <g>
        <path
          d="m-48 2 17-35 18-13L4-78 31-51 49-13l-8 16Z"
          fill={stone}
          stroke="#31332e"
          strokeWidth="3"
        />
        <path
          d="M4-75 14-43l-18 19-4-23-15 12M43-17 25-31"
          fill="none"
          stroke="#aeab92"
          strokeOpacity=".5"
          strokeWidth="3"
        />
        <path d="M-22 4v-13Q-22-29 0-29T22-9V4Z" fill="#211e1b" stroke="#b59165" strokeWidth="5" />
        <path d="m-18 4-11 16m44-16 12 16M-22 10h42m-47 8h53" stroke="#745941" strokeWidth="2" />
      </g>
    );
  if (type === 'ruin' || damaged)
    return (
      <g>
        <path
          d="M-27 6v-34l8 5 5-11 9 11 5-7 8 12 12-6 8 14V6L12 13Z"
          fill={stone}
          stroke="#2c2926"
          strokeWidth="2.5"
        />
        <path
          d="m0-30-6 17 7 4-5 15m21-12 3-7m-38-8v8"
          stroke="#a79271"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-37 4l-11 12 24 4 9-11m37 0 11-6 12 9-8 7Z"
          fill="#615a4e"
          stroke="#483e33"
          strokeWidth="1.6"
        />
      </g>
    );
  if (type === 'gate')
    return (
      <g>
        {[-26, 26].map((x) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <path
              d="m-13 0 13 8 15-8v-34l-15-7-13 8Z"
              fill={stone}
              stroke="#382e27"
              strokeWidth="2"
            />
            <path
              d="M-14-33v-12h6v5h6v-5h6v5h6v-5h6v12L1-26Z"
              fill={wall}
              stroke="#45392d"
              strokeWidth="2"
            />
            <path d="M1-20v9" stroke="#f2c681" strokeWidth="2" />
          </g>
        ))}
        <path d="M-13 5v-17q13-19 26 0V5L0 14Z" fill="#342b25" stroke={wall} strokeWidth="3" />
      </g>
    );
  if (type === 'court') {
    return (
      <g>
        <ellipse cx="0" cy="1" rx="66" ry="19" fill="#281d1d" opacity=".46" />
        <path d="M-42 0v-38l38-18 50 19V0L7 20Z" fill={wall} stroke="#382a26" strokeWidth="3" />
        <path d="m7 20 39-20v-37L7-19Z" fill={stone} stroke="#4c3c30" strokeWidth="2" />
        <path d="M-50-37-23-63l42-13 34 37L7-20Z" fill={roof} stroke="#39292a" strokeWidth="3" />
        <path
          d="m-19-62 26 42m-14-47 29 42m-18-46 28 40m-63 4v17m14-9v17m42-14v13"
          fill="none"
          stroke="#e2c98f"
          strokeOpacity=".48"
          strokeWidth="2.7"
        />
        {[-49, 39].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i ? -10 : 6})`}>
            <path
              d="M-14-1v-50L0-58l17 8V0L0 9Z"
              fill={i ? stone : wall}
              stroke="#3d3027"
              strokeWidth="2"
            />
            <path d="m-19-48 19-31 21 33L0-38Z" fill={roof} stroke="#403027" strokeWidth="2" />
            <path d="M-5-30v9m13 3v10" stroke="#fdc97e" strokeWidth="2.5" />
            <path d="M0-78v-18l17 4-17 7" fill="#9e5c46" stroke="#493324" strokeWidth="1.6" />
          </g>
        ))}
        <path d="M-10 13V-5q11-13 22-1v20L1 20Z" fill="#30221d" stroke="#ceaa76" strokeWidth="2" />
      </g>
    );
  }
  const tower = type === 'tower';
  if (tower)
    return (
      <g>
        <path d="M-19 0v-50L0-60l21 10V0L2 10Z" fill={stone} stroke="#2c2521" strokeWidth="2.5" />
        <path d="M2 10v-60l19-5V0Z" fill={wall} opacity=".8" />
        <path d="M-23-47 0-85l24 34L1-38Z" fill={roof} stroke="#342922" strokeWidth="2.5" />
        <path d="M0-85v-19l18 3-18 7" fill="#b78952" stroke="#5b422a" strokeWidth="2" />
        <path d="M-8-33v9m18 4v8M2-5v13" stroke="#f7cb86" strokeWidth="3" />
      </g>
    );
  const forge = type === 'forge';
  return (
    <g>
      <path d="M-32 0v-27L1-43l34 16V0L3 16Z" fill={wall} stroke="#392e26" strokeWidth="2" />
      <path d="M3 16v-28l32-15V0Z" fill={stone} stroke="#3e342b" strokeWidth="1" />
      <path d="m-37-24 18-28 32-14 27 37L4-11Z" fill={roof} stroke="#332721" strokeWidth="2.25" />
      <path
        d="m-19-52 23 41 36-18m-55-17 22 32m-14-38 22 33m-13-38 23 31"
        fill="none"
        stroke="#e2bd8a"
        strokeOpacity=".44"
        strokeWidth="1.4"
      />
      <path d="M-19-7v-10m10 15v-10m30 17v-10" stroke="#2e211a" strokeWidth="6" />
      <path
        d="M-19-9v-6m10 11v-6m30 13v-6"
        stroke={forge ? '#ff945b' : '#e9ba73'}
        strokeWidth="3"
      />
      <path d="M-28-23v22M3-10v25" stroke="#564334" strokeWidth="2.6" />
      {forge && (
        <g>
          <path d="M20-38v-29l9-4 6 4v27Z" fill={stone} stroke="#433830" strokeWidth="2" />
          <path
            d="M24-74q12-7 2-17t7-20"
            fill="none"
            stroke="#b6a698"
            strokeOpacity=".48"
            strokeWidth="5"
          />
        </g>
      )}
    </g>
  );
}

function stamp(kind: DistrictKind, idx: number, d: DistrictPlan) {
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
  if (kind === 'court') return 'court';
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
  const k = useId(),
    [ground, shade, dark, roof, wall, stone] = palette[plan.biome];
  const isWet = plan.water !== 'none';
  const rand = (i: number) =>
    ((Math.imul((plan.seed + i * 7919) ^ (i * 523), 1597334677) >>> 0) % 1000) / 1000;
  const shore = plan.mirror ? 'translate(1000 0) scale(-1 1)' : undefined;
  const center = plan.districts.find((x) => x.kind === 'square')!.at;
  const districts = [...plan.districts].sort((a, b) => a.at[1] - b.at[1]);
  const city = plan.size === 'city' || plan.size === 'capital';
  const fortified = plan.fortification > 0;
  return (
    <svg
      viewBox="0 0 1000 565"
      className="town-drawing"
      role="group"
      aria-label={`План поселения ${plan.title}`}
    >
      <defs>
        <linearGradient id={k + '-sky'} x2="0" y2="100%">
          <stop stopColor="#251c23" />
          <stop offset=".63" stopColor="#88725a" />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
        <radialGradient id={k + '-land'} cx=".48" cy=".47" r=".7">
          <stop stopColor={ground} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <linearGradient id={k + '-water'} x2="0" y2="100%">
          <stop stopColor="#686e67" />
          <stop offset="1" stopColor="#263944" />
        </linearGradient>
        <radialGradient id={k + '-vignette'}>
          <stop offset=".42" stopColor="#1b1519" stopOpacity="0" />
          <stop offset="1" stopColor="#1b1519" stopOpacity=".63" />
        </radialGradient>
        <filter id={k + '-grain'}>
          <feTurbulence baseFrequency=".45" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="1000" height="565" fill={`url(#${k}-sky)`} />
      <circle cx={145 + 170 * rand(5)} cy="110" r="42" fill="#dfbf8c" opacity=".46" />
      {Array.from({ length: 4 }, (_, i) => (
        <path
          key={i}
          fill={i % 2 ? dark : shade}
          opacity={0.42 + i * 0.15}
          d={
            `M0 ${165 + 15 * i} ` +
            Array.from(
              { length: 19 },
              (_, j) =>
                `L${j * 58} ${(plan.biome === 'mountain' ? 105 : 143) + 24 * i + rand(i * 50 + j) * (plan.biome === 'mountain' ? 84 : 30)}`,
            ).join(' ') +
            'V340H0Z'
          }
        />
      ))}
      <path d="M0 268Q265 175 519 221T1000 224V565H0Z" fill={`url(#${k}-land)`} />
      {isWet && (
        <g transform={shore}>
          <path
            d={
              plan.water === 'sea'
                ? 'M834 217Q803 319 849 396T790 565H1000V205Z'
                : 'M901 212Q822 253 837 318T773 403Q755 455 903 565H1000Q913 519 873 478T893 375Q952 295 945 213Z'
            }
            fill={`url(#${k}-water)`}
            stroke="#b0a184"
            strokeOpacity=".6"
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
      <g opacity=".42" pointerEvents="none">
        {Array.from({ length: 154 }, (_, i) => {
          const x = rand(i * 3) * 990,
            y = 223 + rand(i * 3 + 1) * 326;
          const protectedY = plan.water === 'none' || (plan.mirror ? x > 230 : x < 770);
          if (!protectedY || districts.some((d) => Math.hypot(x - d.at[0], y - d.at[1]) < 43))
            return null;
          return (
            <path
              key={i}
              d={`M${x - 4} ${y}l4-3 3 3m-6-1 1-6 4 6`}
              fill="none"
              stroke={i % 2 ? '#b1a173' : '#2c392b'}
              strokeWidth={1 + (i % 3) * 0.3}
            />
          );
        })}
      </g>
      {plan.biome === 'forest' &&
        [107, 179, 897, 951].map((x, i) => (
          <g key={x} transform={`translate(${x} ${240 + (i % 2) * 30}) scale(.77)`}>
            <Building type="trees" damaged={false} roof={roof} wall={wall} stone={stone} />
          </g>
        ))}
      {(city || fortified) && (
        <g transform={shore} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={
              plan.water === 'sea'
                ? 'M138 462 125 309 237 206 624 160 791 281'
                : 'M149 459 123 297 249 192 609 154 830 268 840 430 709 500 288 511 150 459'
            }
            stroke="#282828"
            strokeWidth={fortified ? 18 : 8}
          />
          <path
            d={
              plan.water === 'sea'
                ? 'M138 457 125 304 237 201 624 155 791 276'
                : 'M149 454 123 292 249 187 609 149 830 263 840 425 709 495 288 506 150 454'
            }
            stroke={stone}
            strokeWidth={fortified ? 13 : 6}
          />
          <path
            d={
              plan.water === 'sea'
                ? 'M138 455 125 302 237 199 624 153 791 274'
                : 'M149 452 123 290 249 185 609 147 830 261 840 423 709 493 288 504 150 452'
            }
            stroke="#c7b691"
            opacity=".54"
            strokeWidth="2"
            strokeDasharray={fortified ? '7 4' : undefined}
          />
        </g>
      )}
      {city && (
        <g transform={shore} fill="none" strokeLinecap="round">
          <path
            d="M260 399Q202 298 314 247T518 224Q620 221 697 298T716 400Q622 470 478 451T260 399"
            stroke="#4c3c30"
            strokeWidth="12"
          />
          <path
            d="M260 399Q202 298 314 247T518 224Q620 221 697 298T716 400Q622 470 478 451T260 399"
            stroke="#8d7b5d"
            strokeWidth="6"
          />
        </g>
      )}
      {plan.biome === 'mountain' &&
        [
          [125, 257],
          [827, 224],
          [908, 290],
          [167, 480],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} fill={stone} stroke={dark} strokeWidth="2">
            <path d="M-39 8-15-21 1-28 12-12 28 5 14 14Z" />
            <path d="m7 12 19-21 29 14 13 14-37 3Z" />
            <path
              d="m-15-21 6 17 17 1m18-6 13 14 18 1"
              fill="none"
              stroke="#a8a392"
              opacity=".32"
            />
          </g>
        ))}
      <g fill="none" strokeLinecap="round" pointerEvents="none">
        <path
          d={`M${500 + 35 * (rand(2) - 0.5)} 575Q${center[0] - 34} 495 ${center[0]} ${center[1]}`}
          stroke="#4a3a2c"
          strokeWidth="23"
        />
        <path
          d={`M${500 + 35 * (rand(2) - 0.5)} 575Q${center[0] - 34} 495 ${center[0]} ${center[1]}`}
          stroke="#ab9471"
          strokeWidth="15"
        />
        {districts
          .filter((d) => d.kind !== 'square')
          .map((d) => {
            const [x, y] = d.at;
            const p = `M${center[0]} ${center[1]}Q${(center[0] + x) / 2} ${y + (y < center[1] ? 32 : -15)} ${x} ${y}`;
            return (
              <g key={d.id}>
                <path d={p} stroke="#46372d" strokeWidth="14" />
                <path d={p} stroke="#9b8567" strokeWidth="9" />
              </g>
            );
          })}
      </g>
      <ellipse
        cx={center[0]}
        cy={center[1]}
        rx={city ? 51 : 34}
        ry={city ? 27 : 20}
        fill="#a58d69"
        stroke="#534431"
        strokeWidth="2"
      />
      <ellipse
        cx={center[0]}
        cy={center[1]}
        rx="17"
        ry="10"
        fill="#5d746c"
        stroke="#c9ad83"
        strokeWidth="3"
      />
      <path
        d={`M${center[0]} ${center[1]}v-9q-7-5-9 3m9-3q7-5 9 3`}
        fill="none"
        stroke="#deccb1"
        strokeWidth="1.7"
      />
      {plan.size === 'capital' && (
        <g transform={`translate(${center[0] - 38} ${center[1]})`}>
          <path d="M0 3v-46" stroke="#453629" strokeWidth="4" />
          <path d="M2-43h27l-5 7 5 7H2Z" fill={plan.banner} stroke="#d4ab71" strokeWidth="1.3" />
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
                const type = stamp(d.kind, i, d);
                const damaged =
                  !d.site &&
                  d.kind !== 'court' &&
                  (plan.size === 'ruins' ||
                    (!!plan.damage && type === 'house' && rand(8 * idx + i) < plan.damage * 0.22));
                const sz = (city ? 1 : 0.83) * (0.85 + rand(idx * 9 + i) * 0.22);
                return (
                  <g key={i} transform={`translate(${x + dx} ${y + dy}) scale(${sz})`}>
                    <ellipse cx="3" cy="4" rx="41" ry="15" fill="#261f1d" opacity=".34" />
                    <Building
                      type={type}
                      damaged={damaged}
                      roof={d.kind === 'market' ? '#985747' : roof}
                      wall={wall}
                      stone={stone}
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
            <ellipse cx="3" cy="4" rx="38" ry="14" fill="#251f1d" opacity=".22" />
            <Building
              type="house"
              damaged={plan.size === 'ruins'}
              roof={i % 3 ? roof : '#6a5142'}
              wall={wall}
              stone={stone}
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
                      <small>{p.role} · Поговорить</small>
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
