// ═══════════════════════════════════════════════════════════════════════════
// TAJWEED STUDENT ENGINE (محرك تعليم التجويد لطالب القرآن)
// Comprehensive classical Tajweed detection, makharij, and rules for students
// ═══════════════════════════════════════════════════════════════════════════

export interface TajweedRule {
  id: string;
  category: 'madd' | 'noon' | 'meem' | 'qalqala' | 'ghunna' | 'sifat';
  nameAr: string;
  nameEn: string;
  letters: string;
  count?: string;
  color: string;
  makhraj: string;
  description: string;
  studentTip: string;
}

export const TAJWEED_PALETTE = {
  maddLazim: '#ff1744',     // Deep Red - 6 Harakat
  maddWajib: '#ff5252',     // Red - 4-5 Harakat
  maddTabeei: '#fbbf24',    // Gold/Amber - 2 Harakat
  maddArid: '#f59e0b',      // Orange - 2, 4, 6 Harakat
  ghunna: '#00e676',        // Vibrant Green - 2 Harakat
  ikhfa: '#10b981',         // Emerald Green
  idghamGhunna: '#00ffaa',   // Mint Cyan
  idghamNoGhunna: '#64748b',// Muted Slate (silent merging)
  iqlab: '#f97316',         // Warm Orange
  qalqala: '#00e5ff',       // Electric Cyan / Blue
  silent: '#475569',        // Slate Gray
};

// Classical letter collections
const QALQALA_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];
const IKHFA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
const IDGHAM_GHUNNA_LETTERS = ['ي', 'ن', 'م', 'و'];
const IDGHAM_NO_GHUNNA_LETTERS = ['ل', 'ر'];
const HALQ_LETTERS = ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'];

