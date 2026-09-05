import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { AppSettings, ReciterConfig } from '../types/quran';
import { RECITERS } from '../hooks/useQuranAudio';

interface SettingsModalProps {
  visible: boolean;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>تم ✓</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إعدادات التطبيق (Settings)</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.contentScroll}>
          {/* Reciter Picker */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>✦ القارئ المعتمد (Reciter):</Text>
            <View style={styles.reciterList}>
              {RECITERS.map(r => {
                const isSelected = settings.reciter === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => onUpdateSettings({ ...settings, reciter: r.id })}
                    style={[
                      styles.reciterOption,
                      isSelected && styles.reciterOptionSelected
                    ]}
                  >
                    <Text style={[styles.reciterName, isSelected && styles.reciterNameSelected]}>
                      {r.name}
                    </Text>
                    {r.letterSync && (
                      <View style={styles.syncBadge}>
                        <Text style={styles.syncBadgeText}>تزامن الحروف</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Reading Preferences */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>✦ خيارات القراءة والعرض:</Text>

            {/* Tajweed Switch */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>ألوان التجويد (Tajweed Colors)</Text>
              <Switch
                value={settings.showTajweed}
                onValueChange={v => onUpdateSettings({ ...settings, showTajweed: v })}
                trackColor={{ false: '#334155', true: '#00ffaa' }}
              />
            </View>

            {/* Transliteration Switch */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>الرسم الصوتي (Transliteration)</Text>
              <Switch
                value={settings.showTransliteration}
                onValueChange={v => onUpdateSettings({ ...settings, showTransliteration: v })}
                trackColor={{ false: '#334155', true: '#00ffaa' }}
              />
            </View>

            {/* Translation Switch */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>الترجمة الإنجليزية (English Translation)</Text>
              <Switch
                value={settings.showTranslation}
                onValueChange={v => onUpdateSettings({ ...settings, showTranslation: v })}
                trackColor={{ false: '#334155', true: '#00ffaa' }}
              />
            </View>
          </View>

          {/* Font Size Adjustments */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>✦ حجم الخط العربي:</Text>
            <View style={styles.fontSizeRow}>
              <TouchableOpacity
                onPress={() => onUpdateSettings({ ...settings, fontSize: Math.max(18, settings.fontSize - 2) })}
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeValue}>{settings.fontSize} px</Text>
              <TouchableOpacity
                onPress={() => onUpdateSettings({ ...settings, fontSize: Math.min(36, settings.fontSize + 2) })}
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    borderWidth: 1,
    borderColor: '#00ffaa',
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
    padding: 16,
  },
  sectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reciterList: {
    gap: 8,
  },
  reciterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reciterOptionSelected: {
    borderColor: '#00ffaa',
    backgroundColor: 'rgba(0, 255, 170, 0.1)',
  },
  reciterName: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  reciterNameSelected: {
    color: '#00ffaa',
    fontWeight: 'bold',
  },
  syncBadge: {
    backgroundColor: 'rgba(0, 255, 170, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  syncBadgeText: {
    color: '#00ffaa',
    fontSize: 10,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  settingLabel: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepButtonText: {
    color: '#00ffaa',
    fontSize: 22,
    fontWeight: 'bold',
  },
  fontSizeValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
