#!/usr/bin/env python3
"""Compile a local Living Khorinis overlay. Does not modify the installed game."""
import argparse
import hashlib
import platform
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path
from urllib.request import urlopen

import pack
import stage

GDC_VERSION = "0.9.5"
GDC_BINARIES = {
    "linux-arm64": "0d40d2af62e062f6c9abcf129c4e405dfe0a76c9969143442213f38372b7a0b0",
    "linux-x64": "fd4749ac0fc0aefa76bb002e7216b5b3c2bb759521864d1db26176d492452b62",
    "macos-arm64": "732e59efae64dfce700c64dbb6e530a79c3c8a8aed7655605ff2a7e47f93a000",
    "macos-x64": "33de95e7fe67b76ab9fb58dd51e08e75814c7c0db500cf081107c9619a19ae2a",
    "windows-arm64.exe": "07d1e1d2da5c70860c32a327917b9e67db821724c5ed3aea064acca9c8b494bf",
    "windows-x64.exe": "a85fd199099fb39e1eb07aeec8bed8a82e8cdc13c8b7df86bbfd36c8e3252345",
}
GDC_BUILTINS_SHA = "71fc487e898238450316fafdb74ad5f6cb154d9336f63a30c3148df4fb8f8f0a"
RECONSTRUCTED = {
    "en": ("d78aec9d5364c45b204f6f72edb56ea6b6399acb", "4f83c176d1f46d2b3ca15e81ec805b1c9177a8b77d8b0b492fc33f422e5cefde"),
    "ru": ("c7cf98e0b8e0a9c9a8b09f0845681907911eab4f", "140bff2fbb1b27fba2d1535e85690221169a2814faf826ac40cdfefcdb9c8ab9"),
}


RU_TEXT = {
    "Road supply shelter": "Дорожный склад",
    "Ridge watchtower": "Сторожевая башня на гребне",
    "Road garrison soldier": "Боец гарнизона перекрёстка",
    "Ridge garrison soldier": "Боец гарнизона дороги Секоба",
    "Ridge lookout": "Дозорный у дороги Секоба",
    "Khorinis gate watch": "Дозорный Хориниса у ворот",
    "Onar farm worker": "Работник фермы Онара",
    "Sekob farm worker": "Работник фермы Секоба",
    "Bengar farm worker": "Работник фермы Бенгара",
    "Independent farm worker": "Работник фермы Акила",
    "Novice of the Fire order": "Послушник Огня",
    "Novice of the Water order": "Послушник Воды",
    "Expedition guard of Khorinis": "Участник дозора Хориниса",
    "Expedition mercenary of Onar": "Участник дозора Онара",
    "Show supplies of the factions.": "Сводка по снабжению фракций.",
    "Khorinis": "Хоринис",
    "Onar": "Онар",
    "Akil": "Акил",
    "Fire order": "Орден Огня",
    "Water order": "Орден Воды",
    " L/I/G/F: ": " Л/Ж/З/Е: ",
    " Units: ": " Бойцы: ",

    "Neutral tavern lookout": "Нейтральный дозорный",
    "Dead Harpy crossing: the lookout is neutral.": "Дозор у Мёртвой гарпии пока нейтрален.",
    "Marek, road quartermaster": "Марек, кладовщик заставы",
    "Khorinis militia lookout": "Дозорный ополчения Хориниса",
    "Onar's mercenary lookout": "Дозорный наёмников Онара",
    "Dead Harpy crossing: Khorinis militia holds the post.": "Заставу у Мёртвой гарпии держит ополчение Хориниса.",
    "Dead Harpy crossing: Onar's mercenaries hold the post.": "Заставу у Мёртвой гарпии держат наёмники.",
    "The militia supply store is full.": "Запасы ополчения полны.",
    "The mercenary supply store is full.": "Запасы наёмников полны.",
    "Your provisions were delivered.": "Провизия отправлена.",
    "Who holds the road?": "Кто держит заставу?",
    "Send the militia provisions (1 bread).": "Передать провизию ополчению (1 хлеб).",
    "Send the mercenaries provisions (1 bread).": "Передать провизию наёмникам (1 хлеб).",
    "Leave.": "Уйти.",
}


def localize(staged, lang):
    if lang != "ru":
        return
    adapter = staged / stage.MOD_DIR / "LivingKhorinisNative.d"
    raw = adapter.read_bytes()
    for en, ru in RU_TEXT.items():
        original = b'"' + en.encode("ascii") + b'"'
        if raw.count(original) != 1:
            raise ValueError("Russian translation key mismatch: " + en)
        raw = raw.replace(original, b'"' + ru.encode("cp1251") + b'"')
    adapter.write_bytes(raw)


def download(url, dest, digest, limit):
    hasher = hashlib.sha256()
    total = 0
    with urlopen(url, timeout=60) as response, dest.open("wb") as f:
        while chunk := response.read(65536):
            total += len(chunk)
            if total > limit:
                raise ValueError("Download exceeds expected size: " + url)
            hasher.update(chunk)
            f.write(chunk)
    if hasher.hexdigest() != digest:
        raise ValueError("SHA-256 mismatch. Refusing to use: " + url)
    return dest


def compiler_suffix():
    systems = {"Linux": "linux", "Darwin": "macos", "Windows": "windows"}
    machines = {"x86_64": "x64", "amd64": "x64", "aarch64": "arm64", "arm64": "arm64"}
    family = systems.get(platform.system())
    cpu = machines.get(platform.machine().lower())
    if not family or not cpu:
        raise ValueError("Unsupported platform for the downloaded GDC; pass --compiler.")
    return family + "-" + cpu + (".exe" if family == "windows" else "")


