import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, RotateCcw, Save, Sliders, Users } from 'lucide-react';
import {
  DEFAULT_TOKEN_ECONOMY_CONFIG,
  type BookRecord,
  type TokenEconomyConfig,
} from '../db/booksDb';
import { PREMIUM_APP_ICONS } from '../appIconCatalog';
import { getThemeDisplayName, type AppLanguage } from '../i18n';
import { PREMIUM_THEMES } from '../themeCatalog';
import { AppIconGraphic } from './AppIconGraphic';
import { OwnerBadge } from './BookRatingBar';
import type { IconAccessState, ThemeAccessState } from './PremiumSection';
import type { DevUserPurchaseEntry } from './SettingsPanel';
import { TokenIcon } from './TokenCoin';

interface DeveloperEconomyPanelProps {
  economyConfig: TokenEconomyConfig;
  books: BookRecord[];
  devUsersList: DevUserPurchaseEntry[];
  themeAccessMap?: Record<string, ThemeAccessState>;
  iconAccessMap?: Record<string, IconAccessState>;
  isAuthenticated: boolean;
  lang: AppLanguage;
  onUpdateEconomyConfig: (
    next: Partial<TokenEconomyConfig>
  ) => Promise<{ ok: boolean; error?: string }>;
  onSetItemTokenPrice: (
    targetType: 'book' | 'theme' | 'icon',
    targetId: string,
    tokenPrice: number | null
  ) => Promise<{ ok: boolean; error?: string }>;
  onAdjustUserTokens: (
    userUid: string,
    mode: 'add' | 'set',
    amount: number,
    note?: string
  ) => Promise<{ ok: boolean; error?: string; newBalance?: number }>;
  onNotify?: (msg: string) => void;
}

type RateFieldMeta = {
  key: keyof TokenEconomyConfig;
  labelAr: string;
  labelEn: string;
  hintAr: string;
  hintEn: string;
  group: 'pricing' | 'rewards';
};

