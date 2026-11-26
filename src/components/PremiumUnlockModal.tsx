import React, { useEffect, useState } from 'react';
import { Clock, KeyRound, Lock, LogIn, Unlock, X } from 'lucide-react';
import type { AppLanguage } from '../i18n';
import { TokenIcon, TokenPriceBadge } from './TokenCoin';

interface PremiumUnlockModalProps {
  target: {
    id: string;
    label: string;
    kind: 'book' | 'theme' | 'icon';
    codeExpiresAt?: string;
    accessType?: 'purchased' | 'code' | 'locked' | 'free';
  } | null;
  isAuthenticated: boolean;
  userTokensBalance?: number;
  tokenPrice?: number;
  originalTokenPrice?: number | null;
  discountPercent?: number | null;
  lang?: AppLanguage;
  onSignIn: () => Promise<void>;
  onAttemptUnlock: (targetId: string, code: string) => Promise<boolean>;
  onUnlockWithTokens?: (
    targetType: 'book' | 'theme' | 'icon',
    targetId: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const PremiumUnlockModal: React.FC<PremiumUnlockModalProps> = ({
  target,
  isAuthenticated,
  userTokensBalance = 0,
  tokenPrice,
  originalTokenPrice = null,
  discountPercent = null,
  lang = 'ar',
  onSignIn,
  onAttemptUnlock,
  onUnlockWithTokens,
  onClose,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [buyingTokens, setBuyingTokens] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const isEn = lang === 'en';

  useEffect(() => {
    setCode('');
    setError(null);
    setTokenError(null);
  }, [target?.id]);

  if (!target) return null;

  const canPayWithTokens = typeof tokenPrice === 'number' && Boolean(onUnlockWithTokens);
  const hasEnoughTokens = typeof tokenPrice === 'number' ? userTokensBalance >= tokenPrice : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.replace(/\D/g, '');
    if (clean.length !== 10) {
      setError(
        isEn ? 'Please enter an exact 10-digit code.' : 'يجب إدخال كود مكون من 10 أرقام.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const ok = await onAttemptUnlock(target.id, clean);
      if (!ok) {
        setError(
          isEn
            ? 'Invalid or already-used activation code. Please check the current 10-digit code.'
            : 'الكود غير صحيح أو تم استخدامه بالفعل. تأكد من كود التفعيل الحالي.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyWithTokens = async () => {
    if (!onUnlockWithTokens || typeof tokenPrice !== 'number') return;
    setTokenError(null);
    if (userTokensBalance < tokenPrice) {
      setTokenError(
        isEn
          ? `Insufficient golden tokens. You have ${userTokensBalance}, need ${tokenPrice}.`
          : `رصيد العملات غير كافٍ. رصيدك الحالي ${userTokensBalance} عملة والمطلوب ${tokenPrice} عملة.`
      );
      return;
    }
    setBuyingTokens(true);
    try {
      const res = await onUnlockWithTokens(target.kind, target.id);
      if (!res.ok) {
        setTokenError(
          res.error ??
            (isEn ? 'Could not complete token purchase.' : 'تعذّر إتمام الشراء بالعملات الذهبية.')
        );
      }
    } finally {
      setBuyingTokens(false);
    }
  };

  const handleSignInClick = async () => {
    setSigningIn(true);
    try {
      await onSignIn();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-modal-title"
    >
      <div className="w-full max-w-md rounded-lg border border-amber-500/60 bg-[var(--bg-canvas)] p-6 text-[var(--text-ink)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-amber-500">
                {target.kind === 'book'
                  ? isEn
                    ? 'Premium Book · Code or Golden Tokens'
                    : 'كتاب بريميوم · بالكود أو بالعملات الذهبية'
                  : target.kind === 'icon'
                    ? isEn
                      ? 'Premium App Icon · Code or Golden Tokens'
                      : 'أيقونة تطبيق بريميوم · بالكود أو بالعملات الذهبية'
                    : isEn
                      ? 'Premium Theme · Code or Golden Tokens'
                      : 'سمة بريميوم · بالكود أو بالعملات الذهبية'}
              </p>
              <h3 id="premium-modal-title" className="font-editorial text-xl font-bold">
                {target.label}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            aria-label={isEn ? 'Close' : 'إغلاق'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {isEn
                ? 'Sign in with your Google account first to unlock this premium item using Golden Rhombus Tokens or a 10-digit code.'
                : 'سجّل الدخول بحساب Google أولاً لتتمكن من شراء هذا المحتوى البريميوم بالعملات الذهبية أو تفعيله بكود من 10 أرقام.'}
            </p>
            {typeof tokenPrice === 'number' && (
              <div className="flex items-center justify-between rounded-md border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs">
                <span className="font-medium text-[var(--text-ink)]">
                  {isEn ? 'Price:' : 'السعر:'}
                </span>
                <TokenPriceBadge
                  amount={tokenPrice}
                  originalAmount={originalTokenPrice}
                  discountPercent={discountPercent}
                  lang={lang}
                  size="sm"
                />
              </div>
            )}
            <button
              type="button"
              disabled={signingIn}
              onClick={() => void handleSignInClick()}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {signingIn
                ? isEn
                  ? 'Signing in...'
                  : 'جاري تسجيل الدخول...'
                : isEn
                  ? 'Sign in with Google'
                  : 'تسجيل الدخول بحساب Google'}
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {canPayWithTokens && typeof tokenPrice === 'number' && (
              <div className="rounded-lg border border-amber-500/45 bg-amber-500/[0.07] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TokenIcon className="h-5 w-5" />
                    <div>
                      <p className="text-xs font-bold text-[var(--text-ink)]">
                        {isEn ? 'Unlock Permanently with Tokens' : 'شراء دائم بالعملات الذهبية'}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {isEn ? 'Your balance:' : 'رصيدك الحالي:'}{' '}
                        <span className="font-mono-tabular font-bold text-amber-600 dark:text-amber-400">
                          {userTokensBalance}
                        </span>
                      </p>
                    </div>
                  </div>
                  <TokenPriceBadge
                    amount={tokenPrice}
                    originalAmount={originalTokenPrice}
                    discountPercent={discountPercent}
                    lang={lang}
                    size="sm"
                  />
                </div>

                <button
                  type="button"
                  disabled={buyingTokens || !hasEnoughTokens}
                  onClick={() => void handleBuyWithTokens()}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {buyingTokens ? (
                    <>
                      <TokenIcon className="h-4 w-4" />
                      <span>{isEn ? 'Processing Purchase...' : 'جاري إتمام الشراء...'}</span>
                    </>
                  ) : hasEnoughTokens ? (
                    <>
                      <span>{isEn ? 'Unlock & Buy' : 'شراء وتفعيل'}</span>
                      <span className="inline-flex items-center gap-1 rounded bg-stone-950/15 px-1.5 py-0.5 font-mono-tabular">
                        {typeof originalTokenPrice === 'number' && originalTokenPrice > tokenPrice && (
                          <span className="relative px-0.5 text-[10px] opacity-75 line-through">
                            {originalTokenPrice}
                          </span>
                        )}
                        <TokenIcon className="h-3.5 w-3.5" />
                        <span>{tokenPrice}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{isEn ? 'Balance short by' : 'ينقصك'}</span>
                      <span className="inline-flex items-center gap-1 rounded bg-stone-950/15 px-1.5 py-0.5 font-mono-tabular">
                        <TokenIcon className="h-3.5 w-3.5" />
                        <span>{tokenPrice - userTokensBalance}</span>
                      </span>
                    </>
                  )}
                </button>

                {tokenError && (
                  <p className="text-xs font-medium text-rose-500">{tokenError}</p>
                )}
              </div>
            )}

            {canPayWithTokens && (
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[var(--border-hairline)]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {isEn ? 'OR USE 10-DIGIT CODE' : 'أو التفعيل بالكود'}
                </span>
                <span className="h-px flex-1 bg-[var(--border-hairline)]" />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="modal-premium-code"
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-ink)]"
                >
                  <KeyRound className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  {isEn ? 'Enter activation code (10 digits)' : 'أدخل كود التفعيل (10 أرقام)'}
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {isEn
                    ? 'Single-use · renews after activation'
                    : 'استخدام واحد · يتجدد بعد التفعيل'}
                </span>
              </div>

              <input
                id="modal-premium-code"
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (error) setError(null);
                }}
                placeholder="0000000000"
                dir="ltr"
                autoFocus={!canPayWithTokens}
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5 text-center font-mono-tabular text-base tracking-[0.25em] text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
              />

              {error && <p className="text-xs font-medium text-amber-500">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)]"
                >
                  {isEn ? 'Cancel' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/60 bg-[var(--bg-surface)] px-5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-stone-950 disabled:opacity-50"
                >
                  <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Activate with Code' : 'تفعيل بالكود'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
