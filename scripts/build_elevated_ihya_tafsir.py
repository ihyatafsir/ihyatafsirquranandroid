#!/usr/bin/env python3
"""
build_elevated_ihya_tafsir.py

AynEngine AI v4.0 + DeepSeek Flash v4.1 Tafsir Extraction & Alignment Engine
Extracts, polishes, and maps Imam Abu Hamid al-Ghazali's 'Ihya Ulum al-Din'
commentary to Quranic verses with classical Arabic and scholastic English.
Strictly zero emojis.
"""

import os
import re
import json
import sqlite3
import hashlib
from collections import defaultdict
from typing import Dict, List, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
CHUNKS_DIR = os.path.join(ASSETS_DIR, 'surahs_chunks')
ANDROID_CHUNKS = os.path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'assets', 'surahs')
DB_PATH = os.path.join(ASSETS_DIR, 'quran_master.db')
WORDS_DB = os.path.join(ASSETS_DIR, 'databases', 'words.db')

IHYA_V4_PATH = '/home/absolut7/aynengineai/data/translations/ghazali/ihya_ulum_al_din_v4_translated.json'
EXTRACTION_INPUT = "/home/absolut7/Documents/ihyalovesecond/deepseek_extraction_input.json"
OUTPUT_MASTER = os.path.join(ASSETS_DIR, 'ihya_tafsir_v4_master.json')

# Standard Book Titles
BOOK_NAMES = [
    "Book of Knowledge (Kitab al-Ilm)",
    "Foundations of the Articles of Faith (Qawa'id al-Aqa'id)",
    "Mysteries of Purity (Kitab Asrar al-Taharah)",
    "Mysteries of Worship & Prayer (Kitab Asrar al-Salah)",
    "Mysteries of the Zakah (Kitab Asrar al-Zakah)",
    "Mysteries of Fasting (Kitab Asrar al-Sawm)",
    "Mysteries of Pilgrimage (Kitab Asrar al-Hajj)",
    "Etiquette of Quran Recitation (Adab Tilawat al-Quran)",
    "Invocations & Supplications (Kitab al-Adhkar wa'l-Da'awat)",
    "Arrangement of Litanies (Tartib al-Awrad)",
    "Etiquette of Eating (Adab al-Akl)",
    "Etiquette of Marriage (Adab al-Nikah)",
    "Etiquette of Acquisition & Earning (Adab al-Kasb)",
    "The Halal & The Haram (Kitab al-Halal wa'l-Haram)",
    "Etiquette of Companionship & Brotherhood (Kitab Adab al-Ulfah)",
    "Etiquette of Seclusion (Kitab Adab al-Uzlah)",
    "Etiquette of Travel (Kitab Adab al-Safar)",
    "Music and Spiritual Ecstasy (Kitab Adab al-Sama' wa'l-Wajd)",
    "Enjoining Good & Forbidding Wrong (Kitab al-Amr bi'l-Ma'ruf)",
    "Manners of Living & Prophetic Virtues (Kitab Adab al-Ma'ishah)",
    "Disciplining the Soul & Curing the Heart (Riyadat al-Nafs)",
    "Breaking the Two Desires (Kasr al-Shahwatayn)",
    "Vices of the Tongue (Afat al-Lisan)",
    "Condemnation of Anger, Hatred & Envy (Dhamm al-Ghadab)",
    "Condemnation of the World (Dhamm al-Dunya)",
    "Condemnation of Miserliness & Greed (Dhamm al-Bukhl)",
    "Condemnation of Status & Ostentation (Dhamm al-Jah wa'l-Riya')",
    "Condemnation of Pride & Conceit (Dhamm al-Kibr wa'l-Ujb)",
    "Condemnation of Delusion (Dhamm al-Ghurur)",
    "Repentance (Kitab al-Tawbah)",
    "Patience & Gratitude (Kitab al-Sabr wa'l-Shukr)",
    "Fear & Hope (Kitab al-Khawf wa'l-Raja')",
    "Poverty & Renunciation (Kitab al-Faqr wa'l-Zuhd)",
    "Faith in Divine Unity & Trust in God (Kitab al-Tawhid wa'l-Tawakkul)",
    "Love, Longing, Intimacy & Contentment (Kitab al-Mahabbah)",
    "Intention, Sincerity & Truthfulness (Kitab al-Niyyah wa'l-Ikhlas)",
    "Vigilance & Self-Examination (Kitab al-Muraqabah wa'l-Muhasabah)",
    "Contemplation (Kitab al-Tafakkur)",
    "Remembrance of Death & The Afterlife (Kitab Dhikr al-Mawt)",
]

