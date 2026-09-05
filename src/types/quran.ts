export type HighlightingMode = 'letter' | 'word' | 'ayah' | 'off';

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
  transliteration?: string;
  translation?: string;
  root?: string;
  tajweed?: string;
}

export interface Verse {
  surah: number;
  ayah: number;
  text: string;
  words?: Word[];
  translation?: string;
  transliteration?: string;
  haleemTranslation?: string;
  albanianTranslation?: string;
  ridaGermanTranslation?: string;
  narration?: 'hafs' | 'warsh';
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
  showTranslation: boolean;
  autoScroll: boolean;
  repeatMode?: 'none' | 'ayah' | 'surah';
  highlightMode?: HighlightingMode;
}
