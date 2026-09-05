import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { SurahMetadata } from '../types/quran';

interface SurahPickerModalProps {
  visible: boolean;
  surahs: SurahMetadata[];
  selectedSurah: number;
  onSelectSurah: (surahNumber: number) => void;
  onClose: () => void;
}

export const SurahPickerModal: React.FC<SurahPickerModalProps> = ({
  visible,
  surahs,
  selectedSurah,
  onSelectSurah,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahs;
    const q = searchQuery.toLowerCase().trim();
    return surahs.filter(s =>
      s.name.includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      String(s.number).includes(q)
    );
  }, [surahs, searchQuery]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>إغلاق ✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>فهرس السور الكريمة</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث برقم السورة أو اسمها (Search Surah)..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Surah List */}
        <FlatList
          data={filteredSurahs}
          keyExtractor={item => String(item.number)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = item.number === selectedSurah;
            return (
              <TouchableOpacity
                onPress={() => {
                  onSelectSurah(item.number);
                  onClose();
                }}
                style={[
                  styles.surahRow,
                  isSelected && styles.surahRowSelected
                ]}
              >
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{item.number}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.englishTitle}>{item.englishName}</Text>
                  <Text style={styles.subInfo}>
                    {item.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {item.numberOfAyahs} آية
                  </Text>
                </View>
                <Text style={styles.arabicName}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  surahRowSelected: {
    borderColor: '#00ffaa',
    backgroundColor: 'rgba(0, 255, 170, 0.08)',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#00ffaa',
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoCol: {
    flex: 1,
  },
  englishTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  subInfo: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  arabicName: {
    color: '#fbbf24',
    fontSize: 18,
    fontFamily: 'Amiri',
    fontWeight: 'bold',
  },
});
