import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BookCheck,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Crown,
  Gift,
  Library,
  LogIn,
  LogOut,
  Palette,
  Pencil,
  Sparkles,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  formatDiscountRemainingLabel,
  getEffectiveBookPricing,
  type BookRecord,
  type PremiumTradeRequest,
  type ReadingProgress,
  type TokenEconomyConfig,
  type TokenTransactionItem,
} from '../db/booksDb';
import { getSectionDisplayName, getThemeDisplayName, UI_COPY, type AppLanguage } from '../i18n';
import { PREMIUM_THEMES, type ThemeId } from '../themeCatalog';
import { OwnerBadge } from './BookRatingBar';
import { LazyViewFallback } from './LazyViewFallback';
import type { ThemeAccessState } from './PremiumSection';
import type { DocumentUploadPayload } from './SettingsPanel';
import { TokenIcon, TokenPriceBadge } from './TokenCoin';

const UserBookSubmissionSection = lazy(() =>
  import('./UserBookSubmissionSection').then((m) => ({ default: m.UserBookSubmissionSection }))
);

export interface CurrentUserAccountInfo {
  uid: string;
  email: string;
  displayName: string;
  isVerified: boolean;
  tokensBalance?: number;
  activeIconId?: string | null;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
}

export interface FollowingAccountSummary {
  uid: string;
  displayName: string;
  isVerified: boolean;
  followersCount: number;
  publishedBooksCount: number;
}

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  isVerified: boolean;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  publishedBookIds: string[];
  completedBookIds: string[];
  inProgressCount: number;
  totalBookmarks: number;
  unlockedPremiumBookIds: string[];
  unlockedPremiumThemeIds: string[];
  purchasedIds: string[];
  premiumAccessMeta: Record<string, { accessType: 'purchased' | 'code'; expiresAt?: string }>;
  tokensBalance?: number;
}

interface YouPageProps {
  user: FirebaseUser | null;
  userAccount: CurrentUserAccountInfo | null;
  followingAccounts?: FollowingAccountSummary[];
  viewedProfile?: PublicUserProfile | null;
  books: BookRecord[];
  progressMap: Record<string, ReadingProgress>;
  unlockedIds: string[];
  purchasedIds: string[];
  themeAccessMap: Record<string, ThemeAccessState>;
  activeThemeId: ThemeId;
  lang?: AppLanguage;
  sectionTranslations?: Record<string, string>;
  onSignIn: () => Promise<void>;
  onRequestSignOut: () => void;
  onOpenBook: (book: BookRecord) => void;
  onApplyTheme: (themeId: ThemeId) => void;
  onNavigate: (view: 'catalog' | 'premium' | 'reading') => void;
  onOpenUserProfile?: (uid: string) => void;
  onClosePublicProfile?: () => void;
  onToggleFollow?: (targetUid: string, nextFollow: boolean) => Promise<void>;
  onOpenGiftModal?: (opts: {
    targetType?: 'book' | 'theme';
    targetId?: string;
    recipient?: { uid: string; displayName: string; isVerified: boolean };
  }) => void;
  tradeRequests?: PremiumTradeRequest[];
  onRespondTradeRequest?: (
    tradeId: string,
    decision: 'accept' | 'decline' | 'cancel'
  ) => Promise<{ ok: boolean; error?: string; status?: string }>;
  sections?: string[];
  customThemeCodes?: Record<string, string>;
  economyConfig?: TokenEconomyConfig;
  tokenTransactions?: TokenTransactionItem[];
  onSubmitUserBook?: (
    book: BookRecord,
    documentPayload?: DocumentUploadPayload
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteUserSubmission?: (bookId: string) => Promise<{ ok: boolean; error?: string }>;
  onRequestBookPriceChange?: (
    bookId: string,
    tokenPrice: number
  ) => Promise<{ ok: boolean; error?: string }>;
}

function isBookCompleted(book: BookRecord, progress?: ReadingProgress): boolean {
  if (!progress) return false;
  const isFlipBook = book.bookType === 'pdf' || book.bookType === 'word';
  const totalUnits = isFlipBook
    ? Math.max(1, book.pdfPageCount ?? book.pages ?? 1)
    : Math.max(1, book.chapters.length);

  if (totalUnits <= 1) {
    return progress.scrollRatio >= 0.8 || progress.chapterIndex >= 1;
  }
  return progress.chapterIndex >= totalUnits - 1;
}

function formatDateLabel(raw: string | undefined | null, lang: AppLanguage, withTime = false): string {
  if (!raw) return '—';
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return '—';
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(new Date(ts));
  } catch {
    return raw.slice(0, 10);
  }
}

function formatDaysSince(raw: string | undefined | null, lang: AppLanguage): string {
  if (!raw) return '';
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return '';
  const diffDays = Math.max(0, Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000)));
  if (diffDays === 0) {
    return lang === 'en' ? 'Joined today' : 'اليوم';
  }
  if (diffDays === 1) {
    return lang === 'en' ? '1 day ago' : 'منذ يوم واحد';
  }
  return lang === 'en' ? `${diffDays} days ago` : `منذ ${diffDays} يوم`;
}

