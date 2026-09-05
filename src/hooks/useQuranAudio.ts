import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { mediaNotificationService } from '../services/mediaNotificationService';
import { ReciterConfig, SurahMetadata } from '../types/quran';

export const RECITERS: ReciterConfig[] = [
  { id: 'abdulbasit', name: 'Abdul Basit (Murattal)', url: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/', letterSync: true },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', url: 'https://everyayah.com/data/Husary_128kbps/', letterSync: true },
  { id: 'minshawi', name: 'Mohamed Siddiq Al-Minshawi', url: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/', letterSync: true },
  { id: 'alafasy', name: 'Mishary Rashid Alafasy', url: 'https://everyayah.com/data/Alafasy_128kbps/', letterSync: false },
  { id: 'mah', name: 'Muhammad Ayub Asif (MAH)', url: '', letterSync: true },
];

function padZero(num: number, size: number = 3): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

export function useQuranAudio(selectedReciterId: string) {
  const soundRef = useRef<Audio.Sound | null>(null);
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

  const getAudioUrl = (surah: number, ayah: number, reciterId: string): string => {
    const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];
    return `${reciter.url}${padZero(surah)}${padZero(ayah)}.mp3`;
  };

  const playVerse = useCallback(async (surah: number, ayah: number, surahMeta?: SurahMetadata) => {
    try {
      activeSurahRef.current = surah;
      activeAyahRef.current = ayah;
      if (surahMeta) {
        totalAyahsRef.current = surahMeta.numberOfAyahs;
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const audioUri = getAudioUrl(surah, ayah, selectedReciterId);
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, rate: playbackSpeed, progressUpdateIntervalMillis: 30 },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setCurrentVerseKey(`${surah}:${ayah}`);

      // Publish media notification
      const reciter = RECITERS.find(r => r.id === selectedReciterId) || RECITERS[0];
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

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ('error' in status && status.error) {
        setIsPlaying(false);
      }
      return;
    }

    setCurrentTimeMs(status.positionMillis || 0);
    setDurationMs(status.durationMillis || 0);
    setIsPlaying(status.isPlaying);

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
        mediaNotificationService.setPlaybackState(false);
      }
    }
  };

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
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTimeMs(0);
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
      } catch (e) {}
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
    toggleAyahLoop,
    cyclePlaybackSpeed,
  };
}
