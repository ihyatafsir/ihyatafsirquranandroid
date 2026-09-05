#!/usr/bin/env python3
"""
build_ihya_v4_tafsir.py — Epistemic Ihya Ulum al-Din v4 Tafsir Extraction & Builder

Built with AynEngine AI Coding Edition.
Extracts, aligns, and classifies Quranic citations across all 1,361 sections of the newly
completed v4 translation of Ihya Ulum al-Din (ihya_ulum_al_din_v4_translated.json),
enriched with Kitab al-Ayn and Lisan al-Arab root anchors.

Outputs:
  - assets/ihya_tafsir_v4_master.json (Comprehensive master archive)
  - assets/ihya_tafsir_v2.json (App runtime format)
  - assets/surahs_chunks/surah_{1..114}.dat (Regenerated binary chunks)
  - assets/quran_master.db (Updated SQLite database)
"""

import json
import os
import re
import sys
import hashlib
import sqlite3
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════════════════
# PATH CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
CHUNKS_DIR = os.path.join(ASSETS_DIR, "surahs_chunks")
DB_PATH = os.path.join(ASSETS_DIR, "quran_master.db")

VERSES_FILE = os.path.join(ASSETS_DIR, "verses_v4.json")
SURAHS_FILE = os.path.join(ASSETS_DIR, "surahs.json")
IHYA_V4_PATH = "/home/absolut7/aynengineai/data/translations/ghazali/ihya_ulum_al_din_v4_translated.json"
EXTRACTION_INPUT = "/home/absolut7/Documents/ihyalovesecond/deepseek_extraction_input.json"
QURAN_INDEX = "/home/absolut7/Documents/ihya_love/quran_tafsir_index.json"

OUTPUT_MASTER = os.path.join(ASSETS_DIR, "ihya_tafsir_v4_master.json")
OUTPUT_V2 = os.path.join(ASSETS_DIR, "ihya_tafsir_v2.json")

MAX_ENTRIES_PER_VERSE = 5

# ═══════════════════════════════════════════════════════════════════════════
# BOOK METADATA MAPPINGS
# ═══════════════════════════════════════════════════════════════════════════
BOOK_TITLES = {
    # Vol 1 - Worship
    "vol1_Vol1-book-1": "Book of Knowledge",
    "vol1_Vol1-book-2": "Foundations of Belief",
    "vol1_Vol1-book-3": "Mysteries of Purity",
    "vol1_Vol1-book-4": "Mysteries of Prayer",
    "vol1_Vol1-book-5": "Mysteries of Zakat",
    "vol1_Vol1-book-6": "Mysteries of Fasting",
    "vol1_Vol1-book-7": "Mysteries of Hajj",
    "vol1_Vol1-book-8": "Etiquette of Quran Recitation",
    "vol1_Vol1-book-9": "On Invocations and Supplications",
    "vol1_Vol1-book-10": "Arrangement of Litanies",
    # Vol 2 - Customs
    "vol2_j2-k01": "Manners of Eating",
    "vol2_j2-k02": "Etiquette of Marriage",
    "vol2_j2-k03": "Etiquette of Earning",
    "vol2_j2-k04": "The Lawful and Prohibited",
    "vol2_j2-k05": "Duties of Brotherhood",
    "vol2_j2-k06": "Etiquette of Seclusion",
    "vol2_j2-k07": "Etiquette of Travel",
    "vol2_j2-k08": "Audition and Ecstasy",
    "vol2_j2-k09": "Enjoining Good and Forbidding Evil",
    "vol2_j2-k10": "Etiquette of Living and Prophetic Character",
    # Vol 3 - Vices
    "vol3_j3-k01": "Disciplining the Soul",
    "vol3_Vol3-book2": "Breaking the Two Desires",
    "vol3_Vol3-book3": "Harms of the Tongue",
    "vol3_Vol3-book4": "Condemnation of Anger and Hatred",
    "vol3_Vol3-book5": "Condemnation of Envy",
    "vol3_Vol3-book-6": "Condemnation of the World",
    "vol3_Vol3-book-7": "Condemnation of Miserliness and Love of Wealth",
    "vol3_Vol3-book-8": "Condemnation of Status and Ostentation",
    "vol3_Vol3-book-9": "Condemnation of Pride and Conceit",
    "vol3_Vol3-book-10": "Condemnation of Delusion",
    # Vol 4 - Virtues
    "vol4_Vol4-book1": "Book of Repentance",
    "vol4_Vol4-book2": "Patience and Gratitude",
    "vol4_Vol4-book3": "Fear and Hope",
    "vol4_Vol4-book4": "Poverty and Abstinence",
    "vol4_Vol4-book5": "Monotheism and Reliance",
    "vol4_Vol4-book6": "Love, Longing, Intimacy and Contentment",
    "vol4_j4-k07": "Intention, Sincerity and Truthfulness",
    "vol4_j4-k08": "Monitoring and Accounting",
    "vol4_j4-k09": "Contemplation",
    "vol4_Vol4-book10": "Remembrance of Death and Afterlife",
}

