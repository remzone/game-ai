from pathlib import Path
import struct
import tempfile
import unittest
import stage
import pack

INI = (b"[INFO]\r\nTitle=Gothic II \xe0\r\n[FILES]\r\n"
       b"Game=Content\\Gothic\r\nOutputUnits=Content\\Cutscene\\OU\r\nVDF=\r\n"
       b"[SETTINGS]\r\nWorld=NewWorld.zen\r\nPlayer=PC_HERO\r\n")


def fake_dat():
    # A container fixture, deliberately not executable game code.
    return b"\x32" + struct.pack("<I", 30) + bytes(1024) + b"\0".join(pack.REQUIRED_SYMBOLS) + b"\0"


class Native(unittest.TestCase):
    def test_stages_read_only_source_and_preserves_legacy_encoding(self):
        with tempfile.TemporaryDirectory() as t:
            t = Path(t)
            src = t / "CONTENT"
            (src / "story").mkdir(parents=True)
            manifest = b"/* fake\\Startup.d */\r\nStory\\Startup.d\r\n"
            (src / "gothic.src").write_bytes(manifest)
            startup = b'// func void INIT_NewWorld() {};\r\nFuNc void INIT_NewWorld () {\r\n\tPrint("\xc7");\r\n};\r\n'
            (src / "story" / "STARTUP.D").write_bytes(startup)
            dest = t / "new"
            result = stage.prepare(src, dest)
            actual = result.read_bytes()
            self.assertLess(actual.index(b"LivingKhorinis.d"), actual.index(b"LivingKhorinisNative.d"))
            self.assertLess(actual.index(b"LivingKhorinisNative.d"), actual.index(b"Story\\Startup.d"))
            staged = (dest / "story" / "STARTUP.D").read_bytes()
            self.assertIn(b'{\r\n    LKN_OnWorldInit(); // Chati Living Khorinis\r\n\tPrint("\xc7")', staged)
            self.assertEqual((src / "story" / "STARTUP.D").read_bytes(), startup)
            self.assertEqual((src / "gothic.src").read_bytes(), manifest)
            self.assertEqual((dest / stage.MOD_DIR / "LivingKhorinis.d").read_bytes(), stage.RULES.read_bytes())
            with self.assertRaisesRegex(ValueError, "already contains"):
                stage.prepare(dest, t / "second")

    def test_rejects_missing_ambiguous_and_duplicate_hook(self):
        with self.assertRaisesRegex(ValueError, "got 0"):
            stage.patch_bytes(b'// func void Init_NewWorld() {};')
        with self.assertRaisesRegex(ValueError, "got 2"):
            stage.patch_bytes(b'func void Init_NewWorld() {};func void INIT_NEWWORLD() {};')
        with self.assertRaisesRegex(ValueError, "already references"):
            stage.patch_bytes(b'func void INIT_NEWWORLD() { LKN_ONWORLDINIT(); };')

    def test_uses_only_known_catalog_stock_mesh_and_never_copies_it(self):
        import stock
        from buildings import assets
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            models = assets()
            models["OW_LOOKOUT.MRM"] = models["LKN_RIDGE.MRM"]
            (data / "Meshes.vdf").write_bytes(pack.vdf_for(fake_dat(), models))
            src = data / "source.d"
            src.write_bytes(b'"LKN_GATEFORT.3DS" "LKN_RIDGE.3DS" "LKN_DOCK.3DS"')
            stock.apply(src, data)
            self.assertEqual(src.read_bytes(), b'"OW_LOOKOUT.3DS" "OW_LOOKOUT.3DS" "LKN_DOCK.3DS"')
            self.assertFalse((data / "OW_LOOKOUT.MRM").exists())

    def test_death_hook_only_notifies_scouting_roster(self):
        original = b'// ignored FUNC VOID ZS_Dead() {\nfunc void ZS_Dead ()\r\n{\r\n    NormalDeath();\r\n};'
        patched = stage.patch_human_death(original)
        self.assertIn(stage.DEATH_HOOK, patched)
        self.assertEqual(patched.count(b'NormalDeath();'), 1)
        self.assertIn(b'self.id >= 61086', stage.DEATH_HOOK)
        self.assertIn(b'self.id <= 61108', stage.DEATH_HOOK)
        with self.assertRaises(ValueError):
            stage.patch_human_death(patched)

    def test_vdf_layout_roundtrip(self):
        payload = fake_dat()
        pack.check_dat(payload)
        blob = pack.vdf_for(payload)
        self.assertEqual(blob[256:272], pack.G2_SIGNATURE)
        self.assertEqual(struct.unpack_from("<6I", blob, 272)[:2], (5, 1))
        self.assertEqual(struct.unpack_from("<3I", blob, 284), (len(blob), 296, 80))
        expected = [b"_WORK", b"DATA", b"SCRIPTS", b"_COMPILED", b"LIVINGKHORINIS.DAT"]
        for i, n in enumerate(expected):
            start = 296 + i * 80
            self.assertEqual(blob[start:start+64].rstrip(b" "), n)
            off, size, flags, attr = struct.unpack_from("<4I", blob, start+64)
            self.assertEqual(attr, 0)
            if i < 4:
                self.assertEqual((off, size, flags), (i+1, 0, 0xC0000000))
            else:
                self.assertEqual(flags, 0x40000000)
                self.assertEqual(blob[off:off+size], payload)

    def test_uses_only_matching_ini_and_modded_dat(self):
        result = pack.mod_ini(INI)
        self.assertIn(b'Game=Content\\LivingKhorinis\r\nVDF=LivingKhorinis.mod', result)
        self.assertIn(b'OutputUnits=Content\\Cutscene\\OU\r\n', result)
        self.assertIn(b'World=NewWorld.zen\r\n', result)
        with self.assertRaisesRegex(ValueError, "other mod"):
            pack.mod_ini(INI.replace(b"VDF=", b"VDF=unrelated.mod"))
        with self.assertRaisesRegex(ValueError, "lacks"):
            pack.check_dat(fake_dat().replace(b"LKN_ONWORLDINIT", b"PCK_ONWORLDINIT"))
        with self.assertRaisesRegex(ValueError, "symbol count"):
            pack.check_dat(bytes(1024))


if __name__ == "__main__":
    unittest.main()
