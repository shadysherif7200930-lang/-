import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  Check,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Palette,
  RefreshCw,
  Search,
  Sparkles,
  Unlock,
  User,
  X,
} from 'lucide-react';
import type { BookRecord } from '../db/booksDb';
import { getThemeDisplayName, type AppLanguage } from '../i18n';
import { PREMIUM_THEMES, type ThemeDefinition } from '../themeCatalog';
import { OwnerBadge } from './BookRatingBar';

export interface GiftDirectoryAccount {
  uid: string;
  displayName: string;
  isVerified: boolean;
  followersCount: number;
  publishedBooksCount: number;
  isFollowing: boolean;
  ownedBookIds?: string[];
  ownedThemeIds?: string[];
}

interface PremiumCatalogChoice {
  key: string;
  targetType: 'book' | 'theme';
  targetId: string;
  label: string;
  subLabel: string;
}

interface GiftPremiumModalProps {
  open: boolean;
  isAuthenticated: boolean;
  authLoading?: boolean;
  authError?: string | null;
  lang?: AppLanguage;
  fixedRecipient?: {
    uid: string;
    displayName: string;
    isVerified: boolean;
  } | null;
  initialItem?: {
    targetType: 'book' | 'theme';
    targetId: string;
    label?: string;
    isOwned?: boolean;
  } | null;
  ownedPremiumBooks: BookRecord[];
  ownedPremiumThemes: ThemeDefinition[];
  allCatalogBooks?: BookRecord[];
  directoryAccounts: GiftDirectoryAccount[];
  loadingDirectory: boolean;
  directoryError?: string | null;
  onRetryDirectory?: () => void;
  onUnlockTarget?: (targetId: string, code: string) => Promise<boolean>;
  onSignIn: () => Promise<void>;
  onClose: () => void;
  onConfirmTransfer: (
    recipientUid: string,
    targetType: 'book' | 'theme',
    targetId: string
  ) => Promise<{ ok: boolean; error?: string; itemLabel?: string }>;
  onCreateTradeRequest?: (payload: {
    recipientUid: string;
    offeredType: 'book' | 'theme';
    offeredId: string;
    requestedType: 'book' | 'theme';
    requestedId: string;
  }) => Promise<{ ok: boolean; error?: string; tradeId?: string }>;
}

