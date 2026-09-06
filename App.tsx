import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { NativeMushafWebView } from './components/NativeMushafWebView';
import { injectQuranicFonts } from './utils/fontLoader';
import { QuranDataProvider } from './src/services/quranDataProvider';
import { useSurahData } from './src/hooks/useSurahData';
import { useQuranAudio, RECITERS } from './src/hooks/useQuranAudio';
import { AudioPlayerControls } from './src/components/AudioPlayerControls';
import { SurahPickerModal } from './src/components/SurahPickerModal';
import { SettingsModal } from './src/components/SettingsModal';
import { TafsirModal } from './src/components/TafsirModal';
import { WordLearnHUD } from './src/components/WordLearnHUD';
import { WordStudyView } from './src/components/WordStudyView';
import { playLetterPhoneticAudio, playIsolatedWordAudio } from './src/utils/audioPhonetics';
import { AppSettings, Verse } from './src/types/quran';

// Inject Quranic web fonts for Web / Canvas fallbacks
injectQuranicFonts();

const ANDROID_STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;

export default function App() {
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'mushaf' | 'word'>('mushaf');
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    reciter: 'abdulbasit',
    fontSize: 24,
    translitFontSize: 13,
    showTajweed: true,
    showTransliteration: true,
    showTranslation: true,
    autoScroll: true,
    repeatMode: 'none',
    highlightMode: 'word',
  });

  // Modal Dialogues State
  const [surahPickerVisible, setSurahPickerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [tafsirVisible, setTafsirVisible] = useState(false);
  const [tafsirVerse, setTafsirVerse] = useState<Verse | null>(null);
  const [tafsirEntries, setTafsirEntries] = useState<any[]>([]);

  // Word Learn HUD State
  const [activeWordHUD, setActiveWordHUD] = useState<{
    surah: number;
    ayah: number;
    wordIdx: number;
    wordText: string;
    translit?: string;
    root?: string;
    translation?: string;
  } | null>(null);

  // All 114 Surahs Metadata (lightweight static cache)
  const allSurahs = useMemo(() => QuranDataProvider.getAllSurahs(), []);
  const surahMeta = useMemo(() => QuranDataProvider.getSurahMetadata(selectedSurah), [selectedSurah]);

  // Dynamic Scoped Surah Data (Verses & Reciter Timings loaded on demand)
  const { verses, wordTimingMap, letterTimingMap, getTafsir } = useSurahData(
    selectedSurah,
    settings.reciter
  );

  // High-Precision Audio Playback Engine
  const audio = useQuranAudio(settings.reciter);

  // Actions
  const handleSelectSurah = (surahNum: number) => {
    setSelectedSurah(surahNum);
    audio.stopAudio();
    setActiveWordHUD(null);
  };

  const handleNextAyah = () => {
    const currentAyah = (audio.currentVerseKey && audio.currentVerseKey.startsWith(`${selectedSurah}:`))
      ? parseInt(audio.currentVerseKey.split(':')[1], 10)
      : 0;
    const maxAyahs = surahMeta?.numberOfAyahs || 1;
    if (currentAyah < maxAyahs) {
      audio.playVerse(selectedSurah, currentAyah + 1, surahMeta);
    }
  };

  const handlePrevAyah = () => {
    const currentAyah = (audio.currentVerseKey && audio.currentVerseKey.startsWith(`${selectedSurah}:`))
      ? parseInt(audio.currentVerseKey.split(':')[1], 10)
      : 2;
    if (currentAyah > 1) {
      audio.playVerse(selectedSurah, currentAyah - 1, surahMeta);
    }
  };

  const handleSeekAyah = (ayah: number) => {
    audio.playVerse(selectedSurah, ayah, surahMeta);
  };

  // Mushaf Mode Single Tap: Play full verse of active reciter (or seek reciter to that word if already playing)
  const handleMushafWordSingleClick = async (
    surah: number,
    ayah: number,
    wordIdx: number,
    wordText: string
  ) => {
    if (audio.isPlaying && audio.currentVerseKey === `${surah}:${ayah}`) {
      const timingList = wordTimingMap[String(ayah)] || wordTimingMap[`${surah}:${ayah}`];
      if (timingList && timingList[wordIdx]) {
        const entry = timingList[wordIdx];
        let st = Array.isArray(entry) ? entry[1] : (entry.start_ms ?? (entry.start ? entry.start * 1000 : 0));
        if (st > 0 && st < 100) st *= 1000;
        if (st > 0) {
          await audio.seekToMs(st);
          return;
        }
      }
    }
    audio.playVerse(surah, ayah, surahMeta);
  };

  // Word Study Mode Single Tap: Play isolated word audio from QuranCDN WBW
  const handleWordStudyWordSingleClick = async (
    surah: number,
    ayah: number,
    wordIdx: number,
    wordText: string
  ) => {
    await playIsolatedWordAudio(surah, ayah, wordIdx, wordText);
  };

  // Double Tap (Both Modes): Open Letter Decomposition HUD (without audio collision)
  const handleWordDoubleClick = (
    surah: number,
    ayah: number,
    wordIdx: number,
    wordText: string
  ) => {
    const verseObj = verses.find(v => v.ayah === ayah);
    const wordObj = verseObj?.words && verseObj.words[wordIdx];

    setActiveWordHUD({
      surah,
      ayah,
      wordIdx,
      wordText,
      translit: wordObj?.transliteration,
      root: wordObj?.root,
      translation: wordObj?.translation,
    });
  };

  const activeWordIdx = useMemo(() => {
    if (!audio.isPlaying || !audio.currentVerseKey || !wordTimingMap) return -1;
    const ayahStr = audio.currentVerseKey.split(':')[1];
    const timingList = wordTimingMap[audio.currentVerseKey] || wordTimingMap[ayahStr];
    if (!timingList || timingList.length === 0) return -1;
    const t = audio.currentTimeMs;
    for (let i = 0; i < timingList.length; i++) {
      const entry = timingList[i];
      let s = Array.isArray(entry) ? entry[1] : (entry.start_ms ?? (entry.start ? entry.start * 1000 : 0));
      let e = Array.isArray(entry) ? entry[2] : (entry.end_ms ?? (entry.end ? entry.end * 1000 : 0));
      if (s > 0 && s < 100 && e > 0 && e < 300) { s *= 1000; e *= 1000; }
      if (t >= s && t <= e) {
        return i;
      }
    }
    return -1;
  }, [audio.isPlaying, audio.currentVerseKey, audio.currentTimeMs, wordTimingMap]);

  const handleOpenTafsir = async (ayahNumber?: number) => {
    const targetAyah = ayahNumber || (audio.currentVerseKey ? parseInt(audio.currentVerseKey.split(':')[1], 10) : 1);
    const verseObj = verses.find(v => v.ayah === targetAyah) || null;
    const entries = await getTafsir(targetAyah);
    setTafsirVerse(verseObj);
    setTafsirEntries(entries || []);
    setTafsirVisible(true);
  };

  const activeReciter = RECITERS.find(r => r.id === settings.reciter) || RECITERS[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" translucent />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER BAR (Surah Title, Reciter Selector, Tafsir & Settings FAB) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.headerBar}>
          {/* Settings Button */}
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={styles.iconCircle}
          >
            <Text style={styles.iconCircleText}>⚙</Text>
          </TouchableOpacity>

          {/* Tafsir Modal Trigger */}
          <TouchableOpacity
            onPress={() => handleOpenTafsir()}
            style={styles.tafsirTriggerBtn}
          >
            <Text style={styles.tafsirTriggerText}>📖 التفسير</Text>
          </TouchableOpacity>

          {/* Center: Surah Title & Index Selector */}
          <TouchableOpacity
            onPress={() => setSurahPickerVisible(true)}
            style={styles.surahTitleBtn}
          >
            <View style={styles.surahTitleRow}>
              <Text style={styles.surahArabicTitle}>
                {surahMeta ? surahMeta.name : 'سورة الفاتحة'}
              </Text>
              <Text style={styles.surahChevron}>▾</Text>
            </View>
            <Text style={styles.surahSubTitle}>
              {surahMeta ? `${surahMeta.englishName} • ${surahMeta.numberOfAyahs} آيات` : ''}
            </Text>
          </TouchableOpacity>

          {/* Reciter Badge */}
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={styles.reciterBadge}
          >
            <Text style={styles.reciterBadgeText}>
              {activeReciter.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* VIEW MODE TOGGLE (Quran Reading & Learning First)                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <View style={styles.viewModeSegment}>
        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'mushaf' && styles.segmentBtnActive]}
          onPress={() => setViewMode('mushaf')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, viewMode === 'mushaf' && styles.segmentTextActive]}>
            📖 المصحف الشريف
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'word' && styles.segmentBtnActive]}
          onPress={() => setViewMode('word')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, viewMode === 'word' && styles.segmentTextActive]}>
            🔤 وضع الكلمات والدراسة
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CANVAS: MADANI MUSHAF OR WORD-BY-WORD STUDY & LEARNING        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
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
            onWordClick={handleWordDoubleClick}
          />
        ) : (
          <WordStudyView
            verses={verses}
            surahNumber={selectedSurah}
            currentVerseKey={audio.currentVerseKey}
            currentTimeMs={audio.currentTimeMs}
            isPlaying={audio.isPlaying}
            activeWordIdx={activeWordIdx}
            fontSize={settings.fontSize}
            showTransliteration={settings.showTransliteration}
            showTranslation={settings.showTranslation}
            onSeekAyah={handleSeekAyah}
            onWordSingleClick={handleWordStudyWordSingleClick}
            onWordDoubleClick={(surah, ayah, wordIdx, wordText, wordObj) => {
              setActiveWordHUD({
                surah,
                ayah,
                wordIdx,
                wordText,
                translit: wordObj?.transliteration,
                root: wordObj?.root,
                translation: wordObj?.translation,
              });
            }}
          />
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FLOATING AUDIO CONTROLS BAR (Play, Pause, Seeks, Loop, Scrubber)   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL DIALOGUES                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
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
        onClose={() => setSettingsVisible(false)}
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
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  },
  surahTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  surahArabicTitle: {
    color: '#00ffaa',
    fontSize: 20,
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
  surahSubTitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  reciterBadge: {
    backgroundColor: 'rgba(0, 255, 170, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00ffaa',
  },
  reciterBadgeText: {
    color: '#00ffaa',
    fontSize: 11,
    fontWeight: 'bold',
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
