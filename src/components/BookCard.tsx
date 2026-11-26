import React, { useState } from 'react';
import { Bell, BellRing, BookOpen, Calendar, Gift, Layers, Lock } from 'lucide-react';
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
import { OwnerBadge, RateBookButton, StarRatingDisplay } from './BookRatingBar';
import { TokenIcon, TokenPriceBadge } from './TokenCoin';

interface BookCardProps {
  book: BookRecord;
  progress?: ReadingProgress;
  isUnlocked: boolean;
  currentUserUid?: string | null;
  defaultPremiumBookPrice?: number;
  lang?: AppLanguage;
  sectionTranslations?: Record<string, string>;
  seriesTotalParts?: number;
  onOpen: (book: BookRecord) => void;
  onOpenSeries?: (seriesId: string) => void;
  onGiftBook?: (book: BookRecord) => void;
  onToggleNotifyMe?: (bookId: string) => void | Promise<void>;
  onPreorderBook?: (bookId: string) => Promise<{ ok: boolean; error?: string }>;
  onRateBook?: (book: BookRecord) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  progress,
  isUnlocked,
  currentUserUid = null,
  defaultPremiumBookPrice = 40,
  lang = 'ar',
  sectionTranslations,
  seriesTotalParts,
  onOpen,
  onOpenSeries,
  onGiftBook,
  onToggleNotifyMe,
  onPreorderBook,
  onRateBook,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [notifyPending, setNotifyPending] = useState(false);
  const [preorderPending, setPreorderPending] = useState(false);
  const [preorderError, setPreorderError] = useState<string | null>(null);
  const copy = UI_COPY[lang];
  const isEn = lang === 'en';
  const sectionLabel = getSectionDisplayName(book.category, lang, sectionTranslations);

  const isComingSoon = Boolean(book.isComingSoon);
  const isPendingReview = book.reviewStatus === 'pending';
  const isRejectedReview = book.reviewStatus === 'rejected';
  const comingSoonReleaseLabel = formatComingSoonReleaseLabel(book, lang);
  const isPremium = Boolean(book.isPremium);
  const isLocked = Boolean(isPremium && !isUnlocked && !isPendingReview);
  const pricing = getEffectiveBookPricing(book, defaultPremiumBookPrice);
  const isNew = isBookNew(book);
  const rating = getBookRating(book);
  const isFlipBook = book.bookType === 'pdf' || book.bookType === 'word';
  const unitTotal = isFlipBook
    ? Math.max(1, book.pdfPageCount || book.pages || 1)
    : Math.max(1, book.chapters.length);

  const chapterProgressPercent = progress
    ? Math.min(
        100,
        Math.round(((progress.chapterIndex + (progress.scrollRatio || 0.15)) / unitTotal) * 100)
      )
    : 0;

