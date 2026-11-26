import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  Check,
  Clock,
  FileText,
  Gift,
  Heart,
  Layers,
  Lock,
  LogIn,
  MessageSquareText,
  Pencil,
  Percent,
  Send,
  Sparkles,
  Star,
  Tag,
  User,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { getBookRating } from '../bookRatings';
import {
  formatComingSoonReleaseLabel,
  formatDiscountRemainingLabel,
  formatSeriesPartLabel,
  getEffectiveBookPricing,
  isBookNew,
  toLocalDateTimeInputValue,
  toLocalDateTimeSubmitValue,
  type BookRecord,
  type ReadingProgress,
  type TokenEconomyConfig,
} from '../db/booksDb';
import { getSectionDisplayName, UI_COPY, type AppLanguage } from '../i18n';
import { OwnerBadge, RateBookButton, StarRatingDisplay } from './BookRatingBar';
import { TokenIcon, TokenPriceBadge } from './TokenCoin';

interface BookDetailPageProps {
  book: BookRecord;
  progress?: ReadingProgress;
  isUnlocked: boolean;
  economyConfig?: TokenEconomyConfig;
  isAuthenticated?: boolean;
  lang?: AppLanguage;
  sectionTranslations?: Record<string, string>;
  currentUserUid?: string | null;
  seriesBooks?: BookRecord[];
  onBack: () => void;
  onStartReading: (book: BookRecord) => void;
  onOpenSeries?: (seriesId: string) => void;
  onSelectBook?: (book: BookRecord) => void;
  onOpenAuthorProfile?: (uid: string) => void;
  onToggleFollowAuthor?: (targetUid: string, nextFollow: boolean) => Promise<void>;
  onToggleReviewLike?: (reviewId: string) => Promise<void>;
  onSubmitReview?: (
    bookId: string,
    rating: number,
    comment: string
  ) => Promise<{ ok: boolean; error?: string; isUpdate?: boolean; pendingModeration?: boolean }>;
  onSignIn?: () => Promise<void>;
  onGiftBook?: (book: BookRecord) => void;
  onToggleNotifyMe?: (bookId: string) => void | Promise<void>;
  onPreorderBook?: (bookId: string) => Promise<{ ok: boolean; error?: string }>;
  onRequestPriceChange?: (
    bookId: string,
    tokenPrice: number
  ) => Promise<{ ok: boolean; error?: string }>;
  onUpdateBookDiscount?: (
    bookId: string,
    payload: {
      discountPercent: number | null;
      discountEndsAt?: string | null;
      discountPostReleaseDays?: number | null;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
}

function formatReviewDate(iso: string, lang: AppLanguage): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(ts));
  } catch {
    return iso.slice(0, 10);
  }
}

