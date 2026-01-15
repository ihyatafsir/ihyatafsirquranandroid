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
import ihyaTafsirData from './assets/ihya_tafsir.json';
import lisanIndexData from './assets/lisan_index.json';
import ibnKathirData from './assets/ibn_kathir_en.json';
import jalalaynData from './assets/jalalayn_en.json';
import haleemData from './assets/haleem_en.json';
import albanianData from './assets/albanian_sq.json';
import ridaGermanData from './assets/rida_german.json';
import timingAlafasy from './assets/timing_alafasy.json';
import timingAbdulBasit from './assets/timing_abdulbasit.json';
import timingHusary from './assets/timing_husary.json';
import timingMinshawi from './assets/timing_minshawi.json';

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

// Helper to apply Tajweed colors to Arabic text
const renderTajweedText = (text: string, baseStyle: any, enabled = false) => {
  if (!enabled || !text) return <Text style={baseStyle}>{text}</Text>;

  const chars = [...text];
  const result: React.ReactNode[] = [];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1] || '';
    const nextNextChar = chars[i + 2] || '';
    let color: string | null = null;

    // Skip diacritics - they'll be colored with their base letter
    if (char === SUKUN || char === SHADDA || /[\u064B-\u0652\u0670]/.test(char)) {
      result.push(char);
      continue;
    }

    // 1. GHUNNA: نّ or مّ (noon/meem with shadda)
    if ((char === 'ن' || char === 'م') && nextChar === SHADDA) {
      color = TAJWEED_COLORS.ghunna;
      result.push(<Text key={i} style={{ color, fontWeight: '600' }}>{char}{nextChar}</Text>);
      i++; // Skip the shadda
      continue;
    }

    // 2. NOON SAKINAH RULES: نْ followed by specific letters
    if (char === 'ن' && nextChar === SUKUN) {
      // Find the next base letter (skip diacritics)
      let nextLetterIdx = i + 2;
      while (nextLetterIdx < chars.length && /[\u064B-\u0652\u0670\u0651]/.test(chars[nextLetterIdx])) {
        nextLetterIdx++;
      }
      const nextLetter = chars[nextLetterIdx] || '';

      // IQLAB: نْ + ب → pronounced as م with nasal
      if (nextLetter === 'ب') {
        color = TAJWEED_COLORS.iqlab;
      }
      // IDGHAM with Ghunna: نْ + و م ن ي
      else if (IDGHAM_LETTERS.includes(nextLetter)) {
        color = TAJWEED_COLORS.idgham;
      }
      // IDGHAM without Ghunna: نْ + ل ر
      else if (IDGHAM_WG_LETTERS.includes(nextLetter)) {
        color = TAJWEED_COLORS.idghamWG;
      }
      // IKHFA: نْ + 15 letters
      else if (IKHFA_LETTERS.includes(nextLetter)) {
        color = TAJWEED_COLORS.ikhfa;
      }

      if (color) {
        result.push(<Text key={i} style={{ color, fontWeight: '600' }}>{char}{nextChar}</Text>);
        i++; // Skip the sukun
        continue;
      }
    }

    // 3. MEEM SAKINAH + BA (Ikhfa Shafawi): مْ + ب
    if (char === 'م' && nextChar === SUKUN) {
      let nextLetterIdx = i + 2;
      while (nextLetterIdx < chars.length && /[\u064B-\u0652\u0670\u0651]/.test(chars[nextLetterIdx])) {
        nextLetterIdx++;
      }
      if (chars[nextLetterIdx] === 'ب') {
        color = TAJWEED_COLORS.ikhfa;
        result.push(<Text key={i} style={{ color, fontWeight: '600' }}>{char}{nextChar}</Text>);
        i++; // Skip the sukun
        continue;
      }
    }

    // 4. QALQALA: ق ط ب ج د with sukun or at word/verse end
    if (QALQALA_LETTERS.includes(char)) {
      // Check if followed by sukun
      if (nextChar === SUKUN) {
        color = TAJWEED_COLORS.qalqala;
        result.push(<Text key={i} style={{ color, fontWeight: '600' }}>{char}{nextChar}</Text>);
        i++; // Skip the sukun
        continue;
      }
      // Check if at end of word (followed by space or nothing, or another word)
      else if (!nextChar || nextChar === ' ' || nextChar === '۝') {
        color = TAJWEED_COLORS.qalqala;
      }
    }

    // 5. MADD: elongation marks
    if (char === 'ٓ' || char === 'ٰ' || char === 'آ' || char === 'ـٓ') {
      color = TAJWEED_COLORS.madd;
    }

    // Output the character with or without color
    if (color) {
      result.push(<Text key={i} style={{ color, fontWeight: '600' }}>{char}</Text>);
    } else {
      result.push(char);
    }
  }

  return <Text style={baseStyle}>{result}</Text>;
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

