export type AppIconId =
  | 'classic-copper'
  | 'obsidian-cyan'
  | 'archival-terracotta'
  | 'emerald-forest'
  | 'lapis-royal'
  | 'espresso-amber'
  | 'slate-cobalt'
  | 'crimson-ink'
  | 'vip-golden-king'
  | 'vip-cyber-neon'
  | 'vip-ruby-velvet'
  | 'vip-aurora-prism'
  | 'vip-platinum-crown'
  | 'vip-emerald-gold'
  | 'vip-sunset-silk'
  | 'vip-sapphire-luxe';

export interface AppIconGradient {
  type: 'linear' | 'radial';
  from: string;
  via?: string;
  to: string;
  x1?: string;
  y1?: string;
  x2?: string;
  y2?: string;
}

export interface AppIconDefinition {
  id: AppIconId;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  isPremium: boolean;
  unlockCode?: string;
  tokenPriceOverride?: number | null;
  bgFill: string;
  bgGradient?: AppIconGradient;
  borderStroke: string;
  borderOpacity: number;
  bookStroke: string;
  bookGradient?: AppIconGradient;
  cursorFill: string;
  cursorGradient?: AppIconGradient;
  themeColor: string;
}

export const DEFAULT_APP_ICON_ID: AppIconId = 'classic-copper';

