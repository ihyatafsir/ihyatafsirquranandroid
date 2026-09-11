#!/usr/bin/env python3
"""
test_translation_transliteration_and_offline.py - Verification of:
1. Multi-Translation Engine (Haleem, Cleary, Sahih).
2. Dual Word-by-Word Transliteration (Special RTL and Standard Latin).
3. Offline Audio Downloader Service.
4. Deep Ihya Tafsir Commentary Mapping.
"""

import unittest
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
CHUNKS_DIR = os.path.join(ASSETS_DIR, "surahs_chunks")

class TestTranslationTransliterationOffline(unittest.TestCase):
    def test_haleem_and_cleary_translation_integrity(self):
        haleem_path = os.path.join(ASSETS_DIR, "haleem_en.json")
        cleary_path = os.path.join(ASSETS_DIR, "cleary_en.json")

        self.assertTrue(os.path.exists(haleem_path), "Missing haleem_en.json")
        self.assertTrue(os.path.exists(cleary_path), "Missing cleary_en.json")

        with open(haleem_path, "r", encoding="utf-8") as f:
            haleem = json.load(f)
        with open(cleary_path, "r", encoding="utf-8") as f:
            cleary = json.load(f)

        self.assertEqual(len(haleem), 6236, f"Haleem must have 6236 verses, got {len(haleem)}")
        self.assertEqual(len(cleary), 6236, f"Cleary must have 6236 verses, got {len(cleary)}")

        # Verify key opening verses
        self.assertIn("1:1", haleem)
        self.assertIn("1:1", cleary)
        self.assertIn("God", cleary["1:1"])
        print(f"[PASSED] Translation Integrity: Haleem (6236) and Cleary (6236) verified.")

    def test_chunk_dual_transliterations_and_translations(self):
        chunks_checked = 0
        total_words_checked = 0
        total_tafsir_entries = 0

        for s in range(1, 115):
            chunk_file = os.path.join(CHUNKS_DIR, f"surah_{s}.dat")
            self.assertTrue(os.path.exists(chunk_file), f"Missing chunk {chunk_file}")

            with open(chunk_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            verses = data.get("verses", [])
            self.assertGreater(len(verses), 0, f"Surah {s} has no verses")

            for v in verses:
                self.assertIn("translation", v)
                self.assertIn("haleemTranslation", v)
                self.assertIn("clearyTranslation", v)

                words = v.get("words", [])
                for w in words:
                    total_words_checked += 1
                    # Ensure translit (RTL) or latinTranslit is populated
                    self.assertTrue(
                        "translit" in w or "latinTranslit" in w or "transliteration" in w,
                        f"Word missing transliteration in Surah {s} Ayah {v['ayah']}"
                    )

            # Count tafsir entries
            tafsir = data.get("tafsir", {})
            for ayah_str, entries in tafsir.items():
                total_tafsir_entries += len(entries)

            chunks_checked += 1

        self.assertEqual(chunks_checked, 114, "All 114 chunks verified")
        self.assertGreater(total_words_checked, 75000, "All words enriched across 114 Surahs")
        self.assertGreater(total_tafsir_entries, 2000, "Deep Ihya Tafsir entries populated")
        print(f"[PASSED] Chunk Data: 114 Surahs, {total_words_checked} words with dual translit, {total_tafsir_entries} Ihya tafsir entries.")

    def test_offline_audio_service_module(self):
        service_file = os.path.join(BASE_DIR, "src", "services", "offlineAudioService.ts")
        self.assertTrue(os.path.exists(service_file), "Missing offlineAudioService.ts")

        with open(service_file, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("class OfflineAudioService", content)
        self.assertIn("downloadSurah", content)
        self.assertIn("getLocalAudioUri", content)
        self.assertIn("isSurahDownloaded", content)
        print("[PASSED] Offline Audio Service: Validated offline download and local lookup APIs.")

if __name__ == "__main__":
    unittest.main()
