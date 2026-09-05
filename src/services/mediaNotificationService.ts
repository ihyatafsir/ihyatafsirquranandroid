import { Platform } from 'react-native';

export interface MediaMetadata {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  reciterName: string;
  isPlaying: boolean;
}

class MediaNotificationService {
  private activeMetadata: MediaMetadata | null = null;

  public updateMetadata(metadata: MediaMetadata): void {
    this.activeMetadata = metadata;
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `سورة ${metadata.surahName} — آية ${metadata.ayahNumber}`,
            artist: metadata.reciterName,
            album: 'إحياء تفسير القرآن',
          });
          navigator.mediaSession.playbackState = metadata.isPlaying ? 'playing' : 'paused';
        } catch (e) {
          // Graceful fallback for non-supported browsers
        }
      }
    }
  }

  public setPlaybackState(isPlaying: boolean): void {
    if (this.activeMetadata) {
      this.activeMetadata.isPlaying = isPlaying;
      this.updateMetadata(this.activeMetadata);
    }
  }

  public clear(): void {
    this.activeMetadata = null;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch (e) {}
    }
  }
}

export const mediaNotificationService = new MediaNotificationService();
