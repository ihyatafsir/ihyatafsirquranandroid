#!/usr/bin/env python3
"""
Process Quran data v5 - Book Titles & UI Polish
"""
import json
import sqlite3
import os

BASE_DIR = "/home/absolut7/Documents/26apps/ihyatafsir-android/assets"
ALQURAN_DB_DIR = "/home/absolut7/Documents/alquranapk/Al.Quran.ver.1.20.1.build.115_decompiled/assets/databases"
IHYA_JSONL = "/home/absolut7/Documents/ihyalovesecond/deepseek_analysis_results.jsonl"

# Mapping specific filenames to Book Titles
BOOK_TITLES = {
    # Vol 1
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
    
    # Vol 2
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
    
    # Vol 3
    "vol3_j3-k01": "Disciplining the Soul",
    "vol3_Vol3-book2a": "Breaking the Two Desires",
    "vol3_Vol3-book3a": "Harms of the Tongue",
    "vol3_Vol3-book4a": "Condemnation of Anger and Hatred",
    "vol3_Vol3-book5a": "Condemnation of Envy",
    "vol3_Vol3-book-6a": "Condemnation of the World",
    "vol3_Vol3-book-7a": "Condemnation of Miserliness and Love of Wealth",
    "vol3_Vol3-book-8a": "Condemnation of Status and Ostentation",
    "vol3_Vol3-book-9a": "Condemnation of Pride and Conceit",
    "vol3_Vol3-book-10a": "Condemnation of Delusion",
    
    # Vol 4
    "vol4_Vol4-book1": "Book of Repentance",
    "vol4_Vol4-book2": "Patience and Gratitude",
    "vol4_Vol4-book3": "Fear and Hope",
    "vol4_Vol4-book4": "Poverty and Abstinence",
    "vol4_Vol4-book5": "Monotheism and Reliance",
    "vol4_Vol4-book6": "Love, Longing, Intimacy and Contentment",
    "vol4_j4-k07-old": "Intention, Sincerity and Truthfulness", # mapping fallback
    "vol4_j4-k08": "Monitoring and Accounting",
    "vol4_j4-k09": "Contemplation",
    "vol4_Vol4-book10": "Remembrance of Death and Afterlife"
}

def get_book_title(filename):
    # Try exact match first
    base = filename.replace('_en', '').replace('.txt', '')
    if base in BOOK_TITLES:
        return BOOK_TITLES[base]
    
    # Fuzzy match
    for key, title in BOOK_TITLES.items():
        if key in base:
            return title
            
    return filename.replace('_', ' ').replace('-', ' ').title()

