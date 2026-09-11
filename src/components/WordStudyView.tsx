import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Verse, Word, TransliterationMode, TranslationId } from '../types/quran';

interface WordStudyViewProps {
  verses: Verse[];
  surahNumber: number;
  currentVerseKey: string | null;
  isPlaying: boolean;
  activeWordIdx: number;
  fontSize?: number;
  showTransliteration?: boolean;
  transliterationMode?: TransliterationMode;
  showTranslation?: boolean;
  activeTranslation?: TranslationId;
  onSeekAyah: (ayahNumber: number) => void;
  onWordSingleClick: (surah: number, ayah: number, wordIdx: number, wordText: string, wordObj?: Word) => void;
  onWordDoubleClick: (surah: number, ayah: number, wordIdx: number, wordText: string, wordObj?: Word) => void;
}

export const WordStudyView: React.FC<WordStudyViewProps> = ({
  verses,
  surahNumber,
  currentVerseKey,
  isPlaying,
  activeWordIdx,
  fontSize = 26,
  showTransliteration = true,
  transliterationMode = 'specialRTL',
  showTranslation = true,
  activeTranslation = 'sahih',
  onSeekAyah,
  onWordSingleClick,
  onWordDoubleClick,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [pulsingWordKey, setPulsingWordKey] = useState<string | null>(null);
  const lastTapRef = useRef<{ key: string; time: number; timer: any }>({
    key: '',
    time: 0,
    timer: null,
  });

  // Auto-scroll to active Ayah card during playback
  useEffect(() => {
    if (currentVerseKey && isPlaying && verses && verses.length > 0) {
      const parts = currentVerseKey.split(':');
      const ayahNum = parseInt(parts[1] || parts[0], 10);
      const idx = verses.findIndex(v => v.ayah === ayahNum);
      if (idx >= 0 && flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: idx,
            animated: true,
            viewPosition: 0.15,
          });
        } catch {
          // Ignore layout race condition
        }
      }
    }
  }, [currentVerseKey, isPlaying, verses]);

  const handleWordTap = useCallback((ayah: number, wordIdx: number, wordObj: Word) => {
    const key = `${surahNumber}:${ayah}:${wordIdx}`;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTapRef.current.key === key && (now - lastTapRef.current.time) < DOUBLE_TAP_DELAY) {
      if (lastTapRef.current.timer) {
        clearTimeout(lastTapRef.current.timer);
      }
      lastTapRef.current = { key: '', time: 0, timer: null };

      setPulsingWordKey(key);
      setTimeout(() => setPulsingWordKey(p => p === key ? null : p), 600);

      onWordDoubleClick(surahNumber, ayah, wordIdx, wordObj.arabic, wordObj);
    } else {
      if (lastTapRef.current.timer) {
        clearTimeout(lastTapRef.current.timer);
      }

      const timer = setTimeout(() => {
        lastTapRef.current = { key: '', time: 0, timer: null };

        setPulsingWordKey(key);
        setTimeout(() => setPulsingWordKey(p => p === key ? null : p), 600);

        onWordSingleClick(surahNumber, ayah, wordIdx, wordObj.arabic, wordObj);
      }, 280);

      lastTapRef.current = { key, time: now, timer };
    }
  }, [surahNumber, onWordSingleClick, onWordDoubleClick]);

  const getVerseTranslationText = (item: Verse): string => {
    switch (activeTranslation) {
      case 'haleem':
        return item.haleemTranslation || item.translation || '';
      case 'cleary':
        return item.clearyTranslation || item.translation || '';
      case 'rida':
        return item.ridaGermanTranslation || item.translation || '';
      case 'kathir':
        return item.ibnKathirTranslation || item.translation || '';
      case 'jalalayn':
        return item.jalalaynTranslation || item.translation || '';
      case 'sahih':
      default:
        return item.translation || '';
    }
  };

  const getWordTransliterationText = (word: Word): string => {
    if (transliterationMode === 'specialRTL') {
      return word.translit || word.transliteration || word.latinTranslit || '';
    }
    return word.latinTranslit || word.transliteration || word.translit || '';
  };

  const renderVerseCard = useCallback(({ item }: { item: Verse }) => {
    const isCurrentVerse = currentVerseKey === `${surahNumber}:${item.ayah}` || currentVerseKey === `${item.ayah}`;
    const words: Word[] = item.words && item.words.length > 0
      ? item.words
      : (item.text || '').trim().split(/\s+/).map((w, idx) => ({ id: idx + 1, arabic: w }));

    const verseTranslation = getVerseTranslationText(item);

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
            const wordTranslit = getWordTransliterationText(word);
            const isRtlTranslit = transliterationMode === 'specialRTL';

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

                {showTransliteration && wordTranslit ? (
                  <Text
                    style={[
                      styles.translitText,
                      isRtlTranslit && styles.translitTextRTL,
                      isWordReciting && styles.translitTextReciting,
                    ]}
                    numberOfLines={1}
                  >
                    {wordTranslit}
                  </Text>
                ) : null}

                {showTranslation && word.translation ? (
                  <Text
                    style={[
                      styles.translationText,
                      isWordReciting && styles.translationTextReciting,
                    ]}
                    numberOfLines={1}
                  >
                    {word.translation}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Verse Translation Footer */}
        {verseTranslation ? (
          <View style={styles.verseTranslationBox}>
            <Text style={styles.verseTranslationText}>{verseTranslation}</Text>
          </View>
        ) : null}
      </View>
    );
  }, [
    surahNumber,
    currentVerseKey,
    isPlaying,
    activeWordIdx,
    pulsingWordKey,
    fontSize,
    showTransliteration,
    transliterationMode,
    showTranslation,
    activeTranslation,
    onSeekAyah,
    handleWordTap,
  ]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={verses}
        keyExtractor={item => `${surahNumber}:${item.ayah}`}
        renderItem={renderVerseCard}
        extraData={`${activeWordIdx}_${currentVerseKey}_${isPlaying}_${pulsingWordKey}_${transliterationMode}_${activeTranslation}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        windowSize={11}
        removeClippedSubviews={false}
        onScrollToIndexFailed={info => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.15 });
          }, 100);
        }}
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
    shadowOpacity: 0.6,
    shadowRadius: 10,
    transform: [{ scale: 1.04 }],
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
  translitTextRTL: {
    writingDirection: 'rtl',
  },
  translitTextReciting: {
    color: '#67e8f9',
    fontWeight: 'bold',
  },
  translationText: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 1,
    textAlign: 'center',
  },
  translationTextReciting: {
    color: '#f1f5f9',
    fontWeight: '600',
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
