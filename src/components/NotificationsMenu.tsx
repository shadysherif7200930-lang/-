import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  BookCheck,
  BookOpen,
  CheckCheck,
  Crown,
  Gift,
  Heart,
  LogIn,
  Megaphone,
  MessageSquareText,
  Sparkles,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import type { AppLanguage } from '../i18n';

export interface UserNotificationItem {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  targetBookId: string | null;
  targetUserUid: string | null;
  targetView?: string | null;
  targetSection?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsMenuProps {
  notifications: UserNotificationItem[];
  unreadCount: number;
  isAuthenticated: boolean;
  lang?: AppLanguage;
  onSignIn: () => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onSeeAll: () => void;
  onNavigateTarget: (item: UserNotificationItem) => void;
}

export function formatNotificationTime(iso: string, lang: AppLanguage): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  const isEn = lang === 'en';

  if (diffSec < 60) {
    return isEn ? 'Just now' : 'الآن';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return isEn ? `${diffMin}m ago` : `منذ ${diffMin} د`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return isEn ? `${diffHours}h ago` : `منذ ${diffHours} س`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return isEn ? `${diffDays}d ago` : `منذ ${diffDays} ي`;
  }
  try {
    return new Intl.DateTimeFormat(isEn ? 'en-US' : 'ar-EG', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(ts));
  } catch {
    return iso.slice(0, 10);
  }
}

