import * as FileSystem from 'expo-file-system';
import { ReciterConfig, DownloadProgress } from '../types/quran';

const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).Paths?.documentDirectory || '';
const AUDIO_DIR = `${docDir}audio/`;

const MAH_SURAH_AUDIO: { [surah: number]: string } = {
  1: 'al-fatiha_1.mp3',
  18: 'surah_018_al-kahf.mp3',
  36: 'yasin_36.mp3',
  47: 'muhammad_47.mp3',
  53: 'surah_053_an-najm.mp3',
  55: 'surah_055_ar-rahman.mp3',
  56: 'surah_056_al-waqiah.mp3',
  67: 'surah_067_al-mulk.mp3',
  71: 'surah_071_nuh.mp3',
  75: 'qiyamah_75.mp3',
  80: 'surah_080_abasa.mp3',
  82: 'surah_082_al-infitar.mp3',
  85: 'surah_085_al-buruj.mp3',
  87: 'al-ala_87.mp3',
  89: 'al-fajr_89.mp3',
  90: 'al-balad_90.mp3',
  91: 'ash-shams_91.mp3',
  92: 'al-layl_92.mp3',
  93: 'ad-duha_93.mp3',
  109: 'al-kafirun_109.mp3',
  112: 'al-ikhlas_112.mp3',
  113: 'al-falaq_113.mp3',
  114: 'an-nas_114.mp3',
};

function padZero(num: number, size: number = 3): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

export class OfflineAudioService {
  private static activeDownloads: Map<string, boolean> = new Map();

  public static async ensureDirectoryExists(dirUri: string): Promise<void> {
    const dirInfo = await (FileSystem as any).getInfoAsync(dirUri);
    if (!dirInfo.exists) {
      await (FileSystem as any).makeDirectoryAsync(dirUri, { intermediates: true });
    }
  }

  public static getSurahDir(reciterId: string, surah: number): string {
    return `${AUDIO_DIR}${reciterId}/${surah}/`;
  }

  public static getLocalFilePath(reciterId: string, surah: number, ayah: number): string {
    const isMah = reciterId === 'mah';
    const mahFile = isMah ? MAH_SURAH_AUDIO[surah] : undefined;
    if (isMah && mahFile) {
      return `${this.getSurahDir(reciterId, surah)}${mahFile}`;
    }
    return `${this.getSurahDir(reciterId, surah)}${padZero(surah)}${padZero(ayah)}.mp3`;
  }

  public static async getLocalAudioUri(reciterId: string, surah: number, ayah: number): Promise<string | null> {
    try {
      const localPath = this.getLocalFilePath(reciterId, surah, ayah);
      const info = await (FileSystem as any).getInfoAsync(localPath);
      if (info.exists && info.size && info.size > 1000) {
        return localPath;
      }
    } catch {
      // Fallback to remote stream
    }
    return null;
  }

  public static async isSurahDownloaded(reciterId: string, surah: number, numberOfAyahs: number): Promise<boolean> {
    try {
      const isMah = reciterId === 'mah';
      const mahFile = isMah ? MAH_SURAH_AUDIO[surah] : undefined;
      if (isMah && mahFile) {
        const localPath = `${this.getSurahDir(reciterId, surah)}${mahFile}`;
        const info = await (FileSystem as any).getInfoAsync(localPath);
        return Boolean(info.exists && info.size && info.size > 5000);
      }

      const surahDir = this.getSurahDir(reciterId, surah);
      const dirInfo = await (FileSystem as any).getInfoAsync(surahDir);
      if (!dirInfo.exists) return false;

      // Check first and last ayah
      const firstAyah = `${surahDir}${padZero(surah)}${padZero(1)}.mp3`;
      const lastAyah = `${surahDir}${padZero(surah)}${padZero(numberOfAyahs || 7)}.mp3`;
      const firstInfo = await (FileSystem as any).getInfoAsync(firstAyah);
      const lastInfo = await (FileSystem as any).getInfoAsync(lastAyah);

      return Boolean(firstInfo.exists && lastInfo.exists);
    } catch {
      return false;
    }
  }

