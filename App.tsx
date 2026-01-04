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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// DATA IMPORT
// ═══════════════════════════════════════════════════════════════════════════
import surahsData from './assets/surahs.json';
import versesData from './assets/verses_v4.json';
import ihyaTafsirData from './assets/ihya_tafsir.json';

// ═══════════════════════════════════════════════════════════════════════════
// TAJWEED COLORS & RULES (from AlQuran APK)
// ═══════════════════════════════════════════════════════════════════════════
const TAJWEED_COLORS = {
  ghunna: '#d16a00',      // Orange - Ghunna (nasalization)
  idgham: '#b955c8',      // Purple - Idgham (merging)
  idghamWo: '#aaaaaa',    // Gray - Idgham without ghunna
  ikhfa: '#b60000',       // Red - Ikhfa (hiding)
  iqlab: '#3164c5',       // Blue - Iqlab (conversion)
  qalqala: '#2f9900',     // Green - Qalqala (echoing)
  madd: '#ff6600',        // Madd (elongation)
};

// Qalqala letters: ق ط ب ج د
const QALQALA_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];
// Noon/Meem Sakinah indicators  
const NOON_SAKINAH = 'نْ';
const MEEM_SAKINAH = 'مْ';

// Helper to apply Tajweed colors to Arabic text
const renderTajweedText = (text, baseStyle, enabled = false) => {
  if (!enabled || !text) return <Text style={baseStyle}>{text}</Text>;

  const chars = [...text];
  return (
    <Text style={baseStyle}>
      {chars.map((char, i) => {
        let color = null;
        // Check for Qalqala letters
        if (QALQALA_LETTERS.includes(char)) {
          color = TAJWEED_COLORS.qalqala;
        }
        // Check for Noon with sukoon (rough approximation)
        else if (char === 'ن' && chars[i + 1] === 'ْ') {
          color = TAJWEED_COLORS.ghunna;
        }
        // Check for Meem with sukoon
        else if (char === 'م' && chars[i + 1] === 'ْ') {
          color = TAJWEED_COLORS.ghunna;
        }
        // Check for Madd (elongation mark)
        else if (char === 'ٓ' || char === 'ٰ' || char === 'آ') {
          color = TAJWEED_COLORS.madd;
        }

        return color ? (
          <Text key={i} style={{ color, fontWeight: '600' }}>{char}</Text>
        ) : char;
      })}
    </Text>
  );
};

// Helper to clean transliteration (data is RTL-reversed with Arabic diacritics embedded)
const cleanTranslit = (translit: string): string => {
  if (!translit) return '';
  // Remove Arabic diacritics (harakat)
  const cleaned = translit.replace(/[\u064B-\u0652\u0670\u0640\u0671]/g, '');
  // Reverse the string (data is stored RTL)
  return [...cleaned].reverse().join('');
};