def normalize_arabic(text: str) -> str:
    if not text:
        return ""
    t = re.sub(r'[\u064B-\u065F\u0670]', '', text)
    t = re.sub(r'[إأآاٱ]', 'ا', t)
    t = re.sub(r'ة', 'ه', t)
    t = re.sub(r'[ىي]', 'ي', t)
    t = re.sub(r'[^\w\s]', '', t)
    return ' '.join(t.split())

def clean_arabic_passage(raw: str, match_pos: int, match_len: int) -> str:
    start_pos = max(0, match_pos - 200)
    end_pos = min(len(raw), match_pos + match_len + 400)

    prefix = raw[start_pos:match_pos]
    for sep in ['\n\n', '\n', 'قال ', '. ', '؛']:
        idx = prefix.rfind(sep)
        if idx != -1 and (match_pos - (start_pos + idx)) < 150:
            start_pos = start_pos + idx + len(sep)
            break

    suffix = raw[match_pos + match_len:end_pos]
    for sep in ['\n\n', '\n', '. ', '؛']:
        idx = suffix.find(sep)
        if idx != -1 and idx > 60:
            end_pos = match_pos + match_len + idx + len(sep)
            break

    passage = raw[start_pos:end_pos].strip()
    passage = re.sub(r'PageV\d+P\d+', '', passage)
    passage = re.sub(r'###\s*\|+', '', passage)
    passage = ' '.join(passage.split())
    return passage

def find_aligned_english(en_paras: List[str], norm_pos_ratio: float) -> str:
    if not en_paras:
        return ""
    target_idx = int(norm_pos_ratio * len(en_paras))
    target_idx = max(0, min(len(en_paras) - 1, target_idx))

    # Look around target_idx for best explanatory paragraph
    best_p = en_paras[target_idx]
    best_score = 0

    start_scan = max(0, target_idx - 2)
    end_scan = min(len(en_paras), target_idx + 3)

    for i in range(start_scan, end_scan):
        p = en_paras[i]
        if len(p) < 40:
            continue
        score = 0
        if any(w in p.lower() for w in ['allah', 'god', 'qur', 'verse', 'say', 'heart', 'soul', 'meaning', 'stated']):
            score += 3
        if '"' in p or '“' in p or '”' in p:
            score += 2
        # Prefer closer paragraphs
        score -= abs(i - target_idx) * 0.5
        if score > best_score:
            best_score = score
            best_p = p

    clean_p = re.sub(r'^###\s*', '', best_p).strip()
    return clean_p

