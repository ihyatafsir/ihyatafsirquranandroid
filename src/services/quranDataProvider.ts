import { Platform, NativeModules } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { SurahMetadata, Verse, LetterTimingEntry } from '../types/quran';
import surahsMetadata from '../../assets/surahs.json';

// Static asset references (treated as raw binary assets by Metro via metro.config.js)
const SURAH_ASSETS: { [key: number]: any } = {
  1: require("../../assets/surahs_chunks/surah_1.dat"),
  2: require("../../assets/surahs_chunks/surah_2.dat"),
  3: require("../../assets/surahs_chunks/surah_3.dat"),
  4: require("../../assets/surahs_chunks/surah_4.dat"),
  5: require("../../assets/surahs_chunks/surah_5.dat"),
  6: require("../../assets/surahs_chunks/surah_6.dat"),
  7: require("../../assets/surahs_chunks/surah_7.dat"),
  8: require("../../assets/surahs_chunks/surah_8.dat"),
  9: require("../../assets/surahs_chunks/surah_9.dat"),
  10: require("../../assets/surahs_chunks/surah_10.dat"),
  11: require("../../assets/surahs_chunks/surah_11.dat"),
  12: require("../../assets/surahs_chunks/surah_12.dat"),
  13: require("../../assets/surahs_chunks/surah_13.dat"),
  14: require("../../assets/surahs_chunks/surah_14.dat"),
  15: require("../../assets/surahs_chunks/surah_15.dat"),
  16: require("../../assets/surahs_chunks/surah_16.dat"),
  17: require("../../assets/surahs_chunks/surah_17.dat"),
  18: require("../../assets/surahs_chunks/surah_18.dat"),
  19: require("../../assets/surahs_chunks/surah_19.dat"),
  20: require("../../assets/surahs_chunks/surah_20.dat"),
  21: require("../../assets/surahs_chunks/surah_21.dat"),
  22: require("../../assets/surahs_chunks/surah_22.dat"),
  23: require("../../assets/surahs_chunks/surah_23.dat"),
  24: require("../../assets/surahs_chunks/surah_24.dat"),
  25: require("../../assets/surahs_chunks/surah_25.dat"),
  26: require("../../assets/surahs_chunks/surah_26.dat"),
  27: require("../../assets/surahs_chunks/surah_27.dat"),
  28: require("../../assets/surahs_chunks/surah_28.dat"),
  29: require("../../assets/surahs_chunks/surah_29.dat"),
  30: require("../../assets/surahs_chunks/surah_30.dat"),
  31: require("../../assets/surahs_chunks/surah_31.dat"),
  32: require("../../assets/surahs_chunks/surah_32.dat"),
  33: require("../../assets/surahs_chunks/surah_33.dat"),
  34: require("../../assets/surahs_chunks/surah_34.dat"),
  35: require("../../assets/surahs_chunks/surah_35.dat"),
  36: require("../../assets/surahs_chunks/surah_36.dat"),
  37: require("../../assets/surahs_chunks/surah_37.dat"),
  38: require("../../assets/surahs_chunks/surah_38.dat"),
  39: require("../../assets/surahs_chunks/surah_39.dat"),
  40: require("../../assets/surahs_chunks/surah_40.dat"),
  41: require("../../assets/surahs_chunks/surah_41.dat"),
  42: require("../../assets/surahs_chunks/surah_42.dat"),
  43: require("../../assets/surahs_chunks/surah_43.dat"),
  44: require("../../assets/surahs_chunks/surah_44.dat"),
  45: require("../../assets/surahs_chunks/surah_45.dat"),
  46: require("../../assets/surahs_chunks/surah_46.dat"),
  47: require("../../assets/surahs_chunks/surah_47.dat"),
  48: require("../../assets/surahs_chunks/surah_48.dat"),
  49: require("../../assets/surahs_chunks/surah_49.dat"),
  50: require("../../assets/surahs_chunks/surah_50.dat"),
  51: require("../../assets/surahs_chunks/surah_51.dat"),
  52: require("../../assets/surahs_chunks/surah_52.dat"),
  53: require("../../assets/surahs_chunks/surah_53.dat"),
  54: require("../../assets/surahs_chunks/surah_54.dat"),
  55: require("../../assets/surahs_chunks/surah_55.dat"),
  56: require("../../assets/surahs_chunks/surah_56.dat"),
  57: require("../../assets/surahs_chunks/surah_57.dat"),
  58: require("../../assets/surahs_chunks/surah_58.dat"),
  59: require("../../assets/surahs_chunks/surah_59.dat"),
  60: require("../../assets/surahs_chunks/surah_60.dat"),
  61: require("../../assets/surahs_chunks/surah_61.dat"),
  62: require("../../assets/surahs_chunks/surah_62.dat"),
  63: require("../../assets/surahs_chunks/surah_63.dat"),
  64: require("../../assets/surahs_chunks/surah_64.dat"),
  65: require("../../assets/surahs_chunks/surah_65.dat"),
  66: require("../../assets/surahs_chunks/surah_66.dat"),
  67: require("../../assets/surahs_chunks/surah_67.dat"),
  68: require("../../assets/surahs_chunks/surah_68.dat"),
  69: require("../../assets/surahs_chunks/surah_69.dat"),
  70: require("../../assets/surahs_chunks/surah_70.dat"),
  71: require("../../assets/surahs_chunks/surah_71.dat"),
  72: require("../../assets/surahs_chunks/surah_72.dat"),
  73: require("../../assets/surahs_chunks/surah_73.dat"),
  74: require("../../assets/surahs_chunks/surah_74.dat"),
  75: require("../../assets/surahs_chunks/surah_75.dat"),
  76: require("../../assets/surahs_chunks/surah_76.dat"),
  77: require("../../assets/surahs_chunks/surah_77.dat"),
  78: require("../../assets/surahs_chunks/surah_78.dat"),
  79: require("../../assets/surahs_chunks/surah_79.dat"),
  80: require("../../assets/surahs_chunks/surah_80.dat"),
  81: require("../../assets/surahs_chunks/surah_81.dat"),
  82: require("../../assets/surahs_chunks/surah_82.dat"),
  83: require("../../assets/surahs_chunks/surah_83.dat"),
  84: require("../../assets/surahs_chunks/surah_84.dat"),
  85: require("../../assets/surahs_chunks/surah_85.dat"),
  86: require("../../assets/surahs_chunks/surah_86.dat"),
  87: require("../../assets/surahs_chunks/surah_87.dat"),
  88: require("../../assets/surahs_chunks/surah_88.dat"),
  89: require("../../assets/surahs_chunks/surah_89.dat"),
  90: require("../../assets/surahs_chunks/surah_90.dat"),
  91: require("../../assets/surahs_chunks/surah_91.dat"),
  92: require("../../assets/surahs_chunks/surah_92.dat"),
  93: require("../../assets/surahs_chunks/surah_93.dat"),
  94: require("../../assets/surahs_chunks/surah_94.dat"),
  95: require("../../assets/surahs_chunks/surah_95.dat"),
  96: require("../../assets/surahs_chunks/surah_96.dat"),
  97: require("../../assets/surahs_chunks/surah_97.dat"),
  98: require("../../assets/surahs_chunks/surah_98.dat"),
  99: require("../../assets/surahs_chunks/surah_99.dat"),
  100: require("../../assets/surahs_chunks/surah_100.dat"),
  101: require("../../assets/surahs_chunks/surah_101.dat"),
  102: require("../../assets/surahs_chunks/surah_102.dat"),
  103: require("../../assets/surahs_chunks/surah_103.dat"),
  104: require("../../assets/surahs_chunks/surah_104.dat"),
  105: require("../../assets/surahs_chunks/surah_105.dat"),
  106: require("../../assets/surahs_chunks/surah_106.dat"),
  107: require("../../assets/surahs_chunks/surah_107.dat"),
  108: require("../../assets/surahs_chunks/surah_108.dat"),
  109: require("../../assets/surahs_chunks/surah_109.dat"),
  110: require("../../assets/surahs_chunks/surah_110.dat"),
  111: require("../../assets/surahs_chunks/surah_111.dat"),
  112: require("../../assets/surahs_chunks/surah_112.dat"),
  113: require("../../assets/surahs_chunks/surah_113.dat"),
  114: require("../../assets/surahs_chunks/surah_114.dat"),
};

