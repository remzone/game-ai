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
import stock

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
    "Report on the camp.": "Доложить о лагере.",
    "Abandon the scouting mission.": "Отказаться от разведки.",
    "Scout: Forest camp": "Разведка: Лесной лагерь",
    "Scout the forest camp.": "Разведать лесной лагерь.",
    "Scout: Bridge camp": "Разведка: Лагерь у моста",
    "Scout the bridge camp.": "Разведать лагерь у моста.",
    "Scout: River camp": "Разведка: Лагерь у брода",
    "Scout the river camp.": "Разведать лагерь у брода.",
    "Forest camp second sentry": "Лесной лагерь: второй часовой",
    "Forest camp patrol leader": "Лесной лагерь: старший дозора",
    "Forest camp patrol soldier": "Лесной лагерь: боец дозора",
    "Bridge camp second sentry": "Лагерь у моста: второй часовой",
    "Bridge camp patrol leader": "Лагерь у моста: старший дозора",
    "Bridge camp patrol soldier": "Лагерь у моста: боец дозора",
    "River camp second sentry": "Лагерь у брода: второй часовой",
    "River camp patrol leader": "Лагерь у брода: старший дозора",
    "River camp patrol soldier": "Лагерь у брода: боец дозора",
    "Eberhard, Onar patrol commander": "Эберхард, командир дозоров Онара",
    "Reach the camp, count the sentries and report. If you clear the post, we can occupy it without a fight.": "Дойди до лагеря, сосчитай часовых и доложи. Если зачистишь пост, дозор займёт его без боя.",
    "Follow the road from the Dead Harpy towards the woods.": "Ищи лесной лагерь на дороге от «Мёртвой гарпии» в сторону леса.",
    "Look for the camp on the road by Akil's farm.": "Ищи лагерь у моста на дороге рядом с фермой Акила.",
    "Find the camp by the stream on the road towards Bengar.": "Ищи лагерь у ручья на дороге к Бенгару.",
    "Living sentries observed: ": "Замечено живых часовых: ",
    "I abandoned the assignment.": "Я отказался от разведки.",
    "The report is useful, but we need provisions before we can send a patrol.": "Доклад полезен. Но дозор выйдет только после пополнения запасов.",
    "I reported the surviving sentries: ": "Я доложил, сколько часовых осталось: ",
    "Then no assault. Our patrol will march in and take the empty post.": "Тогда без штурма. Наш дозор выдвинется и займёт пустой пост.",
    "We know their numbers now. The patrol will move in against the remaining guards.": "Теперь знаем их число. Дозор выдвинется против оставшихся часовых.",
    "The patrol was defeated. The camp did not change hands.": "Дозор разбит. Лагерь не сменил владельца.",
    "Our patrol reached the camp and took control.": "Наш дозор дошёл до лагеря и занял его.",
    "Under Khorinis control.": "Под контролем Хориниса.",
    "Under Onar's control.": "Под контролем Онара.",
    "Held by the Fire Order.": "Лагерь держит Орден Огня.",
    "Held by the Water Order.": "Лагерь держит Орден Воды.",
    "Held by the Brotherhood.": "Лагерь держит Братство.",
    "Still independent.": "Лагерь пока нейтрален.",
    "Forest crossing camp": "Лесной лагерь у перекрёстка",
    "Bridge road camp": "Лагерь на подходе к мосту",
    "Riverbank camp": "Лагерь у речного брода",
    "Lighthouse road watch": "Пост на дороге к маяку",
    "Lobart road watch": "Пост у развилки Лобарта",
    "Xardas road watch": "Пост на дороге к Ксардасу",
    "Tavern road watch": "Пост на дороге к таверне",
    "Valley approach watch": "Пост на подходе к перевалу",
    "Valley of Mines garrison": "Гарнизон перевала Долины Рудников",
    "Forest camp sentry": "Часовой лесного лагеря",
    "Bridge camp sentry": "Часовой лагеря у моста",
    "River camp sentry": "Часовой лагеря у брода",
    "Khorinis guard on Lighthouse Road": "Стражник Хориниса на дороге к маяку",
    "Khorinis guard at the farm junction": "Стражник Хориниса у развилки ферм",
    "Khorinis guard on Xardas Road": "Стражник Хориниса на дороге к Ксардасу",
    "Khorinis guard on the tavern road": "Стражник Хориниса на дороге к таверне",
    "Khorinis guard below the pass": "Стражник Хориниса на подходе к перевалу",
    "Gerwin, captain of the pass": "Гервин, командир перевала",
    "Balin, knight of the pass": "Балин, рыцарь перевала",
    "Hardin, knight of the pass": "Хардин, рыцарь перевала",
    "Otwin, pass militia": "Отвин, ополченец перевала",
    "Gernot, pass militia": "Гернот, ополченец перевала",
    "Arnulf, pass militia": "Арнульф, ополченец перевала",
    "The pass is garrisoned to keep the Mining Valley road closed to the orcs.": "Гарнизон держит перевал, чтобы орки не вышли на дорогу из Долины Рудников.",
    "The road watch escorts supplies and protects the route for Khorinis.": "Караул охраняет дорогу Хориниса и сопровождает припасы.",
    "Travelers shelter here. The camp changes hands when a faction can keep it supplied.": "Здесь ночуют путники. Лагерь держит тот, кто может снабжать свой караул.",
    "Edgar, Khorinis assault soldier": "Эдгар, штурмовик Хориниса",
    "Valden, Onar assault soldier": "Вальден, штурмовик Онара",
    "Fire monastery guardhouse": "Караульный дом Монастыря Огня",
    "Albin, Fire Magus": "Альбин, маг Огня",
    "Raban, monastery guard": "Рабан, стражник монастыря",
    "Silas, monastery guard": "Силас, стражник монастыря",
    "Yorik, Brotherhood guard": "Йорик, стражник Братства",
    "The monastery keeps its own watch. Our battle mages only serve Khorinis paladins.": "В монастыре свой караул. Боевых магов мы отправляем только к паладинам.",
    "Khorinis has hired a Fire mage.": "Хоринис уже нанял мага Огня.",
    "Water sentry outpost": "Сторожевой пост Магов Воды",
    "Water Magi expedition camp": "Экспедиционный лагерь Магов Воды",
    "Brotherhood shelter": "Укрытие Братства",
    "Nerian, Water Magus": "Нериан, маг Воды",
    "Tarek, Water sentry": "Тарек, стражник Воды",
    "Ivar, Water sentry": "Ивар, стражник Воды",
    "Maren, Water acolyte": "Марен, послушник Воды",
    "Darin, Water acolyte": "Дарин, послушник Воды",
    "Sorem, Brotherhood guru": "Сорем, гуру Братства",
    "Varek, Brotherhood guard": "Варек, стражник Братства",
    "Larik, Brotherhood novice": "Ларик, послушник Братства",
    "Aurel, Khorinis Fire mage": "Аурель, маг Огня Хориниса",
    "Nelvar, Khorinis Water mage": "Нелвар, маг Воды Хориниса",
    "Sevran, Onar Water mage": "Севран, маг Воды у Онара",
    "Koran, Brotherhood mercenary": "Коран, болотник на службе Онара",
    "Ask about the camp and its contracts.": "Расскажи о лагере и договорах.",
    "Give the camp a loaf of bread.": "Передать лагерю хлеб.",
    "The Water watch guards the ruins. We send mages to either side under contract, but our camp stays neutral.": "Стражники охраняют руины. Мы отправляем магов обеим сторонам по договору. Лагерь остаётся нейтральным.",
    "Our Brotherhood shelters here. We hire out to Onar, never the paladins.": "Здесь укрывается Братство. Мы заключаем договоры с Онаром, но не с паладинами.",
    "Camp rations: ": "Провизия лагеря: ",
    "Onar has hired our caster.": "Онар уже нанял нашего мага.",
    "Khorinis has hired a Water mage.": "Хоринис уже нанял мага Воды.",
    "Onar has hired a Water mage.": "Онар уже нанял мага Воды.",
    "The camp accepts your bread.": "Лагерь принял твой хлеб.",
    "Emil, fort carpenter": "Эмиль, плотник Привратного форта",
    "What is happening at this post?": "Что происходит на заставе?",
    "Give the post one bread (+5 rations).": "Передать заставе хлеб (+5 провизии).",
    "Give this post priority for the next convoy.": "Попросить направить следующий обоз сюда.",
    "End conversation.": "Закончить разговор.",
    "We watch the crossroads. Whoever controls the road feeds the watch.": "Мы держим перекрёсток. Кто контролирует дорогу, тот и снабжает караул.",
    "The ridge guards the farm road. Fresh supplies keep the watch on duty.": "Отсюда мы держим путь к фермам. Без припасов караулу не выстоять.",
    "You will find Jan and the logs at the harbour sawbench. No rations, no timber.": "Ян работает у козел с брёвнами в порту. Без пайка склад не получает лес.",
    "Mikkel works the vein beside the guard. Without rations we cannot dig.": "Миккель у рудной жилы рядом с караулом. Без пайка добыча встанет.",
    "Stay by the road. The watch has spotted mercenaries nearby.": "Не сходи с дороги. Дозор заметил наёмников неподалёку.",
    "We held the fort. Food for the watch gives us a chance to hold it next time.": "Мы удержали форт. Запас еды для караула поможет выдержать следующий налёт.",
    "Post rations: ": "Провизия на заставе: ",
    "Thank you. We added your bread to the post's stores.": "Спасибо. Хлеб добавили в запас заставы.",
    "I have passed on the order. We get the next convoy if the road stays open.": "Передал приказ. Следующий обоз пойдёт сюда, если путь останется открытым.",
    "Gate road fort": "Форт у дороги Хориниса",
    "Bertold, captain of the Gate Fort": "Бертольд, капитан Привратного форта",
    "Wulf, Gate Fort paladin": "Вульф, паладин Привратного форта",
    "Odo, Gate Fort guard": "Одо, охранник Привратного форта",
    "Einar, Onar raider": "Эйнар, наёмник Онара",
    "Knut, Onar raider": "Кнут, наёмник Онара",
    "Torben, Onar raider": "Торбен, наёмник Онара",
    "Gate Fort is under attack!": "На Привратный форт напали!",
    "The paladins repelled the raid.": "Паладины отбили нападение.",
    "Saw bench and logs": "Козлы и брёвна",
    "Exposed iron vein": "Жила железной руды",
    "Martin, Lobart farm carrier": "Мартин, возчик Лобарта",
    "Gunnar, Onar farm carrier": "Гуннар, возчик Онара",
    "Erik, Sekob farm carrier": "Эрик, возчик Секоба",
    "Rolf, Bengar farm carrier": "Рольф, возчик Бенгара",
    "Konrad, Khorinis provisions": "Конрад, обоз Хориниса",
    "Adalmar, convoy paladin": "Адальмар, паладин обоза",
    "Falk, convoy guard": "Фальк, охранник обоза",
    "Gerold, Onar provisions": "Герольд, обоз Онара",
    "Ulrik, convoy mercenary": "Ульрик, наёмник обоза",
    "Sven, convoy guard": "Свен, охранник обоза",
    "Food (docks / mine): ": "Провизия (порт / шахта): ",
    "Paladin of the supply watch": "Паладин снабжения",
    "Mercenary of the supply watch": "Наёмник снабжения",
    "Harbour timber depot building": "Лесной склад в порту",
    "Old mine supply camp": "Лагерь у старой шахты",
    "Jan, harbour sawyer": "Ян, пильщик в порту",
    "Mikkel, ore miner": "Миккель, рудокоп",
    ": Khorinis paladins": ": паладины Хориниса",
    ": Onar's mercenaries": ": наёмники Онара",
    "; shift suspended.": "; смена остановлена.",
    "Harbour timber depot": "Лесной склад в порту",
    "Old mine camp": "Застава у старой шахты",
    "Who holds the timber depot and mine?": "Кто держит лесной склад и шахту?",
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
        stock.apply(staged.parent / stage.MOD_DIR / "LivingKhorinisNative.d", gamedata)
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