export function getNotificationMeta(type: string, lang: AppLanguage) {
  const isEn = lang === 'en';
  switch (type) {
    case 'verified':
      return {
        icon: BadgeCheck,
        wrapperClass: 'border-sky-500/40 bg-sky-500/10 text-sky-500',
        label: isEn ? 'Verification' : 'توثيق الحساب',
      };
    case 'premium':
      return {
        icon: Crown,
        wrapperClass: 'border-amber-500/45 bg-amber-500/10 text-amber-500',
        label: isEn ? 'Premium VIP' : 'إضافة بريميوم',
      };
    case 'book_completed':
      return {
        icon: BookCheck,
        wrapperClass:
          'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        label: isEn ? 'Book Completed' : 'إتمام كتاب',
      };
    case 'followers_milestone':
      return {
        icon: Award,
        wrapperClass: 'border-amber-500/45 bg-amber-500/10 text-amber-500',
        label: isEn ? 'Milestone' : 'إنجاز متابعين',
      };
    case 'new_follower':
      return {
        icon: UserPlus,
        wrapperClass:
          'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
        label: isEn ? 'New Follower' : 'متابع جديد',
      };
    case 'book_review':
      return {
        icon: MessageSquareText,
        wrapperClass: 'border-sky-500/40 bg-sky-500/10 text-sky-500',
        label: isEn ? 'Book Comment' : 'تعليق جديد',
      };
    case 'review_like':
      return {
        icon: Heart,
        wrapperClass: 'border-rose-500/45 bg-rose-500/10 text-rose-500',
        label: isEn ? 'Comment Like' : 'إعجاب بتعليق',
      };
    case 'gift_received':
      return {
        icon: Gift,
        wrapperClass: 'border-amber-500/45 bg-amber-500/10 text-amber-500',
        label: isEn ? 'VIP Gift' : 'هدية بريميوم',
      };
    case 'trade_request':
      return {
        icon: ArrowLeftRight,
        wrapperClass: 'border-amber-500/50 bg-amber-500/12 text-amber-500',
        label: isEn ? 'Trade Request' : 'طلب تبديل بريميوم',
      };
    case 'trade_accepted':
      return {
        icon: ArrowLeftRight,
        wrapperClass:
          'border-emerald-500/45 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        label: isEn ? 'Trade Accepted' : 'تمت الموافقة على التبديل',
      };
    case 'trade_declined':
      return {
        icon: ArrowLeftRight,
        wrapperClass: 'border-rose-500/45 bg-rose-500/10 text-rose-500',
        label: isEn ? 'Trade Declined' : 'تم رفض طلب التبديل',
      };
    case 'new_release':
      return {
        icon: Sparkles,
        wrapperClass: 'border-emerald-500/45 bg-emerald-500/10 text-emerald-500',
        label: isEn ? 'New Release' : 'إصدار جديد',
      };
    case 'feature_announcement':
      return {
        icon: Megaphone,
        wrapperClass:
          'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]',
        label: isEn ? 'New Feature' : 'ميزة جديدة!',
      };
    case 'book_submission_approved':
      return {
        icon: BookCheck,
        wrapperClass:
          'border-emerald-500/45 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        label: isEn ? 'Book Approved' : 'تمت الموافقة على كتابك',
      };
    case 'book_submission_rejected':
      return {
        icon: XCircle,
        wrapperClass: 'border-rose-500/45 bg-rose-500/10 text-rose-500',
        label: isEn ? 'Submission Declined' : 'نتيجة مراجعة الكتاب',
      };
    case 'book_sale':
      return {
        icon: Crown,
        wrapperClass: 'border-amber-500/55 bg-amber-500/15 text-amber-500',
        label: isEn ? 'Book Sale Revenue' : 'عائد بيع كتابك',
      };
    case 'preorder_confirmed':
      return {
        icon: Sparkles,
        wrapperClass: 'border-amber-500/50 bg-amber-500/12 text-amber-500',
        label: isEn ? 'Pre-Order Confirmed' : 'تأكيد طلب مسبق',
      };
    case 'preorder_fulfilled':
      return {
        icon: BookCheck,
        wrapperClass:
          'border-emerald-500/50 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
        label: isEn ? 'Pre-Order Delivered' : 'تسليم طلب مسبق',
      };
    case 'preorder_refunded':
      return {
        icon: Gift,
        wrapperClass: 'border-sky-500/45 bg-sky-500/10 text-sky-500',
        label: isEn ? 'Pre-Order Refund' : 'استرداد طلب مسبق',
      };
    default:
      return {
        icon: BookOpen,
        wrapperClass:
          'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--accent-primary)]',
        label: isEn ? 'Library Alert' : 'تنبيه المكتبة',
      };
  }
}

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  notifications,
  unreadCount,
  isAuthenticated,
  lang = 'ar',
  onSignIn,
  onMarkRead,
  onMarkAllRead,
  onSeeAll,
  onNavigateTarget,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isEn = lang === 'en';
  const latestThree = notifications.slice(0, 3);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          isEn
            ? `Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`
            : `الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروءة)` : ''}`
        }
        className={`relative inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md border transition-colors ${
          open
            ? 'border-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--accent-primary)]'
            : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-ink)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
        }`}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {isAuthenticated && unreadCount > 0 && (
          <span className="absolute -top-1.5 -end-1.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 font-mono-tabular text-[10px] font-bold leading-none text-[var(--accent-fg)] shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={isEn ? 'Account Notifications' : 'إشعارات الحساب'}
          className="fixed inset-x-3 top-16 z-50 mx-auto flex max-h-[calc(100dvh-5rem)] w-auto max-w-[400px] flex-col overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)] shadow-2xl md:absolute md:inset-x-auto md:top-full md:end-0 md:mx-0 md:mt-2.5 md:max-h-[80vh] md:w-[400px]"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
              <h3 className="font-editorial text-base font-bold text-[var(--text-ink)] truncate">
                {isEn ? 'Notifications' : 'الإشعارات'}
              </h3>
              {isAuthenticated && unreadCount > 0 && (
                <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-primary)]">
                  ({unreadCount})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isAuthenticated && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void onMarkAllRead()}
                  title={isEn ? 'Mark all as read' : 'تحديد الكل كمقروء'}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--accent-primary)] transition-colors hover:bg-[var(--bg-canvas)]"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {isEn ? 'Mark all read' : 'قراءة الكل'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={isEn ? 'Close notifications' : 'إغلاق الإشعارات'}
                className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-canvas)] hover:text-[var(--text-ink)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto">
          {!isAuthenticated ? (
            <div className="px-5 py-8 text-center">
              <Bell
                className="mx-auto h-8 w-8 text-[var(--text-muted)] opacity-60"
                aria-hidden="true"
              />
              <p className="mt-3 font-editorial text-base font-bold text-[var(--text-ink)]">
                {isEn ? 'Account Notifications' : 'إشعارات حسابك'}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                {isEn
                  ? 'Sign in with Google to receive in-app alerts for account verification, premium additions, finished books, follower milestones, and reviews.'
                  : 'سجّل الدخول بحساب Google لاستقبال إشعارات التوثيق، الإضافات البريميوم، الكتب المكتملة، أرقام المتابعين، والتعليقات على كتبك.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void onSignIn();
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isEn ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}</span>
              </button>
            </div>
          ) : latestThree.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Bell
                className="mx-auto h-8 w-8 text-[var(--text-muted)] opacity-45"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-[var(--text-ink)]">
                {isEn ? 'No notifications yet' : 'لا توجد إشعارات حالياً'}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {isEn
                  ? 'Updates on your account verification, completed books, premium items, followers, and reviews will appear here.'
                  : 'ستظهر هنا تنبيهات توثيق حسابك، المقتنيات البريميوم، الكتب التي تُنهيها، إنجازات المتابعين، والتعليقات الجديدة.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 p-3">
              {latestThree.map((item) => {
                const { icon: IconComp, wrapperClass, label } = getNotificationMeta(
                  item.type,
                  lang
                );
                const title = isEn ? item.titleEn : item.titleAr;
                const message = isEn ? item.messageEn : item.messageAr;
                const timeLabel = formatNotificationTime(item.createdAt, lang);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.isRead) {
                        void onMarkRead(item.id);
                      }
                      onNavigateTarget(item);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3.5 text-start transition-colors ${
                      item.isRead
                        ? 'border-[var(--border-hairline)] bg-[var(--bg-surface)]/75 hover:border-[var(--accent-primary)]/45 hover:bg-[var(--bg-surface)]'
                        : 'border-[var(--accent-primary)]/55 bg-[var(--accent-primary)]/[0.07] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.12]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${wrapperClass}`}
                    >
                      <IconComp className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                        <span className="truncate font-medium text-[var(--accent-primary)]">
                          {label}
                        </span>
                        <span className="shrink-0 font-mono-tabular">{timeLabel}</span>
                      </div>

                      <p
                        className={`text-xs leading-snug ${
                          item.isRead
                            ? 'font-semibold text-[var(--text-ink)]'
                            : 'font-bold text-[var(--text-ink)]'
                        }`}
                      >
                        {title}
                      </p>

                      <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                        {message}
                      </p>

                      {!item.isRead && (
                        <span className="inline-block text-[10px] font-bold text-[var(--accent-primary)]">
                          {isEn ? 'New' : 'جديد'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          </div>

          {/* Footer with See All */}
          {isAuthenticated && (
            <div className="shrink-0 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSeeAll();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-2 text-xs font-semibold text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                <span>
                  {isEn
                    ? `See All (${notifications.length})`
                    : `See All · عرض كل الإشعارات (${notifications.length})`}
                </span>
                {isEn ? (
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