def classify_content(arabic: str, english: str) -> tuple:
    al = arabic.lower()
    el = english.lower()

    if any(k in al for k in ['دعاء', 'ادعوني', 'استجب', 'يا رب', 'اللهم']) or 'supplication' in el or "du'a" in el:
        return 'dua', "Du'a", "Al-Ghazali on supplications, prayers, and their spiritual power"
    if any(k in al for k in ['صلى الله عليه', 'قال رسول', 'روي عن', 'حديث']) or 'hadith' in el or 'narrated' in el:
        return 'hadith', 'Hadith', "Prophetic traditions and scholastic commentary by Al-Ghazali"
    if any(k in al for k in ['قلب', 'سر', 'معرفة', 'نور', 'إخلاص', 'يقين']) or 'heart' in el or 'spiritual' in el:
        return 'spiritual', 'Insight', "Al-Ghazali's epistemic insights into the spiritual heart and inner faith"
    if any(k in al for k in ['خلق', 'صبر', 'شكر', 'حسد', 'رياء', 'تواضع']) or 'ethics' in el or 'patience' in el or 'character' in el:
        return 'ethics', 'Ethics', "Al-Ghazali on purifying the character, moral diseases, and spiritual remedies"
    if any(k in al for k in ['ذكر', 'تسبيح', 'استغفار', 'تهليل']) or 'dhikr' in el or 'remembrance' in el:
        return 'dhikr', 'Dhikr', "Al-Ghazali on constant remembrance of God and contemplative invocations"
    if any(k in al for k in ['صلاة', 'زكاة', 'صوم', 'حج', 'طهارة']) or 'prayer' in el or 'worship' in el:
        return 'fiqh', 'Worship', "Al-Ghazali on the inner and outer dimensions of worship"
    if any(k in al for k in ['موت', 'قبر', 'آخرة', 'جنة', 'نار', 'حساب']) or 'death' in el or 'afterlife' in el:
        return 'afterlife', 'Afterlife', "Al-Ghazali on the journey of the soul, death, and the Hereafter"
    return 'general', 'Commentary', "Classical commentary from Al-Ghazali's Ihya Ulum al-Din"

def assign_book_title(chapter_idx: int, sec_title: str) -> str:
    if 1 <= chapter_idx <= len(BOOK_NAMES):
        return BOOK_NAMES[chapter_idx - 1]
    for b in BOOK_NAMES:
        key = b.split('(')[0].strip()
        if key.lower() in sec_title.lower():
            return b
    return "Ihya Ulum al-Din"

