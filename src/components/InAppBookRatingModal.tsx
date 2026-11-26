import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock, LogIn, Send, Star, X, XCircle } from 'lucide-react';
import type { BookRecord, TokenEconomyConfig } from '../db/booksDb';
import type { AppLanguage } from '../i18n';
import { TokenIcon } from './TokenCoin';

interface InAppBookRatingModalProps {
  open: boolean;
  initialBook: BookRecord | null;
  books: BookRecord[];
  currentUserUid?: string | null;
  isAuthenticated: boolean;
  economyConfig?: TokenEconomyConfig;
  lang?: AppLanguage;
  onSignIn: () => Promise<void>;
  onSubmitReview: (
    bookId: string,
    rating: number,
    comment: string
  ) => Promise<{ ok: boolean; error?: string; isUpdate?: boolean; pendingModeration?: boolean }>;
  onClose: () => void;
}

export const InAppBookRatingModal: React.FC<InAppBookRatingModalProps> = ({
  open,
  initialBook,
  books,
  currentUserUid,
  isAuthenticated,
  economyConfig,
  lang = 'ar',
  onSignIn,
  onSubmitReview,
  onClose,
}) => {
  const isEn = lang === 'en';
  const eligibleBooks = useMemo(
    () =>
      books.filter(
        (b) =>
          !b.isComingSoon &&
          (b.reviewStatus === undefined || b.reviewStatus === 'approved')
      ),
    [books]
  );

  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    const defaultTarget = initialBook?.id || eligibleBooks[0]?.id || '';
    setSelectedBookId(defaultTarget);
    setFeedback(null);
  }, [open, initialBook?.id, eligibleBooks]);

  const activeBook = useMemo(
    () =>
      eligibleBooks.find((b) => b.id === selectedBookId) ??
      initialBook ??
      eligibleBooks[0] ??
      null,
    [eligibleBooks, selectedBookId, initialBook]
  );

  const existingReview = useMemo(() => {
    if (!activeBook) return undefined;
    if (activeBook.myPendingReview) return activeBook.myPendingReview;
    if (!currentUserUid) return undefined;
    return (activeBook.reviews ?? []).find((r) => r.reviewerUid === currentUserUid);
  }, [activeBook, currentUserUid]);

  useEffect(() => {
    if (!open) return;
    setRating(existingReview?.rating ?? 5);
    setComment(existingReview?.comment ?? '');
    setFeedback(null);
  }, [open, activeBook?.id, existingReview?.id, existingReview?.rating, existingReview?.comment]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isOwnBook = Boolean(
    currentUserUid && activeBook?.authorUid && currentUserUid === activeBook.authorUid
  );
  const pendingReview = activeBook?.myPendingReview ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook) return;
    const trimmed = comment.trim();
    if (!trimmed) {
      setFeedback({
        type: 'err',
        text: isEn
          ? 'Please write your opinion before submitting.'
          : 'يرجى كتابة رأيك وتعليقك قبل الإرسال.',
      });
      return;
    }
    setFeedback(null);
    setSubmitting(true);
    try {
      const res = await onSubmitReview(activeBook.id, rating, trimmed);
      if (res.ok) {
        setFeedback({
          type: 'ok',
          text: isEn
            ? 'Submitted! Your rating & review have been sent to the developer and will appear on the book once approved.'
            : 'تم إرسال تقييمك ورأيك بنجاح للمطور للمراجعة، وسيظهر في صفحة الكتاب فور الموافقة عليه!',
        });
      } else {
        setFeedback({
          type: 'err',
          text:
            res.error ??
            (isEn ? 'Could not submit your rating.' : 'تعذّر إرسال التقييم حالياً.'),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inapp-rating-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-5 sm:p-6 text-[var(--text-ink)] shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/45 bg-amber-500/12 text-amber-500">
              <Star className="h-4.5 w-4.5 fill-amber-400" aria-hidden="true" />
            </span>
            <div>
              <h2 id="inapp-rating-modal-title" className="font-editorial text-xl font-bold">
                {isEn ? 'Rate & Review Book' : 'تقييم وإبداء الرأي في الكتاب'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {isEn
                  ? 'Your review goes to the developer for approval before publishing.'
                  : 'يُرسل تقييمك مباشرة للمطور للمراجعة ثم يُنشر في تقييمات الكتاب.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-ink)]"
            aria-label={isEn ? 'Close' : 'إغلاق'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!initialBook && eligibleBooks.length > 0 && (
          <div>
            <label
              htmlFor="rating-modal-book-select"
              className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]"
            >
              {isEn ? 'Select a Book to Rate' : 'اختر الكتاب الذي تريد تقييمه'}
            </label>
            <select
              id="rating-modal-book-select"
              value={activeBook?.id ?? ''}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              {eligibleBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.author}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeBook ? (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
              {activeBook.coverUrl ? (
                <img
                  src={activeBook.coverUrl}
                  alt={activeBook.title}
                  referrerPolicy="no-referrer"
                  className="h-14 w-10 shrink-0 rounded-sm border border-[var(--border-hairline)] object-cover"
                />
              ) : (
                <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] text-[var(--text-muted)]">
                  <BookOpen className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                  {activeBook.title}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">{activeBook.author}</p>
              </div>
            </div>

            {pendingReview?.moderationStatus === 'pending' && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/45 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-300">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold">
                    {isEn
                      ? 'Your latest review is awaiting developer approval'
                      : 'تقييمك الحالي في انتظار موافقة المطور'}
                  </p>
                  <p className="mt-0.5 opacity-90">
                    {isEn
                      ? 'You can still edit and resubmit below if you wish.'
                      : 'يمكنك تعديله وإعادة إرساله من هنا قبل النشر إذا أردت.'}
                  </p>
                </div>
              </div>
            )}

            {pendingReview?.moderationStatus === 'rejected' && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/45 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-500">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold">
                    {isEn
                      ? 'Your previous review was declined by the developer'
                      : 'لم تتم الموافقة على تقييمك السابق'}
                  </p>
                  {pendingReview.moderationNote && (
                    <p className="mt-0.5 font-medium">
                      {isEn ? 'Reason: ' : 'سبب الرفض: '}
                      {pendingReview.moderationNote}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isAuthenticated ? (
              <div className="space-y-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 text-center">
                <p className="text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'Please sign in with Google to rate this book and share your review.'
                    : 'سجّل الدخول بحساب Google لتقييم الكتاب وإرسال رأيك للمراجعة.'}
                </p>
                <button
                  type="button"
                  onClick={() => void onSignIn()}
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isEn ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}</span>
                </button>
              </div>
            ) : isOwnBook ? (
              <p className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 text-xs text-[var(--text-muted)]">
                {isEn
                  ? 'You cannot rate or review your own book.'
                  : 'لا يمكنك تقييم كتابك الخاص — يمكن للقراء فقط تقييمه وكتابة آرائهم.'}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5">
                  <span className="text-xs font-semibold text-[var(--text-ink)]">
                    {isEn ? 'Your Rating (out of 5):' : 'تقييمك من 5 نجوم:'}
                  </span>
                  <div className="flex items-center gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const active = starVal <= rating;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(starVal)}
                          aria-label={`${starVal} ${isEn ? 'stars' : 'نجوم'}`}
                          className="rounded p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              active
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-[var(--text-muted)] opacity-45'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ms-2 font-mono-tabular text-sm font-bold text-amber-500">
                      {rating}.0
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inapp-rating-comment"
                    className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]"
                  >
                    {isEn ? 'Your Opinion / Comment' : 'رأيك وتعليقك حول الكتاب'}
                  </label>
                  <textarea
                    id="inapp-rating-comment"
                    rows={3}
                    maxLength={1200}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      if (feedback) setFeedback(null);
                    }}
                    placeholder={
                      isEn
                        ? 'Write what you liked or your honest review of this book...'
                        : 'اكتب رأيك وتعليقك حول الكتاب ليظهر ضمن التقييمات بعد موافقة المطور...'
                    }
                    className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>

                {feedback && (
                  <p
                    role="status"
                    className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                      feedback.type === 'ok'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {feedback.text}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <TokenIcon className="h-3.5 w-3.5" />
                    {isEn
                      ? `Author gets +${economyConfig?.rewardCommentOnBook ?? 5} tokens when approved`
                      : `يحصل المؤلف على +${economyConfig?.rewardCommentOnBook ?? 5} عملة عند الاعتماد`}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-ink)]"
                    >
                      {isEn ? 'Close' : 'إغلاق'}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-55"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {submitting
                          ? isEn
                            ? 'Sending...'
                            : 'جاري الإرسال...'
                          : isEn
                            ? 'Submit for Approval'
                            : 'إرسال للمطور للمراجعة'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </>
        ) : (
          <p className="py-4 text-center text-xs text-[var(--text-muted)]">
            {isEn ? 'No books available to rate right now.' : 'لا توجد كتب متاحة للتقييم حالياً.'}
          </p>
        )}
      </div>
    </div>
  );
};
