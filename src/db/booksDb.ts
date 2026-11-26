import { DEFAULT_APP_ICON_ID, PREMIUM_APP_ICONS, type AppIconId } from '../appIconCatalog';
import { PREMIUM_THEMES, type ThemeId } from '../themeCatalog';

export interface AppSettings {
  themeId: ThemeId;
  appIconId?: AppIconId;
  language: 'ar' | 'en';
  readerFontSize: number;
  readerLineHeight: 'relaxed' | 'loose' | 'airy';
  readerWidth: 'narrow' | 'medium' | 'wide';
  readerFontFamily: 'editorial' | 'sans';
  autoSaveProgress: boolean;
  showProgressHairline: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  themeId: 'obsidian-ink',
  appIconId: DEFAULT_APP_ICON_ID,
  language: 'ar',
  readerFontSize: 20,
  readerLineHeight: 'loose',
  readerWidth: 'medium',
  readerFontFamily: 'sans',
  autoSaveProgress: true,
  showProgressHairline: true,
};

export interface Chapter {
  id: string;
  number: string;
  title: string;
  epigraph?: string;
  paragraphs: string[];
}

export interface BookReview {
  id: string;
  bookId: string;
  reviewerUid?: string | null;
  reviewerName: string;
  rating: number;
  comment: string;
  isVerified?: boolean;
  isOwner?: boolean;
  likesCount?: number;
  likedByMe?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationNote?: string | null;
  createdAt: string;
}

export interface BookRecord {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  authorUid?: string | null;
  authorAccount?: {
    uid: string;
    displayName: string;
    isVerified: boolean;
    followersCount: number;
    isFollowing: boolean;
  } | null;
  isAuthorVerified?: boolean;
  category: string;
  year: number;
  pages: number;
  readingMinutes: number;
  rating?: number;
  reviews?: BookReview[];
  myPendingReview?: BookReview | null;
  version: number;
  updatedAt: string;
  addedAt?: string;
  featured?: boolean;
  isComingSoon?: boolean;
  comingSoonMode?: 'open' | 'date' | 'datetime';
  comingSoonReleaseAt?: string;
  isNotifySubscribed?: boolean;
  notifySubscribersCount?: number;
  isPreordered?: boolean;
  preordersCount?: number;
  isPremium?: boolean;
  priceLabel?: string;
  tokenPrice?: number | null;
  baseTokenPrice?: number;
  effectiveTokenPrice?: number;
  discountPercent?: number | null;
  discountStartedAt?: string | null;
  discountEndsAt?: string | null;
  discountPostReleaseDays?: number | null;
  pendingTokenPrice?: number | null;
  priceReviewStatus?: 'pending' | 'rejected' | null;
  priceReviewNote?: string | null;
  priceSubmittedAt?: string | null;
  publishTokensPaid?: number;
  rotationHours?: number;
  codeExpiresAt?: string;
  accessType?: 'free' | 'purchased' | 'code' | 'locked';
  isUnlocked?: boolean;
  purchasedAt?: string;
  codeAccessExpiresAt?: string;
  unlockCode?: string;
  bookType?: 'text' | 'pdf' | 'word';
  pdfId?: string;
  pdfPageCount?: number;
  coverUrl: string;
  synopsis: string;
  chapters: Chapter[];
  reviewStatus?: 'approved' | 'pending' | 'rejected';
  reviewNote?: string | null;
  submittedAt?: string | null;
  seriesId?: string | null;
  seriesTitle?: string | null;
  partNumber?: number | null;
  linkToBookId?: string | null;
  seriesPartOrder?: Array<{ bookId: string; partNumber: number }>;
}

export interface TokenEconomyConfig {
  welcomeBonusTokens: number;
  defaultPremiumBookPrice: number;
  defaultPremiumThemePrice: number;
  defaultPremiumIconPrice: number;
  publishRegularBookCost: number;
  publishPremiumBookCost: number;
  rewardCommentOnBook: number;
  rewardBookRatingAbove4: number;
  rewardBookCompleted: number;
  rewardNewFollower: number;
  rewardReviewLike: number;
  rewardBookApproved: number;
}

export const DEFAULT_TOKEN_ECONOMY_CONFIG: TokenEconomyConfig = {
  welcomeBonusTokens: 50,
  defaultPremiumBookPrice: 40,
  defaultPremiumThemePrice: 60,
  defaultPremiumIconPrice: 50,
  publishRegularBookCost: 15,
  publishPremiumBookCost: 30,
  rewardCommentOnBook: 5,
  rewardBookRatingAbove4: 35,
  rewardBookCompleted: 12,
  rewardNewFollower: 8,
  rewardReviewLike: 3,
  rewardBookApproved: 20,
};

export interface TokenTransactionItem {
  id: string;
  amount: number;
  kind: string;
  descriptionAr: string;
  descriptionEn: string;
  targetBookId: string | null;
  targetThemeId: string | null;
  createdAt: string;
}

export interface PremiumTradeRequest {
  id: string;
  senderUid: string;
  senderDisplayName: string;
  senderIsVerified: boolean;
  recipientUid: string;
  recipientDisplayName: string;
  recipientIsVerified: boolean;
  offeredType: 'book' | 'theme';
  offeredId: string;
  requestedType: 'book' | 'theme';
  requestedId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  respondedAt: string | null;
  createdAt: string;
}

export interface PendingPriceRequestItem {
  bookId: string;
  title: string;
  coverUrl: string;
  author: string;
  authorUid: string;
  isAuthorVerified: boolean;
  currentTokenPrice: number | null;
  effectiveCurrentPrice: number;
  proposedTokenPrice: number;
  submittedAt: string | null;
}

export interface PendingBookReviewItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string;
  reviewerUid: string | null;
  reviewerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

