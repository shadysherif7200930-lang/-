import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCheck,
  LogIn,
} from 'lucide-react';
import type { AppLanguage } from '../i18n';
import {
  formatNotificationTime,
  getNotificationMeta,
  type UserNotificationItem,
} from './NotificationsMenu';

type NotificationFilter = 'all' | 'unread' | 'features' | 'vip' | 'social' | 'milestones';

interface NotificationsPageProps {
  notifications: UserNotificationItem[];
  unreadCount: number;
  isAuthenticated: boolean;
  lang?: AppLanguage;
  onSignIn: () => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onNavigateTarget: (item: UserNotificationItem) => void;
  onBack: () => void;
}

function formatFullDate(iso: string, lang: AppLanguage): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  unreadCount,
  isAuthenticated,
  lang = 'ar',
  onSignIn,
  onMarkRead,
  onMarkAllRead,
  onNavigateTarget,
  onBack,
}) => {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const isEn = lang === 'en';

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'features':
        return notifications.filter(
          (n) =>
            n.type === 'feature_announcement' ||
            n.type === 'book_submission_approved' ||
            n.type === 'book_submission_rejected'
        );
      case 'vip':
        return notifications.filter(
          (n) =>
            n.type === 'premium' ||
            n.type === 'gift_received' ||
            n.type === 'trade_request' ||
            n.type === 'trade_accepted' ||
            n.type === 'trade_declined' ||
            n.type === 'book_sale' ||
            n.type === 'preorder_confirmed' ||
            n.type === 'preorder_fulfilled' ||
            n.type === 'preorder_refunded'
        );
      case 'social':
        return notifications.filter(
          (n) =>
            n.type === 'book_review' ||
            n.type === 'review_like' ||
            n.type === 'new_follower' ||
            n.type === 'new_release'
        );
      case 'milestones':
        return notifications.filter(
          (n) =>
            n.type === 'verified' ||
            n.type === 'book_completed' ||
            n.type === 'followers_milestone' ||
            n.type === 'book_submission_approved' ||
            n.type === 'book_submission_rejected'
        );
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const filterTabs: Array<{ id: NotificationFilter; label: string }> = [
    { id: 'all', label: isEn ? `All (${notifications.length})` : `الكل (${notifications.length})` },
    { id: 'unread', label: isEn ? `Unread (${unreadCount})` : `غير مقروءة (${unreadCount})` },
    { id: 'features', label: isEn ? 'Updates & Submissions' : 'المميزات والنشر' },
    { id: 'vip', label: isEn ? 'VIP, Gifts & Trades' : 'البريميوم والهدايا والتبديل' },
    { id: 'social', label: isEn ? 'Comments & Follows' : 'التعليقات والمتابعة' },
    { id: 'milestones', label: isEn ? 'Verification & Goals' : 'التوثيق والإنجازات' },
  ];

  return (
    <section className="mx-auto max-w-4xl px-6 py-10 lg:px-8 lg:py-14">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-6">
        <div className="space-y-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--accent-primary)]"
          >
            {isEn ? (
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isEn ? 'Back to Library' : 'العودة للمكتبة'}</span>
          </button>

          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--accent-primary)]"
            >
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-editorial text-3xl font-bold text-[var(--text-ink)] sm:text-4xl [text-wrap:balance]">
                {isEn ? 'All Notifications' : 'جميع الإشعارات'}
              </h1>
              <p className="mt-1 font-mono-tabular text-xs text-[var(--text-muted)]">
                {isEn
                  ? `${notifications.length} saved alerts · ${unreadCount} unread`
                  : `${notifications.length} إشعار محفوظ · ${unreadCount} غير مقروء`}
              </p>
            </div>
          </div>
        </div>

        {isAuthenticated && unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void onMarkAllRead()}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--accent-primary)]/50 bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            <span>{isEn ? 'Mark all as read' : 'تحديد الكل كمقروء'}</span>
          </button>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="mt-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-14 text-center">
          <Bell className="mx-auto h-10 w-10 text-[var(--accent-primary)]" aria-hidden="true" />
          <h2 className="mt-4 font-editorial text-2xl font-bold text-[var(--text-ink)]">
            {isEn ? 'Sign in to view your notifications' : 'سجّل الدخول لعرض سجل الإشعارات'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
            {isEn
              ? 'All account verification alerts, VIP gifts, book comments, likes, and milestones are preserved permanently on your account.'
              : 'تُحفظ جميع إشعارات توثيق حسابك، الهدايا البريميوم، التعليقات، اللايكات، وإنجازات القراءة بشكل دائم في حسابك.'}
          </p>
          <button
            type="button"
            onClick={() => void onSignIn()}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{isEn ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Filter Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1.5">
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[var(--accent-primary)] font-semibold text-[var(--accent-fg)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-canvas)] hover:text-[var(--text-ink)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Notifications List — Each notification inside its own distinctive card box */}
          {filteredNotifications.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-14 text-center">
              <Bell
                className="mx-auto h-9 w-9 text-[var(--text-muted)] opacity-50"
                aria-hidden="true"
              />
              <p className="mt-3 font-editorial text-xl font-bold text-[var(--text-ink)]">
                {isEn ? 'No notifications in this filter' : 'لا توجد إشعارات في هذا التصنيف'}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {isEn
                  ? 'All past and future notifications remain saved here permanently.'
                  : 'جميع إشعاراتك السابقة والجديدة تظل محفوظة هنا ولا تُمسح أبداً.'}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3.5">
              {filteredNotifications.map((item) => {
                const { icon: IconComp, wrapperClass, label } = getNotificationMeta(
                  item.type,
                  lang
                );
                const title = isEn ? item.titleEn : item.titleAr;
                const message = isEn ? item.messageEn : item.messageAr;
                const relativeTime = formatNotificationTime(item.createdAt, lang);
                const exactTime = formatFullDate(item.createdAt, lang);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.isRead) {
                        void onMarkRead(item.id);
                      }
                      onNavigateTarget(item);
                    }}
                    className={`group flex w-full items-start gap-4 rounded-xl border p-4 sm:p-5 text-start transition-all ${
                      item.isRead
                        ? 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/50'
                        : 'border-[var(--accent-primary)]/60 bg-[var(--bg-surface)] shadow-sm hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${wrapperClass}`}
                    >
                      <IconComp className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[var(--accent-primary)]">
                            {label}
                          </span>
                          {!item.isRead && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-bold text-[var(--accent-primary)]">
                                {isEn ? 'New' : 'جديد'}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="font-mono-tabular text-[11px]" title={exactTime}>
                          {relativeTime}
                          {exactTime ? ` · ${exactTime}` : ''}
                        </span>
                      </div>

                      <h2
                        className={`font-editorial text-lg leading-snug text-[var(--text-ink)] transition-colors group-hover:text-[var(--accent-primary)] ${
                          item.isRead ? 'font-semibold' : 'font-bold'
                        }`}
                      >
                        {title}
                      </h2>

                      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                        {message}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};
