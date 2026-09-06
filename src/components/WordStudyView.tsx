import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Verse, Word } from '../types/quran';

interface WordStudyViewProps {
  verses: Verse[];
  surahNumber: number;
  currentVerseKey: string | null;
  currentTimeMs?: number;
  isPlaying: boolean;
  activeWordIdx?: number;
  showTransliteration?: boolean;
  showTranslation?: boolean;
  showTajweed?: boolean;
  fontSize?: number;
  onSeekAyah: (ayah: number) => void;
  onWordSingleClick: (surah: number, ayah: number, wordIdx: number, wordText: string, wordObj?: Word) => void;
  onWordDoubleClick: (surah: number, ayah: number, wordIdx: number, wordText: string, wordObj?: Word) => void;
}

export const WordStudyView: React.FC<WordStudyViewProps> = ({
  verses,
  surahNumber,
  currentVerseKey,
  isPlaying,
  activeWordIdx = -1,
  showTransliteration = true,
  showTranslation = true,
  fontSize = 26,
  onSeekAyah,
  onWordSingleClick,
  onWordDoubleClick,
}) => {
  const [pulsingWordKey, setPulsingWordKey] = useState<string | null>(null);

  // Gesture Disambiguation: 1 Click -> Isolated Word Audio; 2 Clicks (within 280ms) -> Letters HUD
  const lastTapRef = useRef<{ key: string; time: number; timer: any }>({
    key: '',
    time: 0,
    timer: null,
  });

  const handleWordTap = useCallback((ayah: number, wordIdx: number, wordObj: Word) => {
    const key = `${surahNumber}:${ayah}:${wordIdx}`;
    const now = Date.now();
    const last = lastTapRef.current;

    if (last.key === key && (now - last.time) < 280) {
      // ➔ DOUBLE TAP: Cancel single-tap audio timer & open Letter Decomposition HUD
      if (last.timer) {
        clearTimeout(last.timer);
        last.timer = null;
      }
      lastTapRef.current = { key: '', time: 0, timer: null };

      onWordDoubleClick(surahNumber, ayah, wordIdx, wordObj.arabic, wordObj);
    } else {
      // ➔ FIRST TAP: Set debounce timer
      if (last.timer) {
        clearTimeout(last.timer);
      }

      const timer = setTimeout(() => {
        lastTapRef.current = { key: '', time: 0, timer: null };

        // Visual ink pulse
        setPulsingWordKey(key);
        setTimeout(() => setPulsingWordKey(p => p === key ? null : p), 600);

        // Execute single-tap isolated word audio
        onWordSingleClick(surahNumber, ayah, wordIdx, wordObj.arabic, wordObj);
      }, 280);

      lastTapRef.current = { key, time: now, timer };
    }
  }, [surahNumber, onWordSingleClick, onWordDoubleClick]);

  const renderVerseCard = useCallback(({ item }: { item: Verse }) => {
    const isCurrentVerse = currentVerseKey === `${surahNumber}:${item.ayah}`;
    const words: Word[] = item.words && item.words.length > 0
      ? item.words
      : (item.text || '').trim().split(/\s+/).map((w, idx) => ({ id: idx + 1, arabic: w }));

    return (
      <View style={[styles.verseCard, isCurrentVerse && styles.verseCardActive]}>
        {/* Ayah Header Bar */}
        <View style={styles.verseHeader}>
          <TouchableOpacity
            style={styles.ayahBadgeBtn}
            onPress={() => onSeekAyah(item.ayah)}
          >
            <Text style={styles.ayahBadgeText}>آية {item.ayah}</Text>
            <Text style={styles.playIcon}>{isCurrentVerse && isPlaying ? '❚❚' : '▶'}</Text>
          </TouchableOpacity>

          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>نقرة: صوت الكلمة • نقرتين: تحليل الحروف</Text>
          </View>
        </View>

        {/* Word-by-Word Tokens (Right-to-Left Natural Reading) */}
        <View style={styles.wordsWrapContainer}>
          {words.map((word, wIdx) => {
            const wordKey = `${surahNumber}:${item.ayah}:${wIdx}`;
            const isPulsing = pulsingWordKey === wordKey;
            const isWordReciting = isCurrentVerse && isPlaying && activeWordIdx === wIdx;

            return (
              <TouchableOpacity
                key={wIdx}
                activeOpacity={0.7}
                onPress={() => handleWordTap(item.ayah, wIdx, word)}
                style={[
                  styles.wordChip,
                  isPulsing && styles.wordChipPulsing,
                  isWordReciting && styles.wordChipReciting,
                ]}
              >
                <Text
                  style={[
                    styles.arabicWordText,
                    { fontSize },
                    isWordReciting && styles.arabicWordTextReciting,
                    isPulsing && styles.arabicWordTextPulsing,
                  ]}
                >
                  {word.arabic}
                </Text>

                {showTransliteration && word.transliteration ? (
                  <Text style={styles.translitText} numberOfLines={1}>
                    {word.transliteration}
                  </Text>
                ) : null}

                {showTranslation && word.translation ? (
                  <Text style={styles.translationText} numberOfLines={1}>
                    {word.translation}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Verse Translation Footer */}
        {item.translation ? (
          <View style={styles.verseTranslationBox}>
            <Text style={styles.verseTranslationText}>{item.translation}</Text>
          </View>
        ) : null}
      </View>
    );
  }, [surahNumber, currentVerseKey, isPlaying, activeWordIdx, pulsingWordKey, fontSize, showTransliteration, showTranslation, onSeekAyah, handleWordTap]);

  return (
    <View style={styles.container}>
      <FlatList
        data={verses}
        keyExtractor={item => `${surahNumber}:${item.ayah}`}
        renderItem={renderVerseCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  listContent: {
    padding: 14,
    paddingBottom: 120,
  },
  verseCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  verseCardActive: {
    borderColor: '#00ffaa',
    backgroundColor: 'rgba(0, 255, 170, 0.06)',
    shadowColor: '#00ffaa',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 8,
  },
  ayahBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 170, 0.3)',
  },
  ayahBadgeText: {
    color: '#00ffaa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playIcon: {
    color: '#00ffaa',
    fontSize: 10,
    marginLeft: 2,
  },
  hintContainer: {
    paddingHorizontal: 6,
  },
  hintText: {
    color: '#64748b',
    fontSize: 11,
  },
  wordsWrapContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 6,
  },
  wordChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 54,
  },
  wordChipPulsing: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    transform: [{ scale: 1.05 }],
  },
  wordChipReciting: {
    borderColor: '#00ffaa',
    backgroundColor: 'rgba(0, 255, 170, 0.22)',
    shadowColor: '#00ffaa',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  arabicWordText: {
    color: '#f8fafc',
    fontFamily: 'Amiri',
    textAlign: 'center',
  },
  arabicWordTextPulsing: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  arabicWordTextReciting: {
    color: '#00ffaa',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 255, 170, 0.8)',
    textShadowRadius: 10,
  },
  translitText: {
    color: '#38bdf8',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  translationText: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 1,
    textAlign: 'center',
  },
  verseTranslationBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  verseTranslationText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
