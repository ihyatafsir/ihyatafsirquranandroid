import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  currentVerseKey: string | null;
  currentTimeMs: number;
  durationMs: number;
  isAyahLooping: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onSeekRelative: (deltaMs: number) => void;
  onNextAyah: () => void;
  onPrevAyah: () => void;
  onToggleLoop: () => void;
  onChangeSpeed: () => void;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  currentVerseKey,
  currentTimeMs,
  durationMs,
  isAyahLooping,
  playbackSpeed,
  onPlayPause,
  onSeekRelative,
  onNextAyah,
  onPrevAyah,
  onToggleLoop,
  onChangeSpeed,
}) => {
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(Math.max(0, ms) / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = durationMs > 0 ? Math.min(100, (currentTimeMs / durationMs) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Progress Line */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Primary Control Ribbon */}
      <View style={styles.controlsRow}>
        {/* Previous Ayah */}
        <TouchableOpacity onPress={onPrevAyah} style={styles.iconButton}>
          <Text style={styles.navIconText}>⏮</Text>
        </TouchableOpacity>

        {/* -5s Seek */}
        <TouchableOpacity onPress={() => onSeekRelative(-5000)} style={styles.iconButton}>
          <Text style={styles.seekText}>-5s</Text>
        </TouchableOpacity>

        {/* Master Play / Pause Orb */}
        <TouchableOpacity onPress={onPlayPause} style={styles.playPauseOrb}>
          <Text style={styles.playPauseIcon}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* +5s Seek */}
        <TouchableOpacity onPress={() => onSeekRelative(5000)} style={styles.iconButton}>
          <Text style={styles.seekText}>+5s</Text>
        </TouchableOpacity>

        {/* Next Ayah */}
        <TouchableOpacity onPress={onNextAyah} style={styles.iconButton}>
          <Text style={styles.navIconText}>⏭</Text>
        </TouchableOpacity>

        {/* Ayah Loop Button */}
        <TouchableOpacity
          onPress={onToggleLoop}
          style={[
            styles.loopBadge,
            isAyahLooping ? styles.loopBadgeActive : styles.loopBadgeInactive
          ]}
        >
          <Text style={[styles.loopText, { color: isAyahLooping ? '#00ffaa' : '#94a3b8' }]}>
            🔁 {isAyahLooping ? 'تكرار الآية ✓' : 'تكرار'}
          </Text>
        </TouchableOpacity>

        {/* Playback Speed */}
        <TouchableOpacity onPress={onChangeSpeed} style={styles.speedBadge}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      {/* Time & Active Ayah Indicator */}
      <View style={styles.metaRow}>
        <Text style={styles.timeText}>{formatTime(currentTimeMs)}</Text>
        {currentVerseKey && (
          <Text style={styles.ayahTag}>آية {currentVerseKey.split(':')[1]}</Text>
        )}
        <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 170, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00ffaa',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 6,
  },
  navIconText: {
    color: '#94a3b8',
    fontSize: 18,
  },
  seekText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playPauseOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00ffaa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ffaa',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playPauseIcon: {
    color: '#040711',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loopBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  loopBadgeActive: {
    backgroundColor: 'rgba(0, 255, 170, 0.25)',
    borderColor: '#00ffaa',
  },
  loopBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  loopText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  speedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  speedText: {
    color: '#00ffaa',
    fontSize: 11,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    color: '#64748b',
    fontSize: 10,
  },
  ayahTag: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