def retrieve_sources(archive, dest, commit):
    prefix = (f"gothic-2-addon-scripts-{commit}", "_work", "Data", "Scripts", "Content")
    nfiles = 0
    with tarfile.open(archive) as tar:
        for member in tar:
            parts = member.name.split("/")
            if tuple(parts[:len(prefix)]) != prefix or len(parts) <= len(prefix) or member.isdir():
                continue
            relative = parts[len(prefix):]
            if not member.isfile() or any(
                not p or p in (".", "..") or any(ch in p for ch in "\\:") for p in relative
            ):
                raise ValueError("Unsafe member in source archive.")
            target = dest.joinpath(*relative)
            target.parent.mkdir(parents=True, exist_ok=True)
            with tar.extractfile(member) as src, target.open("xb") as out:
                shutil.copyfileobj(src, out)
            nfiles += 1
    if nfiles == 0:
        raise ValueError("No Gothic II source files in the verified reference archive.")
    return dest


def normalize_for_gdc(content):
    # The original tool accepts a form-feed as whitespace, and some historical
    # source extracts spell the NPC self reference "slf". Apply GDC-adaptations
    # outside comments/literals to the temporary staging copy only.
    tokens = re.compile(rb'//[^\r\n]*|/\*[\s\S]*?\*/|"(?:\\.|[^"\\])*"|\x0c|\bslf(?=[ \t]*\.)', re.I)

    def rewrite(m, fix_alias):
        val = m.group()
        if val == b"\x0c":
            return b" "
        if fix_alias and val.lower() == b"slf":
            return b"self"
        return val

    for p in content.rglob("*"):
        if p.suffix.lower() != ".d" or not p.is_file():
            continue
        old = p.read_bytes()
        contains_declared_slf = re.search(rb'\bvar\s+C_NPC\s+slf\b', old, re.I)
        new = tokens.sub(lambda m: rewrite(m, not contains_declared_slf), old)
        if old != new:
            p.write_bytes(new)


def build(args):
    game = args.steam_folder.resolve(strict=True)
    out = args.output.resolve()
    if out.exists() or out.is_relative_to(game) or game.is_relative_to(out):
        raise ValueError("Use an empty destination outside Steam, not inside the game tree.")
    gamedata = stage.ci_child(game, "Data")
    system = stage.ci_child(game, "System")
    base_ini = stage.ci_child(system, "GothicGame.ini")
    if not any(p.is_file() and p.suffix.lower() == ".vdf" and
               "addon" in p.stem.lower() for p in gamedata.iterdir()):
        raise ValueError("This does not appear to be an installed Gothic II: Night of the Raven.")
    pack.mod_ini(base_ini.read_bytes())

    with tempfile.TemporaryDirectory(prefix="living-khorinis-build-") as scratch:
        scratch = Path(scratch)
        if args.compiler:
            compiler = args.compiler.resolve(strict=True)
        else:
            key = compiler_suffix()
            compiler = scratch / ("gdc-" + key)
            print(f"Downloading verified GDC {GDC_VERSION}…", flush=True)
            origin = "https://github.com/dzieje-khorinis/DaedalusCompiler"
            download(f"{origin}/releases/download/v{GDC_VERSION}/{compiler.name}",
                     compiler, GDC_BINARIES[key], 40 * 1024**2)
            compiler.chmod(0o700)
        if args.externals:
            externals = args.externals.resolve(strict=True)
        else:
            url = (f"https://raw.githubusercontent.com/dzieje-khorinis/DaedalusCompiler/v{GDC_VERSION}/"
                   "src/DaedalusCompiler/DaedalusBuiltins/gothic.d")
            externals = download(url, scratch / "runtime.d", GDC_BUILTINS_SHA, 512 * 1024)
        if args.content:
            content = args.content.resolve(strict=True)
        else:
            commit, digest = RECONSTRUCTED[args.lang]
            print(f"Downloading matching NotR 2.7 script sources ({args.lang.upper()})…", flush=True)
            url = "https://codeload.github.com/VaanaCZ/gothic-2-addon-scripts/tar.gz/" + commit
            archive = download(url, scratch / "reference.tar.gz", digest, 20 * 1024**2)
            content = retrieve_sources(archive, scratch / "reference", commit)

        staged = stage.prepare(content, scratch / "staged")
        localize(staged.parent, args.lang)
        normalize_for_gdc(staged.parent)
        dat = scratch / "GOTHIC.DAT"
        print("Compiling Daedalus to a local DAT…", flush=True)
        subprocess.run([str(compiler), str(staged), "--runtime", str(externals),
                        "--output-dat", str(dat)], cwd=scratch, check=True)
        pack.package(dat, base_ini, out)

    return out


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("steam_folder", type=Path, help="Steam > Gothic II > Browse local files")
    p.add_argument("output", type=Path, help="a new temporary folder for the local overlay")
    p.add_argument("--lang", choices=RECONSTRUCTED, required=True,
                   help="must match the installed Steam game language (en or ru)")
    p.add_argument("--content", type=Path, help="use a local matching NotR CONTENT tree instead")
    p.add_argument("--compiler", type=Path, help="use a local GDC 0.9.5 executable instead")
    p.add_argument("--externals", type=Path, help="use a local GDC DaedalusBuiltins/gothic.d instead")
    try:
        out = build(p.parse_args())
    except (OSError, ValueError, subprocess.CalledProcessError, tarfile.TarError) as exc:
        print("Build stopped:", exc, file=sys.stderr)
        return 1
    print("Local mod built:", out)
    print("Use the two files in a copy of your Gothic II folder; see README.md. Do not redistribute.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