export interface BookEffectivePricing {
  basePrice: number;
  finalPrice: number;
  discountPercent: number | null;
  hasDiscount: boolean;
  discountStartedAt: string | null;
  discountEndsAt: string | null;
  discountPostReleaseDays: number | null;
}

export function getEffectiveBookPricing(
  book: Pick<
    BookRecord,
    | 'isPremium'
    | 'tokenPrice'
    | 'baseTokenPrice'
    | 'effectiveTokenPrice'
    | 'discountPercent'
    | 'discountStartedAt'
    | 'discountEndsAt'
    | 'discountPostReleaseDays'
  >,
  defaultPremiumBookPrice = 40,
  nowMs = Date.now()
): BookEffectivePricing {
  if (!book.isPremium) {
    return {
      basePrice: 0,
      finalPrice: 0,
      discountPercent: null,
      hasDiscount: false,
      discountStartedAt: null,
      discountEndsAt: null,
      discountPostReleaseDays: null,
    };
  }
  const basePrice =
    typeof book.baseTokenPrice === 'number' && Number.isFinite(book.baseTokenPrice) && book.baseTokenPrice >= 0
      ? Math.floor(book.baseTokenPrice)
      : typeof book.tokenPrice === 'number' && Number.isFinite(book.tokenPrice) && book.tokenPrice >= 0
        ? Math.floor(book.tokenPrice)
        : Math.max(0, Math.floor(defaultPremiumBookPrice));

  const endsAtRaw = book.discountEndsAt?.trim() || null;
  const endsAtMs = endsAtRaw ? Date.parse(endsAtRaw) : null;
  const notExpired = endsAtMs === null || (!Number.isNaN(endsAtMs) && endsAtMs > nowMs);
  const rawPct =
    typeof book.discountPercent === 'number' && Number.isFinite(book.discountPercent)
      ? Math.floor(book.discountPercent)
      : null;
  const activeDiscountPercent =
    rawPct !== null && rawPct >= 1 && rawPct <= 99 && notExpired ? rawPct : null;
  const postReleaseDays =
    typeof book.discountPostReleaseDays === 'number' &&
    Number.isFinite(book.discountPostReleaseDays) &&
    book.discountPostReleaseDays >= 1
      ? Math.floor(book.discountPostReleaseDays)
      : null;

  if (activeDiscountPercent !== null) {
    const computedFinal = Math.max(0, Math.round(basePrice * (1 - activeDiscountPercent / 100)));
    return {
      basePrice,
      finalPrice: computedFinal,
      discountPercent: activeDiscountPercent,
      hasDiscount: basePrice > 0 && computedFinal < basePrice,
      discountStartedAt: book.discountStartedAt ?? null,
      discountEndsAt: endsAtRaw,
      discountPostReleaseDays: postReleaseDays,
    };
  }

  return {
    basePrice,
    finalPrice: basePrice,
    discountPercent: null,
    hasDiscount: false,
    discountStartedAt: null,
    discountEndsAt: null,
    discountPostReleaseDays: null,
  };
}

export function formatDiscountRemainingLabel(
  endsAtIso: string | null | undefined,
  lang: 'ar' | 'en',
  nowMsOrOptions:
    | number
    | { isComingSoon?: boolean; discountPostReleaseDays?: number | null; nowMs?: number } = Date.now(),
  maybeOptions?: { isComingSoon?: boolean; discountPostReleaseDays?: number | null }
): string {
  const nowMs =
    typeof nowMsOrOptions === 'number'
      ? nowMsOrOptions
      : typeof nowMsOrOptions?.nowMs === 'number'
        ? nowMsOrOptions.nowMs
        : Date.now();
  const options =
    typeof nowMsOrOptions === 'number' ? maybeOptions : nowMsOrOptions;
  const postDays =
    typeof options?.discountPostReleaseDays === 'number' &&
    Number.isFinite(options.discountPostReleaseDays) &&
    options.discountPostReleaseDays >= 1
      ? Math.floor(options.discountPostReleaseDays)
      : null;

  if (!endsAtIso) {
    if (options?.isComingSoon && postDays) {
      if (lang === 'en') {
        return `Pre-Order Sale · Stays ${postDays} ${postDays === 1 ? 'day' : 'days'} after release`;
      }
      const daysPhrase =
        postDays === 1
          ? 'يوم واحد'
          : postDays === 2
            ? 'يومين'
            : postDays <= 10
              ? `${postDays} أيام`
              : `${postDays} يوماً`;
      return `خصم الطلب المسبق · يستمر ${daysPhrase} بعد النشر`;
    }
    if (options?.isComingSoon) {
      return lang === 'en' ? 'Pre-Order Sale · Active until stopped' : 'خصم الطلب المسبق · مفتوح حتى الإيقاف';
    }
    return lang === 'en' ? 'Open Sale · Until closed' : 'عرض مفتوح حتى الإيقاف';
  }
  const endMs = Date.parse(endsAtIso);
  if (Number.isNaN(endMs)) {
    return lang === 'en' ? 'Limited Offer' : 'عرض لفترة محدودة';
  }
  const diffMs = endMs - nowMs;
  if (diffMs <= 0) {
    return lang === 'en' ? 'Ended' : 'انتهى العرض';
  }
  const totalMinutes = Math.floor(diffMs / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  if (totalDays >= 30) {
    const months = Math.floor(totalDays / 30);
    return lang === 'en'
      ? `${months} ${months === 1 ? 'month' : 'months'} left`
      : `متبقي ${months} ${months === 1 ? 'شهر' : months <= 10 ? 'أشهر' : 'شهراً'}`;
  }
  if (totalDays >= 1) {
    return lang === 'en'
      ? `${totalDays} ${totalDays === 1 ? 'day' : 'days'} left`
      : `متبقي ${totalDays} ${totalDays === 1 ? 'يوم' : totalDays === 2 ? 'يومان' : totalDays <= 10 ? 'أيام' : 'يوماً'}`;
  }
  if (totalHours >= 1) {
    return lang === 'en'
      ? `${totalHours}h left`
      : `متبقي ${totalHours} ساعة`;
  }
  return lang === 'en' ? 'Ending soon' : 'ينتهي قريباً';
}

export function formatSeriesPartLabel(partNumber: number | null | undefined, lang: 'ar' | 'en'): string {
  const num = typeof partNumber === 'number' && Number.isFinite(partNumber) && partNumber >= 1
    ? Math.floor(partNumber)
    : 1;
  if (lang === 'en') {
    return `Part ${num}`;
  }
  const ordinals: Record<number, string> = {
    1: 'الأول',
    2: 'الثاني',
    3: 'الثالث',
    4: 'الرابع',
    5: 'الخامس',
    6: 'السادس',
    7: 'السابع',
    8: 'الثامن',
    9: 'التاسع',
    10: 'العاشر',
  };
  return ordinals[num] ? `الجزء ${ordinals[num]}` : `الجزء ${num}`;
}

export const NEW_BOOK_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function isBookNew(
  book: Pick<BookRecord, 'addedAt' | 'isComingSoon' | 'reviewStatus'>,
  nowMs = Date.now()
): boolean {
  if (book.reviewStatus === 'pending' || book.reviewStatus === 'rejected') return false;
  if (book.isComingSoon) return false;
  if (!book.addedAt) return false;
  const addedTime = Date.parse(book.addedAt);
  if (!Number.isFinite(addedTime)) return false;
  const elapsed = nowMs - addedTime;
  return elapsed >= 0 && elapsed < NEW_BOOK_DURATION_MS;
}

export function formatComingSoonReleaseLabel(
  book: Pick<BookRecord, 'isComingSoon' | 'comingSoonMode' | 'comingSoonReleaseAt'>,
  lang: 'ar' | 'en'
): string | null {
  if (!book.isComingSoon) return null;
  const mode = book.comingSoonMode ?? 'open';
  const raw = book.comingSoonReleaseAt?.trim();
  if (mode === 'open' || !raw) return null;

  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  if (mode === 'date') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    const parsed = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(parsed);
    } catch {
      return raw;
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  } catch {
    return raw;
  }
}