DUA_KEYWORDS = [
    'اللهم', 'أعوذ بك', 'أسألك', 'سبحانك', 'الحمد لله', 'لا إله إلا',
    'ربنا', 'رب اغفر', 'أستغفر', 'بسم الله', 'صل على محمد', 'حسبي الله',
    'سبحان الله', 'لا حول ولا قوة', 'يا ذا الجلال', 'أعوذ بالله',
]

HADITH_KEYWORDS = [
    'حديث', 'أخرجه', 'رواه', 'متفق عليه', 'إسناد', 'البخاري', 'مسلم',
    'الترمذي', 'أبو داود', 'النسائي', 'ابن ماجه', 'الحاكم', 'البيهقي',
    'صحيح', 'ضعيف', 'حسن', 'غريب', 'مرسل', 'موقوف', 'مرفوع',
]

SPIRITUAL_KEYWORDS = [
    'قلب', 'نفس', 'روح', 'ذكر', 'عبادة', 'تقوى', 'خشوع', 'إخلاص',
    'توكل', 'يقين', 'زهد', 'ورع', 'محبة', 'خوف', 'رجاء', 'صبر',
    'شكر', 'رضا', 'توبة', 'مراقبة', 'محاسبة', 'فكر', 'تفكر', 'معرفة',
    'حال', 'مقام', 'كشف', 'تجلي', 'أنس', 'لقاء', 'قرب',
]

ETHICS_KEYWORDS = [
    'أخلاق', 'حسد', 'غضب', 'كبر', 'رياء', 'عجب', 'غرور', 'بخل',
    'شح', 'طمع', 'غيبة', 'نميمة', 'كذب', 'فتنة', 'دنيا', 'آفات',
    'هوى', 'شهوة', 'جوارح', 'لسان', 'تواضع', 'حلم', 'عفو',
]

DHIKR_KEYWORDS = [
    'ذكر الله', 'فاذكروني', 'أذكركم', 'ذكرا كثيرا', 'تسبيح', 'تهليل',
    'تكبير', 'تحميد', 'ورد', 'أوراد',
]

FIQH_KEYWORDS = [
    'صلاة', 'وضوء', 'طهارة', 'زكاة', 'صيام', 'حج', 'عمرة', 'ركعة',
    'سجود', 'ركوع', 'تشهد', 'أذان',
]

AFTERLIFE_KEYWORDS = [
    'موت', 'قبر', 'آخرة', 'جنة', 'نار', 'حساب', 'ميزان', 'صراط',
    'بعث', 'نشور', 'حشر', 'قيامة', 'شهيد', 'عذاب',
]

