#!/usr/bin/env python3
"""Package a user's locally compiled NotR GOTHIC.DAT into an isolated .mod."""
import argparse
import re
import struct
import sys
from pathlib import Path

STEM = "LivingKhorinis"
INI_NAME = f"{STEM}.ini"
MOD_NAME = f"{STEM}.mod"
DAT_NAME = f"{STEM.upper()}.DAT"
G2_SIGNATURE = b"PSVDSC_V2.00\n\r\n\r"
DIRECTORY_LAST, FILE_LAST = 0xC0000000, 0x40000000
REQUIRED_SYMBOLS = (
    b"INIT_NEWWORLD", b"PC_HERO", b"LKN_ONWORLDINIT",
    b"LKN_QUARTERMASTER", b"LKN_POSTGUARD",
    b"PATCH_LIVINGKHORINIS_ADVANCE",
)
_BASE_INI = re.compile(rb"(?im)^([ \t]*)\[([a-z]+)\][ \t]*(?:;[^\r\n]*)?\r?$")


def check_dat(data):
    # We do not interpret bytecode. Check known modified/NotR symbol names,
    # the table count and bounds to fail fast on a wrong build or vanilla DAT.
    if not 1024 <= len(data) <= 64 * 1024 * 1024:
        raise ValueError("Compiled DAT is missing, truncated or unexpectedly large.")
    count, = struct.unpack_from("<I", data, 1)
    if data[0] != 0x32 or not 16 <= count < (len(data) - 5) // 4:
        raise ValueError("Invalid DAT header/symbol count.")
    names = data.upper()
    for symbol in REQUIRED_SYMBOLS:
        if not re.search(rb"(?<![A-Z0-9_])" + symbol + rb"[\r\n\0]", names):
            raise ValueError("NotR mod DAT lacks " + symbol.decode())


def vdf_for(data, visuals=None):
    if visuals is None:
        rows = [("_WORK", 1, DIRECTORY_LAST), ("DATA", 2, DIRECTORY_LAST),
                ("SCRIPTS", 3, DIRECTORY_LAST), ("_COMPILED", 4, DIRECTORY_LAST),
                (DAT_NAME, data, FILE_LAST)]
    else:
        meshes = sorted(name for name in visuals if name.endswith(".MRM"))
        textures = sorted(name for name in visuals if name.endswith(".TEX"))
        dat_index = 8 + len(meshes)
        rows = [("_WORK", 1, DIRECTORY_LAST), ("DATA", 2, DIRECTORY_LAST),
                ("MESHES", 5, 0x80000000), ("SCRIPTS", 6, 0x80000000),
                ("TEXTURES", 7, DIRECTORY_LAST), ("_COMPILED", 8, DIRECTORY_LAST),
                ("_COMPILED", dat_index, DIRECTORY_LAST), ("_COMPILED", dat_index+1, DIRECTORY_LAST)]
        rows += [(name,visuals[name],FILE_LAST if name == meshes[-1] else 0) for name in meshes]
        rows += [(DAT_NAME,data,FILE_LAST)]
        rows += [(name,visuals[name],FILE_LAST if name == textures[-1] else 0) for name in textures]
    root = 296
    offset = root + 80 * len(rows)
    files = [val for _,val,_ in rows if isinstance(val, bytes)]
    out = bytearray(b"Living Khorinis local compiler output".ljust(256, b"\x1a"))
    out += G2_SIGNATURE
    out += struct.pack("<6I", len(rows), len(files), (46 << 25) | (1 << 21) | (1 << 16),
                       offset + sum(map(len,files)), root, 0x50)
    for name, value, flags in rows:
        out += name.encode("ascii").ljust(64, b" ")
        if isinstance(value, bytes):
            out += struct.pack("<4I", offset, len(value), flags, 0)
            offset += len(value)
        else:
            out += struct.pack("<4I", value, 0, flags, 0)
    return bytes(out) + b"".join(files)


def mod_ini(base):
    seen = {}
    for section in _BASE_INI.finditer(base):
        name = section.group(2).lower()
        if name in seen:
            raise ValueError("Base INI contains duplicate [" + name.decode() + "] sections.")
        seen[name] = section
    if b"files" not in seen or b"settings" not in seen:
        raise ValueError("Use the original NotR System/GothicGame.ini as the template.")
    all_sections = list(seen.values())
    start = seen[b"files"].end()
    end = next((v.start() for v in all_sections if v.start() > start), len(base))
    body = base[start:end]
    if not re.search(rb"(?im)^[ \t]*game[ \t]*=[ \t]*content[\\/]gothic\b", body):
        raise ValueError("Base INI does not reference the original NotR Gothic game parser.")
    stock_vdfs = re.findall(rb"(?im)^[ \t]*vdf[ \t]*=[ \t]*([^\r\n;]*)", body)
    if len(stock_vdfs) > 1 or any(v.strip().lower() not in (b"", b"gothicgame.mod") for v in stock_vdfs):
        raise ValueError("Base INI selects other mod volumes; use an unmodified game INI.")
    vdf_list = (stock_vdfs[0].strip() + b"  " if stock_vdfs and stock_vdfs[0].strip() else b"") + MOD_NAME.encode()
    body = re.sub(rb"(?im)^[ \t]*(?:game|vdf)[ \t]*=[^\r\n]*", b"", body)
    nl = b"\r\n" if b"\r\n" in base else b"\n"
    new_files = nl + ('Game=Content\\' + STEM).encode() + nl + b'VDF=' + vdf_list + nl + body.lstrip(b"\r\n")
    # Preserve auxiliary parser paths, output units, game controls and exact locale.
    diff = base[:start].rstrip(b"\r\n") + new_files + base[end:]
    info = _BASE_INI.search(diff)
    for current in _BASE_INI.finditer(diff):
        if current.group(2).lower() == b"info":
            info = current
            break
    title = b"[INFO]" + nl + b"Title=Living Khorinis - Dead Harpy Crossing" + nl + b"Version=0.6" + nl + b"Authors=Chati" + nl + nl
    if info is not None and info.group(2).lower() == b"info":
        e = _BASE_INI.search(diff, info.end())
        return diff[:info.start()] + title + diff[e.start() if e else len(diff):]
    return title + diff


def package(dat, ini, out):
    out = out.resolve()
    if out.exists():
        raise ValueError("Output must be a new directory. Refusing to overwrite existing files.")
    # Build both outputs before creating anything on disk.
    raw = dat.read_bytes()
    check_dat(raw)
    manifest = mod_ini(ini.read_bytes())
    from buildings import assets
    volume = vdf_for(raw, assets())
    (out / "Data" / "ModVDF").mkdir(parents=True)
    (out / "System").mkdir()
    (out / "Data" / "ModVDF" / MOD_NAME).write_bytes(volume)
    (out / "System" / INI_NAME).write_bytes(manifest)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("compiled_dat", type=Path)
    p.add_argument("original_gothicgame_ini", type=Path)
    p.add_argument("output_dir", type=Path)
    a = p.parse_args()
    try:
        package(a.compiled_dat, a.original_gothicgame_ini, a.output_dir)
    except (OSError, ValueError) as exc:
        print("Not packaged:", exc, file=sys.stderr)
        return 1
    print(f"Local overlay built: {a.output_dir}")
    print("Contains compiled game scripts. Keep it local; do not publish this overlay.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
