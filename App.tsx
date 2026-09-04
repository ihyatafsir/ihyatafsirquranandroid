import { NativeMushafWebView } from './components/NativeMushafWebView';
function toArabicNumerals(num: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map(d => digits[parseInt(d, 10)] || d)
    .join("");
}
import { injectQuranicFonts } from "./utils/fontLoader";
injectQuranicFonts();
import { FluidMushafCanvas } from './components/FluidMushafCanvas';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Animated,
  Switch,
  Alert,
  BackHandler,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, File, Directory } from 'expo-file-system';

// ═══════════════════════════════════════════════════════════════════════════
// DATA IMPORT
// ═══════════════════════════════════════════════════════════════════════════
import surahsData from './assets/surahs.json';
import versesData from './assets/verses_v4.json';
import ihyaTafsirData from './assets/ihya_tafsir_v2.json';
import lisanIndexData from './assets/lisan_index.json';
import ibnKathirData from './assets/ibn_kathir_en.json';
import jalalaynData from './assets/jalalayn_en.json';
import { analyzeWordTajweed, TAJWEED_CHAPTERS, TAJWEED_PALETTE, TajweedRule } from './src/utils/tajweedStudentEngine';
import { deconstructWordAndChain, WordChainAnalysis } from './src/utils/arabicLetterChainEngine';
import haleemData from './assets/haleem_en.json';
import albanianData from './assets/albanian_sq.json';
import ridaGermanData from './assets/rida_german.json';
import timingAbdulBasit from './assets/timing_abdulbasit.json';
// Letter timing datasets for all standard reciters (40MB each) - loaded on demand
const letterTimingAbdulBasit = require('./assets/letter_timing_abdulbasit.json');
const letterTimingHusary = require('./assets/letter_timing_husary.json');
const letterTimingMinshawi = require('./assets/letter_timing_minshawi.json');
import timingHusary from './assets/timing_husary.json';
import timingMinshawi from './assets/timing_minshawi.json';
// MAH timing data (CTC-generated, seconds format for 75 and 36)
import timingMahQiyamah from './assets/audio_mah/timing_75.json';  // Surah 75
import timingMahN01 from './assets/audio_mah/timing_taraweeh_n01.json';
import timingMahN02 from './assets/audio_mah/timing_taraweeh_n02.json';
import timingMahN03 from './assets/audio_mah/timing_taraweeh_n03.json';
import timingMahN04 from './assets/audio_mah/timing_taraweeh_n04.json';
import timingMahN05 from './assets/audio_mah/timing_taraweeh_n05.json';
import timingMahN06 from './assets/audio_mah/timing_taraweeh_n06.json';
import timingMahN07 from './assets/audio_mah/timing_taraweeh_n07.json';
import timingMahN08 from './assets/audio_mah/timing_taraweeh_n08.json';
import timingMahN09 from './assets/audio_mah/timing_taraweeh_n09.json';
import timingMahN10 from './assets/audio_mah/timing_taraweeh_n10.json';
import timingMahYasin from './assets/audio_mah/timing_36.json';  // Surah 36
// MAH per-surah word timing (CTC-generated, seconds format)
import timingMah87 from './assets/audio_mah/timing_87.json';
import timingMah89 from './assets/audio_mah/timing_89.json';
import timingMah90 from './assets/audio_mah/timing_90.json';
import timingMah91 from './assets/audio_mah/timing_91.json';
import timingMah92 from './assets/audio_mah/timing_92.json';
import timingMah93 from './assets/audio_mah/timing_93.json';
import timingMah97 from './assets/audio_mah/timing_mah_97.json';
import timingMah109 from './assets/audio_mah/timing_109.json';
import timingMah112 from './assets/audio_mah/timing_112.json';
// MAH letter-level timing (derived from word timing)
import letterTimingQiyamah from './assets/audio_mah/letter_timing_75.json';  // Surah 75 CTC
import letterTimingYasin from './assets/audio_mah/letter_timing_36.json';  // Surah 36 CTC
import letterTimingN01 from './assets/audio_mah/letter_timing_n01.json';
import letterTimingN02 from './assets/audio_mah/letter_timing_n02.json';
import letterTimingN03 from './assets/audio_mah/letter_timing_n03.json';
import letterTimingN04 from './assets/audio_mah/letter_timing_n04.json';
import letterTimingN05 from './assets/audio_mah/letter_timing_n05.json';
import letterTimingN06 from './assets/audio_mah/letter_timing_n06.json';
import letterTimingN07 from './assets/audio_mah/letter_timing_n07.json';
import letterTimingN08 from './assets/audio_mah/letter_timing_n08.json';
import letterTimingN09 from './assets/audio_mah/letter_timing_n09.json';
import letterTimingN10 from './assets/audio_mah/letter_timing_n10.json';
// (legacy imports for 87-93 removed)
// Note: 109 and 112 moved below
// New MAH surahs (WhisperX generated)
// Extracted from Ruqyah recording
import timingMah1 from './assets/audio_mah/timing_1.json';
import timingMah113 from './assets/audio_mah/timing_113.json';
import timingMah114 from './assets/audio_mah/timing_114.json';
// Note: letter timings for these surahs moved to unified block below
import timingMah18 from './assets/audio_mah/timing_18.json';
import timingMah36 from './assets/audio_mah/timing_36.json';
import timingMah47 from './assets/audio_mah/timing_47.json';
import timingMah53 from './assets/audio_mah/timing_53.json';
import timingMah55 from './assets/audio_mah/timing_55.json';
import timingMah56 from './assets/audio_mah/timing_56.json';
import timingMah67 from './assets/audio_mah/timing_67.json';
import timingMah71 from './assets/audio_mah/timing_71.json';

// VERSE TIMING DATA (Generated with startWordIdx)
import verseTiming1 from './assets/audio_mah/verse_timing_1.json';
import verseTiming18 from './assets/audio_mah/verse_timing_18.json';
import verseTiming36 from './assets/audio_mah/verse_timing_36.json';
import verseTiming47 from './assets/audio_mah/verse_timing_47.json';
import verseTiming53 from './assets/audio_mah/verse_timing_53.json';
import verseTiming55 from './assets/audio_mah/verse_timing_55.json';
import verseTiming56 from './assets/audio_mah/verse_timing_56.json';
import verseTiming67 from './assets/audio_mah/verse_timing_67.json';
import verseTiming71 from './assets/audio_mah/verse_timing_71.json';
import verseTiming75 from './assets/audio_mah/verse_timing_75.json';
import verseTiming80 from './assets/audio_mah/verse_timing_80.json';
import verseTiming82 from './assets/audio_mah/verse_timing_82.json';
import verseTiming85 from './assets/audio_mah/verse_timing_85.json';
import verseTiming87 from './assets/audio_mah/verse_timing_87.json';
import verseTiming89 from './assets/audio_mah/verse_timing_89.json';
import verseTiming90 from './assets/audio_mah/verse_timing_90.json';
import verseTiming91 from './assets/audio_mah/verse_timing_91.json';
import verseTiming92 from './assets/audio_mah/verse_timing_92.json';
import verseTiming93 from './assets/audio_mah/verse_timing_93.json';
import verseTiming109 from './assets/audio_mah/verse_timing_109.json';
import verseTiming112 from './assets/audio_mah/verse_timing_112.json';
import verseTiming113 from './assets/audio_mah/verse_timing_113.json';
import verseTiming114 from './assets/audio_mah/verse_timing_114.json';

import timingMah80 from './assets/audio_mah/timing_80.json';
import timingMah82 from './assets/audio_mah/timing_82.json';
import timingMah85 from './assets/audio_mah/timing_85.json';
import letterTiming1 from './assets/audio_mah/letter_timing_1.json';
import letterTiming18 from './assets/audio_mah/letter_timing_18.json';
import letterTiming36 from './assets/audio_mah/letter_timing_36.json';
import letterTiming47 from './assets/audio_mah/letter_timing_47.json';
import letterTiming53 from './assets/audio_mah/letter_timing_53.json';
import letterTiming55 from './assets/audio_mah/letter_timing_55.json';
import letterTiming56 from './assets/audio_mah/letter_timing_56.json';
import letterTiming67 from './assets/audio_mah/letter_timing_67.json';
import letterTiming71 from './assets/audio_mah/letter_timing_71.json';
import letterTiming75 from './assets/audio_mah/letter_timing_75.json';
import letterTiming80 from './assets/audio_mah/letter_timing_80.json';
import letterTiming82 from './assets/audio_mah/letter_timing_82.json';
import letterTiming85 from './assets/audio_mah/letter_timing_85.json';
import letterTiming87 from './assets/audio_mah/letter_timing_87.json';
import letterTiming89 from './assets/audio_mah/letter_timing_89.json';
import letterTiming90 from './assets/audio_mah/letter_timing_90.json';
import letterTiming91 from './assets/audio_mah/letter_timing_91.json';
import letterTiming92 from './assets/audio_mah/letter_timing_92.json';
import letterTiming93 from './assets/audio_mah/letter_timing_93.json';
import letterTiming97 from './assets/audio_mah/letter_timing_97.json';
import letterTiming109 from './assets/audio_mah/letter_timing_109.json';
import letterTiming112 from './assets/audio_mah/letter_timing_112.json';
import letterTiming113 from './assets/audio_mah/letter_timing_113.json';
import letterTiming114 from './assets/audio_mah/letter_timing_114.json';


const globalMahTimingMap: { [key: number]: any[] } = {
  18: timingMah18, 36: timingMah36, 47: timingMah47,
  53: timingMah53, 55: timingMah55, 56: timingMah56,
  67: timingMah67, 71: timingMah71,
  75: timingMahQiyamah, 80: timingMah80, 82: timingMah82, 85: timingMah85,
  87: timingMah87, 89: timingMah89, 90: timingMah90, 91: timingMah91,
  92: timingMah92, 93: timingMah93, 97: timingMah97, 109: timingMah109, 112: timingMah112,
  1: timingMah1, 113: timingMah113, 114: timingMah114,
};

const globalLetterTimingMap: { [key: number]: any[] } = {
  1: letterTiming1, 18: letterTiming18, 36: letterTiming36, 47: letterTiming47,
  53: letterTiming53, 55: letterTiming55, 56: letterTiming56,
  67: letterTiming67, 71: letterTiming71,
  75: letterTimingQiyamah, 80: letterTiming80, 82: letterTiming82, 85: letterTiming85,
  87: letterTiming87, 89: letterTiming89, 90: letterTiming90, 91: letterTiming91,
  92: letterTiming92, 93: letterTiming93, 97: letterTiming97, 109: letterTiming109, 112: letterTiming112,
  113: letterTiming113, 114: letterTiming114,
};

// ═══════════════════════════════════════════════════════════════════════════
// TAJWEED COLORS & RULES (from AlQuran APK)
// ═══════════════════════════════════════════════════════════════════════════
const TAJWEED_COLORS = {
  ghunna: '#d16a00',      // Orange - Ghunna (nasalization) - نّ مّ
  ikhfa: '#b60000',       // Red - Ikhfa (hiding) - نْ + certain letters
  idgham: '#b955c8',      // Purple - Idgham with Ghunna - نْ + و م ن ي
  idghamWG: '#aaaaaa',    // Gray - Idgham without Ghunna - نْ + ل ر
  iqlab: '#3164c5',       // Blue - Iqlab (conversion) - نْ + ب → م
  qalqala: '#2f9900',     // Green - Qalqala (echoing) - ق ط ب ج د
  madd: '#ff6600',        // Orange - Madd (elongation)
};

// Qalqala letters: ق ط ب ج د (echoing sound when with sukun or at verse end)
const QALQALA_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];
// Ikhfa letters (after نْ): hiding with nasal sound
const IKHFA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
// Idgham with Ghunna letters (after نْ): merging with nasal
const IDGHAM_LETTERS = ['و', 'م', 'ن', 'ي'];
// Idgham without Ghunna letters (after نْ): merging without nasal
const IDGHAM_WG_LETTERS = ['ل', 'ر'];
// Sukun mark
const SUKUN = 'ْ';
// Shadda mark (for Ghunna)
const SHADDA = 'ّ';

// Helper to apply Liquid Lisan Tajweed colors to Arabic text
const renderTajweedText = (
  text: string,
  baseStyle: any,
  enabled = false,
  highlightCharIdx = -1,
  isPastWord = false,
  isCurrentWord = false
) => {
  // Only skip processing if no text, OR if both tajweed disabled AND no letter highlighting
  if (!text) return <Text style={baseStyle}>{text}</Text>;
  if (!enabled && highlightCharIdx === -1) return <Text style={baseStyle}>{text}</Text>;

  const chars = [...text];
  const result: React.ReactNode[] = [];

  // Track base letter index (excluding diacritics) for MAH letter-level highlighting
  let baseLetterIdx = 0;

  // ENHANCED Green Flow Effect - Smoother, more elegant highlighting
  // Uses gradient-like appearance with softer glow and cyan undertones
  const mahGlowStyle = {
    color: '#00ff88',  // Mint green for softer appearance
    backgroundColor: 'rgba(0, 255, 100, 0.25)',  // Subtle green tint
    textShadowColor: '#00ffaa',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,  // Softer glow radius
    fontWeight: '800' as const,
  };

  // MADD GLOW: Extra bright for stretched letters (ا و ي ى آ)
  const maddGlowStyle = {
    color: '#00ffcc',  // Cyan-green for madd letters
    backgroundColor: 'rgba(0, 255, 180, 0.35)',  // Stronger cyan tint
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,  // Wider glow for elongation effect
    fontWeight: '900' as const,
  };

  const isDiacritic = (ch: string) => /[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch) || ch === SUKUN || ch === SHADDA;

  for (let i = 0; i < chars.length;) {
    const char = chars[i];

    // Safety check: if somehow a diacritic is floating alone, just push it
    if (isDiacritic(char)) {
      result.push(char);
      i++;
      continue;
    }

    // 1. Gather the base letter and all its trailing diacritics into a single grapheme
    let grapheme = char;
    let dIdx = i + 1;
    while (dIdx < chars.length && isDiacritic(chars[dIdx])) {
      grapheme += chars[dIdx];
      dIdx++;
    }
    const diacriticsConsumed = dIdx - i - 1;

    // Lookahead for Tajweed rules (skipping this character's diacritics to see the NEXT base letter)
    const nextCharIdx = dIdx;
    const nextChar = chars[nextCharIdx] || '';

    let color: string | null = null;
    let extraCharsConsumed = 0;

    // Helper to get the next base letter's grapheme
    const getNextGrapheme = () => {
      let g = nextChar;
      let j = nextCharIdx + 1;
      while (j < chars.length && isDiacritic(chars[j])) {
        g += chars[j];
        j++;
      }
      return { text: g, consumed: j - nextCharIdx };
    };

    // 1. GHUNNA: ن or م followed by SHADDA (in its own diacritics)
    if ((char === 'ن' || char === 'م') && grapheme.includes(SHADDA)) {
      color = TAJWEED_COLORS.ghunna;
    }
    // 2. NOON SAKINAH RULES: نْ (Noon followed by Sukun)
    else if (char === 'ن' && grapheme.includes(SUKUN)) {
      if (nextChar === 'ب') {
        color = TAJWEED_COLORS.iqlab;
      } else if (IDGHAM_LETTERS.includes(nextChar)) {
        color = TAJWEED_COLORS.idgham;
      } else if (IDGHAM_WG_LETTERS.includes(nextChar)) {
        color = TAJWEED_COLORS.idghamWG;
      } else if (IKHFA_LETTERS.includes(nextChar)) {
        color = TAJWEED_COLORS.ikhfa;
      }
    }
    // 3. MEEM SAKINAH + BA: مْ + ب
    else if (char === 'م' && grapheme.includes(SUKUN) && nextChar === 'ب') {
      color = TAJWEED_COLORS.ikhfa;
    }
    // 4. QALQALA: ق ط ب ج د with sukun or at word/verse end
    else if (QALQALA_LETTERS.includes(char)) {
      if (grapheme.includes(SUKUN) || !nextChar || nextChar === ' ' || nextChar === '۝') {
        color = TAJWEED_COLORS.qalqala;
      }
    }
    // 5. MADD: elongation marks
    else if (char === 'ٓ' || char === 'ٰ' || char === 'آ' || char === 'ـٓ' || grapheme.includes('ٓ') || grapheme.includes('ٰ')) {
      color = TAJWEED_COLORS.madd;
    }

    // Liquid Lisan Highlighting Standard:
    if (isPastWord) {
      result.push(
        <Text key={i} style={{ color: '#00ffaa', textShadowColor: '#00ffaa', textShadowRadius: 8, fontWeight: '700' }}>
          {grapheme}
        </Text>
      );
    } else if (isCurrentWord && highlightCharIdx !== -1) {
      if (baseLetterIdx < highlightCharIdx) {
        // Recited letter in active word: Solid Radiant Emerald Green
        result.push(
          <Text key={i} style={{ color: '#00ffaa', textShadowColor: '#00ffaa', textShadowRadius: 8, fontWeight: '700' }}>
            {grapheme}
          </Text>
        );
      } else if (baseLetterIdx === highlightCharIdx) {
        // Active Letter: Radiant White-Cyan Laser Burst with Deep Neon Bloom
        result.push(
          <Text key={i} style={{ color: '#ffffff', textShadowColor: '#00f0ff', textShadowRadius: 18, fontWeight: '900' }}>
            {grapheme}
          </Text>
        );
      } else if (baseLetterIdx === highlightCharIdx + 1) {
        // Leading Transition Letter
        result.push(
          <Text key={i} style={{ color: '#38bdf8', textShadowColor: '#38bdf8', textShadowRadius: 6, fontWeight: '700' }}>
            {grapheme}
          </Text>
        );
      } else {
        // Upcoming Letter
        result.push(
          <Text key={i} style={{ color: color || '#f8fafc' }}>
            {grapheme}
          </Text>
        );
      }
    } else if (enabled && color) {
      result.push(<Text key={i} style={{ color }}>{grapheme}</Text>);
    } else {
      result.push(<Text key={i} style={{ color: '#f8fafc' }}>{grapheme}</Text>);
    }

    // Advance loop past the base letter, its diacritics, and any extra letters consumed by Tajweed rules
    i += 1 + diacriticsConsumed + extraCharsConsumed;

    // Crucially, increment base letter index so it aligns perfectly with the JSON timing data
    baseLetterIdx++;
  }

  // CRITICAL: Apply fontWeight at the PARENT level only.
  // This tells Android to shape the entire string as a single connected cursive block,
  // before applying the ForegroundColorSpans to individual letters.
  return <Text style={[baseStyle, { fontWeight: '600' }]}>{result}</Text>;
};

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLITERATION SYSTEM - RTL with proper diacritics
// ═══════════════════════════════════════════════════════════════════════════

