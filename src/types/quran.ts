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
  surah: number;
  ayah: number;
  arabic?: string;
  english?: string;
  commentary?: string;
  source?: string;
}

export interface ReciterConfig {
  id: string;
  name: string;
  url: string;
  letterSync?: boolean;
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
}