export const BookDetailPage: React.FC<BookDetailPageProps> = ({
  book,
  progress,
  isUnlocked,
  economyConfig,
  isAuthenticated = false,
  lang = 'ar',
  sectionTranslations,
  currentUserUid,
  seriesBooks = [],
  onBack,
  onStartReading,
  onOpenSeries,
  onSelectBook,
  onOpenAuthorProfile,
  onToggleFollowAuthor,
  onToggleReviewLike,
  onSubmitReview,
  onSignIn,
  onGiftBook,
  onToggleNotifyMe,
  onPreorderBook,
  onRequestPriceChange,
  onUpdateBookDiscount,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [likingReviewId, setLikingReviewId] = useState<string | null>(null);
  const [notifyPending, setNotifyPending] = useState(false);
  const [preorderPending, setPreorderPending] = useState(false);
  const [preorderFeedback, setPreorderFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>('');
  const [priceSubmitting, setPriceSubmitting] = useState(false);
  const [priceFeedback, setPriceFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [discountPctDraft, setDiscountPctDraft] = useState<string>('20');
  const [discountDurationMode, setDiscountDurationMode] = useState<
    'open' | 'days' | 'months' | 'datetime' | 'post_release_days'
  >('open');
  const [discountDurationCount, setDiscountDurationCount] = useState<string>('7');
  const [discountPostReleaseDaysDraft, setDiscountPostReleaseDaysDraft] = useState<string>('2');
  const [discountEndDatetime, setDiscountEndDatetime] = useState<string>('');
  const [discountSubmitting, setDiscountSubmitting] = useState(false);
  const [discountFeedback, setDiscountFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const isEn = lang === 'en';
  const copy = UI_COPY[lang];
  const sectionLabel = getSectionDisplayName(book.category, lang, sectionTranslations);

  const isComingSoon = Boolean(book.isComingSoon);
  const isPendingReview = book.reviewStatus === 'pending';
  const isRejectedReview = book.reviewStatus === 'rejected';
  const comingSoonReleaseLabel = formatComingSoonReleaseLabel(book, lang);
  const isPremium = Boolean(book.isPremium);
  const isLocked = Boolean(isPremium && !isUnlocked && !isPendingReview);
  const pricing = getEffectiveBookPricing(book, economyConfig?.defaultPremiumBookPrice ?? 40);
  const bookTokenPrice = pricing.finalPrice;
  const baseTokenPrice = pricing.basePrice;
  const isNew = isBookNew(book);
  const isFlipBook = book.bookType === 'pdf' || book.bookType === 'word';
  const reviews = book.reviews ?? [];
  const averageRating = getBookRating(book);
  const myExistingReview = currentUserUid
    ? reviews.find((r) => r.reviewerUid === currentUserUid)
    : undefined;
  const myTrackedReview = book.myPendingReview ?? myExistingReview;
  const [reviewRating, setReviewRating] = useState<number>(myTrackedReview?.rating ?? 5);
  const [reviewComment, setReviewComment] = useState<string>(myTrackedReview?.comment ?? '');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  useEffect(() => {
    setReviewRating(myTrackedReview?.rating ?? 5);
    setReviewComment(myTrackedReview?.comment ?? '');
    setReviewFeedback(null);
    setPriceDraft(String(book.pendingTokenPrice ?? baseTokenPrice));
    setPriceFeedback(null);
    setDiscountPctDraft(
      pricing.hasDiscount && pricing.discountPercent ? String(pricing.discountPercent) : '20'
    );
    if (
      isComingSoon &&
      pricing.hasDiscount &&
      typeof pricing.discountPostReleaseDays === 'number' &&
      pricing.discountPostReleaseDays >= 1
    ) {
      setDiscountDurationMode('post_release_days');
      setDiscountPostReleaseDaysDraft(String(pricing.discountPostReleaseDays));
      setDiscountEndDatetime('');
    } else if (pricing.hasDiscount && pricing.discountEndsAt) {
      setDiscountDurationMode('datetime');
      setDiscountEndDatetime(toLocalDateTimeInputValue(pricing.discountEndsAt));
      setDiscountPostReleaseDaysDraft('2');
    } else {
      setDiscountDurationMode('open');
      setDiscountEndDatetime('');
      setDiscountPostReleaseDaysDraft('2');
    }
    setDiscountDurationCount('7');
    setDiscountFeedback(null);
    setPreorderFeedback(null);
  }, [
    book.id,
    isComingSoon,
    myTrackedReview?.id,
    myTrackedReview?.rating,
    myTrackedReview?.comment,
    book.pendingTokenPrice,
    baseTokenPrice,
    pricing.hasDiscount,
    pricing.discountPercent,
    pricing.discountEndsAt,
    pricing.discountPostReleaseDays,
  ]);

  const orderedSeriesBooks =
    book.seriesId && seriesBooks.length > 1
      ? [...seriesBooks].sort((a, b) => (a.partNumber ?? 999) - (b.partNumber ?? 999))
      : [];
  const hasSeries = Boolean(book.seriesId && orderedSeriesBooks.length > 1);
  const currentSeriesPartNum =
    book.partNumber ??
    (hasSeries ? orderedSeriesBooks.findIndex((b) => b.id === book.id) + 1 || 1 : null);

  const totalUnits = isFlipBook
    ? Math.max(1, book.pdfPageCount ?? book.pages ?? 1)
    : Math.max(1, book.chapters.length);
  const progressPct = progress
    ? Math.min(
        100,
        Math.round(((progress.chapterIndex + (progress.scrollRatio || 0.15)) / totalUnits) * 100)
      )
    : 0;

  const reviewsCountText =
    reviews.length === 0
      ? isEn
        ? 'No ratings yet'
        : 'بدون تقييمات بعد'
      : reviews.length === 1
        ? copy.bookDetailOneReview
        : `${reviews.length} ${copy.bookDetailReviewsCount}`;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8 lg:py-12">
      {/* Top Back Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          {isEn ? (
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{copy.bookDetailBack}</span>
        </button>

        <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
          {copy.versionLabel}
          {isEn ? '' : ' '}
          {book.version}
        </span>
      </div>

      {/* Main Book Showcase Card */}
      <div
        className={`rounded-xl border bg-[var(--bg-surface)] p-6 shadow-sm lg:p-8 ${
          isPremium ? 'border-amber-500/40' : 'border-[var(--border-hairline)]'
        }`}
      >
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
          {/* Rectangular Side Book Cover */}
          <div className="md:col-span-4 lg:col-span-3">
            <div
              className={`group relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-md border bg-[var(--bg-surface-alt)] shadow-md ${
                isPremium ? 'border-amber-500/50' : 'border-[var(--border-hairline)]'
              }`}
            >
              {book.coverUrl && !imgFailed ? (
                <img
                  src={book.coverUrl}
                  alt={isEn ? `${book.title} cover` : `غلاف كتاب ${book.title}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className={`h-full w-full object-cover ${
                    isLocked || isComingSoon ? 'brightness-[0.82]' : ''
                  }`}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                  <BookOpen className="mb-3 h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />
                  <span className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                    {book.title}
                  </span>
                  <span className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                    <span>{book.author}</span>
                    {book.isAuthorVerified && (
                      <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                    )}
                  </span>
                </div>
              )}

              {isPendingReview && (
                <span className="pointer-events-none absolute top-3 start-3 z-20 inline-flex items-center rounded-md border border-amber-300/70 bg-stone-950/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 shadow-md">
                  {isEn ? 'Pending Review' : 'في انتظار المراجعة'}
                </span>
              )}

              {!isPendingReview && isNew && (
                <span className="pointer-events-none absolute top-3 start-3 z-10 inline-flex items-center rounded-md border border-white/25 bg-[var(--accent-primary)] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[var(--accent-fg)] shadow-md">
                  {copy.newBadge}
                </span>
              )}

              {isPremium && (
                <span
                  aria-label="VIP"
                  className="pointer-events-none absolute top-3 end-3 z-10 inline-flex items-center justify-center rounded-md border border-amber-200/90 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 px-2.5 py-0.5 font-mono-tabular text-xs font-extrabold tracking-widest text-stone-950 shadow-md"
                >
                  VIP
                </span>
              )}

              {!isPendingReview &&
                !isRejectedReview &&
                isPremium &&
                pricing.hasDiscount && (
                  <span className="pointer-events-none absolute bottom-3 start-3 z-20 inline-flex items-center rounded-md border border-rose-200/60 bg-rose-600 px-2.5 py-0.5 font-mono-tabular text-xs font-extrabold text-white shadow-md">
                    {isEn ? `SALE -${pricing.discountPercent}%` : `سيل -${pricing.discountPercent}%`}
                  </span>
                )}

              {isComingSoon && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/45 px-4 text-center backdrop-blur-[1px]">
                  <span className="rounded-md border border-white/30 bg-stone-950/85 px-4 py-1.5 font-mono-tabular text-sm font-extrabold uppercase tracking-[0.18em] text-amber-300 shadow-lg">
                    Coming Soon
                  </span>
                  {comingSoonReleaseLabel && (
                    <span className="inline-flex items-center gap-1 rounded bg-stone-950/80 px-2.5 py-1 text-xs font-medium text-white/95 shadow">
                      <Calendar className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                      {comingSoonReleaseLabel}
                    </span>
                  )}
                </div>
              )}

              {!isComingSoon && isLocked && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-300/80 bg-stone-950/85 text-amber-400 shadow-xl">
                    <Lock className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Book Info Column */}
          <div className="flex flex-col justify-between space-y-6 md:col-span-8 lg:col-span-9">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 font-semibold text-[var(--accent-primary)]">
                  {sectionLabel}
                </span>
                {isComingSoon ? (
                  <span className="inline-flex items-center gap-1 rounded border border-amber-500/45 bg-amber-500/12 px-2.5 py-1 font-semibold text-amber-500">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {comingSoonReleaseLabel
                      ? isEn
                        ? `Coming Soon · ${comingSoonReleaseLabel}`
                        : `قريباً · ${comingSoonReleaseLabel}`
                      : isEn
                        ? 'Coming Soon'
                        : 'قريباً'}
                  </span>
                ) : (
                  <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-muted)]">
                    {book.bookType === 'pdf'
                      ? copy.pdfBookLabel
                      : book.bookType === 'word'
                        ? copy.wordBookLabel
                        : isEn
                          ? 'Digital Text Edition'
                          : 'كتاب نصي رقمي'}
                  </span>
                )}
                {isPendingReview && (
                  <span className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-500/15 px-2.5 py-1 font-bold text-amber-600 dark:text-amber-400">
                    {isEn
                      ? 'Pending Developer Review · Visible only to you'
                      : 'في انتظار المراجعة · ظاهر لك وحدك'}
                  </span>
                )}
                {isRejectedReview && (
                  <span className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-500/15 px-2.5 py-1 font-bold text-rose-500">
                    {isEn ? 'Submission Declined' : 'طلب النشر مرفوض'}
                  </span>
                )}
                {isPremium && (
                  <>
                    <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-600 dark:text-amber-400">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      {copy.premiumLabel}
                    </span>
                    {isLocked && (
                      <TokenPriceBadge
                        amount={pricing.finalPrice}
                        originalAmount={pricing.hasDiscount ? pricing.basePrice : null}
                        discountPercent={pricing.hasDiscount ? pricing.discountPercent : null}
                        lang={lang}
                        size="sm"
                      />
                    )}
                  </>
                )}
                {hasSeries && currentSeriesPartNum && (
                  <span className="inline-flex items-center gap-1 rounded border border-[var(--accent-primary)]/45 bg-[var(--accent-primary)]/10 px-2.5 py-1 font-semibold text-[var(--accent-primary)]">
                    <Layers className="h-3 w-3" aria-hidden="true" />
                    {isEn
                      ? `${formatSeriesPartLabel(currentSeriesPartNum, lang)} of ${orderedSeriesBooks.length}`
                      : `${formatSeriesPartLabel(currentSeriesPartNum, lang)} من ${orderedSeriesBooks.length}`}
                  </span>
                )}
              </div>

              <div>
                <h1 className="font-editorial text-3xl font-bold leading-tight text-[var(--text-ink)] sm:text-4xl [text-wrap:balance]">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="mt-2 text-base font-medium text-[var(--text-muted)]">
                    {book.subtitle}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold text-[var(--text-ink)]">
                <span className="font-normal text-[var(--text-muted)]">
                  {isEn ? 'Author: ' : 'تأليف: '}
                </span>
                {book.authorAccount && onOpenAuthorProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenAuthorProfile(book.authorAccount!.uid)}
                      className="group inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 text-sm font-semibold text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)]"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--accent-primary)]"
                      >
                        <User className="h-3 w-3" />
                      </span>
                      <span className="group-hover:text-[var(--accent-primary)]">
                        {book.authorAccount.displayName}
                      </span>
                      {(book.authorAccount.isVerified || book.isAuthorVerified) && (
                        <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
                      )}
                      <span className="text-[11px] font-normal text-[var(--text-muted)]">
                        · {isEn ? 'View Account' : 'عرض الحساب'}
                      </span>
                    </button>

                    {book.authorAccount.uid !== currentUserUid && onToggleFollowAuthor && (
                      <button
                        type="button"
                        disabled={followPending}
                        onClick={async () => {
                          setFollowPending(true);
                          try {
                            await onToggleFollowAuthor(
                              book.authorAccount!.uid,
                              !book.authorAccount!.isFollowing
                            );
                          } finally {
                            setFollowPending(false);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 ${
                          book.authorAccount.isFollowing
                            ? 'border border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500'
                            : 'bg-[var(--accent-primary)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]'
                        }`}
                      >
                        {book.authorAccount.isFollowing ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              {isEn
                                ? `Following (${book.authorAccount.followersCount})`
                                : `تتابعه (${book.authorAccount.followersCount})`}
                            </span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              {isEn
                                ? `Follow (${book.authorAccount.followersCount})`
                                : `متابعة (${book.authorAccount.followersCount})`}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span>{book.author}</span>
                    {book.isAuthorVerified && (
                      <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>

              {/* Average Rating Summary Strip */}
              <div className="inline-flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-2.5">
                <StarRatingDisplay rating={averageRating} lang={lang} />
                <span className="text-xs text-[var(--text-muted)]" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {reviewsCountText}
                </span>
              </div>

              {/* Book Details Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5">
                  <Calendar className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isEn ? 'Publication Year' : 'سنة الإصدار'}
                    </p>
                    <p className="font-mono-tabular text-sm font-bold text-[var(--text-ink)]">
                      {book.year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5">
                  {isFlipBook ? (
                    <FileText className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
                  ) : (
                    <Layers className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isFlipBook
                        ? isEn
                          ? 'Total Pages'
                          : 'عدد الصفحات'
                        : isEn
                          ? 'Chapters & Pages'
                          : 'الفصول والصفحات'}
                    </p>
                    <p className="font-mono-tabular text-sm font-bold text-[var(--text-ink)]">
                      {isComingSoon && (isFlipBook ? !book.pdfId : book.chapters.length === 0)
                        ? isEn
                          ? 'In preparation'
                          : 'قيد الإعداد'
                        : isFlipBook
                          ? `${book.pdfPageCount ?? book.pages} ${copy.pagesUnit}`
                          : `${book.chapters.length} ${copy.chaptersWord} · ${book.pages} ${copy.pagesUnit}`}
                    </p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-2.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 sm:col-span-1">
                  <Clock className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isEn ? 'Estimated Reading' : 'مدة القراءة المقدرة'}
                    </p>
                    <p className="font-mono-tabular text-sm font-bold text-[var(--text-ink)]">
                      {isComingSoon && book.readingMinutes <= 0
                        ? isEn
                          ? 'TBA'
                          : 'يُحدّد لاحقاً'
                        : `${book.readingMinutes} ${copy.readingMinutesWord}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prominent Notched Paper Coupon Ticket Sale Card */}
              {!isPendingReview &&
                !isRejectedReview &&
                isPremium &&
                pricing.hasDiscount && (
                  <div
                    role="region"
                    aria-label={isEn ? 'Active Sale Discount' : 'عرض سيل وخصم نشط'}
                    className="relative overflow-hidden rounded-lg border-2 border-dashed border-rose-500/70 bg-gradient-to-br from-rose-500/[0.12] via-amber-500/[0.08] to-rose-600/[0.12] px-5 py-3.5 shadow-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 -start-3 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-rose-500/70 bg-[var(--bg-surface)]"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 -end-3 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-rose-500/70 bg-[var(--bg-surface)]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center rounded-md border-2 border-rose-400/80 bg-rose-600 px-3 py-1.5 text-white shadow-inner">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider opacity-95">
                            <Tag className="h-3 w-3" aria-hidden="true" />
                            {isEn ? 'SALE' : 'سيل'}
                          </span>
                          <span
                            dir="ltr"
                            className="font-mono-tabular text-lg font-black leading-none tracking-tight"
                          >
                            -{pricing.discountPercent}%
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                            <Percent className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              {isComingSoon
                                ? isEn
                                  ? 'Pre-Order Launch Sale'
                                  : 'عرض خصم الطلب المسبق (بري أوردر)'
                                : isEn
                                  ? 'Limited-Time Book Sale'
                                  : 'عرض سيل وخصم خاص على الكتاب'}
                            </span>
                          </p>
                          <p className="text-[11px] font-medium text-[var(--text-muted)]">
                            {formatDiscountRemainingLabel(pricing.discountEndsAt, lang, {
                              isComingSoon,
                              discountPostReleaseDays: pricing.discountPostReleaseDays,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-md border border-dashed border-amber-500/50 bg-[var(--bg-canvas)]/90 px-3 py-1.5">
                        <span
                          dir="ltr"
                          className="relative inline-flex items-center gap-1 font-mono-tabular text-sm font-bold text-[var(--text-muted)] opacity-80"
                        >
                          <TokenIcon className="h-3.5 w-3.5 opacity-60" />
                          <span>{pricing.basePrice}</span>
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-[2px] -translate-y-1/2 -rotate-12 rounded-full bg-rose-500"
                          />
                        </span>
                        <span aria-hidden="true" className="text-xs font-bold text-[var(--text-muted)]">
                          →
                        </span>
                        <span
                          dir="ltr"
                          className="inline-flex items-center gap-1 font-mono-tabular text-base font-black text-amber-500"
                        >
                          <TokenIcon className="h-4 w-4" />
                          <span>{pricing.finalPrice}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Synopsis */}
              {book.synopsis && (
                <div className="border-t border-[var(--border-hairline)] pt-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {isEn ? 'About This Book' : 'معلومات ونبذة عن الكتاب'}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--text-ink)]">
                    {book.synopsis}
                  </p>
                </div>
              )}

              {/* Saved Reading Progress */}
              {!isLocked && progress && (
                <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5">
                  <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>
                      {isFlipBook
                        ? `${copy.continueFromPage} ${progress.chapterIndex + 1}`
                        : `${copy.continueFromChapter} ${book.chapters[progress.chapterIndex]?.number ?? '01'}`}
                    </span>
                    <span className="font-mono-tabular font-semibold text-[var(--accent-primary)]">
                      {progressPct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-alt)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent-primary)] transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Connected Series Switcher */}
              {hasSeries && (
                <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-primary)]">
                      <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        {book.seriesTitle?.trim() ||
                          orderedSeriesBooks[0]?.seriesTitle?.trim() ||
                          orderedSeriesBooks[0]?.title}
                      </span>
                    </div>
                    {onOpenSeries && book.seriesId && (
                      <button
                        type="button"
                        onClick={() => onOpenSeries(book.seriesId!)}
                        className="text-xs font-semibold text-[var(--accent-primary)] hover:underline whitespace-nowrap"
                      >
                        {isEn
                          ? `View all ${orderedSeriesBooks.length} parts side-by-side →`
                          : `عرض جميع الأجزاء (${orderedSeriesBooks.length}) في صفحة واحدة ←`}
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {orderedSeriesBooks.map((part, idx) => {
                      const isCurrentPart = part.id === book.id;
                      const partLabel = formatSeriesPartLabel(part.partNumber ?? idx + 1, lang);
                      return (
                        <button
                          key={part.id}
                          type="button"
                          disabled={isCurrentPart}
                          onClick={() => onSelectBook?.(part)}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                            isCurrentPart
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] font-semibold text-[var(--accent-fg)]'
                              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-ink)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                          }`}
                        >
                          <span className="font-bold">{partLabel}</span>
                          <span className="opacity-50" aria-hidden="true">·</span>
                          <span className="max-w-[140px] truncate">{part.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-hairline)] pt-5">
              {isPendingReview || isRejectedReview ? (
                <>
                  {(!isComingSoon || book.chapters.length > 0 || book.pdfId) && (
                    <button
                      type="button"
                      onClick={() => onStartReading(book)}
                      className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-6 py-3 text-sm font-semibold text-[var(--btn-dark-fg)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
                    >
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {isEn
                          ? 'Preview Draft Content'
                          : isFlipBook
                            ? 'معاينة صفحات الملف'
                            : 'معاينة محتوى الكتاب'}
                      </span>
                    </button>
                  )}
                  <span
                    className={`rounded-md border px-4 py-2.5 text-xs font-semibold ${
                      isRejectedReview
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isRejectedReview
                      ? isEn
                        ? 'Not approved — edit & resubmit in your Profile'
                        : 'غير مقبول — يمكنك تعديله وإعادة إرساله من ملفك الشخصي'
                      : isEn
                        ? 'Waiting for developer approval before public release'
                        : 'في انتظار موافقة المطور ليصبح متاحاً لجميع القراء'}
                  </span>
                </>
              ) : isComingSoon ? (
                <div className="flex w-full flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {isPremium && bookTokenPrice > 0 && !(currentUserUid && book.authorUid === currentUserUid) && (
                      book.isPreordered || !isLocked ? (
                        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/60 bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {isEn
                              ? 'Pre-Ordered ✓ — Unlocks automatically on launch'
                              : 'تم الطلب المسبق ✓ — سيُفتح تلقائياً فور النشر'}
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={preorderPending || !onPreorderBook}
                          onClick={async () => {
                            if (!onPreorderBook) return;
                            setPreorderPending(true);
                            setPreorderFeedback(null);
                            try {
                              const res = await onPreorderBook(book.id);
                              if (res.ok) {
                                setPreorderFeedback({
                                  type: 'ok',
                                  text: isEn
                                    ? 'Pre-order confirmed! The book will unlock automatically in your library when released.'
                                    : 'تم تأكيد الطلب المسبق بنجاح! سيُفتح الكتاب تلقائياً في مكتبتك فور نزوله.',
                                });
                              } else {
                                setPreorderFeedback({
                                  type: 'err',
                                  text:
                                    res.error ??
                                    (isEn ? 'Could not complete pre-order.' : 'تعذّر إتمام الطلب المسبق.'),
                                });
                              }
                            } finally {
                              setPreorderPending(false);
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-3 text-sm font-bold text-stone-950 shadow-sm transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0 disabled:opacity-60"
                        >
                          <Sparkles className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {preorderPending
                              ? isEn
                                ? 'Processing...'
                                : 'جاري الطلب المسبق...'
                              : isEn
                                ? 'Pre-Order'
                                : 'طلب مسبق (بري أوردر)'}
                          </span>
                          {pricing.hasDiscount && (
                            <span
                              dir="ltr"
                              className="relative inline-flex items-center font-mono-tabular text-xs font-bold text-stone-900/70"
                            >
                              <span>{pricing.basePrice}</span>
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-[2px] -translate-y-1/2 -rotate-12 bg-rose-700"
                              />
                            </span>
                          )}
                          <TokenIcon className="h-4 w-4" />
                          <span dir="ltr" className="font-mono-tabular font-extrabold">
                            {bookTokenPrice}
                          </span>
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={notifyPending || !onToggleNotifyMe}
                      onClick={async () => {
                        if (!onToggleNotifyMe) return;
                        setNotifyPending(true);
                        try {
                          await onToggleNotifyMe(book.id);
                        } finally {
                          setNotifyPending(false);
                        }
                      }}
                      aria-pressed={Boolean(book.isNotifySubscribed)}
                      className={`inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 ${
                        book.isNotifySubscribed
                          ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                          : isPremium && bookTokenPrice > 0
                            ? 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                            : 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]'
                      }`}
                    >
                      {book.isNotifySubscribed ? (
                        <>
                          <BellRing className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {isEn
                              ? 'Notification Active ✓'
                              : 'تم تفعيل الإشعار ✓'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {isEn ? 'Notify Me When Published' : 'ذكّرني بإشعار عند النشر'}
                          </span>
                        </>
                      )}
                    </button>

                    {(book.preordersCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 font-mono-tabular text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {isEn
                          ? `${book.preordersCount} pre-ordered`
                          : `${book.preordersCount} طلب مسبق`}
                      </span>
                    )}
                  </div>

                  {preorderFeedback && (
                    <p
                      role="status"
                      className={`text-xs font-semibold ${
                        preorderFeedback.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {preorderFeedback.text}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartReading(book)}
                  className={`inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isLocked
                      ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                      : 'bg-[var(--btn-dark)] text-[var(--btn-dark-fg)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)]'
                  }`}
                >
                  {isLocked ? (
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    {isLocked ? (
                      <>
                        <span>{isEn ? 'Unlock with Code or' : 'تفعيل بالكود أو'}</span>
                        {pricing.hasDiscount && (
                          <span
                            dir="ltr"
                            className="relative inline-flex items-center font-mono-tabular text-xs font-bold text-stone-900/70"
                          >
                            <span>{pricing.basePrice}</span>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-[2px] -translate-y-1/2 -rotate-12 bg-rose-700"
                            />
                          </span>
                        )}
                        <TokenIcon className="h-4 w-4" />
                        <span className="font-mono-tabular font-bold">{bookTokenPrice}</span>
                      </>
                    ) : progress ? (
                      copy.continueReadingBtn
                    ) : isFlipBook ? (
                      copy.browsePages
                    ) : (
                      copy.startReadingBtn
                    )}
                  </span>
                </button>
              )}

              {!isComingSoon && !isPendingReview && !isRejectedReview && (
                <RateBookButton
                  bookTitle={book.title}
                  lang={lang}
                  size="lg"
                  className="bg-[var(--bg-canvas)]"
                  onRate={() => {
                    document
                      .getElementById('book-review-form')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    window.setTimeout(() => {
                      document.getElementById('book-review-comment')?.focus();
                    }, 350);
                  }}
                />
              )}

              {!isComingSoon && !isPendingReview && !isRejectedReview && isPremium && onGiftBook && (
                <button
                  type="button"
                  onClick={() => onGiftBook(book)}
                  title={isEn ? 'Gift or trade with a friend' : 'إهداء أو تبديل لصديق'}
                  aria-label={isEn ? `Gift or trade ${book.title}` : `إهداء أو تبديل ${book.title}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-amber-500/60 bg-amber-500/12 text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 shrink-0"
                >
                  <Gift className="h-5 w-5" aria-hidden="true" />
                </button>
              )}

              {hasSeries && book.seriesId && onOpenSeries && (
                <button
                  type="button"
                  onClick={() => onOpenSeries(book.seriesId!)}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--accent-primary)]/55 bg-[var(--accent-primary)]/10 px-4 py-3 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
                >
                  <Layers className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isEn
                      ? `All Parts Page (${orderedSeriesBooks.length})`
                      : `صفحة كل الأجزاء (${orderedSeriesBooks.length})`}
                  </span>
                </button>
              )}
            </div>

            {currentUserUid &&
              book.authorUid === currentUserUid &&
              isPremium &&
              book.reviewStatus === 'approved' &&
              onRequestPriceChange && (
                <div className="mt-4 rounded-lg border border-amber-500/40 bg-[var(--bg-canvas)] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-ink)]">
                      <Pencil className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                      <span>
                        {isEn
                          ? 'Author Price Settings (Developer Approval Required)'
                          : 'سعر كتابك البريميوم (يُرسل للمطور للموافقة)'}
                      </span>
                    </div>
                    <TokenPriceBadge
                      amount={pricing.finalPrice}
                      originalAmount={pricing.hasDiscount ? pricing.basePrice : null}
                      discountPercent={pricing.hasDiscount ? pricing.discountPercent : null}
                      lang={lang}
                      size="xs"
                    />
                  </div>

                  {book.priceReviewStatus === 'pending' &&
                    typeof book.pendingTokenPrice === 'number' && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                        <span className="font-semibold">
                          {isEn
                            ? 'Pending price request awaiting developer approval:'
                            : 'طلب تعديل السعر بانتظار موافقة المطور:'}
                        </span>
                        <TokenPriceBadge amount={book.pendingTokenPrice} lang={lang} size="xs" />
                      </div>
                    )}

                  {book.priceReviewStatus === 'rejected' && (
                    <p className="rounded border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-500">
                      {isEn ? 'Previous price request was declined' : 'تم رفض طلب تعديل السعر السابق'}
                      {book.priceReviewNote ? `: ${book.priceReviewNote}` : ''}
                    </p>
                  )}

                  {priceFeedback && (
                    <p
                      role="status"
                      className={`text-xs font-semibold ${
                        priceFeedback.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {priceFeedback.text}
                    </p>
                  )}

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const val = Math.max(0, Math.min(100000, Math.floor(Number(priceDraft))));
                      if (!Number.isFinite(val) || priceDraft.trim() === '') return;
                      setPriceSubmitting(true);
                      setPriceFeedback(null);
                      try {
                        const res = await onRequestPriceChange(book.id, val);
                        if (res.ok) {
                          setPriceFeedback({
                            type: 'ok',
                            text: isEn
                              ? 'New price sent to developer for approval.'
                              : 'تم إرسال السعر الجديد للمطور للموافقة عليه.',
                          });
                        } else {
                          setPriceFeedback({
                            type: 'err',
                            text:
                              res.error ??
                              (isEn ? 'Could not submit price change.' : 'تعذّر إرسال طلب تعديل السعر.'),
                          });
                        }
                      } finally {
                        setPriceSubmitting(false);
                      }
                    }}
                    className="flex flex-wrap items-center gap-2"
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
                      className="w-28 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-center font-mono-tabular text-sm font-bold text-amber-500 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={priceSubmitting}
                      className="rounded-md bg-amber-500 px-4 py-1.5 text-xs font-semibold text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                    >
                      {priceSubmitting
                        ? isEn
                          ? 'Sending...'
                          : 'جاري الإرسال...'
                        : isEn
                          ? 'Request Price Change'
                          : 'إرسال السعر للمطور للموافقة'}
                    </button>
                  </form>
                </div>
              )}

            {/* Self-Service Book Sale Discount Controls (Instant — No Developer Approval Required) */}
            {currentUserUid &&
              book.authorUid === currentUserUid &&
              isPremium &&
              book.reviewStatus === 'approved' &&
              onUpdateBookDiscount && (
                <div className="mt-4 rounded-lg border-2 border-dashed border-rose-500/45 bg-[var(--bg-canvas)] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-ink)]">
                      <Tag className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                      <span>
                        {isEn
                          ? 'Instant Sale Discount (No Approval Needed)'
                          : 'إدارة خصم السيل الفوري (مفتوح بدون موافقة المطور)'}
                      </span>
                    </div>
                    {pricing.hasDiscount && (
                      <span className="rounded bg-rose-600 px-2 py-0.5 font-mono-tabular text-[11px] font-extrabold text-white">
                        {isEn ? `ACTIVE -${pricing.discountPercent}%` : `سيل نشط -${pricing.discountPercent}%`}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[10, 20, 30, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDiscountPctDraft(String(preset))}
                        className={`rounded border px-2.5 py-1 font-mono-tabular text-xs font-bold transition-colors ${
                          Number(discountPctDraft) === preset
                            ? 'border-rose-500 bg-rose-600 text-white'
                            : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-ink)] hover:border-rose-500/60'
                        }`}
                      >
                        -{preset}%
                      </button>
                    ))}

                    <div className="flex items-center gap-1 ms-1">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={discountPctDraft}
                        onChange={(e) => setDiscountPctDraft(e.target.value)}
                        aria-label={isEn ? 'Discount percentage' : 'نسبة الخصم المئوية'}
                        dir="ltr"
                        className="w-16 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-center font-mono-tabular text-xs font-bold text-rose-500 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="font-mono-tabular text-xs font-bold text-[var(--text-muted)]">
                        %
                      </span>
                    </div>

                    {(() => {
                      const pctNum = Math.floor(Number(discountPctDraft));
                      if (!Number.isFinite(pctNum) || pctNum < 1 || pctNum > 99) return null;
                      const previewPrice = Math.max(
                        0,
                        Math.round(baseTokenPrice * (1 - pctNum / 100))
                      );
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-xs">
                          <span className="text-[var(--text-muted)]">
                            {isEn ? 'After sale:' : 'السعر بعد الخصم:'}
                          </span>
                          <span
                            dir="ltr"
                            className="relative font-mono-tabular text-[11px] font-semibold text-[var(--text-muted)]"
                          >
                            {baseTokenPrice}
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-[1.5px] -translate-y-1/2 -rotate-12 bg-rose-500"
                            />
                          </span>
                          <span aria-hidden="true">→</span>
                          <TokenIcon className="h-3.5 w-3.5" />
                          <span dir="ltr" className="font-mono-tabular font-black text-amber-500">
                            {previewPrice}
                          </span>
                        </span>
                      );
                    })()}
                  </div>

                  {/* Duration Mode Controls */}
                  <div className="space-y-2 border-t border-[var(--border-hairline)] pt-2.5">
                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                      {isEn ? 'Sale Duration:' : 'مدة السيل:'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {(
                        [
                          { id: 'open', ar: 'مفتوح حتى أوقفه', en: 'Open until I stop it' },
                          ...(isComingSoon
                            ? ([
                                {
                                  id: 'post_release_days',
                                  ar: 'يستمر بعد النشر (أيام)',
                                  en: 'Keep active after launch (days)',
                                },
                              ] as const)
                            : []),
                          { id: 'days', ar: 'عدد أيام', en: 'Days' },
                          { id: 'months', ar: 'عدد أشهر', en: 'Months' },
                          { id: 'datetime', ar: 'ميعاد محدد', en: 'Specific end date/time' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDiscountDurationMode(opt.id)}
                          className={`rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            discountDurationMode === opt.id
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-ink)] hover:border-[var(--accent-primary)]'
                          }`}
                        >
                          {isEn ? opt.en : opt.ar}
                        </button>
                      ))}
                    </div>

                    {discountDurationMode === 'post_release_days' && isComingSoon && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={discountPostReleaseDaysDraft}
                          onChange={(e) => setDiscountPostReleaseDaysDraft(e.target.value)}
                          dir="ltr"
                          className="w-20 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-center font-mono-tabular text-xs font-bold text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                        <span className="text-xs text-[var(--text-muted)]">
                          {isEn
                            ? 'days after release (also applies to all pre-orders)'
                            : 'يوم بعد صدور الكتاب (ويشمل جميع الطلبات المسبقة)'}
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 7].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDiscountPostReleaseDaysDraft(String(d))}
                              className={`rounded border px-2 py-0.5 font-mono-tabular text-[11px] ${
                                discountPostReleaseDaysDraft === String(d)
                                  ? 'border-rose-500 bg-rose-500/15 font-bold text-rose-500'
                                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                              }`}
                            >
                              {isEn ? `${d}d` : `${d}ي`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(discountDurationMode === 'days' || discountDurationMode === 'months') && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={discountDurationMode === 'days' ? 365 : 24}
                          value={discountDurationCount}
                          onChange={(e) => setDiscountDurationCount(e.target.value)}
                          dir="ltr"
                          className="w-24 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-center font-mono-tabular text-xs font-bold text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                        <span className="text-xs text-[var(--text-muted)]">
                          {discountDurationMode === 'days'
                            ? isEn
                              ? 'days from now'
                              : 'يوم من الآن'
                            : isEn
                              ? 'months from now'
                              : 'شهر من الآن'}
                        </span>
                      </div>
                    )}

                    {discountDurationMode === 'datetime' && (
                      <input
                        type="datetime-local"
                        value={discountEndDatetime}
                        onChange={(e) => setDiscountEndDatetime(e.target.value)}
                        dir="ltr"
                        className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono-tabular text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    )}
                  </div>

                  {discountFeedback && (
                    <p
                      role="status"
                      className={`text-xs font-semibold ${
                        discountFeedback.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {discountFeedback.text}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={discountSubmitting}
                      onClick={async () => {
                        const pct = Math.floor(Number(discountPctDraft));
                        if (!Number.isFinite(pct) || pct < 1 || pct > 99) {
                          setDiscountFeedback({
                            type: 'err',
                            text: isEn
                              ? 'Enter a discount percentage between 1 and 99.'
                              : 'أدخل نسبة خصم صحيحة بين 1% و 99%.',
                          });
                          return;
                        }

                        let endsAtIso: string | null = null;
                        let postReleaseDays: number | null = null;
                        if (discountDurationMode === 'post_release_days' && isComingSoon) {
                          postReleaseDays = Math.max(
                            1,
                            Math.min(365, Math.floor(Number(discountPostReleaseDaysDraft) || 2))
                          );
                        } else if (discountDurationMode === 'days') {
                          const count = Math.max(1, Math.min(365, Math.floor(Number(discountDurationCount) || 1)));
                          endsAtIso = new Date(Date.now() + count * 24 * 60 * 60 * 1000).toISOString();
                        } else if (discountDurationMode === 'months') {
                          const count = Math.max(1, Math.min(24, Math.floor(Number(discountDurationCount) || 1)));
                          const endDate = new Date();
                          endDate.setMonth(endDate.getMonth() + count);
                          endsAtIso = endDate.toISOString();
                        } else if (discountDurationMode === 'datetime') {
                          const converted = toLocalDateTimeSubmitValue(discountEndDatetime);
                          if (!converted || Date.parse(converted) <= Date.now()) {
                            setDiscountFeedback({
                              type: 'err',
                              text: isEn
                                ? 'Please choose a future end date and time.'
                                : 'يرجى اختيار ميعاد انتهاء مستقبلي صحيح.',
                            });
                            return;
                          }
                          endsAtIso = converted;
                        }

                        setDiscountSubmitting(true);
                        setDiscountFeedback(null);
                        try {
                          const res = await onUpdateBookDiscount(book.id, {
                            discountPercent: pct,
                            discountEndsAt: endsAtIso,
                            discountPostReleaseDays: postReleaseDays,
                          });
                          if (res.ok) {
                            setDiscountFeedback({
                              type: 'ok',
                              text: isEn
                                ? `-${pct}% sale activated immediately!`
                                : `تم تفعيل خصم ${pct}% بنجاح فوراً!`,
                            });
                          } else {
                            setDiscountFeedback({
                              type: 'err',
                              text:
                                res.error ??
                                (isEn ? 'Could not activate sale.' : 'تعذّر تفعيل الخصم.'),
                            });
                          }
                        } finally {
                          setDiscountSubmitting(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
                    >
                      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {discountSubmitting
                          ? isEn
                            ? 'Applying...'
                            : 'جاري التفعيل...'
                          : isEn
                            ? 'Activate Sale Now'
                            : 'تفعيل الخصم (سيل)'}
                      </span>
                    </button>

                    {pricing.hasDiscount && (
                      <button
                        type="button"
                        disabled={discountSubmitting}
                        onClick={async () => {
                          setDiscountSubmitting(true);
                          setDiscountFeedback(null);
                          try {
                            const res = await onUpdateBookDiscount(book.id, {
                              discountPercent: null,
                              discountEndsAt: null,
                              discountPostReleaseDays: null,
                            });
                            if (res.ok) {
                              setDiscountFeedback({
                                type: 'ok',
                                text: isEn
                                  ? 'Sale ended and original price restored.'
                                  : 'تم إيقاف السيل واستعادة السعر الأصلي فوراً.',
                              });
                            } else {
                              setDiscountFeedback({
                                type: 'err',
                                text:
                                  res.error ??
                                  (isEn ? 'Could not end sale.' : 'تعذّر إيقاف الخصم.'),
                              });
                            }
                          } finally {
                            setDiscountSubmitting(false);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-ink)] transition-colors hover:border-rose-500 hover:text-rose-500 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isEn ? 'End Sale Now' : 'إيقاف السيل الآن'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Comments & Individual Ratings Section */}
      <div className="mt-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <MessageSquareText
              className="h-5 w-5 text-[var(--accent-primary)]"
              aria-hidden="true"
            />
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
              {copy.bookDetailReviewsTitle}
            </h2>
            <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono-tabular text-xs font-semibold text-[var(--text-muted)]">
              {reviews.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">{copy.overallRating}:</span>
            <StarRatingDisplay rating={averageRating} lang={lang} />
          </div>
        </div>

        {/* Interactive Reader Rating & Comment Form */}
        {!isComingSoon && !isPendingReview && !isRejectedReview && onSubmitReview && (
          <div
            id="book-review-form"
            className="mt-5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 sm:p-5"
          >
            {!isAuthenticated ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'Sign in with Google to leave a star rating and comment on this book.'
                    : 'سجّل الدخول بحساب Google لتقييم الكتاب وإضافة تعليقك.'}
                </p>
                {onSignIn && (
                  <button
                    type="button"
                    onClick={() => void onSignIn()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]"
                  >
                    <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isEn ? 'Sign in' : 'تسجيل الدخول'}</span>
                  </button>
                )}
              </div>
            ) : currentUserUid && book.authorUid && currentUserUid === book.authorUid ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                <span>
                  {isEn
                    ? 'You are the author of this book — readers can rate & comment here.'
                    : 'أنت مؤلف هذا الكتاب — يظهر هنا تقييمات وتعليقات القراء لكتابك.'}
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <TokenIcon className="h-3.5 w-3.5" />
                  {isEn
                    ? `+${economyConfig?.rewardCommentOnBook ?? 5} per comment · +${economyConfig?.rewardBookRatingAbove4 ?? 25} if rating > 4.0★`
                    : `+${economyConfig?.rewardCommentOnBook ?? 5} لكل تعليق · +${economyConfig?.rewardBookRatingAbove4 ?? 25} عند تقييم أعلى من 4.0★`}
                </span>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const trimmed = reviewComment.trim();
                  if (!trimmed) {
                    setReviewFeedback({
                      type: 'err',
                      text: isEn
                        ? 'Please write a short comment before submitting.'
                        : 'يرجى كتابة تعليقك قبل الإرسال.',
                    });
                    return;
                  }
                  setReviewFeedback(null);
                  setSubmittingReview(true);
                  try {
                    const res = await onSubmitReview(book.id, reviewRating, trimmed);
                    if (res.ok) {
                      setReviewFeedback({
                        type: 'ok',
                        text: isEn
                          ? 'Your rating & comment were sent to the developer for approval before publishing!'
                          : 'تم إرسال تقييمك وتعليقك للمطور للموافقة عليه قبل ظهوره للقراء.',
                      });
                    } else {
                      setReviewFeedback({
                        type: 'err',
                        text:
                          res.error ??
                          (isEn ? 'Could not submit review.' : 'تعذّر إرسال التقييم حالياً.'),
                      });
                    }
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                className="space-y-3"
              >
                {book.myPendingReview?.moderationStatus === 'pending' && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/45 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                    <span>
                      {isEn
                        ? 'Your review is currently waiting for developer approval before appearing publicly. You can still update it below.'
                        : 'تقييمك الحالي في انتظار موافقة المطور ليظهر وسط تقييمات الكتاب، ويمكنك تعديله أدناه.'}
                    </span>
                  </div>
                )}

                {book.myPendingReview?.moderationStatus === 'rejected' && (
                  <div className="flex items-start gap-2 rounded-md border border-rose-500/45 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="font-bold">
                        {isEn
                          ? 'Your previous review was declined by the developer'
                          : 'تم رفض تقييمك السابق من المطور'}
                      </p>
                      {book.myPendingReview.moderationNote && (
                        <p>
                          {isEn ? 'Reason:' : 'سبب الرفض:'} {book.myPendingReview.moderationNote}
                        </p>
                      )}
                      <p className="opacity-85">
                        {isEn
                          ? 'You can edit and resubmit your review below.'
                          : 'يمكنك تعديله وإعادة إرساله للمراجعة مرة أخرى.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[var(--text-ink)]">
                    {myTrackedReview
                      ? isEn
                        ? 'Update Your Rating & Comment'
                        : 'تعديل تقييمك وتعليقك'
                      : isEn
                        ? 'Rate & Comment on This Book'
                        : 'قيّم الكتاب واكتب تعليقك'}
                  </p>
                  <div className="flex items-center gap-1" role="radiogroup" aria-label={isEn ? 'Star rating' : 'التقييم بالنجوم'}>
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const active = starVal <= reviewRating;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setReviewRating(starVal)}
                          aria-label={`${starVal} ${isEn ? 'stars' : 'نجوم'}`}
                          className="rounded p-0.5 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              active
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-[var(--text-muted)] opacity-50'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ms-1.5 font-mono-tabular text-xs font-bold text-amber-600 dark:text-amber-400">
                      {reviewRating}.0
                    </span>
                  </div>
                </div>

                <textarea
                  id="book-review-comment"
                  rows={2}
                  maxLength={1200}
                  value={reviewComment}
                  onChange={(e) => {
                    setReviewComment(e.target.value);
                    if (reviewFeedback) setReviewFeedback(null);
                  }}
                  placeholder={
                    isEn
                      ? 'Share your thoughts about this book...'
                      : 'شارك القراء رأيك وتعليقك حول الكتاب...'
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <TokenIcon className="h-3.5 w-3.5" />
                    {isEn
                      ? `Reviews are approved by the developer · Author earns +${economyConfig?.rewardCommentOnBook ?? 5} & +${economyConfig?.rewardBookRatingAbove4 ?? 25} (>4★)`
                      : `يُراجع التقييم من المطور قبل النشر · ويحصل المؤلف على +${economyConfig?.rewardCommentOnBook ?? 5} و+${economyConfig?.rewardBookRatingAbove4 ?? 25} (+4★)`}
                  </span>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {submittingReview
                        ? isEn
                          ? 'Sending...'
                          : 'جاري الإرسال...'
                        : myTrackedReview
                          ? isEn
                            ? 'Send Updated Review'
                            : 'إرسال التعديل للمطور'
                          : isEn
                            ? 'Send Rating for Approval'
                            : 'إرسال التقييم للمطور'}
                    </span>
                  </button>
                </div>

                {reviewFeedback && (
                  <p
                    role="status"
                    className={`text-xs font-semibold ${
                      reviewFeedback.type === 'ok'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-500'
                    }`}
                  >
                    {reviewFeedback.text}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 py-10 text-center text-sm text-[var(--text-muted)]">
            {copy.bookDetailNoReviews}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {reviews.map((review) => {
              const dateLabel = formatReviewDate(review.createdAt, lang);
              return (
                <article
                  key={review.id}
                  className={`flex flex-col justify-between gap-3 rounded-lg border bg-[var(--bg-canvas)] p-4 ${
                    review.isOwner
                      ? 'border-amber-500/50 shadow-[0_0_20px_-10px_rgba(245,158,11,0.4)]'
                      : 'border-[var(--border-hairline)]'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {review.reviewerUid && onOpenAuthorProfile ? (
                          <button
                            type="button"
                            onClick={() => onOpenAuthorProfile(review.reviewerUid!)}
                            className="group flex items-center gap-2.5 min-w-0 text-start transition-colors"
                          >
                            <span
                              aria-hidden="true"
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                                review.isOwner
                                  ? 'border-amber-400/70 bg-amber-500/15 text-amber-500 group-hover:border-amber-400'
                                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]'
                              }`}
                            >
                              {review.reviewerName.trim().charAt(0) || (
                                <User className="h-4 w-4" aria-hidden="true" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-bold text-[var(--text-ink)] underline-offset-4 group-hover:text-[var(--accent-primary)] group-hover:underline">
                                  {review.reviewerName}
                                </span>
                                {(review.isVerified || review.isOwner) && (
                                  <OwnerBadge
                                    showVerifiedIcon={Boolean(review.isVerified)}
                                    showOwnerText={Boolean(review.isOwner)}
                                  />
                                )}
                              </div>
                              {dateLabel && (
                                <p className="text-[11px] text-[var(--text-muted)]">{dateLabel}</p>
                              )}
                            </div>
                          </button>
                        ) : (
                          <>
                            <span
                              aria-hidden="true"
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                review.isOwner
                                  ? 'border-amber-400/70 bg-amber-500/15 text-amber-500'
                                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--accent-primary)]'
                              }`}
                            >
                              {review.reviewerName.trim().charAt(0) || (
                                <User className="h-4 w-4" aria-hidden="true" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-bold text-[var(--text-ink)]">
                                  {review.reviewerName}
                                </p>
                                {(review.isVerified || review.isOwner) && (
                                  <OwnerBadge
                                    showVerifiedIcon={Boolean(review.isVerified)}
                                    showOwnerText={Boolean(review.isOwner)}
                                  />
                                )}
                              </div>
                              {dateLabel && (
                                <p className="text-[11px] text-[var(--text-muted)]">{dateLabel}</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Reviewer's star rating right next to their name/comment */}
                      <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 shrink-0">
                        <StarRatingDisplay rating={review.rating} lang={lang} compact />
                      </div>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--text-ink)]">
                      {review.comment}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-2.5">
                    <button
                      type="button"
                      disabled={likingReviewId === review.id || !onToggleReviewLike}
                      onClick={async () => {
                        if (!onToggleReviewLike) return;
                        setLikingReviewId(review.id);
                        try {
                          await onToggleReviewLike(review.id);
                        } finally {
                          setLikingReviewId(null);
                        }
                      }}
                      aria-pressed={Boolean(review.likedByMe)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-60 ${
                        review.likedByMe
                          ? 'border-rose-500/55 bg-rose-500/12 text-rose-500 hover:bg-rose-500/20'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-rose-500/45 hover:text-rose-500'
                      }`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          review.likedByMe ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {review.likedByMe
                          ? isEn
                            ? 'Liked'
                            : 'أعجبني'
                          : isEn
                            ? 'Like'
                            : 'إعجاب'}
                      </span>
                      <span className="font-mono-tabular">({review.likesCount ?? 0})</span>
                    </button>

                    {(review.likesCount ?? 0) > 0 && (
                      <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                        {isEn
                          ? `${review.likesCount} ${review.likesCount === 1 ? 'like' : 'likes'}`
                          : `${review.likesCount} إعجاب`}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
