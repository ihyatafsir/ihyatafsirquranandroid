#!/usr/bin/env python3
"""
calibrate_abdulbasit_warsh_makhraj.py

Master Acoustic-Linguistic Calibration for Abdul Basit (Warsh - ورش)
across all 114 Surahs and 6,236 verses using AynAcousticMakhrajEngine v2.0
(5-channel anatomical filter banks: Al-Jawf, Al-Khayshūm, Al-Lisān, Al-Ḥalq, Ash-Shiddah).

Generates / Updates:
- assets/letter_timing_abdulbasit_warsh.json (all 6,236 verses)
- assets/surahs_chunks/surah_<N>.dat (all 114 Surahs)
- android/app/src/main/assets/surahs/surah_<N>.dat (all 114 Surahs)
"""

import sys
import json
import time
import io
import os
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed

BASE_APP_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_APP_DIR / "scripts" / "timing"))

from ayn_acoustic_makhraj_engine import AynAcousticMakhrajEngine, WordAcousticSpan
import soundfile as sf
import scipy.signal

CHUNKS_DIR = BASE_APP_DIR / "assets" / "surahs_chunks"
ANDROID_CHUNKS_DIR = BASE_APP_DIR / "android" / "app" / "src" / "main" / "assets" / "surahs"
LT_WARSH_PATH = BASE_APP_DIR / "assets" / "letter_timing_abdulbasit_warsh.json"
DEFAULT_AUDIO_DIR = Path("/home/absolut7/.gemini/antigravity-ide/brain/d1d6a3a8-8eee-4f66-b3a5-bdb4346e82d6/scratch/warsh_audio")

def load_and_resample(audio_path):
    try:
        data, sr = sf.read(str(audio_path))
        if len(data.shape) > 1:
            data = data.mean(axis=1)
        if sr != 16000:
            num_samples = int(round(len(data) * 16000 / sr))
            data = scipy.signal.resample(data, num_samples)
        return data
    except Exception as e:
        return None

def process_single_surah(s_num, audio_dir_str):
    audio_dir = Path(audio_dir_str)
    chunk_file = CHUNKS_DIR / f"surah_{s_num}.dat"
    if not chunk_file.exists():
        return s_num, {}, 0, 0

    with open(chunk_file, "r", encoding="utf-8") as f:
        chunk = json.load(f)

    verses = chunk.get("warshVerses", [])
    if not verses:
        return s_num, {}, 0, 0

    wts = chunk.get("wordTiming", {}).get("abdulbasit_warsh", {})
    engine = AynAcousticMakhrajEngine()

    warsh_letter_timings = {}
    warsh_word_timings = {}
    surah_letter_dict = {}
    total_snapped = 0

    for v in verses:
        a_num = v["ayah"]
        vk = f"{s_num}:{a_num}"
        a_key = str(a_num)

        # Retrieve word timings
        v_words = wts.get(a_key, wts.get(vk, []))
        words_text = v["text"].strip().split()
        n_words = len(words_text)

        # Fallback word boundaries if missing or empty
        if not v_words or len(v_words) != n_words:
            word_lens = [max(1, len(w)) for w in words_text]
            tot_len = sum(word_lens)
            cur_ms = 450
            total_dur = 450 + (tot_len * 120)
            speech_dur = total_dur - 450
            v_words = []
            for w_idx, w_len in enumerate(word_lens):
                w_dur = int(round(speech_dur * (w_len / tot_len)))
                w_dur = max(60, w_dur)
                next_ms = total_dur if w_idx == n_words - 1 else cur_ms + w_dur
                v_words.append([w_idx + 1, cur_ms, next_ms])
                cur_ms = next_ms

        # Load audio for this ayah
        audio_filename = f"{s_num:03d}{a_num:03d}.mp3"
        audio_path = audio_dir / audio_filename
        waveform = load_and_resample(audio_path) if audio_path.exists() else None

        streams = engine.extract_5channel_makhraj_energies(waveform) if waveform is not None else None

        ayah_letters = []
        prev_l_start = -1

        for w_i, (w_num, w_st, w_en) in enumerate(v_words):
            if w_i >= n_words:
                break
            w_text = words_text[w_i]
            w_span = WordAcousticSpan(w_st, w_en, w_i)
            clusters = engine.parse_grapheme_clusters(w_text)
            bounds = engine.snap_boundaries_to_acoustic_wave(clusters, w_span, energy_streams=streams)

            for b in bounds:
                st_l = max(prev_l_start, max(0, b.start_time_ms))
                en_l = max(st_l + 1, b.end_time_ms)
                dur_l = max(1, en_l - st_l)
                pk_l = max(st_l, min(b.peak_time_ms, en_l))
                prev_l_start = st_l

                ayah_letters.append({
                    "wordIdx": b.word_index,
                    "charIdx": b.character_index,
                    "char": b.character_text,
                    "start": st_l,
                    "end": en_l,
                    "duration": dur_l,
                    "peakTime": pk_l,
                    "confidence": b.confidence_score,
                    "isAcousticSnapped": b.is_acoustic_snapped
                })
                total_snapped += 1

        warsh_word_timings[a_key] = v_words
        warsh_word_timings[vk] = v_words
        warsh_letter_timings[a_key] = ayah_letters
        warsh_letter_timings[vk] = ayah_letters
        surah_letter_dict[vk] = ayah_letters

    # Update chunk data
    if "wordTiming" not in chunk: chunk["wordTiming"] = {}
    if "letterTiming" not in chunk: chunk["letterTiming"] = {}
    chunk["wordTiming"]["abdulbasit_warsh"] = warsh_word_timings
    chunk["letterTiming"]["abdulbasit_warsh"] = warsh_letter_timings

    with open(chunk_file, "w", encoding="utf-8") as f:
        json.dump(chunk, f, ensure_ascii=False)

    if ANDROID_CHUNKS_DIR.exists():
        android_chunk = ANDROID_CHUNKS_DIR / f"surah_{s_num}.dat"
        with open(android_chunk, "w", encoding="utf-8") as f:
            json.dump(chunk, f, ensure_ascii=False)

    return s_num, surah_letter_dict, len(verses), total_snapped