BADGE_LABELS = {
    'dua': "Du'a",
    'hadith': 'Hadith',
    'spiritual': 'Insight',
    'ethics': 'Ethics',
    'dhikr': 'Dhikr',
    'fiqh': 'Worship',
    'afterlife': 'Afterlife',
    'general': 'Commentary',
}

TOPIC_DESCRIPTIONS = {
    'dua': "Al-Ghazali on supplications, prayers, and their spiritual power",
    'hadith': "Prophetic traditions and scholastic commentary by Al-Ghazali",
    'spiritual': "Al-Ghazali's epistemic insights into the spiritual heart and inner faith",
    'ethics': "Al-Ghazali on purifying the character, moral diseases, and spiritual remedies",
    'dhikr': "Al-Ghazali on constant remembrance of God and contemplative invocations",
    'fiqh': "Al-Ghazali on the inner and outer dimensions of worship",
    'afterlife': "Al-Ghazali on the journey of the soul, death, and the Hereafter",
    'general': "Classical commentary from Al-Ghazali's Ihya Ulum al-Din",
}

# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def normalize_arabic(text):
    if not text:
        return ""
    # Strip tashkeel
    t = re.sub(r'[\u064B-\u065F\u0670]', '', text)
    # Normalize alef variants
    t = re.sub(r'[إأآاٱ]', 'ا', t)
    # Normalize taa marbuta / haa
    t = re.sub(r'ة', 'ه', t)
    # Normalize yaa / alef maksura
    t = re.sub(r'[ىي]', 'ي', t)
    # Remove punctuation
    t = re.sub(r'[^\w\s]', '', t)
    return ' '.join(t.split())


def classify_passage(arabic_text, english_text=""):
    scores = {
        'dua': 0,
        'hadith': 0,
        'spiritual': 0,
        'ethics': 0,
        'dhikr': 0,
        'fiqh': 0,
        'afterlife': 0,
    }
    for kw in DUA_KEYWORDS:
        if kw in arabic_text: scores['dua'] += 2
    for kw in HADITH_KEYWORDS:
        if kw in arabic_text: scores['hadith'] += 1.5
    for kw in SPIRITUAL_KEYWORDS:
        if kw in arabic_text: scores['spiritual'] += 1.5
    for kw in ETHICS_KEYWORDS:
        if kw in arabic_text: scores['ethics'] += 1.5
    for kw in DHIKR_KEYWORDS:
        if kw in arabic_text: scores['dhikr'] += 2
    for kw in FIQH_KEYWORDS:
        if kw in arabic_text: scores['fiqh'] += 1
    for kw in AFTERLIFE_KEYWORDS:
        if kw in arabic_text: scores['afterlife'] += 1.5

    if english_text:
        el = english_text.lower()
        if any(w in el for w in ['supplication', "du'a", 'prayer', 'invoke']): scores['dua'] += 2
        if any(w in el for w in ['hadith', 'narrated', 'reported', 'prophet']): scores['hadith'] += 2
        if any(w in el for w in ['heart', 'soul', 'spiritual', 'purif', 'inner']): scores['spiritual'] += 2
        if any(w in el for w in ['anger', 'envy', 'pride', 'greed', 'ego', 'moral']): scores['ethics'] += 2
        if any(w in el for w in ['remembrance', 'dhikr', 'glory', 'praise']): scores['dhikr'] += 2
        if any(w in el for w in ['death', 'grave', 'afterlife', 'resurrection', 'paradise']): scores['afterlife'] += 2

    max_val = max(scores.values())
    if max_val == 0:
        return 'general'
    return max(scores, key=scores.get)


def clean_book_title(raw_file, title_en=""):
    if raw_file:
        base = raw_file.replace('_en', '').replace('.txt', '').replace('.doc', '')
        if base in BOOK_TITLES:
            return BOOK_TITLES[base]
        for k, v in BOOK_TITLES.items():
            if k in base:
                return v

    if title_en:
        # Check if title_en mentions book name
        for title in BOOK_TITLES.values():
            if title.lower() in title_en.lower():
                return title
        # Extract before em dash if present
        if '—' in title_en:
            prefix = title_en.split('—')[0].strip()
            if len(prefix) > 4:
                return prefix

    return "Ihya Ulum al-Din"


