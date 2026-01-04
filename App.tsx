import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Modal,
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
// THEMES & CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const THEMES = {
  emerald: {
    name: 'Ghazali Emerald',
    bg: ['#011f17', '#022c22'],
    card: '#054535',
    primary: '#f59e0b', // Gold
    text: '#ffffff',
    subText: '#9ca3af',
    arabic: '#fef3c7',
  },
  midnight: {
    name: 'Midnight Gold',
    bg: ['#0f172a', '#1e293b'],
    card: '#334155',
    primary: '#fbbf24',
    text: '#e2e8f0',
    subText: '#94a3b8',
    arabic: '#ffffff',
  },
  blue: {
    name: 'Royal Blue',
    bg: ['#172554', '#1e3a8a'],
    card: '#1e40af',
    primary: '#60a5fa',
    text: '#eff6ff',
    subText: '#bfdbfe',
    arabic: '#ffffff',
  },
  light: {
    name: 'Classic Paper',
    bg: ['#fdf6e3', '#eee8d5'],
    card: '#ffffff',
    primary: '#b58900',
    text: '#586e75',
    subText: '#93a1a1',
    arabic: '#000000',
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
  fontSize: 24,
  arabicFont: 'amiri',
  showTranslation: true,
  showTransliteration: true,
  reciter: 'minshawi',
  tajweed: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('splash');
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(null); // For detail/tafsir view
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState({ isPlaying: false, currentVerse: null });
  const [playbackQueue, setPlaybackQueue] = useState([]); // List of {surah, ayah} keys

  // Theme
  const theme = THEMES[settings.theme] || THEMES.emerald;

  // Load Settings
  useEffect(() => {
    // Simulate loading or load from AsyncStorage
    setTimeout(() => {
      setLoading(false);
      setScreen('home');
    }, 2000);
  }, []);

  // Audio Playback Logic
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const playSurah = async (surahNum) => {
    // Generate queue for whole surah
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

    // Calculate global verse ID (approximate for API)
    // Actually islamic.network uses 1-based index 1..6236
    let globalId = 0;
    for (let i = 1; i < item.surah; i++) {
      globalId += surahsData.find(s => s.number === i).verses;
    }
    globalId += item.ayah;

    const url = `${reciter.url}${globalId}.mp3`;

    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      setSound(newSound);
      setPlaybackStatus({ isPlaying: true, currentVerse: `${item.surah}:${item.ayah}` });

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          playQueue(queue, index + 1);
        }
      });
    } catch (e) {
      console.log("Audio Error", e);
      Alert.alert("Error", "Could not play audio. Check internet.");
    }
  };

  const stopAudio = async () => {
    if (sound) await sound.stopAsync();
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
        <Text style={[styles.splashTitle, { color: theme.primary }]}>IHYA QURAN</Text>
        <Text style={[styles.splashSub, { color: theme.text }]}>Perfection Edition</Text>
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
      </View>
    </LinearGradient>
  );

  const renderHome = () => (
    <LinearGradient colors={theme.bg} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Ihya Quran</Text>
        <TouchableOpacity onPress={() => setScreen('settings')}>
          <Text style={{ fontSize: 24 }}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={surahsData}
        keyExtractor={item => item.number.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.surahItem, { backgroundColor: theme.card }]}
            onPress={() => {
              setSelectedSurah(item.number);
              setScreen('surah');
            }}
          >
            <View style={[styles.surahNum, { backgroundColor: theme.bg[0] }]}>
              <Text style={{ color: theme.primary }}>{item.number}</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={[styles.surahName, { color: theme.text }]}>{item.name}</Text>
              <Text style={{ color: theme.subText }}>{item.type} • {item.verses} Verses</Text>
            </View>
            <Text style={[styles.surahArabic, { color: theme.primary }]}>{item.arabic}</Text>
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );

  const renderSurah = () => {
    const surah = surahsData.find(s => s.number === selectedSurah);
    const verses = versesData[selectedSurah.toString()]; // Now v4 structure

    return (
      <LinearGradient colors={theme.bg} style={styles.container}>
        <StatusBar style="light" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { stopAudio(); setScreen('home'); }}>
            <Text style={[styles.backBtn, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{surah.name}</Text>
            <Text style={{ color: theme.subText }}>{surah.arabic}</Text>
          </View>
          <TouchableOpacity onPress={() => playbackStatus.isPlaying ? stopAudio() : playSurah(selectedSurah)}>
            <Text style={{ fontSize: 24 }}>{playbackStatus.isPlaying ? '⏹' : '▶'}</Text>
          </TouchableOpacity>
        </View>

        {/* Verses List */}
        <FlatList
          data={verses}
          keyExtractor={item => `${selectedSurah}:${item.ayah}`}
          contentContainerStyle={{ padding: 10 }}
          renderItem={({ item }) => {
            const isPlaying = playbackStatus.currentVerse === `${selectedSurah}:${item.ayah}`;
            return (
              <View style={[styles.verseCard, { backgroundColor: theme.card, borderColor: isPlaying ? theme.primary : 'transparent', borderWidth: isPlaying ? 1 : 0 }]}>
                {/* Actions Row (Top) */}
                <View style={styles.verseActions}>
                  <View style={[styles.verseBadge, { backgroundColor: theme.primary }]}>
                    <Text style={{ color: theme.bg[0], fontWeight: 'bold' }}>{item.ayah}</Text>
                  </View>
                  <TouchableOpacity onPress={() => playQueue([{ surah: selectedSurah, ayah: item.ayah }], 0)}>
                    <Text>▶</Text>
                  </TouchableOpacity>
                </View>

                {/* Word by Word Flow - RTL */}
                <View style={styles.wordContainer}>
                  {item.words && item.words.map((word, idx) => (
                    <View key={idx} style={styles.wordColumn}>
                      <Text style={[styles.wordArabic, { color: theme.arabic, fontSize: settings.fontSize, fontFamily: settings.arabicFont === 'amiri' ? 'System' : 'System' }]}>
                        {word.arabic}
                      </Text>
                      {settings.showTransliteration && (
                        <Text style={[styles.wordTranslit, { color: theme.primary }]}>
                          {word.translit}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* Translation */}
                {settings.showTranslation && (
                  <Text style={[styles.translation, { color: theme.subText }]}>{item.translation}</Text>
                )}

                {/* Ihya Tafsir - New Style (Below) */}
                {item.hasIhya && (
                  <TouchableOpacity
                    style={[styles.ihyaBar, { backgroundColor: theme.bg[0] }]}
                    onPress={() => { setSelectedVerse({ surah: selectedSurah, ...item }); setScreen('detail'); }}
                  >
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>✦ Read Al-Ghazali's Commentary</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      </LinearGradient>
    );
  };

  const renderDetail = () => {
    if (!selectedVerse) return null;
    const tafsirEntry = ihyaTafsirData[`${selectedVerse.surah}:${selectedVerse.ayah}`];
    // Use first entry to show book title in header if needed, but we list all below

    return (
      <LinearGradient colors={theme.bg} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('surah')}>
            <Text style={[styles.backBtn, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Ihya Tafsir</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ padding: 16 }}>
          {/* Verse Block */}
          <View style={[styles.detailVerseBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.arabicBlock, { color: theme.arabic, fontSize: settings.fontSize * 1.2 }]}>
              {selectedVerse.text}
            </Text>
            <Text style={[styles.translationBlock, { color: theme.subText }]}>
              {selectedVerse.translation}
            </Text>
          </View>

          {/* Tafsir Entries */}
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>COMMENTARY BY AL-GHAZALI</Text>

          {tafsirEntry ? (
            tafsirEntry.map((t, i) => (
              <View key={i} style={[styles.tafsirCard, { backgroundColor: theme.card }]}>
                <View style={styles.bookBadge}>
                  <Text style={{ color: theme.bg[0], fontWeight: 'bold', fontSize: 12 }}>BOOK: {t.book_title || "Ihya 'Ulum al-Din"}</Text>
                </View>
                <Text style={[styles.tafsirArabic, { color: theme.arabic }]}>{t.arabic}</Text>
                <Text style={[styles.tafsirEnglish, { color: theme.text }]}>{t.english}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.subText, textAlign: 'center', marginTop: 20 }}>No Ihya Tafsir available for this verse.</Text>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    );
  };

  const renderSettings = () => (
    <LinearGradient colors={theme.bg} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')}>
          <Text style={[styles.backBtn, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Theme */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>THEME</Text>
        <View style={styles.rowWrap}>
          {Object.keys(THEMES).map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.chip, { backgroundColor: settings.theme === k ? theme.primary : theme.card }]}
              onPress={() => setSettings({ ...settings, theme: k })}
            >
              <Text style={{ color: settings.theme === k ? theme.bg[0] : theme.text }}>{THEMES[k].name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Font Size */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>FONT SIZE ({settings.fontSize}px)</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setSettings({ ...settings, fontSize: settings.fontSize - 2 })} style={[styles.btn, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text }}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSettings({ ...settings, fontSize: settings.fontSize + 2 })} style={[styles.btn, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Reciter */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>RECITER</Text>
        {RECITERS.map(r => (
          <TouchableOpacity
            key={r.id}
            style={[styles.listItem, { borderColor: settings.reciter === r.id ? theme.primary : 'transparent', borderWidth: 1 }]}
            onPress={() => setSettings({ ...settings, reciter: r.id })}
          >
            <Text style={{ color: theme.text }}>{r.name}</Text>
            {settings.reciter === r.id && <Text style={{ color: theme.primary }}>✓</Text>}
          </TouchableOpacity>
        ))}

        {/* Toggles */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>DISPLAY</Text>
        <View style={styles.toggleRow}>
          <Text style={{ color: theme.text }}>Show Translation</Text>
          <Switch
            value={settings.showTranslation}
            onValueChange={v => setSettings({ ...settings, showTranslation: v })}
            trackColor={{ true: theme.primary }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={{ color: theme.text }}>Show Transliteration</Text>
          <Switch
            value={settings.showTransliteration}
            onValueChange={v => setSettings({ ...settings, showTransliteration: v })}
            trackColor={{ true: theme.primary }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={{ color: theme.text }}>Tajweed Coloring (Alpha)</Text>
          <Switch
            value={settings.tajweed}
            onValueChange={v => setSettings({ ...settings, tajweed: v })}
            trackColor={{ true: theme.primary }}
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
  splashTitle: { fontSize: 32, fontWeight: 'bold', letterSpacing: 2 },
  splashSub: { fontSize: 16, marginTop: 10 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  surahItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16, marginVertical: 6, borderRadius: 12 },
  surahNum: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  surahName: { fontSize: 18, fontWeight: '600' },
  surahArabic: { fontSize: 24 },
  backBtn: { fontSize: 24 },
  verseCard: { marginHorizontal: 12, marginVertical: 8, padding: 16, borderRadius: 12 },
  verseActions: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  verseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12 },

  // Word by Word RTL
  wordContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 12 },
  wordColumn: { alignItems: 'center', margin: 4, minWidth: 40 },
  wordArabic: { textAlign: 'center', marginBottom: 4 },
  wordTranslit: { fontSize: 11, textAlign: 'center' },

  translation: { fontSize: 15, lineHeight: 22 },

  // Ihya Bar
  ihyaBar: { marginTop: 16, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f59e0b' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  btn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 25, marginRight: 16 },
  listItem: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', borderRadius: 8, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },

  detailVerseBox: { padding: 16, borderRadius: 12, marginBottom: 20 },
  arabicBlock: { textAlign: 'right', lineHeight: 50, marginBottom: 20 },
  translationBlock: { fontSize: 16, lineHeight: 24 },

  tafsirCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
  bookBadge: { alignSelf: 'flex-start', backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 12 },
  tafsirArabic: { textAlign: 'right', fontSize: 18, marginBottom: 12, lineHeight: 30 },
  tafsirEnglish: { fontSize: 15, lineHeight: 22 },
});
