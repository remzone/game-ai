from pathlib import Path
import re
s=Path('shell-upstream.html').read_text()
def cut(left,right,replacement):
 global s
 a=s.index(left); b=s.index(right,a); s=s[:a]+replacement+s[b:]
s=s.replace('      16: 9 there anyway */ height:', '      height:')
s=s.replace("if (!text || window.__ogFatal) return;","if (!text || window.__ogFatal || !document.getElementById('lk-sources')?.hidden) return;")
s=s.replace("const INSTALL_MARK = 'gothic-install' + GAME_SUF + '.json';", "const INSTALL_MARK = 'living-khorinis-install-v1.json';")
s=s.replace('<html lang="en">','<html lang="ru">')
s=re.sub(r'<title>[^<]+</title>','<title>Живой Хоринис · Gothic II</title>',s)
s=re.sub(r'^.*(?:img/icon\.png|rel="manifest").*\n','',s,flags=re.M)
s=re.sub(r'^.*src="data:image/png;base64,[^"]+".*\n','',s,flags=re.M)
for line in s.splitlines():
 if ("'manifest.webmanifest'" in line or 'src="data:image/png;base64,' in line or 'rel="manifest"' in line or 'rel="icon"' in line or 'src="https:' in line or 'url(img/' in line or "fetch(\'/__log\'" in line or ('boot-bg' in line and 'style.backgroundImage' in line) or "querySelector('link[rel=" in line):
  s=s.replace(line,'')
s=s.replace('<head>','''<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; worker-src 'self' blob:; connect-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'">
  <style>
  #boot-bg{background:radial-gradient(ellipse at 50% 30%,#292c24 0%,#100f10 50%,#080808 92%)}
  #lk-sources{max-width:660px;padding:14px 20px 13px;text-align:center;color:#e5d9bb;font-size:15px;line-height:1.55}
  #lk-sources[hidden]{display:none} #lk-sources .btn{margin:3px 3px 10px}
  #lk-sources h1{margin:0 0 8px;color:#e3c98b;font:35px Georgia,serif} #lk-sources a{color:#e3c98b}
  </style>''',1)
s=s.replace('<div class="status-box" id="status-text">Loading...</div>','<div class="status-box" id="status-text" role="status" aria-live="polite">Проверяем запуск…</div>')
s=s.replace('<input type="file" id="folder-picker"','''<section id="lk-sources" hidden>
      <h1>Живой Хоринис</h1>
      <p>Выбери папку Gothic II: Night of the Raven из Steam или ZIP с её файлами. Ищи папку игры через «Управление → Просмотреть локальные файлы». Ни пароль Steam, ни OpenRouter не нужны. Файлы остаются в браузере.</p>
      <button class="btn" onclick="pickOffline('folder-picker')">Выбрать папку Gothic II</button>
      <button class="btn" onclick="pickOffline('zip-picker')">Выбрать ZIP</button>
      <br><a href="../">К описанию проекта</a>
      </section>
      <input type="file" id="folder-picker"''',1)
cut('    const GAME_ID = (() => {','    // g3 =', "    const GAME_ID = 'g2';\n")
s=s.replace("const OPFS_ROOT_DIR = GAME_ID === 'g1' ? 'gothic' : 'gothic' + GAME_ID.slice(1);","const OPFS_ROOT_DIR = 'living-khorinis-gothic2';")
s=s.replace("    function showSourceButtons(show) { }","    function showSourceButtons(show) { document.getElementById('lk-sources').hidden = !show; }")
cut('    async function bootstrap() {','    // an offline source',"""    async function bootstrap() {
      showSourceButtons(false);
      progressContainer.style.display = 'none';
      if (!window.crossOriginIsolated) {
        if (window.top === window && navigator.serviceWorker && !navigator.serviceWorker.controller) {
          try {
            setStatus('Настраиваем браузер для запуска игры…');
            await navigator.serviceWorker.register('./isolation-worker.js', { scope: './' });
            if (navigator.serviceWorker.controller) location.reload();
            else navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
            return;
          } catch (e) { console.warn('Browser isolation:', e); }
        }
        setStatus('Этот сервер не включил изоляцию браузера для движка. Запусти локальную сборку через serve.py.');
        return;
      }
      const pickMode = lsGet(PICK_FILES) === '1';
      lsSet(PICK_FILES, null);
      try {
        if (!pickMode && await readRootJson(INSTALL_MARK)) {
          setStatus('Готовим файлы игры…', undefined, { spin: true });
          await g_runtimeReady;
          if (await mountInstalledGame()) { startGame(); return; }
        }
      } catch (e) { console.warn('Local import:', e); }
      downloadGame();
    }

""")
cut('    async function downloadGame() {','    function ','''    async function downloadGame() {
      showSourceButtons(true);
      progressContainer.style.display = 'none';
      retryBtn.style.display = 'none';
      setStatus('Подключи свою копию Gothic II из Steam.');
    }

''') if False else None
start=s.index('    async function downloadGame() {'); end=s.index('    // ------------------------- language packs',start)
s=s[:start]+"""    async function downloadGame() {
      showSourceButtons(true);
      progressContainer.style.display = 'none';
      retryBtn.style.display = 'none';
      setStatus('Подключи свою копию Gothic II из Steam.');
    }
"""+s[end:]
s=s.replace("  if (list.length === 0) throw new Error('no game files in the archive');","  if (!list.some(e => /^data\\/[^/]+\\.vdf$/i.test(e.rel))) throw new Error('В архиве нет Data/*.vdf из Gothic II.');")
s=s.replace("        h.write(value, { at: pos });", "        if (pos + value.byteLength > e.size) throw new Error('Размер файла в ZIP отличается от заголовка.');\n        h.write(value, { at: pos });", 1)
s=s.replace("      g_offlineBusy = true;\n      await installFromZip(file);","      showSourceButtons(false);\n      g_offlineBusy = true;\n      await installFromZip(file);")
s=s.replace("if (!all.some(f => f.path.toLowerCase().startsWith('data/')))","if (!all.some(f => /^data\\/[^/]+\\.vdf$/i.test(f.path)))")
s=s.replace("if (!list.some(f => /^data\\//i.test(f.rel)))\n          throw new Error('no Data folder: select the root folder of the installed game');","if (!list.some(f => /^data\\/[^/]+\\.vdf$/i.test(f.rel)))\n          throw new Error('Не найдено Data/*.vdf. Выбери корневую папку установленной Gothic II.');")
s=s.replace("if (IS_ARCHOLOS) args.push(\"-game:\" + ARCHOLOS_INI);   // the engine looks for it in <game>/system","""if (typeof window.LivingKhorinisPrepare === 'function') {
          const result = await window.LivingKhorinisPrepare({ FS: Module.FS, gameRoot: GAME_ROOT, Module });
          if (result != null) {
            if (typeof result.ini !== 'string' || !/^[a-zA-Z0-9_.-]+\\.ini$/i.test(result.ini)) throw new Error('Неверное имя INI мода.');
            args.push('-game:' + result.ini);
          }
        }""")
