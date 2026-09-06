import { useState, useEffect } from 'react';
import { Verse, LetterTimingEntry } from '../types/quran';
import { QuranDataProvider } from '../services/quranDataProvider';

export function useSurahData(surahNumber: number, reciter: string) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [wordTimingMap, setWordTimingMap] = useState<{ [key: string]: any[] }>({});
  const [letterTimingMap, setLetterTimingMap] = useState<{ [key: string]: LetterTimingEntry[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchData() {
      try {
        const data = await QuranDataProvider.loadSurah(surahNumber);
        if (!isMounted) return;

        const isWarsh = reciter.toLowerCase().includes('warsh');
        if (isWarsh && data.warshVerses && data.warshVerses.length > 0) {
          setVerses(data.warshVerses);
        } else {
          setVerses(data.verses || []);
        }

        // Resolve active reciter timings (fallback to abdulbasit if reciter lacks timing for this surah)
        const wt = (data.wordTiming && (data.wordTiming[reciter] || data.wordTiming['abdulbasit'])) || {};
        const lt = (data.letterTiming && (data.letterTiming[reciter] || data.letterTiming['abdulbasit'])) || {};

        setWordTimingMap(wt);
        setLetterTimingMap(lt);
        setLoading(false);

        // Preload adjacent Surah (next Surah) in the background for instant navigation
        if (surahNumber < 114) {
          QuranDataProvider.preloadSurah(surahNumber + 1);
        }
      } catch (err: any) {
        console.error(`[useSurahData] Error loading Surah ${surahNumber}:`, err);
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [surahNumber, reciter]);

  const getTafsir = async (ayahNumber: number) => {
    return await QuranDataProvider.getTafsir(surahNumber, ayahNumber);
  };

  return {
    verses,
    wordTimingMap,
    letterTimingMap,
    loading,
    error,
    getTafsir,
  };
}