// Arabic diacritics (harakat) - these are stored in the transliteration data
const ARABIC_HARAKAT = /[\u064B-\u0652\u0670\u0651]/g;
const ARABIC_HARAKAT_SINGLE = /[\u064B-\u0652\u0670\u0651]/;

// Map Arabic diacritics to Latin vowel marks
const HARAKAT_TO_LATIN: { [key: string]: string } = {
  '\u064E': 'a',   // Fatḥa → a
  '\u0650': 'i',   // Kasra → i  
  '\u064F': 'u',   // Ḍamma → u
  '\u0652': '',    // Sukūn → silent (no vowel)
  '\u064B': 'an',  // Fatḥatān → an (tanween)
  '\u064D': 'in',  // Kasratān → in (tanween)
  '\u064C': 'un',  // Ḍammatān → un (tanween)
  '\u0651': '',    // Shadda → handled separately (doubling)
  '\u0670': 'ā',   // Superscript alif → long a
};

// Arabic letter to Latin mapping with scholarly transliteration
const ARABIC_TO_LATIN: { [key: string]: string } = {
  'ا': 'ā', 'ٱ': '', 'أ': 'ʾ', 'إ': 'ʾi', 'آ': 'ʾā',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'ḥ',
  'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 'ṣ', 'ض': 'ḍ', 'ط': 'ṭ',
  'ظ': 'ẓ', 'ع': 'ʿ', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h',
  'و': 'w', 'ي': 'y', 'ى': 'ā', 'ة': 'h', 'ء': 'ʾ',
  'ئ': 'ʾ', 'ؤ': 'ʾ', 'ـ': '',
};

// Parse Arabic word into segments: { letter, diacritics[], hasShadda }
interface ArabicSegment {
  letter: string;
  diacritics: string[];
  hasShadda: boolean;
}

const parseArabicWord = (arabic: string): ArabicSegment[] => {
  if (!arabic) return [];

  const segments: ArabicSegment[] = [];
  let currentLetter = '';
  let currentDiacritics: string[] = [];
  let hasShadda = false;

  for (const char of arabic) {
    if (ARABIC_HARAKAT_SINGLE.test(char)) {
      // This is a diacritic - add to current letter
      if (char === '\u0651') {
        hasShadda = true;
      } else {
        currentDiacritics.push(char);
      }
    } else {
      // This is a base letter - save previous and start new
      if (currentLetter) {
        segments.push({ letter: currentLetter, diacritics: currentDiacritics, hasShadda });
      }
      currentLetter = char;
      currentDiacritics = [];
      hasShadda = false;
    }
  }
  // Don't forget the last letter
  if (currentLetter) {
    segments.push({ letter: currentLetter, diacritics: currentDiacritics, hasShadda });
  }

  return segments;
};

// Convert Arabic segment to Latin with proper diacritics
const segmentToLatin = (seg: ArabicSegment): string => {
  let base = ARABIC_TO_LATIN[seg.letter] || seg.letter;

  // Apply shadda (double the consonant)
  if (seg.hasShadda && base.length > 0) {
    // For digraphs like sh, th, kh, gh, dh - just double them
    base = base + base;
  }

  // Add vowel marks from diacritics
  let vowels = '';
  for (const d of seg.diacritics) {
    const v = HARAKAT_TO_LATIN[d];
    if (v) vowels += v;
  }

  return base + vowels;
};

// Helper to render Arabic and Transliteration letter-by-letter aligned
// This uses the Arabic text directly to generate accurate transliteration
const renderLetterByLetter = (
  arabic: string,
  _translit: string, // Not used - we generate from Arabic directly
  arabicStyle: any,
  translitStyle: any,
  isCurrentWord = false
) => {
  // Parse Arabic into segments
  const segments = parseArabicWord(arabic);

  // Generate Latin for each segment
  const latinParts = segments.map(seg => segmentToLatin(seg));

  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
      {segments.map((seg, idx) => (
        <View key={idx} style={{ alignItems: 'center', marginHorizontal: 1, minWidth: 16 }}>
          {/* Arabic letter with its diacritics */}
          <Text style={[
            arabicStyle,
            { textAlign: 'center' },
            isCurrentWord && { color: '#ffd700' }
          ]}>
            {seg.letter}{seg.hasShadda ? '\u0651' : ''}{seg.diacritics.join('')}
          </Text>
          {/* Latin transliteration - RTL aligned */}
          <Text style={[
            translitStyle,
            {
              textAlign: 'center',
              fontSize: 10,
              minWidth: 12,
              letterSpacing: 0.5,
              writingDirection: 'rtl',
            },
            isCurrentWord && { color: '#ffd700', fontWeight: 'bold' }
          ]}>
            {latinParts[idx] || ''}
          </Text>
        </View>
      ))}
    </View>
  );
};



// ═══════════════════════════════════════════════════════════════════════════
// MANUSCRIPT-INSPIRED DECORATIVE COMPONENTS (Mamluk/Baybars/Blue Quran Style)
// ═══════════════════════════════════════════════════════════════════════════
const MANUSCRIPT_COLORS = {
  // Classic Gold Tones
  gold: '#ffd700',
  deepGold: '#daa520',
  royalGold: '#b8860b',
  antiqueGold: '#c5a572',
  // Blue Quran Palette (9th c. Tunisia)
  indigo: '#1a237e',
  deepIndigo: '#0a1628',
  azure: '#0d47a1',
  lapis: '#1e3a5f',
  // Mamluk/Ottoman Accents
  parchment: '#f5f0e1',
  cream: '#fdfcf8',
  forest: '#2e7d32',
  ruby: '#a31545',
  vermilion: '#e74c3c',
  // Metallic Accents
  silver: '#c0c0c0',
  bronze: '#cd7f32',
  copper: '#b87333',
};

// Verse separator component - Mamluk style (۝)
const VerseSeparator = ({ theme }) => (
  <View style={{ alignItems: 'center', marginVertical: 6 }}>
    <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 14 }}>
      ❦ ۝ ❦
    </Text>
  </View>
);

// Ornate frame for Surah headers - Royal Manuscript Cartouche
const OrnateFrame = ({ children, theme }) => (
  <View style={{
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  }}>
    <View style={{
      position: 'absolute',
      top: 3, left: 3, right: 3, bottom: 3,
      borderWidth: 1,
      borderColor: 'rgba(251, 191, 36, 0.3)',
      borderRadius: 16,
    }} />
    {children}
  </View>
);

// Decorative geometric border - Symmetrical Calligraphic Divider
const GeometricBorder = ({ theme }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 6, gap: 8 }}>
    <View style={{ height: 1, width: 44, backgroundColor: 'rgba(251, 191, 36, 0.35)' }} />
    <Text style={{ color: '#fbbf24', fontSize: 12 }}>✦ ۞ ✦</Text>
    <View style={{ height: 1, width: 44, backgroundColor: 'rgba(251, 191, 36, 0.35)' }} />
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// THEMES & CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const THEMES = {
  obsidian: {
    name: 'Sacred Obsidian ($83M)',
    bg: ['#040711', '#080e1e'],
    card: 'rgba(12, 20, 36, 0.85)',
    cardHighlight: 'rgba(0, 255, 170, 0.18)',
    primary: '#00ffaa',
    text: '#ffffff',
    subText: '#94a3b8',
    arabic: '#ffffff',
    wbwBg: 'rgba(0, 255, 170, 0.08)',
  },
  emerald: {
    name: 'Ghazali Emerald',
    bg: ['#011f17', '#022c22'],
    card: '#054535',
    cardHighlight: '#0a6b4d',
    primary: '#f59e0b',
    text: '#ffffff',
    subText: '#9ca3af',
    arabic: '#fef3c7',
    wbwBg: 'rgba(174, 208, 175, 0.15)',
  },
  blueQuran: {
    name: 'Blue Quran',
    bg: ['#0a1628', '#0d1f3c'],
    card: 'rgba(13, 71, 161, 0.25)',
    cardHighlight: 'rgba(255, 215, 0, 0.12)',
    primary: '#ffd700',
    text: '#c5a572',
    subText: '#8b9dc3',
    arabic: '#ffd700',
    wbwBg: 'rgba(255, 215, 0, 0.06)',
  },
  midnight: {
    name: 'Midnight Gold',
    bg: ['#0f172a', '#1e293b'],
    card: '#334155',
    cardHighlight: '#475569',
    primary: '#fbbf24',
    text: '#e2e8f0',
    subText: '#94a3b8',
    arabic: '#ffffff',
    wbwBg: 'rgba(38, 92, 135, 0.2)',
  },
  blue: {
    name: 'Royal Blue',
    bg: ['#172554', '#1e3a8a'],
    card: '#1e40af',
    cardHighlight: '#2563eb',
    primary: '#60a5fa',
    text: '#eff6ff',
    subText: '#bfdbfe',
    arabic: '#ffffff',
    wbwBg: 'rgba(96, 165, 250, 0.15)',
  },
  light: {
    name: 'Classic Paper',
    bg: ['#fdf6e3', '#eee8d5'],
    card: '#ffffff',
    cardHighlight: '#fffbeb',
    primary: '#b58900',
    text: '#586e75',
    subText: '#93a1a1',
    arabic: '#000000',
    wbwBg: 'rgba(181, 137, 0, 0.1)',
  },
  matrix: {
    name: 'Matrix Lisan',
    bg: ['#0a0a0a', '#050505'],
    card: 'rgba(51, 255, 51, 0.08)',
    cardHighlight: 'rgba(51, 255, 51, 0.15)',
    primary: '#33ff33',
    text: '#33ff33',
    subText: '#22aa22',
    arabic: '#33c833',
    wbwBg: 'rgba(34, 170, 34, 0.12)',
  }
};

