/** Original, resolution-independent artwork. No external assets or network fonts. */
const svg = (
  body: string,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 128 128"><defs>
<linearGradient id="stone" x2=".8" y2="1"><stop stop-color="#a3a394"/><stop offset="1" stop-color="#4b5555"/></linearGradient>
<linearGradient id="roof" x2=".8" y2="1"><stop stop-color="#56666e"/><stop offset="1" stop-color="#242d36"/></linearGradient>
<linearGradient id="leaf" x2=".8" y2="1"><stop stop-color="#718470"/><stop offset=".5" stop-color="#3c5b4c"/><stop offset="1" stop-color="#203c34"/></linearGradient>
<radialGradient id="glow"><stop stop-color="#ffc879" stop-opacity=".6"/><stop offset="1" stop-color="#e9a45c" stop-opacity="0"/></radialGradient>
</defs>${body}</svg>`;
const shadow = '<ellipse cx="65" cy="115" rx="39" ry="10" fill="#04090b" opacity=".4"/>';
const windowLight = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="12" fill="url(#glow)"/><path d="M${x - 3} ${y + 4}v-7q3-5 6 0v7z" fill="#ecc185"/><path d="M${x} ${y - 5}v9m-3-4h6" stroke="#594c38" stroke-width="1"/>`;
const timber =
  '<path d="M36 76v30m19-23v31m21-38v32m-40-16 40 16M36 79l40 14" fill="none" stroke="#3b3730" stroke-width="3"/>';
function house(roof = '#704f47', market = false) {
  return svg(
    shadow +
      `<path d="M29 74 65 53 102 74 65 96z" fill="#273032"/><path d="M33 76 65 89v29l-32-14z" fill="#8a8674"/><path d="M65 89 98 73v30l-33 15z" fill="#646c65"/><path d="M27 75 62 38 103 58 69 94z" fill="${roof}" stroke="#242b2d" stroke-width="2"/><path d="M62 38 65 60 103 79 103 58z" fill="#463b3b"/><path d="m35 69 39 17m-31-25 39 18m-31-26 39 18" stroke="#c2a18a" opacity=".3" stroke-width="2"/><path d="M78 48v-23l10 3v25" fill="#717773"/><path d="m78 25 6-4 10 4-6 3z" fill="#a7a596"/>${timber}${windowLight(44, 91)}${windowLight(83, 91)}<path d="M58 112v-14q5-6 10 0v18" fill="#242b29"/>${market ? '<path d="M25 91 56 105 52 116 21 102z" fill="#c8ac70"/><path d="m29 93-4 10m12-7-4 10m13-6-4 10" stroke="#704e43" stroke-width="5"/><path d="M22 102v14m30-1v9" stroke="#7b6a4b" stroke-width="2"/>' : ''}`,
  );
}
const tower = (x: number, y: number, size = 1) =>
  `<g transform="translate(${x} ${y}) scale(${size})"><path d="M-12-39 0-45 14-39v40L0 8-12 2z" fill="url(#stone)" stroke="#313b3d"/><path d="M0-43v51L14 1v-40" fill="#435257"/><path d="M-16-40 0-77 18-40 0-31z" fill="url(#roof)" stroke="#253239"/><path d="M0-77v46l18-9z" fill="#2b3844"/><path d="M-8-26v9m7-13v9m8-12v9" stroke="#1d2d33" stroke-width="3"/>${windowLight(-6, -8)}</g>`;
function person(cloak: string, hero = false) {
  if (cloak === '#76614e')
    return svg(
      `<ellipse cx="64" cy="117" rx="20" ry="7" fill="#02080a" opacity=".4"/><path d="m55 95-2 20 10 2 4-22m5-1 2 21 9-1-2-22" fill="#343733"/><path d="M51 52 43 104 64 113 87 103 77 51z" fill="#7d6d51" stroke="#3e473b" stroke-width="2"/><path d="m58 58-5 44 12 6 6-56" fill="#9d8b62" opacity=".4"/><path d="M48 79 81 83" stroke="#3e4030" stroke-width="5"/><ellipse cx="66" cy="38" rx="11" ry="14" fill="#b99b77"/><path d="M52 41V29q13-17 28 2v11L69 33z" fill="#544d3d"/><path d="m51 61-12 23m39-25 13 22" stroke="#8f7957" stroke-width="8"/><path d="m29 83 24 6-4 22-23-7z" fill="#ad9365" stroke="#645740" stroke-width="2"/><path d="m33 86 4 21m4-19 4 20m-17-9 22 5" stroke="#736347" stroke-width="2"/>`,
    );

  return svg(
    `<ellipse cx="65" cy="117" rx="21" ry="7" fill="#02080a" opacity=".45"/><path d="m58 90-3 24 9 2 5-25m3-1 6 22 8-1-6-25" fill="#252d33" stroke="#121d22" stroke-width="2"/><path d="M51 53q-5 20-14 50l20 8 28-8-8-49z" fill="${cloak}" stroke="#17262a" stroke-width="2"/><path d="M61 54 49 102 58 106 73 63" fill="#cfbd8b" opacity=".12"/><path d="m55 48 23 0 6 34-33 2z" fill="#727e7b"/><path d="m56 56 21-1m-23 9 24-1m-24 9 26-2" stroke="#bdc2ac" stroke-width="2" opacity=".5"/><path d="m55 51 26 27" stroke="#544638" stroke-width="5"/><ellipse cx="67" cy="37" rx="11" ry="14" fill="#bfa17f"/><path d="M54 39v-7q12-20 25 0v10l-10-8z" fill="#465c63"/><path d="m55 30 13-9 11 11-11-5z" fill="#a6b1a6"/><path d="M66 34v15" stroke="#36484f" stroke-width="3"/><path d="m55 43 10 7 12-8-6 13-11-2z" fill="#504b43"/><path d="m82 61 10 18" stroke="#809088" stroke-width="8"/><path d="M91 97 100 20" stroke="#766c50" stroke-width="3"/><path d="m100 8-5 15 9-2z" fill="#c7d1c0"/>${hero ? '<path d="m49 55-12 23 12 19 16-14-5-28z" fill="#344d5d" stroke="#ccb678" stroke-width="2"/><path d="m43 73 6-8 7 9-7 13z" fill="#d5b56e"/>' : '<path d="m45 64-8 9 5 18 12-3 1-20z" fill="#605d47" stroke="#9f956c"/>'}`,
  );
}
export const ART: Record<string, string> = {
  pine: svg(
    shadow +
      '<path d="m58 112 3-70 8-2 3 76" fill="#625b43"/><path d="M63 13 39 48 49 45 27 75 39 72 14 102 46 108 64 103 85 109 111 98 88 74 98 76 78 49 88 52z" fill="url(#leaf)" stroke="#243e35" stroke-width="2"/><path d="m63 14 0 88 23 6-15-30 18 3-21-30 14 5z" fill="#1f3a33" opacity=".7"/><path d="m59 27-12 20 13-3m-8 15-18 19 24-5m-16 15-14 13 31-7" stroke="#809477" fill="none" opacity=".5" stroke-width="2"/>',
  ),
  mountain: svg(
    shadow +
      '<path d="M5 105 42 31 57 63 76 10 123 103 86 116 53 108 26 118z" fill="#434f56" stroke="#303d44" stroke-width="2"/><path d="M76 10 85 86 123 103z" fill="#2e3b46"/><path d="M76 10 53 92 85 86z" fill="#78858a"/><path d="m76 10-15 35 14-7 8 8 6-7z" fill="#c6cbbd"/><path d="M42 31 30 90 61 105z" fill="#6d787a"/><path d="m42 31-9 22 9-5 9 7z" fill="#aab4ac"/><path d="m59 88 8-17m24 27-6-16m-57 17 7-12" stroke="#a2aaa0" opacity=".5" stroke-width="2"/>',
  ),
  house: house(),
  market: house('#807155', true),
  smith: house('#3b505a'),
  castle: svg(
    shadow +
      `<path d="m30 87 36-16 34 17v22l-34 15-36-16z" fill="url(#stone)" stroke="#283840"/><path d="M65 85v37l35-15V87" fill="#45545a"/><path d="M53 117v-17q10-15 20-4v27" fill="#162730"/><path d="M58 101v15m5-19v24m5-23v24" stroke="#71634b" stroke-width="2"/>${tower(36, 101, 0.65)}${tower(97, 101, 0.65)}${tower(66, 77, 0.9)}<path d="M66 8V0m0 0 19 6-19 6" fill="#986558" stroke="#c5a36b" stroke-width="1.5"/>`,
  ),
  ruins: svg(
    shadow +
      '<path d="m25 108 0-43 12-7 0 24 13 6v-14l12 6v38z" fill="#636e67"/><path d="m68 115 0-26 16-8v-33l15-5v55z" fill="#4a5b59"/><path d="m38 111 15-14 14 9-12 11m27-4 15-17 16 9-16 13" fill="#8b9180"/><path d="m27 101 10-12 5 18m43-16 12 8" fill="#526b48"/>',
  ),
  hero: person('#365766', true),
  soldier: person('#626f53'),
  citizen: person('#76614e'),
  wolf: svg(
    '<ellipse cx="64" cy="111" rx="37" ry="8" fill="#081014" opacity=".5"/><path d="m36 78-18-18 3 21 21 13m1-12-9 26 8 4 12-23m34-5 10 22-8 4-14-21" fill="#46545c"/><path d="m32 80 23-17 30 4 13-16 17 9-5 23-20 14-29 0-25-6z" fill="#7a8584" stroke="#354650" stroke-width="2"/><path d="m84 68 1-24 10 9 7-17 9 20-7 23-19 10z" fill="#a1aaa1"/><path d="m89 76 26-9 6 10-21 9z" fill="#657778"/><path d="m42 76 12-6 25 5-17 8z" fill="#b4baab"/><path d="m90 61 6 2m7-5 5 2" stroke="#e4af73" stroke-width="2"/>',
  ),
  cart: svg(
    shadow +
      '<path d="m25 81 55-17 48 21-55 22z" fill="#947852"/><path d="m25 81v20l48 19v-13m0 0v13l30-17V85" fill="#5d503b" stroke="#b18f5a" stroke-width="2"/><path d="M29 80q0-41 28-34l40 13q10 5 6 26l-31 15z" fill="#b9b097" stroke="#5c655b" stroke-width="2"/><path d="M42 53q13 9 10 37m18-40q16 9 14 40" fill="none" stroke="#777f70" stroke-width="2"/><ellipse cx="43" cy="109" rx="9" ry="13" fill="#283733" stroke="#927b54" stroke-width="3"/><ellipse cx="91" cy="110" rx="8" ry="12" fill="#283733" stroke="#927b54" stroke-width="3"/>',
  ),
  fire: svg(
    '<ellipse cx="64" cy="102" rx="48" ry="22" fill="url(#glow)"/><path d="m47 105 32 10m-31 1 31-11" stroke="#6f5640" stroke-width="5"/><path d="M51 104q-15-15 6-36l4-22q30 34 18 55-11 14-28 3" fill="#c67948"/><path d="M57 104q-8-10 8-31 12 20 6 30z" fill="#f0cb82"/>',
  ),
  reeds: svg(
    '<ellipse cx="64" cy="115" rx="34" ry="8" fill="#344f53"/><path d="M44 114 38 81m18 33-1-51m11 50 10-45m2 46 14-30" stroke="#8a8964" stroke-width="2"/><path d="M38 82v-13m17-4v-14m21 17 3-12m12 28 4-14" stroke="#b0a074" stroke-width="4"/>',
  ),
  rock: svg(
    shadow +
      '<path d="m27 109 9-24 28-16 32 17 8 25-41 11z" fill="#63716e"/><path d="m64 69-8 29 7 24 41-11-8-25z" fill="#46565b"/><path d="m36 85 28-16-8 29-29 11z" fill="#88928a"/>',
  ),
};

ART.spider = svg(
  shadow +
    '<path d="m55 78-26-26-18 15m43 17-31-9-15 20m49-6-30 11-12 14m58-36 25-26 19 16m-42 18 30-8 18 20m-45-8 29 12 12 14" fill="none" stroke="#403c50" stroke-width="7"/><ellipse cx="63" cy="70" rx="22" ry="28" fill="#474352" stroke="#817080" stroke-width="2"/><ellipse cx="64" cy="96" rx="16" ry="14" fill="#302d40"/><path d="m57 106-6 9m18-9 6 9" stroke="#b9a992" stroke-width="3"/><circle cx="58" cy="93" r="3" fill="#ec9967"/><circle cx="70" cy="93" r="3" fill="#ec9967"/>',
);
ART.troll = svg(
  shadow +
    '<path d="m48 87-9 30h20l7-28m7-1 8 29h17L85 83" fill="#45554b"/><path d="M41 48 26 88l18 9 5-17-2 23 43 1-3-29 12 16 13-10-26-35z" fill="#617263" stroke="#394a41" stroke-width="3"/><path d="M51 48 47 29q18-27 35 0l-4 24z" fill="#7a8870"/><path d="m48 27-12-11 15 6m29 5 12-15-5 21" stroke="#b2aa8a" stroke-width="5"/><path d="M55 32h7m7 0h7" stroke="#e5bd75" stroke-width="3"/><path d="m58 45 6 7 9-6" stroke="#28372f" stroke-width="4"/><path d="m104 108-8-57" stroke="#6e543c" stroke-width="9"/><path d="m84 50 19-6 9 24-22 6z" fill="#777a6e"/>',
);
ART.dragon = svg(
  shadow +
    '<path d="M63 70 29 22 5 20 15 66l25-5-9 25 31 3m5-15 31-53 23 12-5 40-22-4 7 23-34-5" fill="#593d49" stroke="#9b6a6e" stroke-width="2"/><path d="m59 52-15 39 15 17 20-13-7-40" fill="#495b58" stroke="#233d3b" stroke-width="3"/><path d="m61 61-4-32 11-17 13 16-9 34" fill="#718075"/><path d="m67 16-6-12m14 14 8-12" stroke="#bbad83" stroke-width="4"/><path d="m63 33 6 4 6-5" stroke="#ecb55d" stroke-width="3"/><path d="m49 88-12 27m39-26 19 23" stroke="#697b70" stroke-width="8"/><path d="M65 99q-15 24 22 23l26-20" fill="none" stroke="#4e655b" stroke-width="7"/>',
);

ART.spirit = svg(
  '<ellipse cx="64" cy="110" rx="35" ry="10" fill="#619cad" opacity=".25"/><path d="M30 108q24-28 14-61 2-32 20-34 29 4 19 43-8 22 21 50l-25-8-14 20-14-16z" fill="#99d5d4" opacity=".65" stroke="#d5f2e6" stroke-width="2"/><path d="m55 42 7 3m7-3 7-3" stroke="#243548" stroke-width="4"/>',
);
ART.undead = person('#374c45').replace(
  '</svg>',
  '<path d="m56 29 5 1m8-1 5-1" stroke="#a4e4a0" stroke-width="3"/></svg>',
);
