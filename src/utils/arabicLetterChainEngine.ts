/**
 * arabicLetterChainEngine.ts
 *
 * Dedicated pedagogical engine for Non-Arabic Speakers & Quran Beginners (طلاب القرآن).
 * Deconstructs any Quranic word into individual letters, identifies positional shapes
 * (isolated, initial, medial, final), explains how they chain together, and provides
 * phonetic syllables and articulation guides.
 */

export interface ArabicLetterMetadata {
  char: string;
  arabicName: string;
  englishName: string;
  soundIpa: string;
  englishSound: string;
  makhraj: string;
  joinsLeft: boolean;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export const ARABIC_ALPHABET_METADATA: { [char: string]: ArabicLetterMetadata } = {
  'ا': {
    char: 'ا',
    arabicName: 'أَلِف',
    englishName: 'Alif',
    soundIpa: '[aː] / [ʔ]',
    englishSound: 'Long "aa" or glottal stop',
    makhraj: 'الجوف (Empty space of throat & mouth)',
    joinsLeft: false,
    isolated: 'ا',
    initial: 'ا',
    medial: 'ـا',
    final: 'ـا',
  },
  'ٱ': {
    char: 'ٱ',
    arabicName: 'هَمْزَةُ الوَصْل',
    englishName: 'Hamzat al-Wasl',
    soundIpa: '[ʔ]',
    englishSound: 'Connecting Alif (pronounced at start, silent in continuum)',
    makhraj: 'أقصى الحلق (Deep Throat)',
    joinsLeft: false,
    isolated: 'ٱ',
    initial: 'ٱ',
    medial: 'ـٱ',
    final: 'ـٱ',
  },
  'أ': {
    char: 'أ',
    arabicName: 'هَمْزَة فَوْقَ أَلِف',
    englishName: 'Hamzah over Alif',
    soundIpa: '[ʔ]',
    englishSound: 'Glottal stop as in "uh-oh"',
    makhraj: 'أقصى الحلق (Deep Throat)',
    joinsLeft: false,
    isolated: 'أ',
    initial: 'أ',
    medial: 'ـأ',
    final: 'ـأ',
  },
  'إ': {
    char: 'إ',
    arabicName: 'هَمْزَة تَحْتَ أَلِف',
    englishName: 'Hamzah under Alif',
    soundIpa: '[ʔi]',
    englishSound: 'Glottal stop with "i"',
    makhraj: 'أقصى الحلق (Deep Throat)',
    joinsLeft: false,
    isolated: 'إ',
    initial: 'إ',
    medial: 'ـإ',
    final: 'ـإ',
  },
  'ء': {
    char: 'ء',
    arabicName: 'هَمْزَة',
    englishName: 'Hamzah',
    soundIpa: '[ʔ]',
    englishSound: 'Glottal stop',
    makhraj: 'أقصى الحلق (Deep Throat)',
    joinsLeft: false,
    isolated: 'ء',
    initial: 'ء',
    medial: 'ء',
    final: 'ء',
  },
  'ب': {
    char: 'ب',
    arabicName: 'بَاء',
    englishName: 'Bāʾ',
    soundIpa: '[b]',
    englishSound: '"b" as in "bed"',
    makhraj: 'الشفتان (Both Lips)',
    joinsLeft: true,
    isolated: 'ب',
    initial: 'بـ',
    medial: 'ـبـ',
    final: 'ـب',
  },
  'ت': {
    char: 'ت',
    arabicName: 'تَاء',
    englishName: 'Tāʾ',
    soundIpa: '[t]',
    englishSound: '"t" as in "ten"',
    makhraj: 'طرف اللسان وأصول الثنايا العليا (Tip of tongue with upper teeth)',
    joinsLeft: true,
    isolated: 'ت',
    initial: 'تـ',
    medial: 'ـتـ',
    final: 'ـت',
  },
  'ة': {
    char: 'ة',
    arabicName: 'تَاء مَرْبُوطَة',
    englishName: 'Tāʾ Marbūṭah',
    soundIpa: '[t] / [h]',
    englishSound: '"t" in connection, "h" on stop',
    makhraj: 'الحلق / طرف اللسان (Throat / Tongue tip)',
    joinsLeft: false,
    isolated: 'ة',
    initial: 'ة',
    medial: 'ـة',
    final: 'ـة',
  },
  'ث': {
    char: 'ث',
    arabicName: 'ثَاء',
    englishName: 'Thāʾ',
    soundIpa: '[θ]',
    englishSound: '"th" as in "think"',
    makhraj: 'طرف اللسان مع أطراف الثنايا (Tip of tongue with edges of front teeth)',
    joinsLeft: true,
    isolated: 'ث',
    initial: 'ثـ',
    medial: 'ـثـ',
    final: 'ـث',
  },
  'ج': {
    char: 'ج',
    arabicName: 'جِيم',
    englishName: 'Jīm',
    soundIpa: '[d͡ʒ]',
    englishSound: '"j" as in "joy"',
    makhraj: 'وسط اللسان مع الحنك الأعلى (Middle of tongue with upper palate)',
    joinsLeft: true,
    isolated: 'ج',
    initial: 'جـ',
    medial: 'ـجـ',
    final: 'ـج',
  },
  'ح': {
    char: 'ح',
    arabicName: 'حَاء',
    englishName: 'Ḥāʾ',
    soundIpa: '[ħ]',
    englishSound: 'Deep raspy unvoiced "h" from middle throat',
    makhraj: 'وسط الحلق (Middle Throat)',
    joinsLeft: true,
    isolated: 'ح',
    initial: 'حـ',
    medial: 'ـحـ',
    final: 'ـح',
  },
  'خ': {
    char: 'خ',
    arabicName: 'خَاء',
    englishName: 'Khāʾ',
    soundIpa: '[x]',
    englishSound: 'Guttural "kh" as in Scottish "loch" or German "Bach"',
    makhraj: 'أدنى الحلق (Closest part of throat to mouth)',
    joinsLeft: true,
    isolated: 'خ',
    initial: 'خـ',
    medial: 'ـخـ',
    final: 'ـخ',
  },
  'د': {
    char: 'د',
    arabicName: 'دَال',
    englishName: 'Dāl',
    soundIpa: '[d]',
    englishSound: '"d" as in "door"',
    makhraj: 'طرف اللسان مع أصول الثنايا (Tip of tongue with gums of upper teeth)',
    joinsLeft: false,
    isolated: 'د',
    initial: 'د',
    medial: 'ـد',
    final: 'ـد',
  },
  'ذ': {
    char: 'ذ',
    arabicName: 'ذَال',
    englishName: 'Dhāl',
    soundIpa: '[ð]',
    englishSound: 'Voiced "th" as in "this" or "father"',
    makhraj: 'طرف اللسان مع أطراف الثنايا (Tip of tongue with edges of front teeth)',
    joinsLeft: false,
    isolated: 'ذ',
    initial: 'ذ',
    medial: 'ـذ',
    final: 'ـذ',
  },
  'ر': {
    char: 'ر',
    arabicName: 'رَاء',
    englishName: 'Rāʾ',
    soundIpa: '[r]',
    englishSound: 'Rolled/tapped "r" with tongue tip',
    makhraj: 'طرف اللسان مع ما يحاذيه من الحنك (Tip of tongue near palate)',
    joinsLeft: false,
    isolated: 'ر',
    initial: 'ر',
    medial: 'ـر',
    final: 'ـر',
  },
  'ز': {
    char: 'ز',
    arabicName: 'زَاي',
    englishName: 'Zāy',
    soundIpa: '[z]',
    englishSound: '"z" as in "zebra"',
    makhraj: 'طرف اللسان مع فويق الثنايا السفلى (Tip of tongue above lower teeth)',
    joinsLeft: false,
    isolated: 'ز',
    initial: 'ز',
    medial: 'ـز',
    final: 'ـز',
  },
  'س': {
    char: 'س',
    arabicName: 'سِين',
    englishName: 'Sīn',
    soundIpa: '[s]',
    englishSound: '"s" as in "sun"',
    makhraj: 'طرف اللسان مع فويق الثنايا السفلى (Tip of tongue above lower teeth)',
    joinsLeft: true,
    isolated: 'س',
    initial: 'سـ',
    medial: 'ـسـ',
    final: 'ـس',
  },
  'ش': {
    char: 'ش',
    arabicName: 'شِين',
    englishName: 'Shīn',
    soundIpa: '[ʃ]',
    englishSound: '"sh" as in "shine"',
    makhraj: 'وسط اللسان مع الحنك الأعلى (Middle of tongue with upper palate)',
    joinsLeft: true,
    isolated: 'ش',
    initial: 'شـ',
    medial: 'ـشـ',
    final: 'ـش',
  },
  'ص': {
    char: 'ص',
    arabicName: 'صَاد',
    englishName: 'Ṣād',
    soundIpa: '[sˤ]',
    englishSound: 'Heavy emphatic "S" with back of tongue raised',
    makhraj: 'طرف اللسان مع فويق الثنايا مع استعلاء (Tongue tip with elevation)',
    joinsLeft: true,
    isolated: 'ص',
    initial: 'صـ',
    medial: 'ـصـ',
    final: 'ـص',
  },
  'ض': {
    char: 'ض',
    arabicName: 'ضَاد',
    englishName: 'Ḍād',
    soundIpa: '[dˤ]',
    englishSound: 'Heavy emphatic "D" from edge of tongue touching molars',
    makhraj: 'إحدى حافتي اللسان مع الأضراس العليا (Edge of tongue with upper molars)',
    joinsLeft: true,
    isolated: 'ض',
    initial: 'ضـ',
    medial: 'ـضـ',
    final: 'ـض',
  },
  'ط': {
    char: 'ط',
    arabicName: 'طَاء',
    englishName: 'Ṭāʾ',
    soundIpa: '[tˤ]',
    englishSound: 'Heavy emphatic "T" with full mouth resonance',
    makhraj: 'طرف اللسان مع أصول الثنايا مع استعلاء (Tongue tip with palate elevation)',
    joinsLeft: true,
    isolated: 'ط',
    initial: 'طـ',
    medial: 'ـطـ',
    final: 'ـط',
  },
  'ظ': {
    char: 'ظ',
    arabicName: 'ظَاء',
    englishName: 'Ẓāʾ',
    soundIpa: '[ðˤ]',
    englishSound: 'Heavy emphatic "Th" as in "though" with mouth full',
    makhraj: 'طرف اللسان مع أطراف الثنايا مع استعلاء (Tongue tip with front teeth elevated)',
    joinsLeft: true,
    isolated: 'ظ',
    initial: 'ظـ',
    medial: 'ـظـ',
    final: 'ـظ',
  },
  'ع': {
    char: 'ع',
    arabicName: 'عَيْن',
    englishName: 'ʿAyn',
    soundIpa: '[ʕ]',
    englishSound: 'Voiced pharyngeal friction produced by squeezing middle throat',
    makhraj: 'وسط الحلق (Middle Throat)',
    joinsLeft: true,
    isolated: 'ع',
    initial: 'عـ',
    medial: 'ـعـ',
    final: 'ـع',
  },
  'غ': {
    char: 'غ',
    arabicName: 'غَيْن',
    englishName: 'Ghayn',
    soundIpa: '[ɣ]',
    englishSound: 'Gargling voiced sound like French/German "r"',
    makhraj: 'أدنى الحلق (Closest part of throat to mouth)',
    joinsLeft: true,
    isolated: 'غ',
    initial: 'غـ',
    medial: 'ـغـ',
    final: 'ـغ',
  },
  'ف': {
    char: 'ف',
    arabicName: 'فَاء',
    englishName: 'Fāʾ',
    soundIpa: '[f]',
    englishSound: '"f" as in "fish"',
    makhraj: 'بطن الشفة السفلى مع أطراف الثنايا العليا (Inner lower lip with upper teeth)',
    joinsLeft: true,
    isolated: 'ف',
    initial: 'فـ',
    medial: 'ـفـ',
    final: 'ـف',
  },
  'ق': {
    char: 'ق',
    arabicName: 'قَاف',
    englishName: 'Qāf',
    soundIpa: '[q]',
    englishSound: 'Deep "q" produced at extreme back of mouth near uvula',
    makhraj: 'أقصى اللسان مع الحنك الأعلى اللحمي (Deepest back of tongue with soft palate)',
    joinsLeft: true,
    isolated: 'ق',
    initial: 'قـ',
    medial: 'ـقـ',
    final: 'ـق',
  },
  'ك': {
    char: 'ك',
    arabicName: 'كَاف',
    englishName: 'Kāf',
    soundIpa: '[k]',
    englishSound: '"k" as in "kite"',
    makhraj: 'أقصى اللسان تحت القاف مع الحنك الصلب (Back of tongue with hard palate)',
    joinsLeft: true,
    isolated: 'ك',
    initial: 'كـ',
    medial: 'ـكـ',
    final: 'ـك',
  },
  'ل': {
    char: 'ل',
    arabicName: 'لاَم',
    englishName: 'Lām',
    soundIpa: '[l]',
    englishSound: '"l" as in "light"',
    makhraj: 'أدنى حافة اللسان إلى منتهاها مع لثة الأسنان العليا (Front edge of tongue)',
    joinsLeft: true,
    isolated: 'ل',
    initial: 'لـ',
    medial: 'ـلـ',
    final: 'ـل',
  },
  'م': {
    char: 'م',
    arabicName: 'مِيم',
    englishName: 'Mīm',
    soundIpa: '[m]',
    englishSound: '"m" as in "moon"',
    makhraj: 'الشفتان مع انطباقهما مع غنة من الخيشوم (Both lips closed + nasal resonance)',
    joinsLeft: true,
    isolated: 'م',
    initial: 'مـ',
    medial: 'ـمـ',
    final: 'ـم',
  },
  'ن': {
    char: 'ن',
    arabicName: 'نُون',
    englishName: 'Nūn',
    soundIpa: '[n]',
    englishSound: '"n" as in "noon"',
    makhraj: 'طرف اللسان تحت اللام مع غنة من الخيشوم (Tongue tip + nasal resonance)',
    joinsLeft: true,
    isolated: 'ن',
    initial: 'نـ',
    medial: 'ـنـ',
    final: 'ـن',
  },
  'ه': {
    char: 'ه',
    arabicName: 'هَاء',
    englishName: 'Hāʾ',
    soundIpa: '[h]',
    englishSound: '"h" as in "hat"',
    makhraj: 'أقصى الحلق (Deep Throat)',
    joinsLeft: true,
    isolated: 'ه',
    initial: 'هـ',
    medial: 'ـهـ',
    final: 'ـه',
  },
  'و': {
    char: 'و',
    arabicName: 'وَاو',
    englishName: 'Wāw',
    soundIpa: '[w] / [uː]',
    englishSound: '"w" as in "water" or long vowel "oo"',
    makhraj: 'الشفتان مع انضمامهما (Both lips rounded)',
    joinsLeft: false,
    isolated: 'و',
    initial: 'و',
    medial: 'ـو',
    final: 'ـو',
  },
  'ي': {
    char: 'ي',
    arabicName: 'يَاء',
    englishName: 'Yāʾ',
    soundIpa: '[j] / [iː]',
    englishSound: '"y" as in "yes" or long vowel "ee"',
    makhraj: 'وسط اللسان مع الحنك الأعلى (Middle of tongue with upper palate)',
    joinsLeft: true,
    isolated: 'ي',
    initial: 'يـ',
    medial: 'ـيـ',
    final: 'ـي',
  },
  'ى': {
    char: 'ى',
    arabicName: 'أَلِف مَقْصُورَة',
    englishName: 'Alif Maksūrah',
    soundIpa: '[aː]',
    englishSound: 'Dagger Alif ending pronounced as long "aa"',
    makhraj: 'الجوف (Throat & Mouth cavity)',
    joinsLeft: false,
    isolated: 'ى',
    initial: 'ى',
    medial: 'ـى',
    final: 'ـى',
  },
  'ؤ': {
    char: 'ؤ',
    arabicName: 'هَمْزَة عَلَى وَاو',
    englishName: 'Hamzah on Wāw',
    soundIpa: '[ʔ]',
    englishSound: 'Glottal stop on Wāw seat',
    makhraj: 'أقصى الحلق (Deep Throat)',
    joinsLeft: false,
    isolated: 'ؤ',
    initial: 'ؤ',
    medial: 'ـؤ',
    final: 'ـؤ',
  },
  'ئ': {
    char: 'ئ',
    arabicName: 'هَمْزَة عَلَى يَاء',
    englishName: 'Hamzah on Yāʾ (Nabrah)',
    soundIpa: '[ʔ]',
    englishSound: 'Glottal stop on Yāʾ seat',
    makhraj: 'أقصى الحلق (Deep Throat)',
    joinsLeft: true,
    isolated: 'ئ',
    initial: 'ئـ',
    medial: 'ـئـ',
    final: 'ـئ',
  },
  'آ': {
    char: 'آ',
    arabicName: 'أَلِف مَمْدُودَة',
    englishName: 'Alif Maddah',
    soundIpa: '[ʔaː]',
    englishSound: 'Hamzah with elongated Alif',
    makhraj: 'الجوف وأقصى الحلق (Throat & Oral cavity)',
    joinsLeft: false,
    isolated: 'آ',
    initial: 'آ',
    medial: 'ـآ',
    final: 'ـآ',
  },
};

export interface HarakahInfo {
  nameAr: string;
  nameEn: string;
  sound: string;
  vowel: string;
  type: 'fathah' | 'kasrah' | 'dammah' | 'sukun' | 'shaddah' | 'tanween' | 'madd' | 'plain';
}

export function identifyHarakah(diacritics: string): HarakahInfo {
  // 1. Maddah (long prolongation 4-6 counts)
  if (diacritics.includes('ٓ')) {
    return { nameAr: 'مَدَّة طَوِيلَة', nameEn: 'Maddah (Long Vowel)', sound: '[prolonged aa 4-6 counts]', vowel: 'aaaa', type: 'madd' };
  }
  // 2. Dagger Alif (ٰ) - must be checked before plain Fathah!
  if (diacritics.includes('ٰ')) {
    if (diacritics.includes('ّ')) {
      return { nameAr: 'شَدَّة مَع أَلِف خَنْجَرِيَّة', nameEn: 'Shaddah + Dagger Alif', sound: '[doubled + long aa]', vowel: 'aa', type: 'shaddah' };
    }
    return { nameAr: 'أَلِف خَنْجَرِيَّة', nameEn: 'Dagger Alif (Long Vowel)', sound: '[long aa - 2 counts]', vowel: 'aa', type: 'madd' };
  }
  // 3. Shaddah (Doubling)
  if (diacritics.includes('ّ')) {
    if (diacritics.includes('ً')) return { nameAr: 'شَدَّة مَع تَنْوِين فَتْح', nameEn: 'Shaddah + Tanween Fath', sound: '[doubled + an]', vowel: 'an', type: 'shaddah' };
    if (diacritics.includes('ٍ')) return { nameAr: 'شَدَّة مَع تَنْوِين كَسْر', nameEn: 'Shaddah + Tanween Kasr', sound: '[doubled + in]', vowel: 'in', type: 'shaddah' };
    if (diacritics.includes('ٌ')) return { nameAr: 'شَدَّة مَع تَنْوِين ضَمّ', nameEn: 'Shaddah + Tanween Damm', sound: '[doubled + un]', vowel: 'un', type: 'shaddah' };
    if (diacritics.includes('َ')) return { nameAr: 'شَدَّة مَع فَتْحَة', nameEn: 'Shaddah + Fathah', sound: '[doubled + a]', vowel: 'a', type: 'shaddah' };
    if (diacritics.includes('ِ')) return { nameAr: 'شَدَّة مَع كَسْرَة', nameEn: 'Shaddah + Kasrah', sound: '[doubled + i]', vowel: 'i', type: 'shaddah' };
    if (diacritics.includes('ُ')) return { nameAr: 'شَدَّة مَع ضَمَّة', nameEn: 'Shaddah + Dammah', sound: '[doubled + u]', vowel: 'u', type: 'shaddah' };
    return { nameAr: 'شَدَّة (تَشْدِيد)', nameEn: 'Shaddah', sound: '[doubled consonant]', vowel: '', type: 'shaddah' };
  }
  // 4. Tanween (Nasal Echo)
  if (diacritics.includes('ً')) return { nameAr: 'تَنْوِين فَتْح', nameEn: 'Tanween Fath', sound: '[-an nasal echo]', vowel: 'an', type: 'tanween' };
  if (diacritics.includes('ٍ')) return { nameAr: 'تَنْوِين كَسْر', nameEn: 'Tanween Kasr', sound: '[-in nasal echo]', vowel: 'in', type: 'tanween' };
  if (diacritics.includes('ٌ')) return { nameAr: 'تَنْوِين ضَمّ', nameEn: 'Tanween Damm', sound: '[-un nasal echo]', vowel: 'un', type: 'tanween' };
  // 5. Sukūn (Silent Consonant)
  if (diacritics.includes('ْ')) return { nameAr: 'سُكُون', nameEn: 'Sukūn (Silent Stop)', sound: '[silent consonant stop]', vowel: '', type: 'sukun' };
  // 6. Short Vowels
  if (diacritics.includes('َ')) return { nameAr: 'فَتْحَة', nameEn: 'Fathah', sound: '[short a as in cup]', vowel: 'a', type: 'fathah' };
  if (diacritics.includes('ِ')) return { nameAr: 'كَسْرَة', nameEn: 'Kasrah', sound: '[short i as in pin]', vowel: 'i', type: 'kasrah' };
  if (diacritics.includes('ُ')) return { nameAr: 'ضَمَّة', nameEn: 'Dammah', sound: '[short u as in put]', vowel: 'u', type: 'dammah' };
  return { nameAr: 'حَرْف سَاكِن / مُجَرَّد', nameEn: 'Plain Letter', sound: '[consonant only]', vowel: '', type: 'plain' };
}

const DIACRITIC_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/;
function isDiacritic(c: string): boolean {
  return DIACRITIC_REGEX.test(c);
}

export interface DeconstructedLetter {
  index: number;
  rawGrapheme: string;
  baseChar: string;
  letterMeta: ArabicLetterMetadata;
  harakah: HarakahInfo;
  syllableSound: string;
  position: 'isolated' | 'initial' | 'medial' | 'final';
  positionShape: string;
  chainNote: string;
}

export interface WordChainAnalysis {
  originalWord: string;
  cleanWord: string;
  phoneticSpelling: string;
  letters: DeconstructedLetter[];
  chainFlow: string;
  syllables: { arabic: string; phonetic: string; step: number }[];
  explanation: string;
}

/**
 * Deconstruct any Quranic word into its constituent letters and compute chaining metadata.
 */
export function deconstructWordAndChain(wordText: string): WordChainAnalysis {
  const clean = wordText.trim();
  const clusters: { baseChar: string; diacritics: string; raw: string }[] = [];

  let curBase = '';
  let curDia = '';
  let curRaw = '';

  for (const c of clean) {
    if (isDiacritic(c)) {
      curDia += c;
      curRaw += c;
    } else {
      if (curBase) {
        clusters.push({ baseChar: curBase, diacritics: curDia, raw: curRaw });
      }
      curBase = c;
      curDia = '';
      curRaw = c;
    }
  }
  if (curBase) {
    clusters.push({ baseChar: curBase, diacritics: curDia, raw: curRaw });
  }

  const letters: DeconstructedLetter[] = [];
  const phoneticParts: string[] = [];

  for (let i = 0; i < clusters.length; i++) {
    const cl = clusters[i];
    const prevCluster = i > 0 ? clusters[i - 1] : null;
    const nextCluster = i < clusters.length - 1 ? clusters[i + 1] : null;

    const baseMeta = ARABIC_ALPHABET_METADATA[cl.baseChar] || {
      char: cl.baseChar,
      arabicName: cl.baseChar,
      englishName: cl.baseChar,
      soundIpa: cl.baseChar,
      englishSound: 'Arabic consonant',
      makhraj: 'الفم (Oral tract)',
      joinsLeft: true,
      isolated: cl.baseChar,
      initial: cl.baseChar + 'ـ',
      medial: 'ـ' + cl.baseChar + 'ـ',
      final: 'ـ' + cl.baseChar,
    };

    const harakah = identifyHarakah(cl.diacritics);

    // Determine position shape based on Arabic joining rules
    const prevJoins = prevCluster ? (ARABIC_ALPHABET_METADATA[prevCluster.baseChar]?.joinsLeft ?? true) : false;
    const hasNext = nextCluster !== null;

    let pos: 'isolated' | 'initial' | 'medial' | 'final' = 'isolated';
    let posShape = baseMeta.isolated;
    let chainNote = '';

    if (!prevJoins && hasNext) {
      pos = 'initial';
      posShape = baseMeta.initial;
      chainNote = `شكل بداية (يتصل بالتالي ${nextCluster?.baseChar})`;
    } else if (prevJoins && hasNext) {
      pos = 'medial';
      posShape = baseMeta.medial;
      chainNote = `شكل وسط (يتصل بالسابق ${prevCluster?.baseChar} والتالي ${nextCluster?.baseChar})`;
    } else if (prevJoins && !hasNext) {
      pos = 'final';
      posShape = baseMeta.final;
      chainNote = `شكل نهاية (يتصل بالسابق ${prevCluster?.baseChar})`;
    } else {
      pos = 'isolated';
      posShape = baseMeta.isolated;
      chainNote = 'شكل منفرد (حرف لا يتصل بما قبله)';
    }

    // Build clean phonetic consonant representation
    const ARABIC_CONSONANT_MAP: { [char: string]: string } = {
      'ا': '',
      'أ': "'",
      'إ': "'",
      'آ': "'aa",
      'ء': "'",
      'ئ': "'",
      'ؤ': "'",
      'ٱ': '',
      'ب': 'b',
      'ت': 't',
      'ث': 'th',
      'ج': 'j',
      'ح': 'ḥ',
      'خ': 'kh',
      'د': 'd',
      'ذ': 'dh',
      'ر': 'r',
      'ز': 'z',
      'س': 's',
      'ش': 'sh',
      'ص': 'ṣ',
      'ض': 'ḍ',
      'ط': 'ṭ',
      'ظ': 'ẓ',
      'ع': 'ʿ',
      'غ': 'gh',
      'ف': 'f',
      'ق': 'q',
      'ك': 'k',
      'ل': 'l',
      'م': 'm',
      'ن': 'n',
      'ه': 'h',
      'و': 'w',
      'ي': 'y',
      'ى': 'a',
      'ة': 't',
    };

    let syl = '';
    const baseSound = ARABIC_CONSONANT_MAP[cl.baseChar] ?? '';

    if (cl.baseChar === 'ٱ') {
      syl = '(silent Alif)';
    } else if (cl.diacritics.includes('ّ')) {
      syl = baseSound + baseSound + (harakah.vowel || '');
    } else if (harakah.vowel) {
      syl = baseSound + harakah.vowel;
    } else {
      syl = baseSound || baseMeta.englishName.toLowerCase().slice(0, 2);
    }
    phoneticParts.push(syl);

    letters.push({
      index: i,
      rawGrapheme: cl.raw,
      baseChar: cl.baseChar,
      letterMeta: baseMeta,
      harakah,
      syllableSound: syl,
      position: pos,
      positionShape: posShape,
      chainNote,
    });
  }

  // Construct visual chain flow with explicit step numbers in true Right-to-Left Arabic direction:
  // [ ١. بـِ ]  ⟵  [ ٢. ـسْـ ]  ⟵  [ ٣. ـمِ ]  ⟵  بِسْمِ
  const arabicDigits = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠'];
  const shapes = letters.map((l, i) => `[ ${arabicDigits[i] || (i + 1)}. ${l.positionShape} ]`).join('  ⟵  ');
  const chainFlow = `${shapes}  ⟵  ${clean}`;

  // Compute Syllable Chunks (CV / CVC)
  const syllables: { arabic: string; phonetic: string; step: number }[] = [];
  let curSylAr = '';
  let curSylPh = '';
  let sylStep = 1;

  for (let i = 0; i < letters.length; i++) {
    const l = letters[i];
    curSylAr += l.rawGrapheme;
    curSylPh += (curSylPh ? '-' : '') + l.syllableSound;

    const isSukun = l.harakah.type === 'sukun';
    const isLast = i === letters.length - 1;
    const nextIsSukun = !isLast && letters[i + 1].harakah.type === 'sukun';

    if (isSukun || (!nextIsSukun && curSylAr.length >= 2) || isLast) {
      syllables.push({
        arabic: curSylAr,
        phonetic: curSylPh,
        step: sylStep++
      });
      curSylAr = '';
      curSylPh = '';
    }
  }
  if (curSylAr) {
    syllables.push({ arabic: curSylAr, phonetic: curSylPh, step: sylStep });
  }

  return {
    originalWord: clean,
    cleanWord: clean.replace(DIACRITIC_REGEX, ''),
    phoneticSpelling: phoneticParts.filter(p => !p.includes('silent')).join('-'),
    letters,
    chainFlow,
    syllables,
    explanation: `هذه الكلمة تتألف من ${letters.length} أحرف موصولة معاً لتشكيل اللفظ القرآني. تبدأ من اليمين (الحرف ١) وتتصل يساراً.`,
  };
}