export function analyzeWordTajweed(word: string, isAyahEnd: boolean = false): TajweedRule[] {
  if (!word) return [];
  const rules: TajweedRule[] = [];
  const clean = word.trim();

  // 1. MADD LAZIM (مد لازم كلمي - 6 حركات)
  // Has Maddah (ٓ) followed by Shaddah (ّ)
  if ((clean.includes('ٓ') || clean.includes('\u0653')) && (clean.includes('ّ') || clean.includes('\u0651'))) {
    rules.push({
      id: 'madd_lazim',
      category: 'madd',
      nameAr: 'مد لازم كَلِمي مُثَقَّل',
      nameEn: 'Compulsory Madd (Lazim)',
      letters: 'حرف المد + حرف مشدد',
      count: '6 حركات واجبة (طول الحبل الصوتي)',
      color: TAJWEED_PALETTE.maddLazim,
      makhraj: 'الجوف (التجويف الفموي الحلقي)',
      description: 'أقوى المدود في القرآن، يُمد بمقدار 6 حركات لزوماً لجميع القراء بسبب سكون الحرف المشدد بعده.',
      studentTip: 'احرص على إشباع المد 6 حركات كاملة دون عجلة، ثم اضغط على الحرف المشدد بنبر خفيف.'
    });
  }
  // 2. MADD MUTTASIL / MUNFASIL (مد واجب أو جائز متصل/منفصل - 4 إلى 5 حركات)
  else if (clean.includes('ٓ') || clean.includes('\u0653')) {
    rules.push({
      id: 'madd_muttasil',
      category: 'madd',
      nameAr: 'مد متصل / منفصل',
      nameEn: 'Obligatory / Permissible Madd',
      letters: 'حرف المد + همزة',
      count: '4 إلى 5 حركات (توسط / فوق التوسط)',
      color: TAJWEED_PALETTE.maddWajib,
      makhraj: 'الجوف',
      description: 'مد الصوت عند ملاقاة حرف المد للهمزة في نفس الكلمة (متصل) أو بين كلمتين (منفصل).',
      studentTip: 'التزم بوزن القراءة المعتدل (4 حركات بمقدار بسط وقبض الإصبع 4 مرات).'
    });
  }

  // 3. MADD TABEEI (مد طبيعي - ألف خنجرية أو واو/ياء ساكنة - حركتان)
  if (clean.includes('ٰ') || clean.includes('\u0670')) {
    rules.push({
      id: 'madd_tabeei',
      category: 'madd',
      nameAr: 'مد طبيعي (ألف خنجرية)',
      nameEn: 'Natural Madd (Tabeei)',
      letters: 'الألف الخنجرية (ٰ)',
      count: 'حركتان (لا يزيد ولا ينقص)',
      color: TAJWEED_PALETTE.maddTabeei,
      makhraj: 'الجوف',
      description: 'المد الأصلي الذي لا تقوم ذات الحرف إلا به ولا يتوقف على سبب من همز أو سكون.',
      studentTip: 'حركتان فقط؛ لا تطيل فيه كأنه مد متصل، ولا تختلسه فيختفي الحرف.'
    });
  }

  // 4. MADD 'ARID LI-S-SUKUN (مد عارض للسكون - عند الوقف على آخر الكلمة)
  if (isAyahEnd) {
    const chars = Array.from(clean);
    const lastBaseChars = chars.filter(c => !/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(c));
    if (lastBaseChars.length >= 2) {
      const penult = lastBaseChars[lastBaseChars.length - 2];
      if (penult === 'و' || penult === 'ي' || penult === 'ا' || clean.includes('ٰ')) {
        rules.push({
          id: 'madd_arid',
          category: 'madd',
          nameAr: 'مد عارض للسكون (عند الوقف)',
          nameEn: 'Exposed Madd for Pause',
          letters: penult,
          count: 'جائز: 2 أو 4 أو 6 حركات',
          color: TAJWEED_PALETTE.maddArid,
          makhraj: 'الجوف',
          description: 'يحدث عندما يأتي حرف المد قبل الحرف الأخير من الكلمة، ونسكن الحرف الأخير للوقف عليه.',
          studentTip: 'المقدم في الأداء هو التوسط (4 حركات) ليتناسق مع إيقاع الآيات.'
        });
      }
    }
  }

  // 5. GHUNNAH (الغنة المشددة في النون والميم - حركتان)
  if ((clean.includes('ن') && clean.includes('ّ')) || (clean.includes('م') && clean.includes('ّ')) || clean.includes('نّ') || clean.includes('مّ')) {
    rules.push({
      id: 'ghunna_mushaddada',
      category: 'ghunna',
      nameAr: 'غُنَّة مشددة (أكمل ما تكون)',
      nameEn: 'Complete Nasalization (Ghunnah)',
      letters: 'نّ / مّ',
      count: 'حركتان في الخيشوم',
      color: TAJWEED_PALETTE.ghunna,
      makhraj: 'الخيشوم (التجويف الأنفي الداخلي)',
      description: 'صوت رخيم يخرج من أقصى الأنف بمقدار حركتين عند النطق بالنون أو الميم المشددة.',
      studentTip: 'احرص على ألا تخرج صوتاً من الفم أثناء الغنة، بل دعه يرن في الخيشوم تماماً.'
    });
  }

  // 6. QALQALAH (أحكام القلقلة - قطب جد)
  for (const q of QALQALA_LETTERS) {
    const hasSukunOnLetter = clean.includes(q + 'ْ') || clean.includes(q + '\u06E1');
    const isAtWordEnd = clean.endsWith(q) || clean.endsWith(q + 'ِ') || clean.endsWith(q + 'ُ') || clean.endsWith(q + 'َ');

    if (hasSukunOnLetter) {
      rules.push({
        id: `qalqala_sughra_${q}`,
        category: 'qalqala',
        nameAr: `قلقلة صغرى (${q})`,
        nameEn: 'Minor Qalqalah (Bounce)',
        letters: q,
        count: 'نبرة اهتزازية سريعة',
        color: TAJWEED_PALETTE.qalqala,
        makhraj: q === 'ق' ? 'أقصى اللسان مع الحنك اللحمي' : q === 'ط' || q === 'د' ? 'طرف اللسان مع أصول الثنايا العليا' : q === 'ج' ? 'وسط اللسان' : 'الشفتان معاً بإنطباق',
        description: 'اضطراب المخرج عند النطق بالحرف الساكن في وسط الكلمة دون أن يتحول إلى حركة.',
        studentTip: 'لا تمِل القلقلة نحو الفتح أو الكسر، بل اجعلها هزة نقية للمخرج فقط.'
      });
    } else if (isAyahEnd && isAtWordEnd) {
      rules.push({
        id: `qalqala_kubra_${q}`,
        category: 'qalqala',
        nameAr: `قلقلة كبرى عند الوقف (${q})`,
        nameEn: 'Major Qalqalah at Pause',
        letters: q,
        count: 'نبرة قوية واضحة',
        color: TAJWEED_PALETTE.qalqala,
        makhraj: q === 'ق' ? 'أقصى اللسان' : q === 'ط' || q === 'د' ? 'طرف اللسان' : q === 'ج' ? 'وسط اللسان' : 'الشفتان',
        description: 'قلقلة قوية جلية تظهر عند الوقف على الحرف الأخير من الكلمة.',
        studentTip: 'أوضح صوت الارتداد الصوتي عند سكون الحرف الأخير ليبرز جمال السكت.'
      });
    }
  }

  // 7. IQLAB (الإقلاب - قلب النون ميماً)
  if (clean.includes('ۢ') || clean.includes('ۘ') || (clean.includes('نْ') && clean.includes('ب'))) {
    rules.push({
      id: 'iqlab',
      category: 'noon',
      nameAr: 'إقلاب (قلب النون ميماً مخفاة)',
      nameEn: 'Iqlab (Conversion to Meem)',
      letters: 'ن / تنوين + ب',
      count: 'حركتان مع الغنة',
      color: TAJWEED_PALETTE.iqlab,
      makhraj: 'الشفتان (مع تلامس خفيف) + الخيشوم',
      description: 'قلب النون الساكنة أو التنوين ميماً مخفاة مع إبقاء الغنة بمقدار حركتين عند ملاقاتها للباء.',
      studentTip: 'تلامس الشفتين برفق دون كزّ قوي ودع الغنة تصدح في الخيشوم.'
    });
  }

  return rules;
}