const RECITERS = [
  { id: 'abdulbasit', name: 'Abdul Basit (Murattal)', url: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/', letterSync: true },
  { id: 'minshawi', name: 'Minshawi Murattal', url: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/', letterSync: true },
  { id: 'husary', name: 'Al-Husary', url: 'https://everyayah.com/data/Husary_128kbps/', letterSync: true },
  { id: 'mah', name: 'M. Ahmad Hassan ⭐', url: 'local', letterSync: true, matrixGlow: true },
];

const DEFAULT_SETTINGS = {
  theme: 'matrix',  // Matrix Lisan theme as default
  fontSize: 32,  // Increased for AlQuran-like size
  translitFontSize: 13,  // Separate transliteration font size
  arabicFont: 'amiri',
  showTranslation: true,
  showTransliteration: false,
  reciter: 'abdulbasit',  // Abdul Basit (Murattal) letter-level default
  tajweed: false,  // Off by default for cleaner letter highlighting
  allahHighlight: true,
  wordHighlight: true,   // Word-level highlighting (enable/disable)
  letterHighlight: true,  // Letter-level highlighting for MAH (smoother flow)
  showIbnKathir: true,   // Ibn Kathir English tafsir
  showJalalayn: true,    // Al-Jalalayn English tafsir
  translation: 'sahih',  // Translation: 'sahih', 'haleem', 'albanian'
};

// Translation options
const TRANSLATIONS = [
  { id: 'sahih', name: 'Saheeh International', lang: 'English' },
  { id: 'haleem', name: 'Abdel Haleem', lang: 'English' },
  { id: 'albanian', name: 'Sherif Ahmeti', lang: 'Albanian' },
  { id: 'german', name: 'Abu Rida', lang: 'German' },
];

// ═══════════════════════════════════════════════════════════════════════════
// ALLAH SHIMMER COMPONENT - Gold Holographic Effect
// ═══════════════════════════════════════════════════════════════════════════
const AllahShimmer = ({ children, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const color = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#ffd700', '#fff4c4', '#ffd700'],
  });

  return (
    <Animated.Text style={[style, { color, textShadowColor: '#ffd700', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }]}>
      {children}
    </Animated.Text>
  );
};

// Helper to render Arabic text with Allah highlighted
const renderArabicWithAllah = (text, baseStyle, highlight = true) => {
  if (!highlight || !text) return <Text style={baseStyle}>{text}</Text>;

  const allahPatterns = ['الله', 'ٱللَّه', 'ٱللَّهِ', 'لِلَّهِ', 'بِٱللَّهِ'];
  let parts = [text];

  allahPatterns.forEach(pattern => {
    parts = parts.flatMap(part => {
      if (typeof part !== 'string') return [part];
      const split = part.split(pattern);
      const result = [];
      split.forEach((s, i) => {
        result.push(s);
        if (i < split.length - 1) result.push({ isAllah: true, text: pattern });
      });
      return result;
    });
  });

  return (
    <Text style={baseStyle}>
      {parts.map((part, i) =>
        typeof part === 'string'
          ? part
          : <AllahShimmer key={i} style={baseStyle}>{part.text}</AllahShimmer>
      )}
    </Text>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('splash');
  const [navigationStack, setNavigationStack] = useState(['home']); // Navigation history
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [lastSurahScrollIndex, setLastSurahScrollIndex] = useState(0); // Scroll position memory
  const [lastVerseScrollIndex, setLastVerseScrollIndex] = useState(0); // Verse scroll position memory
  const homeFlatListRef = useRef(null); // Home screen list ref

  // Expanded tafsir state - tracks which verse:tafsir combinations are expanded
  const [expandedIbnKathir, setExpandedIbnKathir] = useState<{ [key: string]: boolean }>({});
  const [expandedJalalayn, setExpandedJalalayn] = useState<{ [key: string]: boolean }>({});

  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState({ isPlaying: false, currentVerse: null });
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [viewMode, setViewMode] = useState<"mushaf" | "study">("mushaf");
  const [playbackQueue, setPlaybackQueue] = useState([]);
  const [playingWordIndex, setPlayingWordIndex] = useState(-1); // Word-level highlighting
  const [playingMahWordIdx, setPlayingMahWordIdx] = useState(-1); // MAH letter-level: current word index in timing
  const [playingMahCharIdx, setPlayingMahCharIdx] = useState(-1); // MAH letter-level: current char index in word
  const [autoScroll, setAutoScroll] = useState(false); // Auto-scroll toggle (default OFF)
  const flatListRef = useRef(null);
  const wordTimerRef = useRef<any>(null);
  const mahSurahBaseIndexRef = useRef<{ [key: string]: number }>({});  // Persist surahBaseIndex per audio file
  const mahCurrentUrlRef = useRef<string | null>(null);  // Track current MAH audio URL for continuity
  // Muttasil (مُتَّصِل - Connected) Pattern: Refs for seamless verse transitions
  const currentVerseIndexRef = useRef<number>(0);  // Current verse index in queue
  const verseBoundariesRef = useRef<{ verseKey: string; surah: number; ayah: number; startWordIdx: number; endWordIdx: number }[]>([]);
  const playbackQueueRef = useRef<any[]>([]);  // Mirror of queue for callback access

  // ═══════════════════════════════════════════════════════════════════════════
  // LAST-READ TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  const [lastRead, setLastRead] = useState<{ surah: number; ayah: number; timestamp: number } | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFLINE AUDIO DOWNLOADS
  // ═══════════════════════════════════════════════════════════════════════════
  const [downloadedSurahs, setDownloadedSurahs] = useState<{ [key: number]: boolean }>({});
  const [downloadProgress, setDownloadProgress] = useState<{ [key: number]: number }>({});
  const [isDownloading, setIsDownloading] = useState<{ [key: number]: boolean }>({});

  // ═══════════════════════════════════════════════════════════════════════════
  // LISAN AL-ARAB MODAL STATE
  // ═══════════════════════════════════════════════════════════════════════════
  const [lisanModalVisible, setLisanModalVisible] = useState(false);
  const [lisanWord, setLisanWord] = useState<{ arabic: string; root: string; meaning: string } | null>(null);

  // Show Lisan al-Arab etymology for a word
  const showLisanModal = (arabic: string, root: string) => {
    const meaning = lisanIndexData[root] || 'لا يوجد تفسير في لسان العرب';
    setLisanWord({ arabic, root, meaning });
    setLisanModalVisible(true);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // WORD PLAYBACK & LUXURY WORD INSPECTOR HUD STATE ($83M UX STANDARD)
  // ═══════════════════════════════════════════════════════════════════════════
  // Student Tajweed Learning & Handy Navigation State
  const [isAyahLooping, setIsAyahLooping] = useState(false);
  const isAyahLoopingRef = useRef(false);
  const [jumperModalVisible, setJumperModalVisible] = useState(false);

  // Student Tajweed Learning State
  const [tajweedGuideVisible, setTajweedGuideVisible] = useState(false);
  const [activeTajweedChapterIdx, setActiveTajweedChapterIdx] = useState(0);
  const [selectedWordRule, setSelectedWordRule] = useState<TajweedRule | null>(null);
  const [selectedLetterIdx, setSelectedLetterIdx] = useState<number | null>(null);
  const [pulsingWordKey, setPulsingWordKey] = useState<string | null>(null);

  const [activeWordHUD, setActiveWordHUD] = useState<{
    surah: number;
    ayah: number;
    wordIdx: number;
    wordText: string;
    translit?: string;
    root?: string;
    translation?: string;
    startMs?: number;
    endMs?: number;
    isPlaying?: boolean;
    isLooping?: boolean;
  } | null>(null);

  const wordSoundRef = useRef<Audio.Sound | null>(null);
  const wordTimerRef2 = useRef<any>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Play single isolated word snippet (QuranCDN crystal WBW or reciter slice)
  const playWordOnly = async (
    surah: number,
    ayah: number,
    wordIdx: number,
    wordObj?: any,
    loopCount: number = 1,
    speedOverride?: number,
    openHUD: boolean = false
  ) => {
    const playRate = speedOverride || playbackSpeed;
    try {
      if (wordTimerRef2.current) {
        clearTimeout(wordTimerRef2.current);
        wordTimerRef2.current = null;
      }
      if (wordSoundRef.current) {
        try {
          await wordSoundRef.current.stopAsync();
          await wordSoundRef.current.unloadAsync();
        } catch (e) {}
        wordSoundRef.current = null;
      }

      const verseKey = `${surah}:${ayah}`;
      const timingSource =
        settings.reciter === 'minshawi'
          ? timingMinshawi
          : settings.reciter === 'husary'
          ? timingHusary
          : timingAbdulBasit;

      const verseWords = (timingSource as any)[verseKey];
      let startMs = 0;
      let endMs = 0;
      if (verseWords && verseWords[wordIdx]) {
        startMs = verseWords[wordIdx][1];
        endMs = verseWords[wordIdx][2];
      }

      const durationMs = endMs > startMs ? endMs - startMs : 1200;

      setPlayingWordIndex(wordIdx);
      if (openHUD) {
        setActiveWordHUD({
          surah,
          ayah,
          wordIdx,
          wordText: wordObj?.arabic || '',
          translit: wordObj?.translit,
          root: wordObj?.root,
          translation: wordObj?.translation,
          startMs,
          endMs,
          isPlaying: true,
          isLooping: loopCount > 1,
        });
      }

      const surahPadded = String(surah).padStart(3, '0');
      const ayahPadded = String(ayah).padStart(3, '0');
      const wordPadded = String(wordIdx + 1).padStart(3, '0');
      const wbwAudioUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;

      let currentIter = 0;
      const playIteration = async () => {
        try {
          let sound: Audio.Sound;
          try {
            const res = await Audio.Sound.createAsync(
              { uri: wbwAudioUrl },
              { shouldPlay: true, rate: playRate }
            );
            sound = res.sound;
          } catch (netErr) {
            const reciter = RECITERS.find(r => r.id === settings.reciter) || RECITERS[0];
            const ayahUrl = `${reciter.url}${surahPadded}${ayahPadded}.mp3`;
            const res = await Audio.Sound.createAsync(
              { uri: ayahUrl },
              { positionMillis: startMs, shouldPlay: true, rate: playRate }
            );
            sound = res.sound;
            wordTimerRef2.current = setTimeout(async () => {
              try { await sound.pauseAsync(); } catch (e) {}
            }, durationMs / playRate + 60);
          }

          wordSoundRef.current = sound;
          sound.setOnPlaybackStatusUpdate(st => {
            if (st.isLoaded && st.didJustFinish) {
              currentIter++;
              if (currentIter < loopCount) {
                wordTimerRef2.current = setTimeout(() => {
                  playIteration();
                }, 350);
              } else {
                setActiveWordHUD(p => p ? { ...p, isPlaying: false, isLooping: false } : null);
              }
            }
          });
        } catch (err) {
          console.warn('Word audio iteration error:', err);
          setActiveWordHUD(p => p ? { ...p, isPlaying: false, isLooping: false } : null);
        }
      };

      await playIteration();
    } catch (e) {
      console.warn('playWordOnly error:', e);
    }
  };

  // Double-tap vs Single-tap detection:
  // 1 click -> Play audio only (instant pronunciation)
  // 2 clicks (double-tap) -> Open deep word learn tab
  const lastWordClickRef = useRef<{ key: string; time: number } | null>(null);

  const handleWordClick = (
    surah: number,
    ayah: number,
    wordIdx: number,
    wordObj?: any,
    start?: number,
    end?: number
  ) => {
    const key = `${surah}:${ayah}:${wordIdx}`;
    const now = Date.now();

    if (lastWordClickRef.current && lastWordClickRef.current.key === key && (now - lastWordClickRef.current.time < 450)) {
      // ➔ DOUBLE TAP: Open Word Learn Tab!
      lastWordClickRef.current = null;
      playWordOnly(surah, ayah, wordIdx, wordObj, 1, 1.0, true);
    } else {
      // ➔ SINGLE TAP: Play audio ONLY with instant visual ink pulse!
      lastWordClickRef.current = { key, time: now };
      setPulsingWordKey(key);
      setTimeout(() => setPulsingWordKey(p => p === key ? null : p), 600);
      playWordOnly(surah, ayah, wordIdx, wordObj, 1, 1.0, false);
    }
  };

  // Play crystal audio of an individual Arabic letter or syllable with smart phonetic resolution
  const playLetterAudio = async (
    letterGrapheme: string,
    letterArabicName?: string,
    mode: 'smart' | 'name' | 'vowel' = 'smart'
  ) => {
    try {
      if (wordSoundRef.current) {
        try {
          await wordSoundRef.current.stopAsync();
          await wordSoundRef.current.unloadAsync();
        } catch (e) {}
        wordSoundRef.current = null;
      }

      let textToSpeak = '';

      if (mode === 'name') {
        textToSpeak = letterArabicName || letterGrapheme || 'أَلِف';
      } else {
        const cleanGrapheme = (letterGrapheme || '').trim();
        const baseChar = cleanGrapheme.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').trim();

        const hasFathah = cleanGrapheme.includes('َ');
        const hasKasrah = cleanGrapheme.includes('ِ');
        const hasDammah = cleanGrapheme.includes('ُ');
        const hasDaggerAlif = cleanGrapheme.includes('ٰ');
        const hasMaddah = cleanGrapheme.includes('ٓ');
        const hasSukun = cleanGrapheme.includes('ْ');
        const hasTanweenFath = cleanGrapheme.includes('ً');
        const hasTanweenKasr = cleanGrapheme.includes('ٍ');
        const hasTanweenDamm = cleanGrapheme.includes('ٌ');
        const hasTanween = hasTanweenFath || hasTanweenKasr || hasTanweenDamm;

        if (mode === 'vowel' && hasSukun) {
          // Classical Tajweed / Noorani Qaidah onset for Sukūn (e.g. 'أَمْ' / 'أَلْ' / 'أَتْ')
          textToSpeak = baseChar ? `أَ${baseChar}ْ` : (letterArabicName || 'أَلِف');
        } else if (hasDaggerAlif || hasMaddah) {
          // Dagger Alif (ٰ) or Maddah -> prolonged 'aa' e.g. 'مَا' or 'تَا'
          textToSpeak = baseChar ? `${baseChar}ا` : (letterArabicName || 'أَلِف');
        } else if (hasKasrah && !hasSukun) {
          // Kasrah [i]: Appending Yā' ensures Google TTS pronounces true, crystal-clear "Ti" / "Bi" / "Si" instead of dialectal "Teh"
          textToSpeak = baseChar ? `${baseChar}ِي` : 'إِي';
        } else if (hasDammah && !hasSukun) {
          // Dammah [u]: Appending Wāw ensures Google TTS pronounces true, resonant "Tu" / "Bu" / "Su" instead of clipped stop
          textToSpeak = baseChar ? `${baseChar}ُو` : 'أُو';
        } else if (hasFathah && !hasSukun) {
          textToSpeak = `${baseChar}َ`;
        } else if (hasTanweenFath) {
          textToSpeak = baseChar ? `${baseChar}ًا` : (letterArabicName || 'أَلِف');
        } else if (hasTanweenKasr) {
          textToSpeak = baseChar ? `${baseChar}ٍ` : (letterArabicName || 'أَلِف');
        } else if (hasTanweenDamm) {
          textToSpeak = baseChar ? `${baseChar}ٌ` : (letterArabicName || 'أَلِف');
        } else if (hasSukun || (!hasFathah && !hasKasrah && !hasDammah && !hasTanween)) {
          // BARE LETTER (like silent 'ل' in 'ٱلـ' or 'م' in 'الم') or SUKUN:
          // In Google TTS, a bare consonant cannot be voiced in isolation without an onset vowel.
          // For learners, speak the full Arabic letter name ('لاَم' / 'مِيم' / 'تَاء' / 'سِين')
          textToSpeak = letterArabicName || (baseChar ? `أَ${baseChar}ْ` : 'أَلِف');
        } else {
          textToSpeak = letterArabicName || cleanGrapheme || 'أَلِف';
        }
      }

      if (!textToSpeak || textToSpeak.length === 0) {
        textToSpeak = letterArabicName || 'أَلِف';
      }

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=${encodeURIComponent(textToSpeak)}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 }
      );
      wordSoundRef.current = sound;
    } catch (e) {
      console.warn("Letter audio error:", e);
    }
  };

  // Audio cache directory - uses expo-file-system Paths API
  const audioCacheDir = Platform.OS !== 'web' ? new Directory(Paths.cache, 'audio_cache') : null;

  // Theme
  const theme = THEMES[settings.theme] || THEMES.emerald;

  // Navigation helpers
  const navigate = (newScreen) => {
    setNavigationStack(prev => [...prev, newScreen]);
    setScreen(newScreen);
  };

  const goBack = useCallback(() => {
    if (navigationStack.length > 1) {
      const newStack = [...navigationStack];
      newStack.pop();
      const prevScreen = newStack[newStack.length - 1];
      setNavigationStack(newStack);
      setScreen(prevScreen);

      // Restore verse scroll position when returning to surah view
      if (prevScreen === 'surah' && lastVerseScrollIndex > 0 && flatListRef.current) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: Math.max(0, lastVerseScrollIndex - 1),
              animated: false,
              viewPosition: 0.3
            });
          } catch (e) {
            console.log('Verse scroll restoration error:', e);
          }
        }, 150);
      }
      return true; // Handled
    }
    return false; // Let system handle (exit app only at home)
  }, [navigationStack, lastVerseScrollIndex]);

  // Track visible items for last-read functionality (must be at top level to avoid hook order issues)
  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      const firstVisible = viewableItems[0].item;
      if (firstVisible?.ayah && selectedSurah) {
        // Save to AsyncStorage
        const data = { surah: selectedSurah, ayah: firstVisible.ayah, timestamp: Date.now() };
        setLastRead(data);
        AsyncStorage.setItem('lastRead', JSON.stringify(data)).catch(console.log);
      }
    }
  }, [selectedSurah]);

  // Stable viewability config - must not change between renders
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
  }), []);

  // Android Hardware Back Button Handler
  useEffect(() => {
    if (Platform.OS === 'android' || Platform.OS === 'web') {
      const backAction = () => {
        if (activeWordHUD) {
          setActiveWordHUD(null);
          setSelectedLetterIdx(null);
          return true;
        }
        if (lisanModalVisible) {
          setLisanModalVisible(false);
          return true;
        }
        if (jumperModalVisible) {
          setJumperModalVisible(false);
          return true;
        }
        if (tajweedGuideVisible) {
          setTajweedGuideVisible(false);
          return true;
        }
        if (screen === 'home') {
          return false; // Allow exit only from home
        }
        return goBack();
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [screen, goBack, activeWordHUD, lisanModalVisible, jumperModalVisible, tajweedGuideVisible]);

  // Scroll position restoration when returning to home
  useEffect(() => {
    if (screen === 'home' && lastSurahScrollIndex > 0 && homeFlatListRef.current) {
      // Delay to ensure FlatList is fully rendered
      const timer = setTimeout(() => {
        try {
          homeFlatListRef.current?.scrollToIndex({
            index: Math.min(lastSurahScrollIndex, surahsData.length - 1),
            animated: false,
            viewPosition: 0.3
          });
        } catch (e) {
          console.log('Scroll restoration error:', e);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [screen, lastSurahScrollIndex]);

  // Load Settings & Last Read on Startup
  useEffect(() => {
    // Enable background audio playback
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const loadAppState = async () => {
      try {
        // Load last read position
        const savedLastRead = await AsyncStorage.getItem('lastRead');
        if (savedLastRead) {
          setLastRead(JSON.parse(savedLastRead));
        }

        // Load settings with Abdul Basit fallback
        const savedSettings = await AsyncStorage.getItem('settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }

        // Check downloaded surahs (mobile only)
        if (Platform.OS !== 'web' && audioCacheDir) {
          try {
            if (audioCacheDir.exists) {
              const contents = await audioCacheDir.list();
              const downloaded: { [key: number]: boolean } = {};
              contents.forEach(item => {
                const match = item.name.match(/surah_(\d+)/);
                if (match) downloaded[parseInt(match[1])] = true;
              });
              setDownloadedSurahs(downloaded);
            }
          } catch (e) {
            console.log('Audio cache check error:', e);
          }
        }
      } catch (e) {
        console.log('Error loading app state:', e);
      }

      setTimeout(() => {
        setLoading(false);
        let targetScreen = 'home';
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
          const params = new URLSearchParams(window.location.search);
          const sNum = parseInt(params.get('surah') || '0', 10);
          const scr = params.get('screen');
          const vm = params.get('view');
          if (sNum > 0) setSelectedSurah(sNum);
          if (scr) targetScreen = scr;
          if (vm === 'mushaf' || vm === 'study') setViewMode(vm);
        }
        setScreen(targetScreen);
        setNavigationStack(targetScreen === 'home' ? ['home'] : ['home', targetScreen]);
      }, Platform.OS === 'web' ? 400 : 2000);
    };
    loadAppState();
  }, []);

  // Audio Playback Logic
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const playSurah = async (surahNum) => {
    const verses = versesData[surahNum] || [];
    const queue = verses.map(v => ({ surah: surahNum, ayah: v.ayah }));
    setPlaybackQueue(queue);

    // MAH uses dedicated full-surah audio, Abdul Basit and others use standard per-verse queue
    if (settings.reciter === 'mah') {
      await playMahSurah(surahNum, queue);
    } else {
      playQueue(queue, 0);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TILAWAH (تِلاوَة) PATTERN: Single-load continuous tracking for MAH
  // ═══════════════════════════════════════════════════════════════════════════
  const playMahSurah = async (surahNum: number, queue: any[]) => {
    console.log(`[TILAWAH] playMahSurah called for surah ${surahNum} with ${queue.length} verses`);
    try {
      // Stop any existing audio
      console.log('[TILAWAH] Stopping any existing audio...');
      if (sound) await sound.unloadAsync();
      mahCurrentUrlRef.current = null;
      if (wordTimerRef.current) { clearInterval(wordTimerRef.current); wordTimerRef.current = null; }

      // Get audio URL
      const mahAudioMap: { [key: number]: { url: string; seek_ms?: number } } = {
        1: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-fatiha_1.mp3' },
        18: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_018_al-kahf.mp3' },
        36: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/yasin_36.mp3' },
        47: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/muhammad_47.mp3' },
        53: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_053_an-najm.mp3' },
        55: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_055_ar-rahman.mp3' },
        56: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_056_al-waqiah.mp3' },
        67: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_067_al-mulk.mp3' },
        71: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_071_nuh.mp3' },
        75: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/qiyamah_75.mp3' },
        80: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_080_abasa.mp3' },
        82: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_082_al-infitar.mp3' },
        85: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_085_al-buruj.mp3' },
        87: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-ala_87.mp3' },
        89: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-fajr_89.mp3' },
        90: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-balad_90.mp3' },
        91: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/ash-shams_91.mp3' },
        92: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-layl_92.mp3' },
        93: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/ad-duha_93.mp3' },
        109: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-kafirun_109.mp3' },
        112: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-ikhlas_112.mp3' },
        113: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-falaq_113.mp3' },
        114: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/an-nas_114.mp3' },
      };

      const mahEntry = mahAudioMap[surahNum];
      if (!mahEntry) {
        // Fallback to standard reciter
        playQueue(queue, 0);
        return;
      }

      const url = mahEntry.url;
      const mahSeekPosition = mahEntry.seek_ms || 0;

      // Load timing data
      const mahTimingMap: { [key: number]: any[] } = {
        18: timingMah18, 36: timingMah36, 47: timingMah47,
        53: timingMah53, 55: timingMah55, 56: timingMah56,
        67: timingMah67, 71: timingMah71,
        75: timingMahQiyamah, 80: timingMah80, 82: timingMah82, 85: timingMah85,
        87: timingMah87, 89: timingMah89, 90: timingMah90, 91: timingMah91,
        92: timingMah92, 93: timingMah93, 97: timingMah97, 109: timingMah109, 112: timingMah112,
        1: timingMah1, 113: timingMah113, 114: timingMah114,
      };
      const letterTimingMap: { [key: number]: any[] } = {
        1: letterTiming1, 18: letterTiming18, 36: letterTiming36, 47: letterTiming47,
        53: letterTiming53, 55: letterTiming55, 56: letterTiming56,
        67: letterTiming67, 71: letterTiming71,
        75: letterTiming75, 80: letterTiming80, 82: letterTiming82, 85: letterTiming85,
        87: letterTiming87, 89: letterTiming89, 90: letterTiming90, 91: letterTiming91,
        92: letterTiming92, 93: letterTiming93, 97: letterTiming97, 109: letterTiming109, 112: letterTiming112,
        113: letterTiming113, 114: letterTiming114,
      };
      const mahTiming = mahTimingMap[surahNum] || [];
      const letterTiming = letterTimingMap[surahNum] || [];
      // Auto-detect timing units: if first entry.start > 100, its already ms; else seconds
      const timingMultiplier = (mahTiming.length > 0 && mahTiming[0].start > 100) ? 1 : 1000;
      const letterTimingMultiplier = (letterTiming.length > 0 && letterTiming[0].start > 100) ? 1 : 1000;

      // Calculate surahBaseIndex
      let surahBaseIndex = 0;
      if (mahTiming.length > 0) {
        let headerEndIndex = -1;
        const searchLimit = Math.min(mahTiming.length, 30);
        for (let k = 0; k < searchLimit; k++) { if (mahTiming[k].word.includes('الرحيم')) headerEndIndex = k; }
        if (headerEndIndex !== -1) surahBaseIndex = headerEndIndex + 1;
      }

      // Load verse timing for this surah (all MAH surahs)
      // Verse Timing Map - Explicitly linking Verse Start to Audio Word Index
      const verseTimingMap: { [key: number]: any[] } = {
        1: verseTiming1,
        18: verseTiming18,
        36: verseTiming36,
        47: verseTiming47,
        53: verseTiming53,
        55: verseTiming55,
        56: verseTiming56,
        67: verseTiming67,
        71: verseTiming71,
        75: verseTiming75,
        80: verseTiming80,
        82: verseTiming82,
        85: verseTiming85,
        87: verseTiming87,
        89: verseTiming89,
        90: verseTiming90,
        91: verseTiming91,
        92: verseTiming92,
        93: verseTiming93,
        109: verseTiming109,
        112: verseTiming112,
        113: verseTiming113,
        114: verseTiming114,
      };
      const verseTimes = verseTimingMap[surahNum] || [];

      // Pre-compute verse word boundaries
      const getVerseStartWordIdx = (ayahNum: number) => {
        const surahVerses = versesData[surahNum.toString()] || [];
        let count = 0;
        for (let i = 0; i < surahVerses.length; i++) {
          if (surahVerses[i].ayah < ayahNum) count += surahVerses[i].words?.length || 0;
          else break;
        }
        return count;
      };

      // Load audio ONCE
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
      await newSound.setProgressUpdateIntervalAsync(48);
      if (mahSeekPosition > 0) await newSound.setPositionAsync(mahSeekPosition);
      await newSound.playAsync();
      setSound(newSound);
      mahCurrentUrlRef.current = url;

      // Initialize state
      let currentVerseIdx = 0;
      const firstVerse = queue[0];
      setPlaybackStatus({ isPlaying: true, currentVerse: `${surahNum}:${firstVerse.ayah}` });
      setPlayingWordIndex(0);

      if (flatListRef.current) {
        if (autoScroll && flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: 0, animated: true, viewPosition: 0.3 });
        }
      }

      // Search trackers
      let lastWIdx = surahBaseIndex;
      let lastLIdx = 0;

      // ═══════════════════════════════════════════════════════════════════════
      // SINGLE PERSISTENT CALLBACK - Never calls playQueue, never reloads audio
      // ═══════════════════════════════════════════════════════════════════════
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.isPlaying) {
          const posMs = status.positionMillis || 0;
          setPlaybackPositionMs(posMs);

          // VERSE DETECTION (timestamp-based from verse timing data)
          if (verseTimes.length > 0) {
            for (let v = 0; v < verseTimes.length; v++) {
              const vt = verseTimes[v];
              // JSON uses start_ms/end_ms (already in milliseconds)
              const nextVt = verseTimes[v + 1];
              const startTime = vt.start_ms || 0;
              const endTime = vt.end_ms || (nextVt ? nextVt.start_ms : (vt.start_ms + 20000));

              if (posMs >= startTime && posMs < endTime) {
                if (v !== currentVerseIdx) {
                  currentVerseIdx = v;
                  const newAyah = vt.ayah;
                  setPlaybackStatus({ isPlaying: true, currentVerse: `${surahNum}:${newAyah}` });
                  setPlayingWordIndex(0);
                  // Safety check for scrollToIndex
                  if (flatListRef.current && autoScroll) {
                    // Start scroll slightly before to ensure visibility
                    flatListRef.current.scrollToIndex({
                      index: Math.max(0, newAyah - 1),
                      animated: true,
                      viewPosition: 0.3
                    });
                  }
                }
                break;
              }
            }
          }

          // WORD DETECTION (from mahTiming)
          let currentWordIdx = -1;
          let mahWordIdx = -1;
          let mahCharIdx = -1;

          if (mahTiming.length > 0) {
            let globalWordIdx = -1;
            for (let i = lastWIdx; i < mahTiming.length; i++) {
              const startMs = mahTiming[i].start * timingMultiplier;
              const endMs = mahTiming[i].end * timingMultiplier;
              if (posMs >= startMs && posMs < endMs) { globalWordIdx = i; lastWIdx = i; break; }
              if (posMs < startMs) break;
            }
            if (globalWordIdx === -1 && posMs < (mahTiming[lastWIdx]?.start || 0) * timingMultiplier) lastWIdx = surahBaseIndex;

            if (globalWordIdx !== -1) {
              // Align Word Index with Letter Index logic (using startWordIdx)
              const currentVt = verseTimes[currentVerseIdx];
              currentWordIdx = globalWordIdx - (currentVt ? (currentVt.startWordIdx || 0) : 0);
            }

            // Letter timing (auto-detect units: ms or seconds)
            for (let i = lastLIdx; i < letterTiming.length; i++) {
              const lt = letterTiming[i];
              const ltStartMs = lt.start * letterTimingMultiplier;
              const ltEndMs = lt.end * letterTimingMultiplier;
              if (posMs >= ltStartMs && posMs < ltEndMs) {
                const currentAyah = verseTimes[currentVerseIdx]?.ayah || 1;
                // ALIGNMENT FIX: Use explicit startWordIdx from verse timing
                const currentVt = verseTimes[currentVerseIdx];
                mahWordIdx = lt.wordIdx - (currentVt ? (currentVt.startWordIdx || 0) : 0);
                mahCharIdx = lt.charIdx;
                lastLIdx = i;
                break;
              }
              if (posMs < ltStartMs) break;
            }
            if (mahWordIdx === -1 && posMs < (letterTiming[lastLIdx]?.start || 0) * letterTimingMultiplier) lastLIdx = 0;
          }

          if (currentWordIdx !== -1) setPlayingWordIndex(currentWordIdx);
          // Letter highlighting respects settings.letterHighlight
          if (settings.letterHighlight && mahCharIdx !== -1) { // Removed mahWordIdx check
            setPlayingMahWordIdx(mahWordIdx);
            setPlayingMahCharIdx(mahCharIdx);
          } else {
            setPlayingMahCharIdx(-1);
          }
        }

        // End of audio
        if (status.isLoaded && status.didJustFinish) {
          setPlayingWordIndex(-1);
          setPlayingMahWordIdx(-1);
          setPlayingMahCharIdx(-1);
          mahCurrentUrlRef.current = null;
          setPlaybackStatus({ isPlaying: false, currentVerse: null });
        }
      });
    } catch (e) {
      console.log("MAH Audio Error", e);
      setPlayingWordIndex(-1);
      setPlaybackStatus({ isPlaying: false, currentVerse: null });
    }
  };

  const playQueue = async (queue: any[], index: number) => {
    if (index >= queue.length) {
      setPlaybackStatus({ isPlaying: false, currentVerse: null });
      mahCurrentUrlRef.current = null;
      return;
    }

    const item = queue[index];
    const reciter = RECITERS.find(r => r.id === settings.reciter);
    const isMah = settings.reciter === 'mah';

    let globalId = 0;
    for (let i = 1; i < item.surah; i++) {
      globalId += surahsData.find(s => s.number === i).verses;
    }
    globalId += item.ayah;

    const standardTimingMap =
      settings.reciter === 'abdulbasit' ? timingAbdulBasit :
        settings.reciter === 'husary' ? timingHusary :
          settings.reciter === 'minshawi' ? timingMinshawi :
            timingAbdulBasit;

    let url: string;
    let mahSeekPosition = 0;
    if (isMah) {
      const mahAudioMap: { [key: number]: { url: string; seek_ms?: number } } = {
        1: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-fatiha_1.mp3' },
        18: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_018_al-kahf.mp3' },
        36: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/yasin_36.mp3' },
        47: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/muhammad_47.mp3' },
        53: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_053_an-najm.mp3' },
        55: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_055_ar-rahman.mp3' },
        56: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_056_al-waqiah.mp3' },
        67: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_067_al-mulk.mp3' },
        71: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_071_nuh.mp3' },
        75: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/qiyamah_75.mp3' },
        80: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_080_abasa.mp3' },
        82: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_082_al-infitar.mp3' },
        85: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_085_al-buruj.mp3' },
        87: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-ala_87.mp3' },
        89: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-fajr_89.mp3' },
        90: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-balad_90.mp3' },
        91: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/ash-shams_91.mp3' },
        92: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-layl_92.mp3' },
        93: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/ad-duha_93.mp3' },
        109: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-kafirun_109.mp3' },
        112: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-ikhlas_112.mp3' },
        113: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-falaq_113.mp3' },
        114: { url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/an-nas_114.mp3' },
      };
      const mahEntry = mahAudioMap[item.surah];
      if (mahEntry) {
        url = mahEntry.url;
        mahSeekPosition = mahEntry.seek_ms || 0;

        // VERSE SEEKING LOGIC: If explicit verse requested (index corresponds to specific ayah)
        // Look up Timestamp from Verse Timing
        const verseTimingMap: { [key: number]: any[] } = {
          1: verseTiming1, 18: verseTiming18, 36: verseTiming36, 47: verseTiming47, 53: verseTiming53,
          55: verseTiming55, 56: verseTiming56, 67: verseTiming67, 71: verseTiming71, 75: verseTiming75,
          80: verseTiming80, 82: verseTiming82, 85: verseTiming85, 87: verseTiming87, 89: verseTiming89,
          90: verseTiming90, 91: verseTiming91, 92: verseTiming92, 93: verseTiming93, 109: verseTiming109,
          112: verseTiming112, 113: verseTiming113, 114: verseTiming114,
        };

        const vtList = verseTimingMap[item.surah];
        // Find the verse timing for the requested ayah
        const targetVerse = vtList ? vtList.find(v => v.ayah === item.ayah) : null;
        if (targetVerse && targetVerse.start_ms) {
          mahSeekPosition = targetVerse.start_ms;  // Already in milliseconds
          console.log(`[MAH SEEK] Surah ${item.surah} Verse ${item.ayah} -> Seeking to ${mahSeekPosition}ms`);
        }
      }
      else { url = `${RECITERS[0].url}${globalId}.mp3`; }
    } else {
      if (reciter.url.includes("everyayah.com")) {
        const surahStr = String(item.surah).padStart(3, "0");
        const ayahStr = String(item.ayah).padStart(3, "0");
        url = `${reciter.url}${surahStr}${ayahStr}.mp3`;
      } else {
        url = `${reciter.url}${globalId}.mp3`;
      }
    }

    try {
      if (wordTimerRef.current) { clearInterval(wordTimerRef.current); wordTimerRef.current = null; }
      setPlayingWordIndex(0);

      const mahTimingMap: { [key: number]: any[] } = {
        18: timingMah18, 36: timingMah36, 47: timingMah47,
        53: timingMah53, 55: timingMah55, 56: timingMah56,
        67: timingMah67, 71: timingMah71,
        75: timingMahQiyamah, 80: timingMah80, 82: timingMah82, 85: timingMah85,
        87: timingMah87, 89: timingMah89, 90: timingMah90, 91: timingMah91,
        92: timingMah92, 93: timingMah93, 97: timingMah97, 109: timingMah109, 112: timingMah112,
        1: timingMah1, 113: timingMah113, 114: timingMah114,
      };
      const letterTimingMap: { [key: number]: any[] } = {
        18: letterTiming18, 36: letterTiming36, 47: letterTiming47,
        53: letterTiming53, 55: letterTiming55, 56: letterTiming56,
        67: letterTiming67, 71: letterTiming71,
        75: letterTimingQiyamah, 80: letterTiming80, 82: letterTiming82, 85: letterTiming85,
        87: letterTiming87, 89: letterTiming89, 90: letterTiming90, 91: letterTiming91,
        92: letterTiming92, 93: letterTiming93, 97: letterTiming97, 109: letterTiming109, 112: letterTiming112,
        1: letterTiming1, 113: letterTiming113, 114: letterTiming114,
      };
      const mahTiming = isMah ? (mahTimingMap[item.surah] || []) : [];
      const letterTiming = isMah ? (letterTimingMap[item.surah] || []) : [];
      // Auto-detect timing units for playQueue
      const timingMultiplier = (mahTiming.length > 0 && mahTiming[0].start > 100) ? 1 : 1000;
      const letterTimingMultiplier = (letterTiming.length > 0 && letterTiming[0].start > 100) ? 1 : 1000;

      // Calculate surahBaseIndex (skip Bismillah header)
      let surahBaseIndex = 0;
      if (isMah && mahTiming.length > 0) {
        const audioFileKey = `${item.surah}_${url}`;
        if (mahSurahBaseIndexRef.current[audioFileKey] !== undefined) {
          surahBaseIndex = mahSurahBaseIndexRef.current[audioFileKey];
        } else {
          let headerEndIndex = -1;
          const searchLimit = Math.min(mahTiming.length, 30);
          for (let k = 0; k < searchLimit; k++) { if (mahTiming[k].word.includes('الرحيم')) headerEndIndex = k; }
          if (headerEndIndex !== -1) surahBaseIndex = headerEndIndex + 1;
          else if (item.surah === 9) {
            for (let k = 0; k < searchLimit; k++) { if (mahTiming[k].word.includes('الرجيم')) { surahBaseIndex = k + 1; break; } }
          }
          mahSurahBaseIndexRef.current[audioFileKey] = surahBaseIndex;
        }
      }

      // Helper for verse word offset
      const getVerseStartWordIdx = (surahNum: number, ayahNum: number) => {
        const surahKey = surahNum.toString();
        const surahVerses = versesData[surahKey] || [];
        let count = 0;
        for (let i = 0; i < surahVerses.length; i++) {
          if (surahVerses[i].ayah < ayahNum) count += surahVerses[i].words?.length || 0;
          else break;
        }
        return count;
      };

      // ═══════════════════════════════════════════════════════════════════════
      // MUTTASIL (مُتَّصِل) PATTERN: Pre-compute ALL verse boundaries for chain
      // ═══════════════════════════════════════════════════════════════════════
      if (isMah) {
        // MAH always treats the queue as the full surah for continuity
        const allVerses = surahsData.find(s => s.number === item.surah)?.verses || 0;
        const boundaries = [];
        for (let v = 1; v <= allVerses; v++) {
          const verseStart = getVerseStartWordIdx(item.surah, v);
          const verseCount = versesData[item.surah.toString()]?.find(vers => vers.ayah === v)?.words?.length || 5;
          boundaries.push({
            verseKey: `${item.surah}:${v}`,
            surah: item.surah,
            ayah: v,
            startWordIdx: verseStart,
            endWordIdx: verseStart + verseCount
          });
        }
        verseBoundariesRef.current = boundaries;
        // We don't override playbackQueueRef with full queue to avoid side effects?
        // Actually, standard logic relies on queue index? 
        // But transition logic uses absolute index 'v'.
        // So boundaries[v] works perfectly.
      }
      else if (index === 0) {
        // Standard Reciters: queue based
        const boundaries = queue.map((qItem) => {
          const verseStart = getVerseStartWordIdx(qItem.surah, qItem.ayah);
          const verseCount = versesData[qItem.surah.toString()]?.find(v => v.ayah === qItem.ayah)?.words?.length || 5;
          return {
            verseKey: `${qItem.surah}:${qItem.ayah}`,
            surah: qItem.surah,
            ayah: qItem.ayah,
            startWordIdx: verseStart,
            endWordIdx: verseStart + verseCount
          };
        });
        verseBoundariesRef.current = boundaries;
        playbackQueueRef.current = queue;
      }
      currentVerseIndexRef.current = index;

      // Current verse boundaries
      const verseStartWordIdx = isMah ? getVerseStartWordIdx(item.surah, item.ayah) : 0;
      const verseWordCount = versesData[item.surah.toString()]?.find(v => v.ayah === item.ayah)?.words?.length || 5;

      // Sound management - don't reload if same URL (MAH continuity)
      let activeSound = sound;
      const isSameUrl = isMah && mahCurrentUrlRef.current === url && sound;
      console.log(`[MAH DEBUG] playQueue called: surah=${item.surah} ayah=${item.ayah} isSameUrl=${isSameUrl} mahCurrentUrlRef=${mahCurrentUrlRef.current} url=${url}`);
      if (isSameUrl) {
        console.log('[MAH DEBUG] Same URL detected - skipping audio reload');
        // If SEEKING to a different verse (index moved), we must jump audio
        if (sound && mahSeekPosition > 0) {
          console.log(`[MAH SEEK] Jumping to ${mahSeekPosition}ms`);
          // Important: check if already close? No, trust user click.
          await sound.setPositionAsync(mahSeekPosition);
        }
        setPlaybackStatus(prev => ({ ...prev, currentVerse: `${item.surah}:${item.ayah}` }));
      } else {
        console.log('[MAH DEBUG] Loading new audio');
        if (sound) await sound.unloadAsync();
        mahCurrentUrlRef.current = null;
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
        await newSound.setProgressUpdateIntervalAsync(48);
        if (mahSeekPosition > 0) await newSound.setPositionAsync(mahSeekPosition);
        await newSound.playAsync();
        setSound(newSound);
        activeSound = newSound;
        if (isMah) mahCurrentUrlRef.current = url;
      }

      setPlaybackStatus({ isPlaying: true, currentVerse: `${item.surah}:${item.ayah}` });

      if (flatListRef.current && autoScroll) {
        flatListRef.current.scrollToIndex({
          index: Math.max(0, item.ayah - 1),
          animated: true,
          viewPosition: 0.3
        });
      }

      // Standard reciter: fallback timer if no timing data
      const verseTiming = (isMah && mahTiming.length > 0) ? [] : (standardTimingMap[`${item.surah}:${item.ayah}`] || []);
      if (!isMah && verseTiming.length === 0) {
        const estimatedDuration = 6000 + (verseWordCount * 600);
        const wordInterval = Math.floor(estimatedDuration / verseWordCount);
        let currentW = 0;
        wordTimerRef.current = setInterval(() => {
          currentW++;
          if (currentW < verseWordCount) setPlayingWordIndex(currentW);
          else if (wordTimerRef.current) { clearInterval(wordTimerRef.current); wordTimerRef.current = null; }
        }, wordInterval);
      }

      // Search trackers for efficient lookup
      let lastWIdx = isMah ? (surahBaseIndex + verseStartWordIdx) : 0;
      let lastLIdx = 0;

      // ═══════════════════════════════════════════════════════════════════════
      // PERSISTENT CALLBACK: Detects verse transitions via refs, never detaches
      // ═══════════════════════════════════════════════════════════════════════
      activeSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.isPlaying) {
          const posMs = status.positionMillis || 0;
          setPlaybackPositionMs(posMs);
          let currentWordIdx = -1;
          let mahWordIdx = -1;
          let mahCharIdx = -1;

          // Multi-reciter letter-level timing
          const isAbdulBasit = settings.reciter === 'abdulbasit';
          const isLetterReciter = isAbdulBasit || settings.reciter === 'husary' || settings.reciter === 'minshawi';
          let absContentIdx = -1;

          if (isMah && mahTiming.length > 0) {
            let globalWordIdx = -1;
            for (let i = lastWIdx; i < mahTiming.length; i++) {
              const startMs = mahTiming[i].start * 1000; // Convert seconds to ms
              const endMs = mahTiming[i].end * 1000;
              if (posMs >= startMs && posMs < endMs) { globalWordIdx = i; lastWIdx = i; break; }
              if (posMs < startMs) break;
            }
            if (globalWordIdx === -1 && posMs < (mahTiming[lastWIdx]?.start || 0) * 1000) lastWIdx = 0;

            if (globalWordIdx !== -1) {
              const absContentIdx = globalWordIdx - surahBaseIndex;

              // ══════════════════════════════════════════════════════════════
              // VERSE TRANSITION DETECTION (Timestamp-based - from verse timing data)
              // ══════════════════════════════════════════════════════════════
              // Use verseTimingMap for timestamp-based detection (more accurate than word indices)
              const verseTimingMap: { [key: number]: any[] } = {
                1: verseTiming1,
                18: verseTiming18,
                36: verseTiming36,
                47: verseTiming47,
                53: verseTiming53,
                55: verseTiming55,
                56: verseTiming56,
                67: verseTiming67,
                71: verseTiming71,
                75: verseTiming75,
                80: verseTiming80,
                82: verseTiming82,
                85: verseTiming85,
                87: verseTiming87,
                89: verseTiming89,
                90: verseTiming90,
                91: verseTiming91,
                92: verseTiming92,
                93: verseTiming93,
                109: verseTiming109,
                112: verseTiming112,
                113: verseTiming113,
                114: verseTiming114,
              };
              const verseTimes = verseTimingMap[item.surah] || [];

              // Declare newVerseIdx in correct scope
              let newVerseIdx = -1;

              if (verseTimes.length > 0) {
                // Find which verse we're in based on audio position
                for (let v = 0; v < verseTimes.length; v++) {
                  const vt = verseTimes[v];
                  // JSON uses start_ms/end_ms (already in milliseconds)
                  const nextVt = verseTimes[v + 1];
                  const startTime = vt.start_ms || 0;
                  const endTime = vt.end_ms || (nextVt ? nextVt.start_ms : (vt.start_ms + 20000));

                  if (posMs >= startTime && posMs < endTime) {
                    newVerseIdx = v;
                    break;
                  }
                }
                // REMOVED stray break statement that was here
              }

              // Detect verse transition (now newVerseIdx and verseTimes are in scope)
              if (newVerseIdx !== -1 && newVerseIdx !== currentVerseIndexRef.current) {
                currentVerseIndexRef.current = newVerseIdx;
                const newAyah = verseTimes[newVerseIdx]?.ayah || (newVerseIdx + 1);
                setPlaybackStatus({ isPlaying: true, currentVerse: `${item.surah}:${newAyah}` });
                setPlayingWordIndex(0);

                // Safe scroll
                if (flatListRef.current && autoScroll) {
                  flatListRef.current.scrollToIndex({
                    index: Math.max(0, newAyah - 1),
                    animated: true,
                    viewPosition: 0.3
                  });
                }
              }
            }

            // Calculate verse-relative word index
            const currentBoundary = verseBoundariesRef.current[currentVerseIndexRef.current];
            if (currentBoundary) {
              currentWordIdx = absContentIdx - currentBoundary.startWordIdx;
            }

            // Letter-level timing (auto-detect units: ms or seconds)
            for (let i = lastLIdx; i < letterTiming.length; i++) {
              const lt = letterTiming[i];
              const ltStartMs = lt.start * letterTimingMultiplier;
              const ltEndMs = lt.end * letterTimingMultiplier;
              if (posMs >= ltStartMs && posMs < ltEndMs) {
                const currentBoundary = verseBoundariesRef.current[currentVerseIndexRef.current];
                if (currentBoundary) {
                  mahWordIdx = (lt.wordIdx - surahBaseIndex) - currentBoundary.startWordIdx  // Global to content;
                }
                mahCharIdx = lt.charIdx;
                lastLIdx = i;
                break;
              }
              if (posMs < ltStartMs) break;
            }
            if (mahWordIdx === -1 && posMs < (letterTiming[lastLIdx]?.start || 0) * letterTimingMultiplier) lastLIdx = 0;
          } else {
            // Standard reciters
            for (let i = 0; i < verseTiming.length; i++) {
              const [wordIdx, startMs, endMs] = verseTiming[i];
              if (posMs >= startMs && posMs < endMs) { currentWordIdx = wordIdx - 1; break; }
            }

            // Multi-reciter letter-level highlighting with Dynamic Acoustic Duration Scaling
            if (isLetterReciter && settings.letterHighlight) {
              const verseKey = `${item.surah}:${item.ayah}`;
              const activeLettersMap = settings.reciter === 'husary' ? letterTimingHusary : (settings.reciter === 'minshawi' ? letterTimingMinshawi : letterTimingAbdulBasit);
              const abLetters = activeLettersMap ? activeLettersMap[verseKey] : null;
              if (abLetters && abLetters.length > 0) {
                const fileDurMs = status.durationMillis || (abLetters[abLetters.length - 1].end + 500);
                const timingEnd = abLetters[abLetters.length - 1].end;
                
                // Adaptive scale to absorb reverb tails and tempo variations
                const scale = (fileDurMs > 1000 && timingEnd > 0 && Math.abs(fileDurMs - timingEnd) > 800)
                  ? (fileDurMs * 0.88) / timingEnd
                  : 1.0;

                const scaledStart = abLetters[0].start * scale;
                const scaledEnd = timingEnd * scale;

                if (posMs < scaledStart) {
                  mahWordIdx = -1;
                  mahCharIdx = -1;
                } else if (posMs >= scaledEnd) {
                  const lastLt = abLetters[abLetters.length - 1];
                  mahWordIdx = lastLt.wordIdx;
                  mahCharIdx = lastLt.charIdx;
                } else {
                  for (let i = 0; i < abLetters.length; i++) {
                    const lt = abLetters[i];
                    const lStart = lt.start * scale;
                    const lEnd = lt.end * scale;
                    if (posMs >= lStart && posMs < lEnd) {
                      mahWordIdx = lt.wordIdx;
                      mahCharIdx = lt.charIdx;
                      break;
                    }
                  }
                }
              }
            }
          }

          if (currentWordIdx !== -1) setPlayingWordIndex(currentWordIdx);
          // Letter highlighting respects settings.letterHighlight
          if (settings.letterHighlight && mahCharIdx !== -1) { // Removed mahWordIdx check
            setPlayingMahWordIdx(mahWordIdx);
            setPlayingMahCharIdx(mahCharIdx);
          } else if (isMah || isLetterReciter) {
            setPlayingMahCharIdx(-1);
          }
        }

        if (status.isLoaded && status.didJustFinish) {
          // Only on audio file end, advance to next in queue or loop
          setPlayingWordIndex(-1);
          setPlayingMahWordIdx(-1);
          setPlayingMahCharIdx(-1);
          mahCurrentUrlRef.current = null;
          if (isAyahLoopingRef.current) {
            playQueue(queue, index); // Student Ayah Takrar Loop
          } else {
            playQueue(queue, index + 1); // Play next verse
          }
        }
      });
    } catch (e) {
      console.log("Audio Error", e);
      if (wordTimerRef.current) { clearInterval(wordTimerRef.current); wordTimerRef.current = null; }
      setPlayingWordIndex(-1);
      playQueue(queue, index + 1);
    }
  };

  const playFromAyah = (ayahNum: number) => {
    const vList = versesData[selectedSurah] || [];
    const queue = vList.map(v => ({ surah: selectedSurah, ayah: v.ayah }));
    const startIdx = vList.findIndex(v => v.ayah === ayahNum);
    playQueue(queue, startIdx >= 0 ? startIdx : 0);
  };

  const stopAudio = async () => {
    if (sound) await sound.stopAsync();
    mahCurrentUrlRef.current = null;  // Clear URL tracking on stop
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
    setPlayingWordIndex(-1);
    setPlaybackStatus({ isPlaying: false, currentVerse: null });
    setPlaybackQueue([]);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // LAST-READ HELPERS
  // ═════════════════════════════════════════════════════════════════════════
  const saveLastRead = async (surah: number, ayah: number) => {
    const data = { surah, ayah, timestamp: Date.now() };
    setLastRead(data);
    await AsyncStorage.setItem('lastRead', JSON.stringify(data));
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (mins > 0) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // ═════════════════════════════════════════════════════════════════════════
  // OFFLINE AUDIO DOWNLOAD
  // ═════════════════════════════════════════════════════════════════════════
  const downloadSurahAudio = async (surahNum: number) => {
    if (Platform.OS === 'web' || !audioCacheDir) {
      Alert.alert('Not Available', 'Offline downloads are only available on mobile devices.');
      return;
    }

    const surah = surahsData.find(s => s.number === surahNum);
    const verseCount = surah?.verses || 0;
    const reciter = RECITERS.find(r => r.id === settings.reciter);
    if (!reciter) return;

    setIsDownloading(prev => ({ ...prev, [surahNum]: true }));
    setDownloadProgress(prev => ({ ...prev, [surahNum]: 0 }));

    try {
      // Create cache directory if needed
      if (!audioCacheDir.exists) {
        await audioCacheDir.create();
      }

      // MAH reciter uses full-surah audio files
      if (settings.reciter === 'mah') {
        const mahAudioMap: { [key: number]: string } = {
          18: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_018_al-kahf.mp3',
          36: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/yasin_36.mp3',
          47: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/muhammad_47.mp3',
          53: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_053_an-najm.mp3',
          55: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_055_ar-rahman.mp3',
          56: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_056_al-waqiah.mp3',
          67: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_067_al-mulk.mp3',
          71: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_071_nuh.mp3',
          75: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/qiyamah_75.mp3',
          80: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_080_abasa.mp3',
          82: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_082_al-infitar.mp3',
          85: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/surah_085_al-buruj.mp3',
          87: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-ala_87.mp3',
          89: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-fajr_89.mp3',
          90: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-balad_90.mp3',
          91: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/ash-shams_91.mp3',
          92: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-layl_92.mp3',
          93: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/ad-duha_93.mp3',
          109: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-kafirun_109.mp3',
          112: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-ikhlas_112.mp3',
          1: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-fatiha_1.mp3',
          113: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/al-falaq_113.mp3',
          114: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/an-nas_114.mp3',
        };
        const mahUrl = mahAudioMap[surahNum];
        if (!mahUrl) {
          Alert.alert('Not Available', 'This surah is not yet available for MAH reciter download.');
          setIsDownloading(prev => ({ ...prev, [surahNum]: false }));
          return;
        }
        // Download full surah MP3
        const audioFile = new File(audioCacheDir, `mah_surah_${surahNum}.mp3`);
        const response = await fetch(mahUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64 = (reader.result as string).split(',')[1];
              await audioFile.write(base64, { encoding: 'base64' });
              resolve();
            } catch (e) { reject(e); }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        setDownloadProgress(prev => ({ ...prev, [surahNum]: 100 }));
      } else {
        // Standard reciters: download verse-by-verse
        for (let ayah = 1; ayah <= verseCount; ayah++) {
          let globalId = 0;
          for (let i = 1; i < surahNum; i++) {
            const s = surahsData.find(s => s.number === i);
            globalId += s?.verses || 0;
          }
          globalId += ayah;

          const url = `${reciter.url}${globalId}.mp3`;
          const audioFile = new File(audioCacheDir, `surah_${surahNum}_ayah_${ayah}.mp3`);

          // Download using fetch and save to file
          const response = await fetch(url);
          const blob = await response.blob();
          const reader = new FileReader();

          await new Promise<void>((resolve, reject) => {
            reader.onloadend = async () => {
              try {
                const base64 = (reader.result as string).split(',')[1];
                await audioFile.write(base64, { encoding: 'base64' });
                resolve();
              } catch (e) { reject(e); }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          setDownloadProgress(prev => ({ ...prev, [surahNum]: Math.round((ayah / verseCount) * 100) }));
        }
      }

      setDownloadedSurahs(prev => ({ ...prev, [surahNum]: true }));
      Alert.alert('Download Complete', `${surah?.name || 'Surah'} audio is now available offline.`);
    } catch (e) {
      console.log('Download error:', e);
      Alert.alert('Download Failed', 'Please check your connection and try again.');
    } finally {
      setIsDownloading(prev => ({ ...prev, [surahNum]: false }));
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // RENDERERS
  // ═════════════════════════════════════════════════════════════════════════

  const renderSplash = () => (
    <LinearGradient colors={theme.bg} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.splashContent}>
        <Text style={[styles.splashTitle, { color: theme.primary }]}>بِسْمِ ٱللَّهِ</Text>
        <Text style={[styles.splashSub, { color: theme.text, marginTop: 12 }]}>IHYA QURAN</Text>
        <Text style={[styles.splashTag, { color: theme.subText }]}>Illuminated Edition</Text>
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
      </View>
    </LinearGradient>
  );

  const renderHome = () => (
    <LinearGradient colors={theme.bg} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>Ihya Quran</Text>
          <Text style={{ color: theme.subText, fontSize: 12 }}>إحياء علوم القرآن</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigate('settings')}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* ═══ CONTINUE READING CARD - Illuminated Style ═══ */}
      {lastRead && (
        <TouchableOpacity
          style={[styles.continueCard, { backgroundColor: theme.cardHighlight }]}
          onPress={() => {
            setSelectedSurah(lastRead.surah);
            navigate('surah');
          }}
          activeOpacity={0.85}
        >
          {/* Corner decorations */}
          <View style={{ position: 'absolute', top: -6, left: -6 }}>
            <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 16 }}>✾</Text>
          </View>
          <View style={{ position: 'absolute', top: -6, right: -6 }}>
            <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 16 }}>✾</Text>
          </View>
          <View style={{ position: 'absolute', bottom: -6, left: -6 }}>
            <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 16 }}>✾</Text>
          </View>
          <View style={{ position: 'absolute', bottom: -6, right: -6 }}>
            <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 16 }}>✾</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.continueIcon, { backgroundColor: theme.primary }]}>
              <Text style={{ fontSize: 18 }}>📖</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
                ✦ CONTINUE READING ✦
              </Text>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                {surahsData.find(s => s.number === lastRead.surah)?.name} - Ayah {lastRead.ayah}
              </Text>
              <Text style={{ color: theme.subText, fontSize: 12, marginTop: 2 }}>
                {getRelativeTime(lastRead.timestamp)}
              </Text>
            </View>
            <Text style={{ color: theme.arabic, fontSize: 28 }}>
              {surahsData.find(s => s.number === lastRead.surah)?.arabic}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        ref={homeFlatListRef}
        data={surahsData}
        keyExtractor={item => item.number.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        initialScrollIndex={lastSurahScrollIndex > 0 ? Math.min(lastSurahScrollIndex, surahsData.length - 1) : 0}
        getItemLayout={(data, index) => ({ length: 72, offset: 72 * index, index })}
        onScrollToIndexFailed={() => { }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.surahItem, { backgroundColor: theme.card }]}
            onPress={() => {
              setLastSurahScrollIndex(item.number - 1);
              setSelectedSurah(item.number);
              navigate('surah');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.surahNum, { backgroundColor: theme.bg[0], borderColor: theme.primary, borderWidth: 1 }]}>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{item.number}</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={[styles.surahName, { color: theme.text }]}>{item.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: theme.subText, fontSize: 12 }}>{item.type} • {item.verses} Ayat</Text>
                {downloadedSurahs[item.number] && (
                  <Text style={{ color: theme.primary, fontSize: 10, marginLeft: 6 }}>✓ Offline</Text>
                )}
              </View>
            </View>
            <Text style={[styles.surahArabic, { color: theme.arabic }]}>{item.arabic}</Text>
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );

  const renderSurah = () => {
    const activeWordRules: TajweedRule[] = activeWordHUD ? analyzeWordTajweed(activeWordHUD.wordText, false) : [];
    const activeWordChain: WordChainAnalysis | null = activeWordHUD ? deconstructWordAndChain(activeWordHUD.wordText) : null;
    const surah = surahsData.find(s => s.number === selectedSurah) || { name: 'Surah', arabic: '', number: selectedSurah };
    const verses = versesData[selectedSurah.toString()] || [];

    return (
      <LinearGradient colors={theme.bg} style={styles.container}>
        <StatusBar style="light" />
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TIER 1: REGAL TOP APP BAR (Back, Surah Header, Master Audio FAB)   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Frosted Back Button */}
          <TouchableOpacity
            onPress={goBack}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>

          {/* Majestic Surah Title Centerpiece */}
          <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 10 }}>
            <Text style={{
              color: '#fbbf24',
              fontSize: 24,
              fontWeight: 'bold',
              fontFamily: 'amiri',
              textShadowColor: 'rgba(251, 191, 36, 0.4)',
              textShadowRadius: 8,
              textAlign: 'center',
            }}>
              {surah.arabic}
            </Text>
            <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: '600', marginTop: 1, textAlign: 'center' }}>
              {surah.name} • {verses.length} آية
            </Text>
          </View>

          {/* Master Audio FAB */}
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: playbackStatus.isPlaying ? '#00ffaa' : 'rgba(0, 255, 170, 0.15)',
              borderWidth: 1.5,
              borderColor: '#00ffaa',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#00ffaa',
              shadowRadius: 10,
              shadowOpacity: playbackStatus.isPlaying ? 0.8 : 0.2,
            }}
            onPress={() => playbackStatus.isPlaying ? stopAudio() : playSurah(selectedSurah)}
          >
            <Text style={{ color: playbackStatus.isPlaying ? '#040711' : '#00ffaa', fontSize: 16, fontWeight: 'bold' }}>
              {playbackStatus.isPlaying ? '⏹' : '▶'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TIER 2: STUDENT QUICK-TOOLS RIBBON (Horizontal Scroll of Badges)    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={{ marginVertical: 4 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
          >
            {/* Quick Ayah Jumper */}
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(56, 189, 248, 0.4)',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}
              onPress={() => setJumperModalVisible(true)}
            >
              <Text style={{ fontSize: 13 }}>🧭</Text>
              <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: 'bold' }}>
                الانتقال لآية
              </Text>
            </TouchableOpacity>

            {/* Student Tajweed Quick Toggle */}
            <TouchableOpacity
              style={{
                backgroundColor: settings.tajweed ? '#00ffaa' : 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                borderColor: settings.tajweed ? '#00ffaa' : 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}
              onPress={() => setSettings(s => ({ ...s, tajweed: !s.tajweed }))}
            >
              <Text style={{ fontSize: 13 }}>🎓</Text>
              <Text style={{ color: settings.tajweed ? '#040711' : '#ffffff', fontSize: 12, fontWeight: 'bold' }}>
                {settings.tajweed ? 'التجويد: مفعّل' : 'أحكام التجويد'}
              </Text>
            </TouchableOpacity>

            {/* Student Tajweed Guide Modal Button */}
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(251, 191, 36, 0.4)',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}
              onPress={() => setTajweedGuideVisible(true)}
            >
              <Text style={{ fontSize: 13 }}>📖</Text>
              <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold' }}>
                دليل التجويد
              </Text>
            </TouchableOpacity>

            {/* Auto-Scroll Toggle */}
            <TouchableOpacity
              style={{
                backgroundColor: autoScroll ? 'rgba(0, 255, 170, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                borderColor: autoScroll ? '#00ffaa' : 'rgba(255, 255, 255, 0.15)',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}
              onPress={() => setAutoScroll(!autoScroll)}
            >
              <Text style={{ fontSize: 13 }}>📜</Text>
              <Text style={{ color: autoScroll ? '#00ffaa' : '#cbd5e1', fontSize: 12, fontWeight: '600' }}>
                {autoScroll ? 'التتبع: تلقائي' : 'التمرير اليدوي'}
              </Text>
            </TouchableOpacity>

            {/* Download Button */}
            {!downloadedSurahs[selectedSurah] && !isDownloading[selectedSurah] && (
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}
                onPress={() => downloadSurahAudio(selectedSurah)}
              >
                <Text style={{ fontSize: 13 }}>⬇️</Text>
                <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>تحميل السورة</Text>
              </TouchableOpacity>
            )}
            {isDownloading[selectedSurah] && (
              <View style={{
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                borderWidth: 1,
                borderColor: '#fbbf24',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
              }}>
                <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold' }}>جاري التحميل {downloadProgress[selectedSurah]}%</Text>
              </View>
            )}
            {downloadedSurahs[selectedSurah] && !isDownloading[selectedSurah] && (
              <View style={{
                backgroundColor: 'rgba(0, 255, 170, 0.15)',
                borderWidth: 1,
                borderColor: '#00ffaa',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}>
                <Text style={{ color: '#00ffaa', fontSize: 12, fontWeight: 'bold' }}>محمّلة ✓</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TIER 3: LUXURY SEGMENTED MODE SWITCHER                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={{
          flexDirection: "row",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          borderRadius: 24,
          padding: 4,
          marginHorizontal: 16,
          marginVertical: 6,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}>
          <TouchableOpacity
            onPress={() => setViewMode("mushaf")}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 20,
              backgroundColor: viewMode === "mushaf" ? "#00ffaa" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: viewMode === "mushaf" ? "#00ffaa" : "transparent",
              shadowRadius: 10,
              shadowOpacity: viewMode === "mushaf" ? 0.4 : 0,
            }}
          >
            <Text style={{
              color: viewMode === "mushaf" ? "#040711" : "#94a3b8",
              fontWeight: "bold",
              fontSize: 13
            }}>
              📖 المصحف الشريف
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode("study")}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 20,
              backgroundColor: viewMode === "study" ? "#00ffaa" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: viewMode === "study" ? "#00ffaa" : "transparent",
              shadowRadius: 10,
              shadowOpacity: viewMode === "study" ? 0.4 : 0,
            }}
          >
            <Text style={{
              color: viewMode === "study" ? "#040711" : "#94a3b8",
              fontWeight: "bold",
              fontSize: 13
            }}>
              📚 التفسير والدراسة
            </Text>
          </TouchableOpacity>
        </View>

        {/* GPU Hardware-Accelerated Fluid Mushaf Canvas (120 FPS Sub-Letter Sync on Web) */}
        {viewMode === "mushaf" && Platform.OS === "web" && (
          <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
            {selectedSurah !== 9 && (
              <OrnateFrame theme={theme}>
                <View style={{ alignItems: "center" }}>
                  {renderArabicWithAllah("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", [styles.bismillahText, { color: theme.arabic }], settings.allahHighlight)}
                  <GeometricBorder theme={theme} />
                </View>
              </OrnateFrame>
            )}
            <FluidMushafCanvas
              verses={verses.map(v => ({ ...v, surah: selectedSurah }))}
              letterTimingMap={
                settings.reciter === 'mah' ? globalLetterTimingMap :
                settings.reciter === 'husary' ? letterTimingHusary :
                settings.reciter === 'minshawi' ? letterTimingMinshawi :
                letterTimingAbdulBasit
              }
              reciter={settings.reciter}
              currentVerseKey={playbackStatus.currentVerse}
              currentTimeMs={playbackPositionMs}
              isPlaying={playbackStatus.isPlaying}
              surahNumber={selectedSurah}
              onSeekAyah={(ayah) => playQueue([{ surah: selectedSurah, ayah }], 0)}
              onWordClick={(s, a, wIdx, wText, st, en) => handleWordClick(s, a, wIdx, { arabic: wText }, st, en)}
            />
          </ScrollView>
        )}

        {/* Native Android 120 FPS GPU Hardware-Accelerated Mushaf Flow */}
        {viewMode === "mushaf" && Platform.OS !== "web" && (
          <View style={{ flex: 1, paddingBottom: 10 }}>
            <NativeMushafWebView
              verses={verses.map(v => ({ ...v, surah: selectedSurah }))}
              wordTimingMap={
                settings.reciter === 'husary' ? timingHusary :
                settings.reciter === 'minshawi' ? timingMinshawi :
                timingAbdulBasit
              }
              letterTimingMap={
                settings.reciter === 'mah' ? globalLetterTimingMap :
                settings.reciter === 'husary' ? letterTimingHusary :
                settings.reciter === 'minshawi' ? letterTimingMinshawi :
                letterTimingAbdulBasit
              }
              currentVerseKey={playbackStatus.currentVerse}
              currentTimeMs={playbackPositionMs}
              isPlaying={playbackStatus.isPlaying}
              surahNumber={selectedSurah}
              onSeekAyah={(ayah) => playFromAyah(ayah)}
              onWordClick={(s, a, wIdx, wText) => playWordOnly(s, a, wIdx, { arabic: wText }, 1, 1.0, true)}
            />
          </View>
        )}

        {/* Bismillah Header (for study mode) */}
        {viewMode === "study" && selectedSurah !== 9 && (
          <OrnateFrame theme={theme}>
            <View style={{ alignItems: "center" }}>
              {renderArabicWithAllah("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", [styles.bismillahText, { color: theme.arabic }], settings.allahHighlight)}
              <GeometricBorder theme={theme} />
            </View>
          </OrnateFrame>
        )}

        {/* Verses List (Word Study & Tafsir Mode) */}
        {viewMode === "study" && (
        <FlatList
          ref={flatListRef}
          data={verses}
          keyExtractor={item => `${selectedSurah}:${item.ayah}`}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          onScrollToIndexFailed={() => { }}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => {
            const isPlaying = playbackStatus.currentVerse === `${selectedSurah}:${item.ayah}`;
            return (
              <>
                <Animated.View style={[
                  styles.verseCard,
                  {
                    backgroundColor: isPlaying ? theme.cardHighlight : theme.card,
                    borderLeftColor: isPlaying ? theme.primary : 'transparent',
                    borderLeftWidth: isPlaying ? 4 : 0,
                  }
                ]}>
                  {/* Verse Number Badge */}
                  <View style={styles.verseHeader}>
                    <View style={[styles.verseBadge, { backgroundColor: theme.primary }]}>
                      <Text style={{ color: theme.bg[0], fontWeight: 'bold', fontSize: 12 }}>{item.ayah}</Text>
                    </View>
                    {/* Hide play button for MAH - automatic transitions handle verse playback */}
                    {settings.reciter !== 'mah' && (
                      <TouchableOpacity
                        style={[styles.miniPlayBtn, { backgroundColor: theme.bg[0] }]}
                        onPress={() => playQueue([{ surah: selectedSurah, ayah: item.ayah }], 0)}
                      >
                        <Text style={{ color: theme.primary, fontSize: 12 }}>▶</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Word by Word Flow - Letter-by-letter aligned */}
                  <View style={[styles.wordContainer, { backgroundColor: theme.wbwBg }]}>
                    {item.words && item.words.map((word, idx) => {
                      const isCurrentVerse = playbackStatus.currentVerse === `${selectedSurah}:${item.ayah}`;
                      // For letter-sync reciters (MAH, AbdulBasit), use playingMahWordIdx from the 
                      // LETTER timing source so word & letter highlighting are always aligned.
                      // Using playingWordIndex (from word timing) causes desync and erratic jumping.
                      const isMahReciter = settings.reciter === 'mah' || settings.reciter === 'abdulbasit';
                      const isCurrentWord = isCurrentVerse && (
                        isMahReciter ? idx === playingMahWordIdx : idx === playingWordIndex
                      );
                      const isPastWord = isCurrentVerse && isMahReciter && (idx < playingMahWordIdx);

                      const isHUDWord = activeWordHUD && activeWordHUD.surah === selectedSurah && activeWordHUD.ayah === item.ayah && activeWordHUD.wordIdx === idx;
                      const isPulsing = pulsingWordKey === `${selectedSurah}:${item.ayah}:${idx}`;
                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          onPress={() => handleWordClick(selectedSurah, item.ayah, idx, word)}
                          onLongPress={() => playWordOnly(selectedSurah, item.ayah, idx, word, 1, 1.0, true)}
                          style={[
                            styles.wordColumn,
                            {
                              // Always have border to prevent layout shift when highlighted
                              borderRadius: 8,
                              borderWidth: 1.5,
                              // Highlight active word HUD, pulsing word, or reciting word
                              borderColor: isPulsing
                                ? '#fbbf24'
                                : (isHUDWord
                                  ? '#00ffaa'
                                  : (isCurrentWord
                                    ? (settings.reciter === 'mah' ? '#00ff88' : '#ffd700')
                                    : 'transparent')),
                              backgroundColor: isPulsing
                                ? 'rgba(251, 191, 36, 0.25)'
                                : isHUDWord
                                  ? 'rgba(0, 255, 170, 0.25)'
                                  : isCurrentWord
                                    ? (settings.reciter === 'mah' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 215, 0, 0.25)')
                                    : 'transparent',
                            }
                          ]}
                        >
                          {renderTajweedText(
                            word.arabic,
                            [
                              styles.wordArabic,
                              {
                                fontSize: settings.fontSize,
                                color: theme.arabic || '#ffffff',
                              }
                            ],
                            settings.tajweed,
                            ((settings.reciter === 'mah' || settings.reciter === 'abdulbasit') && isCurrentWord) ? playingMahCharIdx : -1,
                            isPastWord,
                            isCurrentWord
                          )}
                          {/* LTR Transliteration (natural Latin direction) */}
                          {settings.showTransliteration && word.translit && (
                            <Text style={[
                              styles.wordTranslit,
                              {
                                color: '#94a3b8',
                                writingDirection: 'ltr',
                                textAlign: 'center',
                                fontSize: settings.translitFontSize || 12,
                                letterSpacing: 0.2,
                                marginTop: 2,
                              },
                              isCurrentWord && { color: '#00ffaa', fontWeight: 'bold' }
                            ]}>
                              {word.translit}
                            </Text>
                          )}
                          {/* Root indicator (tap hint) */}
                          {word.root && (
                            <Text style={{ fontSize: 8, color: theme.subText, opacity: 0.6 }}>
                              [{word.root}]
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Translation - uses selected translator */}
                  {settings.showTranslation && (
                    <Text style={[styles.translation, { color: theme.subText }]}>
                      {settings.translation === 'haleem'
                        ? haleemData[`${selectedSurah}:${item.ayah}`] || item.translation
                        : settings.translation === 'albanian'
                          ? albanianData[`${selectedSurah}:${item.ayah}`] || item.translation
                          : settings.translation === 'german'
                            ? ridaGermanData[`${selectedSurah}:${item.ayah}`] || item.translation
                            : item.translation}
                    </Text>
                  )}

                  {/* Ibn Kathir Tafsir Inline - Tappable to expand */}
                  {settings.showIbnKathir && ibnKathirData[`${selectedSurah}:${item.ayah}`] && (
                    <TouchableOpacity
                      onPress={() => {
                        const key = `${selectedSurah}:${item.ayah}`;
                        setExpandedIbnKathir(prev => ({ ...prev, [key]: !prev[key] }));
                      }}
                      style={{ marginTop: 8, padding: 10, backgroundColor: 'rgba(255, 140, 0, 0.08)', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#ff8c00' }}
                    >
                      <Text style={{ color: '#ff8c00', fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>
                        📙 Ibn Kathir {expandedIbnKathir[`${selectedSurah}:${item.ayah}`] ? '▼' : '▶'}
                      </Text>
                      <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20 }} numberOfLines={expandedIbnKathir[`${selectedSurah}:${item.ayah}`] ? undefined : 3}>
                        {ibnKathirData[`${selectedSurah}:${item.ayah}`]?.replace(/<[^>]*>/g, '')}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Jalalayn Tafsir Inline - Tappable to expand */}
                  {settings.showJalalayn && jalalaynData[`${selectedSurah}:${item.ayah}`] && (
                    <TouchableOpacity
                      onPress={() => {
                        const key = `${selectedSurah}:${item.ayah}`;
                        setExpandedJalalayn(prev => ({ ...prev, [key]: !prev[key] }));
                      }}
                      style={{ marginTop: 6, padding: 10, backgroundColor: 'rgba(100, 140, 200, 0.08)', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#648cc8' }}
                    >
                      <Text style={{ color: '#648cc8', fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>
                        📗 Al-Jalalayn {expandedJalalayn[`${selectedSurah}:${item.ayah}`] ? '▼' : '▶'}
                      </Text>
                      <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20 }} numberOfLines={expandedJalalayn[`${selectedSurah}:${item.ayah}`] ? undefined : 2}>
                        {jalalaynData[`${selectedSurah}:${item.ayah}`]}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Ihya Tafsir Button */}
                  {item.hasIhya && (
                    <TouchableOpacity
                      style={[styles.ihyaBar, { backgroundColor: theme.bg[0], borderColor: theme.primary }]}
                      onPress={() => { setSelectedVerse({ surah: selectedSurah, ...item }); navigate('detail'); }}
                    >
                      <Text style={{ color: theme.primary, fontWeight: '600' }}>📖 Ihya Commentary</Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>

                {/* Verse Separator - manuscript style */}
                <VerseSeparator theme={theme} />
              </>
            );
          }
          }
        />)}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LUXURY WORD INSPECTOR HUD ($83M UX STANDARD)                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeWordHUD && (
          <View style={{
            position: 'absolute',
            bottom: 24,
            left: 14,
            right: 14,
            maxHeight: '86%',
            backgroundColor: 'rgba(7, 13, 26, 0.96)',
            borderRadius: 22,
            padding: 16,
            borderWidth: 1.5,
            borderColor: 'rgba(0, 255, 170, 0.45)',
            shadowColor: '#00ffaa',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 18,
            elevation: 10,
            zIndex: 999,
          }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
            {/* Top row: Badges & Close */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  backgroundColor: 'rgba(0, 255, 170, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(0, 255, 170, 0.4)'
                }}>
                  <Text style={{ color: '#00ffaa', fontSize: 11, fontWeight: 'bold' }}>
                    آية {activeWordHUD.ayah} • كلمة {activeWordHUD.wordIdx + 1}
                  </Text>
                </View>
                {activeWordHUD.root && (
                  <TouchableOpacity
                    onPress={() => showLisanModal(activeWordHUD.wordText, activeWordHUD.root!)}
                    style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(251, 191, 36, 0.4)'
                    }}
                  >
                    <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: 'bold' }}>
                      جذر: {activeWordHUD.root} 🔍
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setActiveWordHUD(null)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Middle: Arabic Word & Phonetics */}
            <View style={{ alignItems: 'center', marginVertical: 6 }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 34,
                fontWeight: 'bold',
                fontFamily: 'amiri',
                textShadowColor: 'rgba(0, 255, 170, 0.5)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 14
              }}>
                {activeWordHUD.wordText}
              </Text>
              {activeWordHUD.translit && (
                <Text style={{ color: '#00ffaa', fontSize: 14, marginTop: 4, letterSpacing: 0.5 }}>
                  {activeWordHUD.translit}
                </Text>
              )}
            </View>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* NON-ARABIC SPEAKER LETTER DECONSTRUCTION & CHAINING SECTION     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeWordChain && (
              <View style={{
                marginTop: 8,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(56, 189, 248, 0.35)',
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: 'bold' }}>
                    🔤 تفكيك الحروف وتوصيلها (Letter Chaining):
                  </Text>
                  <View style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8
                  }}>
                    <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: 'bold' }}>
                      اللفظ: {activeWordChain.phoneticSpelling}
                    </Text>
                  </View>
                </View>

                {/* Visual Chain Flow in True RTL Arabic Direction */}
                <View style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(251, 191, 36, 0.25)'
                }}>
                  <Text style={{ color: '#fbbf24', fontSize: 16, fontFamily: 'amiri', fontWeight: 'bold', textAlign: 'center' }}>
                    {activeWordChain.chainFlow}
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>
                    👈 الاتجاه القرآني: اقرأ من اليمين (١) وصِل يساراً للفظ الكلمة
                  </Text>
                </View>

                {/* Syllable Chunks (Pronounceable units) */}
                {activeWordChain.syllables && activeWordChain.syllables.length > 0 && (
                  <View style={{ marginBottom: 10, alignItems: 'center' }}>
                    <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                      🔊 المقاطع الصوتية (Syllable Chunks):
                    </Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 6, justifyContent: 'center' }}>
                      {activeWordChain.syllables.map((syl, sIdx) => (
                        <View key={sIdx} style={{
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          borderColor: 'rgba(56, 189, 248, 0.35)',
                          borderWidth: 1,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          alignItems: 'center'
                        }}>
                          <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'amiri', fontWeight: 'bold' }}>
                            {syl.arabic}
                          </Text>
                          <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: 'bold' }}>
                            [{syl.phonetic}]
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Horizontal Letters Breakdown Cards in TRUE RTL Direction */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse' }}>
                  <View style={{ flexDirection: 'row-reverse', gap: 8, paddingVertical: 2 }}>
                    {activeWordChain.letters.map((letItem, lIdx) => {
                      const isSel = selectedLetterIdx === letItem.index;
                      const isFirst = lIdx === 0;
                      const isLast = lIdx === activeWordChain.letters.length - 1;
                      const stepLabel = isFirst ? '١. البداية' : isLast ? `${lIdx + 1}. النهاية` : `${lIdx + 1}. الوسط`;
                      return (
                        <TouchableOpacity
                          key={letItem.index}
                          onPress={() => { setSelectedLetterIdx(letItem.index); playLetterAudio(letItem.rawGrapheme, letItem.letterMeta.arabicName); }}
                          style={{
                            backgroundColor: isSel ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                            borderWidth: 1.5,
                            borderColor: isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            alignItems: 'center',
                            minWidth: 72,
                          }}
                        >
                          {/* Step Badge (Rightmost = 1) */}
                          <View style={{
                            backgroundColor: isFirst ? 'rgba(0, 255, 170, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 6,
                            marginBottom: 2
                          }}>
                            <Text style={{ color: isFirst ? '#00ffaa' : '#fbbf24', fontSize: 9, fontWeight: 'bold' }}>
                              {stepLabel}
                            </Text>
                          </View>

                          {/* Arabic Grapheme */}
                          <Text style={{ color: '#ffffff', fontSize: 24, fontFamily: 'amiri', fontWeight: 'bold' }}>
                            {letItem.rawGrapheme}
                          </Text>
                          {/* English Letter Name */}
                          <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>
                            {letItem.letterMeta.englishName}
                          </Text>
                          {/* Syllable Sound */}
                          <Text style={{ color: '#00ffaa', fontSize: 10, fontWeight: '600', marginTop: 1 }}>
                            [{letItem.syllableSound}]
                          </Text>
                          {/* Position Badge */}
                          <View style={{
                            marginTop: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6
                          }}>
                            <Text style={{ color: '#fbbf24', fontSize: 9 }}>
                              {letItem.positionShape}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Selected Letter Clinic & Multi-Sensory Coaching */}
                {selectedLetterIdx !== null && activeWordChain.letters[selectedLetterIdx] && (
                  <View style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: 'rgba(7, 13, 26, 0.85)',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                  }}>
                    {(() => {
                      const sel = activeWordChain.letters[selectedLetterIdx];
                      const isShaddah = sel.harakah.type === 'shaddah';
                      const isSukun = sel.harakah.type === 'sukun';
                      const isMadd = sel.harakah.type === 'madd';
                      const isWasl = sel.baseChar === 'ٱ';
                      return (
                        <View>
                          {/* Title Row */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 14 }}>
                                حرف {sel.letterMeta.arabicName} ({sel.letterMeta.englishName})
                              </Text>
                              <View style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                                  الشكل: {sel.positionShape}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedLetterIdx(null)}>
                              <Text style={{ color: '#94a3b8', fontSize: 12 }}>إغلاق ✕</Text>
                            </TouchableOpacity>
                          </View>

                          {/* Orthography Diagnostic Badges */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
                            {isShaddah && (
                              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                <Text style={{ color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>⚡ شَدَّة (Double Letter): اضغط الحرف مرتين</Text>
                              </View>
                            )}
                            {isSukun && (
                              <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 1, borderColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                <Text style={{ color: '#60a5fa', fontSize: 10, fontWeight: 'bold' }}>🛑 سُكُون (Silent Stop): قف بدون حركة</Text>
                              </View>
                            )}
                            {isMadd && (
                              <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', borderWidth: 1, borderColor: '#a855f7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                <Text style={{ color: '#c084fc', fontSize: 10, fontWeight: 'bold' }}>🌊 مَدّ (Madd): مُد الصوت ٤-٦ حركات</Text>
                              </View>
                            )}
                            {isWasl && (
                              <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', borderWidth: 1, borderColor: '#eab308', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                <Text style={{ color: '#facc15', fontSize: 10, fontWeight: 'bold' }}>🔗 هَمْزَة وَصْل: صِل ما قبلها بها</Text>
                              </View>
                            )}
                          </View>

                          {/* Details */}
                          <Text style={{ color: '#e2e8f0', fontSize: 11, marginTop: 4, lineHeight: 16 }}>
                            • التوصيل: {sel.chainNote}
                          </Text>
                          <Text style={{ color: '#fbbf24', fontSize: 11, marginTop: 2, lineHeight: 16 }}>
                            • الحركة: {sel.harakah.nameAr} ({sel.harakah.nameEn}) {sel.harakah.sound}
                          </Text>
                          <Text style={{ color: '#a7f3d0', fontSize: 11, marginTop: 2, lineHeight: 16 }}>
                            • المخرج والنطق: {sel.letterMeta.makhraj} ({sel.letterMeta.englishSound})
                          </Text>

                          {/* Dedicated Dual Audio Buttons: Letter Name + Vowel Sound */}
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                            <TouchableOpacity
                              onPress={() => playLetterAudio(sel.rawGrapheme, sel.letterMeta.arabicName, 'name')}
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                borderWidth: 1.5,
                                borderColor: '#38bdf8',
                                borderRadius: 10,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                              }}
                            >
                              <Text style={{ fontSize: 14 }}>📢</Text>
                              <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: 'bold' }}>
                                اسم الحرف: {sel.letterMeta.arabicName}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => playLetterAudio(sel.rawGrapheme, sel.letterMeta.arabicName, 'vowel')}
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                backgroundColor: 'rgba(0, 255, 170, 0.15)',
                                borderWidth: 1.5,
                                borderColor: '#00ffaa',
                                borderRadius: 10,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                              }}
                            >
                              <Text style={{ fontSize: 14 }}>🔊</Text>
                              <Text style={{ color: '#00ffaa', fontSize: 11, fontWeight: 'bold' }}>
                                صوت الحركة: [{sel.rawGrapheme}]
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>
            )}

            {/* Student Tajweed Rules Breakdown */}
            {activeWordRules.length > 0 && (
              <View style={{
                marginTop: 8,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 14,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(0, 255, 170, 0.25)',
              }}>
                <Text style={{ color: '#00ffaa', fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>
                  🎓 أحكام التجويد في هذه الكلمة:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {activeWordRules.map((rule, rIdx) => (
                    <TouchableOpacity
                      key={rIdx}
                      onPress={() => setSelectedWordRule(selectedWordRule?.id === rule.id ? null : rule)}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: rule.color,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: rule.color }} />
                      <Text style={{ color: rule.color, fontSize: 11, fontWeight: 'bold' }}>
                        {rule.nameAr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Selected Rule Explanation Card */}
                {selectedWordRule && (
                  <View style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.1)',
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: selectedWordRule.color, fontWeight: 'bold', fontSize: 12 }}>
                        {selectedWordRule.nameAr} ({selectedWordRule.count || selectedWordRule.letters})
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedWordRule(null)}>
                        <Text style={{ color: '#94a3b8', fontSize: 11 }}>إخفاء ✕</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: '#e2e8f0', fontSize: 11, marginTop: 4, lineHeight: 16 }}>
                      {selectedWordRule.description}
                    </Text>
                    <Text style={{ color: '#fbbf24', fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>
                      💡 نصيحة للطالب: {selectedWordRule.studentTip}
                    </Text>
                    <Text style={{ color: '#38bdf8', fontSize: 10, marginTop: 2 }}>
                      📍 المخرج: {selectedWordRule.makhraj}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Student Audio Actions Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              {/* Normal Play */}
              <TouchableOpacity
                onPress={() => playWordOnly(activeWordHUD.surah, activeWordHUD.ayah, activeWordHUD.wordIdx, { arabic: activeWordHUD.wordText, translit: activeWordHUD.translit, root: activeWordHUD.root }, 1, 1.0)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: 'rgba(0, 255, 170, 0.2)',
                  borderWidth: 1,
                  borderColor: '#00ffaa',
                }}
              >
                <Text style={{ color: '#00ffaa', fontWeight: 'bold', fontSize: 11 }}>
                  ▶ عادي (1.0x)
                </Text>
              </TouchableOpacity>

              {/* Slow Practice for Student (0.75x) */}
              <TouchableOpacity
                onPress={() => playWordOnly(activeWordHUD.surah, activeWordHUD.ayah, activeWordHUD.wordIdx, { arabic: activeWordHUD.wordText, translit: activeWordHUD.translit, root: activeWordHUD.root }, 1, 0.75)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: 'rgba(56, 189, 248, 0.18)',
                  borderWidth: 1,
                  borderColor: '#38bdf8',
                }}
              >
                <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 11 }}>
                  🐢 بطيء (0.75x)
                </Text>
              </TouchableOpacity>

              {/* Repetition Loop (3x) for Student Hifz */}
              <TouchableOpacity
                onPress={() => playWordOnly(activeWordHUD.surah, activeWordHUD.ayah, activeWordHUD.wordIdx, { arabic: activeWordHUD.wordText, translit: activeWordHUD.translit, root: activeWordHUD.root }, 3, 1.0)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: 'rgba(251, 191, 36, 0.15)',
                  borderWidth: 1,
                  borderColor: '#fbbf24',
                }}
              >
                <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 11 }}>
                  🔁 تكرار (3x)
                </Text>
              </TouchableOpacity>

              {/* Continue Ayah */}
              <TouchableOpacity
                onPress={() => {
                  const a = activeWordHUD.ayah;
                  setActiveWordHUD(null);
                  playFromAyah(a);
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 11 }}>
                  📖 الآية
                </Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FLOATING LUXURY MASTER PLAYER DECK ($83M STANDARD)                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!activeWordHUD && (playbackStatus.isPlaying || playbackStatus.currentVerse) && (
          <View style={{
            position: 'absolute',
            bottom: Platform.OS === 'android' ? 24 : 18,
            left: 14,
            right: 14,
            backgroundColor: 'rgba(6, 11, 24, 0.94)',
            borderRadius: 22,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1.2,
            borderColor: 'rgba(0, 255, 170, 0.35)',
            shadowColor: '#00ffaa',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 18,
            elevation: 8,
            zIndex: 900,
          }}>
            {/* Header info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: playbackStatus.isPlaying ? '#00ffaa' : '#fbbf24',
                }} />
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>
                  {surah.name} • آية {playbackStatus.currentVerse?.split(':')[1] || '1'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  backgroundColor: 'rgba(0, 255, 170, 0.1)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(0, 255, 170, 0.3)'
                }}>
                  <Text style={{ color: '#00ffaa', fontSize: 10, fontWeight: '700' }}>
                    {RECITERS.find(r => r.id === settings.reciter)?.name || 'Reciter'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => stopAudio()}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Controls Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              {/* Prev Ayah */}
              <TouchableOpacity
                onPress={() => {
                  const cAyah = playbackStatus.currentVerse ? parseInt(playbackStatus.currentVerse.split(':')[1], 10) : 1;
                  const pAyah = Math.max(1, cAyah - 1);
                  playFromAyah(pAyah);
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>⏮</Text>
              </TouchableOpacity>

              {/* -5s */}
              <TouchableOpacity
                onPress={async () => {
                  if (sound) {
                    try {
                      const st: any = await sound.getStatusAsync();
                      if (st.isLoaded) {
                        await sound.setPositionAsync(Math.max(0, (st.positionMillis || 0) - 5000));
                      }
                    } catch (e) {}
                  }
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: 'bold' }}>-5s</Text>
              </TouchableOpacity>

              {/* Play / Pause orb */}
              <TouchableOpacity
                onPress={() => playbackStatus.isPlaying ? stopAudio() : playSurah(selectedSurah)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#00ffaa',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#040711', fontSize: 18, fontWeight: 'bold' }}>
                  {playbackStatus.isPlaying ? '⏸' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* +5s */}
              <TouchableOpacity
                onPress={async () => {
                  if (sound) {
                    try {
                      const st: any = await sound.getStatusAsync();
                      if (st.isLoaded) {
                        await sound.setPositionAsync((st.positionMillis || 0) + 5000);
                      }
                    } catch (e) {}
                  }
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: 'bold' }}>+5s</Text>
              </TouchableOpacity>

              {/* Next Ayah */}
              <TouchableOpacity
                onPress={() => {
                  const cAyah = playbackStatus.currentVerse ? parseInt(playbackStatus.currentVerse.split(':')[1], 10) : 1;
                  const maxAyahs = surahsData.find(s => s.number === selectedSurah)?.verses || 1;
                  const nAyah = Math.min(maxAyahs, cAyah + 1);
                  playFromAyah(nAyah);
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>⏭</Text>
              </TouchableOpacity>

              {/* Ayah Loop Button */}
              <TouchableOpacity
                onPress={() => {
                  const next = !isAyahLooping;
                  setIsAyahLooping(next);
                  isAyahLoopingRef.current = next;
                }}
                style={{
                  backgroundColor: isAyahLooping ? 'rgba(0, 255, 170, 0.25)' : 'rgba(255,255,255,0.08)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isAyahLooping ? '#00ffaa' : 'rgba(255,255,255,0.15)'
                }}
              >
                <Text style={{ color: isAyahLooping ? '#00ffaa' : '#94a3b8', fontSize: 11, fontWeight: 'bold' }}>
                  🔁 {isAyahLooping ? 'تكرار الآية ✓' : 'تكرار'}
                </Text>
              </TouchableOpacity>

              {/* Speed toggle */}
              <TouchableOpacity
                onPress={async () => {
                  const speeds = [1.0, 1.25, 1.5, 0.75];
                  const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                  const nextSpeed = speeds[nextIdx];
                  setPlaybackSpeed(nextSpeed);
                  if (sound) {
                    try { await sound.setRateAsync(nextSpeed, true); } catch (e) {}
                  }
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)'
                }}
              >
                <Text style={{ color: '#00ffaa', fontSize: 11, fontWeight: 'bold' }}>
                  {playbackSpeed}x
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient >
    );
  };

  const renderDetail = () => {
    if (!selectedVerse) return null;
    const tafsirEntry = ihyaTafsirData[`${selectedVerse.surah}:${selectedVerse.ayah}`];

    return (
      <LinearGradient colors={theme.bg} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtnContainer}>
            <Text style={[styles.backBtn, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Ihya Tafsir</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={{ padding: 16 }}>
          {/* Verse Block */}
          <View style={[styles.detailVerseBox, { backgroundColor: theme.card }]}>
            <View style={[styles.verseRefBadge, { backgroundColor: theme.primary }]}>
              <Text style={{ color: theme.bg[0], fontWeight: 'bold' }}>{selectedVerse.surah}:{selectedVerse.ayah}</Text>
            </View>
            {renderArabicWithAllah(
              selectedVerse.text,
              [styles.arabicBlock, { color: theme.arabic, fontSize: settings.fontSize }],
              settings.allahHighlight
            )}
            <Text style={[styles.translationBlock, { color: theme.subText }]}>
              {selectedVerse.translation}
            </Text>
          </View>

          {/* Tafsir Entries */}
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            ✦ COMMENTARY BY IMAM AL-GHAZALI
          </Text>

          {tafsirEntry ? (
            tafsirEntry.map((t, i) => (
              <View key={i} style={[styles.tafsirCard, { backgroundColor: theme.card, borderColor: MANUSCRIPT_COLORS.gold, borderWidth: 1 }]}>
                {/* Decorative top-left corner */}
                <View style={{ position: 'absolute', top: -4, left: -4 }}>
                  <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 16 }}>✾</Text>
                </View>

                {/* Content-type badge + Book title row */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {t.badge && (
                    <View style={{
                      backgroundColor: t.content_type === 'spiritual' ? 'rgba(147, 51, 234, 0.2)'
                        : t.content_type === 'dua' ? 'rgba(16, 185, 129, 0.2)'
                        : t.content_type === 'dhikr' ? 'rgba(59, 130, 246, 0.2)'
                        : t.content_type === 'ethics' ? 'rgba(245, 158, 11, 0.2)'
                        : t.content_type === 'hadith' ? 'rgba(239, 68, 68, 0.15)'
                        : t.content_type === 'afterlife' ? 'rgba(99, 102, 241, 0.2)'
                        : 'rgba(218, 165, 32, 0.15)',
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                      borderWidth: 1,
                      borderColor: t.content_type === 'spiritual' ? 'rgba(147, 51, 234, 0.4)'
                        : t.content_type === 'dua' ? 'rgba(16, 185, 129, 0.4)'
                        : t.content_type === 'dhikr' ? 'rgba(59, 130, 246, 0.4)'
                        : t.content_type === 'ethics' ? 'rgba(245, 158, 11, 0.4)'
                        : t.content_type === 'hadith' ? 'rgba(239, 68, 68, 0.3)'
                        : t.content_type === 'afterlife' ? 'rgba(99, 102, 241, 0.4)'
                        : MANUSCRIPT_COLORS.deepGold,
                    }}>
                      <Text style={{ color: theme.text, fontSize: 11, fontWeight: '600' }}>
                        {t.badge}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.bookBadge, { backgroundColor: 'rgba(218, 165, 32, 0.15)', borderColor: MANUSCRIPT_COLORS.deepGold, borderWidth: 1 }]}>
                    <Text style={{ color: MANUSCRIPT_COLORS.gold, fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5 }}>
                      {t.book_title || "Ihya 'Ulum al-Din"}
                    </Text>
                  </View>
                </View>

                {/* Topic line */}
                {t.topic && (
                  <Text style={{ color: theme.subText, fontSize: 12, fontStyle: 'italic', marginBottom: 10, lineHeight: 18 }}>
                    {t.topic}
                  </Text>
                )}

                {t.arabic && (
                  <>
                    <Text style={[styles.tafsirArabic, { color: theme.arabic, fontSize: 24, lineHeight: 40 }]}>{t.arabic}</Text>
                    {/* Divider between Arabic and English */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 14 }}>
                      <Text style={{ color: MANUSCRIPT_COLORS.deepGold, fontSize: 10, opacity: 0.5 }}>
                        ◆ ❖ ◆
                      </Text>
                    </View>
                  </>
                )}
                <Text style={[styles.tafsirEnglish, { color: theme.text, fontSize: 16, lineHeight: 28, textAlign: 'justify' }]}>{t.english}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.subText, textAlign: 'center', marginTop: 30, fontSize: 16, fontStyle: 'italic' }}>
              No Ihya Tafsir available for this verse.
            </Text>
          )}
          <View style={{ height: 50 }} />
        </ScrollView>
      </LinearGradient>
    );
  };

  const renderSettings = () => (
    <LinearGradient colors={theme.bg} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtnContainer}>
          <Text style={[styles.backBtn, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Theme */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>🎨 THEME</Text>
        <View style={styles.rowWrap}>
          {Object.keys(THEMES).map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.chip, {
                backgroundColor: settings.theme === k ? theme.primary : theme.card,
                borderWidth: 1,
                borderColor: settings.theme === k ? theme.primary : 'transparent'
              }]}
              onPress={() => setSettings({ ...settings, theme: k })}
            >
              <Text style={{ color: settings.theme === k ? theme.bg[0] : theme.text, fontWeight: '500' }}>
                {THEMES[k].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Font Size */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>📏 ARABIC FONT SIZE: {settings.fontSize}px</Text>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => setSettings({ ...settings, fontSize: Math.max(16, settings.fontSize - 2) })}
            style={[styles.sizeBtn, { backgroundColor: theme.card }]}
          >
            <Text style={{ color: theme.text, fontSize: 20 }}>−</Text>
          </TouchableOpacity>
          <View style={[styles.sizePreview, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.arabic, fontSize: settings.fontSize }}>هِ</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSettings({ ...settings, fontSize: Math.min(44, settings.fontSize + 2) })}
            style={[styles.sizeBtn, { backgroundColor: theme.card }]}
          >
            <Text style={{ color: theme.text, fontSize: 20 }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Transliteration Font Size */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>🔤 TRANSLITERATION SIZE: {settings.translitFontSize || 13}px</Text>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => setSettings({ ...settings, translitFontSize: Math.max(8, (settings.translitFontSize || 13) - 1) })}
            style={[styles.sizeBtn, { backgroundColor: theme.card }]}
          >
            <Text style={{ color: theme.text, fontSize: 20 }}>−</Text>
          </TouchableOpacity>
          <View style={[styles.sizePreview, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text, fontSize: settings.translitFontSize || 13 }}>bismillāh</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSettings({ ...settings, translitFontSize: Math.min(20, (settings.translitFontSize || 13) + 1) })}
            style={[styles.sizeBtn, { backgroundColor: theme.card }]}
          >
            <Text style={{ color: theme.text, fontSize: 20 }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Reciter */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>🎙️ RECITER</Text>
        {RECITERS.map(r => (
          <TouchableOpacity
            key={r.id}
            style={[styles.listItem, {
              backgroundColor: settings.reciter === r.id ? theme.cardHighlight : theme.card,
              borderColor: settings.reciter === r.id ? theme.primary : 'transparent',
              borderWidth: 1
            }]}
            onPress={() => setSettings({ ...settings, reciter: r.id })}
          >
            <Text style={{ color: theme.text }}>{r.name}</Text>
            {settings.reciter === r.id && <Text style={{ color: theme.primary }}>✓</Text>}
          </TouchableOpacity>
        ))}

        {/* Translation */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>📖 TRANSLATION</Text>
        <View style={styles.rowWrap}>
          {TRANSLATIONS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, {
                backgroundColor: settings.translation === t.id ? theme.primary : theme.card,
                borderWidth: 1,
                borderColor: settings.translation === t.id ? theme.primary : 'transparent'
              }]}
              onPress={() => setSettings({ ...settings, translation: t.id })}
            >
              <Text style={{ color: settings.translation === t.id ? theme.bg[0] : theme.text, fontWeight: '500', fontSize: 12 }}>
                {t.name} ({t.lang})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Display Options */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>⚙️ DISPLAY OPTIONS</Text>
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderRadius: 12, padding: 16 }]}>
          <Text style={{ color: theme.text }}>Show Translation</Text>
          <Switch
            value={settings.showTranslation}
            onValueChange={v => setSettings({ ...settings, showTranslation: v })}
            trackColor={{ false: theme.subText, true: theme.primary }}
          />
        </View>
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginTop: 8 }]}>
          <Text style={{ color: theme.text }}>Show Transliteration</Text>
          <Switch
            value={settings.showTransliteration}
            onValueChange={v => setSettings({ ...settings, showTransliteration: v })}
            trackColor={{ false: theme.subText, true: theme.primary }}
          />
        </View>
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginTop: 8 }]}>
          <Text style={{ color: theme.text }}>Allah ﷻ Gold Highlight</Text>
          <Switch
            value={settings.allahHighlight}
            onValueChange={v => setSettings({ ...settings, allahHighlight: v })}
            trackColor={{ false: theme.subText, true: theme.primary }}
          />
        </View>
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginTop: 8 }]}>
          <Text style={{ color: theme.text }}>Tajweed Coloring (Beta)</Text>
          <Switch
            value={settings.tajweed}
            onValueChange={v => setSettings({ ...settings, tajweed: v })}
            trackColor={{ false: theme.subText, true: theme.primary }}
          />
        </View>
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginTop: 8 }]}>
          <Text style={{ color: theme.text }}>🔤 Word Highlight</Text>
          <Switch
            value={settings.wordHighlight}
            onValueChange={v => setSettings({ ...settings, wordHighlight: v })}
            trackColor={{ false: theme.subText, true: theme.primary }}
          />
        </View>
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginTop: 8 }]}>
          <Text style={{ color: theme.text }}>✨ Letter Flow (MAH)</Text>
          <Switch
            value={settings.letterHighlight}
            onValueChange={v => setSettings({ ...settings, letterHighlight: v })}
            trackColor={{ false: theme.subText, true: '#00ff88' }}
          />
        </View>
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginTop: 8 }]}>
          <Text style={{ color: theme.text }}>📙 Ibn Kathir Tafsir</Text>
          <Switch
            value={settings.showIbnKathir}
            onValueChange={v => setSettings({ ...settings, showIbnKathir: v })}
            trackColor={{ false: theme.subText, true: '#ff8c00' }}
          />
        </View>
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginTop: 8 }]}>
          <Text style={{ color: theme.text }}>📗 Al-Jalalayn Tafsir</Text>
          <Switch
            value={settings.showJalalayn}
            onValueChange={v => setSettings({ ...settings, showJalalayn: v })}
            trackColor={{ false: theme.subText, true: '#648cc8' }}
          />
        </View>

      </ScrollView>
    </LinearGradient>
  );

  if (loading) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg[0] }}>
      {screen === 'splash' && renderSplash()}
      {screen === 'home' && renderHome()}
      {screen === 'surah' && renderSurah()}
      {screen === 'detail' && renderDetail()}
      {screen === 'settings' && renderSettings()}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LISAN AL-ARAB MODAL - Etymology/Deeper Meaning Display */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={lisanModalVisible}
        onRequestClose={() => setLisanModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: theme.bg[0],
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxHeight: '80%',
            borderWidth: 2,
            borderColor: MANUSCRIPT_COLORS.gold,
          }}>
            {/* Ornate Header */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 14 }}>
                ✾ لسان العرب ✾
              </Text>
              <Text style={{ color: theme.arabic, fontSize: 36, fontWeight: 'bold', marginVertical: 8 }}>
                {lisanWord?.arabic}
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: MANUSCRIPT_COLORS.deepGold,
              }}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>
                  جذر: {lisanWord?.root}
                </Text>
              </View>
            </View>

            {/* Geometric Border */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
              <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 10 }}>
                ◆ ❖ ◆ ❖ ◆ ❖ ◆ ❖ ◆
              </Text>
            </View>

            {/* Meaning Scroll */}
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={{
                color: theme.text,
                fontSize: 16,
                lineHeight: 28,
                textAlign: 'right',
                writingDirection: 'rtl',
              }}>
                {lisanWord?.meaning}
              </Text>
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: theme.primary,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
              onPress={() => setLisanModalVisible(false)}
            >
              <Text style={{ color: theme.bg[0], fontWeight: 'bold' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
          {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* QUICK AYAH & SURAH JUMPER MODAL (الانتقال السريع للآية والسورة)         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={jumperModalVisible}
        onRequestClose={() => setJumperModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}>
          <View style={{
            backgroundColor: '#070d1a',
            borderRadius: 22,
            padding: 20,
            width: '100%',
            maxHeight: '85%',
            borderWidth: 1.5,
            borderColor: '#38bdf8',
            shadowColor: '#38bdf8',
            shadowRadius: 20,
            shadowOpacity: 0.35,
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>🧭</Text>
                <View>
                  <Text style={{ color: '#38bdf8', fontSize: 16, fontWeight: 'bold' }}>
                    الانتقال السريع للآيات
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                    اختر رقم الآية للانتقال والاستماع المباشر
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setJumperModalVisible(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Ayah Grid */}
            <ScrollView style={{ maxHeight: 420 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {(versesData[selectedSurah.toString()] || []).map((vItem) => {
                  const isCur = playbackStatus.currentVerse === `${selectedSurah}:${vItem.ayah}`;
                  return (
                    <TouchableOpacity
                      key={vItem.ayah}
                      onPress={() => {
                        setJumperModalVisible(false);
                        playQueue([{ surah: selectedSurah, ayah: vItem.ayah }], 0);
                        if (flatListRef.current) {
                          try {
                            flatListRef.current.scrollToIndex({
                              index: Math.max(0, vItem.ayah - 1),
                              animated: true,
                              viewPosition: 0.2
                            });
                          } catch (e) {}
                        }
                      }}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        backgroundColor: isCur ? '#00ffaa' : 'rgba(255,255,255,0.06)',
                        borderWidth: 1,
                        borderColor: isCur ? '#00ffaa' : 'rgba(255,255,255,0.12)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{
                        color: isCur ? '#040711' : '#ffffff',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}>
                        {vItem.ayah}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Close */}
            <TouchableOpacity
              onPress={() => setJumperModalVisible(false)}
              style={{
                marginTop: 14,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                borderWidth: 1,
                borderColor: '#38bdf8',
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 13 }}>
                إغلاق ✕
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  splashContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashTitle: { fontSize: 42, fontWeight: 'bold' },
  splashSub: { fontSize: 18, fontWeight: '600', letterSpacing: 3 },
  splashTag: { fontSize: 14, marginTop: 4 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  settingsBtn: { padding: 8 },
  backBtnContainer: { padding: 4 },
  backBtn: { fontSize: 22, fontWeight: '600' },
  playBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  downloadBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 8 },

  // Continue Reading Card - Illuminated Style
  continueCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#daa520',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  surahItem: { flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 12, marginVertical: 5, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  surahNum: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  surahName: { fontSize: 16, fontWeight: '600' },
  surahArabic: { fontSize: 22 },

  bismillahHeader: { padding: 16, marginHorizontal: 12, borderRadius: 12, marginBottom: 8 },
  bismillahText: { fontSize: 26, textAlign: 'center', lineHeight: 40 },

  verseCard: { marginVertical: 8, padding: 16, borderRadius: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  verseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  verseBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  miniPlayBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  wordContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginHorizontal: -4,
  },
  wordColumn: {
    alignItems: 'center',
    marginHorizontal: 8,   // Increased for better spacing
    marginVertical: 12,    // More vertical space
    minWidth: 50,          // Wider columns for letters
    paddingHorizontal: 4,
    overflow: 'hidden',    // Clip the sweep progress bar
  },
  wordArabic: {
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: 10,      // More space before transliteration
    lineHeight: 52,        // Increased for larger fonts
  },
  wordTranslit: {
    fontSize: 13,          // Will be overridden by settings.translitFontSize
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.4,
    writingDirection: 'rtl',
    marginTop: 2,          // Extra separation from Arabic
  },

  translation: { fontSize: 15, lineHeight: 24, marginTop: 8 },

  ihyaBar: { marginTop: 14, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },

  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 24, marginBottom: 14, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, marginRight: 10, marginBottom: 10 },
  sizeBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 25 },
  sizePreview: { width: 80, height: 60, justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, borderRadius: 12 },
  listItem: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', borderRadius: 12, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  detailVerseBox: { padding: 20, borderRadius: 14, marginBottom: 24 },
  verseRefBadge: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  arabicBlock: { textAlign: 'right', lineHeight: 50, marginBottom: 16 },
  translationBlock: { fontSize: 16, lineHeight: 26 },

  tafsirCard: { padding: 22, borderRadius: 16, marginBottom: 20, elevation: 4, shadowColor: '#daa520', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
  bookBadge: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  tafsirArabic: { textAlign: 'center', fontSize: 24, marginBottom: 10, lineHeight: 40 },
  tafsirEnglish: { fontSize: 16, lineHeight: 28 },
});
