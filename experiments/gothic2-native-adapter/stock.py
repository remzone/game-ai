"""Select portable visuals from a player's own uncompressed Gothic VDF index.
Only file names are written into the mod source. No game model bytes are copied.
Catalog references: Gothic-II-Classic-Revived/Vobbilder, site/data/catalog.json.
"""
import struct

PREFERRED = {
    "LKN_RIDGE": ("OW_LOOKOUT", "ORC_TOWER_V01"),
    "LKN_GATEFORT": ("OW_LOOKOUT",),
    "LKN_DOCK": ("MIN_LOB_SOLDIERSHUT", "NW_MISC_POOR_HUT_01"),
    "LKN_MINE": ("OW_PLANKHUTII", "OW_LONEHUT"),
}
SIGNATURE = b"PSVDSC_V2.00\n\r\n\r"
NAMES = {name+".MRM" for names in PREFERRED.values() for name in names}

def collect(data):
    available = set()
    for archive in sorted(data.iterdir()):
        if archive.suffix.lower() != ".vdf" or not archive.is_file() or archive.is_symlink():
            continue
        try:
            with archive.open("rb") as f:
                size = archive.stat().st_size
                header = f.read(296)
                if len(header)!=296 or header[256:272]!=SIGNATURE:
                    continue
                count, _, _, _, catalog, version = struct.unpack_from("<6I", header,272)
                if version!=0x50 or not (1<=count<=300000) or not (296<=catalog<=size-count*80):
                    continue
                f.seek(catalog)
                rows=f.read(count*80)
                for name, offset, length, flags, _ in struct.iter_unpack("<64s4I",rows):
                    name=name.rstrip(b" \0").decode("ascii","ignore").upper()
                    if name in NAMES and flags & 0x80000000 == 0 and 12<=length<=4*1024*1024 and catalog+count*80<=size and 296<=offset<=size-length:
                        f.seek(offset)
                        if f.read(2)==b"\0\xb1": available.add(name)
        except (OSError,struct.error):
            continue
    return available

def apply(path, data):
    found=collect(data)
    src=path.read_bytes()
    for model,candidates in PREFERRED.items():
        name=next((c for c in candidates if c+".MRM" in found),None)
        if name:
            src=src.replace((model+".3DS").encode(),(name+".3DS").encode())
            print(f"{model}: using installed {name}.MRM", flush=True)
        else:
            if model=="LKN_GATEFORT":
                src=src.replace(b"LKN_GATEFORT.3DS",b"LKN_RIDGE.3DS")
            print(f"{model}: using the detailed mod model (stock model not found)", flush=True)
    path.write_bytes(src)