export function toLocalDateTimeInputValue(raw?: string | null): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T20:00`)
    : new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed.slice(0, 16);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export function toLocalDateTimeSubmitValue(localInput: string): string {
  const trimmed = localInput.trim();
  if (!trimmed) return '';
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString();
}

export function hasBookContent(
  book: Pick<BookRecord, 'bookType' | 'pdfId' | 'chapters'>,
  hasPendingDocument = false
): boolean {
  if (book.bookType === 'pdf' || book.bookType === 'word') {
    return Boolean(book.pdfId?.trim() || hasPendingDocument);
  }
  return (
    Array.isArray(book.chapters) &&
    book.chapters.some(
      (ch) => Array.isArray(ch.paragraphs) && ch.paragraphs.some((p) => p.trim().length > 0)
    )
  );
}

export interface CatalogPayload {
  catalogVersion: number;
  updatedAt: string;
  libraryName: string;
  sections?: string[];
  sectionTranslations?: Record<string, string>;
  books: BookRecord[];
}

export const DEFAULT_LIBRARY_SECTIONS: string[] = [
  'العلوم',
  'الأدب',
  'التاريخ',
];

export const REMOVED_DEFAULT_BOOK_IDS = new Set<string>([
  'architecture-of-light',
  'astrolabe-chronicles',
  'silent-sea-voyage',
  'reed-and-pomegranate',
  'golden-manuscripts-edition',
]);

export interface ReadingProgress {
  bookId: string;
  chapterIndex: number;
  scrollRatio: number;
  bookmarks: number[];
  lastReadAt: string;
}

export interface SyncReport {
  catalogVersion: number;
  lastSyncedAt: string;
  source: 'network' | 'indexeddb' | 'cloudsql';
  added: number;
  updated: number;
  removed: number;
  totalBooks: number;
}

function hashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function hashBookRecord(book: BookRecord): string {
  return hashString(JSON.stringify(book));
}

const DB_NAME = 'WarraqDigitalLibraryDB';
const DB_VERSION = 2;

export function generateTenDigitCode(existingCodes: Set<string> = new Set()): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const firstDigit = Math.floor(1 + Math.random() * 9);
    let rest = '';
    for (let i = 0; i < 9; i++) {
      rest += Math.floor(Math.random() * 10).toString();
    }
    const candidate = `${firstDigit}${rest}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }
  return String(Date.now()).slice(-10).padStart(10, '1');
}

