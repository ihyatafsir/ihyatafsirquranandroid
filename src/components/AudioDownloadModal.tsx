import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ProgressBarAndroid,
} from 'react-native';
import { OfflineAudioService } from '../services/offlineAudioService';
import { ReciterConfig, SurahMetadata, DownloadProgress } from '../types/quran';

interface AudioDownloadModalProps {
  visible: boolean;
  onClose: () => void;
  reciter: ReciterConfig;
  currentSurah: SurahMetadata;
}

export const AudioDownloadModal: React.FC<AudioDownloadModalProps> = ({
  visible,
  onClose,
  reciter,
  currentSurah,
}) => {
  const [isSurahDownloaded, setIsSurahDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (visible && reciter && currentSurah) {
      checkDownloadStatus();
    }
  }, [visible, reciter, currentSurah]);

  const checkDownloadStatus = async () => {
    const downloaded = await OfflineAudioService.isSurahDownloaded(
      reciter.id,
      currentSurah.number,
      currentSurah.numberOfAyahs || currentSurah.verses || 7
    );
    setIsSurahDownloaded(downloaded);
    setStatusMessage(downloaded ? 'Downloaded locally (Offline Ready)' : 'Not downloaded');
  };

  const handleDownloadSurah = async () => {
    setIsDownloading(true);
    setStatusMessage('Downloading Surah audio...');

    const success = await OfflineAudioService.downloadSurah(
      reciter,
      currentSurah.number,
      currentSurah.numberOfAyahs || currentSurah.verses || 7,
      (prog) => {
        setDownloadProgress(prog);
        setStatusMessage(`Downloading Ayah ${prog.downloadedFiles}/${prog.totalFiles} (${prog.percent}%)`);
      }
    );

    setIsDownloading(false);
    if (success) {
      setIsSurahDownloaded(true);
      setStatusMessage('Surah downloaded successfully! 100% offline.');
    } else {
      setStatusMessage('Download stopped or failed.');
    }
  };

  const handleDeleteSurah = async () => {
    await OfflineAudioService.deleteSurahAudio(reciter.id, currentSurah.number);
    setIsSurahDownloaded(false);
    setDownloadProgress(null);
    setStatusMessage('Surah audio deleted from local storage.');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Offline Audio Downloader</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View style={styles.body}>
            <Text style={styles.label}>Reciter: <Text style={styles.val}>{reciter.name}</Text></Text>
            <Text style={styles.label}>Surah: <Text style={styles.val}>{currentSurah.number}. {currentSurah.englishName || currentSurah.name} ({currentSurah.numberOfAyahs || currentSurah.verses} Ayahs)</Text></Text>
            <Text style={styles.statusLabel}>Status: <Text style={[styles.statusVal, isSurahDownloaded && styles.statusReady]}>{statusMessage}</Text></Text>

            {/* Progress Bar */}
            {isDownloading && downloadProgress ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${downloadProgress.percent}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{downloadProgress.percent}%</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              {!isSurahDownloaded ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, isDownloading && styles.btnDisabled]}
                  disabled={isDownloading}
                  onPress={handleDownloadSurah}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#030712" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Download This Surah</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDeleteSurah}
                >
                  <Text style={styles.deleteBtnText}>Delete Local Audio</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
    width: '90%',
    maxWidth: 420,
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
    marginBottom: 16,
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
  body: {
    gap: 10,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
  },
  val: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  statusVal: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  statusReady: {
    color: '#00ffaa',
  },
  progressContainer: {
    marginVertical: 10,
    gap: 6,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00ffaa',
    borderRadius: 4,
  },
  progressPercent: {
    color: '#38bdf8',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  btnRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#00ffaa',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryBtnText: {
    color: '#030712',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
