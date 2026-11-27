/* Verify a locally compiled Living Khorinis overlay before GothicDroid boots.
 * No uploads, fetches, binary patching, DLLs, or script compilation in browser. */
(() => {
    "use strict";
    const file = "LivingKhorinis";
    const folders = ["_WORK", "DATA", "SCRIPTS", "_COMPILED", "LIVINGKHORINIS.DAT"];
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
        const pos = 296 + 5 * 80;
        if (volume.length < pos + 1024) throw err("архив MOD неполный.");
        const view = new DataView(volume.buffer, volume.byteOffset, volume.byteLength);
        const u32 = p => view.getUint32(p, true);
        const ascii = (a, b) => String.fromCharCode(...volume.subarray(a,b));
        if (ascii(256,272) !== "PSVDSC_V2.00\n\r\n\r" ||
            u32(272) !== 5 || u32(276) !== 1 || u32(284) !== volume.length ||
            u32(288) !== 296 || u32(292) !== 0x50) {
            throw err("неподдерживаемый формат пакета MOD.");
        }
        for (let i = 0; i < folders.length; i++) {
            const p = 296 + i * 80;
            const last = i === folders.length - 1;
            if (ascii(p,p+64).trimEnd() !== folders[i] ||
                u32(p+64) !== (last ? pos : i+1) ||
                u32(p+68) !== (last ? volume.length-pos : 0) ||
                u32(p+72) !== (last ? 0x40000000 : 0xC0000000)) {
                throw err("содержимое пакета MOD не соответствует моду.");
            }
        }
        const symCount = u32(pos+1);
        if (volume[pos] !== 0x32 || symCount < 16 || symCount >= Math.floor((volume.length-pos-5)/4)) {
            throw err("DAT повреждён.");
        }
        const dat = new TextDecoder("windows-1252").decode(volume.subarray(pos));
        if (!/(^|[^a-z0-9_])LKN_ONWORLDINIT[\n\r\0]/i.test(dat) ||
            !/(^|[^a-z0-9_])PATCH_LIVINGKHORINIS_ADVANCE[\n\r\0]/i.test(dat)) {
            throw err("DAT не содержит игровых функций мода.");
        }
    }

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
        verify(fileBytes(FS,ini,64*1024), fileBytes(FS,volume,65*1024*1024), volume.substring(volume.lastIndexOf("/")+1));
        return {ini: ini.substring(ini.lastIndexOf("/")+1)};
    };
})();
