#!/usr/bin/env python3
"""Prepare an isolated Daedalus source tree; no downloads or game writes."""
import argparse
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RULES = HERE.parent / 'gothic2-living-war' / 'LivingKhorinis.d'
ADAPTER = HERE / 'LivingKhorinisNative.d'
MOD_DIR = 'ChatiLivingKhorinis'

# Decode as bytes: the source can use Windows-1250, 1251, 1252 or UTF-8.
STARTUP_ENTRY = re.compile(rb'(?im)^[ \t]*"?([^\r\n";*?]*[\\/]startup\.d)"?[ \t]*(?://[^\r\n]*)?\r?$')
BODY = re.compile(rb'\bfunc\s+void\s+init_newworld\s*\(\s*\)\s*\{', re.I)
COMMENT_OR_STRING = re.compile(rb'//[^\r\n]*|/\*[\s\S]*?\*/|"(?:\\.|[^"\\])*"')
HOOK = b'LKN_OnWorldInit(); // Chati Living Khorinis'
ADDON_BODY = re.compile(rb'\bfunc\s+void\s+init_addonworld\s*\(\s*\)\s*\{', re.I)
ADDON_HOOK = b'LKN_OnAddonInit(); // Chati Living Khorinis'
DEATH_BODY = re.compile(rb'\bfunc\s+void\s+zs_dead\s*\(\s*\)\s*\{', re.I)
DEATH_HOOK = b'if (((self.id >= 61086) && (self.id <= 61088)) || ((self.id >= 61100) && (self.id <= 61108))) { LKN_ScoutDeath(); };'


def ci_child(parent, name):
    matches = [e for e in parent.iterdir() if e.name.lower() == name.lower()]
    if len(matches) != 1:
        raise ValueError(f'Expected one {name} in {parent}, got {len(matches)}')
    return matches[0]


def patch_bytes(startup):
    # Preserve offsets, hide false matches in comments and string literals.
    masked = COMMENT_OR_STRING.sub(lambda m: b' ' * len(m.group()), startup)
    candidates = list(BODY.finditer(masked))
    if len(candidates) != 1:
        raise ValueError(f'Expected one INIT_NEWWORLD definition, got {len(candidates)}')
    if re.search(rb'\bLKN_OnWorldInit\s*\(', masked, re.I):
        raise ValueError('The source startup already references this mod.')
    addon = list(ADDON_BODY.finditer(masked))
    if len(addon) > 1 or re.search(rb'\bLKN_OnAddonInit\s*\(',masked,re.I):
        raise ValueError('Ambiguous or already patched AddonWorld init.')
    nl = b'\r\n' if b'\r\n' in startup else b'\n'
    placements = [(candidates[0].end(),HOOK)] + [(m.end(),ADDON_HOOK) for m in addon]
    for pos, hook in sorted(placements,reverse=True):
        suffix = b'' if startup[pos:pos+1] in (b'\n', b'\r') else nl
        startup = startup[:pos] + nl + b'    ' + hook + suffix + startup[pos:]
    return startup


def patch_human_death(data):
    masked = COMMENT_OR_STRING.sub(lambda m: b' ' * len(m.group()), data)
    candidates = list(DEATH_BODY.finditer(masked))
    if len(candidates) != 1 or re.search(rb'\bLKN_ScoutDeath\s*\(', masked, re.I):
        raise ValueError('Unexpected human death state; cannot track recon casualties safely.')
    pos = candidates[0].end()
    nl = b'\r\n' if b'\r\n' in data else b'\n'
    return data[:pos] + nl + b'    ' + DEATH_HOOK + nl + data[pos:]


def prepare(source, dest, rules=RULES):
    source, dest = source.resolve(strict=True), dest.resolve()
    if not source.is_dir():
        raise ValueError(f'Not a CONTENT directory: {source}')
    if dest.exists() or dest.is_relative_to(source):
        raise ValueError('Output must be a new directory outside the source tree.')
    if any(p.is_symlink() for p in source.rglob('*')):
        raise ValueError('Source tree contains symlinks. Use a normal directory copy.')
    if any(p.name.lower() == MOD_DIR.lower() for p in source.iterdir()):
        raise ValueError('The source already contains the mod directory.')
    src = ci_child(source, 'Gothic.src')
    data = src.read_bytes()
    # Avoid injecting before an entry inside a multiline comment while
    # leaving quoted .src path strings and inline comments available.
    masked = re.sub(rb'/\*[\s\S]*?\*/', lambda m: re.sub(rb'[^\r\n]', b' ', m.group()), data)
    entries = list(STARTUP_ENTRY.finditer(masked))
    if len(entries) != 1:
        raise ValueError('Expected one explicit Story\\Startup.d in Gothic.src; '
                         'see README for manual source integration.')
    parts = re.split(r'[/\\]', entries[0].group(1).decode('ascii').strip())
    if any(p in ('.', '..', '') or ':' in p for p in parts):
        raise ValueError('Startup path must be relative to CONTENT.')
    startup = source
    for part in parts:
        startup = ci_child(startup, part)
    startup_patch = patch_bytes(startup.read_bytes())
    death = [p for p in source.rglob('*') if p.is_file() and p.name.lower()=='zs_dead.d' and p.parent.name.lower()=='zs_human']
    if len(death) > 1:
        raise ValueError('Expected at most one human ZS_Dead source.')
    dead_patch = patch_human_death(death[0].read_bytes()) if death else None
    core = rules.resolve(strict=True).read_bytes()
    adapter = ADAPTER.read_bytes()
    nl = b'\r\n' if b'\r\n' in data else b'\n'
    pos = entries[0].start()
    new_src = data[:pos] + (MOD_DIR + '\\LivingKhorinis.d').encode() + nl + (MOD_DIR + '\\LivingKhorinisNative.d').encode() + nl + data[pos:]
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.mkdir()
    try:
        shutil.copytree(source, dest, dirs_exist_ok=True)
        mod = dest / MOD_DIR
        mod.mkdir()
        (mod / 'LivingKhorinis.d').write_bytes(core)
        (mod / 'LivingKhorinisNative.d').write_bytes(adapter)
        (dest / src.name).write_bytes(new_src)
        (dest / startup.relative_to(source)).write_bytes(startup_patch)
        if dead_patch is not None:
            (dest / death[0].relative_to(source)).write_bytes(dead_patch)
    except Exception:
        shutil.rmtree(dest)
        raise
    return dest / src.name


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_content', type=Path, help='NotR MDK CONTENT directory')
    parser.add_argument('output_content', type=Path, help='new isolated CONTENT directory')
    parser.add_argument('--rules', type=Path, default=RULES, help='core LivingKhorinis.d override')
    opt = parser.parse_args()
    try:
        output = prepare(opt.source_content, opt.output_content, opt.rules)
    except (OSError, ValueError) as exc:
        print(f'Not staged: {exc}', file=sys.stderr)
        return 1
    print(f'Staged: {output}')
    print('Compile this source locally into GOTHIC.DAT; the Steam installation was not changed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