const RATE_FIELDS: RateFieldMeta[] = [
  {
    key: 'defaultPremiumBookPrice',
    labelAr: 'السعر الافتراضي للكتاب البريميوم',
    labelEn: 'Default Premium Book Price',
    hintAr: 'يُطبق على الكتب البريميوم ما لم تحدد سعراً خاصاً لكتاب معين.',
    hintEn: 'Applied to premium books unless a custom price is set.',
    group: 'pricing',
  },
  {
    key: 'defaultPremiumThemePrice',
    labelAr: 'السعر الافتراضي للسمة / الخلفية البريميوم',
    labelEn: 'Default Premium Theme Price',
    hintAr: 'يُطبق على السمات البريميوم ما لم تحدد سعراً خاصاً لسمة معينة.',
    hintEn: 'Applied to premium themes unless a custom price is set.',
    group: 'pricing',
  },
  {
    key: 'defaultPremiumIconPrice',
    labelAr: 'السعر الافتراضي لأيقونة التطبيق البريميوم',
    labelEn: 'Default Premium App Icon Price',
    hintAr: 'يُطبق على أيقونات التطبيق VIP ما لم تحدد سعراً خاصاً لأيقونة معينة.',
    hintEn: 'Applied to VIP app icons unless a custom price is set.',
    group: 'pricing',
  },
  {
    key: 'publishRegularBookCost',
    labelAr: 'تكلفة نشر كتاب عادي (للمستخدمين)',
    labelEn: 'Regular Book Publishing Cost',
    hintAr: 'العملات المطلوبة عند إرسال كتاب عادي للنشر.',
    hintEn: 'Tokens charged when submitting a regular book.',
    group: 'pricing',
  },
  {
    key: 'publishPremiumBookCost',
    labelAr: 'تكلفة نشر كتاب بريميوم (للمستخدمين)',
    labelEn: 'Premium Book Publishing Cost',
    hintAr: 'العملات المطلوبة عند إرسال كتاب بريميوم (تختلف عن الكتاب العادي).',
    hintEn: 'Tokens charged when submitting a premium book.',
    group: 'pricing',
  },
  {
    key: 'welcomeBonusTokens',
    labelAr: 'مكافأة الترحيب للحساب الجديد',
    labelEn: 'New Account Welcome Bonus',
    hintAr: 'تُمنح تلقائياً مرة واحدة عند تسجيل حساب جديد.',
    hintEn: 'Granted automatically once when a reader signs up.',
    group: 'rewards',
  },
  {
    key: 'rewardCommentOnBook',
    labelAr: 'مكافأة التعليق على كتابك',
    labelEn: 'Comment on Your Book Reward',
    hintAr: 'يحصل عليها صاحب الكتاب عند إضافة قارئ تعليقاً جديداً على كتابه.',
    hintEn: 'Earned by the book author when someone comments on their book.',
    group: 'rewards',
  },
  {
    key: 'rewardBookRatingAbove4',
    labelAr: 'مكافأة وصول تقييم الكتاب أعلى من 4.0 ★',
    labelEn: 'Book Rating > 4.0 ★ Bonus',
    hintAr: 'مكافأة إضافية لصاحب الكتاب عندما يتجاوز متوسط تقييم كتابه 4 نجوم.',
    hintEn: 'Bonus awarded to the author once their book rating exceeds 4.0 stars.',
    group: 'rewards',
  },
  {
    key: 'rewardBookCompleted',
    labelAr: 'مكافأة إتمام قراءة كتاب ١٠٠٪',
    labelEn: 'Book 100% Completion Reward',
    hintAr: 'تُمنح للقارئ عند إنهاء قراءة كتاب كامل لأول مرة.',
    hintEn: 'Earned by a reader when finishing a book 100%.',
    group: 'rewards',
  },
  {
    key: 'rewardNewFollower',
    labelAr: 'مكافأة متابع جديد',
    labelEn: 'New Follower Reward',
    hintAr: 'تُمنح لصاحب الحساب عند متابعته من مستخدم جديد.',
    hintEn: 'Earned when another reader follows your account.',
    group: 'rewards',
  },
  {
    key: 'rewardReviewLike',
    labelAr: 'مكافأة إعجاب بتعليقك',
    labelEn: 'Review Like Reward',
    hintAr: 'تُمنح لصاحب التعليق عند حصوله على إعجاب.',
    hintEn: 'Earned by a reviewer when someone likes their comment.',
    group: 'rewards',
  },
  {
    key: 'rewardBookApproved',
    labelAr: 'مكافأة قبول ونشر كتابك',
    labelEn: 'Book Approved & Published Bonus',
    hintAr: 'تُمنح للمؤلف عند موافقة المطور ونشر كتابه.',
    hintEn: 'Earned by the author when a submitted book is approved.',
    group: 'rewards',
  },
];

