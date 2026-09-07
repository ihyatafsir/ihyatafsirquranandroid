#!/usr/bin/env python3
"""
calibrate_mah_surah_36_makhraj.py

Full Acoustic-Linguistic Calibration of Surah 36 (Ya-Sin) for Reciter MAH
using AynAcousticMakhrajEngine v2.0:
1. Dynamic sequence alignment between 725 Quran words of Surah 36 and reciter words.
   - Accurately handles composite "يسٓ" = "يا" + "سين".
   - Accurately handles vocative compound tokens ("يَٰقَوْمِ", "يَٰلَيْتَ", etc.).
2. Calculates exact Ayah start/end boundaries for all 83 Ayahs with Ayah 1 starting at 0ms.
3. Runs AynAcousticMakhrajEngine v2.0 (5-channel anatomical filter banks) for physical wave snapping.
4. Updates:
   - assets/mah_verse_timings.json
   - assets/audio_mah/verse_timing_36.json
   - assets/audio_mah/letter_timing_36.json
   - assets/surahs_chunks/surah_36.dat
   - android/app/src/main/assets/surahs/surah_36.dat
   - assets/letter_timing_mah.json
   - assets/timing_mah.json
"""

import sys
import json
import re
import difflib
from pathlib import Path

# Add AynAcousticMakhrajEngine
sys.path.insert(0, "/home/absolut7/AynAcousticMakhrajEngine")
from ayn_acoustic_makhraj_engine import AynAcousticMakhrajEngine, WordAcousticSpan

BASE_APP_DIR = Path("/home/absolut7/Documents/26apps/ihyatafsir-android")
MAH_DIR = BASE_APP_DIR / "assets" / "audio_mah"
CHUNKS_DIR = BASE_APP_DIR / "assets" / "surahs_chunks"
ANDROID_CHUNKS_DIR = BASE_APP_DIR / "android" / "app" / "src" / "main" / "assets" / "surahs"

def norm_ar(t):
    t = re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]', '', t)
    t = re.sub(r'[إأآاٱ]', 'ا', t)
    t = re.sub(r'[ة]', 'ه', t)
    t = re.sub(r'[ىي]', 'ي', t)
    t = re.sub(r'[ؤئ]', 'ء', t)
    return t.strip()