export const APP_ICON_CATALOG: AppIconDefinition[] = [
  // --- 8 Free Color Variants (Same Browser Tab Shape) ---
  {
    id: 'classic-copper',
    name: 'النحاسي الكلاسيكي',
    nameEn: 'Classic Copper',
    description: 'الشعار الأصلي: خلفية فحمية داكنة مع كتاب ومؤشر نحاسي وإطار ذهبي خفيف',
    descriptionEn: 'Signature look: dark charcoal card with copper-orange book & cursor and subtle gold frame',
    isPremium: false,
    bgFill: '#1C1917',
    borderStroke: '#D4AF37',
    borderOpacity: 0.28,
    bookStroke: '#E07A2B',
    cursorFill: '#E07A2B',
    themeColor: '#1C1917',
  },
  {
    id: 'obsidian-cyan',
    name: 'أوبسيديان سماوي',
    nameEn: 'Obsidian Cyan',
    description: 'سواد الأوبسيديان العميق مع توهج أزرق سماوي متناغم مع السمة الافتراضية',
    descriptionEn: 'Volcanic obsidian backdrop paired with crisp sky-cyan book & pointer',
    isPremium: false,
    bgFill: '#0B0C0F',
    borderStroke: '#38BDF8',
    borderOpacity: 0.34,
    bookStroke: '#38BDF8',
    cursorFill: '#7DD3FC',
    themeColor: '#0B0C0F',
  },
  {
    id: 'archival-terracotta',
    name: 'ورق أرشيفي طيني',
    nameEn: 'Archival Terracotta',
    description: 'خلفية ورقية دافئة فاتحة مع رسمة طينية كلاسيكية وإطار برونزي هادئ',
    descriptionEn: 'Warm archival cream paper with classic terracotta linework',
    isPremium: false,
    bgFill: '#FBF9F5',
    borderStroke: '#9A3412',
    borderOpacity: 0.26,
    bookStroke: '#9A3412',
    cursorFill: '#B45309',
    themeColor: '#FBF9F5',
  },
  {
    id: 'emerald-forest',
    name: 'أخضر الغابات',
    nameEn: 'Emerald Forest',
    description: 'خلفية صنوبرية ليلية هادئة مع شعار زمردي نعناعي واضح',
    descriptionEn: 'Deep nocturnal pine backdrop with crisp mint-emerald book & cursor',
    isPremium: false,
    bgFill: '#0B1410',
    borderStroke: '#34D399',
    borderOpacity: 0.32,
    bookStroke: '#34D399',
    cursorFill: '#6EE7B7',
    themeColor: '#0B1410',
  },
  {
    id: 'lapis-royal',
    name: 'لازوردي ناصع',
    nameEn: 'Lapis Gallery',
    description: 'بطاقة بيضاء معرضية أنيقة مع تفاصيل أزرق لازوردي ملكي',
    descriptionEn: 'Crisp gallery white icon with royal lapis blue lines',
    isPremium: false,
    bgFill: '#FFFFFF',
    borderStroke: '#1E3A8A',
    borderOpacity: 0.24,
    bookStroke: '#1E3A8A',
    cursorFill: '#2563EB',
    themeColor: '#FFFFFF',
  },
  {
    id: 'espresso-amber',
    name: 'إسبريسو كهرماني',
    nameEn: 'Espresso Amber',
    description: 'بني خشبي دافئ مستوحى من المكتبات العتيقة مع خطوط كهرمانية',
    descriptionEn: 'Dark roasted espresso tones with warm honey-amber strokes',
    isPremium: false,
    bgFill: '#16100D',
    borderStroke: '#F59E0B',
    borderOpacity: 0.32,
    bookStroke: '#E07A3F',
    cursorFill: '#FBBF24',
    themeColor: '#16100D',
  },
  {
    id: 'slate-cobalt',
    name: 'أردواز كوبالت',
    nameEn: 'Slate Cobalt',
    description: 'أزرق ليلي بارد مع لمسات كوبالت مضيئة لقراءة هادئة',
    descriptionEn: 'Cool slate blue canvas accented with bright cobalt blue',
    isPremium: false,
    bgFill: '#0F172A',
    borderStroke: '#38BDF8',
    borderOpacity: 0.3,
    bookStroke: '#0EA5E9',
    cursorFill: '#38BDF8',
    themeColor: '#0F172A',
  },
  {
    id: 'crimson-ink',
    name: 'حبر قرمزي',
    nameEn: 'Crimson Ink',
    description: 'خلفية داكنة مع خطوط قرمزية دافئة وإطار وردي خفيف',
    descriptionEn: 'Deep charcoal slate with warm crimson-rose strokes',
    isPremium: false,
    bgFill: '#160B0F',
    borderStroke: '#FB7185',
    borderOpacity: 0.34,
    bookStroke: '#F43F5E',
    cursorFill: '#FB7185',
    themeColor: '#160B0F',
  },

  // --- 8 Premium VIP Color Variants (Same Browser Tab Shape, Luxury Palettes & Gradients) ---
  {
    id: 'vip-golden-king',
    name: 'الجولدن كينج الملكي',
    nameEn: 'VIP Golden King',
    description: 'أسود ملكي فاحم بتدرج ذهب خالص لامع وإطار مذهب فخم',
    descriptionEn: 'Pure obsidian black with radiant 24k metallic gold gradient strokes',
    isPremium: true,
    unlockCode: '1948273650',
    bgFill: '#050505',
    bgGradient: {
      type: 'radial',
      from: '#1D1606',
      via: '#090804',
      to: '#030303',
    },
    borderStroke: '#D4AF37',
    borderOpacity: 0.72,
    bookStroke: '#F5D061',
    bookGradient: {
      type: 'linear',
      from: '#FFF3B0',
      via: '#D4AF37',
      to: '#9A6B12',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    cursorFill: '#FFE27A',
    cursorGradient: {
      type: 'linear',
      from: '#FFF7CC',
      to: '#D4AF37',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    themeColor: '#050505',
  },
  {
    id: 'vip-cyber-neon',
    name: 'سايبر نيون فائق',
    nameEn: 'VIP Cyber Neon',
    description: 'ليلكي ليلي عميق بتدرج نيون فيروزي وبنفسجي كهربائي مبهر',
    descriptionEn: 'Midnight indigo with electric neon cyan-to-violet gradient',
    isPremium: true,
    unlockCode: '2839405162',
    bgFill: '#070615',
    bgGradient: {
      type: 'linear',
      from: '#09051A',
      via: '#120B2E',
      to: '#061524',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    borderStroke: '#22D3EE',
    borderOpacity: 0.7,
    bookStroke: '#22D3EE',
    bookGradient: {
      type: 'linear',
      from: '#22D3EE',
      via: '#818CF8',
      to: '#F472B6',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    cursorFill: '#F472B6',
    cursorGradient: {
      type: 'linear',
      from: '#38BDF8',
      to: '#E879F9',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    themeColor: '#070615',
  },
  {
    id: 'vip-ruby-velvet',
    name: 'ياقوت ومخمل ملكي',
    nameEn: 'VIP Ruby Velvet',
    description: 'مخمل عنابي عميق مع كتاب ياقوتي متدرج بلمسة ذهبية دافئة',
    descriptionEn: 'Deep velvet burgundy with faceted ruby-rose and champagne gold highlights',
    isPremium: true,
    unlockCode: '3748596012',
    bgFill: '#16060B',
    bgGradient: {
      type: 'radial',
      from: '#3A0A1B',
      via: '#1E060F',
      to: '#0E0307',
    },
    borderStroke: '#FB7185',
    borderOpacity: 0.65,
    bookStroke: '#FDA4AF',
    bookGradient: {
      type: 'linear',
      from: '#FFE4E6',
      via: '#FB7185',
      to: '#E11D48',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    cursorFill: '#FDE68A',
    cursorGradient: {
      type: 'linear',
      from: '#FEF3C7',
      to: '#F59E0B',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    themeColor: '#16060B',
  },
  {
    id: 'vip-aurora-prism',
    name: 'شفق أبيض قزحي',
    nameEn: 'VIP Aurora Prism',
    description: 'أيقونة شفق قطبي بتدرج زمردي فيروزي لازوردي ساحر',
    descriptionEn: 'Northern lights aurora gradient from emerald mint to glacial blue',
    isPremium: true,
    unlockCode: '4657687923',
    bgFill: '#051519',
    bgGradient: {
      type: 'linear',
      from: '#041C1A',
      via: '#061B29',
      to: '#130F2B',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    borderStroke: '#5EEAD4',
    borderOpacity: 0.68,
    bookStroke: '#5EEAD4',
    bookGradient: {
      type: 'linear',
      from: '#6EE7B7',
      via: '#2DD4BF',
      to: '#60A5FA',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    cursorFill: '#A7F3D0',
    cursorGradient: {
      type: 'linear',
      from: '#ECFDF5',
      to: '#34D399',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    themeColor: '#051519',
  },
  {
    id: 'vip-platinum-crown',
    name: 'بلاتينوم وفضة مصقولة',
    nameEn: 'VIP Platinum Crown',
    description: 'تيتانيوم داكن مصقول مع خطوط فضية بلاتينية ساطعة',
    descriptionEn: 'Brushed gunmetal titanium paired with mirror-finish platinum silver',
    isPremium: true,
    unlockCode: '5568798034',
    bgFill: '#111318',
    bgGradient: {
      type: 'linear',
      from: '#1E222B',
      via: '#12151C',
      to: '#090A0E',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    borderStroke: '#E2E8F0',
    borderOpacity: 0.65,
    bookStroke: '#F8FAFC',
    bookGradient: {
      type: 'linear',
      from: '#FFFFFF',
      via: '#CBD5E1',
      to: '#94A3B8',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    cursorFill: '#F8FAFC',
    cursorGradient: {
      type: 'linear',
      from: '#FFFFFF',
      to: '#CBD5E1',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    themeColor: '#111318',
  },
  {
    id: 'vip-emerald-gold',
    name: 'الزمرد المذهب',
    nameEn: 'VIP Emerald & Gold',
    description: 'زمرد ملكي داكن مطعّم بإطار وشعار من الذهب الدافئ',
    descriptionEn: 'Imperial velvet emerald inlaid with warm antique gold linework',
    isPremium: true,
    unlockCode: '6479809145',
    bgFill: '#071B14',
    bgGradient: {
      type: 'radial',
      from: '#0E3426',
      via: '#071D15',
      to: '#03100B',
    },
    borderStroke: '#EAB308',
    borderOpacity: 0.7,
    bookStroke: '#FACC15',
    bookGradient: {
      type: 'linear',
      from: '#FEF08A',
      via: '#EAB308',
      to: '#CA8A04',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    cursorFill: '#6EE7B7',
    cursorGradient: {
      type: 'linear',
      from: '#A7F3D0',
      to: '#10B981',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    themeColor: '#071B14',
  },
  {
    id: 'vip-sunset-silk',
    name: 'حرير الغروب الناري',
    nameEn: 'VIP Sunset Silk',
    description: 'أرجواني داكن مخملي مع تدرج ذهبي برتقالي مستوحى من الغروب',
    descriptionEn: 'Deep twilight plum lit with molten amber-to-coral sunset gradients',
    isPremium: true,
    unlockCode: '7380910256',
    bgFill: '#1B0B1E',
    bgGradient: {
      type: 'linear',
      from: '#270D28',
      via: '#1B0A1F',
      to: '#130714',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    borderStroke: '#FB923C',
    borderOpacity: 0.72,
    bookStroke: '#FDBA74',
    bookGradient: {
      type: 'linear',
      from: '#FDE047',
      via: '#FB923C',
      to: '#F43F5E',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    cursorFill: '#FDE047',
    cursorGradient: {
      type: 'linear',
      from: '#FEF08A',
      to: '#FB923C',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    themeColor: '#1B0B1E',
  },
  {
    id: 'vip-sapphire-luxe',
    name: 'ياقوت أزرق وذهب أندلسي',
    nameEn: 'VIP Andalus Sapphire',
    description: 'سماء أندلسية ياقوتية عميقة مع كتاب ومؤشر أبيض لؤلؤي وإطار ذهبي',
    descriptionEn: 'Deep Andalusian sapphire sky framed in gold with pearl-cyan accents',
    isPremium: true,
    unlockCode: '8291031467',
    bgFill: '#07122B',
    bgGradient: {
      type: 'radial',
      from: '#112A5C',
      via: '#09183A',
      to: '#040B1D',
    },
    borderStroke: '#FBBF24',
    borderOpacity: 0.75,
    bookStroke: '#93C5FD',
    bookGradient: {
      type: 'linear',
      from: '#FFFFFF',
      via: '#93C5FD',
      to: '#38BDF8',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    cursorFill: '#FCD34D',
    cursorGradient: {
      type: 'linear',
      from: '#FEF3C7',
      to: '#F59E0B',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    },
    themeColor: '#07122B',
  },
];

export const PREMIUM_APP_ICONS = APP_ICON_CATALOG.filter((icon) => icon.isPremium);

export function getAppIconById(iconId?: string | null): AppIconDefinition {
  return (
    APP_ICON_CATALOG.find((item) => item.id === iconId) ??
    APP_ICON_CATALOG[0]
  );
}

export function isValidAppIconId(iconId?: string | null): iconId is AppIconId {
  return Boolean(iconId && APP_ICON_CATALOG.some((item) => item.id === iconId));
}

function buildSvgGradientDef(id: string, grad: AppIconGradient): string {
  if (grad.type === 'radial') {
    return `
      <radialGradient id="${id}" cx="28%" cy="22%" r="78%">
        <stop offset="0%" stop-color="${grad.from}" />
        ${grad.via ? `<stop offset="52%" stop-color="${grad.via}" />` : ''}
        <stop offset="100%" stop-color="${grad.to}" />
      </radialGradient>
    `;
  }
  return `
    <linearGradient id="${id}" x1="${grad.x1 ?? '0%'}" y1="${grad.y1 ?? '0%'}" x2="${grad.x2 ?? '100%'}" y2="${grad.y2 ?? '100%'}">
      <stop offset="0%" stop-color="${grad.from}" />
      ${grad.via ? `<stop offset="50%" stop-color="${grad.via}" />` : ''}
      <stop offset="100%" stop-color="${grad.to}" />
    </linearGradient>
  `;
}

/**
 * Generates an SVG string matching the exact browser-tab /icon.svg book+cursor geometry,
 * customized with the selected palette.
 */
export function renderAppIconSvg(
  iconId?: string | null,
  options?: { size?: number; maskable?: boolean; idPrefix?: string }
): string {
  const icon = getAppIconById(iconId);
  const size = options?.size && Number.isFinite(options.size) ? Math.max(16, Math.round(options.size)) : 512;
  const maskable = Boolean(options?.maskable);
  const safePrefix = (options?.idPrefix ?? icon.id).replace(/[^a-zA-Z0-9_-]/g, '');

  const maskId = `cursor-cutout-${safePrefix}`;
  const bgGradId = `bg-grad-${safePrefix}`;
  const bookGradId = `book-grad-${safePrefix}`;
  const cursorGradId = `cursor-grad-${safePrefix}`;

  const defsParts: string[] = [
    `<mask id="${maskId}">
      <rect x="0" y="0" width="100" height="88" fill="white" />
      <path
        d="M 60 47 L 66 72 L 71 67 L 78 74 L 83 69 L 76 62 L 83 57 Z"
        fill="black"
        stroke="black"
        stroke-width="7"
        stroke-linejoin="round"
      />
    </mask>`,
  ];

  if (icon.bgGradient) defsParts.push(buildSvgGradientDef(bgGradId, icon.bgGradient));
  if (icon.bookGradient) defsParts.push(buildSvgGradientDef(bookGradId, icon.bookGradient));
  if (icon.cursorGradient) defsParts.push(buildSvgGradientDef(cursorGradId, icon.cursorGradient));

  const bgPaint = icon.bgGradient ? `url(#${bgGradId})` : icon.bgFill;
  const bookPaint = icon.bookGradient ? `url(#${bookGradId})` : icon.bookStroke;
  const cursorPaint = icon.cursorGradient ? `url(#${cursorGradId})` : icon.cursorFill;
  const outerRx = maskable ? 0 : 96;

  // Maskable icons scale artwork inside Android's 80% safe zone while keeping background full-bleed
  const innerContent = `
    <rect x="36" y="36" width="440" height="440" rx="72" stroke="${icon.borderStroke}" stroke-opacity="${icon.borderOpacity}" stroke-width="4" />
    <g transform="translate(56, 80) scale(4)">
      <g
        mask="url(#${maskId})"
        stroke="${bookPaint}"
        stroke-width="5.2"
        stroke-linecap="butt"
        stroke-linejoin="round"
      >
        <path d="M 12 24 V 66 C 27 65 40 70 50 80 C 60 70 73 65 88 66 V 24" />
        <path d="M 50 27 C 43 19 32 17 21 17 V 59 C 31 59 41 64 50 74 C 59 64 69 59 79 59 V 17 C 68 17 57 19 50 27 Z" />
        <line x1="50" y1="26" x2="50" y2="74" stroke-linecap="round" />
      </g>
      <path
        d="M 60 47 L 66 72 L 71 67 L 78 74 L 83 69 L 76 62 L 83 57 Z"
        fill="${cursorPaint}"
      />
    </g>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" fill="none">
  <defs>
    ${defsParts.join('\n    ')}
  </defs>
  <rect width="512" height="512" rx="${outerRx}" fill="${bgPaint}" />
  ${maskable ? `<g transform="translate(51.2, 51.2) scale(0.8)">${innerContent}</g>` : innerContent}
</svg>`;
}