export const DeveloperEconomyPanel: React.FC<DeveloperEconomyPanelProps> = ({
  economyConfig,
  books,
  devUsersList,
  themeAccessMap,
  iconAccessMap,
  isAuthenticated,
  lang,
  onUpdateEconomyConfig,
  onSetItemTokenPrice,
  onAdjustUserTokens,
  onNotify,
}) => {
  const isEn = lang === 'en';
  const [draftConfig, setDraftConfig] = useState<TokenEconomyConfig>(economyConfig);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Per-item price drafts (`"book:<id>"` or `"theme:<id>"` -> string)
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingPriceKey, setSavingPriceKey] = useState<string | null>(null);
  const [showAllItemPrices, setShowAllItemPrices] = useState(false);

  // User wallet adjustment form
  const [selectedUserUid, setSelectedUserUid] = useState<string>('');
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustAmount, setAdjustAmount] = useState<string>('25');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [adjustingUser, setAdjustingUser] = useState(false);
  const [adjustFeedback, setAdjustFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    setDraftConfig(economyConfig);
  }, [economyConfig]);

  useEffect(() => {
    if (!selectedUserUid && devUsersList.length > 0) {
      setSelectedUserUid(devUsersList[0].uid);
    }
  }, [devUsersList, selectedUserUid]);

  const premiumBooks = books.filter((b) => Boolean(b.isPremium));

  const getPriceInputVal = (key: string, currentOverride: number | null | undefined): string => {
    if (key in priceDrafts) return priceDrafts[key];
    return typeof currentOverride === 'number' ? String(currentOverride) : '';
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigFeedback(null);
    setSavingConfig(true);
    try {
      const res = await onUpdateEconomyConfig(draftConfig);
      if (res.ok) {
        const msg = isEn
          ? 'Updated all token prices and reward rates.'
          : 'تم حفظ جميع أسعار العملات والمكافآت وتطبيقها فوراً.';
        setConfigFeedback({ type: 'ok', text: msg });
        onNotify?.(msg);
      } else {
        setConfigFeedback({
          type: 'err',
          text:
            res.error ??
            (isEn ? 'Failed to update token rates.' : 'تعذّر حفظ إعدادات العملات حالياً.'),
        });
      }
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveItemPrice = async (
    targetType: 'book' | 'theme' | 'icon',
    targetId: string,
    rawInput: string | null
  ) => {
    const key = `${targetType}:${targetId}`;
    let parsedPrice: number | null = null;
    if (rawInput !== null && rawInput.trim() !== '') {
      const n = Math.floor(Number(rawInput));
      if (!Number.isFinite(n) || n < 0) return;
      parsedPrice = n;
    }

    setSavingPriceKey(key);
    try {
      const res = await onSetItemTokenPrice(targetType, targetId, parsedPrice);
      if (res.ok) {
        setPriceDrafts((prev) => {
          const next = { ...prev };
          if (parsedPrice === null) {
            delete next[key];
          } else {
            next[key] = String(parsedPrice);
          }
          return next;
        });
        onNotify?.(
          parsedPrice === null
            ? isEn
              ? 'Reset item to global default token price.'
              : 'تم إرجاع السعر للسعر الافتراضي العام.'
            : isEn
              ? `Updated custom token price to ${parsedPrice}.`
              : `تم تحديث سعر العملات المخصص إلى ${parsedPrice} عملة.`
        );
      }
    } finally {
      setSavingPriceKey(null);
    }
  };

  const handleAdjustTokensSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = selectedUserUid || devUsersList[0]?.uid;
    if (!uid) return;
    const numeric = Math.trunc(Number(adjustAmount));
    if (!Number.isFinite(numeric)) {
      setAdjustFeedback({
        type: 'err',
        text: isEn ? 'Enter a valid integer amount.' : 'يرجى إدخال رقم صحيح.',
      });
      return;
    }
    if (adjustMode === 'set' && numeric < 0) {
      setAdjustFeedback({
        type: 'err',
        text: isEn ? 'Balance cannot be negative.' : 'لا يمكن أن يكون الرصيد أقل من صفر.',
      });
      return;
    }
    if (adjustMode === 'add' && numeric === 0) {
      setAdjustFeedback({
        type: 'err',
        text: isEn ? 'Enter a non-zero adjustment (e.g. 50 or -10).' : 'أدخل قيمة غير صفرية (مثل 50 أو -10).',
      });
      return;
    }

    setAdjustFeedback(null);
    setAdjustingUser(true);
    try {
      const res = await onAdjustUserTokens(uid, adjustMode, numeric, adjustNote.trim() || undefined);
      if (res.ok) {
        const targetUser = devUsersList.find((u) => u.uid === uid);
        const msg = isEn
          ? `Updated ${targetUser?.displayName ?? 'user'}'s balance to ${res.newBalance ?? 0} tokens.`
          : `تم تحديث رصيد «${targetUser?.displayName ?? 'المستخدم'}» إلى ${res.newBalance ?? 0} عملة ذهبية.`;
        setAdjustFeedback({ type: 'ok', text: msg });
        setAdjustNote('');
        onNotify?.(msg);
      } else {
        setAdjustFeedback({
          type: 'err',
          text: res.error ?? (isEn ? 'Failed to adjust tokens.' : 'تعذّر تعديل رصيد العملات.'),
        });
      }
    } finally {
      setAdjustingUser(false);
    }
  };

  const visibleBooks = showAllItemPrices ? premiumBooks : premiumBooks.slice(0, 4);
  const visibleThemes = showAllItemPrices ? PREMIUM_THEMES : PREMIUM_THEMES.slice(0, 4);
  const visibleIcons = showAllItemPrices ? PREMIUM_APP_ICONS : PREMIUM_APP_ICONS.slice(0, 4);
  const hiddenCount =
    Math.max(0, premiumBooks.length - 4) +
    Math.max(0, PREMIUM_THEMES.length - 4) +
    Math.max(0, PREMIUM_APP_ICONS.length - 4);

  return (
    <div className="space-y-6 rounded-lg border border-amber-500/45 bg-[var(--bg-surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/45 bg-amber-500/12">
            <TokenIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
              {isEn
                ? 'Golden Rhombus Token Economy Control'
                : 'إدارة نظام العملات الذهبية (الأسعار والمكافآت)'}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {isEn
                ? 'Control book/theme prices, regular vs. premium publishing fees, comment & >4★ rewards, and user balances anytime.'
                : 'تحكم في سعر كل كتاب وسمة، وتكلفة نشر الكتب العادية والبريميوم، ومكافآت التعليقات والتقييم فوق ٤ نجوم، وأرصدة الحسابات في أي وقت.'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Global Rates & Rewards Form */}
      <form onSubmit={handleSaveRates} className="space-y-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pricing & Publishing Costs */}
          <div className="space-y-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
              {isEn ? 'Prices & Publishing Costs' : 'الأسعار وتكاليف النشر'}
            </p>
            <div className="space-y-3">
              {RATE_FIELDS.filter((f) => f.group === 'pricing').map((field) => (
                <div
                  key={field.key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`econ-${field.key}`}
                      className="block text-xs font-semibold text-[var(--text-ink)]"
                    >
                      {isEn ? field.labelEn : field.labelAr}
                    </label>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      {isEn ? field.hintEn : field.hintAr}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <TokenIcon className="h-4 w-4" />
                    <input
                      id={`econ-${field.key}`}
                      type="number"
                      min={0}
                      max={100000}
                      dir="ltr"
                      value={draftConfig[field.key]}
                      onChange={(e) => {
                        const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        setDraftConfig((prev) => ({ ...prev, [field.key]: val }));
                      }}
                      className="w-20 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-center font-mono-tabular text-xs font-bold text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Earning Rewards */}
          <div className="space-y-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <TokenIcon className="h-3.5 w-3.5" />
              {isEn ? 'Earning Rewards (Author & Reader)' : 'مكافآت كسب العملات'}
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {RATE_FIELDS.filter((f) => f.group === 'rewards').map((field) => (
                <div
                  key={field.key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`econ-${field.key}`}
                      className="block text-xs font-semibold text-[var(--text-ink)]"
                    >
                      {isEn ? field.labelEn : field.labelAr}
                    </label>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      {isEn ? field.hintEn : field.hintAr}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <TokenIcon className="h-4 w-4" />
                    <input
                      id={`econ-${field.key}`}
                      type="number"
                      min={0}
                      max={100000}
                      dir="ltr"
                      value={draftConfig[field.key]}
                      onChange={(e) => {
                        const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        setDraftConfig((prev) => ({ ...prev, [field.key]: val }));
                      }}
                      className="w-20 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-center font-mono-tabular text-xs font-bold text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDraftConfig(DEFAULT_TOKEN_ECONOMY_CONFIG)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:border-amber-500 hover:text-[var(--text-ink)]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isEn ? 'Reset to Defaults' : 'إرجاع القيم الافتراضية'}</span>
          </button>

          <button
            type="submit"
            disabled={savingConfig}
            className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-5 py-2 text-xs font-semibold text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {savingConfig
                ? isEn
                  ? 'Saving Rates...'
                  : 'جاري الحفظ...'
                : isEn
                  ? 'Save Token Rates & Rewards'
                  : 'حفظ أسعار العملات والمكافآت'}
            </span>
          </button>
        </div>

        {configFeedback && (
          <p
            role="status"
            className={`rounded-md border px-3.5 py-2 text-xs font-semibold ${
              configFeedback.type === 'ok'
                ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-rose-500/45 bg-rose-500/10 text-rose-500'
            }`}
          >
            {configFeedback.text}
          </p>
        )}
      </form>

      {/* 2. Per-Item Custom Token Prices */}
      <div className="space-y-4 border-t border-[var(--border-hairline)] pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-editorial text-lg font-bold text-[var(--text-ink)]">
              {isEn
                ? 'Custom Price per Premium Book, Theme & App Icon'
                : 'تخصيص سعر كل كتاب أو سمة أو أيقونة تطبيق بريميوم'}
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              {isEn
                ? 'Leave empty or click "Default" to follow the global default price above.'
                : 'اتركه فارغاً أو اضغط «افتراضي» ليأخذ السعر الافتراضي العام المحدد بالأعلى.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Premium Books */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {isEn ? `Premium Books (${premiumBooks.length})` : `الكتب البريميوم (${premiumBooks.length})`}
            </p>
            {premiumBooks.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                {isEn ? 'No premium books yet.' : 'لا توجد كتب بريميوم حالياً.'}
              </p>
            ) : (
              visibleBooks.map((b) => {
                const key = `book:${b.id}`;
                const inputVal = getPriceInputVal(key, b.tokenPrice);
                const effPrice =
                  b.effectiveTokenPrice ??
                  b.tokenPrice ??
                  economyConfig.defaultPremiumBookPrice;
                const isCustom = typeof b.tokenPrice === 'number';
                const busy = savingPriceKey === key;

                return (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--text-ink)]">{b.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <TokenIcon className="h-3 w-3" />
                        <span className="font-mono-tabular font-bold text-amber-500">
                          {effPrice}
                        </span>
                        <span>
                          ·{' '}
                          {isCustom
                            ? isEn
                              ? 'Custom Price'
                              : 'سعر مخصص'
                            : isEn
                              ? 'Global Default'
                              : 'السعر الافتراضي'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        dir="ltr"
                        placeholder={String(economyConfig.defaultPremiumBookPrice)}
                        value={inputVal}
                        onChange={(e) =>
                          setPriceDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-16 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-center font-mono-tabular text-xs text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={busy || !inputVal.trim()}
                        onClick={() => void handleSaveItemPrice('book', b.id, inputVal)}
                        className="rounded bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                      >
                        {isEn ? 'Save' : 'حفظ'}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleSaveItemPrice('book', b.id, null)}
                          className="rounded border border-[var(--border-hairline)] px-2 py-1 text-[11px] text-[var(--text-muted)] hover:border-amber-500 hover:text-[var(--text-ink)] disabled:opacity-50"
                        >
                          {isEn ? 'Default' : 'افتراضي'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Premium Themes */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {isEn
                ? `Premium Themes (${PREMIUM_THEMES.length})`
                : `السمات البريميوم (${PREMIUM_THEMES.length})`}
            </p>
            {visibleThemes.map((t) => {
              const key = `theme:${t.id}`;
              const access = themeAccessMap?.[t.id];
              const currentCustom =
                access?.tokenPrice !== undefined
                  ? access.tokenPrice
                  : t.tokenPriceOverride !== undefined
                    ? t.tokenPriceOverride
                    : null;
              const effPrice =
                access?.effectiveTokenPrice ??
                (typeof currentCustom === 'number'
                  ? currentCustom
                  : economyConfig.defaultPremiumThemePrice);
              const inputVal = getPriceInputVal(key, currentCustom);
              const isCustom = typeof currentCustom === 'number';
              const busy = savingPriceKey === key;

              return (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--text-ink)]">
                      {getThemeDisplayName(t, lang)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                      <TokenIcon className="h-3 w-3" />
                      <span className="font-mono-tabular font-bold text-amber-500">
                        {effPrice}
                      </span>
                      <span>
                        ·{' '}
                        {isCustom
                          ? isEn
                            ? 'Custom Price'
                            : 'سعر مخصص'
                          : isEn
                            ? 'Global Default'
                            : 'السعر الافتراضي'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      dir="ltr"
                      placeholder={String(economyConfig.defaultPremiumThemePrice)}
                      value={inputVal}
                      onChange={(e) =>
                        setPriceDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-16 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-center font-mono-tabular text-xs text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy || !inputVal.trim()}
                      onClick={() => void handleSaveItemPrice('theme', t.id, inputVal)}
                      className="rounded bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      {isEn ? 'Save' : 'حفظ'}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSaveItemPrice('theme', t.id, null)}
                        className="rounded border border-[var(--border-hairline)] px-2 py-1 text-[11px] text-[var(--text-muted)] hover:border-amber-500 hover:text-[var(--text-ink)] disabled:opacity-50"
                      >
                        {isEn ? 'Default' : 'افتراضي'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Premium App Icons */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {isEn
                ? `Premium App Icons (${PREMIUM_APP_ICONS.length})`
                : `أيقونات التطبيق البريميوم (${PREMIUM_APP_ICONS.length})`}
            </p>
            {visibleIcons.map((ic) => {
              const key = `icon:${ic.id}`;
              const access = iconAccessMap?.[ic.id];
              const currentCustom =
                access?.tokenPrice !== undefined
                  ? access.tokenPrice
                  : ic.tokenPriceOverride !== undefined
                    ? ic.tokenPriceOverride
                    : null;
              const effPrice =
                access?.effectiveTokenPrice ??
                (typeof currentCustom === 'number'
                  ? currentCustom
                  : economyConfig.defaultPremiumIconPrice ?? 50);
              const inputVal = getPriceInputVal(key, currentCustom);
              const isCustom = typeof currentCustom === 'number';
              const busy = savingPriceKey === key;

              return (
                <div
                  key={ic.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-amber-500/40">
                      <AppIconGraphic iconId={ic.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--text-ink)]">
                        {isEn ? ic.nameEn : ic.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <TokenIcon className="h-3 w-3" />
                        <span className="font-mono-tabular font-bold text-amber-500">
                          {effPrice}
                        </span>
                        <span>
                          ·{' '}
                          {isCustom
                            ? isEn
                              ? 'Custom Price'
                              : 'سعر مخصص'
                            : isEn
                              ? 'Global Default'
                              : 'السعر الافتراضي'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      dir="ltr"
                      placeholder={String(economyConfig.defaultPremiumIconPrice ?? 50)}
                      value={inputVal}
                      onChange={(e) =>
                        setPriceDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-16 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-center font-mono-tabular text-xs text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy || !inputVal.trim()}
                      onClick={() => void handleSaveItemPrice('icon', ic.id, inputVal)}
                      className="rounded bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      {isEn ? 'Save' : 'حفظ'}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSaveItemPrice('icon', ic.id, null)}
                        className="rounded border border-[var(--border-hairline)] px-2 py-1 text-[11px] text-[var(--text-muted)] hover:border-amber-500 hover:text-[var(--text-ink)] disabled:opacity-50"
                      >
                        {isEn ? 'Default' : 'افتراضي'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {hiddenCount > 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllItemPrices((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/45 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-stone-950"
            >
              {showAllItemPrices ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isEn ? 'Show Less' : 'عرض أقل'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {isEn ? `Show All (+${hiddenCount})` : `عرض الكل (+${hiddenCount} إضافي)`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 3. Quick User Token Wallet Manager */}
      {isAuthenticated && devUsersList.length > 0 && (
        <div className="space-y-3 border-t border-[var(--border-hairline)] pt-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <h4 className="font-editorial text-lg font-bold text-[var(--text-ink)]">
              {isEn ? 'Adjust User Token Balance' : 'تعديل رصيد العملات لحساب معين'}
            </h4>
          </div>

          <form
            onSubmit={handleAdjustTokensSubmit}
            className="grid grid-cols-1 gap-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 sm:grid-cols-12"
          >
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                {isEn ? 'Account' : 'الحساب'}
              </label>
              <select
                value={selectedUserUid || devUsersList[0]?.uid || ''}
                onChange={(e) => setSelectedUserUid(e.target.value)}
                className="mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs font-medium text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
              >
                {devUsersList.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.displayName} ({u.tokensBalance ?? 0} ◈)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                {isEn ? 'Operation' : 'العملية'}
              </label>
              <select
                value={adjustMode}
                onChange={(e) => setAdjustMode(e.target.value === 'set' ? 'set' : 'add')}
                className="mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
              >
                <option value="add">{isEn ? 'Add / Deduct (+/-)' : 'إضافة / خصم (+/-)'}</option>
                <option value="set">{isEn ? 'Set Exact Balance' : 'تعيين رصيد محدد'}</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                {isEn ? 'Amount' : 'الكمية'}
              </label>
              <input
                type="number"
                dir="ltr"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-2 text-center font-mono-tabular text-xs font-bold text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                {isEn ? 'Note (optional)' : 'سبب / ملاحظة (اختياري)'}
              </label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder={isEn ? 'Bonus...' : 'مكافأة...'}
                className="mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end sm:col-span-2">
              <button
                type="submit"
                disabled={adjustingUser}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isEn ? 'Apply' : 'تنفيذ'}</span>
              </button>
            </div>
          </form>

          {adjustFeedback && (
            <p
              role="status"
              className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                adjustFeedback.type === 'ok'
                  ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500/45 bg-rose-500/10 text-rose-500'
              }`}
            >
              {adjustFeedback.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
