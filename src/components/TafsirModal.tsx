import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Verse } from '../types/quran';

interface TafsirModalProps {
  visible: boolean;
  verse: Verse | null;
  tafsirEntries: any[];
  onClose: () => void;
}

export const TafsirModal: React.FC<TafsirModalProps> = ({
  visible,
  verse,
  tafsirEntries,
  onClose,
}) => {
  if (!verse) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>إغلاق ✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفسير إحياء علوم الدين</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* Verse Card */}
          <View style={styles.verseCard}>
            <View style={styles.refBadge}>
              <Text style={styles.refBadgeText}>
                سورة {verse.surah} : آية {verse.ayah}
              </Text>
            </View>
            <Text style={styles.arabicVerseText}>{verse.text}</Text>
            {verse.translation ? (
              <Text style={styles.englishVerseText}>{verse.translation}</Text>
            ) : null}
          </View>

          {/* Commentary Heading */}
          <View style={styles.commentaryHeadingRow}>
            <Text style={styles.sectionTitle}>✦ درر وحِكَم الإمام أبي حامد الغزالي</Text>
          </View>

          {/* Commentary Items */}
          {tafsirEntries && tafsirEntries.length > 0 ? (
            tafsirEntries.map((t, idx) => (
              <View key={idx} style={styles.tafsirCard}>
                {/* Meta Badges */}
                <View style={styles.badgesRow}>
                  {t.badge && (
                    <View style={styles.topicBadge}>
                      <Text style={styles.topicBadgeText}>{t.badge}</Text>
                    </View>
                  )}
                  <View style={styles.bookBadge}>
                    <Text style={styles.bookBadgeText}>
                      كتاب {t.book_title || "إحياء علوم الدين"}
                    </Text>
                  </View>
                </View>

                {t.topic && (
                  <Text style={styles.topicText}>{t.topic}</Text>
                )}

                {t.arabic && (
                  <>
                    <Text style={styles.tafsirArabic}>{t.arabic}</Text>
                    <View style={styles.dividerRow}>
                      <Text style={styles.dividerDots}>◆ ❖ ◆</Text>
                    </View>
                  </>
                )}

                {t.english && (
                  <Text style={styles.tafsirEnglish}>{t.english}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                لم يرد نص مباشر لهذه الآية في كتاب إحياء علوم الدين.
              </Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButtonText: {
    color: '#00ffaa',
    fontWeight: 'bold',
    fontSize: 13,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  verseCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 170, 0.2)',
    marginBottom: 16,
  },
  refBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ffaa',
    marginBottom: 10,
  },
  refBadgeText: {
    color: '#00ffaa',
    fontSize: 11,
    fontWeight: 'bold',
  },
  arabicVerseText: {
    color: '#f8fafc',
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
    fontFamily: 'Amiri',
    marginBottom: 8,
  },
  englishVerseText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
  },
  commentaryHeadingRow: {
    marginVertical: 10,
  },
  sectionTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tafsirCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  topicBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderColor: 'rgba(147, 51, 234, 0.4)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topicBadgeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bookBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#fbbf24',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bookBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
  },
  topicText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  tafsirArabic: {
    color: '#e2e8f0',
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'justify',
  },
  dividerRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerDots: {
    color: '#fbbf24',
    fontSize: 10,
    opacity: 0.6,
  },
  tafsirEnglish: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'justify',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
