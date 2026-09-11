export type HighlightingMode = 'letter' | 'word' | 'ayah' | 'off';
export type TransliterationMode = 'specialRTL' | 'standardLatin' | 'off';
export type TranslationId = 'sahih' | 'haleem' | 'cleary' | 'kathir' | 'jalalayn' | 'rida';

export interface TranslationConfig {
  id: TranslationId;
  name: string;
  language: string;
  translator: string;
  description: string;
}

export interface SurahMetadata {
  number: number;
  name: string;
  arabic?: string;
  type?: string;
  verses?: number;
  englishName?: string;
  englishNameTranslation?: string;
  numberOfAyahs?: number;
  revelationType?: string;
}

export interface Word {
  id?: number;
  arabic: string;
  translit?: string;           // Special Right-to-Left Roman with Arabic Diacritics (e.g. ِmْsِb)
  latinTranslit?: string;      // Standard Latin Transliteration (e.g. bis'mi)
  transliteration?: string;    // Backward compatibility
  translation?: string;
  root?: string;
  tajweed?: string;
}

export interface Verse {
  surah: number;
  ayah: number;
  text: string;
  words?: Word[];
  translation?: string;            // Default Sahih International
  haleemTranslation?: string;      // M.A.S. Abdel Haleem
  clearyTranslation?: string;      // Thomas Cleary
  ibnKathirTranslation?: string;   // Ibn Kathir Abridged
  jalalaynTranslation?: string;    // Tafsir al-Jalalayn (English)
  albanianTranslation?: string;
  ridaGermanTranslation?: string;
  narration?: 'hafs' | 'warsh';
  hasIhya?: boolean;
}

export interface LetterTimingEntry {
  wordIdx?: number;
  charIdx?: number;
  char: string;
  grapheme?: string;
  start: number;
  end: number;
  duration?: number;
  peakTime?: number;
}

export interface TafsirEntry {
  surah?: number;
  ayah?: number;
  verse_key?: string;
  arabic: string;
  english: string;
  book_title?: string;
  section_title_ar?: string;
  section_title_en?: string;
  section_index?: number;
  anchors?: string | null;
  content_type?: string;
  topic?: string;
  badge?: string;
}

export interface ReciterConfig {
  id: string;
  name: string;
  url: string;
  letterSync?: boolean;
  narration?: 'hafs' | 'warsh';
}

export interface AppSettings {
  theme: string;
  reciter: string;
  fontSize: number;
  translitFontSize: number;
  showTajweed: boolean;
  showTransliteration: boolean;
  transliterationMode: TransliterationMode;
  showTranslation: boolean;
  activeTranslation: TranslationId;
  autoScroll: boolean;
  repeatMode?: 'none' | 'ayah' | 'surah';
  highlightMode?: HighlightingMode;
}

export interface DownloadProgress {
  surahNumber?: number;
  reciterId: string;
  totalFiles: number;
  downloadedFiles: number;
  percent: number;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  errorMessage?: string;
}