def get_surahs():
    conn = sqlite3.connect(f"{ALQURAN_DB_DIR}/quran.db")
    cursor = conn.cursor()
    cursor.execute("SELECT sura, ayah, text FROM verses ORDER BY sura, ayah")
    surah_verses = {}
    for row in cursor:
        sura = row[0]
        surah_verses[sura] = surah_verses.get(sura, 0) + 1
    conn.close()
    
    surahs = [
        {"number": 1, "name": "Al-Fatihah", "arabic": "الفاتحة", "type": "Meccan"},
        {"number": 2, "name": "Al-Baqarah", "arabic": "البقرة", "type": "Medinan"},
        {"number": 3, "name": "Aali Imran", "arabic": "آل عمران", "type": "Medinan"},
        {"number": 4, "name": "An-Nisa", "arabic": "النساء", "type": "Medinan"},
        {"number": 5, "name": "Al-Ma'idah", "arabic": "المائدة", "type": "Medinan"},
        {"number": 6, "name": "Al-An'am", "arabic": "الأنعام", "type": "Meccan"},
        {"number": 7, "name": "Al-A'raf", "arabic": "الأعراف", "type": "Meccan"},
        {"number": 8, "name": "Al-Anfal", "arabic": "الأنفال", "type": "Medinan"},
        {"number": 9, "name": "At-Tawbah", "arabic": "التوبة", "type": "Medinan"},
        {"number": 10, "name": "Yunus", "arabic": "يونس", "type": "Meccan"},
        {"number": 11, "name": "Hud", "arabic": "هود", "type": "Meccan"},
        {"number": 12, "name": "Yusuf", "arabic": "يوسف", "type": "Meccan"},
        {"number": 13, "name": "Ar-Ra'd", "arabic": "الرعد", "type": "Medinan"},
        {"number": 14, "name": "Ibrahim", "arabic": "إبراهيم", "type": "Meccan"},
        {"number": 15, "name": "Al-Hijr", "arabic": "الحجر", "type": "Meccan"},
        {"number": 16, "name": "An-Nahl", "arabic": "النحل", "type": "Meccan"},
        {"number": 17, "name": "Al-Isra", "arabic": "الإسراء", "type": "Meccan"},
        {"number": 18, "name": "Al-Kahf", "arabic": "الكهف", "type": "Meccan"},
        {"number": 19, "name": "Maryam", "arabic": "مريم", "type": "Meccan"},
        {"number": 20, "name": "Ta-Ha", "arabic": "طه", "type": "Meccan"},
        {"number": 21, "name": "Al-Anbiya", "arabic": "الأنبياء", "type": "Meccan"},
        {"number": 22, "name": "Al-Hajj", "arabic": "الحج", "type": "Medinan"},
        {"number": 23, "name": "Al-Mu'minun", "arabic": "المؤمنون", "type": "Meccan"},
        {"number": 24, "name": "An-Nur", "arabic": "النور", "type": "Medinan"},
        {"number": 25, "name": "Al-Furqan", "arabic": "الفرقان", "type": "Meccan"},
        {"number": 26, "name": "Ash-Shu'ara", "arabic": "الشعراء", "type": "Meccan"},
        {"number": 27, "name": "An-Naml", "arabic": "النمل", "type": "Meccan"},
        {"number": 28, "name": "Al-Qasas", "arabic": "القصص", "type": "Meccan"},
        {"number": 29, "name": "Al-Ankabut", "arabic": "العنكبوت", "type": "Meccan"},
        {"number": 30, "name": "Ar-Rum", "arabic": "الروم", "type": "Meccan"},
        {"number": 31, "name": "Luqman", "arabic": "لقمان", "type": "Meccan"},
        {"number": 32, "name": "As-Sajdah", "arabic": "السجدة", "type": "Meccan"},
        {"number": 33, "name": "Al-Ahzab", "arabic": "الأحزاب", "type": "Medinan"},
        {"number": 34, "name": "Saba", "arabic": "سبأ", "type": "Meccan"},
        {"number": 35, "name": "Fatir", "arabic": "فاطر", "type": "Meccan"},
        {"number": 36, "name": "Ya-Sin", "arabic": "يس", "type": "Meccan"},
        {"number": 37, "name": "As-Saffat", "arabic": "الصافات", "type": "Meccan"},
        {"number": 38, "name": "Sad", "arabic": "ص", "type": "Meccan"},
        {"number": 39, "name": "Az-Zumar", "arabic": "الزمر", "type": "Meccan"},
        {"number": 40, "name": "Ghafir", "arabic": "غافر", "type": "Meccan"},
        {"number": 41, "name": "Fussilat", "arabic": "فصلت", "type": "Meccan"},
        {"number": 42, "name": "Ash-Shura", "arabic": "الشورى", "type": "Meccan"},
        {"number": 43, "name": "Az-Zukhruf", "arabic": "الزخرف", "type": "Meccan"},
        {"number": 44, "name": "Ad-Dukhan", "arabic": "الدخان", "type": "Meccan"},
        {"number": 45, "name": "Al-Jathiyah", "arabic": "الجاثية", "type": "Meccan"},
        {"number": 46, "name": "Al-Ahqaf", "arabic": "الأحقاف", "type": "Meccan"},
        {"number": 47, "name": "Muhammad", "arabic": "محمد", "type": "Medinan"},
        {"number": 48, "name": "Al-Fath", "arabic": "الفتح", "type": "Medinan"},
        {"number": 49, "name": "Al-Hujurat", "arabic": "الحجرات", "type": "Medinan"},
        {"number": 50, "name": "Qaf", "arabic": "ق", "type": "Meccan"},
        {"number": 51, "name": "Adh-Dhariyat", "arabic": "الذاريات", "type": "Meccan"},
        {"number": 52, "name": "At-Tur", "arabic": "الطور", "type": "Meccan"},
        {"number": 53, "name": "An-Najm", "arabic": "النجم", "type": "Meccan"},
        {"number": 54, "name": "Al-Qamar", "arabic": "القمر", "type": "Meccan"},
        {"number": 55, "name": "Ar-Rahman", "arabic": "الرحمن", "type": "Medinan"},
        {"number": 56, "name": "Al-Waqi'ah", "arabic": "الواقعة", "type": "Meccan"},
        {"number": 57, "name": "Al-Hadid", "arabic": "الحديد", "type": "Medinan"},
        {"number": 58, "name": "Al-Mujadila", "arabic": "المجادلة", "type": "Medinan"},
        {"number": 59, "name": "Al-Hashr", "arabic": "الحشر", "type": "Medinan"},
        {"number": 60, "name": "Al-Mumtahanah", "arabic": "الممتحنة", "type": "Medinan"},
        {"number": 61, "name": "As-Saff", "arabic": "الصف", "type": "Medinan"},
        {"number": 62, "name": "Al-Jumu'ah", "arabic": "الجمعة", "type": "Medinan"},
        {"number": 63, "name": "Al-Munafiqun", "arabic": "المنافقون", "type": "Medinan"},
        {"number": 64, "name": "At-Taghabun", "arabic": "التغابن", "type": "Medinan"},
        {"number": 65, "name": "At-Talaq", "arabic": "الطلاق", "type": "Medinan"},
        {"number": 66, "name": "At-Tahrim", "arabic": "التحريم", "type": "Medinan"},
        {"number": 67, "name": "Al-Mulk", "arabic": "الملك", "type": "Meccan"},
        {"number": 68, "name": "Al-Qalam", "arabic": "القلم", "type": "Meccan"},
        {"number": 69, "name": "Al-Haqqah", "arabic": "الحاقة", "type": "Meccan"},
        {"number": 70, "name": "Al-Ma'arij", "arabic": "المعارج", "type": "Meccan"},
        {"number": 71, "name": "Nuh", "arabic": "نوح", "type": "Meccan"},
        {"number": 72, "name": "Al-Jinn", "arabic": "الجن", "type": "Meccan"},
        {"number": 73, "name": "Al-Muzzammil", "arabic": "المزمل", "type": "Meccan"},
        {"number": 74, "name": "Al-Muddaththir", "arabic": "المدثر", "type": "Meccan"},
        {"number": 75, "name": "Al-Qiyamah", "arabic": "القيامة", "type": "Meccan"},
        {"number": 76, "name": "Al-Insan", "arabic": "الإنسان", "type": "Medinan"},
        {"number": 77, "name": "Al-Mursalat", "arabic": "المرسلات", "type": "Meccan"},
        {"number": 78, "name": "An-Naba", "arabic": "النبأ", "type": "Meccan"},
        {"number": 79, "name": "An-Nazi'at", "arabic": "النازعات", "type": "Meccan"},
        {"number": 80, "name": "Abasa", "arabic": "عبس", "type": "Meccan"},
        {"number": 81, "name": "At-Takwir", "arabic": "التكوير", "type": "Meccan"},
        {"number": 82, "name": "Al-Infitar", "arabic": "الانفطار", "type": "Meccan"},
        {"number": 83, "name": "Al-Mutaffifin", "arabic": "المطففين", "type": "Meccan"},
        {"number": 84, "name": "Al-Inshiqaq", "arabic": "الانشقاق", "type": "Meccan"},
        {"number": 85, "name": "Al-Buruj", "arabic": "البروج", "type": "Meccan"},
        {"number": 86, "name": "At-Tariq", "arabic": "الطارق", "type": "Meccan"},
        {"number": 87, "name": "Al-A'la", "arabic": "الأعلى", "type": "Meccan"},
        {"number": 88, "name": "Al-Ghashiyah", "arabic": "الغاشية", "type": "Meccan"},
        {"number": 89, "name": "Al-Fajr", "arabic": "الفجر", "type": "Meccan"},
        {"number": 90, "name": "Al-Balad", "arabic": "البلد", "type": "Meccan"},
        {"number": 91, "name": "Ash-Shams", "arabic": "الشمس", "type": "Meccan"},
        {"number": 92, "name": "Al-Layl", "arabic": "الليل", "type": "Meccan"},
        {"number": 93, "name": "Ad-Duha", "arabic": "الضحى", "type": "Meccan"},
        {"number": 94, "name": "Ash-Sharh", "arabic": "الشرح", "type": "Meccan"},
        {"number": 95, "name": "At-Tin", "arabic": "التين", "type": "Meccan"},
        {"number": 96, "name": "Al-Alaq", "arabic": "العلق", "type": "Meccan"},
        {"number": 97, "name": "Al-Qadr", "arabic": "القدر", "type": "Meccan"},
        {"number": 98, "name": "Al-Bayyinah", "arabic": "البينة", "type": "Medinan"},
        {"number": 99, "name": "Az-Zalzalah", "arabic": "الزلزلة", "type": "Medinan"},
        {"number": 100, "name": "Al-Adiyat", "arabic": "العاديات", "type": "Meccan"},
        {"number": 101, "name": "Al-Qari'ah", "arabic": "القارعة", "type": "Meccan"},
        {"number": 102, "name": "At-Takathur", "arabic": "التكاثر", "type": "Meccan"},
        {"number": 103, "name": "Al-Asr", "arabic": "العصر", "type": "Meccan"},
        {"number": 104, "name": "Al-Humazah", "arabic": "الهمزة", "type": "Meccan"},
        {"number": 105, "name": "Al-Fil", "arabic": "الفيل", "type": "Meccan"},
        {"number": 106, "name": "Quraysh", "arabic": "قريش", "type": "Meccan"},
        {"number": 107, "name": "Al-Ma'un", "arabic": "الماعون", "type": "Meccan"},
        {"number": 108, "name": "Al-Kawthar", "arabic": "الكوثر", "type": "Meccan"},
        {"number": 109, "name": "Al-Kafirun", "arabic": "الكافرون", "type": "Meccan"},
        {"number": 110, "name": "An-Nasr", "arabic": "النصر", "type": "Medinan"},
        {"number": 111, "name": "Al-Masad", "arabic": "المسد", "type": "Meccan"},
        {"number": 112, "name": "Al-Ikhlas", "arabic": "الإخلاص", "type": "Meccan"},
        {"number": 113, "name": "Al-Falaq", "arabic": "الفلق", "type": "Meccan"},
        {"number": 114, "name": "An-Nas", "arabic": "الناس", "type": "Meccan"}
    ]
    for s in surahs:
        s['verses'] = surah_verses.get(s['number'], 0)
    return surahs