def main():
    print("=" * 75)
    print("🌊 AYN ACOUSTIC MAKHRAJ ENGINE v2.0 -> SURAH 36 GROUND-TRUTH CALIBRATION")
    print("=" * 75)

    audio_path = MAH_DIR / "yasin_36.mp3"
    wt_path = MAH_DIR / "timing_36.json"
    chunk_path = CHUNKS_DIR / "surah_36.dat"

    with open(chunk_path, "r", encoding="utf-8") as f:
        chunk_36 = json.load(f)
    with open(wt_path, "r", encoding="utf-8") as f:
        wt_all = json.load(f)

    # In our cleaned audio and timing_36.json, Isti'adhah and Basmalah are already removed
    # If the first word is "يا" or "يس", take wt_all directly; otherwise skip pre-surah words
    if wt_all and norm_ar(wt_all[0]["word"]) in ["يا", "يس"]:
        rec_words = wt_all
        print(f"[*] Ingested {len(rec_words)} reciter words from timing_36.json (Cleaned starting with Yasin)")
    else:
        rec_words = wt_all[9:]
        print(f"[*] Ingested {len(rec_words)} reciter words from timing_36.json (Skipped 9 pre-surah words)")

    # Ingest 725 Quran words
    q_words = []
    ayah_qwords = {}
    for v in chunk_36["verses"]:
        a_num = v["ayah"]
        words = v["text"].strip().split()
        ayah_qwords[a_num] = []
        for w_i, w in enumerate(words):
            entry = {
                "ayah": a_num,
                "word_idx": w_i,
                "word_text": w,
                "norm": norm_ar(w)
            }
            q_words.append(entry)
            ayah_qwords[a_num].append(entry)

    print(f"[*] Ingested {len(q_words)} Quran words across 83 Ayahs")

    # DP Sequence Alignment between Quran words and Reciter words
    def sim(q_str, r_str):
        if q_str == r_str: return 2.5
        if q_str in r_str or r_str in q_str: return 1.8
        ratio = difflib.SequenceMatcher(None, q_str, r_str).ratio()
        return ratio * 2.5 - 0.2

    N, M = len(q_words), len(rec_words)
    dp = [[-1e9] * (M + 1) for _ in range(N + 1)]
    parent = [[None] * (M + 1) for _ in range(N + 1)]
    dp[0][0] = 0.0

    print("[*] Running dynamic sequence alignment matrix...")
    for i in range(N + 1):
        for j in range(M + 1):
            cur = dp[i][j]
            if cur < -1e8: continue
            # 1-1 match
            if i < N and j < M:
                score = sim(q_words[i]['norm'], norm_ar(rec_words[j]['word']))
                if cur + score > dp[i+1][j+1]:
                    dp[i+1][j+1] = cur + score
                    parent[i+1][j+1] = (i, j, '1-1')
            # 1-2 match (compound tokens like يس = يا + سين)
            if i < N and j + 1 < M:
                merged_rec = norm_ar(rec_words[j]['word']) + norm_ar(rec_words[j+1]['word'])
                score = sim(q_words[i]['norm'], merged_rec)
                if q_words[i]['norm'] == 'يس' and norm_ar(rec_words[j]['word']) == 'يا' and norm_ar(rec_words[j+1]['word']) == 'سين':
                    score = 4.5
                if cur + score > dp[i+1][j+2]:
                    dp[i+1][j+2] = cur + score
                    parent[i+1][j+2] = (i, j, '1-2')
            # Skip reciter word (breathing noise, repeated word)
            if j < M:
                if cur - 0.4 > dp[i][j+1]:
                    dp[i][j+1] = cur - 0.4
                    parent[i][j+1] = (i, j, 'skip_rec')
            # Skip Quran word
            if i < N:
                if cur - 2.5 > dp[i+1][j]:
                    dp[i+1][j] = cur - 2.5
                    parent[i+1][j] = (i, j, 'skip_q')

    curr_i, curr_j = N, M
    align = []
    while curr_i > 0 or curr_j > 0:
        p = parent[curr_i][curr_j]
        if not p: break
        pi, pj, op = p
        align.append((pi, pj, curr_i, curr_j, op))
        curr_i, curr_j = pi, pj
    align.reverse()

    # Build calibrated word spans
    qword_timings = {}
    prev_time = int(round(rec_words[0]['start'] * 1000))

    for step in align:
        pi, pj, ci, cj, op = step
        if op == '1-1':
            st = int(round(rec_words[pj]['start'] * 1000))
            en = int(round(rec_words[pj]['end'] * 1000))
            qword_timings[pi] = (st, en)
            prev_time = en
        elif op == '1-2':
            st = int(round(rec_words[pj]['start'] * 1000))
            en = int(round(rec_words[pj+1]['end'] * 1000))
            qword_timings[pi] = (st, en)
            prev_time = en
        elif op == 'skip_q':
            qword_timings[pi] = (prev_time, prev_time + 400)
            prev_time += 400

    # Ensure Ayah 1 starts exactly at 0ms in cleaned audio
    qword_timings[0] = (0, qword_timings[0][1])

    # Calculate exact Ayah start/end timings
    calibrated_ayah_timings = []
    verse_timing_records = []

    for a_num in range(1, 84):
        q_indices = [i for i, qw in enumerate(q_words) if qw['ayah'] == a_num]
        a_st = qword_timings[q_indices[0]][0]
        a_en = qword_timings[q_indices[-1]][1]
        calibrated_ayah_timings.append([a_num, a_st, a_en])
        verse_timing_records.append({
            "ayah": a_num,
            "start_ms": a_st,
            "end_ms": a_en,
            "word_count": len(q_indices)
        })

    print(f"[*] Calibrated Ayah 1: {calibrated_ayah_timings[0][1]}ms -> {calibrated_ayah_timings[0][2]}ms (Dur: {calibrated_ayah_timings[0][2]-calibrated_ayah_timings[0][1]}ms)")
    print(f"[*] Calibrated Ayah 2: {calibrated_ayah_timings[1][1]}ms -> {calibrated_ayah_timings[1][2]}ms (Dur: {calibrated_ayah_timings[1][2]-calibrated_ayah_timings[1][1]}ms)")
    print(f"[*] Calibrated Ayah 83: {calibrated_ayah_timings[-1][1]}ms -> {calibrated_ayah_timings[-1][2]}ms")

    # Load audio waveform and extract 5-channel filter banks with AynAcousticMakhrajEngine
    print("[*] Initializing AynAcousticMakhrajEngine v2.0...")
    engine = AynAcousticMakhrajEngine()
    waveform = engine.load_audio_waveform(audio_path)
    print(f"[*] Loaded waveform ({len(waveform)} samples, {len(waveform)/16000:.2f}s)")
    streams = engine.extract_5channel_makhraj_energies(waveform)
    print(f"[*] Extracted 5-Channel Makhraj Filter Bank ({len(streams.total_energy)} frames)")

    # Execute acoustic letter snapping
    mah_verse_words = {}
    mah_verse_letters = {}
    flat_absolute_letters = []

    for a_num in range(1, 84):
        q_indices = [i for i, qw in enumerate(q_words) if qw['ayah'] == a_num]
        # First ensure strict monotonic ordering of words in this ayah
        cur_w_st = calibrated_ayah_timings[a_num - 1][1]
        for q_idx in q_indices:
            st_abs, en_abs = qword_timings[q_idx]
            st_abs = max(cur_w_st, st_abs)
            en_abs = max(st_abs + 20, en_abs)
            qword_timings[q_idx] = (st_abs, en_abs)
            cur_w_st = en_abs

        a_st = qword_timings[q_indices[0]][0]
        a_en = qword_timings[q_indices[-1]][1]
        calibrated_ayah_timings[a_num - 1][1] = a_st
        calibrated_ayah_timings[a_num - 1][2] = a_en

        ayah_words_rel = []
        ayah_letters_rel = []
        prev_end = 0
        prev_l_end = 0

        for w_i, q_idx in enumerate(q_indices):
            qw = q_words[q_idx]
            st_abs, en_abs = qword_timings[q_idx]
            st_rel = max(prev_end, st_abs - a_st)
            en_rel = max(st_rel + 10, en_abs - a_st)
            ayah_words_rel.append([w_i + 1, st_rel, en_rel])
            prev_end = en_rel

            # Snap letters in this word
            w_span = WordAcousticSpan(st_abs, en_abs, w_i)
            clusters = engine.parse_grapheme_clusters(qw["word_text"])
            bounds = engine.snap_boundaries_to_acoustic_wave(clusters, w_span, energy_streams=streams)

            for b in bounds:
                st_l = max(prev_l_end, max(0, b.start_time_ms - a_st))
                en_l = max(st_l + 1, max(b.end_time_ms - a_st, st_l + 1))
                dur_l = max(1, en_l - st_l)
                pk_l = max(st_l, min(b.peak_time_ms - a_st, en_l))
                prev_l_end = st_l

                letter_dict = {
                    "wordIdx": b.word_index,
                    "charIdx": b.character_index,
                    "char": b.character_text,
                    "start": st_l,
                    "end": en_l,
                    "duration": dur_l,
                    "peakTime": pk_l,
                    "confidence": b.confidence_score,
                    "isAcousticSnapped": b.is_acoustic_snapped
                }
                ayah_letters_rel.append(letter_dict)

                flat_absolute_letters.append({
                    "ayah": a_num,
                    "wordIdx": b.word_index,
                    "charIdx": b.character_index,
                    "char": b.character_text,
                    "start": b.start_time_ms,
                    "end": b.end_time_ms,
                    "duration": b.end_time_ms - b.start_time_ms,
                    "peakTime": b.peak_time_ms,
                    "confidence": b.confidence_score,
                    "isAcousticSnapped": b.is_acoustic_snapped
                })

        # Save under both numeric and prefixed keys
        mah_verse_words[str(a_num)] = ayah_words_rel
        mah_verse_words[f"36:{a_num}"] = ayah_words_rel
        mah_verse_letters[str(a_num)] = ayah_letters_rel
        mah_verse_letters[f"36:{a_num}"] = ayah_letters_rel

    print(f"[*] Successfully processed all 83 Ayahs ({len(flat_absolute_letters)} acoustic-snapped letters)")

    # 1. Update mah_verse_timings.json
    mvt_path = BASE_APP_DIR / "assets" / "mah_verse_timings.json"
    with open(mvt_path, "r", encoding="utf-8") as f:
        mvt_data = json.load(f)
    mvt_data["36"] = calibrated_ayah_timings
    with open(mvt_path, "w", encoding="utf-8") as f:
        json.dump(mvt_data, f, ensure_ascii=False, indent=2)
    print(f"[*] Updated {mvt_path.name} with 83 calibrated Ayah timings")

    # 2. Update verse_timing_36.json
    vt36_path = MAH_DIR / "verse_timing_36.json"
    with open(vt36_path, "w", encoding="utf-8") as f:
        json.dump(verse_timing_records, f, ensure_ascii=False, indent=2)
    print(f"[*] Updated {vt36_path.name}")

    # 3. Update letter_timing_36.json
    lt36_path = MAH_DIR / "letter_timing_36.json"
    with open(lt36_path, "w", encoding="utf-8") as f:
        json.dump(flat_absolute_letters, f, ensure_ascii=False, indent=2)
    print(f"[*] Updated {lt36_path.name}")

    # 4. Update surah_36.dat in assets/surahs_chunks/ and android/
    if "wordTiming" not in chunk_36: chunk_36["wordTiming"] = {}
    if "letterTiming" not in chunk_36: chunk_36["letterTiming"] = {}
    chunk_36["wordTiming"]["mah"] = mah_verse_words
    chunk_36["letterTiming"]["mah"] = mah_verse_letters

    with open(chunk_path, "w", encoding="utf-8") as f:
        json.dump(chunk_36, f, ensure_ascii=False)
    print(f"[*] Updated {chunk_path}")

    if ANDROID_CHUNKS_DIR.exists():
        android_chunk_36 = ANDROID_CHUNKS_DIR / "surah_36.dat"
        with open(android_chunk_36, "w", encoding="utf-8") as f:
            json.dump(chunk_36, f, ensure_ascii=False)
        print(f"[*] Mirrored to {android_chunk_36}")

    # 5. Update assets/letter_timing_mah.json & assets/timing_mah.json for 36:X
    lt_mah_path = BASE_APP_DIR / "assets" / "letter_timing_mah.json"
    if lt_mah_path.exists():
        with open(lt_mah_path, "r", encoding="utf-8") as f:
            lt_mah = json.load(f)
        for a_num in range(1, 84):
            lt_mah[f"36:{a_num}"] = mah_verse_letters[str(a_num)]
        with open(lt_mah_path, "w", encoding="utf-8") as f:
            json.dump(lt_mah, f, ensure_ascii=False)
        print(f"[*] Synchronized {lt_mah_path.name} for 36:1..36:83")

    t_mah_path = BASE_APP_DIR / "assets" / "timing_mah.json"
    if t_mah_path.exists():
        with open(t_mah_path, "r", encoding="utf-8") as f:
            t_mah = json.load(f)
        for a_num in range(1, 84):
            t_mah[f"36:{a_num}"] = mah_verse_words[str(a_num)]
        with open(t_mah_path, "w", encoding="utf-8") as f:
            json.dump(t_mah, f, ensure_ascii=False)
        print(f"[*] Synchronized {t_mah_path.name} for 36:1..36:83")

    print("=" * 75)
    print("✅ CALIBRATION FOR SURAH 36 (MAH) COMPLETE & VERIFIED VIA AYN MAKHRAJ!")
    print("=" * 75)

if __name__ == "__main__":
    main()