export function findDuplicateCodeOwner(
  code: string,
  books: BookRecord[],
  customThemeCodes: Record<string, string>,
  excludeId?: string
): string | null {
  const normalized = code.replace(/\D/g, '');
  if (!normalized) return null;

  for (const book of books) {
    if (book.id === excludeId) continue;
    if (book.isPremium && book.unlockCode === normalized) {
      return `كتاب «${book.title}»`;
    }
  }

  for (const theme of PREMIUM_THEMES) {
    if (theme.id === excludeId) continue;
    const effectiveCode = customThemeCodes[theme.id] ?? theme.unlockCode;
    if (effectiveCode === normalized) {
      return `سمة «${theme.name}»`;
    }
  }

  for (const icon of PREMIUM_APP_ICONS) {
    if (icon.id === excludeId) continue;
    const effectiveCode = customThemeCodes[icon.id] ?? icon.unlockCode;
    if (effectiveCode === normalized) {
      return `أيقونة «${icon.name}»`;
    }
  }

  return null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('books')) {
        const booksStore = db.createObjectStore('books', { keyPath: 'id' });
        booksStore.createIndex('category', 'category', { unique: false });
      }
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'bookId' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('pdfBlobs')) {
        db.createObjectStore('pdfBlobs', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalBooks(): Promise<BookRecord[]> {
  const db = await openDatabase();
  const tx = db.transaction('books', 'readonly');
  const books = await requestToPromise(tx.objectStore('books').getAll());
  return books as BookRecord[];
}

export async function savePdfBlob(id: string, data: ArrayBuffer, fileName: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('pdfBlobs', 'readwrite');
  tx.objectStore('pdfBlobs').put({
    id,
    data,
    fileName,
    savedAt: new Date().toISOString(),
  });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPdfBlob(id: string): Promise<ArrayBuffer | null> {
  const db = await openDatabase();
  const tx = db.transaction('pdfBlobs', 'readonly');
  const entry = (await requestToPromise(tx.objectStore('pdfBlobs').get(id))) as
    | { id: string; data: ArrayBuffer }
    | undefined;
  return entry?.data ?? null;
}

export async function getAllReadingProgress(): Promise<Record<string, ReadingProgress>> {
  const db = await openDatabase();
  const tx = db.transaction('progress', 'readonly');
  const items = (await requestToPromise(tx.objectStore('progress').getAll())) as ReadingProgress[];
  const map: Record<string, ReadingProgress> = {};
  for (const item of items) {
    map[item.bookId] = item;
  }
  return map;
}

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('progress', 'readwrite');
  tx.objectStore('progress').put(progress);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllReadingProgress(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('progress', 'readwrite');
  tx.objectStore('progress').clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUnlockedPremiumIds(): Promise<string[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('meta', 'readonly');
    const entry = (await requestToPromise(tx.objectStore('meta').get('unlockedPremiumIds'))) as
      | { key: string; value: string[] }
      | undefined;
    return entry?.value ?? [];
  } catch {
    return [];
  }
}

export async function unlockPremiumItemInDb(itemId: string): Promise<string[]> {
  const current = await getUnlockedPremiumIds();
  if (current.includes(itemId)) return current;
  const next = [...current, itemId];
  const db = await openDatabase();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key: 'unlockedPremiumIds', value: next });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return next;
}

export async function getCustomThemeCodes(): Promise<Record<string, string>> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('meta', 'readonly');
    const entry = (await requestToPromise(tx.objectStore('meta').get('customThemeCodes'))) as
      | { key: string; value: Record<string, string> }
      | undefined;
    return entry?.value ?? {};
  } catch {
    return {};
  }
}

export async function saveCustomThemeCode(
  themeId: string,
  code: string
): Promise<Record<string, string>> {
  const current = await getCustomThemeCodes();
  const next = { ...current, [themeId]: code };
  const db = await openDatabase();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key: 'customThemeCodes', value: next });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return next;
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('meta', 'readonly');
    const entry = (await requestToPromise(tx.objectStore('meta').get('appSettings'))) as
      | { key: string; value: Partial<AppSettings> }
      | undefined;
    return { ...DEFAULT_APP_SETTINGS, ...(entry?.value ?? {}) };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key: 'appSettings', value: settings });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalCatalogMeta(): Promise<{
  catalogVersion: number;
  lastSyncedAt: string | null;
  hasLocalEdits: boolean;
  deletedBookIds: string[];
  locallyEditedBookIds: string[];
  remoteBookHashes: Record<string, string>;
}> {
  const db = await openDatabase();
  const tx = db.transaction('meta', 'readonly');
  const store = tx.objectStore('meta');
  const versionEntry = (await requestToPromise(store.get('catalogVersion'))) as
    | { key: string; value: number }
    | undefined;
  const syncedEntry = (await requestToPromise(store.get('lastSyncedAt'))) as
    | { key: string; value: string }
    | undefined;
  const localEditsEntry = (await requestToPromise(store.get('hasLocalEdits'))) as
    | { key: string; value: boolean }
    | undefined;
  const deletedEntry = (await requestToPromise(store.get('deletedBookIds'))) as
    | { key: string; value: string[] }
    | undefined;
  const locallyEditedEntry = (await requestToPromise(store.get('locallyEditedBookIds'))) as
    | { key: string; value: string[] }
    | undefined;
  const hashesEntry = (await requestToPromise(store.get('remoteBookHashes'))) as
    | { key: string; value: Record<string, string> }
    | undefined;

  return {
    catalogVersion: versionEntry?.value ?? 0,
    lastSyncedAt: syncedEntry?.value ?? null,
    hasLocalEdits: Boolean(localEditsEntry?.value),
    deletedBookIds: deletedEntry?.value ?? [],
    locallyEditedBookIds: locallyEditedEntry?.value ?? [],
    remoteBookHashes: hashesEntry?.value ?? {},
  };
}

export async function saveDeveloperBook(book: BookRecord): Promise<BookRecord[]> {
  const db = await openDatabase();
  const meta = await getLocalCatalogMeta();
  const nextCatalogVersion = Math.max(meta.catalogVersion, 2026112003) + 1;
  const nextDeleted = meta.deletedBookIds.filter((id) => id !== book.id);
  const nextEdited = meta.locallyEditedBookIds.includes(book.id)
    ? meta.locallyEditedBookIds
    : [...meta.locallyEditedBookIds, book.id];
  const nowIso = new Date().toISOString();

  const tx = db.transaction(['books', 'meta'], 'readwrite');
  tx.objectStore('books').put(book);
  tx.objectStore('meta').put({ key: 'catalogVersion', value: nextCatalogVersion });
  tx.objectStore('meta').put({ key: 'lastSyncedAt', value: nowIso });
  tx.objectStore('meta').put({ key: 'hasLocalEdits', value: true });
  tx.objectStore('meta').put({ key: 'deletedBookIds', value: nextDeleted });
  tx.objectStore('meta').put({ key: 'locallyEditedBookIds', value: nextEdited });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return getLocalBooks();
}