  return (
    <article
      className={`group flex flex-col rounded-lg border p-3 transition-all duration-200 ${
        isPremium
          ? 'border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/[0.08] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.45)]'
          : 'border-transparent border-b-[var(--border-hairline)] hover:border-[var(--border-hairline)] hover:bg-[var(--bg-surface)]/70'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(book)}
        className={`mb-4 cursor-pointer ${
          isEn ? 'text-left' : 'text-right'
        } focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-primary)]`}
      >
        <div
          className={`relative aspect-[3/4] w-full overflow-hidden rounded-sm border bg-[var(--bg-surface-alt)] transition-colors ${
            isPremium
              ? 'border-amber-500/35 group-hover:border-amber-500'
              : 'border-[var(--border-hairline)]'
          }`}
        >
          {book.coverUrl && !imgFailed ? (
            <img
              src={book.coverUrl}
              alt={isEn ? `${book.title} cover` : `غلاف كتاب ${book.title}`}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
              className={`h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
                isLocked || isComingSoon ? 'brightness-[0.82]' : ''
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--bg-surface-alt)] p-6 text-center">
              <BookOpen className="mb-3 h-8 w-8 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="font-editorial text-lg font-bold text-[var(--text-ink)]">
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
            <span className="pointer-events-none absolute top-2.5 start-2.5 z-20 inline-flex items-center gap-1 rounded-md border border-amber-300/70 bg-stone-950/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 shadow-md">
              {isEn ? 'Pending Review' : 'في انتظار المراجعة'}
            </span>
          )}

          {!isPendingReview && isNew && (
            <span className="pointer-events-none absolute top-2.5 start-2.5 z-10 inline-flex items-center rounded-md border border-white/25 bg-[var(--accent-primary)] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[var(--accent-fg)] shadow-md">
              {copy.newBadge}
            </span>
          )}

          {isPremium && (
            <span
              aria-label="VIP"
              className="pointer-events-none absolute top-2.5 end-2.5 z-10 inline-flex items-center justify-center rounded-md border border-amber-200/90 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 px-2 py-0.5 font-mono-tabular text-[11px] font-extrabold tracking-widest text-stone-950 shadow-md"
            >
              VIP
            </span>
          )}

          {!isPendingReview && isPremium && pricing.hasDiscount && (
            <span className="pointer-events-none absolute bottom-2.5 start-2.5 z-20 inline-flex items-center gap-1 rounded-sm border border-rose-200/70 bg-rose-600 px-2 py-0.5 font-mono-tabular text-[11px] font-extrabold tracking-wide text-white shadow-md">
              <span>{isEn ? 'SALE' : 'سيل'}</span>
              <span>-{pricing.discountPercent}%</span>
            </span>
          )}

          {isComingSoon && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-black/45 px-3 text-center backdrop-blur-[1px]">
              <span className="rounded-md border border-white/30 bg-stone-950/85 px-3.5 py-1.5 font-mono-tabular text-xs font-extrabold uppercase tracking-[0.18em] text-amber-300 shadow-lg">
                Coming Soon
              </span>
              {comingSoonReleaseLabel && (
                <span className="inline-flex items-center gap-1 rounded bg-stone-950/80 px-2.5 py-0.5 text-[11px] font-medium text-white/90 shadow">
                  <Calendar className="h-3 w-3 text-amber-300" aria-hidden="true" />
                  {comingSoonReleaseLabel}
                </span>
              )}
            </div>
          )}

          {!isComingSoon && isLocked && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/80 bg-stone-950/85 text-amber-400 shadow-xl">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span
            className={`font-medium ${
              isPremium
                ? 'text-amber-600 dark:text-amber-400 group-hover:text-amber-500'
                : 'text-[var(--accent-primary)]'
            }`}
          >
            {isPremium ? copy.premiumLabel : sectionLabel}
          </span>
          <span aria-hidden="true">·</span>
          {isComingSoon ? (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {isEn ? 'Coming Soon' : 'قريباً'}
            </span>
          ) : (
            <>
              <span>
                {book.bookType === 'pdf'
                  ? copy.pdfBookLabel
                  : book.bookType === 'word'
                    ? copy.wordBookLabel
                    : sectionLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {isFlipBook ? book.pdfPageCount ?? book.pages : book.pages}{' '}
                {copy.pagesUnit}
              </span>
            </>
          )}
          {book.seriesId && seriesTotalParts && seriesTotalParts > 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[var(--accent-primary)]">
                {formatSeriesPartLabel(book.partNumber, lang)}
              </span>
            </>
          )}
        </div>

        <h3
          className={`mt-1.5 font-editorial text-2xl font-bold leading-snug text-[var(--text-ink)] transition-colors ${
            isPremium ? 'group-hover:text-amber-500' : 'group-hover:text-[var(--accent-primary)]'
          }`}
        >
          {book.title}
        </h3>

        <p className="mt-1 inline-flex flex-wrap items-center gap-1.5 text-sm font-medium text-[var(--text-muted)]">
          <span>{book.author}</span>
          {book.isAuthorVerified && (
            <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
          )}
        </p>

        {book.synopsis && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
            {book.synopsis}
          </p>
        )}

        {isComingSoon ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {comingSoonReleaseLabel
                  ? isEn
                    ? `Releases: ${comingSoonReleaseLabel}`
                    : `موعد النشر: ${comingSoonReleaseLabel}`
                  : isEn
                    ? 'Releasing soon · Pre-order / Notify'
                    : 'سيُنشر قريباً'}
              </span>
            </span>
            {isPremium && (
              <TokenPriceBadge
                amount={pricing.finalPrice}
                originalAmount={pricing.hasDiscount ? pricing.basePrice : null}
                discountPercent={pricing.hasDiscount ? pricing.discountPercent : null}
                lang={lang}
                size="xs"
              />
            )}
          </div>
        ) : isLocked ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:text-amber-500">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isEn ? 'Locked · Code / Buy' : 'مقفل · كود أو شراء'}</span>
            </span>
            <TokenPriceBadge
              amount={pricing.finalPrice}
              originalAmount={pricing.hasDiscount ? pricing.basePrice : null}
              discountPercent={pricing.discountPercent}
              lang={lang}
              size="xs"
            />
          </div>
        ) : progress ? (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                {isFlipBook
                  ? `${copy.continueFromPage} ${progress.chapterIndex + 1}`
                  : `${copy.continueFromChapter} ${book.chapters[progress.chapterIndex]?.number ?? '01'}`}
              </span>
              <span className="tabular-nums font-medium text-[var(--accent-primary)]">
                {chapterProgressPercent}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg-surface-alt)]">
              <div
                className="h-full bg-[var(--accent-primary)] transition-all duration-200"
                style={{ width: `${chapterProgressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div
            className={`mt-4 flex items-center gap-2 text-xs font-medium text-[var(--text-ink)] ${
              isPremium ? 'group-hover:text-amber-500' : 'group-hover:text-[var(--accent-primary)]'
            }`}
          >
            <span>{isFlipBook ? copy.browsePages : copy.readBook}</span>
            <span aria-hidden="true">{isEn ? '→' : '←'}</span>
          </div>
        )}
      </button>

      {book.seriesId && seriesTotalParts && seriesTotalParts > 1 && onOpenSeries && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSeries(book.seriesId!);
          }}
          className="mb-2.5 flex w-full items-center justify-between gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.08]"
        >
          <span className="inline-flex items-center gap-1.5 truncate">
            <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {isEn ? `All Series Parts (${seriesTotalParts})` : `كل أجزاء السلسلة (${seriesTotalParts})`}
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-[11px]">
            {isEn ? '→' : '←'}
          </span>
        </button>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-3">
        {isPendingReview || isRejectedReview ? (
          <span
            className={`inline-flex w-full items-center justify-center rounded-md border px-3 py-1.5 text-xs font-semibold ${
              isRejectedReview
                ? 'border-rose-500/45 bg-rose-500/10 text-rose-500'
                : 'border-amber-500/45 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isRejectedReview
              ? isEn
                ? 'Not Approved · Edit in Profile'
                : 'مرفوض · يمكنك التعديل من ملفك'
              : isEn
                ? 'Pending Developer Review · Visible only to you'
                : 'في انتظار المراجعة · ظاهر لك فقط'}
          </span>
        ) : isComingSoon ? (
          <div className="flex w-full flex-col gap-1.5">
            <div className="flex w-full items-center gap-1.5">
              {isPremium &&
                !isUnlocked &&
                (!currentUserUid || book.authorUid !== currentUserUid) &&
                onPreorderBook &&
                (book.isPreordered ? (
                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-500/60 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isEn ? 'Pre-Ordered ✓' : 'تم الطلب المسبق ✓'}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={preorderPending}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setPreorderError(null);
                      setPreorderPending(true);
                      try {
                        const res = await onPreorderBook(book.id);
                        if (!res.ok && res.error) {
                          setPreorderError(res.error);
                        }
                      } finally {
                        setPreorderPending(false);
                      }
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
                  >
                    <span>
                      {preorderPending
                        ? isEn
                          ? 'Reserving...'
                          : 'جاري الحجز...'
                        : isEn
                          ? 'Pre-Order'
                          : 'طلب مسبق'}
                    </span>
                    <TokenIcon className="h-3.5 w-3.5" />
                    <span className="font-mono-tabular">{pricing.finalPrice}</span>
                  </button>
                ))}

              {onToggleNotifyMe && (
                <button
                  type="button"
                  disabled={notifyPending}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setNotifyPending(true);
                    try {
                      await onToggleNotifyMe(book.id);
                    } finally {
                      setNotifyPending(false);
                    }
                  }}
                  aria-pressed={Boolean(book.isNotifySubscribed)}
                  title={
                    book.isNotifySubscribed
                      ? isEn
                        ? 'Notifying on Launch ✓'
                        : 'سيتم إشعارك عند النشر ✓'
                      : isEn
                        ? 'Notify Me on Launch'
                        : 'ذكّرني عند النشر'
                  }
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    isPremium &&
                    !isUnlocked &&
                    (!currentUserUid || book.authorUid !== currentUserUid) &&
                    onPreorderBook
                      ? 'h-8 w-8 px-0 shrink-0'
                      : 'flex-1'
                  } ${
                    book.isNotifySubscribed
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                      : 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]'
                  }`}
                >
                  {book.isNotifySubscribed ? (
                    <>
                      <BellRing className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {!(
                        isPremium &&
                        !isUnlocked &&
                        (!currentUserUid || book.authorUid !== currentUserUid) &&
                        onPreorderBook
                      ) && (
                        <span>{isEn ? 'Notifying on Launch ✓' : 'سيتم إشعارك عند النشر ✓'}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {!(
                        isPremium &&
                        !isUnlocked &&
                        (!currentUserUid || book.authorUid !== currentUserUid) &&
                        onPreorderBook
                      ) && <span>{isEn ? 'Notify Me' : 'ذكّرني عند النشر'}</span>}
                    </>
                  )}
                </button>
              )}
            </div>
            {preorderError && (
              <p role="alert" className="text-[11px] font-semibold text-rose-500">
                {preorderError}
              </p>
            )}
          </div>
        ) : (
          <>
            <StarRatingDisplay rating={rating} lang={lang} compact />
            <div className="flex items-center gap-1.5">
              {isPremium && onGiftBook && (
                <button
                  type="button"
                  onClick={() => onGiftBook(book)}
                  title={isEn ? 'Gift or trade with a friend' : 'إهداء أو تبديل لصديق'}
                  aria-label={isEn ? `Gift or trade ${book.title}` : `إهداء أو تبديل ${book.title}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-500/55 bg-amber-500/12 text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 shrink-0"
                >
                  <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              <RateBookButton
                bookTitle={book.title}
                lang={lang}
                compact
                iconOnly
                onRate={() => onRateBook?.(book)}
              />
            </div>
          </>
        )}
      </div>
    </article>
  );
};
