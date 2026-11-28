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
          const result = await window.LivingKhorinisPrepare({ FS: Module.FS, gameRoot: GAME_ROOT, gameFs: GameFS, Module });
          if (result != null) {
            if (!result.runtime || !Module.FS.analyzePath(result.runtime).exists) throw new Error('Движку недоступен игровой архив мода.');
            globalThis.lkModActive = true;
            globalThis.lkModVersion = result.version;
            lkShowBootMode('Живой Хоринис ' + (result.version === 'legacy' ? '(ранняя версия)' : result.version) + ' · пакет передан движку');
            console.info('[LK] browser VDF',result.runtime,'version',result.version);
          } else {
            if (new URLSearchParams(location.search).get('checkmod') === '1')
              throw new Error('Пакет мода не найден. В меню папки выбери свой .lkmod и нажми OK.');
            lkShowBootMode('Обычная Gothic II · мод не выбран');
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
# Optional direct GitHub sync. The browser never stores the token.
s=s.replace("connect-src 'self' blob:;", "connect-src 'self' blob: https://api.github.com;")
s=s.replace('<script src="lk-saves.js"></script>', '<script src="lk-saves.js"></script>\n  <script src="lk-github-saves.js"></script>')
s=s.replace('src="living-khorinis-hook.js"', 'src="living-khorinis-hook.js?v=09"').replace('src="lk-github-saves.js"', 'src="lk-github-saves.js?v=09"')
s=s.replace('<a class="fm-item" role="menuitem" href="../saves.html"','<button class="fm-item" role="menuitem" type="button" onclick="lkOpenSync()">Сейвы в GitHub</button>\n          <a class="fm-item" role="menuitem" href="../saves.html"')
s=s.replace('<input type="file" id="saves-picker"', '''<dialog id="lk-cloud" style="max-width:min(90vw,32rem); color:#eee3c8; background:#171512; border:1px solid #8e7550; border-radius:8px; padding:1rem; z-index:99999">
          <h2>Сохранения мода в GitHub</h2>
          <p>Отправляется один выбранный сейв. Токен не сохраняется после закрытия окна.</p>
          <p><a href="../saves.html#github" target="_blank" rel="noopener" style="color:#ead19c">Как дать доступ только к репозиторию сейвов ↗</a></p>
          <p><label>Fine-grained токен <input id="lk-gh-token" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" style="width:100%;box-sizing:border-box"></label></p>
          <p><label>Слот для отправки <select id="lk-gh-slot"></select></label></p>
          <button type="button" id="lk-gh-push" onclick="lkSync('push')">Отправить в GitHub</button>
          <button type="button" id="lk-gh-pull" onclick="lkSync('pull')">Загрузить из GitHub</button>
          <button type="button" id="lk-gh-close" onclick="document.getElementById('lk-cloud').close()">Закрыть</button>
          <p id="lk-gh-status" role="status" aria-live="polite"></p>
        </dialog>
        <input type="file" id="saves-picker"''')
at=s.index('    // The canvas takes')
s=s[:at]+'''    let lkCloudBusy = false;
    const lkId = id => document.getElementById(id);
    lkId('lk-cloud').addEventListener('close', () => { lkId('lk-gh-token').value = ''; });
    lkId('lk-cloud').addEventListener('cancel', e => { if (lkCloudBusy) e.preventDefault(); });
    lkId('lk-cloud').addEventListener('keydown', e => e.stopPropagation());
    async function lkOpenSync() {
      if (!globalThis.lkModActive) {
        alert('Синхронизация доступна только в запущенной игре с модом. Обычные сейвы можно переносить ZIP-архивом.');
        return;
      }
      if (lkId('lk-cloud').open) return;
      const slots = lkId('lk-gh-slot');
      const status = lkId('lk-gh-status');
      slots.replaceChildren();
      status.textContent = 'Выбирай только сейв из этой версии мода. Занятые слоты не перезаписываются.';
      lkId('lk-cloud').showModal();
      try {
        const files = (await collectSaves()).filter(f => /^save_slot_(?:[0-9]|1[0-9]|20)\\.sav$/i.test(f.name));
        files.sort((a,b) => a.name.localeCompare(b.name,undefined,{numeric:true}));
        for (const f of files) {
          const n = Number(SAVE_RE.exec(f.name)[1]);
          slots.add(new Option(n ? 'Слот '+n : 'Быстрое сохранение',f.name));
        }
        lkId('lk-gh-push').disabled = !slots.value;
      } catch { status.textContent = 'Не удалось прочитать местные сейвы.'; }
    }
    async function lkSync(action) {
      const status = lkId('lk-gh-status'), picker = lkId('lk-gh-slot');
      if (!globalThis.lkModActive || lkCloudBusy || lkSaveImportBusy) return;
      lkCloudBusy = lkSaveImportBusy = true;
      for (const id of ['lk-gh-push','lk-gh-pull','lk-gh-close']) lkId(id).disabled = true;
      status.textContent = 'Ждём ответ GitHub…';
      try {
        const api = LivingKhorinisGitHub.create(fetch.bind(window),globalThis.lkModVersion);
        const token = lkId('lk-gh-token').value.trim();
        if (action === 'push') {
          const selected = (await collectSaves()).find(f => f.name === picker.value);
          if (!selected) throw Error('Сначала создай и выбери сохранение мода.');
          const changed = await api.push(token, selected.bytes, () => confirm('Заменить последнюю облачную копию? Предыдущая останется в истории GitHub.'));
          status.textContent = changed ? 'Сохранение отправлено в ветку mod-ru.' : 'Отправка отменена.';
        } else {
          const bytes = await api.pull(token);
          if (!bytes) { status.textContent = 'В GitHub ещё нет сохранения. Сначала отправь его с другого устройства.'; return; }
          const current = await collectSaves();
          if (current.some(f => f.name.toLowerCase() !== 'save_slot_99.sav' && f.bytes.length === bytes.length && f.bytes.every((v,i) => v === bytes[i]))) {
            status.textContent = 'Этот сейв уже есть.';
            return;
          }
          const {writes} = LivingKhorinisSaves.plan(current, [{name:'save_slot_1.sav', bytes}], 20);
          if (!writes.length) { status.textContent = 'Этот сейв уже есть.'; return; }
          for (const s of writes) await writeSave(s.name,s.bytes);
          status.textContent = 'Сохранение добавлено в слот '+writes[0].index+'. Открой «Загрузить игру».';
        }
      } catch (e) {
        status.textContent = e instanceof TypeError || e.name === 'AbortError' ? 'Не удалось связаться с GitHub. Проверь интернет и повтори.' : (e.message || 'Ошибка синхронизации.');
      } finally {
        lkCloudBusy = lkSaveImportBusy = false;
        lkId('lk-gh-push').disabled = !picker.value;
        lkId('lk-gh-pull').disabled = lkId('lk-gh-close').disabled = false;
      }
    }

'''+s[at:]
# Store one local mod overlay separately from base game files and saves.
s=s.replace('<input type="file" id="saves-picker"', '<input type="file" id="lk-update-picker" class="file-input" accept=".lkmod" onchange="lkInstallLocalUpdate(event)">\n        <input type="file" id="saves-picker"')
s=s.replace('<button class="fm-item" role="menuitem" type="button" onclick="lkOpenSync()">','<button class="fm-item" role="menuitem" type="button" onclick="document.getElementById(\'lk-update-picker\').click()">Выбрать обновление мода (.lkmod)</button>\n          <button class="fm-item" role="menuitem" type="button" onclick="lkOpenSync()">')
s=s.replace('        <div id="fm-source">','        <p id="lk-boot-mode" hidden style="margin:0;padding:8px 10px;font-size:12px;color:#e0c995;max-width:24em"></p>\n        <div id="fm-source">')
pos=s.index('    async function removeRootEntry(name)')
s=s[:pos]+'''    function lkShowBootMode(message) {
      const e=document.getElementById('lk-boot-mode');
      if(e) { e.textContent=message; e.hidden=false; }
    }
    const LK_OVERLAY_FILE = 'living-khorinis-local-overlay.lkmod';
    async function lkInstallLocalUpdate(e) {
      const f=e.target.files[0];e.target.value='';
      if(!f) return;
      let writer;
      try{
        if(!await readRootJson(INSTALL_MARK)) throw Error('Сначала импортируй папку или ZIP с базовой игрой.');
        if(f.size > LivingKhorinisOverlay.limit) throw Error('Для обновления выбери .lkmod, не ZIP с игрой.');
        const bytes=new Uint8Array(await f.arrayBuffer());
        LivingKhorinisOverlay.parts(bytes);
        if(!confirm('Установить обновление мода и перезапустить игру? Слоты сохранятся. После обновления начни новую игру в отдельном слоте.')) return;
        const root=await navigator.storage.getDirectory();
        writer=await (await root.getFileHandle(LK_OVERLAY_FILE,{create:true})).createWritable();
        await writer.write(bytes);
        await writer.close();
        writer=null;
        sessionStorage.removeItem('ogResume');
        const u=new URL(location.href);
        u.searchParams.delete('lkbase');
        u.searchParams.delete('vanilla');
        u.searchParams.delete('nomenu');
        u.searchParams.set('checkmod','1');
        location.href=u.toString();
      }catch(err){
        if(writer) try{await writer.abort();}catch{}
        alert('Обновление не применено: '+(err.message||err));
      }
    }
    async function lkMountLocalUpdate() {
      if(new URLSearchParams(location.search).has('lkbase') || new URLSearchParams(location.search).get('vanilla')==='1')return;
      const root=await navigator.storage.getDirectory();
      let f;
      try{ f=await(await root.getFileHandle(LK_OVERLAY_FILE)).getFile(); }
      catch(e){if(e.name==='NotFoundError')return;throw e;}
      if(!f.size)return;
      if(f.size>LivingKhorinisOverlay.limit)throw Error('Локальный пакет мода слишком большой.');
      LivingKhorinisOverlay.mount(GameFS,new Uint8Array(await f.arrayBuffer()));
    }

'''+s[pos:]
s=s.replace("""        if (typeof window.LivingKhorinisPrepare === 'function') {
          const result""","""        await lkMountLocalUpdate();
        if (typeof window.LivingKhorinisPrepare === 'function') {
          const result""",1)
Path('dist/index.html').write_text(s)
