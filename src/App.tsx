import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  BookMarked,
  BookOpen,
  Calendar,
  Check,
  Gift,
  Home,
  Library,
  Lock,
  LogIn,
  Search,
  Settings,
  Shuffle,
  Sparkles,
  Star,
  User,
  Wrench,
} from 'lucide-react';
import { BookCard } from './components/BookCard';
import { OwnerBadge, RateBookButton, StarRatingDisplay } from './components/BookRatingBar';
import { ConfirmDialog } from './components/ConfirmDialog';
import type { GiftDirectoryAccount } from './components/GiftPremiumModal';
import { LazyViewFallback } from './components/LazyViewFallback';
import { MaktabtyLogo } from './components/MaktabtyLogo';
import {
  NotificationsMenu,
  type UserNotificationItem,
} from './components/NotificationsMenu';
import { OfflineIndicator } from './components/OfflineIndicator';
import type { IconAccessState, ThemeAccessState } from './components/PremiumSection';
import { PWAInstallButton } from './components/PWAInstallButton';
import type {
  DevCodeVaultEntry,
  DevUserPurchaseEntry,
  DocumentUploadPayload,
} from './components/SettingsPanel';
import { SplashLoader } from './components/SplashLoader';
import { TokenIcon } from './components/TokenCoin';
import type {
  CurrentUserAccountInfo,
  FollowingAccountSummary,
  PublicUserProfile,
} from './components/YouPage';

const loadBookDetailPage = () => import('./components/BookDetailPage');
const loadBookReader = () => import('./components/BookReader');
const loadGiftPremiumModal = () => import('./components/GiftPremiumModal');
const loadInAppBookRatingModal = () => import('./components/InAppBookRatingModal');
const loadNotificationsPage = () => import('./components/NotificationsPage');
const loadPdfFlipBookReader = () => import('./components/PdfFlipBookReader');
const loadPremiumSection = () => import('./components/PremiumSection');
const loadPremiumUnlockModal = () => import('./components/PremiumUnlockModal');
const loadSettingsPanel = () => import('./components/SettingsPanel');
const loadSeriesPage = () => import('./components/SeriesPage');
const loadYouPage = () => import('./components/YouPage');

const BookDetailPage = lazy(() =>
  loadBookDetailPage().then((m) => ({ default: m.BookDetailPage }))
);
const BookReader = lazy(() =>
  loadBookReader().then((m) => ({ default: m.BookReader }))
);
const GiftPremiumModal = lazy(() =>
  loadGiftPremiumModal().then((m) => ({ default: m.GiftPremiumModal }))
);
const InAppBookRatingModal = lazy(() =>
  loadInAppBookRatingModal().then((m) => ({ default: m.InAppBookRatingModal }))
);
const NotificationsPage = lazy(() =>
  loadNotificationsPage().then((m) => ({ default: m.NotificationsPage }))
);
const PdfFlipBookReader = lazy(() =>
  loadPdfFlipBookReader().then((m) => ({ default: m.PdfFlipBookReader }))
);
const PremiumSection = lazy(() =>
  loadPremiumSection().then((m) => ({ default: m.PremiumSection }))
);
const PremiumUnlockModal = lazy(() =>
  loadPremiumUnlockModal().then((m) => ({ default: m.PremiumUnlockModal }))
);
const SettingsPanel = lazy(() =>
  loadSettingsPanel().then((m) => ({ default: m.SettingsPanel }))
);
const SeriesPage = lazy(() =>
  loadSeriesPage().then((m) => ({ default: m.SeriesPage }))
);
const YouPage = lazy(() =>
  loadYouPage().then((m) => ({ default: m.YouPage }))
);
import { calculateReviewsAverage, getBookRating } from './bookRatings';
import { useAuth } from './contexts/AuthContext';
import { formatSectionHeading, getSectionDisplayName, UI_COPY } from './i18n';
import {
  addLibrarySection,
  arrayBufferToBase64,
  assignBookToSection,
  base64ToArrayBuffer,
  clearAllReadingProgress,
  DEFAULT_APP_SETTINGS,
  DEFAULT_LIBRARY_SECTIONS,
  DEFAULT_TOKEN_ECONOMY_CONFIG,
  deleteDeveloperBook,
  deleteLibrarySection,
  formatComingSoonReleaseLabel,
  getAllReadingProgress,
  getAppSettings,
  getCustomThemeCodes,
  getEffectiveBookPricing,
  getLibrarySections,
  getSectionTranslations,
  getUnlockedPremiumIds,
  importCatalogPayload,
  isBookNew,
  renameLibrarySection,
  resetToServerCatalog,
  saveAppSettings,
  saveCustomThemeCode,
  saveDeveloperBook,
  saveLibrarySections,
  saveReadingProgress,
  saveServerCatalogSnapshotToLocalDb,
  scanLocalRecoverableItems,
  syncBooksFromCatalog,
  type AppSettings,
  type BookRecord,
  type CatalogPayload,
  type PendingBookReviewItem,
  type PendingPriceRequestItem,
  type PremiumTradeRequest,
  type ReadingProgress,
  type RecoverableLocalData,
  type StoredPdfBlobEntry,
  type SyncReport,
  type TokenEconomyConfig,
  type TokenTransactionItem,
} from './db/booksDb';
import { auth } from './lib/firebase';
import { registerServiceWorker } from './swRegister';
import { PREMIUM_THEMES, type ThemeId } from './themeCatalog';
import {
  DEFAULT_APP_ICON_ID,
  PREMIUM_APP_ICONS,
  getAppIconById,
  isValidAppIconId,
  type AppIconId,
} from './appIconCatalog';

const DEVELOPER_PASSCODE = '3072009';
const SPLASH_LAST_ACTIVE_KEY = 'warraq-last-active-at';
const LONG_INACTIVITY_MS = 60 * 60 * 1000; // 1 hour

interface ServerCatalogApiResponse {
  catalogVersion: number;
  lastSyncedAt: string;
  sections: string[];
  sectionTranslations: Record<string, string>;
  books: BookRecord[];
  themeAccess: Record<string, ThemeAccessState>;
  iconAccess?: Record<string, IconAccessState>;
  unlockedIds: string[];
  purchasedIds: string[];
  progressMap: Record<string, ReadingProgress>;
  currentUserAccount?: CurrentUserAccountInfo | null;
  followingAccounts?: FollowingAccountSummary[];
  notifications?: UserNotificationItem[];
  unreadNotificationsCount?: number;
  tradeRequests?: PremiumTradeRequest[];
  economyConfig?: TokenEconomyConfig;
  tokenTransactions?: TokenTransactionItem[];
}

