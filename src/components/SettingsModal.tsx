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
import { AppSettings, HighlightingMode, ReciterConfig } from '../types/quran';
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
  const currentMode = settings.highlightMode || 'word';

  const modes: { id: HighlightingMode; label: string; desc: string }[] = [
    { id: 'letter', label: '🔤 حرفي (Letter)', desc: 'تزامن الحروف وتدفق القراءة 120 FPS' },
    { id: 'word', label: '📖 كلمة (Word)', desc: 'تظليل الكلمة المتلوة بدقة عالية (موصى به)' },
    { id: 'ayah', label: '📜 آية (Ayah)', desc: 'إضاءة الآية كاملة بهدوء' },
    { id: 'off', label: '⏸️ معطل (Off)', desc: 'قراءة مصحف صافية بدون تظليل' },
  ];

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
            <Text style={styles.sectionHeader}>✦ القارئ والرواية (Reciter & Riwayah):</Text>
            <View style={styles.reciterList}>
              {RECITERS.map(r => {
                const isSelected = settings.reciter === r.id;
                const isWarsh = r.narration === 'warsh';
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => onUpdateSettings({ ...settings, reciter: r.id })}
                    style={[
                      styles.reciterOption,
                      isSelected && styles.reciterOptionSelected
                    ]}
                  >
                    <View style={styles.reciterInfoCol}>
                      <Text style={[styles.reciterName, isSelected && styles.reciterNameSelected]}>
                        {r.name}
                      </Text>
                      <Text style={styles.reciterRiwayahText}>
                        {isWarsh ? 'مصحف ورش عن نافع (Warsh)' : 'مصحف حفص عن عاصم (Hafs)'}
                      </Text>
                    </View>
                    <View style={styles.badgesCol}>
                      {isWarsh ? (
                        <View style={styles.warshBadge}>
                          <Text style={styles.warshBadgeText}>ورش</Text>
                        </View>
                      ) : (
                        <View style={styles.hafsBadge}>
                          <Text style={styles.hafsBadgeText}>حفص</Text>
                        </View>
                      )}
                      {r.letterSync && (
                        <View style={styles.syncBadge}>
                          <Text style={styles.syncBadgeText}>تزامن الحروف</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Highlighting Precision Mode Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>✦ نمط تظليل التلاوة (Highlighting Precision):</Text>
            <View style={styles.modeList}>
              {modes.map(m => {
                const isModeSelected = currentMode === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => onUpdateSettings({ ...settings, highlightMode: m.id })}
                    style={[
                      styles.modeOption,
                      isModeSelected && styles.modeOptionSelected
                    ]}
                  >
                    <View style={styles.modeRow}>
                      <Text style={[styles.modeLabel, isModeSelected && styles.modeLabelSelected]}>
                        {m.label}
                      </Text>
                      {isModeSelected && (
                        <View style={styles.activeCheckCircle}>
                          <Text style={styles.activeCheckText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.modeDesc}>{m.desc}</Text>
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
  reciterInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  reciterName: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  reciterNameSelected: {
    color: '#00ffaa',
    fontWeight: 'bold',
  },
  reciterRiwayahText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  badgesCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  warshBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: '#fbbf24',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  warshBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hafsBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hafsBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
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
  modeList: {
    gap: 8,
  },
  modeOption: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeOptionSelected: {
    borderColor: '#00ffaa',
    backgroundColor: 'rgba(0, 255, 170, 0.08)',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  modeLabelSelected: {
    color: '#00ffaa',
    fontWeight: 'bold',
  },
  activeCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00ffaa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCheckText: {
    color: '#030712',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
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
