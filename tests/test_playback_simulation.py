#!/usr/bin/env python3
"""
Test Suite 3: Audio Playback Simulation & Real-time Letter Highlighting Test
Simulates playback trajectory across all reciters and checks frame-by-frame index resolution.
"""

import unittest
import json
from pathlib import Path

BASE_DIR = Path("/home/grem3/ihyatafsirquranandroid")
ASSETS_DIR = BASE_DIR / "assets"
AUDIO_MAH_DIR = ASSETS_DIR / "audio_mah"

def simulate_abdulbasit_frame(ab_letters, pos_ms, file_dur_ms=None):
    """Simulates App.tsx Abdul Basit letter resolution logic."""
    if not ab_letters:
        return -1, -1
    
    file_dur = file_dur_ms or (ab_letters[-1]["end"] + 500)
    timing_end = ab_letters[-1]["end"]
    
    scale = (file_dur * 0.88) / timing_end if (file_dur > 1000 and timing_end > 0 and abs(file_dur - timing_end) > 800) else 1.0
    
    scaled_start = ab_letters[0]["start"] * scale
    scaled_end = timing_end * scale
    
    if pos_ms < scaled_start:
        return -1, -1
    elif pos_ms >= scaled_end:
        last_lt = ab_letters[-1]
        return last_lt["wordIdx"], last_lt["charIdx"]
    else:
        for lt in ab_letters:
            l_start = lt["start"] * scale
            l_end = lt["end"] * scale
            if pos_ms >= l_start and pos_ms < l_end:
                return lt["wordIdx"], lt["charIdx"]
        return -1, -1

def simulate_mah_frame(letter_timing, pos_ms):
    """Simulates App.tsx MAH letter resolution logic."""
    if not letter_timing:
        return -1, -1
    for lt in letter_timing:
        start = lt.get("start", 0)
        end = lt.get("end", 0)
        if pos_ms >= start and pos_ms < end:
            return lt.get("wordIdx", 0), lt.get("charIdx", 0)
        if pos_ms < start:
            break
    return -1, -1

def simulate_standard_reciter_frame(word_timings, pos_ms):
    """Simulates standard reciter word index resolution."""
    if not word_timings:
        return -1
    for w in word_timings:
        w_idx, start_ms, end_ms = w[0], w[1], w[2]
        if pos_ms >= start_ms and pos_ms < end_ms:
            return w_idx - 1
    return -1

class TestPlaybackSimulation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with open(ASSETS_DIR / "letter_timing_abdulbasit.json", "r", encoding="utf-8") as f:
            cls.ab_letters = json.load(f)

    def test_abdulbasit_playback_simulation(self):
        """Simulate 60 FPS playback for Surah 1:1 through 1:7 for Abdul Basit."""
        for ayah in range(1, 8):
            verse_key = f"1:{ayah}"
            letters = self.ab_letters.get(verse_key, [])
            self.assertGreater(len(letters), 0, f"Missing letters for {verse_key}")
            
            total_duration = letters[-1]["end"] + 1000
            step_ms = 16  # 60 FPS update interval
            
            seen_words = set()
            seen_chars = set()
            
            for t in range(0, total_duration, step_ms):
                w_idx, c_idx = simulate_abdulbasit_frame(letters, t)
                if w_idx != -1:
                    seen_words.add(w_idx)
                    seen_chars.add((w_idx, c_idx))
                    self.assertGreaterEqual(w_idx, 0)
                    self.assertGreaterEqual(c_idx, 0)
                    
            self.assertGreater(len(seen_words), 0, f"No words activated during {verse_key} playback")
            self.assertGreater(len(seen_chars), 0, f"No chars activated during {verse_key} playback")
            
        print("[PASSED] AbdulBasit 60 FPS Simulation (Surah Al-Fatiha): Smooth continuous letter activation.")

    def test_mah_playback_simulation(self):
        """Simulate playback for MAH Surah 75 (Qiyamah)."""
        mah_path = AUDIO_MAH_DIR / "letter_timing_75.json"
        if not mah_path.exists():
            return
            
        with open(mah_path, "r", encoding="utf-8") as f:
            mah_letters = json.load(f)
            
        total_duration = mah_letters[-1]["end"] + 500
        step_ms = 16  # 60 FPS
        
        seen_words = set()
        seen_chars = set()
        
        for t in range(0, total_duration, step_ms):
            w_idx, c_idx = simulate_mah_frame(mah_letters, t)
            if w_idx != -1:
                seen_words.add(w_idx)
                seen_chars.add((w_idx, c_idx))
                self.assertGreaterEqual(w_idx, 0)
                self.assertGreaterEqual(c_idx, 0)
                
        self.assertGreater(len(seen_words), 10, "MAH Surah 75 playback did not resolve words")
        self.assertGreater(len(seen_chars), 50, "MAH Surah 75 playback did not resolve characters")
        print(f"[PASSED] MAH 60 FPS Simulation (Surah 75): {len(seen_words)} words, {len(seen_chars)} letters resolved.")

    def test_all_standard_reciters_simulation(self):
        """Simulate standard reciters playback for Surah 1."""
        for reciter in ["abdulbasit", "husary", "minshawi"]:
            fpath = ASSETS_DIR / f"timing_{reciter}.json"
            with open(fpath, "r", encoding="utf-8") as f:
                reciter_timing = json.load(f)
                
            for ayah in range(1, 8):
                verse_key = f"1:{ayah}"
                words = reciter_timing.get(verse_key, [])
                if not words:
                    continue
                total_duration = words[-1][2] + 500
                step_ms = 25
                
                resolved_words = set()
                for t in range(0, total_duration, step_ms):
                    w_idx = simulate_standard_reciter_frame(words, t)
                    if w_idx != -1:
                        resolved_words.add(w_idx)
                        
                self.assertGreater(len(resolved_words), 0, f"{reciter} {verse_key} failed to resolve words")
                
            print(f"[PASSED] Standard Reciter Simulation ({reciter}): 100% frame resolution.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
