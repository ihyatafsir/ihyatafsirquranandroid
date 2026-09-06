import { Audio } from 'expo-av';

let wordSoundInstance: Audio.Sound | null = null;

export async function playLetterPhoneticAudio(
  letterGrapheme: string,
  letterArabicName?: string,
  mode: 'smart' | 'name' | 'vowel' = 'smart'
): Promise<void> {
  try {
    if (wordSoundInstance) {
      try {
        await wordSoundInstance.stopAsync();
        await wordSoundInstance.unloadAsync();
      } catch (unloadErr) {
        console.warn("Error unloading wordSoundInstance:", unloadErr);
      }
      wordSoundInstance = null;
    }

    let textToSpeak = '';

    if (mode === 'name') {
      textToSpeak = letterArabicName || letterGrapheme || 'أَلِف';
    } else {
      const cleanGrapheme = (letterGrapheme || '').trim();
      const baseChar = cleanGrapheme.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').trim();

      const hasFathah = cleanGrapheme.includes('َ');
      const hasKasrah = cleanGrapheme.includes('ِ');
      const hasDammah = cleanGrapheme.includes('ُ');
      const hasDaggerAlif = cleanGrapheme.includes('ٰ');
      const hasMaddah = cleanGrapheme.includes('ٓ');
      const hasSukun = cleanGrapheme.includes('ْ');
      const hasTanweenFath = cleanGrapheme.includes('ً');
      const hasTanweenKasr = cleanGrapheme.includes('ٍ');
      const hasTanweenDamm = cleanGrapheme.includes('ٌ');
      const hasTanween = hasTanweenFath || hasTanweenKasr || hasTanweenDamm;

      if (mode === 'vowel' && hasSukun) {
        textToSpeak = baseChar ? `أَ${baseChar}ْ` : (letterArabicName || 'أَلِف');
      } else if (hasDaggerAlif || hasMaddah) {
        textToSpeak = baseChar ? `${baseChar}ا` : (letterArabicName || 'أَلِف');
      } else if (hasKasrah && !hasSukun) {
        textToSpeak = baseChar ? `${baseChar}ِي` : 'إِي';
      } else if (hasDammah && !hasSukun) {
        textToSpeak = baseChar ? `${baseChar}ُو` : 'أُو';
      } else if (hasFathah && !hasSukun) {
        textToSpeak = `${baseChar}َ`;
      } else if (hasTanweenFath) {
        textToSpeak = baseChar ? `${baseChar}ًا` : (letterArabicName || 'أَلِف');
      } else if (hasTanweenKasr) {
        textToSpeak = baseChar ? `${baseChar}ٍ` : (letterArabicName || 'أَلِف');
      } else if (hasTanweenDamm) {
        textToSpeak = baseChar ? `${baseChar}ٌ` : (letterArabicName || 'أَلِف');
      } else if (hasSukun || (!hasFathah && !hasKasrah && !hasDammah && !hasTanween)) {
        textToSpeak = letterArabicName || (baseChar ? `أَ${baseChar}ْ` : 'أَلِف');
      } else {
        textToSpeak = letterArabicName || cleanGrapheme || 'أَلِف';
      }
    }

    if (!textToSpeak || textToSpeak.length === 0) {
      textToSpeak = letterArabicName || 'أَلِف';
    }

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=${encodeURIComponent(textToSpeak)}`;
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, progressUpdateIntervalMillis: 50 }
    );
    wordSoundInstance = sound;
  } catch (netAudioErr) {
    console.warn("Network audio playback error for isolated word:", netAudioErr);
  }
}


let isolatedWordSound: Audio.Sound | null = null;

export async function stopIsolatedWordAudio(): Promise<void> {
  if (isolatedWordSound) {
    try {
      await isolatedWordSound.stopAsync();
      await isolatedWordSound.unloadAsync();
    } catch (unloadIsolatedErr) {
      console.warn("Error unloading isolatedWordSound:", unloadIsolatedErr);
    }
    isolatedWordSound = null;
  }
}

export async function playIsolatedWordAudio(
  surah: number,
  ayah: number,
  wordIdx: number,
  wordText?: string
): Promise<void> {
  try {
    await stopIsolatedWordAudio();

    const surahPadded = String(surah).padStart(3, '0');
    const ayahPadded = String(ayah).padStart(3, '0');
    const wordPadded = String(wordIdx + 1).padStart(3, '0');
    const wbwAudioUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: wbwAudioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 50 }
      );
      isolatedWordSound = sound;
    } catch (netErr) {
      // Fallback: If QuranCDN WBW fails or offline, use Google TTS with authentic Arabic word text
      if (wordText && wordText.trim().length > 0) {
        const cleanWord = wordText.trim();
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=${encodeURIComponent(cleanWord)}`;
        const { sound } = await Audio.Sound.createAsync(
          { uri: ttsUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 50 }
        );
        isolatedWordSound = sound;
      }
    }
  } catch (err) {
    console.warn(`[playIsolatedWordAudio] Error playing word ${surah}:${ayah}:${wordIdx}:`, err);
  }
}