interface SurahDataPayload {
  surah: number;
  verses: Verse[];
  warshVerses?: Verse[];
  tafsir: { [ayah: string]: any[] };
  wordTiming: { [reciter: string]: any };
  letterTiming: { [reciter: string]: any };
}

// In-memory LRU cache: holds up to 3 active Surahs in RAM
const surahCache = new Map<number, SurahDataPayload>();
const MAX_CACHE_SIZE = 3;

const normalizedSurahs: SurahMetadata[] = (surahsMetadata as any[]).map(s => ({
  number: s.number,
  name: s.arabic || s.name,
  englishName: s.name || s.englishName,
  arabic: s.arabic || s.name,
  type: s.type || s.revelationType || 'Meccan',
  revelationType: s.type || s.revelationType || 'Meccan',
  verses: s.verses || s.numberOfAyahs || 7,
  numberOfAyahs: s.verses || s.numberOfAyahs || 7,
  englishNameTranslation: s.englishNameTranslation || s.name || '',
}));

export class QuranDataProvider {
  public static getAllSurahs(): SurahMetadata[] {
    return normalizedSurahs;
  }

  public static getSurahMetadata(surahNumber: number): SurahMetadata | undefined {
    return normalizedSurahs.find(s => s.number === surahNumber);
  }

  public static async loadSurah(surahNumber: number): Promise<SurahDataPayload> {
    if (surahCache.has(surahNumber)) {
      const cached = surahCache.get(surahNumber)!;
      surahCache.delete(surahNumber);
      surahCache.set(surahNumber, cached);
      return cached;
    }

    let jsonStr = '';

    // 1. Native Android Asset Reader (Instantaneous, 100% offline from APK assets/ directory)
    if (Platform.OS === 'android' && NativeModules.AssetReader) {
      try {
        jsonStr = await NativeModules.AssetReader.readAsset(`surahs/surah_${surahNumber}.dat`);
      } catch (nativeErr) {
        console.warn(`[QuranDataProvider] Native AssetReader failed:`, nativeErr);
      }
    }

    // 2. Fallbacks for Web / Development
    if (!jsonStr) {
      const assetModule = SURAH_ASSETS[surahNumber];
      if (!assetModule) {
        throw new Error();
      }

      try {
        if (Platform.OS === 'web') {
          const asset = Asset.fromModule(assetModule);
          await asset.downloadAsync();
          const res = await fetch(asset.uri);
          jsonStr = await res.text();
        } else {
          const [asset] = await Asset.loadAsync(assetModule);
          const uri = asset.localUri || asset.uri;
          if (uri && uri.startsWith('file://')) {
            jsonStr = await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
          } else {
            const res = await fetch(uri);
            jsonStr = await res.text();
          }
        }
      } catch (e) {
        // Fallback: direct fetch
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        const res = await fetch(asset.uri);
        jsonStr = await res.text();
      }
    }

    const data: SurahDataPayload = JSON.parse(jsonStr);

    if (surahCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = surahCache.keys().next().value;
      if (oldestKey !== undefined) {
        surahCache.delete(oldestKey);
      }
    }

    surahCache.set(surahNumber, data);
    return data;
  }

