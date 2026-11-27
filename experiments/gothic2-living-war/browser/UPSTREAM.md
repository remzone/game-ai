# Upstream components

- [OpenGothic (Try)](https://github.com/Try/OpenGothic), MIT, © 2019 Try. See LICENSE-OpenGothic.txt.
- [GothicDroid browser shell (slaker222 and contributors)](https://github.com/slaker222/gothicdroid/tree/979cd61634c61bdee324943b8cfa4ef74799b7ad/web), derived from OpenGothic. Shell source pinned to 979cd61634c61bdee324943b8cfa4ef74799b7ad; this package adapts it for local import and adds a hook before starting the game. The upstream touch editor is included unchanged.
- Emscripten outputs acquired from [the GothicDroid preview](https://gothicplay.fun/). SHA-256: opengothic.js c67e001263b4fe43d8ba43d228f63e569c30ed598b68c42bc5bede23307fe12f; opengothic.wasm f3e6524c8619a1af6a9c4d3a1f302b0259ec629a03ca76e5163a8fe4414ba8f5. The exact source revision used by the host for these files was not independently verified. This is not a build from the original Gothic II executable.
- Gothic II game data is not bundled. The browser receives engine and project files from the host, then opens your own installed Data archives. This page has no game download or asset uploads.
- Dependency licenses are vendored under `third-party/`: Tempest, Bullet, TinySoundFont, ZenKit, dmusic, Opus, RapidJSON and miniz. This distribution does not include the ZenKit logo.
