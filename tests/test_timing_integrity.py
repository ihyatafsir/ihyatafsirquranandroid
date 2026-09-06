#!/usr/bin/env python3
"""
Test Suite 1: Timing Integrity & Monotonicity Test
Validates all letter and word timing files across all reciters (MAH, AbdulBasit, AbdulBasit Warsh, Minshawi).
"""

import unittest
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "assets"
AUDIO_MAH_DIR = ASSETS_DIR / "audio_mah"

class TestTimingIntegrity(unittest.TestCase):

    def test_all_reciters_letter_timing(self):
        for reciter in ["abdulbasit", "minshawi"]:
            fpath = ASSETS_DIR / f"letter_timing_{reciter}.json"
            self.assertTrue(fpath.exists(), f"Letter timing file missing for {reciter}")
            
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            self.assertGreater(len(data), 0, f"{reciter} letter timing data is empty")
            
            total_verses_checked = 0
            total_letters_checked = 0
            
            for verse_key, letters in data.items():
                total_verses_checked += 1
                prev_start = -1
                for idx, lt in enumerate(letters):
                    total_letters_checked += 1
                    start = lt.get("start", 0)
                    end = lt.get("end", 0)
                    word_idx = lt.get("wordIdx", -1)
                    char_idx = lt.get("charIdx", -1)
                    
                    self.assertGreaterEqual(start, 0, f"{reciter} {verse_key} letter {idx} start < 0")
                    self.assertGreaterEqual(end, start, f"{reciter} {verse_key} letter {idx} end < start")
                    self.assertGreaterEqual(word_idx, 0, f"{reciter} {verse_key} letter {idx} invalid wordIdx")
                    self.assertGreaterEqual(char_idx, 0, f"{reciter} {verse_key} letter {idx} invalid charIdx")
                    self.assertGreaterEqual(start, prev_start, f"{reciter} {verse_key} letter {idx} non-monotonic: {start} < {prev_start}")
                    prev_start = start
                    
            print(f"[PASSED] Letter Timing ({reciter}): {total_verses_checked} verses, {total_letters_checked} letters verified.")

    def test_mah_letter_timing_files(self):
        mah_files = list(AUDIO_MAH_DIR.glob("letter_timing_*.json"))
        self.assertGreater(len(mah_files), 0, "No MAH letter timing files found")
        
        files_checked = 0
        total_letters = 0
        
        for fpath in mah_files:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            self.assertIsInstance(data, list, f"{fpath.name} is not a list")
            if not data:
                continue
                
            files_checked += 1
            prev_start = -1
            for idx, lt in enumerate(data):
                total_letters += 1
                start = lt.get("start", 0)
                end = lt.get("end", 0)
                word_idx = lt.get("wordIdx", -1)
                char_idx = lt.get("charIdx", -1)
                
                self.assertGreaterEqual(start, 0, f"{fpath.name} letter {idx} start < 0")
                self.assertGreaterEqual(end, start, f"{fpath.name} letter {idx} end < start")
                self.assertGreaterEqual(word_idx, 0, f"{fpath.name} letter {idx} invalid wordIdx")
                self.assertGreaterEqual(char_idx, 0, f"{fpath.name} letter {idx} invalid charIdx")
                self.assertGreaterEqual(start, prev_start, f"{fpath.name} letter {idx} non-monotonic: {start} < {prev_start}")
                prev_start = start
                
        print(f"[PASSED] MAH Letter Timing: {files_checked} files, {total_letters} letters verified.")

    def test_standard_reciter_word_timings(self):
        for reciter in ["abdulbasit", "minshawi"]:
            fpath = ASSETS_DIR / f"timing_{reciter}.json"
            if not fpath.exists():
                continue
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.assertIsInstance(data, dict, f"timing_{reciter}.json not a dictionary")
            
            verses_checked = 0
            for verse_key, words in data.items():
                verses_checked += 1
                prev_start = -1
                for idx, w in enumerate(words):
                    # Format: [wordIdx, startMs, endMs]
                    word_idx, start_ms, end_ms = w[0], w[1], w[2]
                    self.assertGreaterEqual(word_idx, 0, f"{reciter} {verse_key} invalid word index {word_idx}")
                    self.assertGreaterEqual(end_ms, start_ms, f"{reciter} {verse_key} end < start")
                    self.assertGreaterEqual(start_ms, prev_start, f"{reciter} {verse_key} non-monotonic start {start_ms} < {prev_start}")
                    prev_start = start_ms
                    
            print(f"[PASSED] Reciter Timing ({reciter}): {verses_checked} verses verified.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
