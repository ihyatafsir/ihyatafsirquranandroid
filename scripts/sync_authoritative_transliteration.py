#!/usr/bin/env python3
import sqlite3
import json
import os
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'assets', 'databases', 'words.db')
CHUNKS_DIR = os.path.join(BASE_DIR, 'assets', 'surahs_chunks')
ANDROID_CHUNKS = os.path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'assets', 'surahs')

print("Connecting to authoritative words.db...")
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
rows = cur.execute('SELECT sura, ayah, word, bn, en FROM allwords ORDER BY sura, ayah, word').fetchall()
conn.close()

db_dict = defaultdict(lambda: defaultdict(dict))
for sura, ayah, word, bn, en in rows:
    db_dict[sura][ayah][word] = (bn, en)

total_words = 0
for s in range(1, 115):
    chunk_path = os.path.join(CHUNKS_DIR, f'surah_{s}.dat')
    if not os.path.exists(chunk_path):
        continue

    with open(chunk_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for v in data.get('verses', []):
        ayah = v['ayah']
        ayah_words = db_dict[s][ayah]
        for w_idx, w in enumerate(v.get('words', [])):
            total_words += 1
            word_num = w_idx + 1
            if word_num in ayah_words:
                bn, en = ayah_words[word_num]
                if en and en.strip():
                    w['translit'] = en.strip()
                if not w.get('latinTranslit') and w.get('transliteration'):
                    w['latinTranslit'] = w.get('transliteration')
                elif not w.get('latinTranslit') and bn:
                    w['latinTranslit'] = bn.strip()

    with open(chunk_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    android_dest = os.path.join(ANDROID_CHUNKS, f'surah_{s}.dat')
    with open(android_dest, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

print(f"Instantly enriched {total_words} words across all 114 chunks from words.db!")