// Ornate frame for Surah headers - Mamluk illumination style
const OrnateFrame = ({ children, theme }) => (
  <View style={{
    borderWidth: 3,
    borderColor: MANUSCRIPT_COLORS.royalGold,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(218, 165, 32, 0.08)',
    shadowColor: MANUSCRIPT_COLORS.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  }}>
    {/* Inner border - double frame effect */}
    <View style={{
      position: 'absolute',
      top: 4, left: 4, right: 4, bottom: 4,
      borderWidth: 1,
      borderColor: MANUSCRIPT_COLORS.deepGold,
      borderRadius: 12,
      opacity: 0.6,
    }} />
    {/* Corner decorations - elaborate Islamic patterns */}
    <View style={{ position: 'absolute', top: -10, left: -10 }}>
      <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 22 }}>✾</Text>
    </View>
    <View style={{ position: 'absolute', top: -10, right: -10 }}>
      <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 22 }}>✾</Text>
    </View>
    <View style={{ position: 'absolute', bottom: -10, left: -10 }}>
      <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 22 }}>✾</Text>
    </View>
    <View style={{ position: 'absolute', bottom: -10, right: -10 }}>
      <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 22 }}>✾</Text>
    </View>
    {/* Side decorations */}
    <View style={{ position: 'absolute', top: '45%', left: -6 }}>
      <Text style={{ color: MANUSCRIPT_COLORS.deepGold, fontSize: 14 }}>◈</Text>
    </View>
    <View style={{ position: 'absolute', top: '45%', right: -6 }}>
      <Text style={{ color: MANUSCRIPT_COLORS.deepGold, fontSize: 14 }}>◈</Text>
    </View>
    {children}
  </View>
);

// Decorative geometric border - Carpet page style
const GeometricBorder = ({ theme }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 6 }}>
    <Text style={{ color: MANUSCRIPT_COLORS.gold, fontSize: 11 }}>
      ◆ ❖ ◆ ❖ ◆ ❖ ◆ ❖ ◆
    </Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// THEMES & CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const THEMES = {
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
  { id: 'minshawi', name: 'Minshawi Murattal', url: 'https://cdn.islamic.network/quran/audio/128/ar.minshawi/' },
  { id: 'abdulbasit', name: 'Abdul Basit', url: 'https://cdn.islamic.network/quran/audio/128/ar.abdulbasit/' },
  { id: 'alafasy', name: 'Mishary Alafasy', url: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' },
  { id: 'husary', name: 'Al-Husary', url: 'https://cdn.islamic.network/quran/audio/128/ar.husary/' },
  { id: 'mah', name: 'M. Ahmad Hassan ⭐', url: 'local', letterSync: true, matrixGlow: true },
];

