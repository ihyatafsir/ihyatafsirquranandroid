#!/usr/bin/env python3
"""
Test Suite 4: Warsh 'an Nafi' Corpus & Abdul Basit Warsh Timing Integrity Test
Validates the Warsh Quranic text and Abdul Basit Warsh timing across all 114 Surahs.
"""

import unittest
import json
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "assets"
CHUNKS_DIR = ASSETS_DIR / "surahs_chunks"
WARSH_FILE = ASSETS_DIR / "warsh_verses.json"

class TestWarshIntegrity(unittest.TestCase):

    def test_warsh_text_corpus(self):
        """Verify that warsh_verses.json contains all 114 Surahs and 6,236 verses."""
        self.assertTrue(WARSH_FILE.exists(), "warsh_verses.json does not exist")
        with open(WARSH_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        self.assertEqual(len(data), 114, f"Expected 114 Surahs, found {len(data)}")
        
        total_verses = sum(len(verses) for verses in data.values())
        self.assertEqual(total_verses, 6236, f"Expected 6,236 verses, found {total_verses}")
        
        # Verify authentic Madani Warsh numbering (Ayah 1:1 is Al-Hamd, Ayah 1:3 is Maliki)
        surah1 = data.get("1", [])
        self.assertEqual(len(surah1), 7, "Surah Al-Fatiha must have 7 verses")
        ayah1 = surah1[0]["text"]
        self.assertTrue("الْحَمْدُ" in ayah1 or "اِ۬لْحَمْدُ" in ayah1, f"Ayah 1:1 must read 'الْحَمْدُ' in Warsh: {ayah1}")
        ayah3 = surah1[2]["text"]
        self.assertTrue("مَلِكِ" in ayah3 or "ملك" in ayah3, f"Ayah 1:3 must read 'مَلِكِ' in Warsh: {ayah3}")
        
        print(f"[PASSED] Warsh Corpus: 114 Surahs, {total_verses} verses verified.")

    def test_chunks_warsh_and_timing_integration(self):
        """Verify that all 114 on-demand .dat chunks have warshVerses and abdulbasit_warsh timings."""
        total_letters = 0
        for s_num in range(1, 115):
            fpath = CHUNKS_DIR / f"surah_{s_num}.dat"
            self.assertTrue(fpath.exists(), f"Chunk missing: surah_{s_num}.dat")
            with open(fpath, "r", encoding="utf-8") as f:
                chunk = json.load(f)
                
            self.assertIn("warshVerses", chunk, f"Surah {s_num} missing warshVerses")
            self.assertGreater(len(chunk["warshVerses"]), 0, f"Surah {s_num} warshVerses empty")
            
            # Check timing
            self.assertIn("abdulbasit_warsh", chunk.get("wordTiming", {}), f"Surah {s_num} missing abdulbasit_warsh word timing")
            self.assertIn("abdulbasit_warsh", chunk.get("letterTiming", {}), f"Surah {s_num} missing abdulbasit_warsh letter timing")
            
            for vk, letters in chunk["letterTiming"]["abdulbasit_warsh"].items():
                total_letters += len(letters)
                for lt in letters:
                    self.assertGreaterEqual(lt["end"], lt["start"], f"Invalid timing in {vk}: end < start")
                    
        print(f"[PASSED] Chunks Integration: 114 chunks verified with {total_letters:,} Warsh letter timings.")

    def test_everyayah_warsh_audio_accessibility(self):
        """Verify EveryAyah audio endpoint for Abdul Basit Warsh."""
        test_url = "https://everyayah.com/data/warsh/warsh_Abdul_Basit_128kbps/001001.mp3"
        req = urllib.request.Request(test_url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                self.assertEqual(resp.status, 200, f"EveryAyah Warsh audio returned status {resp.status}")
                print("[PASSED] EveryAyah Warsh Audio Endpoint: HTTP 200 OK.")
        except Exception as e:
            self.fail(f"Failed to connect to EveryAyah Warsh endpoint: {e}")

if __name__ == '__main__':
    unittest.main()
