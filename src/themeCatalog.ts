export type ThemeId =
  | 'archival'
  | 'golden-king'
  | 'parchment'
  | 'botanical'
  | 'lapis'
  | 'ivory-silk'
  | 'midnight'
  | 'slate'
  | 'obsidian-ink'
  | 'espresso-study'
  | 'night-pine'
  | 'mamluk-gold'
  | 'phoenician-marble'
  | 'damascus-pearl'
  | 'andalus-cobalt'
  | 'emerald-manuscript'
  | 'crimson-velvet'
  | 'nebula-amethyst'
  | 'abyssal-teal'
  | 'pharaoh-onyx';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  isPremium: boolean;
  unlockCode?: string;
  tokenPriceOverride?: number | null;
  canvas: string;
  surface: string;
  ink: string;
  accent: string;
  previewBackground: string;
}

export const THEME_CATALOG: ThemeDefinition[] = [
  {
    id: 'archival',
    name: 'ورق أرشيفي',
    nameEn: 'Archival Paper',
    description: 'خلفية ورقية دافئة مع حبر فحمي ولمسات طينية',
    descriptionEn: 'Warm archival paper with charcoal ink and terracotta accents',
    isPremium: false,
    canvas: '#FBF9F5',
    surface: '#F3EFE6',
    ink: '#1C1917',
    accent: '#9A3412',
    previewBackground: '#FBF9F5',
  },
  {
    id: 'golden-king',
    name: 'الجولدن كينج',
    nameEn: 'Golden King',
    description: 'خلفية سوداء داكنة بالكامل مع لمسات وتحديد ذهبي فاخر عند التمرير',
    descriptionEn: 'Pure deep dark black background with royal gold hover highlights',
    isPremium: true,
    unlockCode: '8492031765',
    canvas: '#050505',
    surface: '#0A0A0A',
    ink: '#FAF5E8',
    accent: '#D4AF37',
    previewBackground: '#050505',
  },
  {
    id: 'parchment',
    name: 'بردية قديمة',
    nameEn: 'Ancient Parchment',
    description: 'درجات رقّ عتيق مريحة للقراءة الطويلة نهاراً',
    descriptionEn: 'Soft antique parchment tones tuned for long daytime reading',
    isPremium: false,
    canvas: '#F4ECD8',
    surface: '#EAE0C8',
    ink: '#2D2418',
    accent: '#854D0E',
    previewBackground: '#F4ECD8',
  },
  {
    id: 'botanical',
    name: 'غابة هادئة',
    nameEn: 'Quiet Botanical',
    description: 'ورق نباتي أخضر باهت مع حبر غابات عميق',
    descriptionEn: 'Pale sage paper paired with deep forest botanical ink',
    isPremium: false,
    canvas: '#F3F6F2',
    surface: '#E7EDE5',
    ink: '#18231C',
    accent: '#14532D',
    previewBackground: '#F3F6F2',
  },
  {
    id: 'lapis',
    name: 'رواق لازوردي',
    nameEn: 'Lapis Gallery',
    description: 'أبيض معرضي ناصع مع أزرق لازوردي كلاسيكي',
    descriptionEn: 'Crisp gallery white with classic lapis blue accents',
    isPremium: false,
    canvas: '#FFFFFF',
    surface: '#F5F7FA',
    ink: '#0F172A',
    accent: '#1E3A8A',
    previewBackground: '#FFFFFF',
  },
  {
    id: 'ivory-silk',
    name: 'حرير عاجي',
    nameEn: 'Ivory Silk',
    description: 'ورق عاجي ناعم بتفاصيل نيلية هادئة للقراءة النهارية',
    descriptionEn: 'Soft ivory paper paired with calm royal indigo accents',
    isPremium: false,
    canvas: '#FAF8F3',
    surface: '#F1EDE4',
    ink: '#1F1921',
    accent: '#4338CA',
    previewBackground: '#FAF8F3',
  },
  {
    id: 'midnight',
    name: 'حبر ليلي',
    nameEn: 'Midnight Ink',
    description: 'خلفية داكنة دافئة للقراءة الليلية دون إجهاد',
    descriptionEn: 'Warm dark canvas crafted for low-strain night reading',
    isPremium: false,
    canvas: '#141312',
    surface: '#1E1C1A',
    ink: '#F2EFE9',
    accent: '#EA580C',
    previewBackground: '#141312',
  },
  {
    id: 'slate',
    name: 'أردواز عميق',
    nameEn: 'Deep Slate',
    description: 'أزرق ليلي بارد مع تباين واضح للقراءة المتأخرة',
    descriptionEn: 'Cool night slate blue with sharp contrast for late reading',
    isPremium: false,
    canvas: '#0F172A',
    surface: '#182238',
    ink: '#F1F5F9',
    accent: '#0284C7',
    previewBackground: '#0F172A',
  },
  {
    id: 'obsidian-ink',
    name: 'حبر الأوبسيديان',
    nameEn: 'Obsidian Ink',
    description: 'سواد فحمي أنيق عالي التباين مع إضاءة سماوية هادئة للعيون',
    descriptionEn: 'Sleek volcanic charcoal with crisp moonlight cyan accents',
    isPremium: false,
    canvas: '#0B0C0F',
    surface: '#13151B',
    ink: '#F1F3F7',
    accent: '#38BDF8',
    previewBackground: '#0B0C0F',
  },
  {
    id: 'espresso-study',
    name: 'مكتب الإسبريسو',
    nameEn: 'Espresso Study',
    description: 'بني خشبي داكن دافئ مستوحى من المكتبات الكلاسيكية ليلاً',
    descriptionEn: 'Rich dark roasted espresso tones for cozy late-night reading',
    isPremium: false,
    canvas: '#16100D',
    surface: '#201813',
    ink: '#F5ECE2',
    accent: '#E07A3F',
    previewBackground: '#16100D',
  },
  {
    id: 'night-pine',
    name: 'صنوبر الليل',
    nameEn: 'Night Pine',
    description: 'أخضر ليلي عميق مريح للنظر مع لمسات عشبية مضيئة',
    descriptionEn: 'Deep nocturnal pine green crafted for soothing night reading',
    isPremium: false,
    canvas: '#0B1410',
    surface: '#122019',
    ink: '#EAF4EE',
    accent: '#34D399',
    previewBackground: '#0B1410',
  },
  {
    id: 'mamluk-gold',
    name: 'ذهب مملوكي',
    nameEn: 'Mamluk Gold',
    description: 'خلفية أوبسيديان فاخرة بإضاءة ذهبية متدرجة وحبر عاجي',
    descriptionEn: 'Obsidian backdrop with subtle golden illumination and ivory text',
    isPremium: true,
    unlockCode: '7492018356',
    canvas: '#171310',
    surface: '#221C16',
    ink: '#F9F3E6',
    accent: '#D97706',
    previewBackground:
      'radial-gradient(circle at 80% 15%, rgba(217, 119, 6, 0.24), transparent 55%), #171310',
  },
  {
    id: 'phoenician-marble',
    name: 'مرمر فينيقي',
    nameEn: 'Phoenician Marble',
    description: 'خلفية رخامية وردية دافئة مع تفاصيل عنابية ملكية',
    descriptionEn: 'Warm rose marble canvas with royal burgundy highlights',
    isPremium: true,
    unlockCode: '3829104752',
    canvas: '#FAF4F2',
    surface: '#F2E7E4',
    ink: '#291518',
    accent: '#881337',
    previewBackground:
      'radial-gradient(circle at 18% 20%, rgba(136, 19, 55, 0.08), transparent 55%), linear-gradient(135deg, #FAF4F2 0%, #F2E4E0 100%)',
  },
  {
    id: 'damascus-pearl',
    name: 'لؤلؤ دمشقي',
    nameEn: 'Damascus Pearl',
    description: 'خلفية لؤلؤية فضية مصقولة مع حبر أزرق ملكي عميق',
    descriptionEn: 'Brushed silver-pearl canvas paired with deep royal sapphire',
    isPremium: true,
    unlockCode: '8319462057',
    canvas: '#F4F6F8',
    surface: '#EAEFF4',
    ink: '#131C26',
    accent: '#1D4ED8',
    previewBackground:
      'radial-gradient(circle at 20% 15%, rgba(29, 78, 216, 0.08), transparent 52%), linear-gradient(135deg, #F4F6F8 0%, #E5ECF3 100%)',
  },
  {
    id: 'andalus-cobalt',
    name: 'سماء الأندلس',
    nameEn: 'Andalus Cobalt',
    description: 'خلفية ياقوتية عميقة بنسيج ليلي وإضاءة كهرمانية',
    descriptionEn: 'Deep sapphire night texture accented with warm amber light',
    isPremium: true,
    unlockCode: '6154920837',
    canvas: '#0C1426',
    surface: '#141F38',
    ink: '#EEF2FF',
    accent: '#F59E0B',
    previewBackground:
      'radial-gradient(circle at 85% 10%, rgba(56, 189, 248, 0.16), transparent 50%), radial-gradient(circle at 15% 85%, rgba(245, 158, 11, 0.12), transparent 55%), #0C1426',
  },
  {
    id: 'emerald-manuscript',
    name: 'رقّ زمردي',
    nameEn: 'Emerald Manuscript',
    description: 'خلفية زمردية مخملية مستوحاة من أغلفت المخطوطات النادرة',
    descriptionEn: 'Velvet emerald backdrop inspired by rare manuscript bindings',
    isPremium: true,
    unlockCode: '9047281635',
    canvas: '#0D1E18',
    surface: '#152B23',
    ink: '#ECFDF5',
    accent: '#D4A338',
    previewBackground:
      'radial-gradient(circle at 20% 15%, rgba(212, 163, 56, 0.16), transparent 50%), linear-gradient(160deg, #0D1E18 0%, #091511 100%)',
  },
  {
    id: 'crimson-velvet',
    name: 'مخمل قرمزي',
    nameEn: 'Crimson Velvet',
    description: 'خلفية عنابية قاتمة فاخرة بإضاءة ياقوتية دافئة ونص عاجي',
    descriptionEn: 'Sumptuous dark burgundy velvet with warm ruby illumination',
    isPremium: true,
    unlockCode: '5183920467',
    canvas: '#13090C',
    surface: '#1E0F14',
    ink: '#FDF2F4',
    accent: '#FB7185',
    previewBackground:
      'radial-gradient(circle at 82% 14%, rgba(251, 113, 133, 0.2), transparent 52%), radial-gradient(circle at 15% 85%, rgba(159, 18, 57, 0.18), transparent 55%), #13090C',
  },
  {
    id: 'nebula-amethyst',
    name: 'ليلة جمشتية',
    nameEn: 'Royal Amethyst',
    description: 'ليل بنفسجي ملكي عميق بتدرجات جمشتية وإضاءة فضية هادئة',
    descriptionEn: 'Deep royal midnight-plum with soft amethyst nebula glow',
    isPremium: true,
    unlockCode: '2947105836',
    canvas: '#0E0B1A',
    surface: '#17132B',
    ink: '#F3F0FF',
    accent: '#A78BFA',
    previewBackground:
      'radial-gradient(circle at 80% 18%, rgba(167, 139, 250, 0.2), transparent 50%), radial-gradient(circle at 20% 82%, rgba(91, 33, 182, 0.18), transparent 55%), #0E0B1A',
  },
  {
    id: 'abyssal-teal',
    name: 'أعماق المحيط',
    nameEn: 'Abyssal Teal',
    description: 'ظلمة بحرية عميقة هادئة بإضاءة فيروزية متلألئة ونص لؤلؤي',
    descriptionEn: 'Deep oceanic midnight canvas illuminated by luminous teal',
    isPremium: true,
    unlockCode: '6730491825',
    canvas: '#071418',
    surface: '#0D2026',
    ink: '#ECFEFF',
    accent: '#2DD4BF',
    previewBackground:
      'radial-gradient(circle at 22% 14%, rgba(45, 212, 191, 0.18), transparent 52%), radial-gradient(circle at 85% 84%, rgba(14, 116, 144, 0.2), transparent 55%), #071418',
  },
  {
    id: 'pharaoh-onyx',
    name: 'أونيكس فرعوني',
    nameEn: 'Pharaoh Onyx',
    description: 'حجر أونيكس أسود مهيب بإضاءة برونزية ذهبية وتفاصيل لازوردية',
    descriptionEn: 'Majestic dark carbon onyx touched with antique bronze gold',
    isPremium: true,
    unlockCode: '4091827365',
    canvas: '#090A0D',
    surface: '#12141A',
    ink: '#F8F6F0',
    accent: '#EAB308',
    previewBackground:
      'radial-gradient(circle at 78% 12%, rgba(234, 179, 8, 0.18), transparent 48%), radial-gradient(circle at 18% 84%, rgba(30, 64, 175, 0.16), transparent 54%), #090A0D',
  },
];

export const PREMIUM_THEMES = THEME_CATALOG.filter((t) => t.isPremium);