export const GiftPremiumModal: React.FC<GiftPremiumModalProps> = ({
  open,
  isAuthenticated,
  authLoading = false,
  authError = null,
  lang = 'ar',
  fixedRecipient = null,
  initialItem = null,
  ownedPremiumBooks,
  ownedPremiumThemes,
  allCatalogBooks = [],
  directoryAccounts,
  loadingDirectory,
  directoryError = null,
  onRetryDirectory,
  onUnlockTarget,
  onSignIn,
  onClose,
  onConfirmTransfer,
  onCreateTradeRequest,
}) => {
  const isEn = lang === 'en';
  const [mode, setMode] = useState<'gift' | 'trade'>('gift');
  const [selectedItemKey, setSelectedItemKey] = useState<string>('');
  const [offeredItemKey, setOfferedItemKey] = useState<string>('');
  const [requestedItemKey, setRequestedItemKey] = useState<string>('');
  const [selectedRecipientUid, setSelectedRecipientUid] = useState<string>('');
  const [friendSearch, setFriendSearch] = useState('');
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const ownedItems = useMemo<PremiumCatalogChoice[]>(() => {
    const list: PremiumCatalogChoice[] = [];
    for (const b of ownedPremiumBooks) {
      list.push({
        key: `book:${b.id}`,
        targetType: 'book',
        targetId: b.id,
        label: b.title,
        subLabel: isEn ? `Premium Book · ${b.author}` : `كتاب بريميوم · ${b.author}`,
      });
    }
    for (const t of ownedPremiumThemes) {
      list.push({
        key: `theme:${t.id}`,
        targetType: 'theme',
        targetId: t.id,
        label: getThemeDisplayName(t, lang),
        subLabel: isEn ? 'Premium Theme' : 'سمة بريميوم',
      });
    }
    return list;
  }, [ownedPremiumBooks, ownedPremiumThemes, isEn, lang]);

  const ownedKeySet = useMemo(() => new Set(ownedItems.map((i) => i.key)), [ownedItems]);

  const allPremiumItemMap = useMemo(() => {
    const map = new Map<string, PremiumCatalogChoice>();
    for (const b of allCatalogBooks) {
      if (!b.isPremium) continue;
      const key = `book:${b.id}`;
      map.set(key, {
        key,
        targetType: 'book',
        targetId: b.id,
        label: b.title,
        subLabel: isEn ? `Premium Book · ${b.author}` : `كتاب بريميوم · ${b.author}`,
      });
    }
    for (const b of ownedPremiumBooks) {
      const key = `book:${b.id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          targetType: 'book',
          targetId: b.id,
          label: b.title,
          subLabel: isEn ? `Premium Book · ${b.author}` : `كتاب بريميوم · ${b.author}`,
        });
      }
    }
    for (const t of PREMIUM_THEMES) {
      const key = `theme:${t.id}`;
      map.set(key, {
        key,
        targetType: 'theme',
        targetId: t.id,
        label: getThemeDisplayName(t, lang),
        subLabel: isEn ? 'Premium Theme' : 'سمة بريميوم',
      });
    }
    return map;
  }, [allCatalogBooks, ownedPremiumBooks, isEn, lang]);

  const initialKey = initialItem ? `${initialItem.targetType}:${initialItem.targetId}` : '';
  const initialIsOwned = initialItem
    ? Boolean(initialItem.isOwned) || ownedKeySet.has(initialKey)
    : false;
  const fixedUid = fixedRecipient?.uid ?? '';
  const prevInitRef = useRef<{ open: boolean; initialKey: string; fixedUid: string }>({
    open: false,
    initialKey: '',
    fixedUid: '',
  });

  useEffect(() => {
    const prev = prevInitRef.current;
    const shouldReset =
      open &&
      (!prev.open || prev.initialKey !== initialKey || prev.fixedUid !== fixedUid);
    prevInitRef.current = { open, initialKey, fixedUid };

    if (!open || !shouldReset) return;
    setMode('gift');
    setErrorMsg(null);
    setSuccessMsg(null);
    setFriendSearch('');
    setUnlockCode('');
    setUnlockError(null);
    setSelectedRecipientUid(fixedUid);
    if (initialKey) {
      setSelectedItemKey(initialKey);
    } else {
      setSelectedItemKey(ownedItems[0]?.key ?? '');
    }
    if (initialKey && initialIsOwned) {
      setOfferedItemKey(initialKey);
      setRequestedItemKey('');
    } else if (initialKey && !initialIsOwned) {
      setOfferedItemKey(ownedItems[0]?.key ?? '');
      setRequestedItemKey(initialKey);
    } else {
      setOfferedItemKey(ownedItems[0]?.key ?? '');
      setRequestedItemKey('');
    }
  }, [open, initialKey, initialIsOwned, fixedUid, ownedItems]);

  useEffect(() => {
    if (!open) return;
    if (!initialKey && !selectedItemKey && ownedItems.length > 0) {
      setSelectedItemKey(ownedItems[0].key);
    }
    if (!offeredItemKey && ownedItems.length > 0) {
      setOfferedItemKey(ownedItems[0].key);
    }
  }, [open, initialKey, selectedItemKey, offeredItemKey, ownedItems]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const getFriendTradableItems = (acc: GiftDirectoryAccount | null | undefined): PremiumCatalogChoice[] => {
    if (!acc) return [];
    const list: PremiumCatalogChoice[] = [];
    for (const bookId of acc.ownedBookIds ?? []) {
      const key = `book:${bookId}`;
      if (ownedKeySet.has(key)) continue;
      const info = allPremiumItemMap.get(key);
      if (info) list.push(info);
    }
    for (const themeId of acc.ownedThemeIds ?? []) {
      const key = `theme:${themeId}`;
      if (ownedKeySet.has(key)) continue;
      const info = allPremiumItemMap.get(key);
      if (info) list.push(info);
    }
    return list;
  };

  const filteredAccounts = useMemo(() => {
    const q = friendSearch.trim().toLowerCase();
    const base = !q
      ? directoryAccounts
      : directoryAccounts.filter((acc) => acc.displayName.toLowerCase().includes(q));

    if (mode !== 'trade' || !initialKey || initialIsOwned) {
      return base;
    }

    return [...base].sort((a, b) => {
      const aHas =
        (initialItem?.targetType === 'book'
          ? a.ownedBookIds?.includes(initialItem.targetId)
          : a.ownedThemeIds?.includes(initialItem?.targetId ?? '')) ?? false;
      const bHas =
        (initialItem?.targetType === 'book'
          ? b.ownedBookIds?.includes(initialItem.targetId)
          : b.ownedThemeIds?.includes(initialItem?.targetId ?? '')) ?? false;
      if (aHas !== bHas) return aHas ? -1 : 1;
      return 0;
    });
  }, [directoryAccounts, friendSearch, mode, initialKey, initialIsOwned, initialItem]);

  const activeRecipient = useMemo(() => {
    const uid = fixedRecipient?.uid || selectedRecipientUid;
    if (!uid) return null;
    const fromDir = directoryAccounts.find((a) => a.uid === uid);
    if (fromDir) return fromDir;
    if (fixedRecipient) {
      return {
        uid: fixedRecipient.uid,
        displayName: fixedRecipient.displayName,
        isVerified: fixedRecipient.isVerified,
        followersCount: 0,
        publishedBooksCount: 0,
        isFollowing: false,
        ownedBookIds: [],
        ownedThemeIds: [],
      } satisfies GiftDirectoryAccount;
    }
    return null;
  }, [fixedRecipient, selectedRecipientUid, directoryAccounts]);

  const friendTradableItems = useMemo(
    () => getFriendTradableItems(activeRecipient),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeRecipient, ownedKeySet, allPremiumItemMap]
  );

  useEffect(() => {
    if (mode !== 'trade' || !activeRecipient) return;
    if (friendTradableItems.length === 0) {
      if (requestedItemKey && !(initialKey && !initialIsOwned && requestedItemKey === initialKey)) {
        setRequestedItemKey('');
      }
      return;
    }
    const stillValid = friendTradableItems.some((item) => item.key === requestedItemKey);
    if (!stillValid) {
      if (initialKey && !initialIsOwned && friendTradableItems.some((i) => i.key === initialKey)) {
        setRequestedItemKey(initialKey);
      } else {
        setRequestedItemKey(friendTradableItems[0].key);
      }
    }
  }, [mode, activeRecipient, friendTradableItems, requestedItemKey, initialKey, initialIsOwned]);

  if (!open) return null;

  const isSpecificItemMode = Boolean(initialItem);
  const requestedIsLocked = Boolean(initialItem && !initialIsOwned);

  const selectedItem = isSpecificItemMode
    ? ownedItems.find((i) => i.key === initialKey) ??
      (initialIsOwned && initialItem
        ? {
            key: initialKey,
            targetType: initialItem.targetType,
            targetId: initialItem.targetId,
            label: initialItem.label || initialItem.targetId,
            subLabel:
              initialItem.targetType === 'book'
                ? isEn
                  ? 'Premium Book'
                  : 'كتاب بريميوم'
                : isEn
                  ? 'Premium Theme'
                  : 'سمة بريميوم',
          }
        : null)
    : ownedItems.find((i) => i.key === selectedItemKey) ?? null;

  const offeredItem = ownedItems.find((i) => i.key === offeredItemKey) ?? null;
  const requestedItem = friendTradableItems.find((i) => i.key === requestedItemKey) ?? null;

  const handleUnlockCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialItem || !onUnlockTarget) return;
    const cleaned = unlockCode.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setUnlockError(
        isEn
          ? 'Please enter the 10-digit activation code first.'
          : 'أدخل كود التفعيل المكوّن من 10 أرقام أولاً.'
      );
      return;
    }
    setUnlockError(null);
    setUnlockBusy(true);
    try {
      const ok = await onUnlockTarget(initialItem.targetId, cleaned);
      if (!ok) {
        setUnlockError(
          isEn
            ? 'Invalid or expired activation code for this item.'
            : 'الكود غير صحيح أو انتهت صلاحيته لهذا المحتوى.'
        );
      } else {
        setUnlockCode('');
      }
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleSubmitGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setErrorMsg(
        isEn
          ? 'This premium item must be unlocked on your account first.'
          : 'يجب أن يكون هذا المحتوى مفعّلاً في حسابك أولاً.'
      );
      return;
    }
    if (!activeRecipient) {
      setErrorMsg(
        isEn
          ? 'Please choose who you want to send this gift to.'
          : 'اختار الشخص الذي تريد أن تبعث له الهدية أولاً.'
      );
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await onConfirmTransfer(
        activeRecipient.uid,
        selectedItem.targetType,
        selectedItem.targetId
      );
      if (!res.ok) {
        setErrorMsg(
          res.error ??
            (isEn
              ? 'Could not complete gift transfer.'
              : 'تعذّر إتمام نقل الهدية في الوقت الحالي.')
        );
        return;
      }
      setSuccessMsg(
        isEn
          ? `Successfully sent "${res.itemLabel || selectedItem.label}" to ${activeRecipient.displayName} and removed it from your account.`
          : `تم إرسال «${res.itemLabel || selectedItem.label}» إلى حساب ${activeRecipient.displayName} ومسحها من حسابك بنجاح!`
      );
      window.setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateTradeRequest) return;
    if (!offeredItem) {
      setErrorMsg(
        isEn
          ? 'Select an unlocked premium book or theme from your account to offer.'
          : 'اختر كتاباً أو سمة بريميوم مفعّلة من حسابك لتعرضها في التبديل.'
      );
      return;
    }
    if (!activeRecipient) {
      setErrorMsg(
        isEn
          ? 'Select the person you want to trade with.'
          : 'اختر الشخص الذي تريد طلب التبديل معه.'
      );
      return;
    }
    if (!requestedItem) {
      setErrorMsg(
        isEn
          ? 'Select which premium book or theme you want from this friend.'
          : 'اختر الكتاب أو السمة البريميوم التي تريدها من صديقك.'
      );
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await onCreateTradeRequest({
        recipientUid: activeRecipient.uid,
        offeredType: offeredItem.targetType,
        offeredId: offeredItem.targetId,
        requestedType: requestedItem.targetType,
        requestedId: requestedItem.targetId,
      });
      if (!res.ok) {
        setErrorMsg(
          res.error ??
            (isEn
              ? 'Could not send trade request.'
              : 'تعذّر إرسال طلب التبديل في الوقت الحالي.')
        );
        return;
      }
      setSuccessMsg(
        isEn
          ? `Trade request sent to ${activeRecipient.displayName}! They can accept or decline it from their account.`
          : `تم إرسال طلب التبديل إلى ${activeRecipient.displayName}! سيصله إشعار ويمكنه الموافقة أو الرفض من حسابه.`
      );
      window.setTimeout(() => {
        onClose();
      }, 1600);
    } finally {
      setSubmitting(false);
    }
  };

  const renderRecipientSelector = (labelText: string, showOwnedCounts: boolean) => (
    <div>
      <label className="block text-sm font-bold text-[var(--text-ink)]">{labelText}</label>

      {fixedRecipient ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--accent-primary)]"
            >
              <User className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                {fixedRecipient.displayName}
              </span>
              {fixedRecipient.isVerified && (
                <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
              )}
            </div>
          </div>
          {showOwnedCounts && activeRecipient && (
            <span className="text-[11px] font-medium text-[var(--text-muted)] shrink-0">
              {loadingDirectory
                ? isEn
                  ? 'Loading...'
                  : 'جاري التحميل...'
                : isEn
                  ? `${friendTradableItems.length} tradable`
                  : `${friendTradableItems.length} متاح للتبديل`}
            </span>
          )}
        </div>
      ) : (
        <div className="mt-2.5 space-y-2.5">
          <div className="relative">
            <Search
              className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] ${
                isEn ? 'left-3' : 'right-3'
              }`}
              aria-hidden="true"
            />
            <input
              type="search"
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder={isEn ? 'Search by name...' : 'ابحث بالاسم فقط...'}
              className={`w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] py-2 text-xs text-[var(--text-ink)] focus:border-amber-500 focus:outline-none ${
                isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
              }`}
            />
          </div>

          {loadingDirectory ? (
            <p className="py-5 text-center text-xs text-[var(--text-muted)]">
              {isEn ? 'Loading accounts...' : 'جاري تحميل قائمة الأسماء...'}
            </p>
          ) : directoryError ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-center space-y-2">
              <p className="text-xs font-medium text-red-500">{directoryError}</p>
              {onRetryDirectory && (
                <button
                  type="button"
                  onClick={onRetryDirectory}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/10"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isEn ? 'Retry' : 'إعادة المحاولة'}</span>
                </button>
              )}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] py-5 text-center text-xs text-[var(--text-muted)]">
              {isEn ? 'No matching reader accounts found.' : 'لا توجد حسابات مطابقة لهذا الاسم.'}
            </p>
          ) : (
            <div className="max-h-52 space-y-2 overflow-y-auto pe-1">
              {filteredAccounts.map((acc) => {
                const selected = acc.uid === selectedRecipientUid;
                const tradableCount = showOwnedCounts ? getFriendTradableItems(acc).length : 0;
                const hasWantedInitial =
                  showOwnedCounts &&
                  Boolean(initialItem && !initialIsOwned) &&
                  (initialItem?.targetType === 'book'
                    ? acc.ownedBookIds?.includes(initialItem.targetId)
                    : acc.ownedThemeIds?.includes(initialItem?.targetId ?? ''));

                return (
                  <button
                    key={acc.uid}
                    type="button"
                    onClick={() => {
                      setSelectedRecipientUid(acc.uid);
                      setErrorMsg(null);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 ${
                      isEn ? 'text-left' : 'text-right'
                    } transition-colors ${
                      selected
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--accent-primary)]"
                      >
                        <User className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-editorial text-sm font-bold text-[var(--text-ink)]">
                            {acc.displayName}
                          </span>
                          {acc.isVerified && (
                            <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                          )}
                          {acc.isFollowing && (
                            <span className="text-[10px] font-semibold text-[var(--accent-primary)]">
                              · {isEn ? 'Following' : 'تتابعه'}
                            </span>
                          )}
                        </div>
                        {showOwnedCounts && (
                          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            {hasWantedInitial && (
                              <span className="font-bold text-amber-500">
                                {isEn ? 'Owns requested item · ' : 'يمتلك هذا العنصر · '}
                              </span>
                            )}
                            <span>
                              {tradableCount === 0
                                ? isEn
                                  ? 'No tradable premium items'
                                  : 'لا يمتلك عناصر متاحة للتبديل'
                                : isEn
                                  ? `${tradableCount} tradable premium items`
                                  : `${tradableCount} مقتنيات بريميوم للتبديل`}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    {selected && <Check className="h-4 w-4 shrink-0 text-amber-500" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-amber-500/60 bg-[var(--bg-canvas)] p-6 text-[var(--text-ink)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-500"
            >
              {mode === 'trade' ? (
                <ArrowLeftRight className="h-5 w-5" />
              ) : (
                <Gift className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-xs font-semibold text-amber-500">
                {mode === 'trade'
                  ? isEn
                    ? 'VIP Premium Swap'
                    : 'تبديل محتوى بريميوم'
                  : isEn
                    ? 'VIP Gift Transfer'
                    : 'إهداء محتوى بريميوم'}
              </p>
              <h3 id="gift-modal-title" className="font-editorial text-xl font-bold">
                {mode === 'trade'
                  ? fixedRecipient
                    ? isEn
                      ? `Trade with ${fixedRecipient.displayName}`
                      : `طلب تبديل مع ${fixedRecipient.displayName}`
                    : isEn
                      ? 'Trade Premium Books & Themes'
                      : 'طلب تبديل كتاب أو سمة بريميوم'
                  : fixedRecipient
                    ? isEn
                      ? `Send a Gift to ${fixedRecipient.displayName}`
                      : `إرسال هدية إلى ${fixedRecipient.displayName}`
                    : initialItem?.label
                      ? isEn
                        ? `Gift: ${initialItem.label}`
                        : `إهداء: ${initialItem.label}`
                      : isEn
                        ? 'Send a Premium Gift'
                        : 'اختار الشخص لإرسال الهدية'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'إغلاق'}
            className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switcher: Gift OR Trade */}
        {isAuthenticated && onCreateTradeRequest && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('gift');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'gift'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
              }`}
            >
              <Gift className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isEn ? 'Send Gift' : 'إرسال هدية'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('trade');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'trade'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
              }`}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isEn ? 'Request Trade' : 'طلب تبديل'}</span>
            </button>
          </div>
        )}

        {authLoading && !isAuthenticated ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" aria-hidden="true" />
            <p className="text-xs text-[var(--text-muted)]">
              {isEn ? 'Checking your account session...' : 'جاري التحقق من حالة حسابك...'}
            </p>
          </div>
        ) : !isAuthenticated ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {isEn
                ? 'Sign in with Google first to gift or trade unlocked premium books and themes with your friends.'
                : 'سجّل الدخول بحساب Google أولاً لتتمكن من إهداء أو تبديل الكتب والسمات البريميوم المفعّلة في حسابك.'}
            </p>
            {authError && (
              <p
                role="alert"
                className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500"
              >
                {authError}
              </p>
            )}
            <button
              type="button"
              disabled={signingIn}
              onClick={async () => {
                setSigningIn(true);
                try {
                  await onSignIn();
                } finally {
                  setSigningIn(false);
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>
                {signingIn
                  ? isEn
                    ? 'Signing in...'
                    : 'جاري تسجيل الدخول...'
                  : isEn
                    ? 'Sign in with Google'
                    : 'تسجيل الدخول بحساب Google'}
              </span>
            </button>
          </div>
        ) : mode === 'trade' ? (
          /* TRADE / SWAP FLOW */
          ownedItems.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 py-8 text-center">
              <ArrowLeftRight className="mx-auto h-8 w-8 text-amber-500/70" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-[var(--text-ink)]">
                {isEn
                  ? 'You need at least one unlocked premium book or theme to offer in a trade.'
                  : 'تحتاج إلى كتاب أو سمة بريميوم مفعّلة في حسابك أولاً لتعرضها في التبديل.'}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {isEn
                  ? 'Activate a premium book or theme first, then swap it for another item owned by a friend.'
                  : 'فعّل كتاباً أو سمة بريميوم أولاً، ثم اطلب تبديلها بأي عنصر بريميوم لدى صديقك.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitTrade} className="mt-4 space-y-5">
              {/* Step 1: Offered Item */}
              <div>
                <label className="block text-sm font-bold text-[var(--text-ink)]">
                  {isEn
                    ? '1. What you offer from your account'
                    : '١. ماذا تعرض للتبديل من حسابك؟'}
                </label>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pe-1">
                  {ownedItems.map((item) => {
                    const active = item.key === offeredItemKey;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setOfferedItemKey(item.key);
                          setErrorMsg(null);
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 ${
                          isEn ? 'text-left' : 'text-right'
                        } transition-colors ${
                          active
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.targetType === 'book' ? (
                            <BookOpen
                              className="h-4 w-4 shrink-0 text-amber-500"
                              aria-hidden="true"
                            />
                          ) : (
                            <Palette
                              className="h-4 w-4 shrink-0 text-amber-500"
                              aria-hidden="true"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-editorial text-sm font-bold text-[var(--text-ink)]">
                              {item.label}
                            </p>
                            <p className="truncate text-[11px] text-[var(--text-muted)]">
                              {item.subLabel}
                            </p>
                          </div>
                        </div>
                        {active && <Check className="h-4 w-4 shrink-0 text-amber-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Friend */}
              {renderRecipientSelector(
                isEn ? '2. Choose friend to trade with' : '٢. اختار الشخص المطلوب التبديل معه',
                true
              )}

              {/* Step 3: Select Requested Item from Friend */}
              {activeRecipient && (
                <div>
                  <label className="block text-sm font-bold text-[var(--text-ink)]">
                    {isEn
                      ? `3. Choose what you want from ${activeRecipient.displayName}`
                      : `٣. ماذا تريد أن تأخذ من ${activeRecipient.displayName}؟`}
                  </label>

                  {loadingDirectory ? (
                    <p className="mt-2 py-4 text-center text-xs text-[var(--text-muted)]">
                      {isEn
                        ? 'Loading friend’s premium collection...'
                        : 'جاري تحميل مقتنيات صديقك البريميوم...'}
                    </p>
                  ) : friendTradableItems.length === 0 ? (
                    <div className="mt-2 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 text-center text-xs text-[var(--text-muted)]">
                      {isEn
                        ? `${activeRecipient.displayName} does not own any tradable premium books or themes that you don't already have.`
                        : `لا يمتلك ${activeRecipient.displayName} حالياً كتباً أو سمات بريميوم غير موجودة لديك للتبديل.`}
                    </div>
                  ) : (
                    <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pe-1">
                      {friendTradableItems.map((item) => {
                        const active = item.key === requestedItemKey;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setRequestedItemKey(item.key);
                              setErrorMsg(null);
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 ${
                              isEn ? 'text-left' : 'text-right'
                            } transition-colors ${
                              active
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-amber-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.targetType === 'book' ? (
                                <BookOpen
                                  className="h-4 w-4 shrink-0 text-amber-500"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Palette
                                  className="h-4 w-4 shrink-0 text-amber-500"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-editorial text-sm font-bold text-[var(--text-ink)]">
                                  {item.label}
                                </p>
                                <p className="truncate text-[11px] text-[var(--text-muted)]">
                                  {item.subLabel}
                                </p>
                              </div>
                            </div>
                            {active && <Check className="h-4 w-4 shrink-0 text-amber-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Swap Summary */}
              {offeredItem && activeRecipient && requestedItem && !successMsg && (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/[0.07] px-3.5 py-3 text-xs leading-relaxed text-[var(--text-ink)]">
                  <p className="font-bold text-amber-500">
                    {isEn ? 'Trade Proposal Summary' : 'ملخص طلب التبديل'}
                  </p>
                  <p className="mt-1">
                    {isEn
                      ? `You offer "${offeredItem.label}" ⇄ You request "${requestedItem.label}" from ${activeRecipient.displayName}. Items swap only if they accept.`
                      : `تعرض «${offeredItem.label}» ⇄ وتطلب «${requestedItem.label}» من ${activeRecipient.displayName}. يتم التبديل فقط إذا وافق على الطلب.`}
                  </p>
                </div>
              )}

              {errorMsg && (
                <p role="alert" className="text-xs font-semibold text-red-500">
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p
                  role="status"
                  className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-500"
                >
                  {successMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-[var(--border-hairline)] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)] whitespace-nowrap"
                >
                  {isEn ? 'Cancel' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    Boolean(successMsg) ||
                    !offeredItem ||
                    !activeRecipient ||
                    !requestedItem
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-5 py-2 text-xs font-semibold text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {submitting
                      ? isEn
                        ? 'Sending...'
                        : 'جاري الإرسال...'
                      : isEn
                        ? 'Send Trade Request'
                        : 'إرسال طلب التبديل'}
                  </span>
                </button>
              </div>
            </form>
          )
        ) : requestedIsLocked && initialItem ? (
          /* GIFT MODE - LOCKED ITEM */
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5 text-center">
              <Lock className="mx-auto h-8 w-8 text-amber-500" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-[var(--text-ink)]">
                {isEn
                  ? `"${initialItem.label || initialItem.targetId}" is not unlocked on your account yet.`
                  : `لا يمكنك إهداء «${initialItem.label || initialItem.targetId}» لأنه غير مفعّل على حسابك.`}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                {isEn
                  ? 'You can only gift a book or theme that is already active on your account. Enter its 10-digit activation code first, or switch to "Request Trade" above to swap for it.'
                  : 'يجب أن يكون هذا المحتوى مفتوحاً في حسابك أولاً لإهدائه، أو يمكنك اختيار «طلب تبديل» بالأعلى لطلبه من صديق مقابل عنصر آخر لديك.'}
              </p>
            </div>

            {onUnlockTarget && (
              <form
                onSubmit={handleUnlockCodeSubmit}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3"
              >
                <label
                  htmlFor="gift-unlock-first-code"
                  className="flex items-center gap-2 text-xs font-semibold text-[var(--text-ink)]"
                >
                  <KeyRound className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  <span>
                    {isEn
                      ? 'Enter 10-digit activation code first'
                      : 'اكتب كود التفعيل (10 أرقام) أولاً'}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="gift-unlock-first-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={unlockCode}
                    onChange={(e) => {
                      setUnlockCode(e.target.value.replace(/\D/g, '').slice(0, 10));
                      if (unlockError) setUnlockError(null);
                    }}
                    placeholder="0000000000"
                    dir="ltr"
                    className="flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-center font-mono-tabular text-sm tracking-widest text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={unlockBusy}
                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {unlockBusy
                        ? isEn
                          ? 'Activating...'
                          : 'جاري التفعيل...'
                        : isEn
                          ? 'Activate'
                          : 'تفعيل الكود'}
                    </span>
                  </button>
                </div>
                {unlockError && (
                  <p role="alert" className="text-xs font-semibold text-red-500">
                    {unlockError}
                  </p>
                )}
              </form>
            )}
          </div>
        ) : (
          /* GIFT MODE */
          <>
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/45 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-[var(--text-ink)]">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <p>
                {isEn
                  ? 'Sending this gift transfers it directly to the selected person’s account and removes it from your account.'
                  : 'عند إرسال الهدية ستنتقل مباشرةً إلى حساب الشخص الذي تختاره وتُمسح من حسابك نهائياً.'}
              </p>
            </div>

            {ownedItems.length === 0 && !selectedItem ? (
              <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 py-8 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-amber-500/70" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-[var(--text-ink)]">
                  {isEn
                    ? 'You do not own any unlocked premium items yet.'
                    : 'لا تمتلك أي كتب أو سمات بريميوم مفعّلة للإهداء حالياً.'}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'Activate a premium book or theme with its code first so you can gift it.'
                    : 'فعّل كتاباً أو سمة بريميوم بالكود أولاً لتتمكن من إهدائها لصديق.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitGift} className="mt-5 space-y-5">
                {isSpecificItemMode && selectedItem ? (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-500/50 bg-[var(--bg-surface)] p-3">
                    {selectedItem.targetType === 'book' ? (
                      <BookOpen
                        className="h-5 w-5 shrink-0 text-amber-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <Palette
                        className="h-5 w-5 shrink-0 text-amber-500"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                        {selectedItem.label}
                      </p>
                      <p className="text-[11px] text-amber-500">{selectedItem.subLabel}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)]">
                      {isEn ? 'Choose Premium Item to Send' : 'اختر المحتوى البريميوم المراد إهداؤه'}
                    </label>
                    <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pe-1">
                      {ownedItems.map((item) => {
                        const active = item.key === selectedItemKey;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setSelectedItemKey(item.key);
                              setErrorMsg(null);
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 ${
                              isEn ? 'text-left' : 'text-right'
                            } transition-colors ${
                              active
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-amber-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.targetType === 'book' ? (
                                <BookOpen
                                  className="h-4 w-4 shrink-0 text-amber-500"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Palette
                                  className="h-4 w-4 shrink-0 text-amber-500"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-editorial text-sm font-bold text-[var(--text-ink)]">
                                  {item.label}
                                </p>
                                <p className="truncate text-[11px] text-[var(--text-muted)]">
                                  {item.subLabel}
                                </p>
                              </div>
                            </div>
                            {active && <Check className="h-4 w-4 shrink-0 text-amber-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {renderRecipientSelector(
                  isEn
                    ? 'Choose the person you want to send this gift to'
                    : 'اختار الشخص اللي عايز تبعت له الهدية',
                  false
                )}

                {selectedItem && activeRecipient && !successMsg && (
                  <div className="rounded-lg border border-amber-500/50 bg-amber-500/[0.07] px-3.5 py-3 text-xs leading-relaxed text-[var(--text-ink)]">
                    <p className="font-bold text-amber-500">
                      {isEn ? 'Are you sure?' : 'هل أنت متأكد؟'}
                    </p>
                    <p className="mt-1">
                      {isEn
                        ? `"${selectedItem.label}" will be sent to ${activeRecipient.displayName}’s account and removed from your account.`
                        : `سيتم إرسال «${selectedItem.label}» إلى حساب ${activeRecipient.displayName} ومسحها من حسابك نهائياً.`}
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <p role="alert" className="text-xs font-semibold text-red-500">
                    {errorMsg}
                  </p>
                )}

                {successMsg && (
                  <p
                    role="status"
                    className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-500"
                  >
                    {successMsg}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-[var(--border-hairline)] pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)] whitespace-nowrap"
                  >
                    {isEn ? 'Cancel' : 'إلغاء'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || Boolean(successMsg) || !selectedItem || !activeRecipient}
                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-5 py-2 text-xs font-semibold text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {submitting
                        ? isEn
                          ? 'Sending...'
                          : 'جاري الإرسال...'
                        : isEn
                          ? 'Yes, Send Gift'
                          : 'نعم، إرسال الهدية'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
