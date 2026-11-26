import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  BookOpen,
  Check,
  Clock,
  Crown,
  Gift,
  KeyRound,
  Lock,
  LogIn,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { getBookRating } from '../bookRatings';
import {
  formatComingSoonReleaseLabel,
  getEffectiveBookPricing,
  isBookNew,
  type BookRecord,
  type TokenEconomyConfig,
} from '../db/booksDb';
import {
  DEFAULT_APP_ICON_ID,
  PREMIUM_APP_ICONS,
  type AppIconId,
} from '../appIconCatalog';
import {
  getThemeDisplayDescription,
  getThemeDisplayName,
  UI_COPY,
  type AppLanguage,
} from '../i18n';
import { PREMIUM_THEMES, type ThemeId } from '../themeCatalog';
import { AppIconGraphic } from './AppIconGraphic';
import { OwnerBadge, RateBookButton, StarRatingDisplay } from './BookRatingBar';
import { TokenIcon, TokenPriceBadge } from './TokenCoin';

export interface ThemeAccessState {
  isUnlocked: boolean;
  accessType: 'purchased' | 'code' | 'locked';
  purchasedAt?: string;
  codeAccessExpiresAt?: string;
  codeExpiresAt?: string;
  rotationHours?: number;
  tokenPrice?: number | null;
  effectiveTokenPrice?: number;
}

export interface IconAccessState {
  iconId?: string;
  isUnlocked: boolean;
  accessType: 'purchased' | 'code' | 'locked';
  purchasedAt?: string;
  codeAccessExpiresAt?: string;
  codeExpiresAt?: string;
  rotationHours?: number;
  tokenPrice?: number | null;
  effectiveTokenPrice?: number;
}

interface PremiumSectionProps {
  premiumBooks: BookRecord[];
  unlockedIds: string[];
  purchasedIds: string[];
  themeAccessMap: Record<string, ThemeAccessState>;
  activeThemeId: ThemeId;
  iconAccessMap?: Record<string, IconAccessState>;
  activeAppIconId?: AppIconId;
  isAuthenticated: boolean;
  currentUserUid?: string | null;
  userEmail?: string | null;
  userTokensBalance?: number;
  economyConfig?: TokenEconomyConfig;
  lang?: AppLanguage;
  onSignIn: () => Promise<void>;
  onUnlockByCode: (code: string) => Promise<{ ok: boolean; label?: string }>;
  onOpenBook: (book: BookRecord) => void;
  onRequestThemeUnlock: (themeId: ThemeId, themeName: string) => void;
  onApplyTheme: (themeId: ThemeId) => void;
  onRequestIconUnlock?: (iconId: AppIconId, iconName: string) => void;
  onApplyAppIcon?: (iconId: AppIconId) => void;
  onGiftItem?: (targetType: 'book' | 'theme', targetId: string) => void;
  onToggleNotifyMe?: (bookId: string) => void | Promise<void>;
  onPreorderBook?: (bookId: string) => Promise<{ ok: boolean; error?: string }>;
  onRateBook?: (book: BookRecord) => void;
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({
  premiumBooks,
  unlockedIds,
  purchasedIds,
  themeAccessMap,
  activeThemeId,
  iconAccessMap = {},
  activeAppIconId = DEFAULT_APP_ICON_ID,
  isAuthenticated,
  currentUserUid = null,
  userEmail,
  userTokensBalance = 0,
  economyConfig,
  lang = 'ar',
  onSignIn,
  onUnlockByCode,
  onOpenBook,
  onRequestThemeUnlock,
  onApplyTheme,
  onRequestIconUnlock,
  onApplyAppIcon,
  onGiftItem,
  onToggleNotifyMe,
  onPreorderBook,
  onRateBook,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyPendingId, setNotifyPendingId] = useState<string | null>(null);
  const [preorderPendingId, setPreorderPendingId] = useState<string | null>(null);
  const [preorderErrorMap, setPreorderErrorMap] = useState<Record<string, string>>({});
  const isEn = lang === 'en';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setFeedback({
        type: 'err',
        text: isEn
          ? 'Please sign in with Google first to redeem an activation code.'
          : 'يرجى تسجيل الدخول بحساب Google أولاً لتفعيل الكود.',
      });
      return;
    }

