#!/usr/bin/env python3
"""
Process Quran data and Ihya Tafsir into JSON for React Native app
"""
import json
import sqlite3
import os

BASE_DIR = "/home/absolut7/Documents/26apps/ihyatafsir-android/assets"
ALQURAN_DB_DIR = "/home/absolut7/Documents/alquranapk/Al.Quran.ver.1.20.1.build.115_decompiled/assets/databases"
IHYA_JSONL = "/home/absolut7/Documents/ihyalovesecond/deepseek_analysis_results.jsonl"

# Surah metadata
SURAHS = [
    {"number": 1, "name": "Al-Fatihah", "arabic": "الفاتحة", "verses": 7, "type": "Meccan"},
    {"number": 2, "name": "Al-Baqarah", "arabic": "البقرة", "verses": 286, "type": "Medinan"},
    {"number": 3, "name": "Aali Imran", "arabic": "آل عمران", "verses": 200, "type": "Medinan"},
    {"number": 4, "name": "An-Nisa", "arabic": "النساء", "verses": 176, "type": "Medinan"},
    {"number": 5, "name": "Al-Ma'idah", "arabic": "المائدة", "verses": 120, "type": "Medinan"},
    {"number": 6, "name": "Al-An'am", "arabic": "الأنعام", "verses": 165, "type": "Meccan"},
    {"number": 7, "name": "Al-A'raf", "arabic": "الأعراف", "verses": 206, "type": "Meccan"},
    {"number": 8, "name": "Al-Anfal", "arabic": "الأنفال", "verses": 75, "type": "Medinan"},
    {"number": 9, "name": "At-Tawbah", "arabic": "التوبة", "verses": 129, "type": "Medinan"},
    {"number": 10, "name": "Yunus", "arabic": "يونس", "verses": 109, "type": "Meccan"},
    {"number": 11, "name": "Hud", "arabic": "هود", "verses": 123, "type": "Meccan"},
    {"number": 12, "name": "Yusuf", "arabic": "يوسف", "verses": 111, "type": "Meccan"},
    {"number": 13, "name": "Ar-Ra'd", "arabic": "الرعد", "verses": 43, "type": "Medinan"},
    {"number": 14, "name": "Ibrahim", "arabic": "إبراهيم", "verses": 52, "type": "Meccan"},
    {"number": 15, "name": "Al-Hijr", "arabic": "الحجر", "verses": 99, "type": "Meccan"},
    {"number": 16, "name": "An-Nahl", "arabic": "النحل", "verses": 128, "type": "Meccan"},
    {"number": 17, "name": "Al-Isra", "arabic": "الإسراء", "verses": 111, "type": "Meccan"},
    {"number": 18, "name": "Al-Kahf", "arabic": "الكهف", "verses": 110, "type": "Meccan"},
    {"number": 19, "name": "Maryam", "arabic": "مريم", "verses": 98, "type": "Meccan"},
    {"number": 20, "name": "Ta-Ha", "arabic": "طه", "verses": 135, "type": "Meccan"},
    {"number": 21, "name": "Al-Anbiya", "arabic": "الأنبياء", "verses": 112, "type": "Meccan"},
    {"number": 22, "name": "Al-Hajj", "arabic": "الحج", "verses": 78, "type": "Medinan"},
    {"number": 23, "name": "Al-Mu'minun", "arabic": "المؤمنون", "verses": 118, "type": "Meccan"},
    {"number": 24, "name": "An-Nur", "arabic": "النور", "verses": 64, "type": "Medinan"},
    {"number": 25, "name": "Al-Furqan", "arabic": "الفرقان", "verses": 77, "type": "Meccan"},
    {"number": 26, "name": "Ash-Shu'ara", "arabic": "الشعراء", "verses": 227, "type": "Meccan"},
    {"number": 27, "name": "An-Naml", "arabic": "النمل", "verses": 93, "type": "Meccan"},
    {"number": 28, "name": "Al-Qasas", "arabic": "القصص", "verses": 88, "type": "Meccan"},
    {"number": 29, "name": "Al-Ankabut", "arabic": "العنكبوت", "verses": 69, "type": "Meccan"},
    {"number": 30, "name": "Ar-Rum", "arabic": "الروم", "verses": 60, "type": "Meccan"},
    {"number": 31, "name": "Luqman", "arabic": "لقمان", "verses": 34, "type": "Meccan"},
    {"number": 32, "name": "As-Sajdah", "arabic": "السجدة", "verses": 30, "type": "Meccan"},
    {"number": 33, "name": "Al-Ahzab", "arabic": "الأحزاب", "verses": 73, "type": "Medinan"},
    {"number": 34, "name": "Saba", "arabic": "سبأ", "verses": 54, "type": "Meccan"},
    {"number": 35, "name": "Fatir", "arabic": "فاطر", "verses": 45, "type": "Meccan"},
    {"number": 36, "name": "Ya-Sin", "arabic": "يس", "verses": 83, "type": "Meccan"},
    {"number": 37, "name": "As-Saffat", "arabic": "الصافات", "verses": 182, "type": "Meccan"},
    {"number": 38, "name": "Sad", "arabic": "ص", "verses": 88, "type": "Meccan"},
    {"number": 39, "name": "Az-Zumar", "arabic": "الزمر", "verses": 75, "type": "Meccan"},
    {"number": 40, "name": "Ghafir", "arabic": "غافر", "verses": 85, "type": "Meccan"},
    {"number": 41, "name": "Fussilat", "arabic": "فصلت", "verses": 54, "type": "Meccan"},
    {"number": 42, "name": "Ash-Shura", "arabic": "الشورى", "verses": 53, "type": "Meccan"},
    {"number": 43, "name": "Az-Zukhruf", "arabic": "الزخرف", "verses": 89, "type": "Meccan"},
    {"number": 44, "name": "Ad-Dukhan", "arabic": "الدخان", "verses": 59, "type": "Meccan"},
    {"number": 45, "name": "Al-Jathiyah", "arabic": "الجاثية", "verses": 37, "type": "Meccan"},
    {"number": 46, "name": "Al-Ahqaf", "arabic": "الأحقاف", "verses": 35, "type": "Meccan"},
    {"number": 47, "name": "Muhammad", "arabic": "محمد", "verses": 38, "type": "Medinan"},
    {"number": 48, "name": "Al-Fath", "arabic": "الفتح", "verses": 29, "type": "Medinan"},
    {"number": 49, "name": "Al-Hujurat", "arabic": "الحجرات", "verses": 18, "type": "Medinan"},
    {"number": 50, "name": "Qaf", "arabic": "ق", "verses": 45, "type": "Meccan"},
    {"number": 51, "name": "Adh-Dhariyat", "arabic": "الذاريات", "verses": 60, "type": "Meccan"},
    {"number": 52, "name": "At-Tur", "arabic": "الطور", "verses": 49, "type": "Meccan"},
    {"number": 53, "name": "An-Najm", "arabic": "النجم", "verses": 62, "type": "Meccan"},
    {"number": 54, "name": "Al-Qamar", "arabic": "القمر", "verses": 55, "type": "Meccan"},
    {"number": 55, "name": "Ar-Rahman", "arabic": "الرحمن", "verses": 78, "type": "Medinan"},
    {"number": 56, "name": "Al-Waqi'ah", "arabic": "الواقعة", "verses": 96, "type": "Meccan"},
    {"number": 57, "name": "Al-Hadid", "arabic": "الحديد", "verses": 29, "type": "Medinan"},
    {"number": 58, "name": "Al-Mujadila", "arabic": "المجادلة", "verses": 22, "type": "Medinan"},
    {"number": 59, "name": "Al-Hashr", "arabic": "الحشر", "verses": 24, "type": "Medinan"},
    {"number": 60, "name": "Al-Mumtahanah", "arabic": "الممتحنة", "verses": 13, "type": "Medinan"},
    {"number": 61, "name": "As-Saff", "arabic": "الصف", "verses": 14, "type": "Medinan"},
    {"number": 62, "name": "Al-Jumu'ah", "arabic": "الجمعة", "verses": 11, "type": "Medinan"},
    {"number": 63, "name": "Al-Munafiqun", "arabic": "المنافقون", "verses": 11, "type": "Medinan"},
    {"number": 64, "name": "At-Taghabun", "arabic": "التغابن", "verses": 18, "type": "Medinan"},
    {"number": 65, "name": "At-Talaq", "arabic": "الطلاق", "verses": 12, "type": "Medinan"},
    {"number": 66, "name": "At-Tahrim", "arabic": "التحريم", "verses": 12, "type": "Medinan"},
    {"number": 67, "name": "Al-Mulk", "arabic": "الملك", "verses": 30, "type": "Meccan"},
    {"number": 68, "name": "Al-Qalam", "arabic": "القلم", "verses": 52, "type": "Meccan"},
    {"number": 69, "name": "Al-Haqqah", "arabic": "الحاقة", "verses": 52, "type": "Meccan"},
    {"number": 70, "name": "Al-Ma'arij", "arabic": "المعارج", "verses": 44, "type": "Meccan"},
    {"number": 71, "name": "Nuh", "arabic": "نوح", "verses": 28, "type": "Meccan"},
    {"number": 72, "name": "Al-Jinn", "arabic": "الجن", "verses": 28, "type": "Meccan"},
    {"number": 73, "name": "Al-Muzzammil", "arabic": "المزمل", "verses": 20, "type": "Meccan"},
    {"number": 74, "name": "Al-Muddaththir", "arabic": "المدثر", "verses": 56, "type": "Meccan"},
    {"number": 75, "name": "Al-Qiyamah", "arabic": "القيامة", "verses": 40, "type": "Meccan"},
    {"number": 76, "name": "Al-Insan", "arabic": "الإنسان", "verses": 31, "type": "Medinan"},
    {"number": 77, "name": "Al-Mursalat", "arabic": "المرسلات", "verses": 50, "type": "Meccan"},
    {"number": 78, "name": "An-Naba", "arabic": "النبأ", "verses": 40, "type": "Meccan"},
    {"number": 79, "name": "An-Nazi'at", "arabic": "النازعات", "verses": 46, "type": "Meccan"},
    {"number": 80, "name": "Abasa", "arabic": "عبس", "verses": 42, "type": "Meccan"},
    {"number": 81, "name": "At-Takwir", "arabic": "التكوير", "verses": 29, "type": "Meccan"},
    {"number": 82, "name": "Al-Infitar", "arabic": "الانفطار", "verses": 19, "type": "Meccan"},
    {"number": 83, "name": "Al-Mutaffifin", "arabic": "المطففين", "verses": 36, "type": "Meccan"},
    {"number": 84, "name": "Al-Inshiqaq", "arabic": "الانشقاق", "verses": 25, "type": "Meccan"},
    {"number": 85, "name": "Al-Buruj", "arabic": "البروج", "verses": 22, "type": "Meccan"},
    {"number": 86, "name": "At-Tariq", "arabic": "الطارق", "verses": 17, "type": "Meccan"},
    {"number": 87, "name": "Al-A'la", "arabic": "الأعلى", "verses": 19, "type": "Meccan"},
    {"number": 88, "name": "Al-Ghashiyah", "arabic": "الغاشية", "verses": 26, "type": "Meccan"},
    {"number": 89, "name": "Al-Fajr", "arabic": "الفجر", "verses": 30, "type": "Meccan"},
    {"number": 90, "name": "Al-Balad", "arabic": "البلد", "verses": 20, "type": "Meccan"},
    {"number": 91, "name": "Ash-Shams", "arabic": "الشمس", "verses": 15, "type": "Meccan"},
    {"number": 92, "name": "Al-Layl", "arabic": "الليل", "verses": 21, "type": "Meccan"},
    {"number": 93, "name": "Ad-Duha", "arabic": "الضحى", "verses": 11, "type": "Meccan"},
    {"number": 94, "name": "Ash-Sharh", "arabic": "الشرح", "verses": 8, "type": "Meccan"},
    {"number": 95, "name": "At-Tin", "arabic": "التين", "verses": 8, "type": "Meccan"},
    {"number": 96, "name": "Al-Alaq", "arabic": "العلق", "verses": 19, "type": "Meccan"},
    {"number": 97, "name": "Al-Qadr", "arabic": "القدر", "verses": 5, "type": "Meccan"},
    {"number": 98, "name": "Al-Bayyinah", "arabic": "البينة", "verses": 8, "type": "Medinan"},
    {"number": 99, "name": "Az-Zalzalah", "arabic": "الزلزلة", "verses": 8, "type": "Medinan"},
    {"number": 100, "name": "Al-Adiyat", "arabic": "العاديات", "verses": 11, "type": "Meccan"},
    {"number": 101, "name": "Al-Qari'ah", "arabic": "القارعة", "verses": 11, "type": "Meccan"},
    {"number": 102, "name": "At-Takathur", "arabic": "التكاثر", "verses": 8, "type": "Meccan"},
    {"number": 103, "name": "Al-Asr", "arabic": "العصر", "verses": 3, "type": "Meccan"},
    {"number": 104, "name": "Al-Humazah", "arabic": "الهمزة", "verses": 9, "type": "Meccan"},
    {"number": 105, "name": "Al-Fil", "arabic": "الفيل", "verses": 5, "type": "Meccan"},
    {"number": 106, "name": "Quraysh", "arabic": "قريش", "verses": 4, "type": "Meccan"},
    {"number": 107, "name": "Al-Ma'un", "arabic": "الماعون", "verses": 7, "type": "Meccan"},
    {"number": 108, "name": "Al-Kawthar", "arabic": "الكوثر", "verses": 3, "type": "Meccan"},
    {"number": 109, "name": "Al-Kafirun", "arabic": "الكافرون", "verses": 6, "type": "Meccan"},
    {"number": 110, "name": "An-Nasr", "arabic": "النصر", "verses": 3, "type": "Medinan"},
    {"number": 111, "name": "Al-Masad", "arabic": "المسد", "verses": 5, "type": "Meccan"},
    {"number": 112, "name": "Al-Ikhlas", "arabic": "الإخلاص", "verses": 4, "type": "Meccan"},
    {"number": 113, "name": "Al-Falaq", "arabic": "الفلق", "verses": 5, "type": "Meccan"},
    {"number": 114, "name": "An-Nas", "arabic": "الناس", "verses": 6, "type": "Meccan"},
]