def main():
    print("[1/5] Loading Ihya v4 Translation Corpus...")
    with open(IHYA_V4_PATH, 'r', encoding='utf-8') as f:
        v4_sections = json.load(f)
    print(f"  Loaded {len(v4_sections)} translated sections ({os.path.getsize(IHYA_V4_PATH):,} bytes)")

    # Index sections for fast sub-string location
    indexed_sections = []
    for idx, s in enumerate(v4_sections):
        ar_raw = s.get('arabic_text', '')
        en_raw = s.get('translation', '')
        ar_norm = normalize_arabic(ar_raw)
        en_paras = [p.strip() for p in en_raw.split('\n\n') if p.strip()]
        ch_idx = s.get('chapter_index', idx + 1)
        title_ar = s.get('title_ar', f'Section {idx + 1}')
        title_en = s.get('title_en', f'Section {idx + 1}')
        anchors = s.get('anchors', '')
        indexed_sections.append({
            'idx': idx,
            'chapter_index': ch_idx,
            'title_ar': title_ar,
            'title_en': title_en,
            'raw_ar': ar_raw,
            'norm_ar': ar_norm,
            'raw_en': en_raw,
            'en_paras': en_paras,
            'anchors': anchors,
            'book_title': assign_book_title(ch_idx, title_en)
        })

    print("[2/5] Loading Extracted Citations...")
    with open(EXTRACTION_INPUT, 'r', encoding='utf-8') as f:
        citations = json.load(f)
    print(f"  Loaded {len(citations)} citations")

    print("[3/5] Aligning & Extracting Verse Commentary...")
    tafsir_by_verse = defaultdict(list)
    seen_hashes = set()
    matched_count = 0

    for cit in citations:
        vk = cit.get('verse_key', '')
        if not vk or ':' not in vk:
            continue
        found = cit.get('found_text', '').strip()
        norm_target = normalize_arabic(found)
        if len(norm_target) < 6:
            continue

        # Locate match in indexed sections
        best_hit = None
        for sec in indexed_sections:
            pos = sec['norm_ar'].find(norm_target)
            if pos != -1:
                best_hit = (sec, pos)
                break

        if not best_hit:
            parts = norm_target.split()
            if len(parts) >= 4:
                sub = ' '.join(parts[:4])
                for sec in indexed_sections:
                    pos = sec['norm_ar'].find(sub)
                    if pos != -1:
                        best_hit = (sec, pos)
                        break

        if best_hit:
            matched_count += 1
            sec, norm_pos = best_hit
            norm_len = len(sec['norm_ar'])
            pos_ratio = norm_pos / max(1, norm_len)
            raw_pos = int(pos_ratio * len(sec['raw_ar']))
            raw_pos = max(0, min(len(sec['raw_ar']) - 1, raw_pos))

            ar_passage = clean_arabic_passage(sec['raw_ar'], raw_pos, len(found))
            if len(ar_passage) < 25:
                continue

            h = hashlib.md5(f"{vk}_{normalize_arabic(ar_passage[:100])}".encode('utf-8')).hexdigest()
            if h in seen_hashes:
                continue
            seen_hashes.add(h)

            en_passage = find_aligned_english(sec['en_paras'], pos_ratio)
            if len(en_passage) < 30:
                continue

            ctype, badge, topic_desc = classify_content(ar_passage, en_passage)
            effective_book = sec['book_title']

            tafsir_by_verse[vk].append({
                'arabic': ar_passage,
                'english': en_passage,
                'book_title': effective_book,
                'section_title_ar': sec['title_ar'],
                'section_title_en': sec['title_en'],
                'section_index': sec['chapter_index'],
                'anchors': sec['anchors'] if len(sec['anchors']) > 10 else None,
                'content_type': ctype,
                'topic': f"{topic_desc}, from '{effective_book}'",
                'badge': badge,
            })

    print(f"  Matched {matched_count} citations across {len(tafsir_by_verse)} unique verses")

    # Sort & cap per verse
    final_tafsir = {}
    total_entries = 0
    for vk, entries in tafsir_by_verse.items():
        entries.sort(key=lambda e: (1 if e.get('anchors') else 0, len(e['english'])), reverse=True)
        capped = entries[:3]
        final_tafsir[vk] = capped
        total_entries += len(capped)

    print(f"[4/5] Writing Master Tafsir Dataset ({total_entries} entries across {len(final_tafsir)} verses)...")
    with open(OUTPUT_MASTER, 'w', encoding='utf-8') as f:
        json.dump(final_tafsir, f, indent=2, ensure_ascii=False)

    print("[5/5] Re-injecting Tafsir and Authoritative Words into all 114 Chunks...")
    conn = sqlite3.connect(WORDS_DB)
    cur = conn.cursor()
    allwords_rows = cur.execute('SELECT sura, ayah, word, bn, en FROM allwords ORDER BY sura, ayah, word').fetchall()
    conn.close()

    db_words = defaultdict(lambda: defaultdict(dict))
    for sura, ayah, word, bn, en in allwords_rows:
        # Clean 'ʿع' to 'ع'
        clean_en = en.replace('ʿ', '').strip() if en else ''
        db_words[sura][ayah][word] = (bn.strip() if bn else '', clean_en)

    for s in range(1, 115):
        chunk_path = os.path.join(CHUNKS_DIR, f'surah_{s}.dat')
        if not os.path.exists(chunk_path):
            continue

        with open(chunk_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        verses = data.get('verses', [])
        surah_tafsir = {}

        for v in verses:
            ayah = v['ayah']
            vk = f"{s}:{ayah}"

            # Tafsir
            if vk in final_tafsir:
                surah_tafsir[str(ayah)] = final_tafsir[vk]
                v['hasIhya'] = True
            else:
                v['hasIhya'] = False

            # Words
            ayah_w = db_words[s][ayah]
            for w_idx, w in enumerate(v.get('words', [])):
                word_num = w_idx + 1
                if word_num in ayah_w:
                    bn, en = ayah_w[word_num]
                    if en:
                        w['translit'] = en
                    if not w.get('latinTranslit') and w.get('transliteration'):
                        w['latinTranslit'] = w.get('transliteration')
                    elif not w.get('latinTranslit') and bn:
                        w['latinTranslit'] = bn

        data['tafsir'] = surah_tafsir

        with open(chunk_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)

        android_dest = os.path.join(ANDROID_CHUNKS, f'surah_{s}.dat')
        with open(android_dest, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)

    print("Done! Successfully re-built all 114 chunks with elevated Tafsir and clean RTL transliteration!")

if __name__ == '__main__':
    main()
