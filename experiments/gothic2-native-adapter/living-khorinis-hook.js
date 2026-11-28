/* Verify a locally compiled Living Khorinis overlay before GothicDroid boots.
 * No uploads, fetches, binary patching, DLLs, or script compilation in browser. */
(() => {
    "use strict";
    const file = "LivingKhorinis";
    const oldRows = [["_WORK",1],["DATA",2],["SCRIPTS",3],["_COMPILED",4],["LIVINGKHORINIS.DAT",-1]];
    const artRows = [["_WORK",1],["DATA",2],["MESHES",5,false],["SCRIPTS",6,false],["TEXTURES",7],
        ["_COMPILED",8],["_COMPILED",10],["_COMPILED",11],
        ["LKN_CROSS.MRM",-1,false],["LKN_RIDGE.MRM",-1],["LIVINGKHORINIS.DAT",-1],
        ["LKN_CLOTH-C.TEX",-1,false],["LKN_IRON-C.TEX",-1,false],
        ["LKN_OAK-C.TEX",-1,false],["LKN_STONE-C.TEX",-1]];
    const industryRows = [["_WORK",1],["DATA",2],["MESHES",5,false],["SCRIPTS",6,false],["TEXTURES",7],
        ["_COMPILED",8],["_COMPILED",12],["_COMPILED",13],
        ["LKN_CROSS.MRM",-1,false],["LKN_DOCK.MRM",-1,false],["LKN_MINE.MRM",-1,false],
        ["LKN_RIDGE.MRM",-1],["LIVINGKHORINIS.DAT",-1],
        ["LKN_CLOTH-C.TEX",-1,false],["LKN_IRON-C.TEX",-1,false],
        ["LKN_OAK-C.TEX",-1,false],["LKN_STONE-C.TEX",-1]];
    const logisticsRows = [["_WORK",1],["DATA",2],["MESHES",5,false],["SCRIPTS",6,false],["TEXTURES",7],
        ["_COMPILED",8],["_COMPILED",14],["_COMPILED",15],
        ["LKN_CROSS.MRM",-1,false],["LKN_DOCK.MRM",-1,false],["LKN_LOGS.MRM",-1,false],
        ["LKN_MINE.MRM",-1,false],["LKN_ORE.MRM",-1,false],["LKN_RIDGE.MRM",-1],["LIVINGKHORINIS.DAT",-1],
        ["LKN_CLOTH-C.TEX",-1,false],["LKN_IRON-C.TEX",-1,false],["LKN_OAK-C.TEX",-1,false],
        ["LKN_ORE-C.TEX",-1,false],["LKN_STONE-C.TEX",-1]];
    const err = text => new Error("Мод «Живой Хоринис»: " + text);

    function child(fs, parent, wanted) {
        const entries = fs.readdir(parent).filter(n => n.toLowerCase() === wanted.toLowerCase());
        if (entries.length > 1) throw err("в папке импорта есть файлы с одинаковыми именами.");
        return entries.length ? parent + "/" + entries[0] : null;
    }

    function fileBytes(fs, path, max) {
        const stat = fs.stat(path);
        if (!fs.isFile(stat.mode) || stat.size < 1 || stat.size > max) {
            throw err("размер файла неверный: " + path);
        }
        return fs.readFile(path);
    }

    function verify(files, volume, volumeName) {
        const decoded = new TextDecoder("utf-8").decode(files);
        let current = "";
        let fileSections = 0;
        const games = [];
        const vdfs = [];
        for (const line of decoded.split(/\r?\n/)) {
            const section = line.match(/^[ \t]*\[([^\]]+)\][ \t]*(?:;.*)?$/);
            if (section) {
                current = section[1].trim().toLowerCase();
                if (current === "files") fileSections++;
                continue;
            }
            if (current !== "files") continue;
            const setting = line.match(/^[ \t]*(game|vdf)[ \t]*=[ \t]*([^;\r\n]*)/i);
            if (setting) (setting[1].toLowerCase() === "game" ? games : vdfs).push(setting);
        }
        if (fileSections !== 1 || games.length !== 1 || !/^content[\\/]livingkhorinis$/i.test(games[0][2].trim()) ||
            vdfs.length !== 1 || !/^(?:gothicgame\.mod[ \t]+)?livingkhorinis\.mod$/i.test(vdfs[0][2].trim())) {
            throw err("INI не соответствует локальному пакету.");
        }
        if (vdfs[0][2].trim().split(/[ \t]+/).at(-1) !== volumeName) {
            throw err("имя MOD должно совпадать с INI, включая регистр букв.");
        }
        if (volume.length < 296 + 5*80 + 1024) throw err("архив MOD неполный.");
        const view = new DataView(volume.buffer, volume.byteOffset, volume.byteLength);
        const u32 = p => view.getUint32(p, true);
        const ascii = (a, b) => String.fromCharCode(...volume.subarray(a,b));
        const rows = [logisticsRows, industryRows, artRows, oldRows].find(r=>r.length === u32(272)) ?? oldRows;
        if (ascii(256,272) !== "PSVDSC_V2.00\n\r\n\r" ||
            u32(272) !== rows.length || u32(276) !== (rows.length - (rows === oldRows ? 4 : 8)) || u32(284) !== volume.length ||
            u32(288) !== 296 || u32(292) !== 0x50 || volume.length < 296 + 80*rows.length + 1024) {
            throw err("неподдерживаемый формат пакета MOD.");
        }
        let cursor = 296 + 80*rows.length, pos=0, end=0;
        for (const [i,[name,index,last=true]] of rows.entries()) {
            const p = 296 + i*80, dir = index >= 0, size = u32(p+68);
            const flags = (dir ? 0x80000000 : 0) + (last ? 0x40000000 : 0);
            if (ascii(p,p+64).trimEnd() !== name || u32(p+64) !== (dir ? index : cursor) ||
                u32(p+72) !== flags || u32(p+76) !== 0 ||
                (dir ? size !== 0 : !size || cursor+size > volume.length)) {
                throw err("содержимое пакета MOD не соответствует моду.");
            }
            if (dir) continue;
            if (name === "LIVINGKHORINIS.DAT") { pos=cursor; end=cursor+size; }
            else if (size > 1024*1024 || (name.endsWith(".TEX") ? ascii(cursor,cursor+4) !== "ZTEX" :
                size < 6 || volume[cursor] !== 0 || volume[cursor+1] !== 0xb1)) throw err("файл модели повреждён.");
            cursor += size;
        }
        if (end-pos < 1024 || end-pos > 64*1024*1024 || cursor !== volume.length) throw err("DAT повреждён.");
        const symCount = u32(pos+1);
        if (volume[pos] !== 0x32 || symCount < 16 || symCount >= Math.floor((end-pos-5)/4)) {
            throw err("DAT повреждён.");
        }
        const dat = new TextDecoder("windows-1252").decode(volume.subarray(pos,end));
        if (!/(^|[^a-z0-9_])LKN_ONWORLDINIT[\n\r\0]/i.test(dat) ||
            !/(^|[^a-z0-9_])PATCH_LIVINGKHORINIS_ADVANCE[\n\r\0]/i.test(dat)) {
            throw err("DAT не содержит игровых функций мода.");
        }
    }

    const overlayLimit = 16 + 64*1024 + 65*1024*1024;
    function overlayParts(bytes) {
        if (!(bytes instanceof Uint8Array) || bytes.length < 16 || bytes.length > overlayLimit ||
            String.fromCharCode(...bytes.subarray(0,8)) !== "LKHMOD01") throw err("выбери пакет .lkmod из сборщика.");
        const v = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
        const n = v.getUint32(8,true), m = v.getUint32(12,true);
        if (!n || n > 64*1024 || !m || m > 65*1024*1024 || n+m+16 !== bytes.length) throw err("пакет .lkmod повреждён.");
        const ini = bytes.subarray(16,16+n), volume = bytes.subarray(16+n);
        verify(ini,volume,file+".mod");
        return {ini,volume};
    }
    function mountOverlay(fs, bytes) {
        const {ini,volume} = overlayParts(bytes);
        const child = (key, fallback) => fs.files.get(key)?.path ?? fallback;
        if (!fs.files.get('data')?.isDir || !fs.files.get('system')?.isDir) throw err("сначала импортируй файлы Gothic II.");
        const data = child('data','Data'), system = child('system','System');
        const modvdf = child('data/modvdf',data+'/ModVDF');
        const files = [[system+'/'+file+'.ini',ini],[modvdf+'/'+file+'.mod',volume]];
        if (fs.files.get('data/modvdf') && !fs.files.get('data/modvdf').isDir) throw err("папка ModVDF недоступна.");
        for (const [path] of files) if (fs.files.get(path.toLowerCase())?.isDir) throw err("путь пакета занят папкой.");
        fs.addEntry(modvdf,true);
        for (const [path,contents] of files) {
            const entry = fs.addEntry(path,false,contents.length);
            entry.mem=contents;entry.hIdx=-1;entry.dirty=false;
        }
    }
    globalThis.LivingKhorinisOverlay = Object.freeze({limit:overlayLimit,parts:overlayParts,mount:mountOverlay});

    globalThis.LivingKhorinisPrepare = async ({FS,gameRoot}) => {
        if (typeof location !== "undefined" && new URLSearchParams(location.search).get("vanilla") === "1") {
            return null;
        }
        if (!FS || !gameRoot) throw err("нет доступа к импортированным данным.");
        const root = gameRoot.replace(/\/$/, "");
        const system = child(FS, root, "system");
        const data = child(FS, root, "data");
        const dir = data && child(FS, data, "modvdf");
        const ini = system && child(FS, system, file+".ini");
        const volume = dir && child(FS, dir, file+".mod");
        if (!ini && !volume) return null;
        if (!ini || !volume) {
            throw err("нужны обе части сборки: System/LivingKhorinis.ini и Data/ModVDF/LivingKhorinis.mod.");
        }
        const iniBytes = fileBytes(FS,ini,64*1024);
        verify(iniBytes, fileBytes(FS,volume,65*1024*1024), volume.substring(volume.lastIndexOf("/")+1));
        const version = new TextDecoder().decode(iniBytes).match(/^Version[ \t]*=[ \t]*(0\.[345])[ \t]*\r?$/im)?.[1] ?? 'legacy';
        return {ini: ini.substring(ini.lastIndexOf("/")+1),version};
    };
})();