export async function deleteDeveloperBook(bookId: string, pdfId?: string): Promise<BookRecord[]> {
  const db = await openDatabase();
  const meta = await getLocalCatalogMeta();
  const nextCatalogVersion = Math.max(meta.catalogVersion, 2026112002) + 1;
  const nextDeleted = meta.deletedBookIds.includes(bookId)
    ? meta.deletedBookIds
    : [...meta.deletedBookIds, bookId];

  const tx = db.transaction(['books', 'progress', 'meta', 'pdfBlobs'], 'readwrite');
  tx.objectStore('books').delete(bookId);
  tx.objectStore('progress').delete(bookId);
  if (pdfId) {
    tx.objectStore('pdfBlobs').delete(pdfId);
  }
  tx.objectStore('meta').put({ key: 'catalogVersion', value: nextCatalogVersion });
  tx.objectStore('meta').put({ key: 'hasLocalEdits', value: true });
  tx.objectStore('meta').put({ key: 'deletedBookIds', value: nextDeleted });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return getLocalBooks();
}

export async function importCatalogPayload(payload: CatalogPayload): Promise<BookRecord[]> {
  const db = await openDatabase();
  const nowIso = new Date().toISOString();
  const tx = db.transaction(['books', 'meta'], 'readwrite');
  const booksStore = tx.objectStore('books');
  booksStore.clear();
  for (const book of payload.books) {
    booksStore.put(book);
  }
  if (Array.isArray(payload.sections) && payload.sections.length > 0) {
    tx.objectStore('meta').put({
      key: 'librarySections',
      value: Array.from(new Set(payload.sections.map((s) => s.trim()).filter(Boolean))),
    });
  }
  if (payload.sectionTranslations && typeof payload.sectionTranslations === 'object') {
    tx.objectStore('meta').put({
      key: 'sectionTranslations',
      value: payload.sectionTranslations,
    });
  }
  tx.objectStore('meta').put({
    key: 'catalogVersion',
    value: payload.catalogVersion || Date.now(),
  });
  tx.objectStore('meta').put({ key: 'lastSyncedAt', value: nowIso });
  tx.objectStore('meta').put({ key: 'hasLocalEdits', value: true });
  tx.objectStore('meta').put({ key: 'deletedBookIds', value: [] });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return getLocalBooks();
}

export async function getLibrarySections(booksForSeed: BookRecord[] = []): Promise<string[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('meta', 'readonly');
    const entry = (await requestToPromise(tx.objectStore('meta').get('librarySections'))) as
      | { key: string; value: string[] }
      | undefined;

    if (entry && Array.isArray(entry.value)) {
      return entry.value;
    }

    const seeded = Array.from(
      new Set([
        ...DEFAULT_LIBRARY_SECTIONS,
        ...booksForSeed.map((b) => b.category.trim()).filter(Boolean),
      ])
    );
    await saveLibrarySections(seeded);
    return seeded;
  } catch {
    return [...DEFAULT_LIBRARY_SECTIONS];
  }
}

export async function saveLibrarySections(sections: string[]): Promise<string[]> {
  const clean = Array.from(new Set(sections.map((s) => s.trim()).filter(Boolean)));
  const db = await openDatabase();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key: 'librarySections', value: clean });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return clean;
}

export async function getSectionTranslations(): Promise<Record<string, string>> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('meta', 'readonly');
    const entry = (await requestToPromise(tx.objectStore('meta').get('sectionTranslations'))) as
      | { key: string; value: Record<string, string> }
      | undefined;

    if (entry && entry.value && typeof entry.value === 'object') {
      return entry.value;
    }
    return {};
  } catch {
    return {};
  }
}

export async function saveSectionTranslations(
  translations: Record<string, string>
): Promise<Record<string, string>> {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(translations)) {
    const cleanKey = k.trim();
    const cleanVal = v.trim();
    if (cleanKey && cleanVal) {
      clean[cleanKey] = cleanVal;
    }
  }
  const db = await openDatabase();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key: 'sectionTranslations', value: clean });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return clean;
}

export async function addLibrarySection(
  name: string,
  englishName?: string
): Promise<{
  ok: boolean;
  sections: string[];
  sectionTranslations: Record<string, string>;
  error?: 'empty' | 'duplicate';
}> {
  const trimmed = name.trim();
  const [current, currentTranslations] = await Promise.all([
    getLibrarySections(),
    getSectionTranslations(),
  ]);
  if (!trimmed) {
    return { ok: false, sections: current, sectionTranslations: currentTranslations, error: 'empty' };
  }
  if (current.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
    return {
      ok: false,
      sections: current,
      sectionTranslations: currentTranslations,
      error: 'duplicate',
    };
  }
  const saved = await saveLibrarySections([...current, trimmed]);
  const cleanEn = englishName?.trim();
  let nextTranslations = currentTranslations;
  if (cleanEn) {
    nextTranslations = await saveSectionTranslations({
      ...currentTranslations,
      [trimmed]: cleanEn,
    });
  }
  return { ok: true, sections: saved, sectionTranslations: nextTranslations };
}