export default function App() {
  const { user, authLoading, authError, signInWithGoogle, signOutUser, apiFetch } = useAuth();
  const effectiveUser = user ?? auth.currentUser;
  const isSignedIn = Boolean(effectiveUser);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [sections, setSections] = useState<string[]>(DEFAULT_LIBRARY_SECTIONS);
  const [sectionTranslations, setSectionTranslations] = useState<Record<string, string>>({});
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>({});
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    let initialTheme = DEFAULT_APP_SETTINGS.themeId;
    let initialLang = DEFAULT_APP_SETTINGS.language;
    let initialIcon: AppIconId = DEFAULT_APP_ICON_ID;
    try {
      const savedTheme = localStorage.getItem('warraq-active-theme') as ThemeId | null;
      if (savedTheme) initialTheme = savedTheme;
      const savedLang = localStorage.getItem('warraq-active-language');
      if (savedLang === 'en' || savedLang === 'ar') initialLang = savedLang;
      const savedIcon = localStorage.getItem('warraq-active-icon');
      if (isValidAppIconId(savedIcon)) initialIcon = savedIcon;
    } catch {
      // ignore storage errors
    }
    return {
      ...DEFAULT_APP_SETTINGS,
      themeId: initialTheme,
      language: initialLang,
      appIconId: initialIcon,
    };
  });
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [themeAccessMap, setThemeAccessMap] = useState<Record<string, ThemeAccessState>>({});
  const [iconAccessMap, setIconAccessMap] = useState<Record<string, IconAccessState>>({});
  const [customThemeCodes, setCustomThemeCodes] = useState<Record<string, string>>({});
  const [devCodesVault, setDevCodesVault] = useState<DevCodeVaultEntry[]>([]);
  const [devUsersList, setDevUsersList] = useState<DevUserPurchaseEntry[]>([]);
  const [devPendingSubmissions, setDevPendingSubmissions] = useState<BookRecord[]>([]);
  const [devPendingPriceRequests, setDevPendingPriceRequests] = useState<PendingPriceRequestItem[]>([]);
  const [devPendingReviews, setDevPendingReviews] = useState<PendingBookReviewItem[]>([]);
  const [localRecoverable, setLocalRecoverable] = useState<RecoverableLocalData>({
    unmigratedBooks: [],
    orphanedDocuments: [],
  });
  const [serverBookIds, setServerBookIds] = useState<string[]>([]);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [splashDurationMs] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SPLASH_LAST_ACTIVE_KEY);
      const lastActive = raw ? Number(raw) : NaN;
      const now = Date.now();
      localStorage.setItem(SPLASH_LAST_ACTIVE_KEY, String(now));
      if (!Number.isFinite(lastActive) || now - lastActive >= LONG_INACTIVITY_MS) {
        return 10000;
      }
      return 5000;
    } catch {
      return 10000;
    }
  });
  const [showSplash, setShowSplash] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailBookId, setSelectedDetailBookId] = useState<string | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<BookRecord | null>(null);
  const [activeView, setActiveView] = useState<
    'home' | 'catalog' | 'premium' | 'reading' | 'you' | 'settings' | 'developer' | 'notifications'
  >('home');
  const [currentUserAccount, setCurrentUserAccount] = useState<CurrentUserAccountInfo | null>(null);
  const [followingAccounts, setFollowingAccounts] = useState<FollowingAccountSummary[]>([]);
  const [viewedProfile, setViewedProfile] = useState<PublicUserProfile | null>(null);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [tradeRequests, setTradeRequests] = useState<PremiumTradeRequest[]>([]);
  const [economyConfig, setEconomyConfig] = useState<TokenEconomyConfig>(
    DEFAULT_TOKEN_ECONOMY_CONFIG
  );
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransactionItem[]>([]);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [featuredBookId, setFeaturedBookId] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [unlockModalTarget, setUnlockModalTarget] = useState<{
    id: string;
    label: string;
    kind: 'book' | 'theme' | 'icon';
    codeExpiresAt?: string;
    accessType?: 'purchased' | 'code' | 'locked' | 'free';
  } | null>(null);
  const [giftModalState, setGiftModalState] = useState<{
    open: boolean;
    targetType?: 'book' | 'theme';
    targetId?: string;
    recipient?: { uid: string; displayName: string; isVerified: boolean } | null;
  }>({ open: false });
  const [directoryAccounts, setDirectoryAccounts] = useState<GiftDirectoryAccount[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [rateModalState, setRateModalState] = useState<{
    open: boolean;
    book: BookRecord | null;
  }>({ open: false, book: null });

  const lang = appSettings.language ?? 'ar';
  const isEn = lang === 'en';
  const copy = UI_COPY[lang];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appSettings.themeId);
    try {
      localStorage.setItem('warraq-active-theme', appSettings.themeId);
    } catch {
      // ignore storage errors
    }
  }, [appSettings.themeId]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
    try {
      localStorage.setItem('warraq-active-language', lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  useEffect(() => {
    const activeIconId = isValidAppIconId(appSettings.appIconId)
      ? appSettings.appIconId
      : DEFAULT_APP_ICON_ID;
    const iconMeta = getAppIconById(activeIconId);
    try {
      localStorage.setItem('warraq-active-icon', activeIconId);
    } catch {
      // ignore storage errors
    }

    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (iconLink) {
      iconLink.href =
        activeIconId === DEFAULT_APP_ICON_ID
          ? '/icon.svg'
          : `/api/app-icon/${encodeURIComponent(activeIconId)}.svg`;
    }

    const appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (appleLink) {
      appleLink.href =
        activeIconId === DEFAULT_APP_ICON_ID
          ? '/apple-touch-icon.png'
          : `/api/app-icon/${encodeURIComponent(activeIconId)}.png?size=180&maskable=1`;
    }

    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.href =
        activeIconId === DEFAULT_APP_ICON_ID && lang === 'ar'
          ? '/manifest.json'
          : `/api/manifest.webmanifest?icon=${encodeURIComponent(activeIconId)}&lang=${lang}`;
    }

    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.content = iconMeta.themeColor;
    }
  }, [appSettings.appIconId, lang]);

  const applyServerCatalog = useCallback(
    async (catalog: ServerCatalogApiResponse, savedSettingsOverride?: AppSettings) => {
      try {
        await saveServerCatalogSnapshotToLocalDb({
          books: catalog.books,
          sections: catalog.sections,
          sectionTranslations: catalog.sectionTranslations,
          unlockedIds: catalog.unlockedIds ?? [],
          progressMap: catalog.progressMap ?? {},
          catalogVersion: catalog.catalogVersion,
          lastSyncedAt: catalog.lastSyncedAt,
        });
      } catch {
        // Keep rendering from live server catalog even if IndexedDB is temporarily locked
      }

      setServerBookIds(catalog.books.map((b) => b.id));
      let recoverable: RecoverableLocalData = { unmigratedBooks: [], orphanedDocuments: [] };
      try {
        recoverable = await scanLocalRecoverableItems(catalog.books);
      } catch {
        recoverable = { unmigratedBooks: [], orphanedDocuments: [] };
      }
      setLocalRecoverable(recoverable);
      const mergedBooks =
        recoverable.unmigratedBooks.length > 0
          ? [...recoverable.unmigratedBooks.map((item) => item.book), ...catalog.books]
          : catalog.books;

      setBooks(mergedBooks);
      setSections(catalog.sections);
      setSectionTranslations(catalog.sectionTranslations);
      setThemeAccessMap(catalog.themeAccess ?? {});
      setIconAccessMap(catalog.iconAccess ?? {});
      setUnlockedIds(catalog.unlockedIds ?? []);
      setPurchasedIds(catalog.purchasedIds ?? []);
      setCurrentUserAccount(catalog.currentUserAccount ?? null);
      setFollowingAccounts(catalog.followingAccounts ?? []);
      setNotifications(catalog.notifications ?? []);
      setUnreadNotificationsCount(
        typeof catalog.unreadNotificationsCount === 'number'
          ? catalog.unreadNotificationsCount
          : (catalog.notifications ?? []).filter((n) => !n.isRead).length
      );
      setTradeRequests(catalog.tradeRequests ?? []);
      if (catalog.economyConfig) {
        setEconomyConfig(catalog.economyConfig);
      }
      setTokenTransactions(catalog.tokenTransactions ?? []);
      setProgressMap((prev) => ({ ...prev, ...(catalog.progressMap ?? {}) }));
      setSyncReport({
        catalogVersion: catalog.catalogVersion,
        lastSyncedAt: catalog.lastSyncedAt,
        source: 'cloudsql',
        added: 0,
        updated: 0,
        removed: 0,
        totalBooks: mergedBooks.length,
      });

      setActiveBook((current) => {
        if (!current) return null;
        return mergedBooks.find((b) => b.id === current.id) ?? current;
      });

      const currentSettings = savedSettingsOverride ?? (await getAppSettings());
      const isSavedThemePremiumLocked =
        PREMIUM_THEMES.some((t) => t.id === currentSettings.themeId) &&
        !(catalog.unlockedIds ?? []).includes(currentSettings.themeId);
      const serverActiveIcon = catalog.currentUserAccount?.activeIconId;
      const rawCandidateIcon =
        serverActiveIcon && isValidAppIconId(serverActiveIcon)
          ? serverActiveIcon
          : currentSettings.appIconId && isValidAppIconId(currentSettings.appIconId)
            ? currentSettings.appIconId
            : DEFAULT_APP_ICON_ID;
      const isCandidateIconLocked =
        PREMIUM_APP_ICONS.some((ic) => ic.id === rawCandidateIcon) &&
        !(catalog.unlockedIds ?? []).includes(rawCandidateIcon);
      const effectiveIconId: AppIconId = isCandidateIconLocked
        ? DEFAULT_APP_ICON_ID
        : rawCandidateIcon;

      const effectiveSettings: AppSettings = {
        ...currentSettings,
        themeId: isSavedThemePremiumLocked ? DEFAULT_APP_SETTINGS.themeId : currentSettings.themeId,
        appIconId: effectiveIconId,
      };
      setAppSettings(effectiveSettings);
      if (isSavedThemePremiumLocked || effectiveIconId !== currentSettings.appIconId) {
        await saveAppSettings(effectiveSettings);
      }
    },
    []
  );

  const fetchDevVaultAndUsers = useCallback(async () => {
    if (!isDeveloperMode) return;
    try {
      const headers = { 'x-developer-passcode': DEVELOPER_PASSCODE };
      const submissionsPromise = apiFetch('/api/dev/submissions', { headers });
      if (user) {
        const [codesRes, usersRes, submissionsRes] = await Promise.all([
          apiFetch('/api/dev/codes', { headers }),
          apiFetch('/api/dev/users', { headers }),
          submissionsPromise,
        ]);
        if (codesRes.ok) {
          const codesData = (await codesRes.json()) as { entries: DevCodeVaultEntry[] };
          setDevCodesVault(codesData.entries ?? []);
        }
        if (usersRes.ok) {
          const usersData = (await usersRes.json()) as { users: DevUserPurchaseEntry[] };
          setDevUsersList(usersData.users ?? []);
        }
        if (submissionsRes.ok) {
          const submissionsData = (await submissionsRes.json()) as {
            submissions?: BookRecord[];
            priceRequests?: PendingPriceRequestItem[];
            pendingReviews?: PendingBookReviewItem[];
          };
          setDevPendingSubmissions(submissionsData.submissions ?? []);
          setDevPendingPriceRequests(submissionsData.priceRequests ?? []);
          setDevPendingReviews(submissionsData.pendingReviews ?? []);
        }
      } else {
        const submissionsRes = await submissionsPromise;
        if (submissionsRes.ok) {
          const submissionsData = (await submissionsRes.json()) as {
            submissions?: BookRecord[];
            priceRequests?: PendingPriceRequestItem[];
            pendingReviews?: PendingBookReviewItem[];
          };
          setDevPendingSubmissions(submissionsData.submissions ?? []);
          setDevPendingPriceRequests(submissionsData.priceRequests ?? []);
          setDevPendingReviews(submissionsData.pendingReviews ?? []);
        }
      }
    } catch {
      // ignore offline dev fetch errors
    }
  }, [user, isDeveloperMode, apiFetch]);

  const runSync = useCallback(
    async (force = false) => {
      if (authLoading) return;
      try {
        const [savedSettings, themeCodes] = await Promise.all([
          getAppSettings(),
          getCustomThemeCodes(),
        ]);
        setCustomThemeCodes(themeCodes);

        try {
          const res = await apiFetch('/api/catalog');
          if (res.ok) {
            const catalog = (await res.json()) as ServerCatalogApiResponse;
            await applyServerCatalog(catalog);
            return;
          }
        } catch {
          // Fall back smoothly to local IndexedDB when offline
        }

        const [
          { books: syncedBooks, report },
          progress,
          unlocked,
          loadedTranslations,
        ] = await Promise.all([
          syncBooksFromCatalog('/books-data/catalog.json', force),
          getAllReadingProgress(),
          getUnlockedPremiumIds(),
          getSectionTranslations(),
        ]);
        const loadedSections = await getLibrarySections(syncedBooks);
        const recoverable = await scanLocalRecoverableItems(syncedBooks);
        setLocalRecoverable(recoverable);
        setBooks(syncedBooks);
        setSections(loadedSections);
        setSectionTranslations(loadedTranslations);
        setSyncReport(report);
        setProgressMap(progress);
        setUnlockedIds(user ? unlocked : []);
        setPurchasedIds([]);
        setThemeAccessMap({});
        setIconAccessMap({});
        setEconomyConfig(DEFAULT_TOKEN_ECONOMY_CONFIG);
        if (!user) {
          setCurrentUserAccount(null);
          setNotifications([]);
          setUnreadNotificationsCount(0);
          setTradeRequests([]);
          setTokenTransactions([]);
        }

        const effectiveUnlocked = user ? unlocked : [];
        const isSavedThemePremiumLocked =
          PREMIUM_THEMES.some((t) => t.id === savedSettings.themeId) &&
          !effectiveUnlocked.includes(savedSettings.themeId);
        const savedIconId = isValidAppIconId(savedSettings.appIconId)
          ? savedSettings.appIconId
          : DEFAULT_APP_ICON_ID;
        const isSavedIconPremiumLocked =
          PREMIUM_APP_ICONS.some((ic) => ic.id === savedIconId) &&
          !effectiveUnlocked.includes(savedIconId);
        const effectiveIconId = isSavedIconPremiumLocked ? DEFAULT_APP_ICON_ID : savedIconId;

        const effectiveSettings: AppSettings = {
          ...savedSettings,
          themeId: isSavedThemePremiumLocked ? DEFAULT_APP_SETTINGS.themeId : savedSettings.themeId,
          appIconId: effectiveIconId,
        };
        setAppSettings(effectiveSettings);
        if (isSavedThemePremiumLocked || effectiveIconId !== savedSettings.appIconId) {
          await saveAppSettings(effectiveSettings);
        }

        setActiveBook((current) => {
          if (!current) return null;
          return syncedBooks.find((b) => b.id === current.id) ?? current;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [authLoading, user, apiFetch, applyServerCatalog]
  );

  useEffect(() => {
    void runSync(false);
    registerServiceWorker(() => {
      void runSync(false);
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void runSync(false);
      }
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void runSync(false);
      }
    };
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void runSync(false);
      }
    }, 45_000);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
      window.clearInterval(intervalId);
    };
  }, [runSync]);

  useEffect(() => {
    if (isDeveloperMode) {
      void fetchDevVaultAndUsers();
    }
  }, [user, isDeveloperMode, fetchDevVaultAndUsers]);

  useEffect(() => {
    if (!user) return;
    const pollNotifications = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await apiFetch('/api/notifications');
        if (res.ok) {
          const data = (await res.json()) as {
            notifications?: UserNotificationItem[];
            unreadCount?: number;
          };
          if (Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
            setUnreadNotificationsCount(
              typeof data.unreadCount === 'number'
                ? data.unreadCount
                : data.notifications.filter((n) => !n.isRead).length
            );
          }
        }
      } catch {
        // ignore offline polling errors
      }
    };
    const timer = window.setInterval(() => {
      void pollNotifications();
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [user, apiFetch]);

  const handleUpdateSettings = useCallback(
    async (next: AppSettings) => {
      const normalizedIconId = isValidAppIconId(next.appIconId)
        ? next.appIconId
        : DEFAULT_APP_ICON_ID;
      const nextNormalized: AppSettings = { ...next, appIconId: normalizedIconId };
      const iconChanged = normalizedIconId !== appSettings.appIconId;
      setAppSettings(nextNormalized);
      try {
        localStorage.setItem('warraq-active-theme', nextNormalized.themeId);
        localStorage.setItem('warraq-active-language', nextNormalized.language ?? 'ar');
        localStorage.setItem('warraq-active-icon', normalizedIconId);
      } catch {
        // ignore storage errors
      }
      await saveAppSettings(nextNormalized);
      if (iconChanged && user) {
        try {
          await apiFetch('/api/user/app-icon', {
            method: 'PUT',
            body: JSON.stringify({ iconId: normalizedIconId }),
          });
        } catch {
          // keep local selection if offline
        }
      }
    },
    [appSettings.appIconId, user, apiFetch]
  );

  const handleSaveProgress = useCallback(
    async (progress: ReadingProgress) => {
      await saveReadingProgress(progress);
      setProgressMap((prev) => ({
        ...prev,
        [progress.bookId]: progress,
      }));
      if (user) {
        try {
          const res = await apiFetch('/api/progress', {
            method: 'PUT',
            body: JSON.stringify(progress),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              completedNow?: boolean;
              notifications?: UserNotificationItem[];
              unreadCount?: number;
            };
            if (data.completedNow && Array.isArray(data.notifications)) {
              setNotifications(data.notifications);
              setUnreadNotificationsCount(
                typeof data.unreadCount === 'number'
                  ? data.unreadCount
                  : data.notifications.filter((n) => !n.isRead).length
              );
            }
          }
        } catch {
          // keep local progress if offline
        }
      }
    },
    [user, apiFetch]
  );

  const handleMarkNotificationRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
      if (!user) return;
      try {
        const res = await apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = (await res.json()) as {
            notifications?: UserNotificationItem[];
            unreadCount?: number;
          };
          if (Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
            setUnreadNotificationsCount(data.unreadCount ?? 0);
          }
        }
      } catch {
        // ignore offline errors
      }
    },
    [user, apiFetch]
  );

  const handleMarkAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotificationsCount(0);
    if (!user) return;
    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as {
          notifications?: UserNotificationItem[];
          unreadCount?: number;
        };
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadNotificationsCount(data.unreadCount ?? 0);
        }
      }
    } catch {
      // ignore offline errors
    }
  }, [user, apiFetch]);

  const handleClearProgress = useCallback(async () => {
    await clearAllReadingProgress();
    setProgressMap({});
    if (user) {
      try {
        await apiFetch('/api/progress', { method: 'DELETE' });
      } catch {
        // ignore offline errors
      }
    }
  }, [user, apiFetch]);

  const handleUnlockDeveloper = useCallback(
    async (password: string) => {
      if (password !== DEVELOPER_PASSCODE) {
        return false;
      }
      setIsDeveloperMode(true);
      setActiveView('developer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (user) {
        try {
          await apiFetch('/api/dev/verify', {
            method: 'POST',
            headers: { 'x-developer-passcode': password },
          });
        } catch {
          // allow local inspection if offline
        }
      }
      return true;
    },
    [user, apiFetch]
  );

  const handleSaveCustomThemeCode = useCallback(async (themeId: string, code: string) => {
    const updated = await saveCustomThemeCode(themeId, code);
    setCustomThemeCodes(updated);
  }, []);

  const handleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const handleUnlockByCode = useCallback(
    async (code: string): Promise<{ ok: boolean; label?: string }> => {
      if (!user) {
        return { ok: false };
      }
      const res = await apiFetch('/api/unlock/code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (!res.ok) return { ok: false };
      const data = (await res.json()) as {
        ok: boolean;
        kind?: 'book' | 'theme' | 'icon';
        id?: string;
        label?: string;
      };
      if (data.ok) {
        await runSync(false);
        if (data.kind === 'theme' && data.id) {
          const themeObj = PREMIUM_THEMES.find((t) => t.id === data.id);
          return {
            ok: true,
            label: themeObj ? (isEn ? themeObj.nameEn : themeObj.name) : data.id,
          };
        }
        if (data.kind === 'icon' && data.id) {
          const iconObj = getAppIconById(data.id);
          return {
            ok: true,
            label: isEn ? iconObj.nameEn : iconObj.name,
          };
        }
        return { ok: true, label: data.label };
      }
      return { ok: false };
    },
    [user, apiFetch, runSync, isEn]
  );

  const handleAttemptTargetUnlock = useCallback(
    async (targetId: string, code: string): Promise<boolean> => {
      if (!user) return false;
      const res = await apiFetch('/api/unlock/code', {
        method: 'POST',
        body: JSON.stringify({ code, targetId }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        ok: boolean;
        kind?: 'book' | 'theme' | 'icon';
        id?: string;
      };
      if (!data.ok) return false;

      // Refresh catalog so full book chapters become available immediately
      const catalogRes = await apiFetch('/api/catalog');
      if (catalogRes.ok) {
        const catalog = (await catalogRes.json()) as ServerCatalogApiResponse;
        await applyServerCatalog(catalog);
        setUnlockModalTarget(null);
        if (data.kind === 'book') {
          const unlockedBook = catalog.books.find((b) => b.id === targetId);
          if (unlockedBook) setActiveBook(unlockedBook);
        } else if (data.kind === 'theme') {
          const latestSettings = await getAppSettings();
          await handleUpdateSettings({ ...latestSettings, themeId: targetId as ThemeId });
        } else if (data.kind === 'icon' && isValidAppIconId(targetId)) {
          const latestSettings = await getAppSettings();
          await handleUpdateSettings({ ...latestSettings, appIconId: targetId });
        }
        return true;
      }
      return false;
    },
    [user, apiFetch, applyServerCatalog, handleUpdateSettings]
  );

  const handleUnlockWithTokens = useCallback(
    async (
      targetType: 'book' | 'theme' | 'icon',
      targetId: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isSignedIn) {
        return {
          ok: false,
          error: isEn ? 'Please sign in with Google first.' : 'يرجى تسجيل الدخول بحساب Google أولاً.',
        };
      }
      try {
        const res = await apiFetch('/api/unlock/tokens', {
          method: 'POST',
          body: JSON.stringify({ targetType, targetId }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to unlock with Golden Tokens.' : 'تعذّر إتمام الشراء بالعملات الذهبية.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
          setUnlockModalTarget(null);
          if (targetType === 'book') {
            const unlockedBook = data.catalog.books.find((b) => b.id === targetId);
            if (unlockedBook) setActiveBook(unlockedBook);
          } else if (targetType === 'theme') {
            const latestSettings = await getAppSettings();
            await handleUpdateSettings({ ...latestSettings, themeId: targetId as ThemeId });
          } else if (targetType === 'icon' && isValidAppIconId(targetId)) {
            const latestSettings = await getAppSettings();
            await handleUpdateSettings({ ...latestSettings, appIconId: targetId });
          }
        } else {
          await runSync(false);
          setUnlockModalTarget(null);
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog, handleUpdateSettings, runSync]
  );

  const handlePreorderBook = useCallback(
    async (bookId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!isSignedIn) {
        await signInWithGoogle();
        if (!auth.currentUser) {
          return {
            ok: false,
            error: isEn ? 'Please sign in with Google first.' : 'يرجى تسجيل الدخول بحساب Google أولاً.',
          };
        }
      }
      try {
        const res = await apiFetch(`/api/books/${encodeURIComponent(bookId)}/preorder`, {
          method: 'POST',
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to complete pre-order.' : 'تعذّر إتمام الطلب المسبق للكتاب.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        } else {
          await runSync(false);
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, signInWithGoogle, isEn, apiFetch, applyServerCatalog, runSync]
  );

  const handleSubmitBookReview = useCallback(
    async (
      bookId: string,
      rating: number,
      comment: string
    ): Promise<{ ok: boolean; error?: string; isUpdate?: boolean; pendingModeration?: boolean }> => {
      if (!isSignedIn) {
        return {
          ok: false,
          error: isEn ? 'Please sign in with Google first.' : 'يرجى تسجيل الدخول بحساب Google أولاً.',
        };
      }
      try {
        const res = await apiFetch(`/api/books/${encodeURIComponent(bookId)}/reviews`, {
          method: 'POST',
          body: JSON.stringify({ rating, comment }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          isUpdate?: boolean;
          pendingModeration?: boolean;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ?? (isEn ? 'Failed to submit review.' : 'تعذّر إرسال التعليق والتقييم.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (isDeveloperMode) {
          void fetchDevVaultAndUsers();
        }
        return {
          ok: true,
          isUpdate: Boolean(data.isUpdate),
          pendingModeration: Boolean(data.pendingModeration ?? true),
        };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog, isDeveloperMode, fetchDevVaultAndUsers]
  );

  const handleUpdateEconomyConfig = useCallback(
    async (next: Partial<TokenEconomyConfig>): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await apiFetch('/api/dev/economy/config', {
          method: 'PUT',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify(next),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to save economy configuration.' : 'تعذّر حفظ إعدادات العملات.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [apiFetch, applyServerCatalog, isEn]
  );

  const handleSetItemTokenPrice = useCallback(
    async (
      targetType: 'book' | 'theme' | 'icon',
      targetId: string,
      tokenPrice: number | null
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await apiFetch('/api/dev/economy/price', {
          method: 'PATCH',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ targetType, targetId, tokenPrice }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ?? (isEn ? 'Failed to update custom price.' : 'تعذّر حفظ السعر المخصص.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (user) {
          await fetchDevVaultAndUsers();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [apiFetch, applyServerCatalog, fetchDevVaultAndUsers, isEn, user]
  );

  const handleAdjustUserTokens = useCallback(
    async (
      userUid: string,
      mode: 'add' | 'set',
      amount: number,
      note?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) {
        return { ok: false, error: isEn ? 'Sign in required' : 'يتطلب تسجيل الدخول' };
      }
      try {
        const res = await apiFetch(`/api/dev/users/${encodeURIComponent(userUid)}/tokens`, {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ mode, amount, note }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ?? (isEn ? 'Failed to update user tokens.' : 'تعذّر تعديل رصيد العملات.'),
          };
        }
        await Promise.all([fetchDevVaultAndUsers(), runSync(false)]);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [user, isEn, apiFetch, fetchDevVaultAndUsers, runSync]
  );

  const handleSaveBook = useCallback(
    async (
      book: BookRecord,
      documentPayload?: DocumentUploadPayload,
      notifyFollowers?: boolean
    ) => {
      let serverClientError: string | null = null;
      try {
        const res = await apiFetch('/api/dev/books', {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ book, documentPayload, notifyFollowers }),
        });
        if (res.ok) {
          const data = (await res.json()) as { catalog: ServerCatalogApiResponse };
          await applyServerCatalog(data.catalog);
          await fetchDevVaultAndUsers();
          return;
        }
        if (res.status >= 400 && res.status < 500) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          serverClientError = errData.error ?? 'Validation error while saving book.';
        }
      } catch {
        // Fall back to local IndexedDB when offline
      }
      if (serverClientError) {
        throw new Error(serverClientError);
      }
      const updatedBooks = await saveDeveloperBook(book);
      setBooks(updatedBooks);
      const cat = book.category.trim();
      if (cat && !sections.includes(cat)) {
        const nextSections = await saveLibrarySections([...sections, cat]);
        setSections(nextSections);
      }
    },
    [apiFetch, applyServerCatalog, fetchDevVaultAndUsers, sections]
  );

  const handleSubmitUserBook = useCallback(
    async (
      book: BookRecord,
      documentPayload?: DocumentUploadPayload
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isSignedIn) {
        return {
          ok: false,
          error: isEn ? 'Please sign in with Google first.' : 'يرجى تسجيل الدخول بحساب Google أولاً.',
        };
      }
      try {
        const res = await apiFetch('/api/user/books', {
          method: 'POST',
          body: JSON.stringify({ book, documentPayload }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to submit book for review.' : 'تعذّر إرسال الكتاب للمراجعة.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (isDeveloperMode) {
          void fetchDevVaultAndUsers();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog, isDeveloperMode, fetchDevVaultAndUsers]
  );

  const handleDeleteUserSubmission = useCallback(
    async (bookId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!isSignedIn) {
        return {
          ok: false,
          error: isEn ? 'Please sign in first.' : 'يرجى تسجيل الدخول أولاً.',
        };
      }
      try {
        const res = await apiFetch(`/api/user/books/${encodeURIComponent(bookId)}`, {
          method: 'DELETE',
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ?? (isEn ? 'Failed to delete submission.' : 'تعذّر حذف طلب النشر.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (isDeveloperMode) {
          void fetchDevVaultAndUsers();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog, isDeveloperMode, fetchDevVaultAndUsers]
  );

  const handleReviewSubmission = useCallback(
    async (
      bookId: string,
      decision: 'approve' | 'reject',
      reviewNote?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await apiFetch(`/api/dev/submissions/${encodeURIComponent(bookId)}/review`, {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ decision, reviewNote }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          submissions?: BookRecord[];
          priceRequests?: PendingPriceRequestItem[];
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to process review decision.' : 'تعذّر حفظ قرار المراجعة.'),
          };
        }
        setDevPendingSubmissions(data.submissions ?? []);
        if (Array.isArray(data.priceRequests)) {
          setDevPendingPriceRequests(data.priceRequests);
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (user) {
          void fetchDevVaultAndUsers();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [apiFetch, isEn, applyServerCatalog, user, fetchDevVaultAndUsers]
  );

  const handleRequestBookPriceChange = useCallback(
    async (
      bookId: string,
      tokenPrice: number
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isSignedIn) {
        return {
          ok: false,
          error: isEn ? 'Please sign in with Google first.' : 'يرجى تسجيل الدخول بحساب Google أولاً.',
        };
      }
      try {
        const res = await apiFetch(`/api/user/books/${encodeURIComponent(bookId)}/price-request`, {
          method: 'POST',
          body: JSON.stringify({ tokenPrice }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to send price change request.' : 'تعذّر إرسال طلب تعديل السعر.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (isDeveloperMode) {
          void fetchDevVaultAndUsers();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog, isDeveloperMode, fetchDevVaultAndUsers]
  );

  const handleReviewPriceRequest = useCallback(
    async (
      bookId: string,
      decision: 'approve' | 'reject',
      reviewNote?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await apiFetch(`/api/dev/price-requests/${encodeURIComponent(bookId)}/review`, {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ decision, reviewNote }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          priceRequests?: PendingPriceRequestItem[];
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to review price change.' : 'تعذّر تنفيذ قرار تعديل السعر.'),
          };
        }
        setDevPendingPriceRequests(data.priceRequests ?? []);
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (user) {
          void fetchDevVaultAndUsers();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [apiFetch, isEn, applyServerCatalog, user, fetchDevVaultAndUsers]
  );

  const handleModerateReview = useCallback(
    async (
      reviewId: string,
      decision: 'approve' | 'reject',
      moderationNote?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await apiFetch(`/api/dev/reviews/${encodeURIComponent(reviewId)}/moderate`, {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ decision, moderationNote }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          pendingReviews?: PendingBookReviewItem[];
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to process review moderation.' : 'تعذّر تنفيذ قرار مراجعة التقييم.'),
          };
        }
        setDevPendingReviews(data.pendingReviews ?? []);
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (user) {
          void fetchDevVaultAndUsers();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [apiFetch, isEn, applyServerCatalog, user, fetchDevVaultAndUsers]
  );

  const handleUpdateBookDiscount = useCallback(
    async (
      bookId: string,
      payload: {
        discountPercent: number | null;
        discountEndsAt?: string | null;
        discountPostReleaseDays?: number | null;
      }
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isSignedIn) {
        return {
          ok: false,
          error: isEn ? 'Please sign in with Google first.' : 'يرجى تسجيل الدخول بحساب Google أولاً.',
        };
      }
      try {
        const res = await apiFetch(`/api/user/books/${encodeURIComponent(bookId)}/discount`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Could not update discount.' : 'تعذّر تحديث خصم السيل.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog]
  );

  const handleBroadcastFeatureAnnouncement = useCallback(
    async (payload: {
      titleAr: string;
      titleEn?: string;
      messageAr: string;
      messageEn?: string;
      targetView: string;
      targetSection?: string | null;
    }): Promise<{ ok: boolean; error?: string; recipientsCount?: number }> => {
      try {
        const res = await apiFetch('/api/dev/announcements', {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          recipientsCount?: number;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to send announcement.' : 'تعذّر إرسال إشعار الميزة.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        return { ok: true, recipientsCount: data.recipientsCount };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'حدث خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [apiFetch, isEn, applyServerCatalog]
  );

  const handleDeleteBook = useCallback(
    async (bookId: string, pdfId?: string) => {
      try {
        const res = await apiFetch(`/api/dev/books/${encodeURIComponent(bookId)}`, {
          method: 'DELETE',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        });
        if (res.ok) {
          const data = (await res.json()) as { catalog: ServerCatalogApiResponse };
          await applyServerCatalog(data.catalog);
          await fetchDevVaultAndUsers();
          return;
        }
      } catch {
        // Fall back to local IndexedDB when offline
      }
      const updatedBooks = await deleteDeveloperBook(bookId, pdfId);
      setBooks(updatedBooks);
    },
    [apiFetch, applyServerCatalog, fetchDevVaultAndUsers]
  );

  const handleImportCatalog = useCallback(
    async (payload: CatalogPayload) => {
      if (user) {
        const res = await apiFetch('/api/dev/catalog/import', {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = (await res.json()) as { catalog: ServerCatalogApiResponse };
          await applyServerCatalog(data.catalog);
          await fetchDevVaultAndUsers();
          return;
        }
      }
      const updatedBooks = await importCatalogPayload(payload);
      setBooks(updatedBooks);
      const [loadedSections, loadedTranslations] = await Promise.all([
        getLibrarySections(updatedBooks),
        getSectionTranslations(),
      ]);
      setSections(loadedSections);
      setSectionTranslations(loadedTranslations);
    },
    [user, apiFetch, applyServerCatalog, fetchDevVaultAndUsers]
  );

  const handleResetServerCatalog = useCallback(async () => {
    if (user) {
      await runSync(true);
      return;
    }
    const { books: syncedBooks, report } = await resetToServerCatalog('/books-data/catalog.json');
    setBooks(syncedBooks);
    setSyncReport(report);
    const [loadedSections, loadedTranslations] = await Promise.all([
      getLibrarySections(syncedBooks),
      getSectionTranslations(),
    ]);
    setSections(loadedSections);
    setSectionTranslations(loadedTranslations);
  }, [user, runSync]);

  const handleAddSection = useCallback(
    async (name: string, englishName?: string) => {
      if (user) {
        const res = await apiFetch('/api/dev/sections', {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ name, englishName }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            ok: boolean;
            error?: 'empty' | 'duplicate';
            catalog: ServerCatalogApiResponse;
          };
          await applyServerCatalog(data.catalog);
          return {
            ok: data.ok,
            sections: data.catalog.sections,
            sectionTranslations: data.catalog.sectionTranslations,
            error: data.error,
          };
        }
      }
      const res = await addLibrarySection(name, englishName);
      setSections(res.sections);
      setSectionTranslations(res.sectionTranslations);
      return res;
    },
    [user, apiFetch, applyServerCatalog]
  );

  const handleRenameSection = useCallback(
    async (oldName: string, newName: string, englishName?: string) => {
      if (user) {
        const res = await apiFetch(`/api/dev/sections/${encodeURIComponent(oldName)}`, {
          method: 'PUT',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ newName, englishName }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            ok: boolean;
            error?: 'empty' | 'duplicate';
            catalog: ServerCatalogApiResponse;
          };
          await applyServerCatalog(data.catalog);
          if (data.ok && selectedCategory === oldName) {
            setSelectedCategory(newName.trim());
          }
          return {
            ok: data.ok,
            sections: data.catalog.sections,
            books: data.catalog.books,
            sectionTranslations: data.catalog.sectionTranslations,
            error: data.error,
          };
        }
      }
      const res = await renameLibrarySection(oldName, newName, englishName);
      setSections(res.sections);
      setBooks(res.books);
      setSectionTranslations(res.sectionTranslations);
      if (res.ok && selectedCategory === oldName) {
        setSelectedCategory(newName.trim());
      }
      return res;
    },
    [user, apiFetch, applyServerCatalog, selectedCategory]
  );

  const handleDeleteSection = useCallback(
    async (sectionName: string, fallbackSection?: string) => {
      if (user) {
        const qs = fallbackSection ? `?fallback=${encodeURIComponent(fallbackSection)}` : '';
        const res = await apiFetch(`/api/dev/sections/${encodeURIComponent(sectionName)}${qs}`, {
          method: 'DELETE',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            reassignedTo: string | null;
            catalog: ServerCatalogApiResponse;
          };
          await applyServerCatalog(data.catalog);
          if (selectedCategory === sectionName) {
            setSelectedCategory('ALL');
          }
          return {
            sections: data.catalog.sections,
            books: data.catalog.books,
            reassignedTo: data.reassignedTo,
          };
        }
      }
      const res = await deleteLibrarySection(sectionName, fallbackSection);
      setSections(res.sections);
      setBooks(res.books);
      setSectionTranslations(res.sectionTranslations);
      if (selectedCategory === sectionName) {
        setSelectedCategory('ALL');
      }
      return res;
    },
    [user, apiFetch, applyServerCatalog, selectedCategory]
  );

  const handleAssignBookSection = useCallback(
    async (bookId: string, sectionName: string) => {
      if (user) {
        const res = await apiFetch(`/api/dev/books/${encodeURIComponent(bookId)}/section`, {
          method: 'PATCH',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ sectionName }),
        });
        if (res.ok) {
          const data = (await res.json()) as { catalog: ServerCatalogApiResponse };
          await applyServerCatalog(data.catalog);
          return;
        }
      }
      const res = await assignBookToSection(bookId, sectionName);
      setBooks(res.books);
      setSections(res.sections);
    },
    [user, apiFetch, applyServerCatalog]
  );

  const handleAddBookReview = useCallback(
    async (
      bookId: string,
      reviewerName: string,
      rating: number,
      comment: string,
      isOwner = false,
      isVerified = false,
      reviewerUid?: string | null
    ): Promise<{ ok: boolean; error?: string }> => {
      const cleanUid = typeof reviewerUid === 'string' && reviewerUid.trim() ? reviewerUid.trim() : null;
      const ownerFlag = Boolean(isOwner);
      const verifiedFlag = cleanUid ? Boolean(isVerified) : Boolean(isVerified || ownerFlag);
      try {
        const res = await apiFetch(`/api/dev/books/${encodeURIComponent(bookId)}/reviews`, {
          method: 'POST',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({
            reviewerName,
            rating,
            comment,
            isOwner: ownerFlag,
            isVerified: verifiedFlag,
            reviewerUid: cleanUid,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (res.ok && data.catalog) {
          await applyServerCatalog(data.catalog);
          return { ok: true };
        }
        if (res.status >= 400 && res.status < 500) {
          return { ok: false, error: data.error };
        }
      } catch {
        // Offline fallback below
      }
      const target = books.find((b) => b.id === bookId);
      if (!target) return { ok: false, error: 'Book not found' };
      const nextReviews = [
        {
          id: `rev-${Date.now()}`,
          bookId,
          reviewerUid: cleanUid,
          reviewerName,
          rating,
          comment,
          isVerified: verifiedFlag,
          isOwner: ownerFlag,
          createdAt: new Date().toISOString(),
        },
        ...(target.reviews ?? []),
      ];
      const updatedBooks = await saveDeveloperBook({
        ...target,
        reviews: nextReviews,
        rating: calculateReviewsAverage(nextReviews),
      });
      setBooks(updatedBooks);
      return { ok: true };
    },
    [apiFetch, applyServerCatalog, books]
  );

  const handleUpdateBookReview = useCallback(
    async (
      reviewId: string,
      reviewerName: string,
      rating: number,
      comment: string,
      isOwner = false,
      isVerified = false,
      reviewerUid?: string | null
    ): Promise<{ ok: boolean; error?: string }> => {
      const cleanUid = typeof reviewerUid === 'string' && reviewerUid.trim() ? reviewerUid.trim() : null;
      const ownerFlag = Boolean(isOwner);
      const verifiedFlag = cleanUid ? Boolean(isVerified) : Boolean(isVerified || ownerFlag);
      try {
        const res = await apiFetch(`/api/dev/reviews/${encodeURIComponent(reviewId)}`, {
          method: 'PUT',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({
            reviewerName,
            rating,
            comment,
            isOwner: ownerFlag,
            isVerified: verifiedFlag,
            reviewerUid: cleanUid,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (res.ok && data.catalog) {
          await applyServerCatalog(data.catalog);
          return { ok: true };
        }
        if (res.status >= 400 && res.status < 500) {
          return { ok: false, error: data.error };
        }
      } catch {
        // Offline fallback below
      }
      const target = books.find((b) => (b.reviews ?? []).some((r) => r.id === reviewId));
      if (!target) return { ok: false, error: 'Review not found' };
      const nextReviews = (target.reviews ?? []).map((r) =>
        r.id === reviewId
          ? {
              ...r,
              reviewerUid: cleanUid,
              reviewerName,
              rating,
              comment,
              isVerified: verifiedFlag,
              isOwner: ownerFlag,
            }
          : r
      );
      const updatedBooks = await saveDeveloperBook({
        ...target,
        reviews: nextReviews,
        rating: calculateReviewsAverage(nextReviews),
      });
      setBooks(updatedBooks);
      return { ok: true };
    },
    [apiFetch, applyServerCatalog, books]
  );

  const handleDeleteBookReview = useCallback(
    async (reviewId: string) => {
      try {
        const res = await apiFetch(`/api/dev/reviews/${encodeURIComponent(reviewId)}`, {
          method: 'DELETE',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        });
        if (res.ok) {
          const data = (await res.json()) as { catalog?: ServerCatalogApiResponse };
          if (data.catalog) {
            await applyServerCatalog(data.catalog);
            return;
          }
        }
      } catch {
        // Offline fallback below
      }
      const target = books.find((b) => (b.reviews ?? []).some((r) => r.id === reviewId));
      if (!target) return;
      const nextReviews = (target.reviews ?? []).filter((r) => r.id !== reviewId);
      const updatedBooks = await saveDeveloperBook({
        ...target,
        reviews: nextReviews,
        rating: calculateReviewsAverage(nextReviews),
      });
      setBooks(updatedBooks);
    },
    [apiFetch, applyServerCatalog, books]
  );

  const handleRotateCode = useCallback(
    async (
      targetType: 'book' | 'theme' | 'icon',
      targetId: string,
      customCode?: string,
      rotationHours?: number
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Sign in required' };
      const res = await apiFetch('/api/dev/codes/rotate', {
        method: 'POST',
        headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        body: JSON.stringify({ targetType, targetId, customCode, rotationHours }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        await Promise.all([runSync(false), fetchDevVaultAndUsers()]);
      }
      return data;
    },
    [user, apiFetch, runSync, fetchDevVaultAndUsers]
  );

  const handleRotateAllCodes = useCallback(async () => {
    if (!user) return;
    await apiFetch('/api/dev/codes/rotate-all', {
      method: 'POST',
      headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
    });
    await Promise.all([runSync(false), fetchDevVaultAndUsers()]);
  }, [user, apiFetch, runSync, fetchDevVaultAndUsers]);

  const handleGrantPermanentAccess = useCallback(
    async (email: string, targetType: 'book' | 'theme' | 'icon', targetId: string) => {
      if (!user) return { ok: false, error: 'Sign in required' };
      const res = await apiFetch('/api/dev/purchases/grant', {
        method: 'POST',
        headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        body: JSON.stringify({ email, targetType, targetId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        await Promise.all([runSync(false), fetchDevVaultAndUsers()]);
      }
      return data;
    },
    [user, apiFetch, runSync, fetchDevVaultAndUsers]
  );

  const handleRevokePermanentAccess = useCallback(
    async (userUid: string, targetType: 'book' | 'theme' | 'icon', targetId: string) => {
      if (!user) return;
      await apiFetch('/api/dev/purchases', {
        method: 'DELETE',
        headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        body: JSON.stringify({ userUid, targetType, targetId }),
      });
      await Promise.all([runSync(false), fetchDevVaultAndUsers()]);
    },
    [user, apiFetch, runSync, fetchDevVaultAndUsers]
  );

  const handleSetUserVerified = useCallback(
    async (userUid: string, isVerified: boolean) => {
      if (!user) return;
      const res = await apiFetch(`/api/dev/users/${encodeURIComponent(userUid)}/verify`, {
        method: 'PATCH',
        headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        body: JSON.stringify({ isVerified }),
      });
      if (res.ok) {
        await Promise.all([runSync(false), fetchDevVaultAndUsers()]);
      }
    },
    [user, apiFetch, runSync, fetchDevVaultAndUsers]
  );

  const handleToggleBookAuthorVerified = useCallback(
    async (bookId: string, isAuthorVerified: boolean) => {
      try {
        const res = await apiFetch(`/api/dev/books/${encodeURIComponent(bookId)}/author-verified`, {
          method: 'PATCH',
          headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
          body: JSON.stringify({ isAuthorVerified }),
        });
        if (res.ok) {
          const data = (await res.json()) as { catalog?: ServerCatalogApiResponse };
          if (data.catalog) {
            await applyServerCatalog(data.catalog);
            return;
          }
        }
      } catch {
        // Offline fallback below
      }
      const target = books.find((b) => b.id === bookId);
      if (!target) return;
      const updatedBooks = await saveDeveloperBook({
        ...target,
        isAuthorVerified,
      });
      setBooks(updatedBooks);
    },
    [apiFetch, applyServerCatalog, books]
  );

  const handleAssignBookOwner = useCallback(
    async (bookId: string, authorUid: string | null, notifyFollowers = false) => {
      const res = await apiFetch(`/api/dev/books/${encodeURIComponent(bookId)}/owner`, {
        method: 'PATCH',
        headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        body: JSON.stringify({ authorUid, notifyFollowers }),
      });
      if (res.ok) {
        const data = (await res.json()) as { catalog?: ServerCatalogApiResponse };
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
      }
    },
    [apiFetch, applyServerCatalog]
  );

  const handleToggleReviewLike = useCallback(
    async (reviewId: string) => {
      if (!user) {
        await signInWithGoogle();
        return;
      }
      const res = await apiFetch(`/api/reviews/${encodeURIComponent(reviewId)}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = (await res.json()) as {
          ok?: boolean;
          catalog?: ServerCatalogApiResponse;
        };
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
      }
    },
    [user, signInWithGoogle, apiFetch, applyServerCatalog]
  );

  const fetchGiftDirectory = useCallback(async () => {
    if (!isSignedIn) return;
    setLoadingDirectory(true);
    setDirectoryError(null);
    try {
      const res = await apiFetch('/api/users/directory');
      if (!res.ok) {
        setDirectoryError(
          isEn
            ? 'Could not load reader names right now.'
            : 'تعذّر تحميل قائمة الأسماء في الوقت الحالي.'
        );
        return;
      }
      const data = (await res.json()) as { accounts?: GiftDirectoryAccount[] };
      setDirectoryAccounts(data.accounts ?? []);
    } catch {
      setDirectoryError(
        isEn
          ? 'Connection error while loading reader names.'
          : 'حدث خطأ في الاتصال أثناء تحميل الأسماء.'
      );
    } finally {
      setLoadingDirectory(false);
    }
  }, [isSignedIn, apiFetch, isEn]);

  useEffect(() => {
    if (giftModalState.open && isSignedIn) {
      void fetchGiftDirectory();
    }
  }, [giftModalState.open, isSignedIn, fetchGiftDirectory]);

  const handleOpenGiftModal = useCallback(
    async (opts: {
      targetType?: 'book' | 'theme';
      targetId?: string;
      recipient?: { uid: string; displayName: string; isVerified: boolean };
    }) => {
      setDirectoryError(null);
      setGiftModalState({
        open: true,
        targetType: opts.targetType,
        targetId: opts.targetId,
        recipient: opts.recipient ?? null,
      });
    },
    []
  );

  const handleGiftUnlockTarget = useCallback(
    async (targetId: string, code: string): Promise<boolean> => {
      if (!isSignedIn) return false;
      try {
        const res = await apiFetch('/api/unlock/code', {
          method: 'POST',
          body: JSON.stringify({ code, targetId }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { ok: boolean };
        if (!data.ok) return false;
        const catalogRes = await apiFetch('/api/catalog');
        if (catalogRes.ok) {
          const catalog = (await catalogRes.json()) as ServerCatalogApiResponse;
          await applyServerCatalog(catalog);
        }
        return true;
      } catch {
        return false;
      }
    },
    [isSignedIn, apiFetch, applyServerCatalog]
  );

  const handleConfirmGiftTransfer = useCallback(
    async (
      recipientUid: string,
      targetType: 'book' | 'theme',
      targetId: string
    ): Promise<{ ok: boolean; error?: string; itemLabel?: string }> => {
      if (!isSignedIn) {
        return { ok: false, error: isEn ? 'Sign in required' : 'يلزم تسجيل الدخول أولاً' };
      }
      try {
        const res = await apiFetch('/api/gifts/transfer', {
          method: 'POST',
          body: JSON.stringify({ recipientUid, targetType, targetId }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          itemLabel?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to transfer gift.' : 'تعذّر إرسال الهدية في الوقت الحالي.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        if (viewedProfile && viewedProfile.uid === recipientUid) {
          const pRes = await apiFetch(`/api/users/${encodeURIComponent(recipientUid)}/profile`);
          if (pRes.ok) {
            const pData = (await pRes.json()) as { ok?: boolean; profile?: PublicUserProfile };
            if (pData.ok && pData.profile) {
              setViewedProfile(pData.profile);
            }
          }
        }
        return { ok: true, itemLabel: data.itemLabel };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog, viewedProfile]
  );

  const handleCreateTradeRequest = useCallback(
    async (payload: {
      recipientUid: string;
      offeredType: 'book' | 'theme';
      offeredId: string;
      requestedType: 'book' | 'theme';
      requestedId: string;
    }): Promise<{ ok: boolean; error?: string; tradeId?: string }> => {
      if (!isSignedIn) {
        return { ok: false, error: isEn ? 'Sign in required' : 'يلزم تسجيل الدخول أولاً' };
      }
      try {
        const res = await apiFetch('/api/trades', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          tradeId?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Failed to send trade request.' : 'تعذّر إرسال طلب التبديل حالياً.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        return { ok: true, tradeId: data.tradeId };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog]
  );

  const handleRespondTradeRequest = useCallback(
    async (
      tradeId: string,
      decision: 'accept' | 'decline' | 'cancel'
    ): Promise<{ ok: boolean; error?: string; status?: string }> => {
      if (!isSignedIn) {
        return { ok: false, error: isEn ? 'Sign in required' : 'يلزم تسجيل الدخول أولاً' };
      }
      try {
        const res = await apiFetch(`/api/trades/${encodeURIComponent(tradeId)}/respond`, {
          method: 'POST',
          body: JSON.stringify({ decision }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          status?: string;
          catalog?: ServerCatalogApiResponse;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error:
              data.error ??
              (isEn ? 'Could not update trade request.' : 'تعذّر تنفيذ الإجراء على طلب التبديل.'),
          };
        }
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        return { ok: true, status: data.status };
      } catch {
        return {
          ok: false,
          error: isEn ? 'Connection error. Please try again.' : 'خطأ في الاتصال، حاول مرة أخرى.',
        };
      }
    },
    [isSignedIn, isEn, apiFetch, applyServerCatalog]
  );

  const handleOpenUserProfile = useCallback(
    async (targetUid: string) => {
      if (user && targetUid === user.uid) {
        setViewedProfile(null);
        setSelectedDetailBookId(null);
        setSelectedSeriesId(null);
        setActiveView('you');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      try {
        const res = await apiFetch(`/api/users/${encodeURIComponent(targetUid)}/profile`);
        if (!res.ok) return;
        const data = (await res.json()) as { ok?: boolean; profile?: PublicUserProfile };
        if (data.ok && data.profile) {
          setViewedProfile(data.profile);
          setSelectedDetailBookId(null);
          setSelectedSeriesId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch {
        // ignore network profile fetch errors
      }
    },
    [user, apiFetch]
  );

  const handleToggleFollowUser = useCallback(
    async (targetUid: string, nextFollow: boolean) => {
      if (!user) {
        await signInWithGoogle();
        return;
      }
      const res = await apiFetch(`/api/users/${encodeURIComponent(targetUid)}/follow`, {
        method: nextFollow ? 'POST' : 'DELETE',
      });
      if (res.ok) {
        const data = (await res.json()) as {
          ok?: boolean;
          isFollowing?: boolean;
          followersCount?: number;
          catalog?: ServerCatalogApiResponse;
        };
        if (data.catalog) {
          await applyServerCatalog(data.catalog);
        }
        setViewedProfile((prev) =>
          prev && prev.uid === targetUid
            ? {
                ...prev,
                isFollowing: Boolean(data.isFollowing),
                followersCount:
                  typeof data.followersCount === 'number'
                    ? data.followersCount
                    : prev.followersCount,
              }
            : prev
        );
      }
    },
    [user, signInWithGoogle, apiFetch, applyServerCatalog]
  );

  const handleToggleComingSoonNotify = useCallback(
    async (bookId: string) => {
      if (!isSignedIn) {
        await signInWithGoogle();
        if (!auth.currentUser) return;
      }
      try {
        const res = await apiFetch(`/api/books/${encodeURIComponent(bookId)}/notify-me`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = (await res.json()) as {
            ok?: boolean;
            catalog?: ServerCatalogApiResponse;
          };
          if (data.catalog) {
            await applyServerCatalog(data.catalog);
          }
        }
      } catch {
        // ignore connection errors
      }
    },
    [isSignedIn, signInWithGoogle, apiFetch, applyServerCatalog]
  );

  const fetchDocumentBuffer = useCallback(
    async (pdfId: string): Promise<ArrayBuffer | null> => {
      const headers: Record<string, string> = {};
      if (isDeveloperMode) {
        headers['x-developer-passcode'] = DEVELOPER_PASSCODE;
      }
      const res = await apiFetch(`/api/documents/${encodeURIComponent(pdfId)}`, { headers });
      if (!res.ok) return null;
      const data = (await res.json()) as { dataBase64?: string };
      if (!data.dataBase64) return null;
      return base64ToArrayBuffer(data.dataBase64);
    },
    [isDeveloperMode, apiFetch]
  );

  const handleScanLocalRecoverable = useCallback(async () => {
    const serverOnly = books.filter((b) => serverBookIds.includes(b.id));
    const result = await scanLocalRecoverableItems(serverOnly);
    setLocalRecoverable(result);
    return result;
  }, [books, serverBookIds]);

  const handleMigrateLocalBooks = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    const serverOnly = books.filter((b) => serverBookIds.includes(b.id));
    const latest = await scanLocalRecoverableItems(serverOnly);
    let migratedCount = 0;
    for (const item of latest.unmigratedBooks) {
      let documentPayload: DocumentUploadPayload | undefined;
      if (item.blob && item.book.pdfId) {
        const lowerName = item.blob.fileName.toLowerCase();
        const isWord = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || item.book.bookType === 'word';
        documentPayload = {
          id: item.book.pdfId,
          fileName: item.blob.fileName,
          mimeType: isWord
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf',
          dataBase64: arrayBufferToBase64(item.blob.data),
        };
      }
      const res = await apiFetch('/api/dev/books', {
        method: 'POST',
        headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        body: JSON.stringify({ book: item.book, documentPayload }),
      });
      if (res.ok) {
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      await Promise.all([runSync(false), fetchDevVaultAndUsers()]);
    }
    return migratedCount;
  }, [user, books, serverBookIds, apiFetch, runSync, fetchDevVaultAndUsers]);

  const handleRestoreOrphanDocument = useCallback(
    async (blob: StoredPdfBlobEntry): Promise<boolean> => {
      if (!user) return false;
      const lower = blob.fileName.toLowerCase();
      const isWord = lower.endsWith('.docx') || lower.endsWith('.doc');
      const cleanTitle = blob.fileName.replace(/\.(pdf|docx?|PDF|DOCX?)$/, '').trim() || 'كتاب مستعاد';
      let pageCount = 10;
      let coverUrl = '';
      try {
        if (isWord) {
          const { loadWordPages } = await import('./utils/wordUtils');
          const info = await loadWordPages(blob.data, cleanTitle);
          pageCount = Math.max(1, info.pageCount);
          if (info.coverDataUrl) coverUrl = info.coverDataUrl;
        } else {
          const { inspectPdfBuffer } = await import('./utils/pdfUtils');
          const info = await inspectPdfBuffer(blob.data);
          pageCount = Math.max(1, info.pageCount);
          if (info.coverDataUrl) coverUrl = info.coverDataUrl;
        }
      } catch {
        pageCount = 10;
      }

      const nowIso = new Date().toISOString();
      const restoredBook: BookRecord = {
        id: `restored-${blob.id}`,
        title: cleanTitle,
        subtitle: isWord ? 'مستند Word مستعاد' : 'كتاب PDF مستعاد',
        author: 'شادي',
        category: sections[0] ?? 'العلوم',
        year: new Date().getFullYear(),
        pages: pageCount,
        readingMinutes: Math.max(5, Math.round(pageCount * 1.5)),
        rating: 0,
        version: 1,
        updatedAt: nowIso.slice(0, 10),
        addedAt: blob.savedAt ?? nowIso,
        featured: books.length === 0,
        isPremium: false,
        priceLabel: '',
        rotationHours: 24,
        bookType: isWord ? 'word' : 'pdf',
        pdfId: blob.id,
        pdfPageCount: pageCount,
        coverUrl,
        synopsis: `كتاب مستعاد من الملف المحلي (${blob.fileName}).`,
        chapters: [],
      };

      const documentPayload: DocumentUploadPayload = {
        id: blob.id,
        fileName: blob.fileName,
        mimeType: isWord
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf',
        dataBase64: arrayBufferToBase64(blob.data),
      };

      const res = await apiFetch('/api/dev/books', {
        method: 'POST',
        headers: { 'x-developer-passcode': DEVELOPER_PASSCODE },
        body: JSON.stringify({ book: restoredBook, documentPayload }),
      });
      if (res.ok) {
        const data = (await res.json()) as { catalog: ServerCatalogApiResponse };
        await applyServerCatalog(data.catalog);
        await fetchDevVaultAndUsers();
        return true;
      }
      return false;
    },
    [user, sections, books.length, apiFetch, applyServerCatalog, fetchDevVaultAndUsers]
  );

  const handleSelectBookDetails = useCallback((book: BookRecord) => {
    setViewedProfile(null);
    setSelectedSeriesId(null);
    setSelectedDetailBookId(book.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenSeries = useCallback((seriesId: string) => {
    setViewedProfile(null);
    setSelectedDetailBookId(null);
    setSelectedSeriesId(seriesId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenBook = useCallback(
    (book: BookRecord) => {
      const isOwnerPreview = Boolean(
        user && book.authorUid === user.uid && book.reviewStatus !== 'approved'
      );
      if (book.isComingSoon && !isDeveloperMode && !isOwnerPreview) {
        handleSelectBookDetails(book);
        return;
      }
      if (book.isPremium && !unlockedIds.includes(book.id) && !isDeveloperMode && !isOwnerPreview) {
        setUnlockModalTarget({
          id: book.id,
          label: book.title,
          kind: 'book',
          accessType: book.accessType,
        });
        return;
      }
      setActiveBook(book);
    },
    [user, isDeveloperMode, unlockedIds, handleSelectBookDetails]
  );

  const handleRequestThemeUnlock = useCallback(
    (themeId: ThemeId, themeName: string) => {
      const access = themeAccessMap[themeId];
      setUnlockModalTarget({
        id: themeId,
        label: themeName,
        kind: 'theme',
        accessType: access?.accessType ?? 'locked',
      });
    },
    [themeAccessMap]
  );

  const handleRequestIconUnlock = useCallback(
    (iconId: AppIconId, iconName: string) => {
      const access = iconAccessMap[iconId];
      setUnlockModalTarget({
        id: iconId,
        label: iconName,
        kind: 'icon',
        accessType: access?.accessType ?? 'locked',
      });
    },
    [iconAccessMap]
  );

  const libraryCatalogBooks = useMemo(
    () => books.filter((b) => b.reviewStatus !== 'rejected'),
    [books]
  );

  const approvedBooksForHome = useMemo(() => {
    const approved = libraryCatalogBooks.filter((b) => b.reviewStatus !== 'pending');
    return approved.length > 0 ? approved : libraryCatalogBooks;
  }, [libraryCatalogBooks]);

  const managedSections = useMemo(() => {
    return Array.from(
      new Set([
        ...sections,
        ...libraryCatalogBooks.map((b) => b.category.trim()).filter(Boolean),
      ])
    );
  }, [sections, libraryCatalogBooks]);

  const categories = useMemo(() => ['ALL', ...managedSections], [managedSections]);

  const pickRandomBookId = useCallback((list: BookRecord[], excludeId?: string | null): string | null => {
    if (list.length === 0) return null;
    if (list.length === 1) return list[0].id;
    const pool = excludeId ? list.filter((b) => b.id !== excludeId) : list;
    const source = pool.length > 0 ? pool : list;
    const idx = Math.floor(Math.random() * source.length);
    return source[idx]?.id ?? list[0].id;
  }, []);

  useEffect(() => {
    if (approvedBooksForHome.length === 0) {
      setFeaturedBookId(null);
      return;
    }
    setFeaturedBookId((prev) => {
      if (prev && approvedBooksForHome.some((b) => b.id === prev)) {
        return prev;
      }
      return pickRandomBookId(approvedBooksForHome);
    });
  }, [approvedBooksForHome, pickRandomBookId]);

  const selectedDetailBook = useMemo(
    () =>
      selectedDetailBookId
        ? books.find((b) => b.id === selectedDetailBookId) ??
          (isDeveloperMode
            ? devPendingSubmissions.find((b) => b.id === selectedDetailBookId) ?? null
            : null)
        : null,
    [books, selectedDetailBookId, isDeveloperMode, devPendingSubmissions]
  );

  const seriesCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of libraryCatalogBooks) {
      if (!b.seriesId) continue;
      counts.set(b.seriesId, (counts.get(b.seriesId) ?? 0) + 1);
    }
    return counts;
  }, [libraryCatalogBooks]);

  const detailBookSeriesBooks = useMemo(() => {
    const sid = selectedDetailBook?.seriesId;
    if (!sid) return [];
    const seen = new Set<string>();
    const combined: BookRecord[] = [];
    const pool = isDeveloperMode
      ? [...libraryCatalogBooks, ...devPendingSubmissions]
      : libraryCatalogBooks;
    for (const b of pool) {
      if (b.seriesId === sid && b.reviewStatus !== 'rejected' && !seen.has(b.id)) {
        seen.add(b.id);
        combined.push(b);
      }
    }
    return combined.sort((a, b) => (a.partNumber ?? 999) - (b.partNumber ?? 999));
  }, [selectedDetailBook?.seriesId, libraryCatalogBooks, devPendingSubmissions, isDeveloperMode]);

  const selectedSeriesBooks = useMemo(() => {
    if (!selectedSeriesId) return [];
    const seen = new Set<string>();
    const combined: BookRecord[] = [];
    const pool = isDeveloperMode
      ? [...libraryCatalogBooks, ...devPendingSubmissions]
      : libraryCatalogBooks;
    for (const b of pool) {
      if (b.seriesId === selectedSeriesId && b.reviewStatus !== 'rejected' && !seen.has(b.id)) {
        seen.add(b.id);
        combined.push(b);
      }
    }
    return combined.sort((a, b) => (a.partNumber ?? 999) - (b.partNumber ?? 999));
  }, [selectedSeriesId, libraryCatalogBooks, devPendingSubmissions, isDeveloperMode]);

  const pendingIncomingTradesCount = useMemo(() => {
    const myUid = currentUserAccount?.uid ?? user?.uid;
    if (!myUid) return 0;
    return tradeRequests.filter((r) => r.recipientUid === myUid && r.status === 'pending').length;
  }, [tradeRequests, currentUserAccount?.uid, user?.uid]);

  useEffect(() => {
    if (
      activeView !== 'home' ||
      activeBook ||
      selectedDetailBook ||
      selectedSeriesId ||
      approvedBooksForHome.length <= 1
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setFeaturedBookId((prevId) => pickRandomBookId(approvedBooksForHome, prevId));
    }, 12000);
    return () => window.clearInterval(timer);
  }, [activeView, activeBook, selectedDetailBook, selectedSeriesId, approvedBooksForHome, pickRandomBookId]);

  const featuredBook = useMemo(() => {
    if (approvedBooksForHome.length === 0) return null;
    return approvedBooksForHome.find((b) => b.id === featuredBookId) ?? approvedBooksForHome[0];
  }, [approvedBooksForHome, featuredBookId]);

  useEffect(() => {
    setHeroImgFailed(false);
  }, [featuredBook?.id]);

  const premiumBooks = useMemo(
    () => libraryCatalogBooks.filter((b) => Boolean(b.isPremium)),
    [libraryCatalogBooks]
  );

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return libraryCatalogBooks.filter((book) => {
      const matchesCategory =
        selectedCategory === 'ALL' || book.category === selectedCategory;
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.synopsis.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [libraryCatalogBooks, selectedCategory, searchQuery]);

  const inProgressBooks = useMemo(
    () =>
      libraryCatalogBooks
        .filter((b) => Boolean(progressMap[b.id]) && (!b.isPremium || unlockedIds.includes(b.id)))
        .sort((a, b) =>
          (progressMap[b.id]?.lastReadAt ?? '').localeCompare(
            progressMap[a.id]?.lastReadAt ?? ''
          )
        ),
    [libraryCatalogBooks, progressMap, unlockedIds]
  );

  const navigateTo = useCallback(
    (
      view:
        | 'home'
        | 'catalog'
        | 'premium'
        | 'reading'
        | 'you'
        | 'settings'
        | 'developer'
        | 'notifications'
    ) => {
      if (view === 'developer' && !isDeveloperMode) return;
      if (view !== 'developer' && isDeveloperMode) {
        setIsDeveloperMode(false);
      }
      if (view === 'home' && approvedBooksForHome.length > 1) {
        setFeaturedBookId((prevId) => pickRandomBookId(approvedBooksForHome, prevId));
      }
      setViewedProfile(null);
      setSelectedDetailBookId(null);
      setSelectedSeriesId(null);
      setActiveView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [isDeveloperMode, approvedBooksForHome, pickRandomBookId]
  );

  const handleNotificationNavigate = useCallback(
    (item: UserNotificationItem) => {
      const validViews = new Set([
        'home',
        'catalog',
        'premium',
        'reading',
        'you',
        'settings',
      ]);
      if (item.type === 'book_submission_rejected') {
        navigateTo('you');
        const sectionId = item.targetSection || 'publish-studio';
        window.setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 160);
        return;
      }
      if (item.targetBookId) {
        const matchedBook = books.find((b) => b.id === item.targetBookId);
        if (matchedBook) {
          handleSelectBookDetails(matchedBook);
          return;
        }
      }
      if (item.targetView && validViews.has(item.targetView)) {
        navigateTo(
          item.targetView as 'home' | 'catalog' | 'premium' | 'reading' | 'you' | 'settings'
        );
        if (item.targetSection) {
          const sectionId = item.targetSection;
          window.setTimeout(() => {
            document
              .getElementById(sectionId)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 160);
        }
        return;
      }
      if (item.targetUserUid) {
        void handleOpenUserProfile(item.targetUserUid);
        return;
      }
      if (item.type === 'premium') {
        navigateTo('premium');
        return;
      }
      navigateTo('you');
    },
    [books, handleOpenUserProfile, handleSelectBookDetails, navigateTo]
  );

  useEffect(() => {
    if (!isDeveloperMode && activeView === 'developer') {
      setActiveView('settings');
    }
  }, [isDeveloperMode, activeView]);

  useEffect(() => {
    const touchLastActive = () => {
      try {
        localStorage.setItem(SPLASH_LAST_ACTIVE_KEY, String(Date.now()));
      } catch {
        // ignore storage errors
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        touchLastActive();
      }
    };
    const timer = window.setInterval(touchLastActive, 30_000);
    window.addEventListener('pagehide', touchLastActive);
    window.addEventListener('beforeunload', touchLastActive);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', touchLastActive);
      window.removeEventListener('beforeunload', touchLastActive);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const ownedPremiumBooksList = useMemo(
    () =>
      books.filter(
        (b) =>
          Boolean(b.isPremium) &&
          (unlockedIds.includes(b.id) || purchasedIds.includes(b.id) || b.isUnlocked)
      ),
    [books, unlockedIds, purchasedIds]
  );

  const ownedPremiumThemesList = useMemo(
    () =>
      PREMIUM_THEMES.filter(
        (t) =>
          unlockedIds.includes(t.id) ||
          purchasedIds.includes(t.id) ||
          Boolean(themeAccessMap[t.id]?.isUnlocked)
      ),
    [unlockedIds, purchasedIds, themeAccessMap]
  );

  const giftInitialItem = useMemo(() => {
    if (!giftModalState.targetType || !giftModalState.targetId) return null;
    const tType = giftModalState.targetType;
    const tId = giftModalState.targetId;
    const label =
      tType === 'book'
        ? books.find((b) => b.id === tId)?.title ?? tId
        : (() => {
            const th = PREMIUM_THEMES.find((t) => t.id === tId);
            return th ? (isEn ? th.nameEn : th.name) : tId;
          })();
    const isOwned =
      tType === 'book'
        ? ownedPremiumBooksList.some((b) => b.id === tId)
        : ownedPremiumThemesList.some((t) => t.id === tId);
    return {
      targetType: tType,
      targetId: tId,
      label,
      isOwned,
    };
  }, [
    giftModalState.targetType,
    giftModalState.targetId,
    books,
    isEn,
    ownedPremiumBooksList,
    ownedPremiumThemesList,
  ]);

  const unlockModalPricing = useMemo(() => {
    if (!unlockModalTarget) {
      return { finalPrice: 0, basePrice: 0, discountPercent: null as number | null };
    }
    if (unlockModalTarget.kind === 'book') {
      const targetBook = books.find((b) => b.id === unlockModalTarget.id);
      if (!targetBook) {
        return {
          finalPrice: economyConfig.defaultPremiumBookPrice,
          basePrice: economyConfig.defaultPremiumBookPrice,
          discountPercent: null as number | null,
        };
      }
      const p = getEffectiveBookPricing(targetBook, economyConfig.defaultPremiumBookPrice);
      return {
        finalPrice: p.finalPrice,
        basePrice: p.basePrice,
        discountPercent: p.hasDiscount ? p.discountPercent : null,
      };
    }
    if (unlockModalTarget.kind === 'icon') {
      const ia = iconAccessMap[unlockModalTarget.id];
      const iconDef = PREMIUM_APP_ICONS.find((ic) => ic.id === unlockModalTarget.id);
      const price =
        ia?.effectiveTokenPrice ??
        ia?.tokenPrice ??
        iconDef?.tokenPriceOverride ??
        economyConfig.defaultPremiumIconPrice ??
        50;
      return { finalPrice: price, basePrice: price, discountPercent: null as number | null };
    }
    const ta = themeAccessMap[unlockModalTarget.id];
    const themeDef = PREMIUM_THEMES.find((t) => t.id === unlockModalTarget.id);
    const price =
      ta?.effectiveTokenPrice ??
      ta?.tokenPrice ??
      themeDef?.tokenPriceOverride ??
      economyConfig.defaultPremiumThemePrice;
    return { finalPrice: price, basePrice: price, discountPercent: null as number | null };
  }, [unlockModalTarget, books, themeAccessMap, iconAccessMap, economyConfig]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return (
      <SplashLoader
        durationMs={splashDurationMs}
        lang={lang}
        onComplete={handleSplashComplete}
      />
    );
  }

  if (activeBook) {
    if (activeBook.bookType === 'pdf' || activeBook.bookType === 'word') {
      return (
        <>
          <Suspense fallback={<LazyViewFallback lang={lang} fullScreen />}>
            <PdfFlipBookReader
              book={activeBook}
              initialProgress={progressMap[activeBook.id]}
              autoSaveProgress={appSettings.autoSaveProgress}
              lang={lang}
              fetchDocumentBuffer={fetchDocumentBuffer}
              onSaveProgress={(p) => void handleSaveProgress(p)}
              onRateBook={(b) => setRateModalState({ open: true, book: b })}
              onClose={() => setActiveBook(null)}
            />
          </Suspense>
          <Suspense fallback={null}>
            <InAppBookRatingModal
              open={rateModalState.open}
              initialBook={rateModalState.book}
              books={libraryCatalogBooks}
              currentUserUid={user?.uid ?? null}
              isAuthenticated={isSignedIn}
              economyConfig={economyConfig}
              lang={lang}
              onSignIn={handleSignIn}
              onSubmitReview={handleSubmitBookReview}
              onClose={() => setRateModalState({ open: false, book: null })}
            />
          </Suspense>
          <OfflineIndicator lang={lang} />
        </>
      );
    }

    return (
      <>
        <Suspense fallback={<LazyViewFallback lang={lang} fullScreen />}>
          <BookReader
            book={activeBook}
            appSettings={appSettings}
            sectionTranslations={sectionTranslations}
            initialProgress={progressMap[activeBook.id]}
            onSaveProgress={(p) => void handleSaveProgress(p)}
            onRateBook={(b) => setRateModalState({ open: true, book: b })}
            onClose={() => setActiveBook(null)}
          />
        </Suspense>
        <Suspense fallback={null}>
          <InAppBookRatingModal
            open={rateModalState.open}
            initialBook={rateModalState.book}
            books={libraryCatalogBooks}
            currentUserUid={user?.uid ?? null}
            isAuthenticated={isSignedIn}
            economyConfig={economyConfig}
            lang={lang}
            onSignIn={handleSignIn}
            onSubmitReview={handleSubmitBookReview}
            onClose={() => setRateModalState({ open: false, book: null })}
          />
        </Suspense>
        <OfflineIndicator lang={lang} />
      </>
    );
  }

  return (
    <div className="app-canvas-bg flex min-h-screen flex-col text-[var(--text-ink)] transition-colors duration-200">
      <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3 sm:gap-x-4 sm:px-6 xl:flex-nowrap lg:px-8">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`group inline-flex items-baseline gap-2 font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-ink)] whitespace-nowrap shrink-0 transition-colors ${
              appSettings.themeId === 'golden-king' ? 'hover:text-[#D4AF37]' : ''
            }`}
          >
            {appSettings.themeId === 'golden-king' ? (
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 sm:h-9 sm:w-9 self-center items-center justify-center rounded-md border border-[#D4AF37]/70 bg-[#050505] text-[#D4AF37] transition-transform duration-200 group-hover:scale-105"
              >
                <MaktabtyLogo className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
            ) : (
              <MaktabtyLogo className="h-6 w-6 sm:h-7 sm:w-7 self-center text-[var(--accent-primary)] transition-colors group-hover:text-[var(--text-ink)]" />
            )}
            <span>{copy.brandShort}</span>
            <span
              dir="ltr"
              className="hidden lg:inline font-mono-tabular text-xs font-semibold tracking-wider text-[var(--accent-primary)]"
            >
              {copy.brandFranco}
            </span>
          </button>

          <nav
            aria-label={isEn ? 'Main Navigation' : 'التنقل الرئيسي'}
            className="order-3 flex w-full flex-wrap items-center justify-center gap-1 border-t border-[var(--border-hairline)] pt-2 text-xs font-medium text-[var(--text-muted)] sm:justify-start xl:order-2 xl:w-auto xl:flex-nowrap xl:border-t-0 xl:pt-0 xl:text-sm"
          >
            <button
              type="button"
              onClick={() => navigateTo('home')}
              aria-current={activeView === 'home' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'home'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-ink)] font-semibold border border-[var(--border-hairline)]'
                  : 'hover:text-[var(--text-ink)]'
              }`}
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.navHome}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('catalog')}
              aria-current={activeView === 'catalog' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'catalog'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-ink)] font-semibold border border-[var(--border-hairline)]'
                  : 'hover:text-[var(--text-ink)]'
              }`}
            >
              <Library className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.navCatalog}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('premium')}
              onMouseEnter={() => void loadPremiumSection()}
              onFocus={() => void loadPremiumSection()}
              aria-current={activeView === 'premium' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'premium'
                  ? 'bg-amber-500/15 text-amber-500 font-semibold border border-amber-500/40'
                  : 'hover:text-amber-500'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.navPremium}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('reading')}
              aria-current={activeView === 'reading' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'reading'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-ink)] font-semibold border border-[var(--border-hairline)]'
                  : 'hover:text-[var(--text-ink)]'
              }`}
            >
              <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.navMyReading}
              {inProgressBooks.length > 0 && (
                <span className="font-mono-tabular text-[11px] text-[var(--accent-primary)]">
                  ({inProgressBooks.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('you')}
              onMouseEnter={() => void loadYouPage()}
              onFocus={() => void loadYouPage()}
              aria-current={activeView === 'you' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'you'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-ink)] font-semibold border border-[var(--border-hairline)]'
                  : 'hover:text-[var(--text-ink)]'
              }`}
            >
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.navYou}
              {pendingIncomingTradesCount > 0 && (
                <span className="font-mono-tabular text-[11px] font-bold text-amber-500">
                  ({pendingIncomingTradesCount})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('settings')}
              onMouseEnter={() => void loadSettingsPanel()}
              onFocus={() => void loadSettingsPanel()}
              aria-current={activeView === 'settings' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'settings'
                  ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] font-semibold border border-[var(--border-hairline)]'
                  : 'hover:text-[var(--text-ink)]'
              }`}
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.navSettings}
            </button>

            {isDeveloperMode && (
              <button
                type="button"
                onClick={() => navigateTo('developer')}
                onMouseEnter={() => void loadSettingsPanel()}
                onFocus={() => void loadSettingsPanel()}
                aria-current={activeView === 'developer' ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'developer'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] font-semibold border border-[var(--border-hairline)]'
                    : 'hover:text-[var(--text-ink)]'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.navDeveloperSettings}
              </button>
            )}
          </nav>

          <div className="order-2 flex items-center gap-1.5 sm:gap-2 shrink-0 xl:order-3">
            {user && (
              <button
                type="button"
                onClick={() => {
                  navigateTo('you');
                  window.setTimeout(() => {
                    document
                      .getElementById('token-wallet')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 150);
                }}
                title={isEn ? 'Golden Tokens Balance' : 'رصيد العملات الذهبية'}
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/45 bg-amber-500/12 px-2 py-1 text-xs font-extrabold text-amber-500 transition-colors hover:border-amber-500 hover:bg-amber-500/20 font-mono-tabular whitespace-nowrap shrink-0"
              >
                <TokenIcon className="h-3.5 w-3.5" />
                <span>{currentUserAccount?.tokensBalance ?? 0}</span>
              </button>
            )}
            <NotificationsMenu
              notifications={notifications}
              unreadCount={unreadNotificationsCount}
              isAuthenticated={isSignedIn}
              lang={lang}
              onSignIn={handleSignIn}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onSeeAll={() => navigateTo('notifications')}
              onNavigateTarget={handleNotificationNavigate}
            />
            {user && (activeView !== 'you' || Boolean(selectedDetailBook)) && (
              <button
                type="button"
                onClick={() => navigateTo('you')}
                title={
                  currentUserAccount?.displayName ||
                  user.displayName ||
                  user.email?.split('@')[0] ||
                  (isEn ? 'Reader' : 'قارئ')
                }
                className="group inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-1.5 py-1 sm:px-2 text-xs transition-colors hover:border-[var(--accent-primary)] whitespace-nowrap shrink-0"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] text-[var(--accent-primary)]"
                >
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="hidden lg:inline max-w-[110px] truncate text-xs font-bold text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]">
                  {currentUserAccount?.displayName ||
                    user.displayName ||
                    user.email?.split('@')[0] ||
                    (isEn ? 'Reader' : 'قارئ')}
                </span>
                {currentUserAccount?.isVerified && (
                  <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
                )}
              </button>
            )}
            {!user && (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isEn ? 'Sign in' : 'دخول'}</span>
              </button>
            )}
            <PWAInstallButton lang={lang} onBrowseLibrary={() => navigateTo('catalog')} />
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {!user && activeView !== 'settings' && activeView !== 'developer' && (
          <div className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-2.5 text-xs lg:px-8">
              <p className="text-[var(--text-muted)]">
                {isEn
                  ? 'Sign in with Google to receive live database updates from all devices and activate premium items with 10-digit codes.'
                  : 'سجّل الدخول بحساب Google لاستقبال أحدث الكتب المضافة للجميع تلقائياً وتفعيل المحتوى البريميوم بالأكواد.'}
              </p>
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="inline-flex items-center gap-1.5 rounded bg-[var(--accent-primary)] px-3 py-1 font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                {isEn ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}
              </button>
            </div>
          </div>
        )}

        {viewedProfile ? (
          <Suspense fallback={<LazyViewFallback lang={lang} />}>
            <YouPage
              user={effectiveUser}
              userAccount={currentUserAccount}
              viewedProfile={viewedProfile}
              books={books}
              progressMap={progressMap}
              unlockedIds={unlockedIds}
              purchasedIds={purchasedIds}
              themeAccessMap={themeAccessMap}
              activeThemeId={appSettings.themeId}
              lang={lang}
              sectionTranslations={sectionTranslations}
              onSignIn={handleSignIn}
              onRequestSignOut={() => setShowSignOutConfirm(true)}
              onOpenBook={handleSelectBookDetails}
              onApplyTheme={(themeId: ThemeId) =>
                void handleUpdateSettings({ ...appSettings, themeId })
              }
              onNavigate={(view) => navigateTo(view)}
              onClosePublicProfile={() => {
                setViewedProfile(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onToggleFollow={handleToggleFollowUser}
              onOpenGiftModal={(opts) => void handleOpenGiftModal(opts)}
              economyConfig={economyConfig}
              tokenTransactions={tokenTransactions}
            />
          </Suspense>
        ) : selectedDetailBook ? (
          <Suspense fallback={<LazyViewFallback lang={lang} />}>
            <BookDetailPage
              book={selectedDetailBook}
              progress={progressMap[selectedDetailBook.id]}
              isUnlocked={
                !selectedDetailBook.isPremium ||
                unlockedIds.includes(selectedDetailBook.id) ||
                isDeveloperMode ||
                Boolean(
                  user &&
                    selectedDetailBook.authorUid === user.uid &&
                    selectedDetailBook.reviewStatus !== 'approved'
                )
              }
              lang={lang}
              sectionTranslations={sectionTranslations}
              currentUserUid={user?.uid ?? null}
              seriesBooks={detailBookSeriesBooks}
              onBack={() => {
                setSelectedDetailBookId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onStartReading={handleOpenBook}
              onOpenSeries={handleOpenSeries}
              onSelectBook={handleSelectBookDetails}
              onOpenAuthorProfile={(uid) => void handleOpenUserProfile(uid)}
              onToggleFollowAuthor={handleToggleFollowUser}
              onToggleReviewLike={handleToggleReviewLike}
              onGiftBook={(b) =>
                void handleOpenGiftModal({ targetType: 'book', targetId: b.id })
              }
              onToggleNotifyMe={(bookId) => void handleToggleComingSoonNotify(bookId)}
              onPreorderBook={handlePreorderBook}
              economyConfig={economyConfig}
              isAuthenticated={isSignedIn}
              onSubmitReview={handleSubmitBookReview}
              onSignIn={handleSignIn}
              onRequestPriceChange={handleRequestBookPriceChange}
              onUpdateBookDiscount={handleUpdateBookDiscount}
            />
          </Suspense>
        ) : selectedSeriesId && selectedSeriesBooks.length > 0 ? (
          <Suspense fallback={<LazyViewFallback lang={lang} />}>
            <SeriesPage
              seriesId={selectedSeriesId}
              seriesBooks={selectedSeriesBooks}
              progressMap={progressMap}
              unlockedIds={unlockedIds}
              isDeveloperMode={isDeveloperMode}
              currentUserUid={user?.uid ?? null}
              defaultPremiumBookPrice={economyConfig.defaultPremiumBookPrice}
              lang={lang}
              sectionTranslations={sectionTranslations}
              onBack={() => {
                setSelectedSeriesId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectBook={handleSelectBookDetails}
              onStartReading={handleOpenBook}
              onGiftBook={(b) =>
                void handleOpenGiftModal({ targetType: 'book', targetId: b.id })
              }
              onToggleNotifyMe={(bookId) => void handleToggleComingSoonNotify(bookId)}
              onPreorderBook={handlePreorderBook}
            />
          </Suspense>
        ) : (
          <>
            {(activeView === 'settings' || (activeView === 'developer' && isDeveloperMode)) && (
              <Suspense fallback={<LazyViewFallback lang={lang} />}>
                <SettingsPanel
                  sectionMode={activeView === 'developer' && isDeveloperMode ? 'developer' : 'settings'}
                  onOpenDeveloperSettings={() => navigateTo('developer')}
                  settings={appSettings}
                  onUpdateSettings={(next) => void handleUpdateSettings(next)}
                  books={books}
                  sections={managedSections}
                  sectionTranslations={sectionTranslations}
                  unlockedIds={unlockedIds}
                  purchasedIds={purchasedIds}
                  customThemeCodes={customThemeCodes}
                  isAuthenticated={isSignedIn}
                  currentUserUid={user?.uid ?? null}
                  userEmail={user?.email}
                  onSignIn={handleSignIn}
                  onSaveCustomThemeCode={handleSaveCustomThemeCode}
                  onUnlockByCode={handleUnlockByCode}
                  onRequestThemeUnlock={handleRequestThemeUnlock}
                  onRequestIconUnlock={handleRequestIconUnlock}
                  onGiftTheme={(themeId) =>
                    void handleOpenGiftModal({ targetType: 'theme', targetId: themeId })
                  }
                  isDeveloperMode={isDeveloperMode}
                  onUnlockDeveloper={handleUnlockDeveloper}
                  onLockDeveloper={() => {
                    setIsDeveloperMode(false);
                    setActiveView((prev) => (prev === 'developer' ? 'settings' : prev));
                  }}
                  devCodesVault={devCodesVault}
                  devUsersList={devUsersList}
                  onRotateCode={handleRotateCode}
                  onRotateAllCodes={handleRotateAllCodes}
                  onGrantPermanentAccess={handleGrantPermanentAccess}
                  onRevokePermanentAccess={handleRevokePermanentAccess}
                  onSetUserVerified={handleSetUserVerified}
                  onToggleBookAuthorVerified={handleToggleBookAuthorVerified}
                  onAssignBookOwner={handleAssignBookOwner}
                  onSaveBook={handleSaveBook}
                  onDeleteBook={handleDeleteBook}
                  onAddSection={handleAddSection}
                  onRenameSection={handleRenameSection}
                  onDeleteSection={handleDeleteSection}
                  onAssignBookSection={handleAssignBookSection}
                  onAddBookReview={handleAddBookReview}
                  onUpdateBookReview={handleUpdateBookReview}
                  onDeleteBookReview={handleDeleteBookReview}
                  onImportCatalog={handleImportCatalog}
                  onCheckUpdates={() => runSync(false)}
                  onResetServerCatalog={handleResetServerCatalog}
                  onClearProgress={handleClearProgress}
                  syncReport={syncReport}
                  localRecoverable={localRecoverable}
                  onScanLocalRecoverable={handleScanLocalRecoverable}
                  onMigrateLocalBooks={handleMigrateLocalBooks}
                  onRestoreOrphanDocument={handleRestoreOrphanDocument}
                  onBackToLibrary={() => navigateTo('catalog')}
                  devPendingSubmissions={devPendingSubmissions}
                  onReviewSubmission={handleReviewSubmission}
                  devPendingPriceRequests={devPendingPriceRequests}
                  onReviewPriceRequest={handleReviewPriceRequest}
                  devPendingReviews={devPendingReviews}
                  onModerateReview={handleModerateReview}
                  onPreviewSubmission={(b) => handleSelectBookDetails(b)}
                  onBroadcastFeatureAnnouncement={handleBroadcastFeatureAnnouncement}
                  economyConfig={economyConfig}
                  themeAccessMap={themeAccessMap}
                  iconAccessMap={iconAccessMap}
                  onUpdateEconomyConfig={handleUpdateEconomyConfig}
                  onSetItemTokenPrice={handleSetItemTokenPrice}
                  onAdjustUserTokens={handleAdjustUserTokens}
                />
              </Suspense>
            )}

            {activeView === 'home' && (
          <section id="featured" className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-[var(--bg-surface-alt)]" />
                  <div className="h-12 w-3/4 animate-pulse rounded bg-[var(--bg-surface-alt)]" />
                  <div className="h-24 w-full animate-pulse rounded bg-[var(--bg-surface-alt)]" />
                </div>
                <div className="lg:col-span-5 aspect-[3/4] max-h-[460px] animate-pulse rounded bg-[var(--bg-surface-alt)]" />
              </div>
            ) : featuredBook ? (
              <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
                <div className="flex flex-col justify-between lg:col-span-7">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--accent-primary)]">
                        {isEn ? 'Suggested Pick' : 'اقتراح عشوائي'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {getSectionDisplayName(featuredBook.category, lang, sectionTranslations)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {copy.versionLabel}
                        {isEn ? '' : ' '}
                        {featuredBook.version}
                      </span>
                      {featuredBook.isPremium && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-500">
                            {copy.premiumLabel}
                          </span>
                        </>
                      )}
                      {featuredBook.isComingSoon && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-500">
                            <Bell className="h-3 w-3" aria-hidden="true" />
                            {isEn ? 'Coming Soon' : 'قريباً (Coming Soon)'}
                          </span>
                        </>
                      )}
                      {approvedBooksForHome.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFeaturedBookId((prevId) =>
                              pickRandomBookId(approvedBooksForHome, prevId)
                            )
                          }
                          className="ms-1 inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                          title={isEn ? 'Show another random book' : 'اقتراح كتاب عشوائي آخر'}
                        >
                          <Shuffle className="h-3 w-3" aria-hidden="true" />
                          <span>{isEn ? 'Another pick' : 'اقتراح آخر'}</span>
                        </button>
                      )}
                    </div>

                    <h1 className="mt-4 font-editorial text-4xl font-bold leading-tight text-[var(--text-ink)] sm:text-5xl [text-wrap:balance]">
                      {featuredBook.title}
                    </h1>

                    <p className="mt-3 text-lg font-medium text-[var(--text-muted)]">
                      {featuredBook.subtitle}
                    </p>

                    <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
                      {featuredBook.synopsis}
                    </p>
                    {!featuredBook.isComingSoon && (
                      <div className="mt-5 flex items-center gap-3">
                        <StarRatingDisplay rating={getBookRating(featuredBook)} lang={lang} />
                        <span className="text-xs text-[var(--text-muted)]">{copy.readersRating}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 border-t border-[var(--border-hairline)] pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-ink)]">
                          <span>{featuredBook.author}</span>
                          {featuredBook.isAuthorVerified && (
                            <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
                          )}
                        </span>
                        <span className="mx-2 opacity-50" aria-hidden="true">
                          ·
                        </span>
                        <span className="tabular-nums">
                          {featuredBook.isComingSoon
                            ? formatComingSoonReleaseLabel(featuredBook, lang) ??
                              (isEn ? 'Coming Soon' : 'قريباً — لم يحدد موعد النشر بعد')
                            : featuredBook.bookType === 'pdf' || featuredBook.bookType === 'word'
                              ? `${featuredBook.pdfPageCount ?? featuredBook.pages} ${
                                  featuredBook.bookType === 'word' ? 'Word' : 'PDF'
                                } ${copy.pagesUnit}`
                              : `${featuredBook.chapters.length} ${copy.chaptersWord} · ${featuredBook.readingMinutes} ${copy.readingMinutesWord}`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {featuredBook.isComingSoon ? (
                          <>
                            {featuredBook.isPremium &&
                              !(user?.uid && featuredBook.authorUid === user.uid) &&
                              (() => {
                                const heroPricing = getEffectiveBookPricing(
                                  featuredBook,
                                  economyConfig.defaultPremiumBookPrice
                                );
                                if (heroPricing.finalPrice <= 0) return null;
                                const isAlreadyPreordered =
                                  Boolean(featuredBook.isPreordered) ||
                                  unlockedIds.includes(featuredBook.id);
                                return isAlreadyPreordered ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/60 bg-emerald-500/15 px-4 py-2.5 text-sm font-bold text-emerald-500">
                                    <Check className="h-4 w-4" aria-hidden="true" />
                                    <span>{isEn ? 'Pre-Ordered ✓' : 'تم الطلب المسبق ✓'}</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectBookDetails(featuredBook)}
                                    className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
                                  >
                                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                                    <span>{isEn ? 'Pre-Order' : 'طلب مسبق'}</span>
                                    {heroPricing.hasDiscount && (
                                      <span
                                        dir="ltr"
                                        className="relative inline-flex items-center font-mono-tabular text-xs font-bold text-stone-900/70"
                                      >
                                        <span>{heroPricing.basePrice}</span>
                                        <span
                                          aria-hidden="true"
                                          className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-[2px] -translate-y-1/2 -rotate-12 bg-rose-700"
                                        />
                                      </span>
                                    )}
                                    <TokenIcon className="h-4 w-4" />
                                    <span dir="ltr" className="font-mono-tabular font-extrabold">
                                      {heroPricing.finalPrice}
                                    </span>
                                  </button>
                                );
                              })()}

                            <button
                              type="button"
                              onClick={() => void handleToggleComingSoonNotify(featuredBook.id)}
                              className={`inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                featuredBook.isNotifySubscribed
                                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20'
                                  : featuredBook.isPremium
                                    ? 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-ink)] hover:border-[var(--accent-primary)]'
                                    : 'border-amber-500/60 bg-amber-500 text-stone-950 hover:bg-amber-400'
                              }`}
                            >
                              {featuredBook.isNotifySubscribed ? (
                                <>
                                  <BellRing className="h-4 w-4" aria-hidden="true" />
                                  <span>
                                    {isEn ? 'Notification Enabled ✓' : 'سيتم إشعارك عند النشر ✓'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Bell className="h-4 w-4" aria-hidden="true" />
                                  <span>{isEn ? 'Notify Me' : 'ذكّرني عند النشر'}</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <>
                            {featuredBook.isPremium && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleOpenGiftModal({
                                    targetType: 'book',
                                    targetId: featuredBook.id,
                                  })
                                }
                                title={isEn ? 'Gift or trade with a friend' : 'إهداء أو تبديل لصديق'}
                                aria-label={
                                  isEn
                                    ? `Gift or trade ${featuredBook.title}`
                                    : `إهداء أو تبديل ${featuredBook.title}`
                                }
                                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-amber-500/55 bg-amber-500/12 text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 shrink-0"
                              >
                                <Gift className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                            <RateBookButton
                              bookTitle={featuredBook.title}
                              lang={lang}
                              onRate={() => setRateModalState({ open: true, book: featuredBook })}
                            />
                            <button
                              type="button"
                              onClick={() => handleSelectBookDetails(featuredBook)}
                              className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-5 py-2.5 text-sm font-medium text-[var(--btn-dark-fg)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
                            >
                              {featuredBook.isPremium && !unlockedIds.includes(featuredBook.id) ? (
                                <Lock className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <BookOpen className="h-4 w-4" aria-hidden="true" />
                              )}
                              {featuredBook.isPremium && !unlockedIds.includes(featuredBook.id)
                                ? isEn
                                  ? 'Unlock & Read'
                                  : 'تفعيل بكود والقراءة'
                                : progressMap[featuredBook.id]
                                  ? copy.continueReadingBtn
                                  : copy.startReadingBtn}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <button
                    type="button"
                    onClick={() => handleSelectBookDetails(featuredBook)}
                    className={`group relative block h-full w-full overflow-hidden rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] ${
                      isEn ? 'text-left' : 'text-right'
                    }`}
                  >
                    {isBookNew(featuredBook) && (
                      <span className="pointer-events-none absolute top-3 start-3 z-20 inline-flex items-center rounded-sm border border-white/25 bg-[var(--accent-primary)] px-3 py-1 text-xs font-bold tracking-wide text-[var(--accent-fg)] shadow-md">
                        {copy.newBadge}
                      </span>
                    )}
                    {featuredBook.isPremium && (
                      <span className="pointer-events-none absolute top-3 end-3 z-20 inline-flex items-center rounded-md border border-amber-300/60 bg-amber-500 px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-stone-950 shadow-md">
                        VIP
                      </span>
                    )}
                    {featuredBook.coverUrl && !heroImgFailed ? (
                      <img
                        src={featuredBook.coverUrl}
                        alt={isEn ? `${featuredBook.title} cover` : `غلاف كتاب ${featuredBook.title}`}
                        referrerPolicy="no-referrer"
                        onError={() => setHeroImgFailed(true)}
                        className="h-full max-h-[480px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                      />
                    ) : (
                      <div className="flex h-full min-h-[360px] flex-col items-center justify-center bg-[var(--bg-surface-alt)] p-8 text-center">
                        <BookOpen
                          className="mb-3 h-10 w-10 text-[var(--text-muted)]"
                          aria-hidden="true"
                        />
                        <span className="font-editorial text-2xl font-bold">
                          {featuredBook.title}
                        </span>
                      </div>
                    )}

                    {featuredBook.isComingSoon && (
                      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-950/60 px-4 text-center backdrop-blur-[2px]">
                        <span className="rounded-md border border-amber-400/70 bg-stone-950/85 px-4 py-1.5 text-sm font-extrabold uppercase tracking-widest text-amber-400 shadow-xl">
                          Coming Soon
                        </span>
                        {formatComingSoonReleaseLabel(featuredBook, lang) && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-stone-950/80 px-2.5 py-1 text-xs font-semibold text-white">
                            <Calendar className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                            <span>{formatComingSoonReleaseLabel(featuredBook, lang)}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {!featuredBook.isComingSoon &&
                      featuredBook.isPremium &&
                      !unlockedIds.includes(featuredBook.id) && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-stone-950/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/70 bg-stone-950/90 text-amber-400 shadow-2xl">
                            <Lock className="h-6 w-6" aria-hidden="true" />
                          </span>
                        </div>
                      )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] px-8 py-14 text-center">
                <BookOpen
                  className="mx-auto h-11 w-11 text-[var(--accent-primary)]"
                  aria-hidden="true"
                />
                <h1 className="mt-4 font-editorial text-3xl font-bold text-[var(--text-ink)]">
                  {isEn ? 'Your Library Is Ready for Your Books' : 'مكتبتك جاهزة لإضافة كتبك الخاصة'}
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--text-muted)]">
                  {isEn
                    ? 'All sample books have been removed. Open Developer Mode in Settings to add your own books (Text, PDF, or Word) or scan and restore any books or files stored locally in this browser.'
                    : 'تمت إزالة الكتب الافتراضية بالكامل. يمكنك الدخول إلى وضع المطور في الإعدادات لإضافة كتبك الخاصة (نص أو PDF أو Word) أو فحص واستعادة الكتب والملفات المحفوظة محلياً في هذا المتصفح.'}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('settings')}
                    className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    {isEn ? 'Open Developer Mode & Add Books' : 'فتح وضع المطور وإضافة أو استعادة الكتب'}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--border-hairline)] py-3 text-xs text-[var(--text-muted)]">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  {copy.modeLabel} {isDeveloperMode ? copy.modeDev : copy.modeReader}
                </span>
                <span aria-hidden="true">·</span>
                <span>{copy.localSaveLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{copy.autoUpdateLabel}</span>
              </div>
              <span className="font-mono-tabular">
                {libraryCatalogBooks.length} {copy.offlineCountSuffix}
              </span>
            </div>

            {/* Dedicated Pages Directory Cards */}
            <div className="mt-10">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {copy.pageQuickLinksTitle}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => navigateTo('catalog')}
                  className={`group rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 ${
                    isEn ? 'text-left' : 'text-right'
                  } transition-colors hover:border-[var(--accent-primary)]`}
                >
                  <div className="flex items-center justify-between">
                    <Library className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
                    <span className="font-mono-tabular text-xs font-semibold text-[var(--text-muted)]">
                      {libraryCatalogBooks.length}
                    </span>
                  </div>
                  <p className="mt-3 font-editorial text-xl font-bold text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]">
                    {copy.navCatalog}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{copy.catalogSubtitle}</p>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('premium')}
                  className={`group rounded-lg border border-amber-500/35 bg-[var(--bg-surface)] p-5 ${
                    isEn ? 'text-left' : 'text-right'
                  } transition-colors hover:border-amber-500 hover:bg-amber-500/[0.06]`}
                >
                  <div className="flex items-center justify-between">
                    <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    <span className="font-mono-tabular text-xs font-semibold text-amber-500">
                      {premiumBooks.length}
                    </span>
                  </div>
                  <p className="mt-3 font-editorial text-xl font-bold text-[var(--text-ink)] group-hover:text-amber-500">
                    {copy.navPremium}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {isEn
                      ? 'VIP books and luxury themes unlocked with 10-digit codes.'
                      : 'الكتب والخلفيات البريميوم المفتوحة بأكواد الـ 10 أرقام.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('reading')}
                  className={`group rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 ${
                    isEn ? 'text-left' : 'text-right'
                  } transition-colors hover:border-[var(--accent-primary)]`}
                >
                  <div className="flex items-center justify-between">
                    <BookMarked className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
                    <span className="font-mono-tabular text-xs font-semibold text-[var(--text-muted)]">
                      {inProgressBooks.length}
                    </span>
                  </div>
                  <p className="mt-3 font-editorial text-xl font-bold text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]">
                    {copy.navMyReading}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {copy.continueSectionSubtitle}
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Sections Directory on Home */}
            {managedSections.length > 0 && (
              <div className="mt-10 border-t border-[var(--border-hairline)] pt-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {copy.sectionsBrowseTitle}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {managedSections.map((sec) => {
                    const count = libraryCatalogBooks.filter((b) => b.category === sec).length;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(sec);
                          navigateTo('catalog');
                        }}
                        className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                      >
                        <span>
                          {formatSectionHeading(sec, lang, sectionTranslations)}
                        </span>
                        <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {activeView === 'catalog' && (
          <section id="catalog" className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
            <div className="flex flex-col gap-6 border-b border-[var(--border-hairline)] pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-editorial text-3xl font-bold text-[var(--text-ink)] sm:text-4xl">
                  {copy.catalogTitle}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{copy.catalogSubtitle}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search
                    className={`pointer-events-none absolute ${
                      isEn ? 'left-3' : 'right-3'
                    } top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]`}
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    aria-label={copy.searchAria}
                    className={`w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] py-2 ${
                      isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                    } text-xs text-[var(--text-ink)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none sm:w-56`}
                  />
                </div>

                <div
                  className="flex flex-wrap items-center gap-1 rounded-md bg-[var(--bg-surface-alt)] p-1"
                  role="group"
                  aria-label={isEn ? 'Filter by section' : 'تصفية حسب القسم'}
                >
                  {categories.map((cat) => {
                    const count =
                      cat === 'ALL'
                        ? libraryCatalogBooks.length
                        : libraryCatalogBooks.filter((b) => b.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          selectedCategory === cat
                            ? 'bg-[var(--bg-canvas)] text-[var(--text-ink)] shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
                        }`}
                      >
                        {cat === 'ALL'
                          ? `${copy.allCategory} (${count})`
                          : `${formatSectionHeading(cat, lang, sectionTranslations)} (${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedCategory === 'ALL' ? (
              filteredBooks.length === 0 ? (
                <div className="py-16 text-center text-sm text-[var(--text-muted)]">
                  {copy.noBooksFound}
                </div>
              ) : (
                <div className="mt-10 space-y-14">
                  {managedSections
                    .map((sec) => ({
                      section: sec,
                      items: filteredBooks.filter((b) => b.category === sec),
                    }))
                    .filter((group) => group.items.length > 0)
                    .map(({ section, items }) => (
                      <div key={section} className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
                          <div className="flex items-baseline gap-3">
                            <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
                              {formatSectionHeading(section, lang, sectionTranslations)}
                            </h2>
                            <span className="font-mono-tabular text-xs font-medium text-[var(--accent-primary)]">
                              {items.length === 1
                                ? copy.oneBookInSection
                                : `${items.length} ${copy.booksInSectionSuffix}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(section)}
                            className="text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent-primary)]"
                          >
                            {isEn ? 'View section only →' : 'عرض هذا القسم فقط ←'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                          {items.map((book) => (
                            <BookCard
                              key={book.id}
                              book={book}
                              progress={progressMap[book.id]}
                              isUnlocked={!book.isPremium || unlockedIds.includes(book.id)}
                              lang={lang}
                              sectionTranslations={sectionTranslations}
                              seriesTotalParts={
                                book.seriesId ? seriesCountMap.get(book.seriesId) : undefined
                              }
                              onOpen={handleSelectBookDetails}
                              onOpenSeries={handleOpenSeries}
                              onGiftBook={(b) =>
                                void handleOpenGiftModal({ targetType: 'book', targetId: b.id })
                              }
                              onRateBook={(b) => setRateModalState({ open: true, book: b })}
                              onToggleNotifyMe={(bookId) => void handleToggleComingSoonNotify(bookId)}
                              onPreorderBook={handlePreorderBook}
                              currentUserUid={user?.uid ?? null}
                              defaultPremiumBookPrice={economyConfig.defaultPremiumBookPrice}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )
            ) : (
              <div className="mt-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
                      {formatSectionHeading(selectedCategory, lang, sectionTranslations)}
                    </h2>
                    <span className="font-mono-tabular text-xs font-medium text-[var(--accent-primary)]">
                      {filteredBooks.length === 1
                        ? copy.oneBookInSection
                        : `${filteredBooks.length} ${copy.booksInSectionSuffix}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                  >
                    {isEn ? 'Show all sections' : 'عرض جميع الأقسام'}
                  </button>
                </div>

                {filteredBooks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                    {searchQuery.trim() ? copy.noBooksFound : copy.sectionEmptyNotice}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        progress={progressMap[book.id]}
                        isUnlocked={!book.isPremium || unlockedIds.includes(book.id)}
                        lang={lang}
                        sectionTranslations={sectionTranslations}
                        seriesTotalParts={
                          book.seriesId ? seriesCountMap.get(book.seriesId) : undefined
                        }
                        onOpen={handleSelectBookDetails}
                        onOpenSeries={handleOpenSeries}
                        onGiftBook={(b) =>
                          void handleOpenGiftModal({ targetType: 'book', targetId: b.id })
                        }
                        onRateBook={(b) => setRateModalState({ open: true, book: b })}
                        onToggleNotifyMe={(bookId) => void handleToggleComingSoonNotify(bookId)}
                        onPreorderBook={handlePreorderBook}
                        currentUserUid={user?.uid ?? null}
                        defaultPremiumBookPrice={economyConfig.defaultPremiumBookPrice}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeView === 'premium' && (
          <Suspense fallback={<LazyViewFallback lang={lang} />}>
            <PremiumSection
              premiumBooks={premiumBooks}
              unlockedIds={unlockedIds}
              purchasedIds={purchasedIds}
              themeAccessMap={themeAccessMap}
              activeThemeId={appSettings.themeId}
              iconAccessMap={iconAccessMap}
              activeAppIconId={(appSettings.appIconId as AppIconId | undefined) ?? DEFAULT_APP_ICON_ID}
              isAuthenticated={isSignedIn}
              currentUserUid={user?.uid ?? null}
              userEmail={user?.email}
              lang={lang}
              onSignIn={handleSignIn}
              onUnlockByCode={handleUnlockByCode}
              onOpenBook={handleSelectBookDetails}
              onRequestThemeUnlock={handleRequestThemeUnlock}
              onApplyTheme={(themeId: ThemeId) =>
                void handleUpdateSettings({ ...appSettings, themeId })
              }
              onRequestIconUnlock={handleRequestIconUnlock}
              onApplyAppIcon={(iconId: AppIconId) =>
                void handleUpdateSettings({ ...appSettings, appIconId: iconId })
              }
              onGiftItem={(targetType, targetId) =>
                void handleOpenGiftModal({ targetType, targetId })
              }
              onToggleNotifyMe={(bookId) => void handleToggleComingSoonNotify(bookId)}
              onPreorderBook={handlePreorderBook}
              onRateBook={(b) => setRateModalState({ open: true, book: b })}
              userTokensBalance={currentUserAccount?.tokensBalance ?? 0}
              economyConfig={economyConfig}
            />
          </Suspense>
        )}

        {activeView === 'reading' && (
          <section
            id="continue-reading"
            className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14"
          >
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-6">
              <div>
                <h1 className="font-editorial text-3xl font-bold text-[var(--text-ink)] sm:text-4xl">
                  {copy.continueSectionTitle}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {copy.continueSectionSubtitle}
                </p>
              </div>
              <span className="text-xs font-medium text-[var(--accent-primary)]">
                {copy.savedLocally}
              </span>
            </div>

            {inProgressBooks.length === 0 ? (
              <div className="mt-10 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-14 text-center">
                <BookMarked
                  className="mx-auto h-10 w-10 text-[var(--accent-primary)]"
                  aria-hidden="true"
                />
                <h2 className="mt-4 font-editorial text-2xl font-bold text-[var(--text-ink)]">
                  {copy.myReadingEmptyTitle}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                  {copy.myReadingEmptyDesc}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('catalog')}
                    className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-5 py-2.5 text-xs font-medium text-[var(--btn-dark-fg)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] transition-colors"
                  >
                    <Library className="h-4 w-4" aria-hidden="true" />
                    {copy.goToCatalog}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('premium')}
                    className="inline-flex items-center gap-2 rounded-md border border-amber-500/45 bg-[var(--bg-canvas)] px-5 py-2.5 text-xs font-medium text-amber-500 hover:bg-amber-500/10 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    {copy.goToPremium}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {inProgressBooks.map((book) => {
                  const p = progressMap[book.id];
                  const chapter = book.chapters[p.chapterIndex];
                  const isFlip = book.bookType === 'pdf' || book.bookType === 'word';
                  const totalUnits = isFlip
                    ? Math.max(1, book.pdfPageCount ?? book.pages)
                    : Math.max(1, book.chapters.length);
                  const pct = Math.min(100, Math.round(((p.chapterIndex + 1) / totalUnits) * 100));

                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => handleSelectBookDetails(book)}
                      className={`group flex flex-col justify-between gap-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 ${
                        isEn ? 'text-left' : 'text-right'
                      } transition-colors hover:border-[var(--accent-primary)]/60 hover:bg-[var(--bg-surface-alt)]`}
                    >
                      <div className="flex items-start gap-4">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            referrerPolicy="no-referrer"
                            className="h-24 w-16 shrink-0 rounded-sm border border-[var(--border-hairline)] object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="flex h-24 w-16 shrink-0 items-center justify-center rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] text-[var(--text-muted)]"
                          >
                            <BookOpen className="h-5 w-5 opacity-60" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-medium text-[var(--accent-primary)]">
                              {getSectionDisplayName(book.category, lang, sectionTranslations)}
                            </p>
                            {isBookNew(book) && (
                              <span className="inline-flex items-center rounded-sm bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-fg)]">
                                {copy.newBadge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate font-editorial text-lg font-bold text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]">
                            {book.title}
                          </p>
                          <p className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <span>{book.author}</span>
                            {book.isAuthorVerified && (
                              <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                            )}
                          </p>
                          <p className="mt-2 truncate text-xs text-[var(--text-muted)]">
                            {isFlip
                              ? isEn
                                ? `Page ${p.chapterIndex + 1} of ${book.pdfPageCount ?? book.pages}`
                                : `صفحة ${p.chapterIndex + 1} من ${book.pdfPageCount ?? book.pages}`
                              : isEn
                                ? `Ch ${chapter?.number ?? '01'}: ${chapter?.title}`
                                : `الفصل ${chapter?.number ?? '01'}: ${chapter?.title}`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-[var(--border-hairline)] pt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-alt)]">
                          <div
                            className="h-full rounded-full bg-[var(--accent-primary)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono-tabular text-[var(--text-muted)]">{pct}%</span>
                          <span className="font-medium text-[var(--accent-primary)]">
                            {copy.resumeArrow}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
        {activeView === 'you' && (
          <Suspense fallback={<LazyViewFallback lang={lang} />}>
            <YouPage
              user={effectiveUser}
              userAccount={currentUserAccount}
              followingAccounts={followingAccounts}
              books={books}
              sections={managedSections}
              customThemeCodes={customThemeCodes}
              progressMap={progressMap}
              unlockedIds={unlockedIds}
              purchasedIds={purchasedIds}
              themeAccessMap={themeAccessMap}
              activeThemeId={appSettings.themeId}
              lang={lang}
              sectionTranslations={sectionTranslations}
              onSignIn={handleSignIn}
              onRequestSignOut={() => setShowSignOutConfirm(true)}
              onOpenBook={handleSelectBookDetails}
              onApplyTheme={(themeId: ThemeId) =>
                void handleUpdateSettings({ ...appSettings, themeId })
              }
              onNavigate={(view) => navigateTo(view)}
              onOpenUserProfile={(uid) => void handleOpenUserProfile(uid)}
              onToggleFollow={handleToggleFollowUser}
              onOpenGiftModal={(opts) => void handleOpenGiftModal(opts)}
              tradeRequests={tradeRequests}
              onRespondTradeRequest={handleRespondTradeRequest}
              onSubmitUserBook={handleSubmitUserBook}
              onDeleteUserSubmission={handleDeleteUserSubmission}
              onRequestBookPriceChange={handleRequestBookPriceChange}
              economyConfig={economyConfig}
              tokenTransactions={tokenTransactions}
            />
          </Suspense>
        )}
        {activeView === 'notifications' && (
          <Suspense fallback={<LazyViewFallback lang={lang} />}>
            <NotificationsPage
              notifications={notifications}
              unreadCount={unreadNotificationsCount}
              isAuthenticated={isSignedIn}
              lang={lang}
              onSignIn={handleSignIn}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onBack={() => navigateTo('home')}
              onNavigateTarget={handleNotificationNavigate}
            />
          </Suspense>
        )}
          </>
        )}
      </main>

      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-[var(--text-muted)] lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-baseline gap-2.5">
              {appSettings.themeId === 'golden-king' ? (
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 self-center items-center justify-center rounded-md border border-[#D4AF37]/70 bg-[#050505] text-[#D4AF37]"
                >
                  <MaktabtyLogo className="h-5 w-5" />
                </span>
              ) : (
                <MaktabtyLogo className="h-6 w-6 self-center text-[var(--accent-primary)]" />
              )}
              <span className="font-editorial text-lg font-bold text-[var(--text-ink)]">
                {copy.brandShort}
              </span>
              <span
                dir="ltr"
                className="font-mono-tabular text-xs font-semibold tracking-wider text-[var(--accent-primary)]"
              >
                {copy.brandFranco}
              </span>
            </div>

            <div
              dir="ltr"
              className="inline-flex items-center justify-center rounded-md border border-[var(--accent-primary)] bg-[var(--bg-canvas)] px-3 py-1 shadow-[0_0_16px_-6px_var(--accent-primary)]"
            >
              <span className="bg-gradient-to-r from-amber-500 via-[var(--accent-primary)] to-amber-600 bg-clip-text font-mono-tabular text-xs font-bold tracking-[0.12em] text-transparent">
                created by Shady
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => navigateTo('catalog')}
              className="hover:text-[var(--text-ink)] transition-colors"
            >
              {copy.navCatalog}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('premium')}
              className="hover:text-amber-500 transition-colors"
            >
              {copy.navPremium}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('reading')}
              className="hover:text-[var(--text-ink)] transition-colors"
            >
              {copy.navMyReading}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className="hover:text-[var(--text-ink)] transition-colors"
            >
              {copy.footerSettings}
            </button>
            {isDeveloperMode && (
              <button
                type="button"
                onClick={() => navigateTo('developer')}
                className="hover:text-[var(--accent-primary)] transition-colors"
              >
                {copy.navDeveloperSettings}
              </button>
            )}
            <button
              type="button"
              onClick={() => setRateModalState({ open: true, book: null })}
              aria-label={isEn ? 'Rate a book in the library' : 'قيّم كتاباً داخل البرنامج'}
              className="group inline-flex items-center gap-1.5 rounded-md border border-[var(--accent-primary)]/50 bg-[var(--bg-canvas)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
            >
              <Star className="h-3.5 w-3.5 text-amber-500 transition-colors group-hover:text-current" aria-hidden="true" />
              <span>{copy.rateApp}</span>
            </button>
          </div>
        </div>
      </footer>

      {unlockModalTarget && (
        <Suspense fallback={null}>
          <PremiumUnlockModal
            target={unlockModalTarget}
            isAuthenticated={isSignedIn}
            lang={lang}
            userTokensBalance={currentUserAccount?.tokensBalance ?? 0}
            tokenPrice={unlockModalPricing.finalPrice}
            originalTokenPrice={
              unlockModalPricing.discountPercent ? unlockModalPricing.basePrice : null
            }
            discountPercent={unlockModalPricing.discountPercent}
            onSignIn={handleSignIn}
            onAttemptUnlock={handleAttemptTargetUnlock}
            onUnlockWithTokens={handleUnlockWithTokens}
            onClose={() => setUnlockModalTarget(null)}
          />
        </Suspense>
      )}

      {rateModalState.open && (
        <Suspense fallback={null}>
          <InAppBookRatingModal
            open={rateModalState.open}
            initialBook={rateModalState.book}
            books={libraryCatalogBooks}
            currentUserUid={user?.uid ?? null}
            isAuthenticated={isSignedIn}
            economyConfig={economyConfig}
            lang={lang}
            onSignIn={handleSignIn}
            onSubmitReview={handleSubmitBookReview}
            onClose={() => setRateModalState({ open: false, book: null })}
          />
        </Suspense>
      )}

      {giftModalState.open && (
        <Suspense fallback={null}>
          <GiftPremiumModal
            open={giftModalState.open}
            isAuthenticated={isSignedIn}
            authLoading={authLoading}
            authError={authError}
            lang={lang}
            fixedRecipient={giftModalState.recipient ?? null}
            initialItem={giftInitialItem}
            ownedPremiumBooks={ownedPremiumBooksList}
            ownedPremiumThemes={ownedPremiumThemesList}
            allCatalogBooks={libraryCatalogBooks}
            directoryAccounts={directoryAccounts}
            loadingDirectory={loadingDirectory}
            directoryError={directoryError}
            onRetryDirectory={() => void fetchGiftDirectory()}
            onUnlockTarget={handleGiftUnlockTarget}
            onSignIn={handleSignIn}
            onClose={() => setGiftModalState({ open: false })}
            onConfirmTransfer={handleConfirmGiftTransfer}
            onCreateTradeRequest={handleCreateTradeRequest}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={showSignOutConfirm}
        title={isEn ? 'Sign Out?' : 'هل أنت متأكد من تسجيل الخروج؟'}
        message={
          isEn
            ? `Are you sure you want to sign out of ${user?.email ?? 'your account'}?`
            : `هل أنت متأكد أنك تريد تسجيل الخروج من حسابك${user?.email ? ` (${user.email})` : ''}؟`
        }
        confirmLabel={isEn ? 'Yes, Sign Out' : 'نعم، تسجيل الخروج'}
        cancelLabel={isEn ? 'Cancel' : 'إلغاء'}
        lang={lang}
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={() => {
          setShowSignOutConfirm(false);
          setIsDeveloperMode(false);
          void signOutUser();
        }}
      />

      <OfflineIndicator lang={lang} />
    </div>
  );
}
