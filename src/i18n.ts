export type AppLanguage = 'ar' | 'en';

export function isEnglish(lang: AppLanguage): boolean {
  return lang === 'en';
}

export function getThemeDisplayName(
  theme: { name: string; nameEn: string },
  lang: AppLanguage
): string {
  return lang === 'en' ? theme.nameEn : theme.name;
}

export function getThemeDisplayDescription(
  theme: { description: string; descriptionEn: string },
  lang: AppLanguage
): string {
  return lang === 'en' ? theme.descriptionEn : theme.description;
}

export const DEFAULT_SECTION_TRANSLATIONS: Record<string, string> = {
  العلوم: 'Science',
  علوم: 'Science',
  الأدب: 'Literature',
  الادب: 'Literature',
  أدب: 'Literature',
  ادب: 'Literature',
  التاريخ: 'History',
  تاريخ: 'History',
  'العمارة والفنون': 'Architecture & Arts',
  'تاريخ العلوم': 'History of Science',
  'أدب الرحلات': 'Travel Literature',
  'ادب الرحلات': 'Travel Literature',
  'الخط والوراقة': 'Calligraphy & Bookcraft',
  عام: 'General',
  الفلسفة: 'Philosophy',
  فلسفة: 'Philosophy',
  الفلسفةوالفكر: 'Philosophy & Thought',
  'الفكر والفلسفة': 'Thought & Philosophy',
  الدين: 'Religion',
  'العلوم الإسلامية': 'Islamic Studies',
  الفقه: 'Jurisprudence',
  التفسير: 'Quranic Exegesis',
  الحديث: 'Hadith',
  السيرة: 'Biography',
  التراجم: 'Biographies',
  الشعر: 'Poetry',
  شعر: 'Poetry',
  الرواية: 'Novels',
  الروايات: 'Novels',
  روايات: 'Novels',
  القصة: 'Short Stories',
  القصص: 'Stories',
  النقد: 'Literary Criticism',
  'اللغة العربية': 'Arabic Language',
  اللغة: 'Languages',
  اللغات: 'Languages',
  التقنية: 'Technology',
  التكنولوجيا: 'Technology',
  البرمجة: 'Programming',
  'الذكاء الاصطناعي': 'Artificial Intelligence',
  الاقتصاد: 'Economics',
  السياسة: 'Politics',
  'علم النفس': 'Psychology',
  'علم الاجتماع': 'Sociology',
  التربية: 'Education',
  'التربية والتعليم': 'Education',
  الطب: 'Medicine',
  الصحة: 'Health',
  الرياضيات: 'Mathematics',
  الفيزياء: 'Physics',
  الكيمياء: 'Chemistry',
  الأحياء: 'Biology',
  الفلك: 'Astronomy',
  الجغرافيا: 'Geography',
  التراث: 'Heritage',
  الثقافة: 'Culture',
  الفنون: 'Arts',
  فنون: 'Arts',
  الأطفال: 'Children',
  'قصص الأطفال': "Children's Stories",
  'تطوير الذات': 'Self-Development',
  'إدارة الأعمال': 'Business Administration',
  القانون: 'Law',
};

const REVERSE_SECTION_TRANSLATIONS: Record<string, string> = (() => {
  const reverse: Record<string, string> = {};
  for (const [ar, en] of Object.entries(DEFAULT_SECTION_TRANSLATIONS)) {
    const key = en.toLowerCase();
    if (!reverse[key]) {
      reverse[key] = ar;
    }
  }
  return reverse;
})();

function stripArabicSectionPrefix(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith('قسم ') ? trimmed.slice(4).trim() : trimmed;
}

