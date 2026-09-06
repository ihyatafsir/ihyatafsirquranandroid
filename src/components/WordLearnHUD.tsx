import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { deconstructWordAndChain, WordChainAnalysis } from '../utils/arabicLetterChainEngine';
import { analyzeWordTajweed, TajweedRule } from '../utils/tajweedStudentEngine';

interface WordLearnHUDProps {
  hudData: {
    surah: number;
    ayah: number;
    wordIdx: number;
    wordText: string;
    translit?: string;
    root?: string;
    translation?: string;
  } | null;
  onClose: () => void;
  onShowLisan?: (wordText: string, root: string) => void;
  onPlayLetterAudio?: (letterText: string) => void;
  onPlayWordAudio?: (surah: number, ayah: number, wordIdx: number, wordText: string) => void;
}

export const WordLearnHUD: React.FC<WordLearnHUDProps> = ({
  hudData,
  onClose,
  onShowLisan,
  onPlayLetterAudio,
  onPlayWordAudio,
}) => {
  if (!hudData) return null;

  const rules: TajweedRule[] = analyzeWordTajweed(hudData.wordText, false);
  const chain: WordChainAnalysis | null = deconstructWordAndChain(hudData.wordText);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Badges & Close Button */}
        <View style={styles.topRow}>
          <View style={styles.badgeGroup}>
            <View style={styles.refBadge}>
              <Text style={styles.refBadgeText}>
                آية {hudData.ayah} • كلمة {hudData.wordIdx + 1}
              </Text>
            </View>
            {hudData.root && onShowLisan && (
              <TouchableOpacity
                onPress={() => onShowLisan(hudData.wordText, hudData.root!)}
                style={styles.rootBadge}
              >
                <Text style={styles.rootBadgeText}>جذر: {hudData.root} 🔍</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Word Display */}
        <View style={styles.wordDisplay}>
          <Text style={styles.arabicWordText}>{hudData.wordText}</Text>
          {hudData.translit ? (
            <Text style={styles.translitText}>{hudData.translit}</Text>
          ) : null}
          {hudData.translation ? (
            <Text style={styles.translationText}>{hudData.translation}</Text>
          ) : null}

          {onPlayWordAudio && (
            <TouchableOpacity
              onPress={() => onPlayWordAudio(hudData.surah, hudData.ayah, hudData.wordIdx, hudData.wordText)}
              style={styles.listenWordBtn}
            >
              <Text style={styles.listenWordBtnText}>🔊 استمع للكلمة كاملة</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Letter Chain Breakdown */}
        {chain && chain.letters && chain.letters.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>✦ تحليل الحروف والأصوات (Phonetics):</Text>
            <View style={styles.lettersRow}>
              {chain.letters.map((letItem, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => onPlayLetterAudio && onPlayLetterAudio(letItem.rawGrapheme || letItem.baseChar)}
                  style={styles.letterChip}
                >
                  <Text style={styles.letterArabic}>{letItem.rawGrapheme || letItem.baseChar}</Text>
                  <Text style={styles.letterPhonetic}>{letItem.letterMeta?.arabicName || letItem.baseChar}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tajweed Rules */}
        {rules && rules.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>✦ أحكام التجويد (Tajweed Rules):</Text>
            <View style={styles.rulesContainer}>
              {rules.map((rule, idx) => (
                <View key={idx} style={[styles.ruleCard, { borderLeftColor: rule.color || '#00ffaa' }]}>
                  <Text style={[styles.ruleName, { color: rule.color || '#00ffaa' }]}>
                    {rule.nameAr || rule.id}
                  </Text>
                  <Text style={styles.ruleDesc}>{rule.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    maxHeight: '82%',
    backgroundColor: 'rgba(7, 13, 26, 0.98)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 170, 0.45)',
    shadowColor: '#00ffaa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 999,
  },
  scrollContent: {
    paddingBottom: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refBadge: {
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 170, 0.4)',
  },
  refBadgeText: {
    color: '#00ffaa',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rootBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  rootBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  wordDisplay: {
    alignItems: 'center',
    marginVertical: 8,
  },
  arabicWordText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: 'bold',
    fontFamily: 'Amiri',
    textShadowColor: 'rgba(0, 255, 170, 0.5)',
    textShadowRadius: 14,
  },
  translitText: {
    color: '#38bdf8',
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  translationText: {
    color: '#fbbf24',
    fontSize: 15,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionBlock: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  sectionHeader: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lettersRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  letterChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 170, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 46,
  },
  letterArabic: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Amiri',
    fontWeight: 'bold',
  },
  letterPhonetic: {
    color: '#38bdf8',
    fontSize: 10,
    marginTop: 2,
  },
  rulesContainer: {
    gap: 6,
  },
  ruleCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 8,
  },
  ruleName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ruleDesc: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
  },
  listenWordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    borderWidth: 1,
    borderColor: '#00ffaa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  listenWordBtnText: {
    color: '#00ffaa',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