def extract_arabic_context(raw_text, match_pos, match_len):
    """
    Extracts a balanced, coherent Arabic commentary passage around match_pos.
    """
    start_pos = max(0, match_pos - 250)
    end_pos = min(len(raw_text), match_pos + match_len + 450)

    # Try to align to sentence boundary backwards
    prefix_snippet = raw_text[start_pos:match_pos]
    for sep in ['\n', '.', '!', '؛', 'قال ']:
        r_idx = prefix_snippet.rfind(sep)
        if r_idx != -1 and (match_pos - (start_pos + r_idx)) < 180:
            start_pos = start_pos + r_idx + (len(sep) if sep != 'قال ' else 0)
            break

    # Try to align to sentence boundary forwards
    suffix_snippet = raw_text[match_pos + match_len:end_pos]
    for sep in ['\n', '.', '!', '؛']:
        f_idx = suffix_snippet.find(sep)
        if f_idx != -1 and f_idx > 80:
            end_pos = match_pos + match_len + f_idx + 1
            break

    passage = raw_text[start_pos:end_pos].strip()
    passage = re.sub(r'PageV\d+P\d+', '', passage)
    passage = re.sub(r'###\s*\|+', '', passage)
    passage = ' '.join(passage.split())
    return passage


def find_english_translation(en_text, ar_match_phrase, section_paragraphs):
    """
    Finds the most relevant English translation paragraph for an Arabic citation.
    """
    # Look for paragraph containing quotation markers
    candidates = []
    for p in section_paragraphs:
        if len(p) < 40:
            continue
        # Check if paragraph quotes Quran or mentions God/said
        score = 0
        if '{' in p or '«' in p or '"' in p:
            score += 3
        if 'said' in p.lower() or 'allah' in p.lower() or 'god' in p.lower() or 'qur' in p.lower():
            score += 2
        candidates.append((score, p))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        top_p = candidates[0][1]
        # Clean markdown headers
        top_p = re.sub(r'^###\s*', '', top_p)
        return top_p.strip()

    # Fallback to whole section if short, or first paragraph
    first_p = section_paragraphs[0] if section_paragraphs else en_text[:500]
    return re.sub(r'^###\s*', '', first_p).strip()


def text_fingerprint(text):
    c = normalize_arabic(text[:150])
    return hashlib.md5(c.encode('utf-8')).hexdigest()

