import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { QuranDataProvider } from './src/services/quranDataProvider';
import { useQuranAudio, RECITERS } from './src/hooks/useQuranAudio';
import { NativeMushafWebView } from './components/NativeMushafWebView';
import { WordStudyView } from './src/components/WordStudyView';
import { AudioPlayerControls } from './src/components/AudioPlayerControls';
import { SurahPickerModal } from './src/components/SurahPickerModal';
import { SettingsModal } from './src/components/SettingsModal';
import { TafsirModal } from './src/components/TafsirModal';
import { WordLearnHUD } from './src/components/WordLearnHUD';
import { AudioDownloadModal } from './src/components/AudioDownloadModal';
import { TranslationSelectorModal } from './src/components/TranslationSelectorModal';
import {
  playLetterPhoneticAudio,
  playIsolatedWordAudio,
} from './src/utils/audioPhonetics';
import {
  SurahMetadata,
  Verse,
  Word,
  TafsirEntry,
  AppSettings,
  LetterTimingEntry,
  TranslationId,
  TransliterationMode,
} from './src/types/quran';

const ANDROID_STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;

export default function App() {
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [wordTimingMap, setWordTimingMap] = useState<{ [key: string]: any[] }>({});
  const [letterTimingMap, setLetterTimingMap] = useState<{ [key: string]: LetterTimingEntry[] }>({});
  const [viewMode, setViewMode] = useState<'mushaf' | 'study'>('mushaf');

  // App Settings State
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    reciter: 'abdulbasit',
    fontSize: 24,
    translitFontSize: 13,
    showTajweed: true,
    showTransliteration: true,
    transliterationMode: 'specialRTL',
    showTranslation: true,
    activeTranslation: 'haleem',
    autoScroll: true,
    repeatMode: 'none',
    highlightMode: 'word',
  });

  // Modals Visibility State
  const [surahPickerVisible, setSurahPickerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [tafsirVisible, setTafsirVisible] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [translationModalVisible, setTranslationModalVisible] = useState(false);

  // Active Tafsir Data
  const [tafsirVerse, setTafsirVerse] = useState<Verse | null>(null);
  const [tafsirEntries, setTafsirEntries] = useState<TafsirEntry[]>([]);

  // Letter/Word Decomposition HUD State
  const [activeWordHUD, setActiveWordHUD] = useState<{
    surah: number;
    ayah: number;
    wordIdx: number;
    wordText: string;
    translit?: string;
    root?: string;
    translation?: string;
  } | null>(null);

  // All Surahs catalog
  const allSurahs = QuranDataProvider.getAllSurahs();
  const surahMeta = QuranDataProvider.getSurahMetadata(selectedSurah) || allSurahs[0];
  const selectedReciterConfig = RECITERS.find(r => r.id === settings.reciter) || RECITERS[0];

  // Core Audio Hook
  const audio = useQuranAudio(settings.reciter);

  // Calculate Active Word Index during Playback (Supports both array [wIdx, start, end] and object formats)
  const getActiveWordIdx = useCallback((): number => {
    if (!audio.currentVerseKey || !audio.isPlaying) return -1;
    const ayahPart = audio.currentVerseKey.includes(':') ? audio.currentVerseKey.split(':')[1] : audio.currentVerseKey;
    const words = wordTimingMap[audio.currentVerseKey] || wordTimingMap[ayahPart];

    if (words && words.length > 0) {
      for (let i = 0; i < words.length; i++) {
        const entry = words[i];
        let st = 0, en = 0, wIdx = i;
        if (Array.isArray(entry)) {
          wIdx = (typeof entry[0] === 'number' && entry[0] >= 1) ? entry[0] - 1 : i;
          st = entry[1] || 0;
          en = entry[2] || 0;
        } else if (entry && typeof entry === 'object') {
          wIdx = entry.wordIdx !== undefined ? entry.wordIdx :
                 (entry.w !== undefined ? entry.w :
                 (entry.word !== undefined && typeof entry.word === 'number' ? entry.word - 1 : i));
          st = entry.start !== undefined ? entry.start : (entry.s !== undefined ? entry.s : 0);
          en = entry.end !== undefined ? entry.end : (entry.e !== undefined ? entry.e : 0);
        }
        if (st > 0 && st < 100 && en > 0 && en < 300) { st *= 1000; en *= 1000; }
        let effectiveEnd = en;
        const nextEntry = words[i + 1];
        if (nextEntry) {
          let nextSt = en;
          if (Array.isArray(nextEntry)) nextSt = nextEntry[1] || en;
          else if (nextEntry && typeof nextEntry === 'object') {
            nextSt = nextEntry.start !== undefined ? nextEntry.start : (nextEntry.s !== undefined ? nextEntry.s : en);
          }
          if (nextSt > 0 && nextSt < 100) nextSt *= 1000;
          if (nextSt > en) effectiveEnd = nextSt;
        }
        if (audio.currentTimeMs >= st && audio.currentTimeMs < effectiveEnd) {
          return wIdx;
        }
      }
    }

    // Fallback to letter timing map if word timing map is absent
    const letters = letterTimingMap[audio.currentVerseKey] || letterTimingMap[ayahPart];
    if (letters && letters.length > 0) {
      for (let i = 0; i < letters.length; i++) {
        const l = letters[i];
        if (audio.currentTimeMs >= l.start && audio.currentTimeMs <= l.end) {
          return l.wordIdx !== undefined ? l.wordIdx : -1;
        }
      }
    }

    return -1;
  }, [audio.currentVerseKey, audio.isPlaying, audio.currentTimeMs, wordTimingMap, letterTimingMap]);

  const activeWordIdx = getActiveWordIdx();

  // Load Surah Data (Verses, Timing Maps, Preloads)
  useEffect(() => {
    let isMounted = true;

    async function loadSurahData() {
      try {
        const narration = selectedReciterConfig.narration || 'hafs';
        const vList = await QuranDataProvider.getVerses(selectedSurah, narration);
        const wMap = await QuranDataProvider.getWordTiming(settings.reciter, selectedSurah);
        const lMap = await QuranDataProvider.getLetterTiming(settings.reciter, selectedSurah);

        if (isMounted) {
          setVerses(vList);
          setWordTimingMap(wMap);
          setLetterTimingMap(lMap);
        }

        QuranDataProvider.preloadSurah(selectedSurah + 1);
      } catch (err) {
        console.warn(`[App] Failed to load Surah ${selectedSurah}:`, err);
      }
    }

    loadSurahData();

    return () => {
      isMounted = false;
    };
  }, [selectedSurah, settings.reciter]);

  // Handle Surah Selection
  const handleSelectSurah = (surahNumber: number) => {
    audio.stopAudio();
    setSelectedSurah(surahNumber);
    setSurahPickerVisible(false);
  };

  // Playback Navigation Handlers
  const handleSeekAyah = (ayah: number) => {
    audio.playVerse(selectedSurah, ayah, surahMeta);
  };

  const handleNextAyah = () => {
    const currentAyah = audio.currentVerseKey
      ? parseInt(audio.currentVerseKey.split(':')[1], 10)
      : 1;
    const total = surahMeta?.numberOfAyahs || 7;
    if (currentAyah < total) {
      audio.playVerse(selectedSurah, currentAyah + 1, surahMeta);
    }
  };

  const handlePrevAyah = () => {
    const currentAyah = audio.currentVerseKey
      ? parseInt(audio.currentVerseKey.split(':')[1], 10)
      : 1;
    if (currentAyah > 1) {
      audio.playVerse(selectedSurah, currentAyah - 1, surahMeta);
    }
  };

  // Interactive Gesture Handlers: Mushaf Mode
  const handleMushafWordSingleClick = (surah: number, ayah: number) => {
    audio.playVerse(surah, ayah, surahMeta);
  };

  const handleWordDoubleClick = (
    surah: number,
    ayah: number,
    wordIdx: number,
    wordText: string,
    wordObj?: Word
  ) => {
    setActiveWordHUD({
      surah,
      ayah,
      wordIdx,
      wordText,
      translit: wordObj?.translit || wordObj?.transliteration,
      root: wordObj?.root,
      translation: wordObj?.translation,
    });
  };

  // Interactive Gesture Handlers: Word Study Mode
  const handleWordStudyWordSingleClick = (
    surah: number,
    ayah: number,
    wordIdx: number,
    wordText: string
  ) => {
    playIsolatedWordAudio(surah, ayah, wordIdx, wordText);
  };

  // Open Tafsir Modal for Current or Selected Verse
  const handleOpenTafsir = async () => {
    let currentAyah = 1;
    if (audio.currentVerseKey && audio.currentVerseKey.startsWith(`${selectedSurah}:`)) {
      currentAyah = parseInt(audio.currentVerseKey.split(':')[1], 10);
    }
    const currentVerseObj = verses.find(v => v.ayah === currentAyah) || verses[0] || null;
    const entries = await QuranDataProvider.getTafsir(selectedSurah, currentAyah);

    setTafsirVerse(currentVerseObj);
    setTafsirEntries(entries || []);
    setTafsirVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070d1a" />

      {/* TOP LUXURY APP BAR */}
      <View style={styles.safeHeader}>
        <View style={styles.headerBar}>
          {/* Settings Trigger */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.iconCircleText}>⚙</Text>
          </TouchableOpacity>

          {/* Translation Selector Trigger */}
          <TouchableOpacity
            style={styles.translationBadgeBtn}
            onPress={() => setTranslationModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.translationBadgeText}>
              {settings.activeTranslation === 'haleem'
                ? 'Haleem'
                : settings.activeTranslation === 'cleary'
                ? 'Cleary'
                : settings.activeTranslation === 'rida'
                ? 'Rida DE'
                : settings.activeTranslation === 'kathir'
                ? 'Ibn Kathir'
                : settings.activeTranslation === 'jalalayn'
                ? 'Jalalayn'
                : 'Sahih'}
            </Text>
          </TouchableOpacity>

          {/* Center Surah Name / Title Picker */}
          <TouchableOpacity
            style={styles.surahTitleBtn}
            onPress={() => setSurahPickerVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.surahTitleRow}>
              <Text style={styles.surahArabicTitle}>{surahMeta.name}</Text>
              <Text style={styles.surahChevron}>▾</Text>
            </View>
            <Text style={styles.surahSubInfo}>
              {surahMeta.number}. {surahMeta.englishName} ({surahMeta.numberOfAyahs} آيات)
            </Text>
          </TouchableOpacity>

          {/* Offline Download Trigger */}
          <TouchableOpacity
            style={styles.downloadIconBtn}
            onPress={() => setDownloadModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.downloadIconText}>⬇</Text>
          </TouchableOpacity>

          {/* Tafsir Trigger */}
          <TouchableOpacity
            style={styles.tafsirTriggerBtn}
            onPress={handleOpenTafsir}
            activeOpacity={0.7}
          >
            <Text style={styles.tafsirTriggerText}>إحياء</Text>
          </TouchableOpacity>
        </View>

        {/* View Mode Switcher */}
        <View style={styles.viewModeSegment}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'mushaf' && styles.segmentBtnActive]}
            onPress={() => setViewMode('mushaf')}
          >
            <Text style={[styles.segmentText, viewMode === 'mushaf' && styles.segmentTextActive]}>
              مصحف المدينة (Mushaf)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'study' && styles.segmentBtnActive]}
            onPress={() => setViewMode('study')}
          >
            <Text style={[styles.segmentText, viewMode === 'study' && styles.segmentTextActive]}>
              دراسة الكلمات (Word Study)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CANVAS: MADANI MUSHAF OR WORD-BY-WORD STUDY */}
      <View style={styles.mushafContainer}>
        {viewMode === 'mushaf' ? (
          <NativeMushafWebView
            key={`mushaf-view-${selectedSurah}-${settings.reciter}`}
            verses={verses}
            wordTimingMap={wordTimingMap}
            letterTimingMap={letterTimingMap}
            currentVerseKey={audio.currentVerseKey}
            currentTimeMs={audio.currentTimeMs}
            isPlaying={audio.isPlaying}
            surahNumber={selectedSurah}
            highlightMode={settings.highlightMode || 'word'}
            onSeekAyah={handleSeekAyah}
            onWordSingleClick={handleMushafWordSingleClick}
            onWordDoubleClick={handleWordDoubleClick}
            onWordClick={(surah, ayah, wordIdx, wordText) => handleWordDoubleClick(surah, ayah, wordIdx, wordText)}
          />
        ) : (
          <WordStudyView
            verses={verses}
            surahNumber={selectedSurah}
            currentVerseKey={audio.currentVerseKey}
            isPlaying={audio.isPlaying}
            activeWordIdx={activeWordIdx}
            fontSize={settings.fontSize}
            showTransliteration={settings.showTransliteration}
            transliterationMode={settings.transliterationMode}
            showTranslation={settings.showTranslation}
            activeTranslation={settings.activeTranslation}
            onSeekAyah={handleSeekAyah}
            onWordSingleClick={handleWordStudyWordSingleClick}
            onWordDoubleClick={(surah, ayah, wordIdx, wordText, wordObj) => {
              setActiveWordHUD({
                surah,
                ayah,
                wordIdx,
                wordText,
                translit: wordObj?.translit || wordObj?.transliteration,
                root: wordObj?.root,
                translation: wordObj?.translation,
              });
            }}
          />
        )}
      </View>

      {/* FLOATING AUDIO CONTROLS */}
      <AudioPlayerControls
        isPlaying={audio.isPlaying}
        currentVerseKey={audio.currentVerseKey}
        currentTimeMs={audio.currentTimeMs}
        durationMs={audio.durationMs}
        isAyahLooping={audio.isAyahLooping}
        playbackSpeed={audio.playbackSpeed}
        onPlayPause={() => {
          if (audio.isPlaying) {
            audio.pauseAudio();
          } else if (audio.currentVerseKey && audio.currentVerseKey.startsWith(`${selectedSurah}:`)) {
            audio.resumeAudio();
          } else {
            audio.playVerse(selectedSurah, 1, surahMeta);
          }
        }}
        onSeekRelative={(delta) => audio.seekRelative(delta)}
        onNextAyah={handleNextAyah}
        onPrevAyah={handlePrevAyah}
        onToggleLoop={audio.toggleAyahLoop}
        onChangeSpeed={audio.cyclePlaybackSpeed}
      />

      {/* MODAL DIALOGS */}
      <SurahPickerModal
        visible={surahPickerVisible}
        surahs={allSurahs}
        selectedSurah={selectedSurah}
        onSelectSurah={handleSelectSurah}
        onClose={() => setSurahPickerVisible(false)}
      />

      <SettingsModal
        visible={settingsVisible}
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenTranslationModal={() => {
          setSettingsVisible(false);
          setTranslationModalVisible(true);
        }}
        onOpenDownloadModal={() => {
          setSettingsVisible(false);
          setDownloadModalVisible(true);
        }}
        onClose={() => setSettingsVisible(false)}
      />

      <TranslationSelectorModal
        visible={translationModalVisible}
        activeTranslation={settings.activeTranslation}
        onSelectTranslation={(id: TranslationId) => {
          setSettings(prev => ({ ...prev, activeTranslation: id }));
        }}
        onClose={() => setTranslationModalVisible(false)}
      />

      <AudioDownloadModal
        visible={downloadModalVisible}
        reciter={selectedReciterConfig}
        currentSurah={surahMeta}
        onClose={() => setDownloadModalVisible(false)}
      />

      <TafsirModal
        visible={tafsirVisible}
        verse={tafsirVerse}
        tafsirEntries={tafsirEntries}
        onClose={() => setTafsirVisible(false)}
      />

      <WordLearnHUD
        hudData={activeWordHUD}
        onClose={() => setActiveWordHUD(null)}
        onPlayLetterAudio={(char) => playLetterPhoneticAudio(char)}
        onPlayWordAudio={() => {
          if (activeWordHUD) {
            playIsolatedWordAudio(
              activeWordHUD.surah,
              activeWordHUD.ayah,
              activeWordHUD.wordIdx,
              activeWordHUD.wordText
            );
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  safeHeader: {
    backgroundColor: 'rgba(7, 13, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: ANDROID_STATUS_BAR_HEIGHT,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconCircleText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  translationBadgeBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  translationBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  downloadIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 170, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ffaa',
  },
  downloadIconText: {
    color: '#00ffaa',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tafsirTriggerBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  tafsirTriggerText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  surahTitleBtn: {
    alignItems: 'center',
    flex: 1,
  },
  surahTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  surahArabicTitle: {
    color: '#00ffaa',
    fontSize: 19,
    fontWeight: 'bold',
    fontFamily: 'Amiri',
  },
  surahChevron: {
    color: '#00ffaa',
    fontSize: 14,
  },
  surahSubInfo: {
    color: '#94a3b8',
    fontSize: 11,
  },
  viewModeSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
    justifyContent: 'center',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    borderColor: '#00ffaa',
  },
  segmentText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#00ffaa',
    fontWeight: 'bold',
  },
  mushafContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#030712',
  },
});
