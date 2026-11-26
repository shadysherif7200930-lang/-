import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  Gift,
  Layers,
  Lock,
} from 'lucide-react';
import { getBookRating } from '../bookRatings';
import {
  formatComingSoonReleaseLabel,
  formatSeriesPartLabel,
  getEffectiveBookPricing,
  isBookNew,
  type BookRecord,
  type ReadingProgress,
} from '../db/booksDb';
import { getSectionDisplayName, UI_COPY, type AppLanguage } from '../i18n';
import { OwnerBadge, StarRatingDisplay } from './BookRatingBar';
import { TokenIcon, TokenPriceBadge } from './TokenCoin';

interface SeriesPageProps {
  seriesId: string;
  seriesBooks: BookRecord[];
  progressMap: Record<string, ReadingProgress>;
  unlockedIds: string[];
  isDeveloperMode?: boolean;
  currentUserUid?: string | null;
  defaultPremiumBookPrice?: number;
  lang?: AppLanguage;
  sectionTranslations?: Record<string, string>;
  onBack: () => void;
  onSelectBook: (book: BookRecord) => void;
  onStartReading: (book: BookRecord) => void;
  onGiftBook?: (book: BookRecord) => void;
  onToggleNotifyMe?: (bookId: string) => void | Promise<void>;
  onPreorderBook?: (bookId: string) => Promise<{ ok: boolean; error?: string }>;
}