export async function renameLibrarySection(
  oldName: string,
  newName: string,
  englishName?: string
): Promise<{
  ok: boolean;
  sections: string[];
  books: BookRecord[];
  sectionTranslations: Record<string, string>;
  error?: 'empty' | 'duplicate';
}> {
  const trimmed = newName.trim();
  const [currentSections, currentBooks, currentTranslations] = await Promise.all([
    getLibrarySections(),
    getLocalBooks(),
    getSectionTranslations(),
  ]);

  if (!trimmed) {
    return {
      ok: false,
      sections: currentSections,
      books: currentBooks,
      sectionTranslations: currentTranslations,
      error: 'empty',
    };
  }
  if (
    trimmed !== oldName &&
    currentSections.some((s) => s.toLowerCase() === trimmed.toLowerCase())
  ) {
    return {
      ok: false,
      sections: currentSections,
      books: currentBooks,
      sectionTranslations: currentTranslations,
      error: 'duplicate',
    };
  }

  const nextSections = Array.from(
    new Set(currentSections.map((s) => (s === oldName ? trimmed : s)))
  );
  const nextTranslations = { ...currentTranslations };
  const inheritedEn = nextTranslations[oldName];
  if (oldName !== trimmed) {
    delete nextTranslations[oldName];
  }
  if (englishName !== undefined) {
    const cleanEn = englishName.trim();
    if (cleanEn) {
      nextTranslations[trimmed] = cleanEn;
    } else {
      delete nextTranslations[trimmed];
    }
  } else if (inheritedEn) {
    nextTranslations[trimmed] = inheritedEn;
  }

  const db = await openDatabase();
  const meta = await getLocalCatalogMeta();
  const nextCatalogVersion = Math.max(meta.catalogVersion, 2026112002) + 1;
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  const tx = db.transaction(['books', 'meta'], 'readwrite');
  const booksStore = tx.objectStore('books');

  const nextEditedIds = new Set(meta.locallyEditedBookIds);
  for (const book of currentBooks) {
    if (book.category === oldName) {
      nextEditedIds.add(book.id);
      booksStore.put({
        ...book,
        category: trimmed,
        version: book.version + 1,
        updatedAt: today,
      });
    }
  }

  const metaStore = tx.objectStore('meta');
  metaStore.put({ key: 'librarySections', value: nextSections });
  metaStore.put({ key: 'sectionTranslations', value: nextTranslations });
  metaStore.put({ key: 'catalogVersion', value: nextCatalogVersion });
  metaStore.put({ key: 'lastSyncedAt', value: nowIso });
  metaStore.put({ key: 'hasLocalEdits', value: true });
  metaStore.put({ key: 'locallyEditedBookIds', value: Array.from(nextEditedIds) });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return {
    ok: true,
    sections: nextSections,
    books: await getLocalBooks(),
    sectionTranslations: nextTranslations,
  };
}

export async function deleteLibrarySection(
  sectionName: string,
  fallbackSection?: string
): Promise<{
  sections: string[];
  books: BookRecord[];
  sectionTranslations: Record<string, string>;
  reassignedTo: string | null;
}> {
  const [currentSections, currentBooks, currentTranslations] = await Promise.all([
    getLibrarySections(),
    getLocalBooks(),
    getSectionTranslations(),
  ]);
  const remaining = currentSections.filter((s) => s !== sectionName);
  const affectedBooks = currentBooks.filter((b) => b.category === sectionName);

  let nextSections = remaining;
  let reassignedTo: string | null = null;

  if (affectedBooks.length > 0) {
    reassignedTo = fallbackSection && fallbackSection !== sectionName
      ? fallbackSection
      : remaining[0] ?? 'عام';
    if (!nextSections.includes(reassignedTo)) {
      nextSections = [...nextSections, reassignedTo];
    }
  }

  const nextTranslations = { ...currentTranslations };
  delete nextTranslations[sectionName];

  const db = await openDatabase();
  const meta = await getLocalCatalogMeta();
  const nextCatalogVersion = Math.max(meta.catalogVersion, 2026112002) + 1;
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  const tx = db.transaction(['books', 'meta'], 'readwrite');
  const booksStore = tx.objectStore('books');

  const nextEditedIds = new Set(meta.locallyEditedBookIds);
  if (reassignedTo) {
    for (const book of affectedBooks) {
      nextEditedIds.add(book.id);
      booksStore.put({
        ...book,
        category: reassignedTo,
        version: book.version + 1,
        updatedAt: today,
      });
    }
  }

  const metaStore = tx.objectStore('meta');
  metaStore.put({ key: 'librarySections', value: nextSections });
  metaStore.put({ key: 'sectionTranslations', value: nextTranslations });
  metaStore.put({ key: 'catalogVersion', value: nextCatalogVersion });
  metaStore.put({ key: 'lastSyncedAt', value: nowIso });
  metaStore.put({ key: 'hasLocalEdits', value: true });
  metaStore.put({ key: 'locallyEditedBookIds', value: Array.from(nextEditedIds) });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return {
    sections: nextSections,
    books: await getLocalBooks(),
    sectionTranslations: nextTranslations,
    reassignedTo,
  };
}

