import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  LogIn,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  arrayBufferToBase64,
  findDuplicateCodeOwner,
  formatComingSoonReleaseLabel,
  generateTenDigitCode,
  hasBookContent,
  savePdfBlob,
  toLocalDateTimeInputValue,
  toLocalDateTimeSubmitValue,
  type BookRecord,
  type Chapter,
  type TokenEconomyConfig,
} from '../db/booksDb';
import { formatSectionHeading, getSectionDisplayName, type AppLanguage } from '../i18n';
import { PREMIUM_THEMES } from '../themeCatalog';
import { OwnerBadge } from './BookRatingBar';
import { ConfirmDialog } from './ConfirmDialog';
import { SeriesEditorField } from './SeriesEditorField';
import type { DocumentUploadPayload } from './SettingsPanel';
import { TokenIcon, TokenPriceBadge } from './TokenCoin';
import type { CurrentUserAccountInfo } from './YouPage';

interface UserBookSubmissionSectionProps {
  user: FirebaseUser | null;
  userAccount: CurrentUserAccountInfo | null;
  books: BookRecord[];
  sections: string[];
  sectionTranslations: Record<string, string>;
  customThemeCodes: Record<string, string>;
  economyConfig?: TokenEconomyConfig;
  userTokensBalance?: number;
  lang: AppLanguage;
  onSignIn: () => Promise<void>;
  onOpenBook: (book: BookRecord) => void;
  onSubmitBook: (
    book: BookRecord,
    documentPayload?: DocumentUploadPayload
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteSubmission: (bookId: string) => Promise<{ ok: boolean; error?: string }>;
}

function createEmptyUserBook(
  defaultCategory: string,
  authorName: string,
  authorUid: string,
  isAuthorVerified: boolean
): BookRecord {
  return {
    id: `book-${Date.now()}`,
    title: '',
    subtitle: '',
    author: authorName,
    authorUid,
    isAuthorVerified,
    category: defaultCategory,
    year: new Date().getFullYear(),
    pages: 80,
    readingMinutes: 12,
    rating: 0,
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    featured: false,
    isComingSoon: false,
    comingSoonMode: 'open',
    comingSoonReleaseAt: '',
    isPremium: false,
    priceLabel: '',
    tokenPrice: null,
    discountPercent: null,
    discountEndsAt: '',
    discountPostReleaseDays: null,
    rotationHours: 24,
    unlockCode: '',
    bookType: 'text',
    coverUrl: '',
    synopsis: '',
    seriesId: null,
    seriesTitle: null,
    partNumber: null,
    linkToBookId: null,
    seriesPartOrder: undefined,
    chapters: [
      {
        id: `ch-${Date.now()}`,
        number: '01',
        title: 'الفصل الأول',
        epigraph: '',
        paragraphs: [''],
      },
    ],
  };
}

export const UserBookSubmissionSection: React.FC<UserBookSubmissionSectionProps> = ({
  user,
  userAccount,
  books,
  sections,
  sectionTranslations,
  customThemeCodes,
  economyConfig,
  userTokensBalance,
  lang,
  onSignIn,
  onOpenBook,
  onSubmitBook,
  onDeleteSubmission,
}) => {
  const isEn = lang === 'en';
  const activeUid = userAccount?.uid ?? user?.uid ?? '';
  const accountDisplayName =
    userAccount?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    (isEn ? 'Reader' : 'قارئ');
  const accountVerified = Boolean(user && userAccount?.isVerified);
  const defaultSection = sections[0] || 'عام';

  const [editingSubmission, setEditingSubmission] = useState<BookRecord | null>(null);
  const [formBook, setFormBook] = useState<BookRecord>(() =>
    createEmptyUserBook(defaultSection, accountDisplayName, activeUid, accountVerified)
  );
  const [formCodeError, setFormCodeError] = useState<string | null>(null);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [pendingDocBuffer, setPendingDocBuffer] = useState<{
    id: string;
    buffer: ArrayBuffer;
    fileName: string;
  } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: isEn ? 'Confirm Delete' : 'تأكيد الحذف',
    onConfirm: () => {},
  });

  const mySubmissions = books.filter(
    (b) =>
      b.authorUid &&
      b.authorUid === activeUid &&
      (b.reviewStatus === 'pending' ||
        b.reviewStatus === 'rejected' ||
        (b.reviewStatus === 'approved' && Boolean(b.isComingSoon)))
  );

  const resetForm = () => {
    setEditingSubmission(null);
    setPendingDocBuffer(null);
    setFormCodeError(null);
    setFormBook(createEmptyUserBook(defaultSection, accountDisplayName, activeUid, accountVerified));
  };

  const handleEditSubmission = (book: BookRecord) => {
    setEditingSubmission(book);
    setPendingDocBuffer(null);
    setFormCodeError(null);
    setStatusMessage(null);
    setFormBook({
      ...JSON.parse(JSON.stringify(book)),
      authorUid: activeUid,
      author: accountDisplayName,
      isAuthorVerified: accountVerified,
      isComingSoon: Boolean(book.isComingSoon),
      comingSoonMode: book.comingSoonMode ?? 'open',
      comingSoonReleaseAt:
        book.comingSoonMode === 'datetime'
          ? toLocalDateTimeInputValue(book.comingSoonReleaseAt)
          : book.comingSoonReleaseAt ?? '',
      unlockCode: book.unlockCode ?? '',
      tokenPrice: typeof book.tokenPrice === 'number' ? book.tokenPrice : null,
      discountPercent: book.discountPercent ?? null,
      discountEndsAt: book.discountEndsAt ? toLocalDateTimeInputValue(book.discountEndsAt) : '',
      discountPostReleaseDays: book.discountPostReleaseDays ?? null,
      seriesId: book.seriesId ?? null,
      seriesTitle: book.seriesTitle ?? null,
      partNumber: book.partNumber ?? null,
      linkToBookId: null,
      seriesPartOrder: undefined,
      chapters:
        book.chapters && book.chapters.length > 0
          ? book.chapters
          : [
              {
                id: `ch-${Date.now()}`,
                number: '01',
                title: isEn ? 'Chapter 01' : 'الفصل الأول',
                epigraph: '',
                paragraphs: [''],
              },
            ],
    } as BookRecord);
    document.getElementById('publish-studio-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormBook((prev) => ({ ...prev, coverUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isWordFile = lowerName.endsWith('.docx') || lowerName.endsWith('.doc');

    setIsParsingDoc(true);
    setStatusMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      if (isWordFile) {
        const baseTitle = file.name.replace(/\.(docx?|DOCX?)$/, '');
        const { loadWordPages } = await import('../utils/wordUtils');
        const { pageCount, coverDataUrl } = await loadWordPages(buffer, baseTitle);
        const docId = `word-${Date.now()}`;
        setPendingDocBuffer({ id: docId, buffer, fileName: file.name });
        setFormBook((prev) => ({
          ...prev,
          bookType: 'word',
          pdfId: docId,
          pdfPageCount: pageCount,
          pages: pageCount,
          readingMinutes: Math.max(5, pageCount * 2),
          title: prev.title || baseTitle,
          coverUrl: prev.coverUrl || coverDataUrl || '',
        }));
      } else {
        const { inspectPdfBuffer } = await import('../utils/pdfUtils');
        const { pageCount, coverDataUrl } = await inspectPdfBuffer(buffer);
        const pdfId = `pdf-${Date.now()}`;
        setPendingDocBuffer({ id: pdfId, buffer, fileName: file.name });
        const baseTitle = file.name.replace(/\.pdf$/i, '');
        setFormBook((prev) => ({
          ...prev,
          bookType: 'pdf',
          pdfId,
          pdfPageCount: pageCount,
          pages: pageCount,
          readingMinutes: Math.max(5, pageCount * 2),
          title: prev.title || baseTitle,
          coverUrl: prev.coverUrl || coverDataUrl || '',
        }));
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text:
          (err instanceof Error && err.message) ||
          (isEn
            ? 'Could not read file; make sure it is a valid PDF or .docx file.'
            : 'تعذر قراءة الملف؛ تأكد أنه ملف PDF أو Word (.docx) صالح وغير محمي بكلمة سر.'),
      });
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleCodeChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 10);
    setFormBook((prev) => ({ ...prev, unlockCode: clean }));
    if (clean.length === 10) {
      const dup = findDuplicateCodeOwner(clean, books, customThemeCodes, editingSubmission?.id);
      setFormCodeError(
        dup
          ? isEn
            ? `This code is already used by ${dup}; choose another.`
            : `هذا الكود مستخدم بالفعل في ${dup}؛ اختر كوداً آخر.`
          : null
      );
    } else {
      setFormCodeError(null);
    }
  };

  const handleGenerateCode = () => {
    const taken = new Set<string>();
    for (const b of books) {
      if (b.id !== editingSubmission?.id && b.isPremium && b.unlockCode) {
        taken.add(b.unlockCode);
      }
    }
    for (const t of PREMIUM_THEMES) {
      const c = customThemeCodes[t.id] ?? t.unlockCode;
      if (c) taken.add(c);
    }
    const generated = generateTenDigitCode(taken);
    setFormBook((prev) => ({ ...prev, unlockCode: generated }));
    setFormCodeError(null);
  };

  const handleChapterChange = (idx: number, patch: Partial<Chapter>) => {
    setFormBook((prev) => {
      const next = [...prev.chapters];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, chapters: next };
    });
  };

  const handleAddChapter = () => {
    setFormBook((prev) => {
      const num = String(prev.chapters.length + 1).padStart(2, '0');
      return {
        ...prev,
        chapters: [
          ...prev.chapters,
          {
            id: `ch-${Date.now()}`,
            number: num,
            title: isEn ? `Chapter ${num}` : `الفصل ${num}`,
            epigraph: '',
            paragraphs: [''],
          },
        ],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formBook.title.trim()) {
      setStatusMessage({
        type: 'error',
        text: isEn ? 'Please enter the book title.' : 'يرجى كتابة عنوان الكتاب.',
      });
      return;
    }

    if (!formBook.coverUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: isEn ? 'Please upload a book cover image first.' : 'يرجى رفع صورة غلاف الكتاب أولاً.',
      });
      return;
    }

    const isComingSoon = Boolean(formBook.isComingSoon);
    const comingSoonMode = formBook.comingSoonMode ?? 'open';
    const comingSoonReleaseAt = formBook.comingSoonReleaseAt?.trim() ?? '';
    const isDocType = formBook.bookType === 'pdf' || formBook.bookType === 'word';
    const hasContent = hasBookContent(formBook, Boolean(pendingDocBuffer));

    if (
      isComingSoon &&
      (comingSoonMode === 'date' || comingSoonMode === 'datetime') &&
      !comingSoonReleaseAt
    ) {
      setStatusMessage({
        type: 'error',
        text: isEn
          ? 'Please pick a release date/time or choose Open (no fixed date).'
          : 'يرجى تحديد تاريخ أو ميعاد النشر، أو اختيار «مفتوح بدون ميعاد محدد».',
      });
      return;
    }

    if (
      isComingSoon &&
      (comingSoonMode === 'date' || comingSoonMode === 'datetime') &&
      !hasContent
    ) {
      setStatusMessage({
        type: 'error',
        text: isDocType
          ? isEn
            ? 'When setting a scheduled date or time for auto-release, uploading a PDF/Word file is required (or switch to "Open" to submit without a PDF for now).'
            : 'عند تحديد ميعاد بالساعات أو الأيام لنزول الكتاب، يجب رفع ملف PDF أو Word أولاً لينزل تلقائياً في موعده (أو اختر «مفتوح» لنشره بدون ملف مؤقتاً).'
          : isEn
            ? 'When setting a scheduled date or time for auto-release, writing at least one chapter is required (or switch to "Open" mode).'
            : 'عند تحديد ميعاد بالساعات أو الأيام لنزول الكتاب، يجب كتابة محتوى فصل واحد على الأقل أولاً (أو اختر «مفتوح» بدون ميعاد).',
      });
      return;
    }

    if (!isComingSoon && !hasContent) {
      setStatusMessage({
        type: 'error',
        text: isDocType
          ? isEn
            ? 'Please upload a PDF or Word (.docx) file first before publishing.'
            : 'يرجى رفع ملف PDF أو Word (.docx) أولاً قبل إرسال الكتاب للنشر الكامل.'
          : isEn
            ? 'Please write text in at least one chapter first before publishing.'
            : 'يرجى كتابة نص في فصل واحد على الأقل قبل إرسال الكتاب للنشر الكامل.',
      });
      return;
    }

    if (formBook.isPremium) {
      const cleanCode = (formBook.unlockCode ?? '').replace(/\D/g, '');
      if (cleanCode.length > 0 && cleanCode.length !== 10) {
        setFormCodeError(
          isEn
            ? 'Premium code must be 10 digits or left blank to auto-generate.'
            : 'يجب أن يكون الكود 10 أرقام أو اتركه فارغاً للتوليد التلقائي.'
        );
        return;
      }
      if (cleanCode.length === 10) {
        const dup = findDuplicateCodeOwner(cleanCode, books, customThemeCodes, editingSubmission?.id);
        if (dup) {
          setFormCodeError(
            isEn ? `This code is already used by ${dup}.` : `هذا الكود مستخدم بالفعل في ${dup}.`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      let documentPayload: DocumentUploadPayload | undefined;
      if (pendingDocBuffer) {
        await savePdfBlob(
          pendingDocBuffer.id,
          pendingDocBuffer.buffer,
          pendingDocBuffer.fileName
        );
        documentPayload = {
          id: pendingDocBuffer.id,
          fileName: pendingDocBuffer.fileName,
          mimeType:
            formBook.bookType === 'word'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/pdf',
          dataBase64: arrayBufferToBase64(pendingDocBuffer.buffer),
        };
      }

      const cleanedChapters = formBook.chapters
        .map((ch, idx) => ({
          ...ch,
          number: String(idx + 1).padStart(2, '0'),
          paragraphs: ch.paragraphs
            .flatMap((p) => p.split('\n\n'))
            .map((p) => p.trim())
            .filter(Boolean),
        }))
        .filter((ch) => ch.paragraphs.length > 0);

      const submittedReleaseAt =
        isComingSoon && comingSoonMode === 'datetime'
          ? toLocalDateTimeSubmitValue(comingSoonReleaseAt)
          : isComingSoon && comingSoonMode === 'date'
            ? comingSoonReleaseAt
            : undefined;

      const submittedDiscountPct =
        formBook.isPremium &&
        typeof formBook.discountPercent === 'number' &&
        formBook.discountPercent >= 1 &&
        formBook.discountPercent <= 99
          ? Math.floor(formBook.discountPercent)
          : null;
      const submittedPostReleaseDays =
        submittedDiscountPct &&
        isComingSoon &&
        typeof formBook.discountPostReleaseDays === 'number' &&
        formBook.discountPostReleaseDays >= 1
          ? Math.min(365, Math.floor(formBook.discountPostReleaseDays))
          : null;
      const submittedDiscountEndsAt =
        submittedDiscountPct && !submittedPostReleaseDays && formBook.discountEndsAt?.trim()
          ? toLocalDateTimeSubmitValue(formBook.discountEndsAt.trim()) ??
            formBook.discountEndsAt.trim()
          : null;

      const nextBook: BookRecord = {
        ...formBook,
        id: editingSubmission?.id ?? (formBook.id || `book-${Date.now()}`),
        author: accountDisplayName,
        authorUid: activeUid,
        isAuthorVerified: accountVerified,
        featured: false,
        version: editingSubmission ? editingSubmission.version + 1 : 1,
        updatedAt: new Date().toISOString().slice(0, 10),
        addedAt: isComingSoon
          ? editingSubmission?.addedAt
          : editingSubmission && !editingSubmission.isComingSoon
            ? editingSubmission.addedAt
            : new Date().toISOString(),
        isComingSoon,
        comingSoonMode: isComingSoon ? comingSoonMode : undefined,
        comingSoonReleaseAt: submittedReleaseAt,
        pages: hasContent ? formBook.pages : 0,
        readingMinutes: hasContent ? formBook.readingMinutes : 0,
        priceLabel: '',
        tokenPrice: formBook.isPremium
          ? typeof formBook.tokenPrice === 'number' && Number.isFinite(formBook.tokenPrice)
            ? Math.max(0, Math.floor(formBook.tokenPrice))
            : null
          : null,
        discountPercent: submittedDiscountPct,
        discountEndsAt: submittedDiscountEndsAt,
        discountPostReleaseDays: submittedPostReleaseDays,
        rotationHours: formBook.rotationHours ?? 24,
        unlockCode: formBook.isPremium ? (formBook.unlockCode ?? '').replace(/\D/g, '') : undefined,
        chapters: cleanedChapters,
      };

      const res = await onSubmitBook(nextBook, documentPayload);
      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text:
            res.error ??
            (isEn ? 'Failed to submit book for review.' : 'تعذر إرسال الكتاب للمراجعة حالياً.'),
        });
        return;
      }

      resetForm();
      setStatusMessage({
        type: 'success',
        text: isEn
          ? 'Your book has been sent to the developer for review! It is now visible only to you with a "Pending Review" badge.'
          : 'تم إرسال كتابك للمطور للمراجعة! يظهر الكتاب الآن لك وحدك وسط الكتب بعلامة «في انتظار المراجعة»، وسيصلك إشعار فور قبوله أو رفضه.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="publish-studio"
      className="mt-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 lg:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
              {isEn ? 'Publish Your Book' : 'نشر كتاب من حسابك'}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {isEn
                ? 'Submit your own text, PDF, Word, or Coming Soon book directly to the developer for review.'
                : 'ارفع كتابك (نصي أو PDF أو Word أو قريباً) وسيتربط بحسابك تلقائياً ويُرسل للمطور للمراجعة.'}
            </p>
          </div>
        </div>
        {user && editingSubmission && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--text-ink)] hover:border-[var(--accent-primary)]"
          >
            {isEn ? '+ Submit New Book' : '+ كتاب جديد'}
          </button>
        )}
      </div>

      {!user ? (
        <div className="mt-6 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 py-10 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-[var(--accent-primary)] opacity-80" aria-hidden="true" />
          <p className="mt-3 font-editorial text-lg font-bold text-[var(--text-ink)]">
            {isEn ? 'Sign in to publish books under your name' : 'سجّل الدخول لنشر الكتب باسمك'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
            {isEn
              ? 'Sign in with Google to submit books linked automatically to your profile and verification status.'
              : 'سجّل الدخول بحساب Google لإرسال كتبك للمطور؛ وسيتم ربطها تلقائياً بحسابك وحالة التوثيق الخاصة بك.'}
          </p>
          <button
            type="button"
            onClick={() => void onSignIn()}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{isEn ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Status / Submissions Tracker */}
          {mySubmissions.length > 0 && (
            <div className="space-y-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-editorial text-lg font-bold text-[var(--text-ink)]">
                  {isEn
                    ? `Your Submissions & Coming Soon (${mySubmissions.length})`
                    : `كتبك المُرسلة وقريباً (${mySubmissions.length})`}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {mySubmissions.map((sub) => {
                  const isRejected = sub.reviewStatus === 'rejected';
                  const isApprovedComingSoon =
                    sub.reviewStatus === 'approved' && Boolean(sub.isComingSoon);
                  const releaseLabel = formatComingSoonReleaseLabel(sub, lang);
                  return (
                    <div
                      key={sub.id}
                      className={`flex flex-col justify-between gap-3 rounded-lg border p-3.5 ${
                        isRejected
                          ? 'border-rose-500/45 bg-rose-500/[0.04]'
                          : isApprovedComingSoon
                            ? 'border-emerald-500/45 bg-emerald-500/[0.04]'
                            : 'border-amber-500/45 bg-amber-500/[0.04]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {sub.coverUrl ? (
                          <img
                            src={sub.coverUrl}
                            alt={sub.title}
                            referrerPolicy="no-referrer"
                            className="h-16 w-12 shrink-0 rounded-sm border border-[var(--border-hairline)] object-cover"
                          />
                        ) : (
                          <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
                            <BookOpen className="h-4 w-4" />
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                                isRejected
                                  ? 'bg-rose-500/15 text-rose-500'
                                  : isApprovedComingSoon
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {isRejected ? (
                                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                              ) : isApprovedComingSoon ? (
                                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              ) : (
                                <Clock className="h-3 w-3" aria-hidden="true" />
                              )}
                              {isRejected
                                ? isEn
                                  ? 'Not Approved'
                                  : 'تم الرفض'
                                : isApprovedComingSoon
                                  ? isEn
                                    ? 'Live in Coming Soon'
                                    : 'منشور كـ «قريباً»'
                                  : isEn
                                    ? 'Pending Review'
                                    : 'في انتظار المراجعة'}
                            </span>
                            {sub.isPremium && (
                              <>
                                <span className="rounded bg-amber-500 px-1.5 py-0.5 font-mono-tabular text-[10px] font-extrabold text-stone-950">
                                  VIP
                                </span>
                                <TokenPriceBadge
                                  amount={
                                    sub.effectiveTokenPrice ??
                                    sub.tokenPrice ??
                                    economyConfig?.defaultPremiumBookPrice ??
                                    40
                                  }
                                  lang={lang}
                                  size="xs"
                                />
                              </>
                            )}
                            {sub.isComingSoon && (
                              <span className="rounded border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
                                {isEn ? 'Coming Soon' : 'قريباً'}
                                {releaseLabel ? ` · ${releaseLabel}` : ''}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                            {sub.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {getSectionDisplayName(sub.category, lang, sectionTranslations)}
                            {sub.isComingSoon &&
                              !sub.pdfId &&
                              sub.chapters.length === 0 &&
                              (isEn ? ' · No PDF yet' : ' · بدون ملف PDF بعد')}
                          </p>

                          {isRejected && sub.reviewNote && (
                            <p className="mt-1.5 rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-rose-600 dark:text-rose-300">
                              <strong className="font-semibold">
                                {isEn ? 'Developer Note: ' : 'ملاحظة المطور: '}
                              </strong>
                              {sub.reviewNote}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-hairline)] pt-2.5">
                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => onOpenBook(sub)}
                            className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-ink)] hover:border-[var(--accent-primary)]"
                          >
                            <Eye className="h-3 w-3" aria-hidden="true" />
                            <span>{isEn ? 'Preview' : 'معاينة'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEditSubmission(sub)}
                          className="inline-flex items-center gap-1 rounded border border-[var(--accent-primary)]/50 bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)]"
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          <span>
                            {isRejected
                              ? isEn
                                ? 'Edit & Resubmit'
                                : 'تعديل وإعادة الإرسال'
                              : isApprovedComingSoon
                                ? isEn
                                  ? 'Attach PDF / Publish'
                                  : 'إرفاق PDF / تعديل النشر'
                                : isEn
                                  ? 'Edit'
                                  : 'تعديل'}
                          </span>
                        </button>
                        {!isApprovedComingSoon && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmState({
                                open: true,
                                title: isEn ? 'Delete Book Submission' : 'حذف طلب النشر',
                                message: isEn
                                  ? `Are you sure you want to delete "${sub.title}"?`
                                  : `هل أنت متأكد من حذف طلب كتاب «${sub.title}»؟`,
                                confirmLabel: isEn ? 'Delete' : 'حذف',
                                onConfirm: async () => {
                                  await onDeleteSubmission(sub.id);
                                  if (editingSubmission?.id === sub.id) {
                                    resetForm();
                                  }
                                  setConfirmState((c) => ({ ...c, open: false }));
                                },
                              })
                            }
                            className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            <span>{isEn ? 'Delete' : 'حذف'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {statusMessage && (
            <div
              role="status"
              className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-xs leading-relaxed ${
                statusMessage.type === 'success'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Auto-linked Account & Automatic Verification Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--text-muted)]">
                {isEn ? 'Auto-linked Author Account:' : 'الحساب المرتبط بالكتاب تلقائياً:'}
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-[var(--text-ink)]">
                <span>{accountDisplayName}</span>
                {accountVerified && <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />}
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {accountVerified
                ? isEn
                  ? 'Verified badge will appear automatically on your book'
                  : 'سيظهر توثيق حسابك تلقائياً بجانب اسمك على الكتاب'
                : isEn
                  ? 'Standard account (verification status follows your account)'
                  : 'حالة التوثيق تُؤخذ تلقائياً من حالة حسابك'}
            </span>
          </div>

          <form id="publish-studio-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Release Mode: Publish on Approval vs Coming Soon */}
            <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-ink)]">
                  {isEn ? 'Book Release Status' : 'حالة نزول الكتاب'}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {formBook.isComingSoon
                    ? isEn
                      ? 'After approval, readers see Coming Soon + Notify Me'
                      : 'بعد موافقة المطور يظهر بعلامة Coming Soon مع زر ذكّرني'
                    : isEn
                      ? 'Published immediately for reading once approved'
                      : 'يُنشر للقراءة فوراً بعد موافقة المطور'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormBook((prev) => ({ ...prev, isComingSoon: false }))}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    !formBook.isComingSoon
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-ink)]'
                  }`}
                >
                  {isEn ? 'Publish Upon Approval' : 'نشر كامل فور الموافقة'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormBook((prev) => ({
                      ...prev,
                      isComingSoon: true,
                      comingSoonMode: prev.comingSoonMode ?? 'open',
                    }))
                  }
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                    formBook.isComingSoon
                      ? 'border-amber-500 bg-amber-500 text-stone-950'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-amber-500 hover:text-amber-500'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isEn ? 'Coming Soon (قريباً)' : 'قريباً (Coming Soon)'}</span>
                </button>
              </div>

              {formBook.isComingSoon && (
                <div className="space-y-3 border-t border-[var(--border-hairline)] pt-3">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {isEn ? 'Expected Release Schedule:' : 'تحديد ميعاد نزول الكتاب القادم:'}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormBook((prev) => ({
                          ...prev,
                          comingSoonMode: 'open',
                          comingSoonReleaseAt: '',
                        }))
                      }
                      className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                        (formBook.comingSoonMode ?? 'open') === 'open'
                          ? 'border-amber-500 bg-amber-500/15 font-semibold text-amber-600 dark:text-amber-300'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      {isEn ? 'Open (No set date)' : 'مفتوح (بدون ميعاد محدد)'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormBook((prev) => ({
                          ...prev,
                          comingSoonMode: 'date',
                          comingSoonReleaseAt:
                            prev.comingSoonMode === 'date' && prev.comingSoonReleaseAt
                              ? prev.comingSoonReleaseAt
                              : prev.comingSoonReleaseAt?.slice(0, 10) || '',
                        }))
                      }
                      className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                        formBook.comingSoonMode === 'date'
                          ? 'border-amber-500 bg-amber-500/15 font-semibold text-amber-600 dark:text-amber-300'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      {isEn ? 'Future Date Only' : 'تاريخ محدد قدام'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormBook((prev) => ({
                          ...prev,
                          comingSoonMode: 'datetime',
                          comingSoonReleaseAt:
                            prev.comingSoonMode === 'datetime' && prev.comingSoonReleaseAt
                              ? prev.comingSoonReleaseAt
                              : prev.comingSoonReleaseAt && prev.comingSoonReleaseAt.length === 10
                                ? `${prev.comingSoonReleaseAt}T20:00`
                                : prev.comingSoonReleaseAt || '',
                        }))
                      }
                      className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                        formBook.comingSoonMode === 'datetime'
                          ? 'border-amber-500 bg-amber-500/15 font-semibold text-amber-600 dark:text-amber-300'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      {isEn ? 'Exact Date & Time' : 'ميعاد معين (تاريخ وساعة)'}
                    </button>
                  </div>

                  {formBook.comingSoonMode === 'date' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {[1, 3, 7, 14, 30].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                              const pad = (n: number) => String(n).padStart(2, '0');
                              const dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                              setFormBook((prev) => ({ ...prev, comingSoonReleaseAt: dateVal }));
                            }}
                            className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-ink)] hover:border-amber-500 hover:text-amber-500"
                          >
                            {isEn
                              ? `+${days}d`
                              : `بعد ${days} ${days === 1 ? 'يوم' : days <= 10 ? 'أيام' : 'يوماً'}`}
                          </button>
                        ))}
                      </div>
                      <input
                        type="date"
                        dir="ltr"
                        value={(formBook.comingSoonReleaseAt ?? '').slice(0, 10)}
                        onChange={(e) =>
                          setFormBook((prev) => ({ ...prev, comingSoonReleaseAt: e.target.value }))
                        }
                        className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  )}
                  {formBook.comingSoonMode === 'datetime' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { hours: 1, ar: 'بعد ساعة', en: '+1h' },
                          { hours: 3, ar: 'بعد 3 ساعات', en: '+3h' },
                          { hours: 12, ar: 'بعد 12 ساعة', en: '+12h' },
                          { hours: 24, ar: 'بعد 24 ساعة', en: '+24h' },
                          { hours: 72, ar: 'بعد 3 أيام', en: '+3d' },
                        ].map((opt) => (
                          <button
                            key={opt.hours}
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + opt.hours * 60 * 60 * 1000);
                              const pad = (n: number) => String(n).padStart(2, '0');
                              const dtVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                              setFormBook((prev) => ({ ...prev, comingSoonReleaseAt: dtVal }));
                            }}
                            className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-ink)] hover:border-amber-500 hover:text-amber-500"
                          >
                            {isEn ? opt.en : opt.ar}
                          </button>
                        ))}
                      </div>
                      <input
                        type="datetime-local"
                        dir="ltr"
                        value={toLocalDateTimeInputValue(formBook.comingSoonReleaseAt)}
                        onChange={(e) =>
                          setFormBook((prev) => ({ ...prev, comingSoonReleaseAt: e.target.value }))
                        }
                        className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <p
                    className={`rounded-md border px-3 py-2 text-[11px] leading-relaxed ${
                      (formBook.comingSoonMode ?? 'open') === 'open'
                        ? 'border-emerald-500/35 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-300'
                        : 'border-amber-500/40 bg-amber-500/[0.06] text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {(formBook.comingSoonMode ?? 'open') === 'open'
                      ? isEn
                        ? 'Open mode: Uploading a PDF/Word file or writing chapters is completely optional right now. You can attach the PDF later whenever ready and either publish or keep it Coming Soon.'
                        : 'وضع مفتوح: لست مجبراً على رفع ملف PDF أو كتابة فصول الآن! يمكنك إرسال البطاقة كـ Coming Soon الآن، وعندما ترفع الـ PDF لاحقاً يمكنك نشره أو إبقاءه في «قريباً» براحتك.'
                      : isEn
                        ? 'Scheduled release: Because you set a release date or time (days or hours) for automatic launch, attaching the PDF/Word file or writing at least one chapter is required now.'
                        : 'ميعاد محدد (ساعات أو أيام): لأن الكتاب سينزل تلقائياً في الموعد المحدد، يجب رفع ملف PDF/Word أو كتابة فصل واحد على الأقل الآن.'}
                  </p>
                </div>
              )}
            </div>

            {/* Book Type Switch */}
            <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1">
              <button
                type="button"
                onClick={() => setFormBook((prev) => ({ ...prev, bookType: 'text' }))}
                className={`rounded px-3 py-2 text-xs font-medium transition-colors ${
                  (formBook.bookType ?? 'text') === 'text'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
                }`}
              >
                {isEn ? 'Text Book (Chapters)' : 'كتاب نصي (فصول)'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormBook((prev) => ({
                    ...prev,
                    bookType: prev.bookType === 'word' ? 'word' : 'pdf',
                  }))
                }
                className={`rounded px-3 py-2 text-xs font-medium transition-colors ${
                  formBook.bookType === 'pdf' || formBook.bookType === 'word'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
                }`}
              >
                {isEn ? 'PDF / Word Flipbook' : 'كتاب PDF / Word بتقليب الصفحات'}
              </button>
            </div>

            {(formBook.bookType === 'pdf' || formBook.bookType === 'word') && (
              <div className="rounded-md border border-dashed border-[var(--accent-primary)]/50 bg-[var(--bg-canvas)] p-4 text-center">
                <FileText className="mx-auto h-7 w-7 text-[var(--accent-primary)]" aria-hidden="true" />
                <p className="mt-2 text-xs font-medium text-[var(--text-ink)]">
                  {isParsingDoc
                    ? isEn
                      ? 'Reading document and paginating book sheets...'
                      : 'جاري قراءة الملف وتجهيز صفحات الكتاب...'
                    : pendingDocBuffer
                      ? isEn
                        ? `Ready (${formBook.bookType === 'word' ? 'Word' : 'PDF'}): ${pendingDocBuffer.fileName} (${formBook.pdfPageCount} pages)`
                        : `تم تجهيز (${formBook.bookType === 'word' ? 'Word' : 'PDF'}): ${pendingDocBuffer.fileName} (${formBook.pdfPageCount} صفحة)`
                      : formBook.pdfId
                        ? isEn
                          ? `Attached ${formBook.bookType === 'word' ? 'Word' : 'PDF'} file (${formBook.pdfPageCount} pages)`
                          : `ملف ${formBook.bookType === 'word' ? 'Word' : 'PDF'} مرفق (${formBook.pdfPageCount} صفحة)`
                        : formBook.isComingSoon && (formBook.comingSoonMode ?? 'open') === 'open'
                          ? isEn
                            ? 'Optional in Open Coming Soon — leave empty for now and upload your PDF/Word anytime later'
                            : 'اختياري في وضع «قريباً — مفتوح» — تقدر تسيبه فاضي دلوقتي وترفع الـ PDF لاحقاً براحتك'
                          : formBook.isComingSoon
                            ? isEn
                              ? 'Required for scheduled release — upload the PDF or Word file so it launches automatically on time'
                              : 'مطلوب للميعاد المحدد — ارفع ملف PDF أو Word لينزل تلقائياً في موعده'
                            : isEn
                              ? 'Upload a PDF or Word (.docx) file'
                              : 'ارفع ملف PDF أو Word (.docx)'}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--btn-dark)] px-4 py-2 text-xs font-medium text-[var(--btn-dark-fg)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)]">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {pendingDocBuffer || formBook.pdfId
                        ? isEn
                          ? 'Replace PDF / Word File'
                          : 'تغيير ملف PDF / Word'
                        : isEn
                          ? 'Choose PDF or Word File'
                          : 'اختيار ملف PDF أو Word'}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.doc"
                      onChange={handleDocumentUpload}
                      className="sr-only"
                    />
                  </label>
                  {(pendingDocBuffer || formBook.pdfId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingDocBuffer(null);
                        setFormBook((prev) => ({
                          ...prev,
                          pdfId: undefined,
                          pdfPageCount: undefined,
                        }));
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:border-red-500/50 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isEn ? 'Remove file' : 'إزالة الملف'}</span>
                    </button>
                  )}
                </div>

                {formBook.isComingSoon && (pendingDocBuffer || formBook.pdfId) && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-500/35 bg-emerald-500/[0.07] px-3 py-2 text-start text-[11px] text-emerald-700 dark:text-emerald-300">
                    <span>
                      {isEn
                        ? 'File ready! You can switch to full release now or keep it in Coming Soon as long as you wish.'
                        : 'الملف جاهز! يمكنك الآن تحويله للنشر الكامل عند الموافقة أو إبقاءه في «قريباً» للمدة التي تريدها.'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormBook((prev) => ({
                          ...prev,
                          isComingSoon: false,
                        }))
                      }
                      className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 whitespace-nowrap shrink-0"
                    >
                      {isEn ? 'Switch to Full Release' : 'نشر كامل عند الموافقة'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Title, Subtitle & Category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">
                  {isEn ? 'Book Title *' : 'عنوان الكتاب *'}
                </label>
                <input
                  type="text"
                  required
                  value={formBook.title}
                  onChange={(e) => setFormBook({ ...formBook, title: e.target.value })}
                  placeholder={isEn ? 'Enter book title' : 'اكتب عنوان الكتاب'}
                  className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">
                  {isEn ? 'Subtitle' : 'العنوان الفرعي'}
                </label>
                <input
                  type="text"
                  value={formBook.subtitle}
                  onChange={(e) => setFormBook({ ...formBook, subtitle: e.target.value })}
                  placeholder={isEn ? 'Short tagline' : 'وصف مختصر تحت العنوان'}
                  className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">
                  {isEn ? 'Section' : 'القسم'}
                </label>
                <select
                  value={formBook.category}
                  onChange={(e) => setFormBook({ ...formBook, category: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                >
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>
                      {formatSectionHeading(sec, lang, sectionTranslations)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Series / Multi-Part Linking */}
            <SeriesEditorField
              currentBook={formBook}
              availableBooks={books.filter(
                (b) => b.authorUid === activeUid && b.reviewStatus !== 'rejected' && b.id !== formBook.id
              )}
              lang={lang}
              onChange={(patch) => setFormBook((prev) => ({ ...prev, ...patch }))}
            />

            {/* Year, Pages, Reading Minutes */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">
                  {isEn ? 'Year' : 'السنة'}
                </label>
                <input
                  type="number"
                  value={formBook.year}
                  onChange={(e) =>
                    setFormBook({ ...formBook, year: Number(e.target.value) || 2026 })
                  }
                  className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono-tabular text-sm text-[var(--text-ink)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">
                  {isEn ? 'Pages' : 'الصفحات'}
                </label>
                <input
                  type="number"
                  value={formBook.pages}
                  onChange={(e) =>
                    setFormBook({ ...formBook, pages: Number(e.target.value) || 1 })
                  }
                  className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono-tabular text-sm text-[var(--text-ink)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">
                  {isEn ? 'Read Mins' : 'دقائق القراءة'}
                </label>
                <input
                  type="number"
                  value={formBook.readingMinutes}
                  onChange={(e) =>
                    setFormBook({
                      ...formBook,
                      readingMinutes: Number(e.target.value) || 5,
                    })
                  }
                  className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono-tabular text-sm text-[var(--text-ink)]"
                />
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">
                {isEn ? 'Synopsis' : 'نبذة عن الكتاب'}
              </label>
              <textarea
                rows={2}
                value={formBook.synopsis}
                onChange={(e) => setFormBook({ ...formBook, synopsis: e.target.value })}
                placeholder={
                  isEn ? 'Summary displayed on the book card...' : 'ملخص يظهر على بطاقة الكتاب...'
                }
                className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </div>

            {/* Premium Option */}
            <div className="space-y-3 rounded-md border border-amber-500/40 bg-[var(--bg-canvas)] p-4">
              <p className="text-xs font-semibold text-[var(--text-ink)]">
                {isEn ? 'Make this book Premium?' : 'هل تريد أن يكون هذا الكتاب بريميوم؟'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormBook((prev) => ({ ...prev, isPremium: false }));
                    setFormCodeError(null);
                  }}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    !formBook.isPremium
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  {isEn ? 'No, Standard Book' : 'لا، كتاب عادي للجميع'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormBook((prev) => ({ ...prev, isPremium: true }));
                    setFormCodeError(null);
                  }}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    formBook.isPremium
                      ? 'border-amber-500 bg-amber-500 font-semibold text-stone-950'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-amber-500 hover:text-amber-500'
                  }`}
                >
                  {isEn ? 'Yes, Premium Book (Code Locked)' : 'نعم، كتاب بريميوم (مقفل بكود)'}
                </button>
              </div>

              {formBook.isPremium && (
                <div className="space-y-3 border-t border-[var(--border-hairline)] pt-3">
                  <div>
                    <label
                      htmlFor="user-submission-token-price"
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-ink)]"
                    >
                      <TokenIcon className="h-4 w-4" />
                      <span>
                        {isEn
                          ? 'Your Premium Book Price (shown to developer during review)'
                          : 'سعر الكتاب البريميوم الخاص بك (يظهر للمطور أثناء المراجعة)'}
                      </span>
                    </label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[160px]">
                        <input
                          id="user-submission-token-price"
                          type="number"
                          min={0}
                          max={100000}
                          value={formBook.tokenPrice ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            setFormBook((prev) => ({
                              ...prev,
                              tokenPrice:
                                raw === '' ? null : Math.max(0, Math.min(100000, Math.floor(Number(raw) || 0))),
                            }));
                          }}
                          placeholder={String(economyConfig?.defaultPremiumBookPrice ?? 40)}
                          dir="ltr"
                          className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-center font-mono-tabular text-sm font-bold text-amber-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <TokenPriceBadge
                        amount={
                          typeof formBook.tokenPrice === 'number'
                            ? formBook.tokenPrice
                            : economyConfig?.defaultPremiumBookPrice ?? 40
                        }
                        lang={lang}
                        size="sm"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {isEn
                        ? `Leave blank to use default (${economyConfig?.defaultPremiumBookPrice ?? 40}). Sales & pre-orders send tokens directly to your account.`
                        : `اتركه فارغاً لاستخدام السعر الافتراضي (${economyConfig?.defaultPremiumBookPrice ?? 40}). قيمة الشراء أو الطلب المسبق تُحوّل لحسابك مباشرةً.`}
                    </p>
                  </div>

                  {/* Optional Launch / Pre-Order Discount */}
                  <div className="border-t border-[var(--border-hairline)] pt-2.5 space-y-2">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label
                          htmlFor="user-submission-discount-percent"
                          className="block text-xs font-semibold text-rose-500"
                        >
                          {isEn
                            ? formBook.isComingSoon
                              ? 'Pre-Order / Launch Sale % (optional)'
                              : 'Sale Discount % (1-99, optional)'
                            : formBook.isComingSoon
                              ? 'خصم الطلب المسبق وعند النشر % (اختياري)'
                              : 'نسبة خصم السيل % (اختياري)'}
                        </label>
                        <input
                          id="user-submission-discount-percent"
                          type="number"
                          min={1}
                          max={99}
                          dir="ltr"
                          value={formBook.discountPercent ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setFormBook((prev) => ({
                              ...prev,
                              discountPercent:
                                raw === ''
                                  ? null
                                  : Math.max(1, Math.min(99, Math.floor(Number(raw) || 1))),
                            }));
                          }}
                          placeholder="20"
                          className="mt-1 w-24 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-center font-mono-tabular text-xs font-bold text-rose-500 focus:border-rose-500 focus:outline-none"
                        />
                      </div>

                      {typeof formBook.discountPercent === 'number' &&
                        formBook.discountPercent >= 1 &&
                        (formBook.isComingSoon ? (
                          <div>
                            <label
                              htmlFor="user-submission-post-release-days"
                              className="block text-xs font-medium text-[var(--text-muted)]"
                            >
                              {isEn
                                ? 'Days active after release (blank = open):'
                                : 'مدة استمرار الخصم بعد النشر (أيام):'}
                            </label>
                            <div className="mt-1 flex items-center gap-1.5">
                              <input
                                id="user-submission-post-release-days"
                                type="number"
                                min={1}
                                max={365}
                                dir="ltr"
                                value={formBook.discountPostReleaseDays ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setFormBook((prev) => ({
                                    ...prev,
                                    discountPostReleaseDays:
                                      raw === ''
                                        ? null
                                        : Math.max(1, Math.min(365, Math.floor(Number(raw) || 1))),
                                    discountEndsAt: raw === '' ? prev.discountEndsAt : '',
                                  }));
                                }}
                                placeholder="2"
                                className="w-20 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-center font-mono-tabular text-xs font-bold text-[var(--text-ink)] focus:border-rose-500 focus:outline-none"
                              />
                              <span className="text-[11px] text-[var(--text-muted)]">
                                {isEn ? 'days (e.g. 2)' : 'يوم (مثلاً يومان)'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label
                              htmlFor="user-submission-discount-ends"
                              className="block text-xs font-medium text-[var(--text-muted)]"
                            >
                              {isEn
                                ? 'Sale End Date/Time (blank = open):'
                                : 'ميعاد انتهاء السيل (فارغ = مفتوح):'}
                            </label>
                            <input
                              id="user-submission-discount-ends"
                              type="datetime-local"
                              dir="ltr"
                              value={formBook.discountEndsAt ?? ''}
                              onChange={(e) =>
                                setFormBook((prev) => ({
                                  ...prev,
                                  discountEndsAt: e.target.value,
                                }))
                              }
                              className="mt-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono-tabular text-xs text-[var(--text-ink)] focus:border-rose-500 focus:outline-none"
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                  <p className="flex items-center gap-1.5 border-t border-[var(--border-hairline)] pt-2.5 text-xs text-[var(--text-muted)]">
                    <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    {isEn
                      ? 'Single-use code — automatically generates a new 10-digit code after each use.'
                      : 'كود استخدام واحد — يتجدد تلقائياً بكود جديد فور تفعيله لمنع المشاركة.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={formBook.unlockCode ?? ''}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder={
                        isEn ? '10 digits (or auto)...' : '10 أرقام (أو اتركه للتوليد التلقائي)...'
                      }
                      dir="ltr"
                      className={`flex-1 rounded border bg-[var(--bg-surface)] px-3 py-2 text-center font-mono-tabular text-sm tracking-widest text-[var(--text-ink)] focus:outline-none ${
                        formCodeError
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[var(--border-hairline)] focus:border-amber-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-ink)] hover:border-amber-500 hover:text-amber-500 whitespace-nowrap shrink-0"
                    >
                      {isEn ? 'Auto-generate' : 'توليد تلقائي'}
                    </button>
                  </div>
                  {formCodeError && (
                    <p role="alert" className="text-xs font-semibold text-red-500">
                      {formCodeError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cover Upload & Instant Preview */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">
                {isEn ? 'Book Cover *' : 'غلاف الكتاب *'}
              </label>
              <div className="mt-2 flex flex-wrap items-start gap-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
                <div className="aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                  {formBook.coverUrl ? (
                    <img
                      src={formBook.coverUrl}
                      alt={formBook.title || (isEn ? 'Cover preview' : 'معاينة الغلاف')}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-[var(--text-muted)]">
                      <ImageIcon className="h-7 w-7 opacity-55" aria-hidden="true" />
                      <span className="mt-2 text-[11px] leading-snug">
                        {isEn ? 'No cover selected' : 'لا توجد صورة غلاف'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex min-w-[200px] flex-1 flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[var(--text-ink)]">
                      {formBook.coverUrl
                        ? isEn
                          ? 'Cover preview ready'
                          : 'معاينة الغلاف جاهزة أمامك قبل الإرسال'
                        : isEn
                          ? 'Upload a cover image from your device'
                          : 'ارفع صورة الغلاف من جهازك لمعاينتها قبل إرسال الكتاب'}
                    </p>
                    <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                      {isEn
                        ? 'Your uploaded image appears right here immediately so you can check or swap it first.'
                        : 'تظهر الصورة هنا فوراً بعد اختيارها لتراجع شكلها أو تغيرها قبل الإرسال.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {formBook.coverUrl
                          ? isEn
                            ? 'Change image'
                            : 'تغيير الصورة'
                          : isEn
                            ? 'Upload image'
                            : 'رفع صورة (Upload image)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="sr-only"
                      />
                    </label>

                    {formBook.coverUrl && (
                      <button
                        type="button"
                        onClick={() => setFormBook((prev) => ({ ...prev, coverUrl: '' }))}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-red-500/50 hover:text-red-500 whitespace-nowrap shrink-0"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isEn ? 'Remove cover' : 'إزالة الصورة'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters Builder */}
            {(formBook.bookType ?? 'text') === 'text' && (
              <div className="border-t border-[var(--border-hairline)] pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text-ink)]">
                    {isEn
                      ? `Book Chapters (${formBook.chapters.length})`
                      : `فصول الكتاب (${formBook.chapters.length})`}
                  </p>
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)]"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {isEn ? 'New Chapter' : 'فصل جديد'}
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {formBook.chapters.map((ch, idx) => (
                    <div
                      key={ch.id}
                      className="space-y-3 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-tabular text-xs font-bold text-[var(--accent-primary)]">
                          {isEn ? 'Chapter' : 'الفصل'} {String(idx + 1).padStart(2, '0')}
                        </span>
                        {formBook.chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormBook((prev) => ({
                                ...prev,
                                chapters: prev.chapters
                                  .filter((_, i) => i !== idx)
                                  .map((c, i) => ({
                                    ...c,
                                    number: String(i + 1).padStart(2, '0'),
                                  })),
                              }))
                            }
                            className="text-xs text-[var(--text-muted)] hover:text-red-500"
                          >
                            {isEn ? 'Delete Chapter' : 'حذف الفصل'}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={ch.title}
                        onChange={(e) => handleChapterChange(idx, { title: e.target.value })}
                        placeholder={isEn ? 'Chapter title' : 'عنوان الفصل'}
                        className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-ink)]"
                      />
                      <input
                        type="text"
                        value={ch.epigraph ?? ''}
                        onChange={(e) => handleChapterChange(idx, { epigraph: e.target.value })}
                        placeholder={
                          isEn ? 'Opening epigraph (optional)' : 'اقتباس افتتاحي (اختياري)'
                        }
                        className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-ink)]"
                      />
                      <textarea
                        rows={4}
                        value={ch.paragraphs.join('\n\n')}
                        onChange={(e) =>
                          handleChapterChange(idx, {
                            paragraphs: e.target.value.split('\n\n'),
                          })
                        }
                        placeholder={
                          isEn
                            ? 'Write chapter text here... (leave an empty line between paragraphs)'
                            : 'اكتب نص الفصل هنا... (اترك سطراً فارغاً بين كل فقرة وأخرى)'
                        }
                        className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm leading-relaxed text-[var(--text-ink)]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Publishing Fee Summary Card */}
            {(() => {
              const regularCost = economyConfig?.publishRegularBookCost ?? 15;
              const premiumCost = economyConfig?.publishPremiumBookCost ?? 30;
              const requiredCost = formBook.isPremium ? premiumCost : regularCost;
              const alreadyPaid = editingSubmission?.publishTokensPaid ?? 0;
              const netDue = Math.max(0, requiredCost - alreadyPaid);
              const effectiveBalance =
                typeof userTokensBalance === 'number'
                  ? userTokensBalance
                  : userAccount?.tokensBalance ?? 0;
              const hasEnough = effectiveBalance >= netDue;

              return (
                <>
                  <div className="rounded-lg border border-amber-500/45 bg-amber-500/[0.07] p-4 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TokenIcon className="h-5 w-5" />
                        <div>
                          <p className="font-bold text-[var(--text-ink)]">
                            {formBook.isPremium
                              ? isEn
                                ? 'Premium Book Publishing Fee'
                                : 'رسوم نشر كتاب بريميوم'
                              : isEn
                                ? 'Regular Book Publishing Fee'
                                : 'رسوم نشر كتاب عادي'}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {isEn
                              ? `Regular: ${regularCost} · Premium: ${premiumCost}`
                              : `الكتاب العادي: ${regularCost} عملة · الكتاب البريميوم: ${premiumCost} عملة`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {alreadyPaid > 0
                            ? isEn
                              ? `Paid ${alreadyPaid}, Due:`
                              : `مدفوع ${alreadyPaid}، المطلوب الآن:`
                            : isEn
                              ? 'Due Now:'
                              : 'المطلوب:'}
                        </span>
                        <TokenPriceBadge amount={netDue} lang={lang} size="sm" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/25 pt-2 text-[11px]">
                      <span className="text-[var(--text-muted)]">
                        {isEn ? 'Your wallet balance:' : 'رصيد محفظتك الحالي:'}{' '}
                        <strong className="font-mono-tabular text-amber-600 dark:text-amber-400">
                          {effectiveBalance}
                        </strong>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {isEn
                          ? `Earn +${economyConfig?.rewardBookApproved ?? 20} on approval, +${economyConfig?.rewardCommentOnBook ?? 5}/comment, +${economyConfig?.rewardBookRatingAbove4 ?? 35} > 4.0★`
                          : `تربح +${economyConfig?.rewardBookApproved ?? 20} عند القبول، +${economyConfig?.rewardCommentOnBook ?? 5} لكل تعليق، +${economyConfig?.rewardBookRatingAbove4 ?? 35} فوق ٤ نجوم`}
                      </span>
                    </div>

                    {!hasEnough && (
                      <p role="alert" className="font-semibold text-rose-500">
                        {isEn
                          ? `Insufficient Golden Tokens. You need ${netDue - effectiveBalance} more tokens to submit this book.`
                          : `رصيد العملات الذهبية غير كافٍ. تحتاج ${netDue - effectiveBalance} عملة إضافية لإرسال هذا الكتاب.`}
                      </p>
                    )}
                  </div>

                  {/* Submit for Review Button (No Direct Publish) */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || isParsingDoc || Boolean(formCodeError) || !hasEnough}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {isSubmitting
                          ? isEn
                            ? 'Sending for Review...'
                            : 'جاري الإرسال للمطور...'
                          : editingSubmission
                            ? isEn
                              ? `Resubmit (${netDue} Tokens)`
                              : netDue > 0
                                ? `إعادة الإرسال للمراجعة (${netDue} عملة)`
                                : 'إعادة الإرسال للمطور للمراجعة'
                            : isEn
                              ? `Send for Review (${netDue} Tokens)`
                              : `إرسال للمطور للمراجعة (${netDue} عملة)`}
                      </span>
                    </button>

                  {editingSubmission && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-3 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-ink)]"
                    >
                      {isEn ? 'Cancel Edit' : 'إلغاء التعديل'}
                    </button>
                  )}
                </div>
              </>
              );
            })()}
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((c) => ({ ...c, open: false }))}
        lang={lang}
      />
    </div>
  );
};