const DEFAULT_SETTINGS = {
  theme: 'emerald',
  fontSize: 26,
  arabicFont: 'amiri',
  showTranslation: true,
  showTransliteration: true,
  reciter: 'minshawi',
  tajweed: true,
  allahHighlight: true,
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

  // Expanded tafsir state - tracks which verse:tafsir combinations are expanded
  const [expandedIbnKathir, setExpandedIbnKathir] = useState<{ [key: string]: boolean }>({});
  const [expandedJalalayn, setExpandedJalalayn] = useState<{ [key: string]: boolean }>({});

  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState({ isPlaying: false, currentVerse: null });
  const [playbackQueue, setPlaybackQueue] = useState([]);
  const [playingWordIndex, setPlayingWordIndex] = useState(-1); // Word-level highlighting
  const flatListRef = useRef(null);
  const wordTimerRef = useRef<any>(null);

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
      return true; // Handled
    }
    return false; // Let system handle (exit app only at home)
  }, [navigationStack]);

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
        if (screen === 'home') {
          return false; // Allow exit only from home
        }
        return goBack();
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [screen, goBack]);

  // Load Settings & Last Read on Startup
  useEffect(() => {
    const loadAppState = async () => {
      try {
        // Load last read position
        const savedLastRead = await AsyncStorage.getItem('lastRead');
        if (savedLastRead) {
          setLastRead(JSON.parse(savedLastRead));
        }

        // Load settings
        const savedSettings = await AsyncStorage.getItem('settings');
        if (savedSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
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
        setScreen('home');
        setNavigationStack(['home']);
      }, 2000);
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
    playQueue(queue, 0);
  };

  const playQueue = async (queue, index) => {
    if (index >= queue.length) {
      setPlaybackStatus({ isPlaying: false, currentVerse: null });
      return;
    }

    const item = queue[index];
    const reciter = RECITERS.find(r => r.id === settings.reciter);

    let globalId = 0;
    for (let i = 1; i < item.surah; i++) {
      globalId += surahsData.find(s => s.number === i).verses;
    }
    globalId += item.ayah;

    // MAH uses custom hosted audio files (full surah, not per-verse)
    let url: string;
    if (reciter.id === 'mah') {
      // MAH audio files are hosted on local server (full surah recordings)
      const mahAudioMap = {
        36: 'http://10.20.1.145:8899/mah_audio/yasin_36.mp3',
        47: 'http://10.20.1.145:8899/mah_audio/muhammad_47.mp3',
        75: 'http://10.20.1.145:8899/mah_audio/qiyamah_75.mp3',
      };
      url = mahAudioMap[item.surah] || `${RECITERS[0].url}${globalId}.mp3`; // fallback to Minshawi if no MAH audio
    } else {
      url = `${reciter.url}${globalId}.mp3`;
    }

    try {
      if (sound) await sound.unloadAsync();

      // Clear any existing word timer
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
        wordTimerRef.current = null;
      }
      setPlayingWordIndex(0);

      // Get word count for this verse to estimate timing
      const surahVerses = versesData[item.surah.toString()] || [];
      const verseData = surahVerses.find(v => v.ayah === item.ayah);
      const wordCount = verseData?.words?.length || 5;
      // Slower timing: base 6s + 600ms per word (Abdul Basit recitation is slow)
      const estimatedDuration = 6000 + (wordCount * 600);
      const wordInterval = Math.floor(estimatedDuration / wordCount);

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      setSound(newSound);
      setPlaybackStatus({ isPlaying: true, currentVerse: `${item.surah}:${item.ayah}` });

      // Get word timing data for this verse (based on selected reciter)
      const verseKey = `${item.surah}:${item.ayah}`;
      const timingMap =
        settings.reciter === 'alafasy' ? timingAlafasy :
          settings.reciter === 'abdulbasit' ? timingAbdulBasit :
            settings.reciter === 'husary' ? timingHusary :
              settings.reciter === 'minshawi' ? timingMinshawi :
                timingAlafasy; // fallback
      const verseTiming = timingMap[verseKey] || [];

      // Scroll to current verse
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: item.ayah - 1, animated: true, viewPosition: 0.3 });
      }

      // Real-time position tracking with word timing lookup
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.isPlaying) {
          const posMs = status.positionMillis || 0;

          // Find current word from timing data
          let currentWordIdx = -1;
          for (let i = 0; i < verseTiming.length; i++) {
            const [wordIdx, startMs, endMs] = verseTiming[i];
            if (posMs >= startMs && posMs < endMs) {
              currentWordIdx = wordIdx - 1; // Convert 1-indexed to 0-indexed
              break;
            }
          }
          if (currentWordIdx !== -1) {
            setPlayingWordIndex(currentWordIdx);
          }
        }

        if (status.didJustFinish) {
          setPlayingWordIndex(-1);
          playQueue(queue, index + 1);
        }
      });
    } catch (e) {
      console.log("Audio Error", e);
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
        wordTimerRef.current = null;
      }
      setPlayingWordIndex(-1);
      playQueue(queue, index + 1); // Skip to next on error
    }
  };

  const stopAudio = async () => {
    if (sound) await sound.stopAsync();
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

      // Download each verse audio file
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
            } catch (e) {
              reject(e);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        setDownloadProgress(prev => ({ ...prev, [surahNum]: Math.round((ayah / verseCount) * 100) }));
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
        data={surahsData}
        keyExtractor={item => item.number.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.surahItem, { backgroundColor: theme.card }]}
            onPress={() => {
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
    const surah = surahsData.find(s => s.number === selectedSurah);
    const verses = versesData[selectedSurah.toString()];

    return (
      <LinearGradient colors={theme.bg} style={styles.container}>
        <StatusBar style="light" />
        {/* Header with Download Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtnContainer}>
            <Text style={[styles.backBtn, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{surah.name}</Text>
            <Text style={{ color: theme.primary, fontSize: 18 }}>{surah.arabic}</Text>
          </View>

          {/* Download Button */}
          {!downloadedSurahs[selectedSurah] && !isDownloading[selectedSurah] && (
            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: theme.card }]}
              onPress={() => downloadSurahAudio(selectedSurah)}
            >
              <Text style={{ color: theme.primary, fontSize: 14 }}>⬇️</Text>
            </TouchableOpacity>
          )}
          {isDownloading[selectedSurah] && (
            <View style={[styles.downloadBtn, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.primary, fontSize: 10 }}>{downloadProgress[selectedSurah]}%</Text>
            </View>
          )}
          {downloadedSurahs[selectedSurah] && !isDownloading[selectedSurah] && (
            <View style={[styles.downloadBtn, { backgroundColor: theme.cardHighlight }]}>
              <Text style={{ color: theme.primary, fontSize: 12 }}>✓</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: playbackStatus.isPlaying ? theme.primary : theme.card }]}
            onPress={() => playbackStatus.isPlaying ? stopAudio() : playSurah(selectedSurah)}
          >
            <Text style={{ color: playbackStatus.isPlaying ? theme.bg[0] : theme.text }}>
              {playbackStatus.isPlaying ? '⏹' : '▶'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bismillah Header (for all surahs except 9) */}
        {selectedSurah !== 9 && (
          <OrnateFrame theme={theme}>
            <View style={{ alignItems: 'center' }}>
              {renderArabicWithAllah('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', [styles.bismillahText, { color: theme.arabic }], settings.allahHighlight)}
              <GeometricBorder theme={theme} />
            </View>
          </OrnateFrame>
        )}

        {/* Verses List */}
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
                    <TouchableOpacity
                      style={[styles.miniPlayBtn, { backgroundColor: theme.bg[0] }]}
                      onPress={() => playQueue([{ surah: selectedSurah, ayah: item.ayah }], 0)}
                    >
                      <Text style={{ color: theme.primary, fontSize: 12 }}>▶</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Word by Word Flow - Letter-by-letter aligned */}
                  <View style={[styles.wordContainer, { backgroundColor: theme.wbwBg }]}>
                    {item.words && item.words.map((word, idx) => {
                      const isCurrentVerse = playbackStatus.currentVerse === `${selectedSurah}:${item.ayah}`;
                      const isCurrentWord = isCurrentVerse && idx === playingWordIndex;

                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          onLongPress={() => word.root && showLisanModal(word.arabic, word.root)}
                          style={[
                            styles.wordColumn,
                            {
                              // Always have border to prevent layout shift when highlighted
                              borderRadius: 6,
                              borderWidth: 1,
                              // Matrix green hologram for MAH, gold for others
                              borderColor: isCurrentWord
                                ? (settings.reciter === 'mah' ? '#00ff88' : '#ffd700')
                                : 'transparent',
                              backgroundColor: isCurrentWord
                                ? (settings.reciter === 'mah' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 215, 0, 0.25)')
                                : 'transparent',
                            }
                          ]}
                        >
                          {/* Arabic word with Tajweed coloring - always enabled for consistency */}
                          {renderTajweedText(
                            word.arabic,
                            [
                              styles.wordArabic,
                              {
                                color: isCurrentWord
                                  ? (settings.reciter === 'mah' ? '#00ff88' : '#ffd700')
                                  : theme.arabic,
                                fontSize: settings.fontSize,
                                // Matrix hologram glow effect for MAH
                                ...(isCurrentWord && settings.reciter === 'mah' ? {
                                  textShadowColor: '#00ff88',
                                  textShadowOffset: { width: 0, height: 0 },
                                  textShadowRadius: 12,
                                } : {})
                              }
                            ],
                            settings.tajweed  // Always render same way - no conditional on isCurrentWord
                          )}
                          {/* RTL Transliteration from DB (Latin + harakat) */}
                          {settings.showTransliteration && word.translit && (
                            <Text style={[
                              styles.wordTranslit,
                              {
                                color: theme.primary,
                                writingDirection: 'rtl',
                                textAlign: 'center',
                                fontSize: 11,
                                letterSpacing: 0.5,
                              },
                              isCurrentWord && { color: '#ffd700', fontWeight: 'bold' }
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
        />
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
              <View key={i} style={[styles.tafsirCard, { backgroundColor: theme.card }]}>
                <View style={[styles.bookBadge, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: theme.bg[0], fontWeight: 'bold', fontSize: 11 }}>
                    📚 {t.book_title || "Ihya 'Ulum al-Din"}
                  </Text>
                </View>
                {t.arabic && (
                  <Text style={[styles.tafsirArabic, { color: theme.arabic }]}>{t.arabic}</Text>
                )}
                <Text style={[styles.tafsirEnglish, { color: theme.text }]}>{t.english}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.subText, textAlign: 'center', marginTop: 20 }}>
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
    paddingVertical: 12,
    paddingHorizontal: 4,  // Reduced from 8 to allow more space for words
    borderRadius: 10,
    marginHorizontal: -8,  // Extend to full width
  },
  wordColumn: {
    alignItems: 'center',
    marginHorizontal: 4,   // Reduced from 8
    marginVertical: 8,     // Reduced from 10
    minWidth: 40,          // Reduced from 50 to fit more words
    paddingHorizontal: 2,  // Small padding
  },
  wordArabic: {
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 38,
  },
  wordTranslit: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
    writingDirection: 'rtl',
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

  tafsirCard: { padding: 18, borderRadius: 14, marginBottom: 16, elevation: 2 },
  bookBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginBottom: 14 },
  tafsirArabic: { textAlign: 'right', fontSize: 18, marginBottom: 14, lineHeight: 32 },
  tafsirEnglish: { fontSize: 15, lineHeight: 24 },
});