export async function assignBookToSection(
  bookId: string,
  sectionName: string
): Promise<{ books: BookRecord[]; sections: string[] }> {
  const trimmed = sectionName.trim();
  const currentBooks = await getLocalBooks();
  const currentSections = await getLibrarySections(currentBooks);
  const target = currentBooks.find((b) => b.id === bookId);
  if (!target || !trimmed) {
    return { books: currentBooks, sections: currentSections };
  }

  const nextSections = currentSections.includes(trimmed)
    ? currentSections
    : [...currentSections, trimmed];

  const db = await openDatabase();
  const meta = await getLocalCatalogMeta();
  const nextCatalogVersion = Math.max(meta.catalogVersion, 2026112002) + 1;
  const nowIso = new Date().toISOString();

  const nextEditedIds = meta.locallyEditedBookIds.includes(bookId)
    ? meta.locallyEditedBookIds
    : [...meta.locallyEditedBookIds, bookId];

  const tx = db.transaction(['books', 'meta'], 'readwrite');
  tx.objectStore('books').put({
    ...target,
    category: trimmed,
    version: target.version + 1,
    updatedAt: nowIso.slice(0, 10),
  });
  const metaStore = tx.objectStore('meta');
  metaStore.put({ key: 'librarySections', value: nextSections });
  metaStore.put({ key: 'catalogVersion', value: nextCatalogVersion });
  metaStore.put({ key: 'lastSyncedAt', value: nowIso });
  metaStore.put({ key: 'hasLocalEdits', value: true });
  metaStore.put({ key: 'locallyEditedBookIds', value: nextEditedIds });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return {
    books: await getLocalBooks(),
    sections: nextSections,
  };
}

export async function resetToServerCatalog(
  catalogUrl = '/books-data/catalog.json'
): Promise<{ books: BookRecord[]; report: SyncReport }> {
  const db = await openDatabase();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key: 'hasLocalEdits', value: false });
  tx.objectStore('meta').put({ key: 'deletedBookIds', value: [] });
  tx.objectStore('meta').put({ key: 'locallyEditedBookIds', value: [] });
  tx.objectStore('meta').put({ key: 'remoteBookHashes', value: {} });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return syncBooksFromCatalog(catalogUrl, true);
}

