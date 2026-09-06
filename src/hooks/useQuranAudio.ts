import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { mediaNotificationService } from '../services/mediaNotificationService';
import { ReciterConfig, SurahMetadata } from '../types/quran';
import mahVerseTimingsData from '../../assets/mah_verse_timings.json';

export const RECITERS: ReciterConfig[] = [
  { id: 'abdulbasit', name: 'Abdul Basit (Murattal)', url: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/', narration: 'hafs', letterSync: true },
  { id: 'abdulbasit_warsh', name: 'Abdul Basit (Warsh - ورش)', url: 'https://everyayah.com/data/warsh/warsh_Abdul_Basit_128kbps/', narration: 'warsh', letterSync: true },
  { id: 'minshawi', name: 'Mohamed Siddiq Al-Minshawi', url: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/', narration: 'hafs', letterSync: true },
  { id: 'mah', name: 'Mohammad Ahmed Hussein (محمد أحمد حسين - MAH)', url: 'https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/', narration: 'hafs', letterSync: true },
];

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

const mahTimingsMap = (mahVerseTimingsData as unknown) as { [surah: string]: [number, number, number][] };

function padZero(num: number, size: number = 3): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

export function useQuranAudio(selectedReciterId: string) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadedSurahFileRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [currentVerseKey, setCurrentVerseKey] = useState<string | null>(null);
  const [isAyahLooping, setIsAyahLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const activeSurahRef = useRef<number>(1);
  const activeAyahRef = useRef<number>(1);
  const totalAyahsRef = useRef<number>(7);
  const isLoopingRef = useRef<boolean>(false);
  isLoopingRef.current = isAyahLooping;

  // Initialize background audio mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      mediaNotificationService.clear();
    };
  }, []);

  // Stop audio and clear state on reciter switch
  useEffect(() => {
    stopAudio();
  }, [selectedReciterId]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ('error' in status && status.error) {
        setIsPlaying(false);
      }
      return;
    }

    const pos = status.positionMillis || 0;
    setCurrentTimeMs(pos);
    setDurationMs(status.durationMillis || 0);
    setIsPlaying(status.isPlaying);

    // Continuous MAH verse tracking across the whole-surah audio file
    if (selectedReciterId === 'mah') {
      const mahTimings = mahTimingsMap[String(activeSurahRef.current)];
      if (mahTimings && mahTimings.length > 0) {
        const curAyah = mahTimings.find(t => pos >= t[1] && pos < t[2]);
        if (curAyah && curAyah[0] !== activeAyahRef.current) {
          activeAyahRef.current = curAyah[0];
          setCurrentVerseKey(`${activeSurahRef.current}:${curAyah[0]}`);
          const reciter = RECITERS.find(r => r.id === selectedReciterId) || RECITERS[0];
          mediaNotificationService.updateMetadata({
            surahNumber: activeSurahRef.current,
            surahName: `سورة ${activeSurahRef.current}`,
            ayahNumber: curAyah[0],
            reciterName: reciter.name,
            isPlaying: status.isPlaying,
          });
        }
      }
    }

    if (status.didJustFinish) {
      handleVerseFinished();
    }
  };

  const handleVerseFinished = () => {
    if (isLoopingRef.current) {
      // Loop same verse
      playVerse(activeSurahRef.current, activeAyahRef.current);
    } else {
      // Advance to next verse in Surah
      if (activeAyahRef.current < totalAyahsRef.current) {
        playVerse(activeSurahRef.current, activeAyahRef.current + 1);
      } else {
        // Surah completed
        setIsPlaying(false);
        setCurrentTimeMs(0);
        setCurrentVerseKey(null);
        mediaNotificationService.setPlaybackState(false);
      }
    }
  };

  const playVerse = useCallback(async (surah: number, ayah: number, surahMeta?: SurahMetadata, startOffsetMs?: number) => {
    try {
      activeSurahRef.current = surah;
      activeAyahRef.current = ayah;
      if (surahMeta) {
        totalAyahsRef.current = surahMeta.numberOfAyahs;
      }

      // Check if MAH has dedicated Surah audio
      const isMah = selectedReciterId === 'mah';
      const mahFile = isMah ? MAH_SURAH_AUDIO[surah] : undefined;
      const mahTimings = isMah ? mahTimingsMap[String(surah)] : undefined;

      if (isMah && mahFile && mahTimings) {
        const targetAyahTiming = mahTimings.find(t => t[0] === ayah);
        const ayahStartMs = targetAyahTiming ? targetAyahTiming[1] : 0;
        const startMs = ayahStartMs + (startOffsetMs || 0);

        // If this Surah file is ALREADY loaded in player, just seek directly without reloading!
        if (soundRef.current && loadedSurahFileRef.current === mahFile) {
          await soundRef.current.setPositionAsync(startMs);
          await soundRef.current.playAsync();
          setIsPlaying(true);
          setCurrentVerseKey(`${surah}:${ayah}`);
          return;
        }

        // Otherwise, load new Surah file
        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }

        const audioUri = `https://raw.githubusercontent.com/ihyatafsir/mah-audio/main/${mahFile}`;
        loadedSurahFileRef.current = mahFile;

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, positionMillis: startMs, rate: playbackSpeed, progressUpdateIntervalMillis: 30 },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;
        setIsPlaying(true);
        setCurrentVerseKey(`${surah}:${ayah}`);

        const reciter = RECITERS.find(r => r.id === selectedReciterId) || RECITERS[0];
        mediaNotificationService.updateMetadata({
          surahNumber: surah,
          surahName: surahMeta ? surahMeta.name : `سورة ${surah}`,
          ayahNumber: ayah,
          reciterName: reciter.name,
          isPlaying: true,
        });
        return;
      }

      // Standard EveryAyah reciters (or MAH fallback for non-recorded Surahs)
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      loadedSurahFileRef.current = null;

      const reciter = RECITERS.find(r => r.id === selectedReciterId) || RECITERS[0];
      const audioUri = `${reciter.url}${padZero(surah)}${padZero(ayah)}.mp3`;
      const startMs = startOffsetMs || 0;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, positionMillis: startMs, rate: playbackSpeed, progressUpdateIntervalMillis: 30 },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setCurrentVerseKey(`${surah}:${ayah}`);

      mediaNotificationService.updateMetadata({
        surahNumber: surah,
        surahName: surahMeta ? surahMeta.name : `سورة ${surah}`,
        ayahNumber: ayah,
        reciterName: reciter.name,
        isPlaying: true,
      });
    } catch (err) {
      setIsPlaying(false);
    }
  }, [selectedReciterId, playbackSpeed]);

  const pauseAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      mediaNotificationService.setPlaybackState(false);
    }
  };

  const resumeAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      mediaNotificationService.setPlaybackState(true);
    } else {
      playVerse(activeSurahRef.current, activeAyahRef.current);
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    loadedSurahFileRef.current = null;
    setIsPlaying(false);
    setCurrentTimeMs(0);
    setCurrentVerseKey(null);
    mediaNotificationService.setPlaybackState(false);
  };

  const seekRelative = async (deltaMs: number) => {
    if (soundRef.current) {
      const st = await soundRef.current.getStatusAsync();
      if (st.isLoaded) {
        const nextPos = Math.max(0, Math.min(st.durationMillis || 0, (st.positionMillis || 0) + deltaMs));
        await soundRef.current.setPositionAsync(nextPos);
      }
    }
  };

  const seekToMs = async (targetMs: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(Math.max(0, targetMs));
      } catch (seekErr) {
        console.warn("Audio setPositionAsync error:", seekErr);
      }
    }
  };

  const toggleAyahLoop = () => {
    setIsAyahLooping(prev => !prev);
  };

  const cyclePlaybackSpeed = async () => {
    const speeds = [1.0, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const next = speeds[nextIdx];
    setPlaybackSpeed(next);
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(next, true);
      } catch (rateErr) {
        console.warn("Audio setRateAsync error:", rateErr);
      }
    }
  };

  return {
    isPlaying,
    currentTimeMs,
    durationMs,
    currentVerseKey,
    isAyahLooping,
    playbackSpeed,
    playVerse,
    pauseAudio,
    resumeAudio,
    stopAudio,
    seekRelative,
    seekToMs,
    toggleAyahLoop,
    cyclePlaybackSpeed,
  };
}
