#!/usr/bin/env python3
import json
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_CHUNKS = os.path.join(BASE_DIR, 'assets', 'surahs_chunks')
ANDROID_CHUNKS = os.path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'assets', 'surahs')
HALEEM_FILE = os.path.join(BASE_DIR, 'assets', 'haleem_en.json')
CLEARY_FILE = os.path.join(BASE_DIR, 'assets', 'cleary_en.json')
TAFSIR_FILE = os.path.join(BASE_DIR, 'assets', 'ihya_tafsir_v4_master.json')
WBW_DIR = '/home/absolut7/Documents/ihyatafsirwebsite_2/quranwbw/surahs/data'
SURAHS_FILE = os.path.join(BASE_DIR, 'assets', 'surahs.json')

print('Loading reference datasets...')
with open(HALEEM_FILE, 'r', encoding='utf-8') as f:
    haleem = json.load(f)
with open(CLEARY_FILE, 'r', encoding='utf-8') as f:
    cleary = json.load(f)
with open(TAFSIR_FILE, 'r', encoding='utf-8') as f:
    tafsir_master = json.load(f)

print(f'  Haleem verses: {len(haleem)}')
print(f'  Cleary verses: {len(cleary)}')
print(f'  Tafsir mapped verses: {len(tafsir_master)}')

os.makedirs(ASSETS_CHUNKS, exist_ok=True)
os.makedirs(ANDROID_CHUNKS, exist_ok=True)

total_verses_updated = 0
total_words_updated = 0
total_tafsir_injected = 0

for s in range(1, 115):
    chunk_path = os.path.join(ASSETS_CHUNKS, f'surah_{s}.dat')
    if not os.path.exists(chunk_path):
        print(f'Error: missing chunk {chunk_path}')
        continue

    with open(chunk_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Load WBW data for this Surah
    wbw_path = os.path.join(WBW_DIR, f'{s}.json')
    wbw_data = None
    if os.path.exists(wbw_path):
        with open(wbw_path, 'r', encoding='utf-8') as f:
            wbw_data = json.load(f)

    # 1. Update Verses
    verses = data.get('verses', [])
    for v in verses:
        ayah = v.get('ayah')
        vk = f'{s}:{ayah}'
        total_verses_updated += 1

        # Translations
        if vk in haleem:
            v['haleemTranslation'] = haleem[vk]
        if vk in cleary:
            v['clearyTranslation'] = cleary[vk]

        # Has Ihya flag
        if vk in tafsir_master:
            v['hasIhya'] = True
        else:
            v['hasIhya'] = False

        # Enrich words with dual transliteration & translation
        words = v.get('words', [])
        wbw_words = []
        if wbw_data and str(ayah) in wbw_data:
            wbw_words = wbw_data[str(ayah)].get('w', [])

        for w_idx, w in enumerate(words):
            total_words_updated += 1
            if wbw_words and w_idx < len(wbw_words):
                wbw_w = wbw_words[w_idx]
                if 'd' in wbw_w:
                    w['latinTranslit'] = wbw_w['d']
                if 'e' in wbw_w:
                    w['translit'] = wbw_w['e']
            elif not w.get('latinTranslit') and w.get('transliteration'):
                w['latinTranslit'] = w.get('transliteration')

    # 2. Update Tafsir entries for this Surah
    surah_tafsir = {}
    for v in verses:
        ayah = v.get('ayah')
        vk = f'{s}:{ayah}'
        if vk in tafsir_master:
            surah_tafsir[str(ayah)] = tafsir_master[vk]
            total_tafsir_injected += len(tafsir_master[vk])

    data['tafsir'] = surah_tafsir

    # 3. Write chunk back to assets/surahs_chunks
    with open(chunk_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    # 4. Write chunk to android/app/src/main/assets/surahs
    android_dest = os.path.join(ANDROID_CHUNKS, f'surah_{s}.dat')
    with open(android_dest, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

print(f'Done! Successfully updated 114 Surahs:')
print(f'  Total Verses updated: {total_verses_updated}')
print(f'  Total Words enriched: {total_words_updated}')
print(f'  Total Tafsir entries: {total_tafsir_injected}')