export const YouPage: React.FC<YouPageProps> = ({
  user,
  userAccount,
  followingAccounts = [],
  viewedProfile = null,
  books,
  progressMap,
  unlockedIds,
  purchasedIds,
  themeAccessMap,
  activeThemeId,
  lang = 'ar',
  sectionTranslations,
  onSignIn,
  onRequestSignOut,
  onOpenBook,
  onApplyTheme,
  onNavigate,
  onOpenUserProfile,
  onClosePublicProfile,
  onToggleFollow,
  onOpenGiftModal,
  tradeRequests = [],
  onRespondTradeRequest,
  sections = [],
  customThemeCodes = {},
  economyConfig,
  tokenTransactions = [],
  onSubmitUserBook,
  onDeleteUserSubmission,
  onRequestBookPriceChange,
}) => {
  const [followBusy, setFollowBusy] = useState(false);
  const [tradeBusyId, setTradeBusyId] = useState<string | null>(null);
  const [tradeFeedback, setTradeFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [editingPriceBookId, setEditingPriceBookId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>('');
  const [priceBusyBookId, setPriceBusyBookId] = useState<string | null>(null);
  const [priceFeedback, setPriceFeedback] = useState<
    Record<string, { type: 'ok' | 'err'; text: string }>
  >({});
  const isEn = lang === 'en';
  const copy = UI_COPY[lang];

  const isPublicView = Boolean(viewedProfile);
  const isViewingSelfPublic = Boolean(
    viewedProfile && userAccount && viewedProfile.uid === userAccount.uid
  );

  const activeUid = viewedProfile ? viewedProfile.uid : userAccount?.uid ?? user?.uid ?? null;
  const displayName = viewedProfile
    ? viewedProfile.displayName
    : userAccount?.displayName ||
      user?.displayName ||
      user?.email?.split('@')[0] ||
      (isEn ? 'Guest Reader' : 'قارئ ضيف');
  const email = isPublicView ? '' : userAccount?.email || user?.email || '';
  const isVerified = viewedProfile
    ? Boolean(viewedProfile.isVerified)
    : Boolean(user && userAccount?.isVerified);
  const memberSinceIso = viewedProfile
    ? viewedProfile.createdAt
    : userAccount?.createdAt || user?.metadata?.creationTime || null;
  const lastSignInIso = isPublicView ? null : user?.metadata?.lastSignInTime || null;
  const followersCount = viewedProfile
    ? viewedProfile.followersCount
    : userAccount?.followersCount ?? 0;
  const followingCount = viewedProfile
    ? viewedProfile.followingCount
    : userAccount?.followingCount ?? followingAccounts.length;

  const publishedBooks = useMemo(() => {
    if (viewedProfile) {
      const idSet = new Set(viewedProfile.publishedBookIds);
      return books.filter(
        (b) => (idSet.has(b.id) || b.authorUid === viewedProfile.uid) && b.reviewStatus !== 'rejected' && b.reviewStatus !== 'pending'
      );
    }
    if (!activeUid) return [];
    return books.filter((b) => b.authorUid === activeUid && b.reviewStatus !== 'rejected');
  }, [books, activeUid, viewedProfile]);

  const { completedBooks, inProgressCount, totalBookmarks } = useMemo(() => {
    if (viewedProfile) {
      const completedSet = new Set(viewedProfile.completedBookIds);
      return {
        completedBooks: books.filter((b) => completedSet.has(b.id)),
        inProgressCount: viewedProfile.inProgressCount,
        totalBookmarks: viewedProfile.totalBookmarks,
      };
    }

    const completed: BookRecord[] = [];
    let activeCount = 0;
    let bookmarksCount = 0;

    for (const book of books) {
      const p = progressMap[book.id];
      if (!p) continue;
      if (book.isPremium && !unlockedIds.includes(book.id)) continue;
      bookmarksCount += p.bookmarks?.length ?? 0;
      if (isBookCompleted(book, p)) {
        completed.push(book);
      } else {
        activeCount++;
      }
    }

    completed.sort((a, b) =>
      (progressMap[b.id]?.lastReadAt ?? '').localeCompare(progressMap[a.id]?.lastReadAt ?? '')
    );

    return {
      completedBooks: completed,
      inProgressCount: activeCount,
      totalBookmarks: bookmarksCount,
    };
  }, [books, progressMap, unlockedIds, viewedProfile]);

  const unlockedPremiumBooks = useMemo(() => {
    if (viewedProfile) {
      const idSet = new Set(viewedProfile.unlockedPremiumBookIds);
      return books.filter((b) => idSet.has(b.id));
    }
    return books.filter((b) => Boolean(b.isPremium) && unlockedIds.includes(b.id));
  }, [books, unlockedIds, viewedProfile]);

  const unlockedPremiumThemes = useMemo(() => {
    if (viewedProfile) {
      const idSet = new Set(viewedProfile.unlockedPremiumThemeIds);
      return PREMIUM_THEMES.filter((t) => idSet.has(t.id));
    }
    return PREMIUM_THEMES.filter((t) => unlockedIds.includes(t.id));
  }, [unlockedIds, viewedProfile]);

  const totalPremiumCount = unlockedPremiumBooks.length + unlockedPremiumThemes.length;

  const handleFollowAction = async () => {
    if (!viewedProfile || !onToggleFollow) return;
    if (!user) {
      await onSignIn();
      return;
    }
    setFollowBusy(true);
    try {
      await onToggleFollow(viewedProfile.uid, !viewedProfile.isFollowing);
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
      {/* Top Back Bar for Public Account View */}
      {isPublicView && onClosePublicProfile && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClosePublicProfile}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            {isEn ? (
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isEn ? 'Back' : 'العودة'}</span>
          </button>

          <span className="text-xs text-[var(--text-muted)]">
            {isEn ? 'Public Account View (Read-Only)' : 'معاينة الحساب (للقراءة والعرض فقط)'}
          </span>
        </div>
      )}

      {/* Profile Identity Header */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] text-[var(--accent-primary)]"
            >
              <User className="h-8 w-8" />
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-editorial text-2xl font-bold leading-tight text-[var(--text-ink)] sm:text-3xl truncate">
                  {displayName}
                </h1>
                {isVerified && (
                  <OwnerBadge showOwnerText={false} iconClassName="h-6 w-6 sm:h-7 sm:w-7" />
                )}
              </div>

              {isPublicView ? (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className={isVerified ? 'font-medium text-sky-500' : ''}>
                      {isVerified
                        ? isEn
                          ? 'Verified Book Owner'
                          : 'صاحب حساب موثق'
                        : isEn
                          ? 'Book Owner Account'
                          : 'حساب صاحب كتاب'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-editorial text-lg font-bold text-[var(--text-ink)] sm:text-xl font-mono-tabular">
                        {followersCount}
                      </span>
                      <span className="font-editorial text-base font-bold text-[var(--text-ink)] sm:text-lg">
                        {isEn ? 'Followers' : 'متابع'}
                      </span>
                    </div>
                    <span aria-hidden="true" className="text-base font-bold text-[var(--text-muted)]">
                      ·
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-editorial text-lg font-bold text-[var(--text-ink)] sm:text-xl font-mono-tabular">
                        {followingCount}
                      </span>
                      <span className="font-editorial text-base font-bold text-[var(--text-ink)] sm:text-lg">
                        {isEn ? 'Following' : 'يتابع'}
                      </span>
                    </div>
                    <span aria-hidden="true" className="text-base font-bold text-[var(--text-muted)]">
                      ·
                    </span>
                    <div
                      className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/45 bg-amber-500/12 px-2.5 py-0.5 font-mono-tabular text-sm font-extrabold text-amber-500"
                      title={isEn ? 'Golden Tokens Balance' : 'رصيد التوكنز الذهبية'}
                    >
                      <TokenIcon className="h-4 w-4" />
                      <span>{viewedProfile?.tokensBalance ?? 0}</span>
                    </div>
                  </div>
                </div>
              ) : user ? (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    {email && (
                      <span dir="ltr" className="font-mono-tabular">
                        {email}
                      </span>
                    )}
                    {email && <span aria-hidden="true">·</span>}
                    <span className={isVerified ? 'font-medium text-sky-500' : ''}>
                      {isVerified
                        ? isEn
                          ? 'Verified Account'
                          : 'حساب موثق'
                        : isEn
                          ? 'Reader Account'
                          : 'حساب قارئ'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-editorial text-lg font-bold text-[var(--text-ink)] sm:text-xl font-mono-tabular">
                        {followersCount}
                      </span>
                      <span className="font-editorial text-base font-bold text-[var(--text-ink)] sm:text-lg">
                        {isEn ? 'Followers' : 'متابع'}
                      </span>
                    </div>
                    <span aria-hidden="true" className="text-base font-bold text-[var(--text-muted)]">
                      ·
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-editorial text-lg font-bold text-[var(--text-ink)] sm:text-xl font-mono-tabular">
                        {followingCount}
                      </span>
                      <span className="font-editorial text-base font-bold text-[var(--text-ink)] sm:text-lg">
                        {isEn ? 'Following' : 'يتابع'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'Sign in with Google to track your account sign-in dates, published books, verified badge, and synced premium items.'
                    : 'سجّل الدخول بحساب Google لعرض تاريخ حسابك، الكتب المنسوبة إليك، حالة التوثيق، ومقتنياتك البريميوم.'}
                </p>
              )}
            </div>
          </div>

          {isPublicView && viewedProfile && !isViewingSelfPublic && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {user && onOpenGiftModal && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenGiftModal({
                      recipient: {
                        uid: viewedProfile.uid,
                        displayName: viewedProfile.displayName,
                        isVerified: viewedProfile.isVerified,
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-md border border-amber-500/55 bg-amber-500/12 px-4 py-2.5 text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 whitespace-nowrap shrink-0"
                >
                  <Gift className="h-4 w-4" aria-hidden="true" />
                  <span>{isEn ? 'Gift / Trade VIP' : 'إهداء أو تبديل'}</span>
                </button>
              )}
              {onToggleFollow && (
                <button
                  type="button"
                  disabled={followBusy}
                  onClick={() => void handleFollowAction()}
                  className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 ${
                    viewedProfile.isFollowing
                      ? 'border border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500'
                      : 'bg-[var(--accent-primary)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]'
                  }`}
                >
                  {viewedProfile.isFollowing ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>{isEn ? 'Following' : 'تتابعه'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      <span>{isEn ? 'Follow Account' : 'متابعة الحساب'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {!isPublicView && !user && (
            <button
              type="button"
              onClick={() => void onSignIn()}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>{isEn ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Stats Strip */}
      <div
        className={`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          isPublicView ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
        }`}
      >
        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{isEn ? 'Published Books' : 'الكتب المنسوبة للحساب'}</span>
            <Library className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono-tabular text-3xl font-bold text-[var(--text-ink)]">
            {publishedBooks.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {isEn
              ? `${followersCount} followers`
              : `${followersCount} متابع لهذه الكتب`}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{isEn ? 'Books Completed' : 'الكتب المكتملة'}</span>
            <BookCheck className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono-tabular text-3xl font-bold text-[var(--text-ink)]">
            {completedBooks.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {isEn
              ? `${inProgressCount} in progress · ${totalBookmarks} bookmarks`
              : `${inProgressCount} قيد القراءة · ${totalBookmarks} إشارة مرجعية`}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{isEn ? 'Premium Items Owned' : 'المحتوى البريميوم'}</span>
            <Crown className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono-tabular text-3xl font-bold text-[var(--text-ink)]">
            {totalPremiumCount}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {isEn
              ? `${unlockedPremiumBooks.length} books · ${unlockedPremiumThemes.length} themes`
              : `${unlockedPremiumBooks.length} كتب · ${unlockedPremiumThemes.length} سمات`}
          </p>
        </div>

        {isPublicView && viewedProfile && (
          <div className="rounded-lg border border-amber-500/45 bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
              <span>{isEn ? 'Golden Tokens' : 'رصيد التوكنز'}</span>
              <TokenIcon className="h-4 w-4" />
            </div>
            <p className="mt-2 font-mono-tabular text-3xl font-bold text-amber-500">
              {viewedProfile.tokensBalance ?? 0}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {isEn ? 'Account wallet balance' : 'الرصيد المتاح بالحساب'}
            </p>
          </div>
        )}

        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{isPublicView ? (isEn ? 'Member Since' : 'تاريخ الانضمام') : (isEn ? 'Account Activity' : 'تاريخ التسجيل والدخول')}</span>
            {isPublicView ? (
              <Calendar className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
            ) : (
              <Clock className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
            )}
          </div>
          <p className="mt-2 font-editorial text-lg font-bold text-[var(--text-ink)]">
            {isPublicView || user ? formatDateLabel(memberSinceIso, lang) : '—'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {isPublicView
              ? formatDaysSince(memberSinceIso, lang) || (isEn ? 'Active account' : 'حساب نشط')
              : user && lastSignInIso
                ? isEn
                  ? `Last sign-in: ${formatDateLabel(lastSignInIso, lang, true)}`
                  : `آخر دخول: ${formatDateLabel(lastSignInIso, lang, true)}`
                : user
                  ? formatDaysSince(memberSinceIso, lang) || (isEn ? 'Active account' : 'حساب نشط')
                  : isEn
                    ? 'Not signed in'
                    : 'غير مسجل'}
          </p>
        </div>
      </div>

      {/* Golden Rhombus Wallet & Earning Ledger (Own Profile Only) */}
      {!isPublicView && (
        <div
          id="token-wallet"
          className="mt-8 rounded-xl border border-amber-500/45 bg-[var(--bg-surface)] p-6 lg:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/45 bg-amber-500/12">
                <TokenIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {isEn ? 'Golden Rhombus Wallet' : 'محفظة العملات الذهبية'}
                </p>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="font-mono-tabular text-3xl font-bold text-[var(--text-ink)]">
                    {user ? userAccount?.tokensBalance ?? 0 : '—'}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {isEn ? 'Golden Tokens' : 'عملة ذهبية'}
                  </span>
                </div>
              </div>
            </div>

            {user ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('premium')}
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-2 text-xs font-semibold text-stone-950 transition-colors hover:bg-amber-400"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isEn ? 'Spend in Premium' : 'الشراء من ركن البريميوم'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('publish-studio-form')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2 text-xs font-semibold text-[var(--text-ink)] transition-colors hover:border-amber-500"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isEn ? 'Publish a Book' : 'نشر كتاب جديد'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isEn
                    ? `Sign in (+${economyConfig?.welcomeBonusTokens ?? 50} Welcome Bonus)`
                    : `سجّل الدخول (+${economyConfig?.welcomeBonusTokens ?? 50} عملة ترحيب)`}
                </span>
              </button>
            )}
          </div>

          {economyConfig && (
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 text-xs">
              <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {isEn ? 'Comment on Your Book' : 'تعليق على كتابك'}
                </p>
                <div className="mt-1 flex items-center gap-1 font-mono-tabular font-bold text-emerald-600 dark:text-emerald-400">
                  <TokenIcon className="h-3.5 w-3.5" />
                  <span>+{economyConfig.rewardCommentOnBook}</span>
                </div>
              </div>
              <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {isEn ? 'Book Rating > 4.0★' : 'تقييم كتابك فوق 4.0★'}
                </p>
                <div className="mt-1 flex items-center gap-1 font-mono-tabular font-bold text-emerald-600 dark:text-emerald-400">
                  <TokenIcon className="h-3.5 w-3.5" />
                  <span>+{economyConfig.rewardBookRatingAbove4}</span>
                </div>
              </div>
              <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {isEn ? 'Book Approved' : 'قبول ونشر كتابك'}
                </p>
                <div className="mt-1 flex items-center gap-1 font-mono-tabular font-bold text-emerald-600 dark:text-emerald-400">
                  <TokenIcon className="h-3.5 w-3.5" />
                  <span>+{economyConfig.rewardBookApproved}</span>
                </div>
              </div>
              <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {isEn ? 'Publish Regular / VIP' : 'نشر عادي / بريميوم'}
                </p>
                <div className="mt-1 flex items-center gap-1 font-mono-tabular font-bold text-amber-600 dark:text-amber-400">
                  <TokenIcon className="h-3.5 w-3.5" />
                  <span>
                    {economyConfig.publishRegularBookCost} / {economyConfig.publishPremiumBookCost}
                  </span>
                </div>
              </div>
              <div className="col-span-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5 sm:col-span-1">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {isEn ? 'Finish Book / Follower' : 'إنهاء كتاب / متابع'}
                </p>
                <div className="mt-1 flex items-center gap-1 font-mono-tabular font-bold text-emerald-600 dark:text-emerald-400">
                  <TokenIcon className="h-3.5 w-3.5" />
                  <span>
                    +{economyConfig.rewardBookCompleted} / +{economyConfig.rewardNewFollower}
                  </span>
                </div>
              </div>
            </div>
          )}

          {user && (
            <div className="mt-5">
              <p className="mb-2.5 text-xs font-semibold text-[var(--text-muted)]">
                {isEn ? 'Recent Token Activity' : 'سجل حركات العملات الأخيرة'}
              </p>
              {tokenTransactions.length === 0 ? (
                <p className="rounded-md border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-4 text-center text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'No token transactions yet.'
                    : 'لا توجد معاملات عملات مسجلة حتى الآن.'}
                </p>
              ) : (
                <div className="max-h-60 divide-y divide-[var(--border-hairline)] overflow-y-auto rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
                  {tokenTransactions.map((tx) => {
                    const isPositive = tx.amount >= 0;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text-ink)]">
                            {isEn ? tx.descriptionEn : tx.descriptionAr}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                            {formatDateLabel(tx.createdAt, lang, true)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono-tabular text-xs font-bold shrink-0 ${
                            isPositive
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          <TokenIcon className="h-3.5 w-3.5" />
                          <span>
                            {isPositive ? `+${tx.amount}` : tx.amount}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Books Linked / Published by This Account */}
      <div className="mt-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <Library className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
              {isPublicView
                ? isEn
                  ? `Books Published by ${displayName}`
                  : `كتب ${displayName}`
                : isEn
                  ? 'Books Linked to Your Account'
                  : 'الكتب الخاصة بحسابك'}
            </h2>
            <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono-tabular text-xs font-semibold text-[var(--text-muted)]">
              {publishedBooks.length}
            </span>
          </div>
        </div>

        {publishedBooks.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 py-10 text-center text-sm text-[var(--text-muted)]">
            {isPublicView
              ? isEn
                ? 'This account has no published books linked yet.'
                : 'لا توجد كتب مربوطة بهذا الحساب حتى الآن.'
              : isEn
                ? 'No books are linked to your account yet. Books linked to you in Developer Mode will appear here.'
                : 'لا توجد كتب مربوطة بحسابك حالياً. عند ربط أي كتاب بحسابك من وضع المطور سيظهر هنا فوراً.'}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedBooks.map((book) => {
              const pricing = getEffectiveBookPricing(
                book,
                economyConfig?.defaultPremiumBookPrice ?? 40
              );
              const currentBookPrice = pricing.basePrice;
              const canAuthorManagePrice =
                !isPublicView &&
                Boolean(user) &&
                Boolean(book.isPremium) &&
                book.reviewStatus === 'approved' &&
                book.authorUid === activeUid &&
                Boolean(onRequestBookPriceChange);
              const isEditingThisPrice = editingPriceBookId === book.id;
              const isPriceBusy = priceBusyBookId === book.id;
              const fb = priceFeedback[book.id];

              return (
                <div
                  key={book.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5 transition-colors hover:border-[var(--accent-primary)]/70"
                >
                  <button
                    type="button"
                    onClick={() => onOpenBook(book)}
                    className={`flex items-center gap-3.5 ${
                      isEn ? 'text-left' : 'text-right'
                    } group w-full`}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="h-16 w-12 shrink-0 rounded-sm border border-[var(--border-hairline)] object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-16 w-12 shrink-0 items-center justify-center rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] text-[var(--text-muted)]"
                      >
                        <BookOpen className="h-4 w-4 opacity-60" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]">
                        {book.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1 truncate text-xs text-[var(--text-muted)]">
                        <span>{book.author}</span>
                        {book.isAuthorVerified && (
                          <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                        )}
                        <span aria-hidden="true"> · </span>
                        <span>{getSectionDisplayName(book.category, lang, sectionTranslations)}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${
                            book.reviewStatus === 'pending'
                              ? 'font-bold text-amber-500'
                              : 'text-[var(--accent-primary)]'
                          }`}
                        >
                          {book.reviewStatus === 'pending'
                            ? isEn
                              ? 'Pending Review · Visible only to you'
                              : 'في انتظار المراجعة'
                            : book.isPremium
                              ? copy.premiumLabel
                              : isEn
                                ? 'Published'
                                : 'كتاب منشور'}
                        </span>
                        {book.isPremium && (
                          <TokenPriceBadge
                            amount={pricing.finalPrice}
                            originalAmount={pricing.hasDiscount ? pricing.basePrice : null}
                            discountPercent={pricing.hasDiscount ? pricing.discountPercent : null}
                            lang={lang}
                            size="xs"
                          />
                        )}
                      </div>
                      {book.isPremium && pricing.hasDiscount && (
                        <p className="mt-1 text-[10px] font-semibold text-rose-500">
                          {isEn ? `SALE -${pricing.discountPercent}%` : `سيل -${pricing.discountPercent}%`} ·{' '}
                          {formatDiscountRemainingLabel(pricing.discountEndsAt, lang, {
                            isComingSoon: book.isComingSoon,
                            discountPostReleaseDays: pricing.discountPostReleaseDays,
                          })}
                        </p>
                      )}
                      {book.isComingSoon && (book.preordersCount ?? 0) > 0 && (
                        <p className="mt-1 text-[10px] font-semibold text-amber-500">
                          {isEn
                            ? `Pre-Orders: ${book.preordersCount}`
                            : `الطلبات المسبقة: ${book.preordersCount}`}
                        </p>
                      )}
                    </div>
                  </button>

                  {canAuthorManagePrice && (
                    <div className="space-y-2 border-t border-[var(--border-hairline)] pt-2.5 text-[11px]">
                      {book.priceReviewStatus === 'pending' &&
                        typeof book.pendingTokenPrice === 'number' && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-amber-600 dark:text-amber-400">
                            <span className="font-semibold">
                              {isEn ? 'Pending price review:' : 'سعر جديد قيد المراجعة:'}
                            </span>
                            <TokenPriceBadge amount={book.pendingTokenPrice} lang={lang} size="xs" />
                          </div>
                        )}

                      {book.priceReviewStatus === 'rejected' && (
                        <p className="rounded border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 text-rose-500">
                          {isEn ? 'Price change declined' : 'تم رفض طلب تعديل السعر'}
                          {book.priceReviewNote ? `: ${book.priceReviewNote}` : ''}
                        </p>
                      )}

                      {fb && (
                        <p
                          className={`font-semibold ${
                            fb.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {fb.text}
                        </p>
                      )}

                      {isEditingThisPrice ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!onRequestBookPriceChange) return;
                            const parsed = Math.max(0, Math.min(100000, Math.floor(Number(priceDraft))));
                            if (!Number.isFinite(parsed) || priceDraft.trim() === '') return;
                            setPriceBusyBookId(book.id);
                            try {
                              const res = await onRequestBookPriceChange(book.id, parsed);
                              if (res.ok) {
                                setEditingPriceBookId(null);
                                setPriceFeedback((prev) => ({
                                  ...prev,
                                  [book.id]: {
                                    type: 'ok',
                                    text: isEn
                                      ? 'Sent to developer for approval.'
                                      : 'تم إرسال السعر الجديد للمطور للموافقة.',
                                  },
                                }));
                              } else {
                                setPriceFeedback((prev) => ({
                                  ...prev,
                                  [book.id]: {
                                    type: 'err',
                                    text:
                                      res.error ??
                                      (isEn ? 'Failed to submit request.' : 'تعذّر إرسال الطلب.'),
                                  },
                                }));
                              }
                            } finally {
                              setPriceBusyBookId(null);
                            }
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <TokenIcon className="h-4 w-4 shrink-0" />
                          <input
                            type="number"
                            min={0}
                            max={100000}
                            required
                            value={priceDraft}
                            onChange={(e) => setPriceDraft(e.target.value)}
                            dir="ltr"
                            className="w-20 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-center font-mono-tabular text-xs font-bold text-amber-500 focus:border-amber-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isPriceBusy}
                            className="flex-1 rounded bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                          >
                            {isPriceBusy
                              ? isEn
                                ? 'Sending...'
                                : 'جاري الإرسال...'
                              : isEn
                                ? 'Send Request'
                                : 'إرسال للمطور'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceBookId(null)}
                            className="rounded border border-[var(--border-hairline)] px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-ink)]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceBookId(book.id);
                            setPriceDraft(String(book.pendingTokenPrice ?? currentBookPrice));
                          }}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded border border-amber-500/45 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950"
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          <span>
                            {book.priceReviewStatus === 'pending'
                              ? isEn
                                ? 'Update Pending Price'
                                : 'تعديل السعر المطلوب'
                              : isEn
                                ? 'Change Book Price'
                                : 'تعديل سعر الكتاب'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Following Accounts Section (Own You Page Only) */}
      {!isPublicView && (
        <div className="mt-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
              <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
                {isEn ? 'Accounts You Follow' : 'الحسابات التي تتابعها'}
              </h2>
              <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono-tabular text-xs font-semibold text-[var(--text-muted)]">
                {followingAccounts.length}
              </span>
            </div>
          </div>

          {followingAccounts.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 py-10 text-center text-sm text-[var(--text-muted)]">
              {isEn
                ? 'You are not following any book owners yet. Open any book and tap Follow on the author account.'
                : 'لا تتابع أي حساب حالياً. افتح صفحة أي كتاب واضغط على «متابعة» بجانب حساب صاحب الكتاب.'}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {followingAccounts.map((acc) => (
                <div
                  key={acc.uid}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4"
                >
                  <button
                    type="button"
                    onClick={() => onOpenUserProfile?.(acc.uid)}
                    className={`flex min-w-0 flex-1 items-center gap-3 ${
                      isEn ? 'text-left' : 'text-right'
                    } group`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--accent-primary)]"
                    >
                      <User className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]">
                          {acc.displayName}
                        </p>
                        {acc.isVerified && (
                          <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {isEn
                          ? `${acc.publishedBooksCount} books · ${acc.followersCount} followers`
                          : `${acc.publishedBooksCount} كتب · ${acc.followersCount} متابع`}
                      </p>
                    </div>
                  </button>

                  {onToggleFollow && (
                    <button
                      type="button"
                      onClick={() => void onToggleFollow(acc.uid, false)}
                      className="rounded border border-[var(--border-hairline)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)] transition-colors hover:border-red-500/50 hover:text-red-500 whitespace-nowrap shrink-0"
                    >
                      {isEn ? 'Unfollow' : 'إلغاء'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Premium Trade / Swap Requests (Own Profile Only) */}
      {!isPublicView && user && (
        <div
          id="trade-requests"
          className="mt-10 rounded-xl border border-amber-500/40 bg-[var(--bg-surface)] p-6 lg:p-8"
        >
          {(() => {
            const resolveTradeItemLabel = (targetType: 'book' | 'theme', targetId: string) => {
              if (targetType === 'book') {
                const found = books.find((b) => b.id === targetId);
                return {
                  title: found?.title ?? targetId,
                  kind: isEn ? 'Premium Book' : 'كتاب بريميوم',
                };
              }
              const theme = PREMIUM_THEMES.find((t) => t.id === targetId);
              return {
                title: theme ? getThemeDisplayName(theme, lang) : targetId,
                kind: isEn ? 'Premium Theme' : 'سمة بريميوم',
              };
            };

            const incomingPending = tradeRequests.filter(
              (r) => r.recipientUid === activeUid && r.status === 'pending'
            );
            const outgoingPending = tradeRequests.filter(
              (r) => r.senderUid === activeUid && r.status === 'pending'
            );
            const resolvedRecent = tradeRequests
              .filter((r) => r.status !== 'pending')
              .slice(0, 6);

            const handleTradeDecision = async (
              tradeId: string,
              decision: 'accept' | 'decline' | 'cancel'
            ) => {
              if (!onRespondTradeRequest) return;
              setTradeFeedback(null);
              setTradeBusyId(tradeId);
              try {
                const res = await onRespondTradeRequest(tradeId, decision);
                if (!res.ok) {
                  setTradeFeedback({
                    type: 'err',
                    text:
                      res.error ??
                      (isEn
                        ? 'Could not process trade request.'
                        : 'تعذّر تنفيذ طلب التبديل حالياً.'),
                  });
                } else {
                  setTradeFeedback({
                    type: 'ok',
                    text:
                      decision === 'accept'
                        ? isEn
                          ? 'Trade completed! Items have been swapped.'
                          : 'تمت الموافقة وإتمام التبديل بين الحسابين بنجاح!'
                        : decision === 'decline'
                          ? isEn
                            ? 'Trade request declined.'
                            : 'تم رفض طلب التبديل.'
                          : isEn
                            ? 'Trade request cancelled.'
                            : 'تم إلغاء طلب التبديل.',
                  });
                }
              } finally {
                setTradeBusyId(null);
              }
            };

            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
                  <div className="flex items-center gap-2.5">
                    <ArrowLeftRight className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
                      {isEn ? 'Premium Trade Requests' : 'طلبات التبديل البريميوم'}
                    </h2>
                    {incomingPending.length > 0 && (
                      <span className="rounded border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 font-mono-tabular text-xs font-bold text-amber-500">
                        {incomingPending.length} {isEn ? 'incoming' : 'وارد'}
                      </span>
                    )}
                  </div>
                  {onOpenGiftModal && (
                    <button
                      type="button"
                      onClick={() => onOpenGiftModal({})}
                      className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/55 bg-amber-500/12 px-3 py-1.5 text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 whitespace-nowrap shrink-0"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isEn ? 'New Gift or Trade' : 'إرسال هدية أو طلب تبديل'}</span>
                    </button>
                  )}
                </div>

                {tradeFeedback && (
                  <p
                    role="status"
                    className={`mt-4 rounded-md border px-3.5 py-2.5 text-xs font-semibold ${
                      tradeFeedback.type === 'ok'
                        ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-500'
                        : 'border-rose-500/45 bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {tradeFeedback.text}
                  </p>
                )}

                {tradeRequests.length === 0 ? (
                  <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 py-8 text-center text-sm text-[var(--text-muted)]">
                    {isEn
                      ? 'No trade requests yet. You can propose a swap for any premium book or theme with another reader.'
                      : 'لا توجد طلبات تبديل حالياً. يمكنك اقتراح تبديل أي كتاب أو سمة بريميوم مع صديق من زر الهدية.'}
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {incomingPending.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                          {isEn
                            ? `Incoming Requests Waiting for Your Decision (${incomingPending.length})`
                            : `طلبات واردة بانتظار قرارك (${incomingPending.length})`}
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {incomingPending.map((req) => {
                            const offered = resolveTradeItemLabel(req.offeredType, req.offeredId);
                            const requested = resolveTradeItemLabel(
                              req.requestedType,
                              req.requestedId
                            );
                            const busy = tradeBusyId === req.id;

                            return (
                              <div
                                key={req.id}
                                className="flex flex-col justify-between gap-4 rounded-lg border border-amber-500/50 bg-[var(--bg-canvas)] p-4"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onOpenUserProfile?.(req.senderUid)}
                                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-ink)] hover:text-[var(--accent-primary)]"
                                    >
                                      <span>{req.senderDisplayName}</span>
                                      {req.senderIsVerified && (
                                        <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
                                      )}
                                    </button>
                                    <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                                      {formatDateLabel(req.createdAt, lang, true)}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 text-xs">
                                    <div>
                                      <span className="font-semibold text-emerald-500">
                                        {isEn ? 'You Receive: ' : 'ستحصل على: '}
                                      </span>
                                      <span className="font-bold text-[var(--text-ink)]">
                                        {offered.title}
                                      </span>
                                      <span className="text-[var(--text-muted)]">
                                        {' '}
                                        ({offered.kind})
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-amber-500">
                                        {isEn ? 'You Give: ' : 'في مقابل: '}
                                      </span>
                                      <span className="font-bold text-[var(--text-ink)]">
                                        {requested.title}
                                      </span>
                                      <span className="text-[var(--text-muted)]">
                                        {' '}
                                        ({requested.kind})
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleTradeDecision(req.id, 'accept')}
                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                                  >
                                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>{isEn ? 'Accept Swap' : 'موافقة وإتمام التبديل'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleTradeDecision(req.id, 'decline')}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>{isEn ? 'Decline' : 'لا / رفض'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {outgoingPending.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          {isEn
                            ? `Your Sent Pending Requests (${outgoingPending.length})`
                            : `طلباتك المرسلة بانتظار الرد (${outgoingPending.length})`}
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {outgoingPending.map((req) => {
                            const offered = resolveTradeItemLabel(req.offeredType, req.offeredId);
                            const requested = resolveTradeItemLabel(
                              req.requestedType,
                              req.requestedId
                            );
                            const busy = tradeBusyId === req.id;

                            return (
                              <div
                                key={req.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5 text-xs"
                              >
                                <div className="min-w-0 space-y-1">
                                  <p className="font-bold text-[var(--text-ink)]">
                                    {isEn
                                      ? `To ${req.recipientDisplayName}`
                                      : `إلى ${req.recipientDisplayName}`}
                                  </p>
                                  <p className="text-[var(--text-muted)]">
                                    {isEn
                                      ? `Offered: ${offered.title} ⇄ Requested: ${requested.title}`
                                      : `عرضت: ${offered.title} ⇄ طلبت: ${requested.title}`}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void handleTradeDecision(req.id, 'cancel')}
                                  className="rounded border border-[var(--border-hairline)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:border-rose-500/50 hover:text-rose-500 whitespace-nowrap shrink-0 disabled:opacity-50"
                                >
                                  {isEn ? 'Cancel' : 'إلغاء الطلب'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {resolvedRecent.length > 0 && (
                      <div className="space-y-2.5 border-t border-[var(--border-hairline)] pt-4">
                        <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                          {isEn ? 'Recent Trade History' : 'سجل طلبات التبديل السابقة'}
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {resolvedRecent.map((req) => {
                            const offered = resolveTradeItemLabel(req.offeredType, req.offeredId);
                            const requested = resolveTradeItemLabel(
                              req.requestedType,
                              req.requestedId
                            );
                            const isIncoming = req.recipientUid === activeUid;
                            const otherName = isIncoming
                              ? req.senderDisplayName
                              : req.recipientDisplayName;

                            return (
                              <div
                                key={req.id}
                                className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]/70 px-3.5 py-2.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-[var(--text-ink)]">
                                    {otherName}
                                  </p>
                                  <p className="truncate text-[11px] text-[var(--text-muted)]">
                                    {offered.title} ⇄ {requested.title}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 text-[11px] font-bold ${
                                    req.status === 'accepted'
                                      ? 'text-emerald-500'
                                      : req.status === 'declined'
                                        ? 'text-rose-500'
                                        : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {req.status === 'accepted'
                                    ? isEn
                                      ? 'Accepted ✓'
                                      : 'تم التبديل ✓'
                                    : req.status === 'declined'
                                      ? isEn
                                        ? 'Declined'
                                        : 'مرفوض'
                                      : isEn
                                        ? 'Cancelled'
                                        : 'ملغى'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Premium Collection */}
      <div className="mt-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
              {isPublicView
                ? isEn
                  ? `${displayName}'s Premium Collection`
                  : `مقتنيات ${displayName} البريميوم`
                : isEn
                  ? 'Your Premium Collection'
                  : 'مقتنياتك البريميوم'}
            </h2>
          </div>
          {!isPublicView && (
            <button
              type="button"
              onClick={() => onNavigate('premium')}
              className="text-xs font-semibold text-amber-500 hover:underline whitespace-nowrap shrink-0"
            >
              {copy.goToPremium}
            </button>
          )}
        </div>

        {totalPremiumCount === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 py-10 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              {isPublicView
                ? isEn
                  ? 'This account does not own any unlocked premium books or themes yet.'
                  : 'لا يمتلك هذا الحساب كتباً أو سمات بريميوم مفعّلة حالياً.'
                : isEn
                  ? 'You have not unlocked any premium books or themes yet.'
                  : 'لا تمتلك كتباً أو سمات بريميوم مفعّلة في حسابك حالياً.'}
            </p>
            {!isPublicView && (
              <button
                type="button"
                onClick={() => onNavigate('premium')}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 transition-colors hover:bg-amber-400"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copy.goToPremium}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {unlockedPremiumBooks.map((book) => {
              const meta = viewedProfile?.premiumAccessMeta[book.id];
              const isPermanent = viewedProfile
                ? meta?.accessType === 'purchased' || viewedProfile.purchasedIds.includes(book.id)
                : book.accessType === 'purchased' || purchasedIds.includes(book.id);
              const expiresAt = viewedProfile ? meta?.expiresAt : book.codeAccessExpiresAt;

              const hasFiniteExpiry =
                expiresAt && Date.parse(expiresAt) - Date.now() < 10 * 365 * 24 * 3600_000;

              const accessText = isPermanent
                ? isEn
                  ? 'Permanent VIP Access'
                  : 'صلاحية دائمة'
                : hasFiniteExpiry
                  ? isEn
                    ? `Active until ${formatDateLabel(expiresAt!, lang)}`
                    : `مفعّل بالكود حتى ${formatDateLabel(expiresAt!, lang)}`
                  : isEn
                    ? 'Activated by Code'
                    : 'مفعّل بالكود';

              return (
                <div
                  key={book.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-[var(--bg-canvas)] p-3.5 transition-colors hover:border-amber-500"
                >
                  <button
                    type="button"
                    onClick={() => onOpenBook(book)}
                    className={`flex min-w-0 flex-1 items-center gap-4 ${
                      isEn ? 'text-left' : 'text-right'
                    }`}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="h-16 w-12 shrink-0 rounded-sm border border-[var(--border-hairline)] object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-16 w-12 shrink-0 items-center justify-center rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] text-[var(--text-muted)]"
                      >
                        <BookOpen className="h-4 w-4 opacity-60" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                        {book.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
                        <span>{book.author}</span>
                        {book.isAuthorVerified && (
                          <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                        )}
                        <span aria-hidden="true"> · </span>
                        <span>{getSectionDisplayName(book.category, lang, sectionTranslations)}</span>
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-amber-500">{accessText}</p>
                    </div>
                  </button>

                  {!isPublicView && user && onOpenGiftModal && (
                    <button
                      type="button"
                      onClick={() => onOpenGiftModal({ targetType: 'book', targetId: book.id })}
                      title={isEn ? 'Gift or trade with a friend' : 'إهداء أو تبديل لصديق'}
                      aria-label={isEn ? `Gift or trade ${book.title}` : `إهداء أو تبديل ${book.title}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/55 bg-amber-500/12 text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 shrink-0"
                    >
                      <Gift className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}

            {unlockedPremiumThemes.map((theme) => {
              const meta = viewedProfile?.premiumAccessMeta[theme.id];
              const access = themeAccessMap[theme.id];
              const isPermanent = viewedProfile
                ? meta?.accessType === 'purchased' || viewedProfile.purchasedIds.includes(theme.id)
                : access?.accessType === 'purchased' || purchasedIds.includes(theme.id);
              const expiresAt = viewedProfile ? meta?.expiresAt : access?.codeAccessExpiresAt;
              const isCurrentTheme = activeThemeId === theme.id;
              const tName = getThemeDisplayName(theme, lang);
              const hasFiniteExpiry =
                expiresAt && Date.parse(expiresAt) - Date.now() < 10 * 365 * 24 * 3600_000;
              const accessText = isPermanent
                ? isEn
                  ? 'Permanent VIP Theme'
                  : 'سمة دائمة'
                : hasFiniteExpiry
                  ? isEn
                    ? `Active until ${formatDateLabel(expiresAt!, lang)}`
                    : `مفعّل بالكود حتى ${formatDateLabel(expiresAt!, lang)}`
                  : isEn
                    ? 'Activated by Code'
                    : 'مفعّلة بالكود';

              return (
                <div
                  key={theme.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/40 bg-[var(--bg-canvas)] p-3.5"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-amber-500/40"
                      style={{ background: theme.previewBackground }}
                    >
                      <Palette className="h-5 w-5" style={{ color: theme.accent }} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                        {tName}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-amber-500">
                        {accessText}
                      </p>
                    </div>
                  </div>

                  {!isPublicView && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {user && onOpenGiftModal && (
                        <button
                          type="button"
                          onClick={() => onOpenGiftModal({ targetType: 'theme', targetId: theme.id })}
                          title={isEn ? 'Gift or trade with a friend' : 'إهداء أو تبديل لصديق'}
                          aria-label={isEn ? `Gift or trade ${tName}` : `إهداء أو تبديل ${tName}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/55 bg-amber-500/12 text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 shrink-0"
                        >
                          <Gift className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onApplyTheme(theme.id)}
                        disabled={isCurrentTheme}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          isCurrentTheme
                            ? 'border border-amber-500/50 bg-amber-500/15 text-amber-500'
                            : 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                        }`}
                      >
                        {isCurrentTheme
                          ? isEn
                            ? 'Active'
                            : 'مُفعّلة الآن'
                          : isEn
                            ? 'Apply'
                            : 'تطبيق'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Books Section */}
      <div className="mt-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <BookCheck className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
              {isPublicView
                ? isEn
                  ? 'Completed Books'
                  : 'الكتب التي أتمّ قراءتها'
                : isEn
                  ? 'Completed Books'
                  : 'الكتب التي أتممت قراءتها'}
            </h2>
          </div>
          {!isPublicView && (
            <button
              type="button"
              onClick={() => onNavigate('reading')}
              className="text-xs font-semibold text-[var(--accent-primary)] hover:underline whitespace-nowrap shrink-0"
            >
              {copy.navMyReading}
            </button>
          )}
        </div>

        {completedBooks.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 py-10 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              {isPublicView
                ? isEn
                  ? 'No completed books recorded for this account yet.'
                  : 'لم يتم تسجيل كتب مكتملة لهذا الحساب بعد.'
                : isEn
                  ? 'No books finished yet. Reach the end of any book in the reader and it will be recorded here.'
                  : 'لم تُتمم قراءة أي كتاب بعد. عند وصولك لنهاية أي كتاب سيتم تسجيله هنا تلقائياً.'}
            </p>
            {!isPublicView && (
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-4 py-2 text-xs font-medium text-[var(--btn-dark-fg)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)]"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copy.goToCatalog}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => onOpenBook(book)}
                className={`flex items-center gap-3.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5 ${
                  isEn ? 'text-left' : 'text-right'
                } transition-colors hover:border-[var(--accent-primary)]`}
              >
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="h-16 w-12 shrink-0 rounded-sm border border-[var(--border-hairline)] object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-16 w-12 shrink-0 items-center justify-center rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] text-[var(--text-muted)]"
                  >
                    <BookOpen className="h-4 w-4 opacity-60" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                    {book.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 truncate text-xs text-[var(--text-muted)]">
                    <span>{book.author}</span>
                    {book.isAuthorVerified && (
                      <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                    )}
                    <span aria-hidden="true"> · </span>
                    <span>{getSectionDisplayName(book.category, lang, sectionTranslations)}</span>
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[var(--accent-primary)]">
                    {isEn ? 'Completed 100%' : 'مكتمل ١٠٠٪'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Book Submission Studio (Own Profile Only — never shown on Public Read-Only Profile) */}
      {!isPublicView && onSubmitUserBook && onDeleteUserSubmission && (
        <Suspense fallback={<LazyViewFallback lang={lang} compact />}>
          <UserBookSubmissionSection
            user={user}
            userAccount={userAccount}
            books={books}
            sections={sections}
            sectionTranslations={sectionTranslations ?? {}}
            customThemeCodes={customThemeCodes}
            economyConfig={economyConfig}
            userTokensBalance={userAccount?.tokensBalance ?? 0}
            lang={lang}
            onSignIn={onSignIn}
            onOpenBook={onOpenBook}
            onSubmitBook={onSubmitUserBook}
            onDeleteSubmission={onDeleteUserSubmission}
          />
        </Suspense>
      )}

      {/* Account Session & Sign Out Action (Own You Page Only — never shown on Public Read-Only Profile) */}
      {!isPublicView && (
        <div className="mt-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                {isEn ? 'Account & Session' : 'الحساب والجلسة'}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {user
                  ? isEn
                    ? `Signed in as ${email || displayName}`
                    : `مسجّل الدخول حالياً بالحساب: ${email || displayName}`
                  : isEn
                    ? 'You are browsing as a guest.'
                    : 'أنت تتصفح المكتبة حالياً كزائر.'}
              </p>
            </div>

            {user ? (
              <button
                type="button"
                onClick={onRequestSignOut}
                className="inline-flex items-center gap-2 rounded-md border border-red-500/45 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500 hover:text-white whitespace-nowrap shrink-0"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>{isEn ? 'Sign Out' : 'تسجيل الخروج'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>{isEn ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