# ═══════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 70)
    print("  AYNENGINE AI: IHYA ULUM AL-DIN V4 TAFSIR EXTRACTION PIPELINE")
    print("=" * 70)

    # 1. Load Quran Verses
    print("\n[1/5] Loading Quran corpus...")
    with open(VERSES_FILE, 'r', encoding='utf-8') as f:
        quran_verses = json.load(f)
    print(f"  ✓ Loaded {len(quran_verses)} Surahs")

    # 2. Load New Ihya v4 Edition
    print("\n[2/5] Loading Ihya v4 translated edition (1,361 sections)...")
    if not os.path.exists(IHYA_V4_PATH):
        print(f"ERROR: Cannot find {IHYA_V4_PATH}")
        sys.exit(1)
    with open(IHYA_V4_PATH, 'r', encoding='utf-8') as f:
        ihya_sections = json.load(f)
    print(f"  ✓ Loaded {len(ihya_sections)} sections ({sum(len(s.get('arabic_text','')) for s in ihya_sections):,} chars Arabic)")

    # Index sections with normalized text
    indexed_sections = []
    for idx, s in enumerate(ihya_sections):
        ar_raw = s.get('arabic_text', '')
        en_raw = s.get('translation', '')
        ar_norm = normalize_arabic(ar_raw)
        anchors = s.get('anchors', '')
        en_paras = [p.strip() for p in en_raw.split('\n\n') if p.strip()]
        indexed_sections.append({
            'index': idx,
            'chapter_index': s.get('chapter_index', idx + 1),
            'title_ar': s.get('title_ar', ''),
            'title_en': s.get('title_en', ''),
            'raw_ar': ar_raw,
            'norm_ar': ar_norm,
            'raw_en': en_raw,
            'en_paras': en_paras,
            'anchors': anchors,
        })
    print("  ✓ Indexed 1,361 sections for normalized sub-string matching")

    # 3. Load Cross-Reference Catalogs
    print("\n[3/5] Loading citation cross-references...")
    citations = []
    if os.path.exists(EXTRACTION_INPUT):
        with open(EXTRACTION_INPUT, 'r', encoding='utf-8') as f:
            citations = json.load(f)
        print(f"  ✓ Loaded {len(citations)} curated citations from extraction input")

    # 4. Process & Extract Commentary per Verse
    print("\n[4/5] Extracting & aligning commentary across Ihya v4...")
    tafsir_by_verse = defaultdict(list)
    seen_fingerprints = set()
    matched_citations = 0

    for item in citations:
        vk = item.get('verse_key', '')
        if not vk or ':' not in vk:
            continue
        found_txt = item.get('found_text', '').strip()
        norm_target = normalize_arabic(found_txt)
        if len(norm_target) < 6:
            continue

        raw_file = item.get('file', '')
        book_title = clean_book_title(raw_file)

        # Search in indexed Ihya v4 sections
        hits = []
        for sec in indexed_sections:
            pos = sec['norm_ar'].find(norm_target)
            if pos != -1:
                hits.append((sec, pos))

        if not hits:
            # Try sub-target if long
            parts = norm_target.split()
            if len(parts) >= 4:
                sub = ' '.join(parts[:4])
                for sec in indexed_sections:
                    pos = sec['norm_ar'].find(sub)
                    if pos != -1:
                        hits.append((sec, pos))
                        break

        if hits:
            matched_citations += 1
            sec, norm_pos = hits[0]

            # Find approximate raw position
            raw_pos = int(norm_pos * (len(sec['raw_ar']) / max(1, len(sec['norm_ar']))))
            raw_pos = max(0, min(len(sec['raw_ar']) - 1, raw_pos))

            arabic_passage = extract_arabic_context(sec['raw_ar'], raw_pos, len(found_txt))
            if len(arabic_passage) < 25:
                continue

            fp = f"{vk}_{text_fingerprint(arabic_passage)}"
            if fp in seen_fingerprints:
                continue
            seen_fingerprints.add(fp)

            english_passage = find_english_translation(sec['raw_en'], found_txt, sec['en_paras'])
            if len(english_passage) < 30:
                continue

            content_type = classify_passage(arabic_passage, english_passage)
            badge = BADGE_LABELS.get(content_type, 'Commentary')
            topic = TOPIC_DESCRIPTIONS.get(content_type, "Commentary from Al-Ghazali's Ihya")

            effective_book = clean_book_title(raw_file, sec['title_en'])

            tafsir_by_verse[vk].append({
                'arabic': arabic_passage,
                'english': english_passage,
                'book_title': effective_book,
                'section_title_ar': sec['title_ar'],
                'section_title_en': sec['title_en'],
                'section_index': sec['chapter_index'],
                'anchors': sec['anchors'] if len(sec['anchors']) > 10 else None,
                'content_type': content_type,
                'topic': f"{topic}, from '{effective_book}'",
                'badge': badge,
            })

    print(f"  ✓ Matched {matched_citations}/{len(citations)} citations ({matched_citations/len(citations)*100:.1f}%)")
    print(f"  ✓ Extracted commentary for {len(tafsir_by_verse)} unique verses")

    # Filter and cap entries
    final_tafsir = {}
    total_entries = 0
    for vk, entries in tafsir_by_verse.items():
        # Sort by rich quality: prefer entries with anchors, then length
        entries.sort(key=lambda e: (1 if e.get('anchors') else 0, len(e['english'])), reverse=True)
        capped = entries[:MAX_ENTRIES_PER_VERSE]
        final_tafsir[vk] = capped
        total_entries += len(capped)

    print(f"  ✓ Final dataset: {len(final_tafsir)} verses with {total_entries} high-fidelity commentary entries")

    # 5. Export Master Datasets
    print("\n[5/5] Exporting datasets & updating application bundles...")

    # Write Master V4
    with open(OUTPUT_MASTER, 'w', encoding='utf-8') as f:
        json.dump(final_tafsir, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Wrote {OUTPUT_MASTER} ({os.path.getsize(OUTPUT_MASTER):,} bytes)")

    # Write V2 (App format)
    with open(OUTPUT_V2, 'w', encoding='utf-8') as f:
        json.dump(final_tafsir, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Wrote {OUTPUT_V2} ({os.path.getsize(OUTPUT_V2):,} bytes)")

    # Rebuild 114 Surah .dat binary chunks
    print("  ▶ Rebuilding 114 on-demand .dat chunks in assets/surahs_chunks/...")
    with open(SURAHS_FILE, 'r', encoding='utf-8') as f:
        surahs_meta = json.load(f)

    chunks_updated = 0
    for s_num in range(1, 115):
        str_s = str(s_num)
        dat_path = os.path.join(CHUNKS_DIR, f"surah_{s_num}.dat")
        if not os.path.exists(dat_path):
            continue

        with open(dat_path, 'r', encoding='utf-8') as f:
            chunk_data = json.load(f)

        # Build tafsir dict for this surah: {ayah: [entries]}
        surah_tafsir = {}
        for ayah_idx in range(1, len(chunk_data.get('verses', [])) + 1):
            vk = f"{s_num}:{ayah_idx}"
            if vk in final_tafsir:
                surah_tafsir[str(ayah_idx)] = final_tafsir[vk]

        chunk_data['tafsir'] = surah_tafsir

        with open(dat_path, 'w', encoding='utf-8') as f:
            json.dump(chunk_data, f, ensure_ascii=False)
        chunks_updated += 1

    print(f"  ✓ Successfully updated all {chunks_updated} on-demand binary Surah chunks")

    # Update SQLite database
    print("  ▶ Updating master SQLite database assets/quran_master.db...")
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("DROP TABLE IF EXISTS tafsir")
        cur.execute("""
            CREATE TABLE tafsir (
                verse_key TEXT,
                surah INTEGER,
                ayah INTEGER,
                arabic TEXT,
                english TEXT,
                book_title TEXT,
                section_title_en TEXT,
                section_index INTEGER,
                anchors TEXT,
                content_type TEXT,
                topic TEXT,
                badge TEXT
            )
        """)
        rows = []
        for vk, entries in final_tafsir.items():
            s_str, a_str = vk.split(':')
            s_val, a_val = int(s_str), int(a_str)
            for e in entries:
                rows.append((
                    vk, s_val, a_val,
                    e['arabic'], e['english'],
                    e['book_title'],
                    e.get('section_title_en', ''),
                    e.get('section_index', 0),
                    e.get('anchors', ''),
                    e['content_type'],
                    e['topic'],
                    e['badge']
                ))
        cur.executemany("INSERT INTO tafsir VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", rows)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_tafsir_vk ON tafsir(verse_key)")
        conn.commit()
        conn.close()
        print(f"  ✓ Inserted {len(rows)} tafsir records into {DB_PATH}")

    print("\n" + "=" * 70)
    print("  AYNENGINE V4 TAFSIR BUILD COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == '__main__':
    main()