// Structured Tajweed Reference Guide for Students
export const TAJWEED_CHAPTERS = [
  {
    id: 'madd',
    titleAr: 'أحكام المدود (Madd Rules)',
    badgeColor: TAJWEED_PALETTE.maddWajib,
    summary: 'المد هو إطالة الصوت بحرف من حروف المد الثلاثة: الألف الساكنة المفتوح ما قبلها، والواو الساكنة المضموم ما قبلها، والياء الساكنة المكسور ما قبلها.',
    rules: [
      {
        name: 'المد الطبيعي (الأصلي)',
        count: 'حركتان',
        example: 'قَالَ - يَقُولُ - قِيلَ',
        details: 'هو المد الذي لا تقوم ذات الحرف إلا به ولا يتوقف على سبب من همز أو سكون. مقداره حركتان.'
      },
      {
        name: 'المد المتصل',
        count: '4 - 5 حركات (واجب)',
        example: 'جَآءَ - السَّمَآءِ - سُوٓءَ',
        details: 'أن يأتي حرف المد وبعده همزة في نفس الكلمة. حكمه الوجوب لجميع القراء.'
      },
      {
        name: 'المد المنفصل',
        count: '4 - 5 حركات (جائز)',
        example: 'يَآ أَيُّهَا - فِيٓ أَنفُسِكُمْ',
        details: 'أن يأتي حرف المد في آخر الكلمة والهمزة في أول الكلمة التي تليها.'
      },
      {
        name: 'المد اللازم',
        count: '6 حركات (واجب دائم)',
        example: 'ٱلضَّآلِّينَ - ٱلْحَآقَّةُ - كٓهيعٓصٓ',
        details: 'أن يأتي بعد حرف المد سكون أصلي أو حرف مشدد. يُمَد 6 حركات وجوباً بلا خلاف.'
      },
      {
        name: 'المد العارض للسكون',
        count: '2 أو 4 أو 6 حركات (جائز)',
        example: 'ٱلرَّحِيمِ ۝ - نَسْتَعِينُ ۝',
        details: 'أن يقع سكون عارض لأجل الوقف بعد حرف المد في آخر الآية.'
      }
    ]
  },
  {
    id: 'noon',
    titleAr: 'أحكام النون الساكنة والتنوين (Nun & Tanween)',
    badgeColor: TAJWEED_PALETTE.ikhfa,
    summary: 'للنون الساكنة والتنوين أربعة أحكام عند ملاقاة الحروف الهجائية: الإظهار، الإدغام، الإقلاب، الإخفاء.',
    rules: [
      {
        name: '1. الإظهار الحلقي',
        count: 'بدون غنة زائدة',
        example: 'مَنْ ءَامَنَ - أَنْعَمْتَ - مِنْ حَكِيمٍ',
        details: 'إخراج النون واضحة من مخرجها دون غنة زائدة عند حروف الحلق الستة: (ء، هـ، ع، ح، غ، خ).'
      },
      {
        name: '2. الإدغام بغنة',
        count: 'حركتان',
        example: 'مَن يَقُولُ - مِّن مَّالٍ - رَحِيمٌ وَدُودٌ',
        details: 'دمج النون الساكنة بالحرف الذي بعدها في حروف (ينمو) مع صوت غنة يخرج من الخيشوم.'
      },
      {
        name: '3. الإدغام بغير غنة',
        count: 'إدغام كامل بدون غنة',
        example: 'مِن رَّبِّهِمْ - هُدًى لِّلْمُتَّقِينَ',
        details: 'دمج النون بالكامل في حرفي (اللام والراء) دون غنة.'
      },
      {
        name: '4. الإقلاب',
        count: 'حركتان مع الغنة',
        example: 'مِنۢ بَعْدِ - أَنۢبِئْهُم - عَلِيمٌۢ بِذَاتِ',
        details: 'قلب النون الساكنة أو التنوين ميماً مخفاة مع الغنة عند حرف الباء.'
      },
      {
        name: '5. الإخفاء الحقيقي',
        count: 'حركتان في الخيشوم',
        example: 'مِن قَبْلُ - كُنتُمْ - أَنفُسَكُمْ',
        details: 'النطق بالنون في حالة وسط بين الإظهار والإدغام مع غنة عند 15 حرفاً.'
      }
    ]
  },
  {
    id: 'qalqala',
    titleAr: 'أحكام القلقلة (Qalqalah Rules)',
    badgeColor: TAJWEED_PALETTE.qalqala,
    summary: 'القلقلة هي اضطراب المخرج واهتزازه عند النطق بالحرف الساكن من حروف (ق، ط، ب، ج، د) حتى يُسمع له نبرة قوية.',
    rules: [
      {
        name: 'قلقلة صغرى',
        count: 'سريعة وخفيفة',
        example: 'يَقْطَعُونَ - يَطْمَعُ - أَبْصَارِهِمْ',
        details: 'عندما يكون حرف القلقلة ساكناً في وسط الكلمة.'
      },
      {
        name: 'قلقلة كبرى',
        count: 'واضحة وقوية',
        example: 'ٱلْفَلَقِ ۝ - مَسَدٍ ۝ - وَقَبَ ۝',
        details: 'عند الوقف على الحرف في آخر الكلمة وكان مخففاً غير مشدد.'
      },
      {
        name: 'قلقلة أكبر',
        count: 'أقوى المراتب مع نبر',
        example: 'وَتَبَّ ۝ - بِٱلْحَقِّ ۝',
        details: 'عند الوقف على حرف قلقلة مشدد.'
      }
    ]
  },
  {
    id: 'makharij',
    titleAr: 'مخارج الحروف الخمسة (Makharij of Letters)',
    badgeColor: '#a855f7',
    summary: 'المخرج هو موضع خروج الحرف وتمييزه عن غيره. المخارج العامة خمسة تتفرع إلى 17 مخرجاً خاصاً.',
    rules: [
      {
        name: '1. الجوف (The Oral Cavity)',
        count: 'حروف المد الثلاثة',
        example: 'الألف والواو والياء السواكن',
        details: 'هو الخلاء الممتد داخل الحلق والفم، تخرج منه حروف المد الثلاثة.'
      },
      {
        name: '2. الحلق (The Throat)',
        count: '6 حروف حلقية',
        example: 'ء، هـ (أقصاه) | ع، ح (وسطه) | غ، خ (أدناه)',
        details: 'مخرج لحروف الإظهار الحلقي مقسم إلى ثلاثة مستويات.'
      },
      {
        name: '3. اللسان (The Tongue)',
        count: '18 حرفاً في 10 مخارج',
        example: 'ق، ك، ج، ش، ي، ض، ل، ن، ر، ط، د، ت، ص، س، ز، ظ، ذ، ث',
        details: 'أعظم مخارج الحروف، ينقسم إلى أقصى اللسان، ووسطه، وحافته، وطرفه.'
      },
      {
        name: '4. الشفتان (The Lips)',
        count: '4 حروف شفوية',
        example: 'الفاء (بطن الشفة السفلى) | الباء، الميم، الواو غير المدية (بين الشفتين)',
        details: 'مخرج خارجي تشترك فيه الشفتان إما بالإنطباق أو الانفتاح.'
      },
      {
        name: '5. الخيشوم (Nasal Cavity)',
        count: 'مخرج الغنة فقط',
        example: 'صوت الغنة في النون والميم المشددتين والإخفاء والإدغام',
        details: 'التجويف الواصل بين أعلى الأنف وداخل الحلق، وهو مخرج صفة الغنة الصوتية.'
      }
    ]
  }
];