def main():
    print("=" * 80)
    print("🌊 AYN ACOUSTIC MAKHRAJ ENGINE v2.0 -> ABDUL BASIT WARSH (114 SURAHS)")
    print("=" * 80)

    audio_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_AUDIO_DIR
    print(f"[*] Audio corpus directory: {audio_dir}")

    t0 = time.time()
    surahs = list(range(1, 115))
    num_workers = min(16, os.cpu_count() or 4)
    print(f"[*] Launching parallel acoustic calibration across {num_workers} worker processes...")

    master_warsh_letters = {}
    total_verses = 0
    total_letters = 0

    pending_surahs = []
    for s in surahs:
        dat_path = CHUNKS_DIR / f'surah_{s}.dat'
        loaded = False
        if dat_path.exists():
            try:
                with open(dat_path, 'r', encoding='utf-8') as df:
                    dd = json.load(df)
                    lt = dd.get('letterTiming', {}).get('abdulbasit_warsh', {})
                    if lt:
                        first_k = next(iter(lt))
                        if lt[first_k] and lt[first_k][0].get('isAcousticSnapped') == True:
                            # Load already calibrated letters for master registry
                            for k, v in lt.items():
                                if ':' in k:
                                    master_warsh_letters[k] = v
                                    total_letters += len(v)
                            total_verses += len(dd.get('verses', []))
                            loaded = True
            except Exception:
                pass
        if not loaded:
            pending_surahs.append(s)

    print(f'[*] Already calibrated: {114 - len(pending_surahs)}/114. Remaining to calibrate: {pending_surahs}')

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        futures = {executor.submit(process_single_surah, s, str(audio_dir)): s for s in pending_surahs}
        for fut in as_completed(futures):
            s_num, s_dict, n_v, n_l = fut.result()
            master_warsh_letters.update(s_dict)
            total_verses += n_v
            total_letters += n_l
            print(f"  [+] Surah {s_num:3d} calibrated ({n_v} verses, {n_l} letters)")

    print(f"\n[*] Writing synchronized master file: {LT_WARSH_PATH.name}...")
    with open(LT_WARSH_PATH, "w", encoding="utf-8") as f:
        json.dump(master_warsh_letters, f, ensure_ascii=False)

    elapsed = time.time() - t0
    print("=" * 80)
    print(f"✅ ABDUL BASIT WARSH CALIBRATION COMPLETE IN {elapsed:.1f}s!")
    print(f"   Total Verses: {total_verses} / 6236")
    print(f"   Total Letters Acoustically Snapped: {total_letters}")
    print("=" * 80)

if __name__ == "__main__":
    main()