export async function syncBooksFromCatalog(
  catalogUrl = '/books-data/catalog.json',
  force = false
): Promise<{ books: BookRecord[]; report: SyncReport }> {
  const db = await openDatabase();

  try {
    const localMeta = await getLocalCatalogMeta();
    const existingBooks = await getLocalBooks();
    const deletedSet = new Set(force ? [] : localMeta.deletedBookIds);
    const editedSet = new Set(force ? [] : localMeta.locallyEditedBookIds);

    // Dynamically fetch external catalog JSON on load (bypassing HTTP cache)
    const response = await fetch(catalogUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const remoteCatalog = (await response.json()) as CatalogPayload;
    const remoteBooks = Array.isArray(remoteCatalog.books) ? remoteCatalog.books : [];
    const remoteMap = new Map(remoteBooks.map((b) => [b.id, b]));
    const nextHashes: Record<string, string> = {};
    for (const book of remoteBooks) {
      nextHashes[book.id] = hashBookRecord(book);
    }

    const existingMap = new Map(existingBooks.map((b) => [b.id, b]));
    const activeRemoteBooks = remoteBooks.filter((b) => !deletedSet.has(b.id));
    const effectiveVersion = remoteCatalog.catalogVersion || localMeta.catalogVersion || 1;

    let added = 0;
    let updated = 0;
    let removed = 0;

    const booksToPut: BookRecord[] = [];
    const bookIdsToDelete: string[] = [];

    for (const localBook of existingBooks) {
      const wasPreviouslyRemoteBook =
        Boolean(localMeta.remoteBookHashes[localBook.id]) ||
        REMOVED_DEFAULT_BOOK_IDS.has(localBook.id);
      if (
        !remoteMap.has(localBook.id) &&
        (!localMeta.hasLocalEdits || force || wasPreviouslyRemoteBook)
      ) {
        bookIdsToDelete.push(localBook.id);
        removed++;
      }
    }

    for (const remoteBook of activeRemoteBooks) {
      const existing = existingMap.get(remoteBook.id);
      if (!existing) {
        // Always add newly published books from external catalog for all users
        booksToPut.push(remoteBook);
        added++;
      } else {
        const prevHash = localMeta.remoteBookHashes[remoteBook.id];
        const legacyLocalEdit =
          prevHash === undefined && localMeta.hasLocalEdits && existing.version > remoteBook.version;
        const remoteChanged = prevHash !== nextHashes[remoteBook.id];
        const isLocallyEdited = editedSet.has(remoteBook.id) || legacyLocalEdit;
        const shouldUpdate =
          force ||
          (remoteChanged && (!isLocallyEdited || remoteBook.version > existing.version)) ||
          remoteBook.version > existing.version;

        if (shouldUpdate) {
          booksToPut.push(remoteBook);
          updated++;
        }
      }
    }

    const currentSections = await getLibrarySections(existingBooks);
    const remoteSections = Array.isArray(remoteCatalog.sections)
      ? remoteCatalog.sections.map((s) => s.trim()).filter(Boolean)
      : [];
    const newCategories = Array.from(
      new Set([
        ...remoteSections,
        ...activeRemoteBooks.map((b) => b.category.trim()).filter(Boolean),
      ])
    ).filter((cat) => !currentSections.includes(cat));
    const hasNewSections = newCategories.length > 0;

    const currentTranslations = await getSectionTranslations();
    const remoteTranslations =
      remoteCatalog.sectionTranslations && typeof remoteCatalog.sectionTranslations === 'object'
        ? remoteCatalog.sectionTranslations
        : {};
    const mergedTranslations = force
      ? { ...remoteTranslations }
      : { ...remoteTranslations, ...currentTranslations };
    const hasNewTranslations = Object.entries(mergedTranslations).some(
      ([k, v]) => currentTranslations[k] !== v
    );

    if (
      added === 0 &&
      updated === 0 &&
      removed === 0 &&
      !hasNewSections &&
      !hasNewTranslations &&
      !force &&
      Object.keys(localMeta.remoteBookHashes).length === remoteBooks.length
    ) {
      return {
        books: existingBooks,
        report: {
          catalogVersion: Math.max(localMeta.catalogVersion, effectiveVersion),
          lastSyncedAt: localMeta.lastSyncedAt ?? new Date().toISOString(),
          source: 'indexeddb',
          added: 0,
          updated: 0,
          removed: 0,
          totalBooks: existingBooks.length,
        },
      };
    }

    const tx = db.transaction(['books', 'meta'], 'readwrite');
    const booksStore = tx.objectStore('books');
    const metaStore = tx.objectStore('meta');

    for (const id of bookIdsToDelete) {
      booksStore.delete(id);
    }
    for (const book of booksToPut) {
      booksStore.put(book);
    }
    if (hasNewSections) {
      metaStore.put({
        key: 'librarySections',
        value: Array.from(new Set([...currentSections, ...newCategories])),
      });
    }
    if (hasNewTranslations || force) {
      metaStore.put({
        key: 'sectionTranslations',
        value: mergedTranslations,
      });
    }

    const nowIso = new Date().toISOString();
    metaStore.put({
      key: 'catalogVersion',
      value: Math.max(localMeta.catalogVersion, effectiveVersion),
    });
    metaStore.put({ key: 'lastSyncedAt', value: nowIso });
    metaStore.put({ key: 'remoteBookHashes', value: nextHashes });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    const finalBooks = await getLocalBooks();
    return {
      books: finalBooks,
      report: {
        catalogVersion: Math.max(localMeta.catalogVersion, effectiveVersion),
        lastSyncedAt: nowIso,
        source: 'network',
        added,
        updated,
        removed,
        totalBooks: finalBooks.length,
      },
    };
  } catch {
    const fallbackBooks = await getLocalBooks();
    const meta = await getLocalCatalogMeta();
    return {
      books: fallbackBooks,
      report: {
        catalogVersion: meta.catalogVersion,
        lastSyncedAt: meta.lastSyncedAt ?? new Date().toISOString(),
        source: 'indexeddb',
        added: 0,
        updated: 0,
        removed: 0,
        totalBooks: fallbackBooks.length,
      },
    };
  }
}

export interface StoredPdfBlobEntry {
  id: string;
  data: ArrayBuffer;
  fileName: string;
  savedAt?: string;
}

export interface RecoverableLocalBook {
  book: BookRecord;
  blob?: StoredPdfBlobEntry;
}

export interface RecoverableLocalData {
  unmigratedBooks: RecoverableLocalBook[];
  orphanedDocuments: StoredPdfBlobEntry[];
}

export async function saveServerCatalogSnapshotToLocalDb(params: {
  books: BookRecord[];
  sections: string[];
  sectionTranslations: Record<string, string>;
  unlockedIds: string[];
  progressMap: Record<string, ReadingProgress>;
  catalogVersion: number;
  lastSyncedAt: string;
}): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(['books', 'progress', 'meta'], 'readwrite');
  const booksStore = tx.objectStore('books');
  const metaStore = tx.objectStore('meta');

  const [existingLocalBooks, prevCloudIdsEntry] = await Promise.all([
    requestToPromise(booksStore.getAll()) as Promise<BookRecord[]>,
    requestToPromise(metaStore.get('cloudSyncedBookIds')) as Promise<
      { key: string; value: string[] } | undefined
    >,
  ]);

  const serverIds = new Set(params.books.map((b) => b.id));
  const prevCloudIds = new Set(prevCloudIdsEntry?.value ?? []);

  for (const localBook of existingLocalBooks) {
    if (
      !serverIds.has(localBook.id) &&
      (REMOVED_DEFAULT_BOOK_IDS.has(localBook.id) || prevCloudIds.has(localBook.id))
    ) {
      booksStore.delete(localBook.id);
    }
  }

  for (const book of params.books) {
    booksStore.put(book);
  }

  const progressStore = tx.objectStore('progress');
  for (const p of Object.values(params.progressMap)) {
    progressStore.put(p);
  }

  metaStore.put({ key: 'librarySections', value: params.sections });
  metaStore.put({ key: 'sectionTranslations', value: params.sectionTranslations });
  metaStore.put({ key: 'unlockedPremiumIds', value: params.unlockedIds });
  metaStore.put({ key: 'catalogVersion', value: params.catalogVersion });
  metaStore.put({ key: 'lastSyncedAt', value: params.lastSyncedAt });
  metaStore.put({ key: 'cloudSyncedBookIds', value: params.books.map((b) => b.id) });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function scanLocalRecoverableItems(
  serverBooks: BookRecord[]
): Promise<RecoverableLocalData> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['books', 'pdfBlobs'], 'readonly');
    const [allLocalBooks, allBlobs] = await Promise.all([
      requestToPromise(tx.objectStore('books').getAll()) as Promise<BookRecord[]>,
      requestToPromise(tx.objectStore('pdfBlobs').getAll()) as Promise<StoredPdfBlobEntry[]>,
    ]);

    const serverIds = new Set(serverBooks.map((b) => b.id));
    const blobMap = new Map(allBlobs.map((entry) => [entry.id, entry]));

    const unmigratedBooks: RecoverableLocalBook[] = allLocalBooks
      .filter((b) => !serverIds.has(b.id) && !REMOVED_DEFAULT_BOOK_IDS.has(b.id))
      .map((book) => ({
        book,
        blob: book.pdfId ? blobMap.get(book.pdfId) : undefined,
      }));

    const usedPdfIds = new Set<string>();
    for (const b of serverBooks) {
      if (b.pdfId) usedPdfIds.add(b.pdfId);
    }
    for (const item of unmigratedBooks) {
      if (item.book.pdfId) usedPdfIds.add(item.book.pdfId);
    }

    const orphanedDocuments = allBlobs.filter((blob) => !usedPdfIds.has(blob.id));

    return { unmigratedBooks, orphanedDocuments };
  } catch {
    return { unmigratedBooks: [], orphanedDocuments: [] };
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