def process_quran_verses():
    """Extract all verses from quran.db"""
    print("Processing Quran verses...")
    conn = sqlite3.connect(f"{ALQURAN_DB_DIR}/quran.db")
    cursor = conn.cursor()
    cursor.execute("SELECT sura, ayah, text FROM verses ORDER BY sura, ayah")
    
    verses = {}
    for row in cursor:
        sura, ayah, text = row
        if sura not in verses:
            verses[sura] = []
        verses[sura].append({
            "ayah": ayah,
            "arabic": text.strip() if text else ""
        })
    
    conn.close()
    print(f"  Processed {sum(len(v) for v in verses.values())} verses from {len(verses)} surahs")
    return verses

def process_english_translation():
    """Extract English translation from en_sahih.db"""
    print("Processing English translation...")
    conn = sqlite3.connect(f"{ALQURAN_DB_DIR}/en_sahih.db")
    cursor = conn.cursor()
    cursor.execute("SELECT sura, ayah, text FROM verses ORDER BY sura, ayah")
    
    translations = {}
    for row in cursor:
        sura, ayah, text = row
        key = f"{sura}:{ayah}"
        translations[key] = text.strip() if text else ""
    
    conn.close()
    print(f"  Processed {len(translations)} translations")
    return translations

def process_word_by_word():
    """Extract word-by-word transliteration from words.db"""
    print("Processing word-by-word data...")
    conn = sqlite3.connect(f"{ALQURAN_DB_DIR}/words.db")
    cursor = conn.cursor()
    cursor.execute("SELECT sura, ayah, word, en FROM allwords ORDER BY sura, ayah, word")
    
    words = {}
    for row in cursor:
        sura, ayah, word_num, en_translit = row
        key = f"{sura}:{ayah}"
        if key not in words:
            words[key] = []
        words[key].append(en_translit if en_translit else "")
    
    conn.close()
    print(f"  Processed words for {len(words)} verses")
    return words

