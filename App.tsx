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
import { playLetterPhoneticAudio } from './src/utils/audioPhonetics';
import { AppSettings, Verse } from './src/types/quran';

// Inject Quranic web fonts for Web / Canvas fallbacks
injectQuranicFonts();

const ANDROID_STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;

export default function App() {
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    reciter: 'abdulbasit',
    fontSize: 24,
    translitFontSize: 13,
    showTajweed: true,
    showTransliteration: true,
    showTranslation: true,
    autoScroll: true,
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
    const currentAyah = audio.currentVerseKey
      ? parseInt(audio.currentVerseKey.split(':')[1], 10)
      : 1;
    const maxAyahs = surahMeta?.numberOfAyahs || 1;
    if (currentAyah < maxAyahs) {
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

  const handleSeekAyah = (ayah: number) => {
    audio.playVerse(selectedSurah, ayah, surahMeta);
  };

  const handleWordClick = async (
    surah: number,
    ayah: number,
    wordIdx: number,
    wordText: string
  ) => {
    // Open Word Learn HUD for detailed phonetics & Tajweed
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
      {/* MAIN CANVAS: 120 FPS HARDWARE-ACCELERATED MADANI MUSHAF WEBVIEW    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <View style={styles.mushafContainer}>
        <NativeMushafWebView
          key={`mushaf-view-${selectedSurah}`}
          verses={verses}
          wordTimingMap={wordTimingMap}
          letterTimingMap={letterTimingMap}
          currentVerseKey={audio.currentVerseKey}
          currentTimeMs={audio.currentTimeMs}
          isPlaying={audio.isPlaying}
          surahNumber={selectedSurah}
          onSeekAyah={handleSeekAyah}
          onWordClick={handleWordClick}
        />
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
        onPlayPause={() => audio.isPlaying ? audio.pauseAudio() : (audio.currentVerseKey ? audio.resumeAudio() : audio.playVerse(selectedSurah, 1, surahMeta))}
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
  mushafContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#030712',
  },
});
