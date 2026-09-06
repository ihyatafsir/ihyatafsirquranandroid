#!/usr/bin/env python3
"""
Master Test Runner for ihyatafsirquranandroid
Runs all test suites:
1. test_timing_integrity
2. test_grapheme_alignment
3. test_playback_simulation
4. test_warsh_integrity
"""

import unittest
import sys
from pathlib import Path

# Add tests dir to sys.path
TESTS_DIR = Path(__file__).parent
sys.path.insert(0, str(TESTS_DIR))

import test_timing_integrity
import test_grapheme_alignment
import test_playback_simulation
import test_warsh_integrity
import test_word_mode_and_mah

def run_suite():
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromModule(test_timing_integrity))
    suite.addTests(loader.loadTestsFromModule(test_grapheme_alignment))
    suite.addTests(loader.loadTestsFromModule(test_playback_simulation))
    suite.addTests(loader.loadTestsFromModule(test_warsh_integrity))
    suite.addTests(loader.loadTestsFromModule(test_word_mode_and_mah))

    print("=" * 70)
    print("  QURAN HIGH-PRECISION LETTER HIGHLIGHTING - TEST SUITE")
    print("=" * 70)
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 70)
    if result.wasSuccessful():
        print(f"  ALL {result.testsRun} TESTS PASSED SUCCESSFULLY! (0 Failures, 0 Errors)")
    else:
        print(f"  TESTS COMPLETED WITH FAILURES: {len(result.failures)} Failures, {len(result.errors)} Errors")
    print("=" * 70)
    
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_suite())