// Helper to render Arabic and Transliteration letter-by-letter aligned
const renderLetterByLetter = (arabic, translit, arabicStyle, translitStyle, isCurrentWord = false) => {
  // Clean and reverse the transliteration first
  const cleanedTranslit = cleanTranslit(translit);

  // Arabic diacritics pattern (harakat that attach to letters)
  const arabicDiacritics = /[\u064B-\u0652\u0670\u0640\u0671]/;

  // Group Arabic chars: base letter + following diacritics
  const arabicChars = [...(arabic || '')];
  const arabicGroups: string[] = [];
  let currentGroup = '';

  for (const char of arabicChars) {
    if (arabicDiacritics.test(char) && currentGroup) {
      currentGroup += char; // Add diacritic to current group
    } else {
      if (currentGroup) arabicGroups.push(currentGroup);
      currentGroup = char;
    }
  }
  if (currentGroup) arabicGroups.push(currentGroup);

  // Group Latin digraphs: th, kh, sh, gh, dh, ṭh, etc. should stay together
  const latinDigraphs = ['th', 'kh', 'sh', 'gh', 'dh', 'zh', 'ḥ', 'ṣ', 'ṭ', 'ḍ', 'ẓ', 'ā', 'ū', 'ī', 'ʿ', 'ʾ'];
  const translitGroups: string[] = [];
  let i = 0;
  const translitLower = cleanedTranslit.toLowerCase();

  while (i < cleanedTranslit.length) {
    // Check for digraphs (2-char combinations)
    const twoChar = cleanedTranslit.slice(i, i + 2).toLowerCase();
    if (i + 1 < cleanedTranslit.length && latinDigraphs.includes(twoChar)) {
      translitGroups.push(cleanedTranslit.slice(i, i + 2));
      i += 2;
    } else {
      // Single special char or regular char
      const oneChar = cleanedTranslit[i];
      if (latinDigraphs.includes(oneChar.toLowerCase())) {
        translitGroups.push(oneChar);
      } else {
        translitGroups.push(oneChar);
      }
      i++;
    }
  }

  // Create pairs - align transliteration groups with Arabic groups
  const pairCount = Math.max(arabicGroups.length, translitGroups.length);

  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length: pairCount }).map((_, idx) => (
        <View key={idx} style={{ alignItems: 'center', marginHorizontal: 1, minWidth: 14 }}>
          <Text style={[
            arabicStyle,
            { textAlign: 'center' },
            isCurrentWord && { color: '#ffd700' }
          ]}>
            {arabicGroups[idx] || ''}
          </Text>
          <Text style={[
            translitStyle,
            { textAlign: 'center', fontSize: 9, minWidth: 10 },
            isCurrentWord && { color: '#ffd700', fontWeight: 'bold' }
          ]}>
            {translitGroups[idx] || ''}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MANUSCRIPT-INSPIRED DECORATIVE COMPONENTS (Mamluk/Baybars Style)
// ═══════════════════════════════════════════════════════════════════════════
const MANUSCRIPT_COLORS = {
  gold: '#ffd700',
  deepGold: '#daa520',
  royalGold: '#b8860b',
  indigo: '#1a237e',
  azure: '#0d47a1',
  parchment: '#f5f0e1',
  cream: '#fdfcf8',
  forest: '#2e7d32',
  ruby: '#a31545',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
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
  }
};

const RECITERS = [
  { id: 'minshawi', name: 'Minshawi Murattal', url: 'https://cdn.islamic.network/quran/audio/128/ar.minshawi/' },
  { id: 'abdulbasit', name: 'Abdul Basit', url: 'https://cdn.islamic.network/quran/audio/128/ar.abdulbasit/' },
  { id: 'alafasy', name: 'Mishary Alafasy', url: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' },
  { id: 'husary', name: 'Al-Husary', url: 'https://cdn.islamic.network/quran/audio/128/ar.husary/' },
];

const DEFAULT_SETTINGS = {
  theme: 'emerald',
  fontSize: 26,
  arabicFont: 'amiri',
  showTranslation: true,
  showTransliteration: true,
  reciter: 'minshawi',
  tajweed: false,
  allahHighlight: true,
};

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

  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState({ isPlaying: false, currentVerse: null });
  const [playbackQueue, setPlaybackQueue] = useState([]);
  const [playingWordIndex, setPlayingWordIndex] = useState(-1); // Word-level highlighting
  const flatListRef = useRef(null);
  const wordTimerRef = useRef<any>(null);

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

  // Load Settings
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      setScreen('home');
      setNavigationStack(['home']);
    }, 2000);
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

    const url = `${reciter.url}${globalId}.mp3`;

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

      // Start word cycling timer
      let currentWordIdx = 0;
      wordTimerRef.current = setInterval(() => {
        currentWordIdx++;
        if (currentWordIdx < wordCount) {
          setPlayingWordIndex(currentWordIdx);
        }
      }, wordInterval);

      // Scroll to current verse
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: item.ayah - 1, animated: true, viewPosition: 0.3 });
      }

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          // Clear timer and reset word index before next verse
          if (wordTimerRef.current) {
            clearInterval(wordTimerRef.current);
            wordTimerRef.current = null;
          }
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
  // RENDERERS
  // ═════════════════════════════════════════════════════════════════════════

  const renderSplash = () => (
    <LinearGradient colors={theme.bg} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.splashContent}>
        <Text style={[styles.splashTitle, { color: theme.primary }]}>بِسْمِ ٱللَّهِ</Text>
        <Text style={[styles.splashSub, { color: theme.text, marginTop: 12 }]}>IHYA QURAN</Text>
        <Text style={[styles.splashTag, { color: theme.subText }]}>Perfection Edition</Text>
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
              <Text style={{ color: theme.subText, fontSize: 12 }}>{item.type} • {item.verses} Ayat</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtnContainer}>
            <Text style={[styles.backBtn, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{surah.name}</Text>
            <Text style={{ color: theme.primary, fontSize: 18 }}>{surah.arabic}</Text>
          </View>
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
                        <View
                          key={idx}
                          style={[
                            styles.wordColumn,
                            isCurrentWord && {
                              backgroundColor: 'rgba(255, 215, 0, 0.25)',
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: '#ffd700',
                            }
                          ]}
                        >
                          {/* Letter-by-letter when transliteration enabled, otherwise word-level */}
                          {settings.showTransliteration ? (
                            renderLetterByLetter(
                              word.arabic,
                              word.translit,
                              [styles.wordArabic, { color: theme.arabic, fontSize: settings.fontSize }],
                              [styles.wordTranslit, { color: theme.primary }],
                              isCurrentWord
                            )
                          ) : (
                            settings.tajweed ?
                              renderTajweedText(
                                word.arabic,
                                [styles.wordArabic, { color: theme.arabic, fontSize: settings.fontSize }],
                                true
                              ) :
                              renderArabicWithAllah(
                                word.arabic,
                                [styles.wordArabic, { color: theme.arabic, fontSize: settings.fontSize }],
                                settings.allahHighlight
                              )
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Translation */}
                  {settings.showTranslation && (
                    <Text style={[styles.translation, { color: theme.subText }]}>{item.translation}</Text>
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

        {/* Toggles */}
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
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  wordColumn: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 10,
    minWidth: 50,
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