def process_data():
    print("Processing Quran verses & Translations (v5)...")
    
    # LOAD DBs
    conn_quran = sqlite3.connect(f"{ALQURAN_DB_DIR}/quran.db")
    cursor_quran = conn_quran.cursor()
    cursor_quran.execute("SELECT sura, ayah, text FROM verses ORDER BY sura, ayah")
    verses_text = {f"{r[0]}:{r[1]}": r[2] for r in cursor_quran}
    conn_quran.close()
    
    conn_trans = sqlite3.connect(f"{ALQURAN_DB_DIR}/en_sahih.db")
    cursor_trans = conn_trans.cursor()
    cursor_trans.execute("SELECT sura, ayah, text FROM verses ORDER BY sura, ayah")
    translations = {f"{r[0]}:{r[1]}": r[2] for r in cursor_trans}
    conn_trans.close()

    print("Processing Word-by-Word data (Corpus + Words)...")
    # WORDS (Translit)
    conn_words = sqlite3.connect(f"{ALQURAN_DB_DIR}/words.db")
    cursor_words = conn_words.cursor()
    cursor_words.execute("SELECT sura, ayah, word, en FROM allwords ORDER BY sura, ayah, word")
    words_map = {}
    for r in cursor_words:
        key = f"{r[0]}:{r[1]}:{r[2]}"
        words_map[key] = {"translit": r[3] if r[3] else ""}
    conn_words.close()
    
    # CORPUS (Arabic)
    conn_corpus = sqlite3.connect(f"{ALQURAN_DB_DIR}/corpus.db")
    cursor_corpus = conn_corpus.cursor()
    cursor_corpus.execute("SELECT surah, ayah, word, ar1, ar2, ar3, ar4, ar5 FROM corpus ORDER BY surah, ayah, word")
    
    verses_words = {}
    for r in cursor_corpus:
        sura, ayah, word_num = r[0], r[1], r[2]
        arabic_word = "".join([seg for seg in r[3:] if seg])
        
        word_key = f"{sura}:{ayah}:{word_num}"
        verse_key = f"{sura}:{ayah}"
        
        if verse_key not in verses_words:
            verses_words[verse_key] = []
            
        translit = ""
        if word_key in words_map:
            translit = words_map[word_key]["translit"]
            
        verses_words[verse_key].append({
            "id": word_num,
            "arabic": arabic_word,
            "translit": translit
        })
    conn_corpus.close()

    print("Processing Ihya Tafsir with Book Titles...")
    ihya_tafsir = {}
    if os.path.exists(IHYA_JSONL):
        with open(IHYA_JSONL, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    ref = entry.get('custom_id', '')
                    if ':' in ref and entry.get('analysis', {}).get('english_text'):
                        if ref not in ihya_tafsir:
                            ihya_tafsir[ref] = []
                        filename = entry.get('file', '')
                        ihya_tafsir[ref].append({
                            "arabic": entry['analysis'].get('arabic_snippet', '')[:500],
                            "english": entry['analysis'].get('english_text', ''),
                            "book_file": filename,
                            "book_title": get_book_title(filename)
                        })
                except:
                    continue

    print("Building final JSONs...")
    surahs = get_surahs()
    combined_verses = {}
    for sura in surahs:
        sura_num = sura['number']
        combined_verses[sura_num] = []
        for i in range(1, sura['verses'] + 1):
            key = f"{sura_num}:{i}"
            wbw = verses_words.get(key, [])
            wbw.sort(key=lambda x: x['id'])
            
            combined_verses[sura_num].append({
                "ayah": i,
                "text": verses_text.get(key, ""),
                "translation": translations.get(key, ""),
                "words": wbw,
                "hasIhya": key in ihya_tafsir
            })

    with open(f"{BASE_DIR}/surahs.json", 'w') as f:
        json.dump(surahs, f)
    with open(f"{BASE_DIR}/verses_v4.json", 'w') as f: # Overwrite v4
        json.dump(combined_verses, f)
    with open(f"{BASE_DIR}/ihya_tafsir.json", 'w') as f:
        json.dump(ihya_tafsir, f)
        
    print("Done v5!")

if __name__ == "__main__":
    process_data()
