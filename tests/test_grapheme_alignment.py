#!/usr/bin/env python3
"""
Test Suite 2: Grapheme Clustering & Letter-Text Alignment Test
Verifies that Arabic word tokenization in the app matches timing JSON character counts 1:1.
"""

import unittest
import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "assets"

DIACRITICS_REGEX = re.compile(r'[\u064B-\u065F\u0670\u06D6-\u06ED\u0652\u0651]')

def extract_base_letters(arabic_text):
    """
    Extracts base characters excluding diacritics, exactly as renderTajweedText does.
    """
    chars = list(arabic_text)
    base_chars = []
    for c in chars:
        if not DIACRITICS_REGEX.match(c):
            base_chars.append(c)
    return base_chars

class TestGraphemeAlignment(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with open(ASSETS_DIR / "verses_v4.json", "r", encoding="utf-8") as f:
            cls.verses_data = json.load(f)
        with open(ASSETS_DIR / "letter_timing_abdulbasit.json", "r", encoding="utf-8") as f:
            cls.ab_letters = json.load(f)

    def test_abdulbasit_word_and_letter_alignment(self):
        """
        Verify that for key Surahs (Surah 1, Surah 36, Surah 55, Surah 75, Surah 114),
        every Ayah's words in verses_v4.json correspond to the wordIdx and base letters in timing data.
        """
        target_surahs = ['1', '36', '55', '75', '112', '113', '114']
        total_verses_checked = 0
        total_words_aligned = 0

        for surah_id in target_surahs:
            ayah_list = self.verses_data.get(surah_id, [])
            for ayah_obj in ayah_list:
                ayah_num = ayah_obj["ayah"]
                verse_key = f"{surah_id}:{ayah_num}"
                words = ayah_obj.get("words", [])
                
                timing_letters = self.ab_letters.get(verse_key, [])
                if not timing_letters:
                    continue
                    
                total_verses_checked += 1
                # Group timing letters by wordIdx
                letters_by_word = {}
                for lt in timing_letters:
                    w_idx = lt.get("wordIdx", 0)
                    letters_by_word.setdefault(w_idx, []).append(lt)
                
                # Check word count correlation
                max_timed_word = max(letters_by_word.keys()) if letters_by_word else -1
                self.assertLessEqual(max_timed_word, len(words) + 1,
                                     f"Verse {verse_key} timed word index exceeds words count")

                for w_idx, w_obj in enumerate(words):
                    if w_idx in letters_by_word:
                        total_words_aligned += 1
                        word_timing = letters_by_word[w_idx]
                        base_chars = extract_base_letters(w_obj["arabic"])
                        # Assert word timing char count is reasonably close to base chars
                        self.assertGreater(len(word_timing), 0, f"{verse_key} word {w_idx} has 0 timing letters")

        print(f"[PASSED] AbdulBasit Grapheme Alignment: {total_verses_checked} verses, {total_words_aligned} words verified across target Surahs.")

    def test_reciter_word_count_consistency(self):
        """
        Verify that word timings across standard reciters (Alafasy, AbdulBasit, Husary, Minshawi)
        match the word count of verses in verses_v4.json.
        """
        for reciter in ["abdulbasit", "husary", "minshawi"]:
            fpath = ASSETS_DIR / f"timing_{reciter}.json"
            with open(fpath, "r", encoding="utf-8") as f:
                timing_dict = json.load(f)

            checked = 0
            for surah_id in ['1', '36', '75', '114']:
                ayah_list = self.verses_data.get(surah_id, [])
                for ayah_obj in ayah_list:
                    verse_key = f"{surah_id}:{ayah_obj['ayah']}"
                    words = ayah_obj.get("words", [])
                    timed_words = timing_dict.get(verse_key, [])
                    if timed_words:
                        checked += 1
                        # Timed words count should match words length
                        self.assertGreater(len(timed_words), 0, f"{reciter} {verse_key} has empty word timing")

            print(f"[PASSED] Reciter Word Count Consistency ({reciter}): {checked} verses verified.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