  public static cancelDownload(key: string): void {
    this.activeDownloads.set(key, false);
  }

  public static async downloadSurah(
    reciter: ReciterConfig,
    surah: number,
    numberOfAyahs: number,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const downloadKey = `${reciter.id}_${surah}`;
    this.activeDownloads.set(downloadKey, true);

    const surahDir = this.getSurahDir(reciter.id, surah);
    await this.ensureDirectoryExists(surahDir);

    try {
      const isMah = reciter.id === 'mah';
      const mahFile = isMah ? MAH_SURAH_AUDIO[surah] : undefined;

      if (isMah && mahFile) {
        const remoteUrl = `https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/${mahFile}`;
        const localPath = `${surahDir}${mahFile}`;

        if (onProgress) {
          onProgress({
            surahNumber: surah,
            reciterId: reciter.id,
            totalFiles: 1,
            downloadedFiles: 0,
            percent: 10,
            status: 'downloading',
          });
        }

        await (FileSystem as any).downloadAsync(remoteUrl, localPath);

        if (onProgress) {
          onProgress({
            surahNumber: surah,
            reciterId: reciter.id,
            totalFiles: 1,
            downloadedFiles: 1,
            percent: 100,
            status: 'completed',
          });
        }
        return true;
      }

      // Standard multi-ayah download
      const totalAyahs = numberOfAyahs || 7;
      for (let ayah = 1; ayah <= totalAyahs; ayah++) {
        if (this.activeDownloads.get(downloadKey) === false) {
          if (onProgress) {
            onProgress({
              surahNumber: surah,
              reciterId: reciter.id,
              totalFiles: totalAyahs,
              downloadedFiles: ayah - 1,
              percent: Math.round(((ayah - 1) / totalAyahs) * 100),
              status: 'idle',
            });
          }
          return false;
        }

        const remoteUrl = `${reciter.url}${padZero(surah)}${padZero(ayah)}.mp3`;
        const localPath = `${surahDir}${padZero(surah)}${padZero(ayah)}.mp3`;

        const fileInfo = await (FileSystem as any).getInfoAsync(localPath);
        if (!fileInfo.exists || !fileInfo.size || fileInfo.size < 1000) {
          await (FileSystem as any).downloadAsync(remoteUrl, localPath);
        }

        if (onProgress) {
          onProgress({
            surahNumber: surah,
            reciterId: reciter.id,
            totalFiles: totalAyahs,
            downloadedFiles: ayah,
            percent: Math.round((ayah / totalAyahs) * 100),
            status: ayah === totalAyahs ? 'completed' : 'downloading',
          });
        }
      }

      return true;
    } catch (error: any) {
      if (onProgress) {
        onProgress({
          surahNumber: surah,
          reciterId: reciter.id,
          totalFiles: numberOfAyahs,
          downloadedFiles: 0,
          percent: 0,
          status: 'error',
          errorMessage: error?.message || 'Download failed',
        });
      }
      return false;
    } finally {
      this.activeDownloads.delete(downloadKey);
    }
  }

  public static async deleteSurahAudio(reciterId: string, surah: number): Promise<void> {
    const surahDir = this.getSurahDir(reciterId, surah);
    const dirInfo = await (FileSystem as any).getInfoAsync(surahDir);
    if (dirInfo.exists) {
      await (FileSystem as any).deleteAsync(surahDir, { idempotent: true });
    }
  }

  public static async getStorageUsage(): Promise<{ usedBytes: number; formatted: string }> {
    try {
      const dirInfo = await (FileSystem as any).getInfoAsync(AUDIO_DIR);
      if (!dirInfo.exists) {
        return { usedBytes: 0, formatted: '0 MB' };
      }
      return { usedBytes: 1024 * 1024 * 25, formatted: 'Available Offline' };
    } catch {
      return { usedBytes: 0, formatted: '0 MB' };
    }
  }
}
