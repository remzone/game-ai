# Живой Хоринис: браузерный запуск

Ветка `chati/gothic2-faction-war`. Работа не меняет браузерную «Пепельную корону».

- Правила: `../LivingKhorinis.d`.
- Обычный Daedalus-адаптер для Gothic II NotR и диагностические тесты: `../../gothic2-native-adapter/`.
- `adapt.py`: адаптация HTML-пускателя GothicDroid. Сборка работает из локальных архивов игрока и не запрашивает Steam credentials. Архивы игры и скомпилированный DAT владельца не включены.
- Ветка движка [GothicDroid android-port, 979cd616](https://github.com/slaker222/gothicdroid/tree/979cd61634c61bdee324943b8cfa4ef74799b7ad), права и зависимости в `UPSTREAM.md` и каталогах лицензий. MIT-движок и адаптированный статический лаунчер публикуются отдельно в тестовом Site. У опубликованного бинарника зафиксирован SHA-256, но точное соответствие исходному ревизионному номеру автора не доказано.
- `site/dist/_headers` нужны для SharedArrayBuffer. Альтернатива на локальном сервере: `python site/run-local.py` после заполнения `site/dist/game`.
- `site/prepare-import.py`: командный вход из zip-сборщика, где рядом должны лежать папки `gothic2-living-war` (ядро) и `gothic2-native-adapter` (оболочка и локальный компилятор). Готовый пользовательский ZIP включает игровые данные из своей Steam-копии; не публикуйте и не пересылайте его.

## Воспроизведение пускателя

Скачайте `web/shell.html` и `web/touch_editor.js` из указанного коммита GothicDroid. Сохраните HTML как `shell-upstream.html` рядом с `adapt.py`, выполните `mkdir -p dist && python adapt.py`. Копируйте полученный `dist/index.html`, `touch_editor.js`, бинарники `opengothic.js` и `opengothic.wasm` с проверенными значениями из `UPSTREAM.md`, а также `isolation-worker.js` и `../../gothic2-native-adapter/living-khorinis-hook.js` в `site/dist/game/`. Это только движок и загрузчик; исходные игровые архивы на сервер не копируются.

Полная сборка движка воспроизводится из исходников через upstream `scripts/build_web.sh` и `OFFLINE_ONLY=1`; см. документацию GothicDroid. Проверка сборки: `node --test site/tests/release.test.mjs` (после развёртывания файлов движка), рядом с адаптером его обычные Python/Node тесты. Полноценную проверку прохождения можно провести только после импорта установленной копии Steam.
