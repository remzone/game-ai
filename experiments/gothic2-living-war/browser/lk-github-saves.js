/* Living Khorinis — optional GitHub save transfer, no stored credentials. */
(() => {
  'use strict';
  const repo = 'remzone/living-khorinis-saves';
  const branch = 'mod-ru';
  const max = 12 * 1024 * 1024;
  const shaPattern = /^[a-f0-9]{40}$/;
  const headers = {Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28'};
  const encode = bytes => {
    const chunks = [];
    for (let i=0;i<bytes.length;i+=24576) chunks.push(btoa(String.fromCharCode(...bytes.subarray(i,i+24576))));
    return chunks.join('');
  };
  const valid = bytes => bytes?.length > 0 && bytes.length <= max;
  function create(fetcher, version) {
    const name = version === '0.7' ? 'latest-v07.sav' : version === '0.6' ? 'latest-v06.sav' : version === '0.5' ? 'latest-v05.sav' : version === '0.4' ? 'latest-v04.sav' : version === '0.3' ? 'latest-v03.sav' : 'latest.sav';
    const path = '/contents/' + name;
    async function req(token, endpoint, options = {}) {
      if (!/^github_pat_[a-zA-Z0-9_]{20,255}$/.test(token)) throw Error('Нужен fine-grained токен GitHub.');
      const h = {...headers, Authorization:'Bearer '+token};
      if (options.raw) h.Accept = 'application/vnd.github.raw+json';
      if (options.object) h.Accept = 'application/vnd.github.object+json';
      if (options.body) h['Content-Type']='application/json';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      try {
        const r = await fetcher('https://api.github.com/repos/'+repo+endpoint,{
          method: options.body ? 'PUT' : 'GET', headers:h,
          body: options.body && JSON.stringify(options.body), signal:controller.signal,
          credentials:'omit', mode:'cors', redirect:'error', cache:'no-store', referrerPolicy:'no-referrer'
        });
        if (r.status === 404 && options.allowMissing) return null;
        if (r.status === 401 || r.status === 403 || r.status === 404)
          throw Error('Нет доступа. Проверь токен, репозиторий и разрешение Contents.');
        if (r.status === 409 || r.status === 422)
          throw Error('GitHub не принял запись. Возможно, копия уже обновилась на другом устройстве. Загрузи её и повтори.');
        if (!r.ok) throw Error('GitHub вернул ошибку '+r.status+'.');
        if (!options.raw) return await r.json();
        const reader = r.body?.getReader();
        if (!reader) throw Error('GitHub не вернул сохранение.');
        const bytes = new Uint8Array(options.size);
        let offset = 0;
        try {
          while (true) {
            const {done,value} = await reader.read();
            if (done) break;
            if (offset + value.length > bytes.length) { await reader.cancel(); throw Error('Размер облачной копии не совпал.'); }
            bytes.set(value,offset); offset += value.length;
          }
        } finally { reader.releaseLock(); }
        if (offset !== bytes.length) throw Error('Скачалась не вся копия. Повтори загрузку.');
        return bytes;
      } finally { clearTimeout(timeout); }
    }
    async function ensurePrivate(token) {
      const info = await req(token,'');
      if (info.private !== true || info.visibility !== 'private' || info.full_name?.toLowerCase() !== repo ||
          String(info.id) !== '1475762857')
        throw Error('Нужный репозиторий должен оставаться приватным. Синхронизация остановлена.');
    }
    async function head(token) {
      const x = await req(token,path+'?ref='+branch,{allowMissing:true,object:true});
      if (x && (x.type!=='file' || x.path!==name || !shaPattern.test(x.sha) || !Number.isSafeInteger(x.size) || x.size<1 || x.size>max))
        throw Error('Облачная копия не похожа на корректное сохранение до 12 МиБ.');
      return x;
    }
    return Object.freeze({
      async pull(token) {
        await ensurePrivate(token);
        const x = await head(token);
        if (!x) return null;
        return await req(token,'/git/blobs/'+x.sha,{raw:true,size:x.size});
      },
      async push(token,bytes,confirmReplace) {
        if (!valid(bytes)) throw Error('Выбери сохранение размером до 12 МиБ.');
        await ensurePrivate(token);
        const x = await head(token);
        if (x && !confirmReplace()) return false;
        const body={branch,message:'Living Khorinis: save checkpoint',content:encode(bytes)};
        if (x) body.sha=x.sha;
        await req(token,path,{body});
        return true;
      },
    });
  }
  globalThis.LivingKhorinisGitHub = Object.freeze({create});
})();
