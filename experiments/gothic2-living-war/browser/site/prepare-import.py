"""Build a local Gothic II ZIP with the Living Khorinis overlay. No upload."""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED

HERE=Path(__file__).resolve().parent
PICK={'.vdf','.ini','.bik','.bk2','.dat','.zen','.bin','.csl','.wav','.mrm','.tex','.mdh','.mdm','.mds','.msb','.man','.mmb','.fnt','.tga','.dds','.dls','.sgt','.sty','.dls','.pfx','.ou','.src'}
SKIP={'savegames','savegames_livingkhorinis','modvdf','backup'}

def child(root,name):
    return next((p for p in root.iterdir() if p.name.lower()==name.lower() and p.is_dir() and not p.is_symlink()),None)

def files(root):
    for folder in ('Data','System','_work'):
        base=child(root,folder)
        if base is None:
            if folder=='_work':continue
            raise ValueError(f'В установке нет папки {folder}.')
        for parent,dirs,items in os.walk(base,followlinks=False):
            p=Path(parent)
            dirs[:]=[d for d in dirs if d.lower() not in SKIP and not d.lower().startswith('savegame') and not (p/d).is_symlink()]
            for name in sorted(items):
                f=p/name
                if f.is_symlink() or f.suffix.lower() not in PICK:continue
                if f.name.lower()=='livingkhorinis.ini':continue
                path=f.relative_to(root).as_posix()
                yield f,path

def archive_game(game, overlay, target):
    if target.exists():
        raise FileExistsError('ZIP с таким именем уже есть, выбери другое имя.')
    if target.is_relative_to(game):
        raise ValueError('Создавай ZIP за пределами папки Steam.')
    paths=list(files(game))
    if not any(name.lower().startswith('data/') and name.lower().endswith('.vdf') for _,name in paths):
        raise ValueError('Не найдены оригинальные архивы Data/*.vdf.')
    data=[(f,f.relative_to(overlay).as_posix()) for f in overlay.rglob('*') if f.is_file()]
    if sorted(n for _,n in data)!=['Data/ModVDF/LivingKhorinis.mod','System/LivingKhorinis.ini']:
        raise ValueError('Локальная сборка мода неполная.')
    size=sum(f.stat().st_size for f,_ in paths+data)
    if shutil.disk_usage(target.parent).free < size+64*1024**2:
        raise OSError('Рядом с выбранным ZIP недостаточно свободного места.')
    partial=target.with_name(target.name+'.partial')
    if partial.exists():raise FileExistsError(partial)
    try:
        with ZipFile(partial,'x',ZIP_STORED,allowZip64=True) as z:
            for f,n in paths+data:z.write(f,n)
        if target.exists():raise FileExistsError(target)
        partial.rename(target)
    finally:
        partial.unlink(missing_ok=True)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('steam_folder',type=Path)
    p.add_argument('--lang',choices=['ru','en'],required=True)
    p.add_argument('--output',type=Path,default=Path('LivingKhorinis-import.zip'))
    a=p.parse_args()
    try:
        game=a.steam_folder.resolve(strict=True)
        dest=a.output.resolve()
        if dest.exists() or dest.is_relative_to(game):
            raise ValueError('Выбери новый ZIP за пределами Steam.')
        with tempfile.TemporaryDirectory(prefix='kh-import-') as temp:
            overlay=Path(temp)/'overlay'
            subprocess.run([sys.executable,'-B',str(HERE/'gothic2-native-adapter'/'build-local.py'),str(game),str(overlay),'--lang',a.lang],check=True)
            print('Копируем игровые данные в локальный ZIP. Ничего не отправляется.',flush=True)
            archive_game(game,overlay,dest)
        print('Готово. Выбери этот ZIP в браузерном лаунчере: '+str(dest),flush=True)
    except (OSError,ValueError,subprocess.CalledProcessError) as e:
        print('Сборка остановлена: '+str(e),file=sys.stderr)
        return 1
    return 0
if __name__=='__main__':sys.exit(main())