  public static async getVerses(surahNumber: number, narration?: 'hafs' | 'warsh'): Promise<Verse[]> {
    const data = await this.loadSurah(surahNumber);
    if (narration === 'warsh' && data.warshVerses && data.warshVerses.length > 0) {
      return data.warshVerses;
    }
    return data.verses;
  }

  public static async getWordTiming(reciter: string, surahNumber: number): Promise<{ [key: string]: any[] }> {
    const data = await this.loadSurah(surahNumber);
    return (data.wordTiming && data.wordTiming[reciter]) || {};
  }

  public static async getLetterTiming(reciter: string, surahNumber: number): Promise<{ [key: string]: LetterTimingEntry[] }> {
    const data = await this.loadSurah(surahNumber);
    return (data.letterTiming && data.letterTiming[reciter]) || {};
  }

  public static async getTafsir(surahNumber: number, ayahNumber: number): Promise<any[] | null> {
    const data = await this.loadSurah(surahNumber);
    return (data.tafsir && data.tafsir[String(ayahNumber)]) || null;
  }

  public static preloadSurah(surahNumber: number): void {
    if (surahNumber >= 1 && surahNumber <= 114 && !surahCache.has(surahNumber)) {
      this.loadSurah(surahNumber).catch(() => {});
    }
  }
}