export function getSectionDisplayName(
  section: string,
  lang: AppLanguage,
  customMap?: Record<string, string>
): string {
  const trimmed = section.trim();
  if (!trimmed) return '';

  const base = stripArabicSectionPrefix(trimmed);

  if (lang === 'en') {
    const customEn = customMap?.[trimmed]?.trim() || customMap?.[base]?.trim();
    if (customEn) return customEn;

    const dictEn = DEFAULT_SECTION_TRANSLATIONS[trimmed] ?? DEFAULT_SECTION_TRANSLATIONS[base];
    if (dictEn) return dictEn;

    return base;
  }

  // Arabic mode: if section was entered in English matching a known translation, map back to Arabic
  const reverseAr = REVERSE_SECTION_TRANSLATIONS[base.toLowerCase()];
  if (reverseAr) return reverseAr;

  return base;
}

export function formatSectionHeading(
  section: string,
  lang: AppLanguage,
  customMap?: Record<string, string>
): string {
  const display = getSectionDisplayName(section, lang, customMap);
  if (!display) return '';
  if (lang === 'en') {
    return display;
  }
  return display.startsWith('قسم ') ? display : `قسم ${display}`;
}

export const UI_COPY = {
  ar: {
    brandShort: 'مكتبتي',
    brandFranco: 'maktabty',
    brandFull: 'مكتبتي · maktabty',
    navHome: 'الرئيسية',
    navCatalog: 'فهرس الكتب',
    navPremium: 'البريميوم',
    navMyReading: 'قراءاتي',
    navYou: 'أنت',
    navSettings: 'الإعدادات',
    navDeveloperSettings: 'إعدادات المطور',
    featuredEdition: 'الإصدار المختار',
    versionLabel: 'نسخة',
    readersRating: 'التقييم العام للقراء',
    continueReadingBtn: 'متابعة القراءة',
    startReadingBtn: 'ابدأ القراءة الآن',
    modeLabel: 'الوضع الحالي:',
    modeDev: 'وضع المطور',
    modeReader: 'وضع القارئ',
    localSaveLabel: 'القراءة والحفظ محلياً على جهازك',
    autoUpdateLabel: 'تحديث تلقائي للكتب الجديدة',
    offlineCountSuffix: 'كتب متاحة دون اتصال',
    continueSectionTitle: 'قراءاتي المحفوظة',
    continueSectionSubtitle: 'جميع الكتب التي بدأت قراءتها وتقدمك المحفوظ تلقائياً على جهازك.',
    savedLocally: 'محفوظة محلياً',
    resumeArrow: 'استئناف ←',
    myReadingEmptyTitle: 'لا توجد كتب في قراءاتي بعد',
    myReadingEmptyDesc: 'افتح أي كتاب من فهرس الكتب أو قسم البريميوم وسيظهر تقدمك هنا تلقائياً لمتابعة القراءة من حيث توقفت.',
    goToCatalog: 'الانتقال إلى فهرس الكتب',
    goToPremium: 'استكشاف البريميوم',
    pageQuickLinksTitle: 'أقسام مكتبتي',
    catalogTitle: 'فهرس المكتبة',
    catalogSubtitle: 'اختر كتاباً لفتحه وقراءته بكامل فصوله أو صفحاته في وضع القراءة الهادئ.',
    searchPlaceholder: 'ابحث بالعنوان أو المؤلف...',
    searchAria: 'ابحث في الكتب',
    allCategory: 'الكل',
    noBooksFound: 'لا توجد كتب تطابق بحثك الحالي.',
    footerSettings: 'الإعدادات والسمات',
    rateBook: 'قيّم الكتاب',
    rateApp: 'قيّم البرنامج',
    overallRating: 'التقييم العام',
    premiumLabel: 'بريميوم',
    newBadge: 'جديد',
    pdfBookLabel: 'كتاب PDF تفاعلي',
    wordBookLabel: 'كتاب Word تفاعلي',
    pagesUnit: 'صفحة',
    chaptersWord: 'فصول',
    readingMinutesWord: 'دقيقة قراءة',
    enterCodeHint: 'اضغط لإدخال كود التفعيل (10 أرقام)',
    browsePages: 'تصفح الكتاب بالصفحات',
    readBook: 'اقرأ الكتاب',
    continueFromPage: 'متابعة من صفحة',
    continueFromChapter: 'متابعة من الفصل',
    settingsSubtitle: 'تخصيص المكتبة والقراءة',
    settingsTitle: 'الإعدادات',
    settingsLead: 'اختر اللغة والسمة المناسبة، اضبط تفضيلات القارئ، أو أدخل كلمة مرور المطور بالأسفل.',
    devSettingsSubtitle: 'الصلاحيات وإدارة المكتبة',
    devSettingsLead: 'إدارة الكتب والأقسام والتقييمات وأكواد البريميوم الدورية وصلاحيات الحسابات.',
    backToLibrary: 'العودة للمكتبة',
    exitDeveloper: 'الخروج من وضع المطور',
    languageSectionTitle: 'لغة التطبيق (Language)',
    languageSectionHint: 'اختر بين العربية أو الإنجليزية لواجهة المكتبة والإعدادات والقارئ.',
    langArabic: 'العربية',
    langEnglish: 'English',
    offlineNotice: 'وضع القراءة دون اتصال — يتم العرض من IndexedDB المحلي',
    browseBooks: 'تصفح الكتب',
    installLibrary: 'تثبيت مكتبتي',
    installIOS: 'تثبيت على iOS',
    devReviewsTitle: 'إدارة التعليقات وتقييمات الكتب',
    devReviewsSubtitle:
      'أضف تعليقات القراء وتقييم النجوم لكل كتاب، وسيُحسب متوسط التقييم تلقائياً ويظهر في كل أنحاء التطبيق.',
    bookDetailBack: 'العودة إلى المكتبة',
    bookDetailReviewsTitle: 'التقييمات والتعليقات',
    bookDetailNoReviews: 'لا توجد تعليقات أو تقييمات لهذا الكتاب بعد.',
    bookDetailReviewsCount: 'تقييمات',
    bookDetailOneReview: 'تقييم واحد',
    sectionsBrowseTitle: 'تصفح حسب الأقسام',
    sectionEmptyNotice: 'لا توجد كتب في هذا القسم حالياً.',
    booksInSectionSuffix: 'كتب',
    oneBookInSection: 'كتاب واحد',
    devSectionsTitle: 'إدارة أقسام المكتبة وتصنيف الكتب',
    devSectionsSubtitle:
      'أضف أقساماً جديدة، عدّل أسماء الأقسام الحالية، احذف أي قسم، أو انقل أي كتاب منشور إلى قسم معين.',
    addSectionPlaceholder: 'اسم القسم الجديد (مثال: العلوم، الفلسفة...)',
    addSectionEnPlaceholder: 'الاسم بالإنجليزية (اختياري، مثال: Philosophy)',
    renameSectionEnPlaceholder: 'الاسم بالإنجليزية (اختياري)',
    addSectionBtn: 'إضافة قسم',
    renameSectionBtn: 'تعديل الاسم',
    deleteSectionBtn: 'حذف القسم',
    assignSectionLabel: 'القسم:',
  },
  en: {
    brandShort: 'مكتبتي',
    brandFranco: 'maktabty',
    brandFull: 'مكتبتي · maktabty',
    navHome: 'Home',
    navCatalog: 'Catalog',
    navPremium: 'Premium',
    navMyReading: 'My Reading',
    navYou: 'You',
    navSettings: 'Settings',
    navDeveloperSettings: 'Developer Settings',
    featuredEdition: 'Featured Edition',
    versionLabel: 'v',
    readersRating: 'Readers Rating',
    continueReadingBtn: 'Continue Reading',
    startReadingBtn: 'Start Reading',
    modeLabel: 'Current Mode:',
    modeDev: 'Developer Mode',
    modeReader: 'Reader Mode',
    localSaveLabel: 'Read & saved locally on your device',
    autoUpdateLabel: 'Automatic updates for new books',
    offlineCountSuffix: 'books available offline',
    continueSectionTitle: 'My Saved Reading',
    continueSectionSubtitle: 'All books you started reading with progress saved automatically on this device.',
    savedLocally: 'Saved Locally',
    resumeArrow: 'Resume →',
    myReadingEmptyTitle: 'No books in My Reading yet',
    myReadingEmptyDesc: 'Open any book from the Catalog or Premium page and your progress will appear here automatically.',
    goToCatalog: 'Go to Book Catalog',
    goToPremium: 'Explore Premium',
    pageQuickLinksTitle: 'Library Pages',
    catalogTitle: 'Library Catalog',
    catalogSubtitle: 'Select any book to read all its chapters or pages in a calm reading space.',
    searchPlaceholder: 'Search by title or author...',
    searchAria: 'Search books',
    allCategory: 'All',
    noBooksFound: 'No books match your current search.',
    footerSettings: 'Settings & Themes',
    rateBook: 'Rate Book',
    rateApp: 'Rate App',
    overallRating: 'Overall Rating',
    premiumLabel: 'Premium',
    newBadge: 'New',
    pdfBookLabel: 'Interactive PDF Book',
    wordBookLabel: 'Interactive Word Book',
    pagesUnit: 'pages',
    chaptersWord: 'chapters',
    readingMinutesWord: 'min read',
    enterCodeHint: 'Tap to enter 10-digit unlock code',
    browsePages: 'Flip Book Pages',
    readBook: 'Read Book',
    continueFromPage: 'Continue from page',
    continueFromChapter: 'Continue from chapter',
    settingsSubtitle: 'Library & Reading Preferences',
    settingsTitle: 'Settings',
    settingsLead: 'Choose your language and theme, adjust reading preferences, or enter the developer password below.',
    devSettingsSubtitle: 'Permissions & Library Management',
    devSettingsLead: 'Manage books, sections, ratings, rotating premium codes, and user permissions.',
    backToLibrary: 'Back to Library',
    exitDeveloper: 'Exit Developer Mode',
    languageSectionTitle: 'App Language (لغة التطبيق)',
    languageSectionHint: 'Switch between Arabic and English for the library, settings, and reader.',
    langArabic: 'العربية',
    langEnglish: 'English',
    offlineNotice: 'Offline Reading Mode — Serving locally from IndexedDB',
    browseBooks: 'Browse Books',
    installLibrary: 'Install maktabty',
    installIOS: 'Install on iOS',
    devReviewsTitle: 'Manage Book Comments & Star Ratings',
    devReviewsSubtitle:
      'Add reader comments with star ratings for each book; the overall average rating recalculates automatically everywhere.',
    bookDetailBack: 'Back to Library',
    bookDetailReviewsTitle: 'Ratings & Comments',
    bookDetailNoReviews: 'No comments or ratings have been added for this book yet.',
    bookDetailReviewsCount: 'reviews',
    bookDetailOneReview: '1 review',
    sectionsBrowseTitle: 'Browse by Sections',
    sectionEmptyNotice: 'No books in this section yet.',
    booksInSectionSuffix: 'books',
    oneBookInSection: '1 book',
    devSectionsTitle: 'Manage Library Sections & Book Placement',
    devSectionsSubtitle:
      'Add new sections, rename or delete existing sections, or move any published book into a chosen section.',
    addSectionPlaceholder: 'New section name (e.g. Science, Philosophy...)',
    addSectionEnPlaceholder: 'English name (optional, e.g. Philosophy)',
    renameSectionEnPlaceholder: 'English name (optional)',
    addSectionBtn: 'Add Section',
    renameSectionBtn: 'Rename',
    deleteSectionBtn: 'Delete Section',
    assignSectionLabel: 'Section:',
  },
} as const;