    const cleaned = codeInput.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setFeedback({
        type: 'err',
        text: isEn
          ? 'Activation code must be exactly 10 digits.'
          : 'يجب أن يتكون كود التفعيل من 10 أرقام بالضبط.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onUnlockByCode(cleaned);
      if (result.ok) {
        setCodeInput('');
        setFeedback({
          type: 'ok',
          text: isEn
            ? `Activated "${result.label}" with the current 10-digit code.`
            : `تم تفعيل «${result.label}» بنجاح بالكود الحالي.`,
        });
      } else {
        setFeedback({
          type: 'err',
          text: isEn
            ? 'This activation code is invalid or has expired.'
            : 'هذا الكود غير مطابق أو انتهت صلاحيته الدورية.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="premium-collection"
      className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {isEn ? 'Premium Corner' : 'ركن البريميوم'}
            </p>
            <h2 className="mt-2 font-editorial text-3xl font-bold text-[var(--text-ink)] [text-wrap:balance]">
              {isEn ? 'Exclusive Premium Books & Themes' : 'كتب وخلفيات بريميوم خاصة'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {isEn
                ? 'Unlock any premium book or theme either with a single-use 10-digit code or instantly using your Golden Rhombus Tokens.'
                : 'يمكنك شراء وتفعيل أي كتاب أو خلفية بريميوم إما باستخدام كود التفعيل المكوّن من 10 أرقام أو مباشرة بعملاتك الذهبية.'}
            </p>
          </div>

          {/* Account Status Card */}
          <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
            {isAuthenticated ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {isEn ? 'Signed in Account' : 'الحساب المرتبط بالمكتبة'}
                  </p>
                  <p className="truncate text-xs text-[var(--text-ink)]" dir="ltr">
                    {userEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded border border-amber-500/50 bg-amber-500/12 px-2.5 py-1 font-mono-tabular text-[11px] font-bold text-amber-600 dark:text-amber-300"
                    title={isEn ? 'Golden Tokens Balance' : 'رصيد العملات الذهبية'}
                  >
                    <TokenIcon className="h-3.5 w-3.5" />
                    <span>{userTokensBalance}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <KeyRound className="h-3 w-3" aria-hidden="true" />
                    {unlockedIds.length} {isEn ? 'Activated' : 'مفعّل'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'Sign in with Google to activate premium books and themes using 10-digit codes.'
                    : 'سجّل الدخول بحساب Google لتتمكن من تفعيل الكتب والسمات البريميوم بالأكواد.'}
                </p>
                <button
                  type="button"
                  onClick={() => void onSignIn()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-400"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Sign in' : 'تسجيل الدخول'}
                </button>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-amber-500/35 bg-[var(--bg-surface)] p-5 space-y-3"
          >
            <label
              htmlFor="premium-unlock-code"
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-ink)]"
            >
              <KeyRound className="h-4 w-4 text-amber-500" aria-hidden="true" />
              {isEn
                ? 'Enter Activation Code (10 digits)'
                : 'أدخل كود التفعيل (10 أرقام)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="premium-unlock-code"
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (feedback) setFeedback(null);
                }}
                placeholder="0000000000"
                dir="ltr"
                className="flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-center font-mono-tabular text-sm tracking-widest text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                {isEn ? 'Activate' : 'تفعيل'}
              </button>
            </div>
            {feedback && (
              <p
                role="status"
                className={`text-xs font-medium ${
                  feedback.type === 'ok'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-[var(--text-ink)]'
                }`}
              >
                {feedback.text}
              </p>
            )}
          </form>
        </div>

        <div className="lg:col-span-7 space-y-8">
          {premiumBooks.length > 0 && (
            <div>
              <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                {isEn
                  ? `Premium Books (${premiumBooks.length})`
                  : `كتب البريميوم (${premiumBooks.length})`}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {premiumBooks.map((book) => {
                  const hasPermanentGrant =
                    purchasedIds.includes(book.id) || book.accessType === 'purchased';
                  const unlocked = hasPermanentGrant || unlockedIds.includes(book.id);
                  const isComingSoon = Boolean(book.isComingSoon);
                  const comingSoonDate = formatComingSoonReleaseLabel(book, lang);
                  const isNew = isBookNew(book);
                  const rating = getBookRating(book);
                  const pricing = getEffectiveBookPricing(
                    book,
                    economyConfig?.defaultPremiumBookPrice ?? 40
                  );
                  return (
                    <div
                      key={book.id}
                      className="group relative flex flex-col justify-between gap-3 rounded-lg border border-amber-500/30 bg-[var(--bg-surface)] p-4 transition-all duration-200 hover:border-amber-500 hover:bg-amber-500/[0.08] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.45)]"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenBook(book)}
                        className={`flex w-full cursor-pointer items-start gap-4 ${
                          isEn ? 'text-left' : 'text-right'
                        }`}
                      >
                        <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-sm border border-amber-500/35 bg-[var(--bg-surface-alt)] group-hover:border-amber-500">
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              referrerPolicy="no-referrer"
                              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                                !unlocked || isComingSoon ? 'brightness-[0.82]' : ''
                              }`}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-muted)]">
                              <BookOpen className="h-5 w-5 opacity-60" aria-hidden="true" />
                            </div>
                          )}
                          {isNew && (
                            <span className="pointer-events-none absolute top-1.5 start-1.5 z-10 inline-flex items-center rounded bg-[var(--accent-primary)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent-fg)] shadow">
                              {UI_COPY[lang].newBadge}
                            </span>
                          )}
                          {!isNew && (
                            <span
                              aria-label="VIP"
                              className="pointer-events-none absolute top-1.5 end-1.5 z-10 inline-flex items-center justify-center rounded border border-amber-200/90 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 px-1.5 py-0.5 font-mono-tabular text-[9px] font-extrabold tracking-widest text-stone-950 shadow"
                            >
                              VIP
                            </span>
                          )}
                          {pricing.hasDiscount && (
                            <span className="pointer-events-none absolute bottom-1.5 start-1.5 z-20 inline-flex items-center rounded bg-rose-600 px-1.5 py-0.5 font-mono-tabular text-[9px] font-extrabold text-white shadow">
                              -{pricing.discountPercent}%
                            </span>
                          )}

                          {isComingSoon && (
                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/45 px-1 text-center">
                              <span className="rounded border border-white/30 bg-stone-950/85 px-1.5 py-0.5 font-mono-tabular text-[8px] font-extrabold uppercase tracking-wider text-amber-300 shadow">
                                Coming Soon
                              </span>
                            </div>
                          )}

                          {!isComingSoon && !unlocked && (
                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/35 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/80 bg-stone-950/85 text-amber-400 shadow-lg">
                                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 group-hover:text-amber-500">
                            {isComingSoon ? (
                              <span>
                                {comingSoonDate
                                  ? isEn
                                    ? `Coming Soon · ${comingSoonDate}`
                                    : `قريباً · ${comingSoonDate}`
                                  : isEn
                                    ? 'Coming Soon'
                                    : 'قريباً'}
                              </span>
                            ) : hasPermanentGrant ? (
                              <>
                                <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>
                                  {isEn ? 'VIP Granted' : 'صلاحية VIP دائمة'}
                                </span>
                              </>
                            ) : unlocked ? (
                              <>
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>
                                  {isEn ? 'Activated by Code' : 'مفعّل بالكود'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>
                                  {isEn ? 'Locked' : 'مقفل'}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="mt-1 truncate font-editorial text-lg font-bold text-[var(--text-ink)] transition-colors group-hover:text-amber-500">
                            {book.title}
                          </p>
                          <p className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <span>{book.author}</span>
                            {book.isAuthorVerified && (
                              <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                            )}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:text-amber-500">
                              {isComingSoon
                                ? isEn
                                  ? 'View preview →'
                                  : 'عرض التفاصيل ←'
                                : unlocked
                                  ? isEn
                                    ? 'Read Book →'
                                    : 'قراءة الكتاب الآن ←'
                                  : isEn
                                    ? 'Unlock & Read →'
                                    : 'شراء أو تفعيل بالكود ←'}
                            </span>
                            {!unlocked && (
                              <TokenPriceBadge
                                amount={pricing.finalPrice}
                                originalAmount={pricing.hasDiscount ? pricing.basePrice : null}
                                discountPercent={pricing.discountPercent}
                                lang={lang}
                                size="xs"
                              />
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-3">
                        {isComingSoon ? (
                          <div className="flex w-full flex-col gap-1.5">
                            <div className="flex w-full items-center gap-1.5">
                              {!unlocked &&
                                (!currentUserUid || book.authorUid !== currentUserUid) &&
                                onPreorderBook &&
                                (book.isPreordered ? (
                                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-500/60 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {isEn ? 'Pre-Ordered ✓' : 'تم الطلب المسبق ✓'}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={preorderPendingId === book.id}
                                    onClick={async () => {
                                      setPreorderErrorMap((prev) => ({ ...prev, [book.id]: '' }));
                                      setPreorderPendingId(book.id);
                                      try {
                                        const res = await onPreorderBook(book.id);
                                        if (!res.ok && res.error) {
                                          setPreorderErrorMap((prev) => ({
                                            ...prev,
                                            [book.id]: res.error!,
                                          }));
                                        }
                                      } finally {
                                        setPreorderPendingId(null);
                                      }
                                    }}
                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
                                  >
                                    <span>
                                      {preorderPendingId === book.id
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
                                  disabled={notifyPendingId === book.id}
                                  onClick={async () => {
                                    setNotifyPendingId(book.id);
                                    try {
                                      await onToggleNotifyMe(book.id);
                                    } finally {
                                      setNotifyPendingId(null);
                                    }
                                  }}
                                  title={
                                    book.isNotifySubscribed
                                      ? isEn
                                        ? 'Notifying ✓'
                                        : 'سيتم إشعارك ✓'
                                      : isEn
                                        ? 'Notify Me'
                                        : 'ذكّرني عند النشر'
                                  }
                                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                                    !unlocked &&
                                    (!currentUserUid || book.authorUid !== currentUserUid) &&
                                    onPreorderBook
                                      ? 'h-8 w-8 px-0 shrink-0'
                                      : 'flex-1'
                                  } ${
                                    book.isNotifySubscribed
                                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]'
                                  }`}
                                >
                                  {book.isNotifySubscribed ? (
                                    <>
                                      <BellRing className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                      {!(
                                        !unlocked &&
                                        (!currentUserUid || book.authorUid !== currentUserUid) &&
                                        onPreorderBook
                                      ) && <span>{isEn ? 'Notifying ✓' : 'سيتم إشعارك ✓'}</span>}
                                    </>
                                  ) : (
                                    <>
                                      <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                      {!(
                                        !unlocked &&
                                        (!currentUserUid || book.authorUid !== currentUserUid) &&
                                        onPreorderBook
                                      ) && <span>{isEn ? 'Notify Me' : 'ذكّرني عند النشر'}</span>}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            {preorderErrorMap[book.id] && (
                              <p role="alert" className="text-[11px] font-semibold text-rose-500">
                                {preorderErrorMap[book.id]}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <StarRatingDisplay rating={rating} lang={lang} compact />
                            <div className="flex items-center gap-1.5">
                              {onGiftItem && (
                                <button
                                  type="button"
                                  onClick={() => onGiftItem('book', book.id)}
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
                                onRate={() => onRateBook?.(book)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
              {isEn
                ? `Premium Themes & Backdrops (${PREMIUM_THEMES.length})`
                : `سمات وخلفيات البريميوم (${PREMIUM_THEMES.length})`}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PREMIUM_THEMES.map((t) => {
                const access = themeAccessMap[t.id];
                const hasPermanentGrant =
                  purchasedIds.includes(t.id) || access?.accessType === 'purchased';
                const unlocked =
                  hasPermanentGrant || Boolean(access?.isUnlocked) || unlockedIds.includes(t.id);
                const isActive = activeThemeId === t.id;
                const isGoldenKing = t.id === 'golden-king';
                const tName = getThemeDisplayName(t, lang);
                const tDesc = getThemeDisplayDescription(t, lang);
                const themeTokenPrice =
                  access?.effectiveTokenPrice ??
                  access?.tokenPrice ??
                  t.tokenPriceOverride ??
                  economyConfig?.defaultPremiumThemePrice ??
                  60;
                return (
                  <div
                    key={t.id}
                    className={`group relative flex flex-col justify-between rounded-lg border p-4 transition-all duration-200 ${
                      isGoldenKing
                        ? isActive
                          ? 'border-[#D4AF37] bg-[#050505] text-[#FAF5E8] shadow-[0_0_0_1px_rgba(212,175,55,0.65)]'
                          : 'border-[#2B2311] bg-[#050505] text-[#FAF5E8] hover:border-[#D4AF37] hover:shadow-[0_0_0_1px_rgba(212,175,55,0.55)]'
                        : isActive
                          ? 'border-amber-500 bg-amber-500/[0.06] hover:border-amber-500 hover:bg-amber-500/[0.08] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.45)]'
                          : 'border-amber-500/30 bg-[var(--bg-surface)] hover:border-amber-500 hover:bg-amber-500/[0.08] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.45)]'
                    }`}
                  >
                    {!unlocked && (
                      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/25 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-xl ${
                            isGoldenKing
                              ? 'border-[#D4AF37] bg-[#050505]/90 text-[#D4AF37]'
                              : 'border-amber-300/80 bg-stone-950/85 text-amber-400'
                          }`}
                        >
                          <Lock className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        unlocked ? onApplyTheme(t.id) : onRequestThemeUnlock(t.id, tName)
                      }
                      className={`flex w-full cursor-pointer items-start justify-between gap-3 ${
                        isEn ? 'text-left' : 'text-right'
                      }`}
                    >
                      <div>
                        <div
                          className={`flex items-center gap-1.5 text-xs ${
                            isGoldenKing
                              ? 'text-[#D4AF37]'
                              : 'text-amber-600 dark:text-amber-400 group-hover:text-amber-500'
                          }`}
                        >
                          {hasPermanentGrant ? (
                            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : unlocked ? (
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>
                            {hasPermanentGrant
                              ? isEn
                                ? 'VIP Granted'
                                : 'صلاحية VIP دائمة'
                              : unlocked
                                ? isEn
                                  ? 'Activated by Code'
                                  : 'مفعّلة بالكود'
                                : isEn
                                  ? 'Locked · Code / Buy'
                                  : 'مقفلة · كود أو شراء'}
                          </span>
                        </div>
                        <p
                          className={`mt-1 font-editorial text-lg font-bold transition-colors ${
                            isGoldenKing
                              ? 'text-[#FAF5E8] group-hover:text-[#D4AF37]'
                              : 'text-[var(--text-ink)] group-hover:text-amber-500'
                          }`}
                        >
                          {tName}
                        </p>
                        <p
                          className={`mt-0.5 text-xs ${
                            isGoldenKing ? 'text-[#B8A878]' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {tDesc}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <span
                          aria-label="VIP"
                          className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-mono-tabular text-[10px] font-extrabold tracking-widest shadow-sm ${
                            isGoldenKing
                              ? 'border-[#D4AF37] bg-[#050505] text-[#D4AF37]'
                              : 'border-amber-200/80 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 text-stone-950'
                          }`}
                        >
                          VIP
                        </span>
                        <span
                          className={`h-8 w-8 rounded-md border ${
                            isGoldenKing ? 'border-[#D4AF37]/50' : 'border-black/15'
                          }`}
                          style={{ background: t.previewBackground }}
                          aria-hidden="true"
                        />
                      </div>
                    </button>

                    <div
                      className={`mt-4 flex w-full items-center justify-between gap-2 border-t pt-3 ${
                        isGoldenKing ? 'border-[#231D10]' : 'border-[var(--border-hairline)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          unlocked ? onApplyTheme(t.id) : onRequestThemeUnlock(t.id, tName)
                        }
                        className={`text-xs font-medium ${
                          isGoldenKing
                            ? 'text-[#D4AF37]'
                            : 'text-amber-600 dark:text-amber-400 group-hover:text-amber-500'
                        }`}
                      >
                        {unlocked
                          ? isActive
                            ? isEn
                              ? 'Currently Active'
                              : 'مطبّقة حالياً'
                            : isEn
                              ? 'Apply Theme →'
                              : 'تطبيق الخلفية ←'
                          : isEn
                            ? 'Code / Buy →'
                            : 'تفعيل بالكود أو الشراء ←'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {!unlocked && (
                          <TokenPriceBadge amount={themeTokenPrice} lang={lang} size="xs" />
                        )}
                        {onGiftItem && (
                        <button
                          type="button"
                          onClick={() => onGiftItem('theme', t.id)}
                          title={isEn ? 'Gift or trade with a friend' : 'إهداء أو تبديل لصديق'}
                          aria-label={isEn ? `Gift or trade ${tName}` : `إهداء أو تبديل ${tName}`}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors shrink-0 ${
                            isGoldenKing
                              ? 'border-[#D4AF37]/60 bg-[#141008] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-stone-950'
                              : 'border-amber-500/55 bg-amber-500/12 text-amber-500 hover:bg-amber-500 hover:text-stone-950'
                          }`}
                        >
                          <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium VIP External App Icons */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                {isEn
                  ? `Premium App Icons (VIP · ${PREMIUM_APP_ICONS.length})`
                  : `أيقونات التطبيق البريميوم (VIP · ${PREMIUM_APP_ICONS.length})`}
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                {isEn
                  ? 'Same browser tab shape · Luxury colors & gradients'
                  : 'نفس شعار المتصفح بألوان وتدرجات ملكية خاصة'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PREMIUM_APP_ICONS.map((icon) => {
                const access = iconAccessMap[icon.id];
                const hasPermanentGrant =
                  purchasedIds.includes(icon.id) || access?.accessType === 'purchased';
                const unlocked =
                  hasPermanentGrant || Boolean(access?.isUnlocked) || unlockedIds.includes(icon.id);
                const isActive = activeAppIconId === icon.id;
                const iconName = isEn ? icon.nameEn : icon.name;
                const iconDesc = isEn ? icon.descriptionEn : icon.description;
                const iconTokenPrice =
                  access?.effectiveTokenPrice ??
                  access?.tokenPrice ??
                  icon.tokenPriceOverride ??
                  economyConfig?.defaultPremiumIconPrice ??
                  50;

                return (
                  <div
                    key={icon.id}
                    className={`group relative flex flex-col justify-between rounded-lg border p-4 transition-all duration-200 ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/[0.08] shadow-[0_0_0_1px_rgba(245,158,11,0.5)]'
                        : 'border-amber-500/30 bg-[var(--bg-surface)] hover:border-amber-500 hover:bg-amber-500/[0.08] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.45)]'
                    }`}
                  >
                    {!unlocked && (
                      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/25 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-300/80 bg-stone-950/85 text-amber-400 shadow-xl">
                          <Lock className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        unlocked
                          ? onApplyAppIcon?.(icon.id)
                          : onRequestIconUnlock?.(icon.id, iconName)
                      }
                      className={`flex w-full cursor-pointer items-start gap-3.5 ${
                        isEn ? 'text-left' : 'text-right'
                      }`}
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-amber-400/50 shadow-lg transition-transform duration-200 group-hover:scale-105">
                        <AppIconGraphic iconId={icon.id} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            {hasPermanentGrant ? (
                              <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            ) : unlocked ? (
                              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            )}
                            <span>
                              {hasPermanentGrant
                                ? isEn
                                  ? 'VIP Granted'
                                  : 'VIP دائم'
                                : unlocked
                                  ? isEn
                                    ? 'Activated by Code'
                                    : 'مفعّلة بالكود'
                                  : isEn
                                    ? 'Locked · Code / Buy'
                                    : 'مقفلة · كود أو شراء'}
                            </span>
                          </div>
                          <span
                            aria-label="VIP"
                            className="inline-flex items-center justify-center rounded-md border border-amber-200/80 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 px-2 py-0.5 font-mono-tabular text-[10px] font-extrabold tracking-widest text-stone-950 shadow-sm shrink-0"
                          >
                            VIP
                          </span>
                        </div>
                        <p className="mt-1 truncate font-editorial text-lg font-bold text-[var(--text-ink)] transition-colors group-hover:text-amber-500">
                          {iconName}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2">
                          {iconDesc}
                        </p>
                      </div>
                    </button>

                    <div className="mt-4 flex w-full items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          unlocked
                            ? onApplyAppIcon?.(icon.id)
                            : onRequestIconUnlock?.(icon.id, iconName)
                        }
                        className="text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:text-amber-500"
                      >
                        {unlocked
                          ? isActive
                            ? isEn
                              ? 'Currently Active'
                              : 'مطبّقة حالياً ✓'
                            : isEn
                              ? 'Apply App Icon →'
                              : 'تطبيق الأيقونة ←'
                          : isEn
                            ? 'Code / Buy →'
                            : 'تفعيل بالكود أو الشراء ←'}
                      </button>

                      {!unlocked && (
                        <TokenPriceBadge amount={iconTokenPrice} lang={lang} size="xs" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