s=s.replace('  {{{ SCRIPT }}}','''  <script src="living-khorinis-hook.js"></script>
  <script>
    if (window.crossOriginIsolated) {
      const runtime = document.createElement('script');
      runtime.src = 'opengothic.js';
      runtime.onerror = () => setStatus('Не удалось загрузить движок. Открой локальную сборку.');
      document.body.append(runtime);
    }
  </script>''')
# Local save menu: keep the existing codec and replace its overwrite policy.
s=s.replace('Game files and savegames','Файлы игры и сохранения')
s=s.replace('Use a Gothic folder from this device','Выбрать папку Gothic II с этого устройства')
s=s.replace('Use a ZIP archive of the game from this device','Выбрать ZIP с игрой с этого устройства')
s=s.replace('>Select folder</button>','>Выбрать папку игры</button>')
s=s.replace('>Select ZIP</button>','>Выбрать ZIP с игрой</button>')
s=s.replace('The game restarts to choose other game files. Savegames are kept. Continue?','Лаунчер перезапустится для выбора файлов игры. Сохранения останутся. Продолжить?')

s=s.replace('Download all savegames as a ZIP archive','Скачать сохранения в отдельный ZIP')
s=s.replace('Add savegames from a ZIP archive or .sav files','Импорт из ZIP или .sav без перезаписи')
s=s.replace('>Download saves</button>','>Скачать сохранения</button>')
s=s.replace('>Upload saves</button>','>Импортировать сохранения</button>\n          <a class="fm-item" role="menuitem" href="../saves.html" target="_blank" rel="noopener">Перенос и архив в GitHub ↗</a>')
s=s.replace('const saves = await collectSaves();',"const saves = (await collectSaves()).filter(s => s.name.toLowerCase() !== 'save_slot_99.sav');",1)
s=s.replace("'There are no savegames yet.'","'Сохранений пока нет.'")
start=s.index('    async function onSavesPicked(ev) {')
end=s.index("    // The canvas takes",start)
s=s[:start]+'''    let lkSaveImportBusy = false;
    async function onSavesPicked(ev) {
      const picked = [...ev.target.files];
      ev.target.value = '';
      if (!picked.length || lkSaveImportBusy) return;
      lkSaveImportBusy = true;
      try {
        const incoming = [];
        for (const f of picked) {
          if (/\\.zip$/i.test(f.name)) incoming.push(...await unzipSaves(f));
          else incoming.push({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
        }
        if (!incoming.length) throw Error('В архиве нет файлов .sav.');
        const {writes, duplicates} = LivingKhorinisSaves.plan(await collectSaves(), incoming, 20);
        if (!writes.length) {
          window.ogToast?.(duplicates ? 'Эти сохранения уже есть.' : 'В архиве нет игровых слотов.');
          return;
        }
        for (const s of writes) await writeSave(s.name, s.bytes);
        const slots = writes.map(s => s.index === 0 ? 'быстрое сохранение' : s.index).join(', ');
        window.ogToast?.('Импортировано: ' + slots + '. Открой «Загрузить игру».');
      } catch (e) {
        alert('Не удалось импортировать сохранения: ' + (e.message || e));
      } finally {
        lkSaveImportBusy = false;
      }
    }

'''+s[end:]
s=s.replace('<script src="living-khorinis-hook.js"></script>','<script src="lk-saves.js"></script>\n  <script src="living-khorinis-hook.js"></script>')
Path('dist/index.html').write_text(s)
