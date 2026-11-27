# Авторы 3D-ассетов / Third-party asset credits

These credits cover the 3D playtest in this directory. The upstream asset licenses do not relicense the game's source code. All imported art in this playtest is CC0; no assets from Fab or paid tiers were copied.

| Author(s) | Source | Files used and changes |
| --- | --- | --- |
| Quaternius | [Modular Character Outfits – Fantasy, Standard](https://quaternius.com/packs/modularcharacteroutfitsfantasy.html) | `packs/outfit-{male,female}_{peasant,ranger}.glb`. Game selects the body and clothing set, mounts our separate head, hair and gear, and retints materials. Mesh reduction, smaller base-color textures, hood removed to keep hairstyles visible. |
| Quaternius | [Universal Animation Library, Standard](https://quaternius.com/packs/universalanimationlibrary.html) | `packs/quaternius-motion.glb`. Selected idle, walk, jog, jump and sword clips; joint rotations only, no source character mesh. These clips are used with the two imported outfits. |
| Quaternius | [Stylized Nature MegaKit, Standard](https://quaternius.com/packs/stylizednaturemegakit.html) | `Pine_1`, `Pine_2`, `Fern_1`, `DeadTree_1` in `packs/`, placed and tinted by the existing generation rules. |
| Quaternius | [Medieval Village MegaKit, Standard](https://quaternius.com/packs/medievalvillagemegakit.html) | Plaster and uneven brick walls, window and door openings, round-tile roof, timber fence and chimney in `packs/`. Used as construction modules at Wolf Farm. |
| Rico Cilliers (modeling); Rob Tuytel (photography), Poly Haven | [Grass Medium 01](https://polyhaven.com/a/grass_medium_01) | `packs/poly-grass.glb`. Three small grass variants selected and repacked with reduced textures. |
| Rob Tuytel, Poly Haven | [Forest Ground 03](https://polyhaven.com/a/forrest_ground_03) | `packs/poly-litter.jpg`, `packs/poly-litter-normal.jpg`. Resized 1K source maps for the forest floor. |
| Rob Tuytel, Poly Haven | [Pine Tree 01](https://polyhaven.com/a/pine_tree_01) | `packs/poly-bark.jpg`. Resized trunk color texture **only**; the full high-detail pine mesh is not included. |
| MakeHuman Team | [hm08 base mesh](https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj), [asset license](https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md#c-the-license-for-the-bundled-assets) | `head.json`. Cropped, reduced and reshaped for the character creator; no MakeHuman code. |

License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/legalcode); a plain-text copy and the included Quaternius notices are in [licenses/](licenses/). [Poly Haven license statement](https://polyhaven.com/license).

Pinned provenance for the redistributed Quaternius source:
- Outfits: [Mesh2Motion mirror](https://github.com/Mesh2Motion/mesh2motion-assets/tree/4752820c88f998cd93e9fb8aeea2860fe137df11/CC0-packs/Quaternius).
- Original UAL1 Standard glTF export: [download mirror](https://github.com/NafisRayan/Animate-Rigged-Humanoid-No-Blender/tree/5821923af517ac5fdc82505faa92a0d575fc1b1a).
- Nature and village GLBs: [normalized exports by parrisdigital](https://github.com/parrisdigital/repo-magical-kingdom/tree/214dec451d66358af7be4df42ad44c9bdf0a8cb8/public/assets/world/quaternius). We only copied the credited asset files, not application code.

Runtime loader and skeleton helpers: Three.js r170 and Meshoptimizer decoder distributed with Three.js. See the separate runtime dependency notices; the art credits do not apply to these libraries.
