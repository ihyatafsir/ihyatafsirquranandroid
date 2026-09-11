import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  SafeAreaView,
} from 'react-native';
import { AppSettings, ReciterConfig, HighlightingMode, TransliterationMode, TranslationId } from '../types/quran';
import { RECITERS } from '../hooks/useQuranAudio';
import { TRANSLATION_OPTIONS } from './TranslationSelectorModal';

interface SettingsModalProps {
  visible: boolean;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onOpenTranslationModal?: () => void;
  onOpenDownloadModal?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  onUpdateSettings,
  onOpenTranslationModal,
  onOpenDownloadModal,
  onClose,
}) => {
  const highlightModes: { id: HighlightingMode; label: string; desc: string }[] = [
    {
      id: 'letter',
      label: 'الحرف (Ayn Acoustic letter-level synchronizer)',
      desc: 'حركات الحروف بدقة المليمتر مع تلوين الحرف النشط',
    },
    {
      id: 'word',
      label: 'الكلمة (Word Tracking)',
      desc: 'تظليل الكلمة كاملة مع جريان الصوت',
    },
    {
      id: 'ayah',
      label: 'الآية (Verse Scope)',
      desc: 'تظليل الآية الحالية بالكامل',
    },
    {
      id: 'off',
      label: 'إيقاف (Disabled)',
      desc: 'تلاوة بدون تظليل مرئي',
    },
  ];

  const translitModes: { id: TransliterationMode; label: string; desc: string }[] = [
    {
      id: 'specialRTL',
      label: 'الرسم الصوتي المعكوس الخاص (Special RTL Diacritic Roman)',
      desc: 'حروف لاتينية بحركات إعرابية عربية تقرأ من اليمين إلى اليسار مع تدفق المصحف',
    },
    {
      id: 'standardLatin',
      label: 'الرسم الصوتي اللاتيني المعتاد (Standard Latin Transliteration)',
      desc: 'نقل صوتي لاتيني مألوف (bis\'mi, al-ḥamdu)',
    },
  ];

  const activeTranslationMeta = TRANSLATION_OPTIONS.find(t => t.id === settings.activeTranslation) || TRANSLATION_OPTIONS[0];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>إعدادات التطبيق والمصحف</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>إغلاق ✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* Reciter Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>✦ القارئ والرواية (Reciter & Narration):</Text>
            <View style={styles.reciterList}>
              {RECITERS.map((r: ReciterConfig) => {
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
                    <View style={styles.reciterInfoCol}>
                      <Text style={[styles.reciterName, isSelected && styles.reciterNameSelected]}>
                        {r.name}
                      </Text>
                      <Text style={styles.reciterRiwayahText}>
                        {r.narration === 'warsh' ? 'رواية ورش عن نافع (Warsh)' : 'رواية حفص عن عاصم (Hafs)'}
                      </Text>
                    </View>

                    <View style={styles.badgesCol}>
                      {r.narration === 'warsh' && (
                        <View style={styles.warshBadge}>
                          <Text style={styles.warshBadgeText}>ورش</Text>
                        </View>
                      )}
                      {r.narration === 'hafs' && (
                        <View style={styles.hafsBadge}>
                          <Text style={styles.hafsBadgeText}>حفص</Text>
                        </View>
                      )}
                      {r.letterSync && (
                        <View style={styles.syncBadge}>
                          <Text style={styles.syncBadgeText}>AynAcoustic Sync</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Offline Downloader shortcut */}
            {onOpenDownloadModal && (
              <TouchableOpacity style={styles.downloadShortcutBtn} onPress={onOpenDownloadModal}>
                <Text style={styles.downloadShortcutText}>تحميل التلاوة للعمل بدون إنترنت (Offline Audio)</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Translation Selection Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>✦ ترجمة معاني القرآن الكريم (Translation):</Text>
            <TouchableOpacity
              style={styles.translationActiveCard}
              onPress={() => onOpenTranslationModal && onOpenTranslationModal()}
            >
              <View>
                <Text style={styles.translationActiveName}>{activeTranslationMeta.name}</Text>
                <Text style={styles.translationActiveAuthor}>{activeTranslationMeta.translator}</Text>
                <Text style={styles.translationActiveDesc}>{activeTranslationMeta.description}</Text>
              </View>
              <Text style={styles.changeBtnText}>تغيير ➔</Text>
            </TouchableOpacity>
          </View>

          {/* Transliteration Mode Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>✦ نمط الرسم الصوتي (Transliteration Mode):</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>تفعيل الرسم الصوتي</Text>
              <Switch
                value={settings.showTransliteration}
                onValueChange={v => onUpdateSettings({ ...settings, showTransliteration: v })}
                trackColor={{ false: '#334155', true: '#00ffaa' }}
              />
            </View>

            {settings.showTransliteration && (
              <View style={styles.modeList}>
                {translitModes.map(tm => {
                  const isSelected = settings.transliterationMode === tm.id;
                  return (
                    <TouchableOpacity
                      key={tm.id}
                      onPress={() => onUpdateSettings({ ...settings, transliterationMode: tm.id })}
                      style={[styles.modeOption, isSelected && styles.modeOptionSelected]}
                    >
                      <View style={styles.modeRow}>
                        <Text style={[styles.modeLabel, isSelected && styles.modeLabelSelected]}>
                          {tm.label}
                        </Text>
                        {isSelected && (
                          <View style={styles.activeCheckCircle}>
                            <Text style={styles.activeCheckText}>✓</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.modeDesc}>{tm.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Highlighting Engine Scope */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>✦ نمط التظليل الصوتي (Sync Scope):</Text>
            <View style={styles.modeList}>
              {highlightModes.map((m) => {
                const isModeSelected = (settings.highlightMode || 'letter') === m.id;
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

            {/* Translation Switch */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>عرض الترجمة (Show Translation)</Text>
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

          <View style={{ height: 40 }} />
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
  downloadShortcutBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    borderWidth: 1,
    borderColor: '#00ffaa',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadShortcutText: {
    color: '#00ffaa',
    fontSize: 13,
    fontWeight: 'bold',
  },
  translationActiveCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 170, 0.3)',
  },
  translationActiveName: {
    color: '#00ffaa',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  translationActiveAuthor: {
    color: '#38bdf8',
    fontSize: 12,
    marginBottom: 4,
  },
  translationActiveDesc: {
    color: '#94a3b8',
    fontSize: 11,
    maxWidth: 240,
    lineHeight: 15,
  },
  changeBtnText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modeList: {
    gap: 8,
    marginTop: 10,
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