def process_ihya_tafsir():
    """Process Ihya Tafsir from deepseek_analysis_results.jsonl"""
    print("Processing Ihya Tafsir...")
    tafsir = {}
    tafsir_count = 0
    
    with open(IHYA_JSONL, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                verse_ref = entry.get('custom_id', '')  # Format: "2:2" or "4:110"
                
                if ':' not in verse_ref:
                    continue
                
                analysis = entry.get('analysis', {})
                analysis_type = analysis.get('analysis_type', '')
                
                # Only include entries with actual tafsir commentary
                arabic_text = analysis.get('arabic_snippet', '')
                english_text = analysis.get('english_text', '')
                
                if english_text and len(english_text) > 50:  # Substantial commentary
                    if verse_ref not in tafsir:
                        tafsir[verse_ref] = []
                    
                    tafsir[verse_ref].append({
                        "arabic": arabic_text[:500] if arabic_text else "",
                        "english": english_text,
                        "type": analysis_type,
                        "book": entry.get('file', '').replace('.txt', '')
                    })
                    tafsir_count += 1
                    
            except json.JSONDecodeError:
                continue
    
    print(f"  Processed {tafsir_count} Ihya tafsir entries for {len(tafsir)} unique verses")
    return tafsir

def main():
    print("=" * 60)
    print("IHYA QURAN DATA PROCESSOR")
    print("=" * 60)
    
    # Process all data
    quran_verses = process_quran_verses()
    translations = process_english_translation()
    words = process_word_by_word()
    ihya_tafsir = process_ihya_tafsir()
    
    # Build combined data structure
    print("\nBuilding combined data...")
    
    # Save surahs metadata
    with open(f"{BASE_DIR}/surahs.json", 'w', encoding='utf-8') as f:
        json.dump(SURAHS, f, ensure_ascii=False)
    print(f"  Saved surahs.json (114 surahs)")
    
    # Save verses with translations and words
    combined_verses = {}
    for sura_num, verses in quran_verses.items():
        combined_verses[sura_num] = []
        for verse in verses:
            ayah = verse['ayah']
            key = f"{sura_num}:{ayah}"
            combined_verses[sura_num].append({
                "ayah": ayah,
                "arabic": verse['arabic'],
                "translation": translations.get(key, ""),
                "words": words.get(key, []),
                "hasIhya": key in ihya_tafsir
            })
    
    with open(f"{BASE_DIR}/verses.json", 'w', encoding='utf-8') as f:
        json.dump(combined_verses, f, ensure_ascii=False)
    print(f"  Saved verses.json ({sum(len(v) for v in combined_verses.values())} verses)")
    
    # Save Ihya tafsir
    with open(f"{BASE_DIR}/ihya_tafsir.json", 'w', encoding='utf-8') as f:
        json.dump(ihya_tafsir, f, ensure_ascii=False)
    print(f"  Saved ihya_tafsir.json ({len(ihya_tafsir)} verse entries)")
    
    print("\n" + "=" * 60)
    print("DATA PROCESSING COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
