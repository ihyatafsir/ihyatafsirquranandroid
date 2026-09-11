import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { TranslationId, TranslationConfig } from '../types/quran';

export const TRANSLATION_OPTIONS: TranslationConfig[] = [
  {
    id: 'sahih',
    name: 'Sahih International',
    language: 'English',
    translator: 'Saheeh International',
    description: 'Clear and widely accepted standard contemporary English translation.',
  },
  {
    id: 'haleem',
    name: 'M.A.S. Abdel Haleem',
    language: 'English',
    translator: 'Prof. M.A.S. Abdel Haleem (Oxford)',
    description: 'Modern, fluent, idiomatic English translation published by Oxford World Classics.',
  },
  {
    id: 'cleary',
    name: 'Thomas Cleary',
    language: 'English',
    translator: 'Thomas Cleary (Starlatch)',
    description: 'Poetic, accessible English translation emphasizing the spiritual and epistemic depth.',
  },
  {
    id: 'rida',
    name: 'Rida German (German)',
    language: 'German',
    translator: 'Abu Rida Muhammad ibn Ahmad',
    description: 'Deutschen Übersetzung der Bedeutung des Heiligen Korans.',
  },
  {
    id: 'kathir',
    name: 'Tafsir Ibn Kathir',
    language: 'English',
    translator: 'Ibn Kathir (Abridged)',
    description: 'Classical traditional commentary and Quranic exegesis in English.',
  },
  {
    id: 'jalalayn',
    name: 'Tafsir al-Jalalayn',
    language: 'English',
    translator: 'Al-Mahalli & Al-Suyuti (Feras Hamza)',
    description: 'Compact classical tafsir focusing on grammatical and contextual meanings.',
  },
];

interface TranslationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  activeTranslation: TranslationId;
  onSelectTranslation: (id: TranslationId) => void;
}

export const TranslationSelectorModal: React.FC<TranslationSelectorModalProps> = ({
  visible,
  onClose,
  activeTranslation,
  onSelectTranslation,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Translation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
            {TRANSLATION_OPTIONS.map((item) => {
              const isSelected = activeTranslation === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  activeOpacity={0.75}
                  onPress={() => {
                    onSelectTranslation(item.id);
                    onClose();
                  }}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                      {item.name}
                    </Text>
                    <View style={[styles.langBadge, isSelected && styles.langBadgeActive]}>
                      <Text style={[styles.langBadgeText, isSelected && styles.langBadgeTextActive]}>
                        {item.language}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.translatorText}>{item.translator}</Text>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '92%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 170, 0.3)',
    shadowColor: '#00ffaa',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  title: {
    color: '#00ffaa',
    fontSize: 17,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollList: {
    gap: 12,
    paddingBottom: 10,
  },
  optionCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionCardActive: {
    borderColor: '#00ffaa',
    backgroundColor: 'rgba(0, 255, 170, 0.1)',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
  },
  optionNameActive: {
    color: '#00ffaa',
  },
  langBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  langBadgeActive: {
    backgroundColor: 'rgba(0, 255, 170, 0.25)',
  },
  langBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  langBadgeTextActive: {
    color: '#00ffaa',
  },
  translatorText: {
    color: '#38bdf8',
    fontSize: 12,
    marginBottom: 4,
  },
  descriptionText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
});