export const SeriesPage: React.FC<SeriesPageProps> = ({
  seriesBooks,
  progressMap,
  unlockedIds,
  isDeveloperMode = false,
  currentUserUid = null,
  defaultPremiumBookPrice = 40,
  lang = 'ar',
  sectionTranslations,
  onBack,
  onSelectBook,
  onStartReading,
  onGiftBook,
  onToggleNotifyMe,
  onPreorderBook,
}) => {
  const isEn = lang === 'en';
  const copy = UI_COPY[lang];
  const [preorderPendingId, setPreorderPendingId] = React.useState<string | null>(null);

  const sortedBooks = [...seriesBooks].sort(
    (a, b) => (a.partNumber ?? 999) - (b.partNumber ?? 999)
  );
  const firstPart = sortedBooks[0];
  const seriesHeading =
    sortedBooks.find((b) => b.seriesTitle?.trim())?.seriesTitle?.trim() ||
    firstPart?.title ||
    (isEn ? 'Book Series' : 'سلسلة كتب');

  return (
    <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8 lg:py-12">
      {/* Top Bar */}
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
          <span>{isEn ? 'Back' : 'العودة'}</span>
        </button>

        <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-primary)]">
          {isEn
            ? `${sortedBooks.length} Parts Connected`
            : `${sortedBooks.length} أجزاء مرتبطة معاً`}
        </span>
      </div>

      {/* Series Header */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-primary)]">
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>{isEn ? 'Complete Series Collection' : 'صفحة سلسلة الأجزاء الكاملة'}</span>
            </div>

            <h1 className="font-editorial text-3xl font-bold leading-tight text-[var(--text-ink)] sm:text-4xl [text-wrap:balance]">
              {seriesHeading}
            </h1>

            {firstPart && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                <span>{isEn ? 'Author:' : 'تأليف:'}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-ink)]">
                  <span>{firstPart.author}</span>
                  {firstPart.isAuthorVerified && (
                    <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
                  )}
                </span>
                <span aria-hidden="true">·</span>
                <span>{getSectionDisplayName(firstPart.category, lang, sectionTranslations)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ordered Part Sequence Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--border-hairline)] pt-4">
          {sortedBooks.map((part, idx) => {
            const partLabel = formatSeriesPartLabel(part.partNumber ?? idx + 1, lang);
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => onSelectBook(part)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                <span className="text-[var(--accent-primary)]">{partLabel}</span>
                <span className="opacity-50" aria-hidden="true">
                  ·
                </span>
                <span className="max-w-[160px] truncate">{part.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* All Parts Side-by-Side Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedBooks.map((book, idx) => {
          const partLabel = formatSeriesPartLabel(book.partNumber ?? idx + 1, lang);
          const isComingSoon = Boolean(book.isComingSoon);
          const isPendingReview = book.reviewStatus === 'pending';
          const isOwnerPreview = Boolean(
            currentUserUid && book.authorUid === currentUserUid && book.reviewStatus !== 'approved'
          );
          const isUnlocked =
            !book.isPremium ||
            unlockedIds.includes(book.id) ||
            isDeveloperMode ||
            isOwnerPreview;
          const isLocked = Boolean(book.isPremium && !isUnlocked && !isPendingReview);
          const isFlipBook = book.bookType === 'pdf' || book.bookType === 'word';
          const progress = progressMap[book.id];
          const comingSoonReleaseLabel = formatComingSoonReleaseLabel(book, lang);
          const rating = getBookRating(book);
          const pricing = getEffectiveBookPricing(book, defaultPremiumBookPrice);

          return (
            <article
              key={book.id}
              className={`group flex flex-col rounded-xl border bg-[var(--bg-surface)] p-4 transition-all ${
                book.isPremium
                  ? 'border-amber-500/40 hover:border-amber-500'
                  : 'border-[var(--border-hairline)] hover:border-[var(--accent-primary)]'
              }`}
            >
              {/* Explicit Part Heading */}
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2.5">
                <span className="text-sm font-bold text-[var(--accent-primary)]">
                  {partLabel}
                </span>
                <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                  {idx + 1} / {sortedBooks.length}
                </span>
              </div>

              {/* Cover + Metadata (click opens BookDetailPage) */}
              <button
                type="button"
                onClick={() => onSelectBook(book)}
                className={`flex-1 flex flex-col ${isEn ? 'text-left' : 'text-right'}`}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)]">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
                        isLocked || isComingSoon ? 'brightness-[0.82]' : ''
                      }`}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                      <BookOpen className="mb-2 h-8 w-8 text-[var(--text-muted)]" aria-hidden="true" />
                      <span className="font-editorial text-lg font-bold text-[var(--text-ink)]">
                        {book.title}
                      </span>
                    </div>
                  )}

                  {isPendingReview && (
                    <span className="pointer-events-none absolute top-2 start-2 z-20 rounded bg-stone-950/90 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {isEn ? 'Pending' : 'قيد المراجعة'}
                    </span>
                  )}

                  {!isPendingReview && isBookNew(book) && (
                    <span className="pointer-events-none absolute top-2 start-2 z-10 rounded bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-fg)]">
                      {copy.newBadge}
                    </span>
                  )}

                  {book.isPremium && (
                    <span className="pointer-events-none absolute top-2 end-2 z-10 rounded bg-amber-500 px-2 py-0.5 font-mono-tabular text-[10px] font-extrabold text-stone-950">
                      VIP
                    </span>
                  )}

                  {!isPendingReview && book.isPremium && pricing.hasDiscount && (
                    <span className="pointer-events-none absolute bottom-2 start-2 z-20 inline-flex items-center rounded bg-rose-600 px-2 py-0.5 font-mono-tabular text-[10px] font-extrabold text-white shadow-md">
                      {isEn ? `SALE -${pricing.discountPercent}%` : `سيل -${pricing.discountPercent}%`}
                    </span>
                  )}

                  {isComingSoon && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/50 px-2 text-center">
                      <span className="rounded bg-stone-950/85 px-2.5 py-1 font-mono-tabular text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                        Coming Soon
                      </span>
                      {comingSoonReleaseLabel && (
                        <span className="text-[11px] text-white">{comingSoonReleaseLabel}</span>
                      )}
                    </div>
                  )}

                  {!isComingSoon && isLocked && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-300/80 bg-stone-950/85 text-amber-400">
                        <Lock className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                  )}
                </div>

                <h2 className="mt-3 font-editorial text-xl font-bold leading-snug text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]">
                  {book.title}
                </h2>

                {book.subtitle && (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                    {book.subtitle}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  {isComingSoon ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      {comingSoonReleaseLabel || (isEn ? 'Coming Soon' : 'قريباً')}
                    </span>
                  ) : (
                    <>
                      <StarRatingDisplay rating={rating} lang={lang} compact />
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {isFlipBook ? book.pdfPageCount ?? book.pages : book.pages} {copy.pagesUnit}
                      </span>
                    </>
                  )}
                </div>

                {!isPendingReview && book.isPremium && isLocked && (
                  <div className="mt-2">
                    <TokenPriceBadge
                      amount={pricing.finalPrice}
                      originalAmount={pricing.hasDiscount ? pricing.basePrice : null}
                      discountPercent={pricing.hasDiscount ? pricing.discountPercent : null}
                      lang={lang}
                      size="xs"
                    />
                  </div>
                )}
              </button>

              {/* Part Action Controls */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-hairline)] pt-3">
                {isComingSoon && !isPendingReview ? (
                  <>
                    {book.isPremium &&
                      isLocked &&
                      (!currentUserUid || book.authorUid !== currentUserUid) &&
                      onPreorderBook &&
                      (book.isPreordered ? (
                        <span className="inline-flex flex-1 items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {isEn ? 'Pre-Ordered ✓' : 'تم الطلب المسبق ✓'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={preorderPendingId === book.id}
                          onClick={async () => {
                            setPreorderPendingId(book.id);
                            try {
                              const res = await onPreorderBook(book.id);
                              if (!res.ok) {
                                onSelectBook(book);
                              }
                            } finally {
                              setPreorderPendingId(null);
                            }
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-amber-500 bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 whitespace-nowrap disabled:opacity-60"
                        >
                          <span>
                            {preorderPendingId === book.id
                              ? isEn
                                ? '...'
                                : '...'
                              : isEn
                                ? 'Pre-Order'
                                : 'طلب مسبق'}
                          </span>
                          <TokenIcon className="h-3.5 w-3.5" />
                          <span className="font-mono-tabular">{pricing.finalPrice}</span>
                        </button>
                      ))}
                    <button
                      type="button"
                      disabled={!onToggleNotifyMe}
                      onClick={() => onToggleNotifyMe && void onToggleNotifyMe(book.id)}
                      title={isEn ? 'Notify Me' : 'ذكّرني عند النشر'}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                        book.isPremium &&
                        isLocked &&
                        (!currentUserUid || book.authorUid !== currentUserUid) &&
                        onPreorderBook
                          ? 'px-2.5 shrink-0'
                          : 'flex-1'
                      } ${
                        book.isNotifySubscribed
                          ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]'
                      }`}
                    >
                      {book.isNotifySubscribed ? (
                        <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {!(
                        book.isPremium &&
                        isLocked &&
                        (!currentUserUid || book.authorUid !== currentUserUid) &&
                        onPreorderBook
                      ) && (
                        <span>
                          {book.isNotifySubscribed
                            ? isEn
                              ? 'Notifying ✓'
                              : 'سيتم إشعارك ✓'
                            : isEn
                              ? 'Notify Me'
                              : 'ذكّرني'}
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartReading(book)}
                    className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                      isLocked
                        ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                        : 'bg-[var(--btn-dark)] text-[var(--btn-dark-fg)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)]'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>
                      {isLocked
                        ? isEn
                          ? 'Unlock'
                          : 'تفعيل والقراءة'
                        : progress
                          ? copy.continueReadingBtn
                          : copy.startReadingBtn}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectBook(book)}
                  className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] whitespace-nowrap"
                >
                  {isEn ? 'Details' : 'التفاصيل'}
                </button>

                {!isComingSoon && !isPendingReview && book.isPremium && onGiftBook && (
                  <button
                    type="button"
                    onClick={() => onGiftBook(book)}
                    title={isEn ? 'Gift or trade with a friend' : 'إهداء أو تبديل لصديق'}
                    aria-label={
                      isEn ? `Gift or trade ${book.title}` : `إهداء أو تبديل ${book.title}`
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/55 bg-amber-500/12 text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 shrink-0"
                  >
                    <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
