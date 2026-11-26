import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Crown,
  Download,
  Eye,
  FileText,
  FolderTree,
  Gift,
  Image as ImageIcon,
  KeyRound,
  Languages,
  Lock,
  LogIn,
  LogOut,
  Megaphone,
  MessageSquareText,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Send,
  Smartphone,
  Star,
  Tag,
  Trash2,
  Unlock,
  Upload,
  Users,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { getBookRating } from '../bookRatings';
import {
  DEFAULT_TOKEN_ECONOMY_CONFIG,
  arrayBufferToBase64,
  findDuplicateCodeOwner,
  formatComingSoonReleaseLabel,
  generateTenDigitCode,
  hasBookContent,
  savePdfBlob,
  toLocalDateTimeInputValue,
  toLocalDateTimeSubmitValue,
  type AppSettings,
  type BookRecord,
  type CatalogPayload,
  type Chapter,
  type PendingBookReviewItem,
  type PendingPriceRequestItem,
  type RecoverableLocalData,
  type StoredPdfBlobEntry,
  type SyncReport,
  type TokenEconomyConfig,
} from '../db/booksDb';
import {
  APP_ICON_CATALOG,
  DEFAULT_APP_ICON_ID,
  PREMIUM_APP_ICONS,
  getAppIconById,
  type AppIconId,
} from '../appIconCatalog';
import {
  formatSectionHeading,
  getSectionDisplayName,
  getThemeDisplayDescription,
  getThemeDisplayName,
  UI_COPY,
} from '../i18n';
import { checkForServiceWorkerUpdate, getServiceWorkerDiagnostics, type SWDiagnostics } from '../swRegister';
import { PREMIUM_THEMES, THEME_CATALOG, type ThemeId } from '../themeCatalog';
import { AppIconGraphic } from './AppIconGraphic';
import { OwnerBadge, StarRatingDisplay } from './BookRatingBar';
import { ConfirmDialog } from './ConfirmDialog';
import { DeveloperEconomyPanel } from './DeveloperEconomyPanel';
import type { IconAccessState, ThemeAccessState } from './PremiumSection';
import { SeriesEditorField } from './SeriesEditorField';
import { TokenIcon, TokenPriceBadge } from './TokenCoin';

export interface DevCodeVaultEntry {
  targetType: 'book' | 'theme' | 'icon';
  targetId: string;
  label: string;
  rotatingCode: string;
  codeRotatedAt: string;
  codeExpiresAt: string;
  rotationHours: number;
  priceLabel?: string;
  tokenPrice?: number | null;
  effectiveTokenPrice?: number;
}

export interface DevUserPurchaseEntry {
  uid: string;
  email: string;
  displayName: string;
  isVerified: boolean;
  tokensBalance?: number;
  createdAt: string;
  purchasedBookIds: string[];
  purchasedThemeIds: string[];
  purchasedIconIds?: string[];
}

export interface DocumentUploadPayload {
  id: string;
  fileName: string;
  mimeType: string;
  dataBase64: string;
}

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  books: BookRecord[];
  sections: string[];
  sectionTranslations: Record<string, string>;
  unlockedIds: string[];
  purchasedIds: string[];
  customThemeCodes: Record<string, string>;
  isAuthenticated: boolean;
  currentUserUid?: string | null;
  userEmail?: string | null;
  onSignIn: () => Promise<void>;
  onSaveCustomThemeCode: (themeId: string, code: string) => Promise<void>;
  onUnlockByCode: (code: string) => Promise<{ ok: boolean; label?: string }>;
  onRequestThemeUnlock: (themeId: ThemeId, themeName: string) => void;
  onRequestIconUnlock?: (iconId: AppIconId, iconName: string) => void;
  onGiftTheme?: (themeId: ThemeId) => void;
  isDeveloperMode: boolean;
  onUnlockDeveloper: (password: string) => boolean | Promise<boolean>;
  onLockDeveloper: () => void;
  devCodesVault: DevCodeVaultEntry[];
  devUsersList: DevUserPurchaseEntry[];
  onRotateCode: (
    targetType: 'book' | 'theme' | 'icon',
    targetId: string,
    customCode?: string,
    rotationHours?: number
  ) => Promise<{ ok: boolean; error?: string }>;
  onRotateAllCodes: () => Promise<void>;
  onGrantPermanentAccess: (
    email: string,
    targetType: 'book' | 'theme' | 'icon',
    targetId: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onRevokePermanentAccess: (
    userUid: string,
    targetType: 'book' | 'theme' | 'icon',
    targetId: string
  ) => Promise<void>;
  onSetUserVerified: (userUid: string, isVerified: boolean) => Promise<void>;
  onToggleBookAuthorVerified: (bookId: string, isAuthorVerified: boolean) => Promise<void>;
  onAssignBookOwner: (
    bookId: string,
    authorUid: string | null,
    notifyFollowers?: boolean
  ) => Promise<void>;
  onSaveBook: (
    book: BookRecord,
    documentPayload?: DocumentUploadPayload,
    notifyFollowers?: boolean
  ) => Promise<void>;
  onDeleteBook: (bookId: string, pdfId?: string) => Promise<void>;
  onAddSection: (
    name: string,
    englishName?: string
  ) => Promise<{ ok: boolean; sections: string[]; error?: 'empty' | 'duplicate' }>;
  onRenameSection: (
    oldName: string,
    newName: string,
    englishName?: string
  ) => Promise<{ ok: boolean; sections: string[]; books: BookRecord[]; error?: 'empty' | 'duplicate' }>;
  onDeleteSection: (
    sectionName: string,
    fallbackSection?: string
  ) => Promise<{ sections: string[]; books: BookRecord[]; reassignedTo: string | null }>;
  onAssignBookSection: (bookId: string, sectionName: string) => Promise<void>;
  onAddBookReview: (
    bookId: string,
    reviewerName: string,
    rating: number,
    comment: string,
    isOwner?: boolean,
    isVerified?: boolean,
    reviewerUid?: string | null
  ) => Promise<{ ok: boolean; error?: string }>;
  onUpdateBookReview: (
    reviewId: string,
    reviewerName: string,
    rating: number,
    comment: string,
    isOwner?: boolean,
    isVerified?: boolean,
    reviewerUid?: string | null
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteBookReview: (reviewId: string) => Promise<void>;
  onImportCatalog: (payload: CatalogPayload) => Promise<void>;
  onCheckUpdates: () => Promise<void>;
  onResetServerCatalog: () => Promise<void>;
  onClearProgress: () => Promise<void>;
  syncReport: SyncReport | null;
  localRecoverable?: RecoverableLocalData;
  onScanLocalRecoverable?: () => Promise<RecoverableLocalData>;
  onMigrateLocalBooks?: () => Promise<number>;
  onRestoreOrphanDocument?: (blob: StoredPdfBlobEntry) => Promise<boolean>;
  onBackToLibrary: () => void;
  sectionMode?: 'settings' | 'developer';
  onOpenDeveloperSettings?: () => void;
  devPendingSubmissions?: BookRecord[];
  onReviewSubmission?: (
    bookId: string,
    decision: 'approve' | 'reject',
    reviewNote?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  devPendingPriceRequests?: PendingPriceRequestItem[];
  onReviewPriceRequest?: (
    bookId: string,
    decision: 'approve' | 'reject',
    reviewNote?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  devPendingReviews?: PendingBookReviewItem[];
  onModerateReview?: (
    reviewId: string,
    decision: 'approve' | 'reject',
    moderationNote?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onPreviewSubmission?: (book: BookRecord) => void;
  onBroadcastFeatureAnnouncement?: (payload: {
    titleAr: string;
    titleEn?: string;
    messageAr: string;
    messageEn?: string;
    targetView: string;
    targetSection?: string | null;
  }) => Promise<{ ok: boolean; error?: string; recipientsCount?: number }>;
  economyConfig?: TokenEconomyConfig;
  themeAccessMap?: Record<string, ThemeAccessState>;
  iconAccessMap?: Record<string, IconAccessState>;
  onUpdateEconomyConfig?: (
    next: Partial<TokenEconomyConfig>
  ) => Promise<{ ok: boolean; error?: string }>;
  onSetItemTokenPrice?: (
    targetType: 'book' | 'theme' | 'icon',
    targetId: string,
    tokenPrice: number | null
  ) => Promise<{ ok: boolean; error?: string }>;
  onAdjustUserTokens?: (
    userUid: string,
    mode: 'add' | 'set',
    amount: number,
    note?: string
  ) => Promise<{ ok: boolean; error?: string; newBalance?: number }>;
}

function createEmptyBook(defaultCategory = 'العلوم'): BookRecord {
  return {
    id: `book-${Date.now()}`,
    title: '',
    subtitle: '',
    author: '',
    authorUid: null,
    isAuthorVerified: false,
    category: defaultCategory,
    year: new Date().getFullYear(),
    pages: 80,
    readingMinutes: 12,
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    featured: false,
    isComingSoon: false,
    comingSoonMode: 'open',
    comingSoonReleaseAt: '',
    isPremium: false,
    priceLabel: '',
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
        id: 'ch-1',
        number: '01',
        title: 'الفصل الأول',
        epigraph: '',
        paragraphs: [''],
      },
    ],
  };
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  books,
  sections,
  sectionTranslations,
  unlockedIds,
  purchasedIds,
  customThemeCodes,
  isAuthenticated,
  currentUserUid,
  userEmail,
  onSignIn,
  onSaveCustomThemeCode,
  onUnlockByCode,
  onRequestThemeUnlock,
  onRequestIconUnlock,
  onGiftTheme,
  isDeveloperMode,
  onUnlockDeveloper,
  onLockDeveloper,
  devCodesVault,
  devUsersList,
  onRotateCode,
  onRotateAllCodes,
  onGrantPermanentAccess,
  onRevokePermanentAccess,
  onSetUserVerified,
  onToggleBookAuthorVerified,
  onAssignBookOwner,
  onSaveBook,
  onDeleteBook,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onAssignBookSection,
  onAddBookReview,
  onUpdateBookReview,
  onDeleteBookReview,
  onImportCatalog,
  onCheckUpdates,
  onResetServerCatalog,
  onClearProgress,
  syncReport,
  localRecoverable,
  onScanLocalRecoverable,
  onMigrateLocalBooks,
  onRestoreOrphanDocument,
  onBackToLibrary,
  sectionMode = 'settings',
  onOpenDeveloperSettings,
  devPendingSubmissions = [],
  onReviewSubmission,
  devPendingPriceRequests = [],
  onReviewPriceRequest,
  devPendingReviews = [],
  onModerateReview,
  onPreviewSubmission,
  onBroadcastFeatureAnnouncement,
  economyConfig,
  themeAccessMap,
  iconAccessMap,
  onUpdateEconomyConfig,
  onSetItemTokenPrice,
  onAdjustUserTokens,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<SWDiagnostics | null>(null);
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Theme & App Icon unlock inline prompts
  const [themeCodeInput, setThemeCodeInput] = useState('');
  const [themeCodeMsg, setThemeCodeMsg] = useState<string | null>(null);
  const [iconCodeInput, setIconCodeInput] = useState('');
  const [iconCodeMsg, setIconCodeMsg] = useState<string | null>(null);

  // Developer theme/book rotating code editor state
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingThemeCode, setEditingThemeCode] = useState('');
  const [editingThemeError, setEditingThemeError] = useState<string | null>(null);
  const [rotatingTargetId, setRotatingTargetId] = useState<string | null>(null);
  const [isRotatingAll, setIsRotatingAll] = useState(false);
  const [showAllRotatingCodes, setShowAllRotatingCodes] = useState(false);
  const [showAllPublishedBooks, setShowAllPublishedBooks] = useState(false);

  // Developer Grant Permanent Access by Email
  const [grantEmail, setGrantEmail] = useState('');
  const [grantTarget, setGrantTarget] = useState('');
  const [grantError, setGrantError] = useState<string | null>(null);
  const [isGranting, setIsGranting] = useState(false);

  // Local IndexedDB recovery state
  const [isMigratingLocal, setIsMigratingLocal] = useState(false);
  const [restoringBlobId, setRestoringBlobId] = useState<string | null>(null);
  const [recoveryScanMessage, setRecoveryScanMessage] = useState<string | null>(null);

  // Developer Book Comments & Star Ratings Manager (auto-calculates book average)
  const [selectedReviewBookId, setSelectedReviewBookId] = useState<string>('');
  const [newReviewerUid, setNewReviewerUid] = useState<string>('');
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewBadge, setNewReviewBadge] = useState<'none' | 'verified' | 'owner'>('none');
  const [newReviewIsOwner, setNewReviewIsOwner] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewerUid, setEditReviewerUid] = useState<string>('');
  const [editReviewerName, setEditReviewerName] = useState('');
  const [editReviewRating, setEditReviewRating] = useState<number>(5);
  const [editReviewComment, setEditReviewComment] = useState('');
  const [editReviewBadge, setEditReviewBadge] = useState<'none' | 'verified' | 'owner'>('none');
  const [editReviewIsOwner, setEditReviewIsOwner] = useState<boolean>(false);
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);

  // Developer Library Sections Manager state
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionEnName, setNewSectionEnName] = useState('');
  const [sectionFormError, setSectionFormError] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState<string | null>(null);
  const [sectionRenameDraft, setSectionRenameDraft] = useState('');
  const [sectionRenameEnDraft, setSectionRenameEnDraft] = useState('');
  const [sectionRenameError, setSectionRenameError] = useState<string | null>(null);

  // Developer Pending Book Submissions Review + Feature Broadcast state
  const [reviewNoteDrafts, setReviewNoteDrafts] = useState<Record<string, string>>({});
  const [reviewingBookId, setReviewingBookId] = useState<string | null>(null);
  const [priceReviewNoteDrafts, setPriceReviewNoteDrafts] = useState<Record<string, string>>({});
  const [reviewingPriceBookId, setReviewingPriceBookId] = useState<string | null>(null);
  const [reviewModNoteDrafts, setReviewModNoteDrafts] = useState<Record<string, string>>({});
  const [moderatingReviewId, setModeratingReviewId] = useState<string | null>(null);
  const [reviewModErrors, setReviewModErrors] = useState<Record<string, string>>({});
  const [announceTitleAr, setAnnounceTitleAr] = useState('');
  const [announceTitleEn, setAnnounceTitleEn] = useState('');
  const [announceMsgAr, setAnnounceMsgAr] = useState('');
  const [announceMsgEn, setAnnounceMsgEn] = useState('');
  const [announceTargetView, setAnnounceTargetView] = useState('you');
  const [announceTargetSection, setAnnounceTargetSection] = useState('publish-studio');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const lang = settings.language ?? 'ar';
  const isEn = lang === 'en';
  const copy = UI_COPY[lang];

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'تأكيد الحذف',
    onConfirm: () => {},
  });

  // Developer Book Form State
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);
  const [formBook, setFormBook] = useState<BookRecord>(createEmptyBook());
  const [formCodeError, setFormCodeError] = useState<string | null>(null);
  const [notifyFollowersOnSave, setNotifyFollowersOnSave] = useState(true);
  const [notifyFollowersOnAssign, setNotifyFollowersOnAssign] = useState(true);
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pendingPdfBuffer, setPendingPdfBuffer] = useState<{
    id: string;
    buffer: ArrayBuffer;
    fileName: string;
  } | null>(null);

  useEffect(() => {
    void getServiceWorkerDiagnostics().then(setDiagnostics);
  }, [syncReport, isDeveloperMode]);

  useEffect(() => {
    if (books.length === 0) {
      setSelectedReviewBookId('');
      return;
    }
    setSelectedReviewBookId((prev) =>
      prev && books.some((b) => b.id === prev) ? prev : books[0].id
    );
  }, [books]);

  const selectedReviewBook = books.find((b) => b.id === selectedReviewBookId) ?? books[0] ?? null;
  const linkedNewReviewer = newReviewerUid
    ? devUsersList.find((u) => u.uid === newReviewerUid) ?? null
    : null;
  const linkedEditReviewer = editReviewerUid
    ? devUsersList.find((u) => u.uid === editReviewerUid) ?? null
    : null;

  const handleAddBookReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewBook) return;
    const effectiveName = linkedNewReviewer ? linkedNewReviewer.displayName : newReviewerName.trim();
    if (!effectiveName || !newReviewComment.trim()) {
      setReviewFormError(
        isEn
          ? 'Please enter both the reviewer name and their comment.'
          : 'يرجى كتابة اسم الشخص والتعليق مع اختيار النجوم.'
      );
      return;
    }
    setReviewFormError(null);
    setIsSubmittingReview(true);
    try {
      const isOwnerFlag = linkedNewReviewer ? newReviewIsOwner : newReviewBadge === 'owner';
      const isVerifiedFlag = linkedNewReviewer
        ? Boolean(linkedNewReviewer.isVerified)
        : newReviewBadge === 'verified' || newReviewBadge === 'owner';
      const res = await onAddBookReview(
        selectedReviewBook.id,
        effectiveName,
        newReviewRating,
        newReviewComment.trim(),
        isOwnerFlag,
        isVerifiedFlag,
        linkedNewReviewer ? linkedNewReviewer.uid : null
      );
      if (!res.ok) {
        setReviewFormError(
          res.error ??
            (isEn ? 'Failed to add comment.' : 'تعذر إضافة التعليق؛ تأكد من اتصالك وحاول مجدداً.')
        );
        return;
      }
      setNewReviewerUid('');
      setNewReviewerName('');
      setNewReviewRating(5);
      setNewReviewComment('');
      setNewReviewBadge('none');
      setNewReviewIsOwner(false);
      showNotice(
        isEn
          ? `Added review to "${selectedReviewBook.title}" and updated its average rating.`
          : `تمت إضافة التعليق إلى «${selectedReviewBook.title}» وتحديث متوسط النجوم تلقائياً.`
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSaveEditedReview = async (reviewId: string) => {
    const effectiveName = linkedEditReviewer ? linkedEditReviewer.displayName : editReviewerName.trim();
    if (!effectiveName || !editReviewComment.trim()) return;
    setIsUpdatingReview(true);
    try {
      const isOwnerFlag = linkedEditReviewer ? editReviewIsOwner : editReviewBadge === 'owner';
      const isVerifiedFlag = linkedEditReviewer
        ? Boolean(linkedEditReviewer.isVerified)
        : editReviewBadge === 'verified' || editReviewBadge === 'owner';
      const res = await onUpdateBookReview(
        reviewId,
        effectiveName,
        editReviewRating,
        editReviewComment.trim(),
        isOwnerFlag,
        isVerifiedFlag,
        linkedEditReviewer ? linkedEditReviewer.uid : null
      );
      if (res.ok) {
        setEditingReviewId(null);
        setEditReviewerUid('');
        showNotice(
          isEn
            ? 'Updated comment and recalculated average rating.'
            : 'تم تعديل التعليق وإعادة حساب المتوسط التلقائي بنجاح.'
        );
      }
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleAddSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await onAddSection(newSectionName, newSectionEnName);
    if (!res.ok) {
      setSectionFormError(
        res.error === 'duplicate'
          ? isEn
            ? 'This section already exists.'
            : 'هذا القسم موجود بالفعل.'
          : isEn
            ? 'Please enter a section name.'
            : 'يرجى كتابة اسم القسم.'
      );
      return;
    }
    const created = newSectionName.trim();
    const displayCreated = getSectionDisplayName(created, lang, {
      ...sectionTranslations,
      ...(newSectionEnName.trim() ? { [created]: newSectionEnName.trim() } : {}),
    });
    setNewSectionName('');
    setNewSectionEnName('');
    setSectionFormError(null);
    showNotice(
      isEn ? `Added section "${displayCreated}".` : `تمت إضافة قسم «${displayCreated}» بنجاح.`
    );
  };

  const handleSaveSectionRename = async (oldName: string) => {
    const res = await onRenameSection(oldName, sectionRenameDraft, sectionRenameEnDraft);
    if (!res.ok) {
      setSectionRenameError(
        res.error === 'duplicate'
          ? isEn
            ? 'Another section already uses this name.'
            : 'يوجد قسم آخر بنفس هذا الاسم.'
          : isEn
            ? 'Section name cannot be empty.'
            : 'لا يمكن ترك اسم القسم فارغاً.'
      );
      return;
    }
    const nextName = sectionRenameDraft.trim();
    if (!editingBook && formBook.category === oldName) {
      setFormBook((prev) => ({ ...prev, category: nextName }));
    }
    setEditingSectionName(null);
    setSectionRenameError(null);
    const oldDisplay = getSectionDisplayName(oldName, lang, sectionTranslations);
    const nextDisplay = getSectionDisplayName(nextName, lang, {
      ...sectionTranslations,
      ...(sectionRenameEnDraft.trim() ? { [nextName]: sectionRenameEnDraft.trim() } : {}),
    });
    showNotice(
      isEn
        ? `Renamed section "${oldDisplay}" to "${nextDisplay}".`
        : `تم تعديل اسم القسم من «${oldDisplay}» إلى «${nextDisplay}».`
    );
  };

  const requestDeleteSection = (sec: string, countInSection: number) => {
    const fallback = sections.find((s) => s !== sec) ?? 'عام';
    const secDisplay = getSectionDisplayName(sec, lang, sectionTranslations);
    const fallbackDisplay = getSectionDisplayName(fallback, lang, sectionTranslations);
    setConfirmDialog({
      open: true,
      title: isEn ? 'Confirm Delete Section' : 'تأكيد حذف القسم',
      message:
        countInSection > 0
          ? isEn
            ? `Section "${secDisplay}" contains ${countInSection} book(s). Deleting it will move those books to "${fallbackDisplay}". Continue?`
            : `قسم «${secDisplay}» يحتوي على ${countInSection} كتاب. عند حذفه سيتم نقل تلك الكتب تلقائياً إلى قسم «${fallbackDisplay}». هل تريد المتابعة؟`
          : isEn
            ? `Are you sure you want to delete section "${secDisplay}"?`
            : `هل أنت متأكد من حذف قسم «${secDisplay}»؟`,
      confirmLabel: isEn ? 'Delete Section' : 'حذف القسم',
      onConfirm: async () => {
        const res = await onDeleteSection(sec, fallback);
        setConfirmDialog((c) => ({ ...c, open: false }));
        if (formBook.category === sec) {
          setFormBook((prev) => ({ ...prev, category: res.sections[0] ?? 'عام' }));
        }
        const reassignedDisplay = res.reassignedTo
          ? getSectionDisplayName(res.reassignedTo, lang, sectionTranslations)
          : null;
        showNotice(
          reassignedDisplay
            ? isEn
              ? `Deleted section "${secDisplay}" and moved books to "${reassignedDisplay}".`
              : `تم حذف قسم «${secDisplay}» ونقل كتبه إلى قسم «${reassignedDisplay}».`
            : isEn
              ? `Deleted section "${secDisplay}".`
              : `تم حذف قسم «${secDisplay}».`
        );
      },
    });
  };

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onUnlockDeveloper(passwordInput.trim());
    if (ok) {
      setPasswordError(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  const handleManualSync = async () => {
    setIsCheckingSync(true);
    try {
      await checkForServiceWorkerUpdate();
      await onCheckUpdates();
      const info = await getServiceWorkerDiagnostics();
      setDiagnostics(info);
      showNotice(
        isEn
          ? 'Updates checked and catalog synced from Cloud SQL.'
          : 'تم فحص التحديثات ومزامنة الفهرس من قاعدة البيانات بنجاح.'
      );
    } finally {
      setIsCheckingSync(false);
    }
  };

  const handleServerReset = async () => {
    setIsCheckingSync(true);
    try {
      await onResetServerCatalog();
      const info = await getServiceWorkerDiagnostics();
      setDiagnostics(info);
      showNotice(
        isEn
          ? 'Live database catalog refreshed successfully.'
          : 'تم تحديث الفهرس الحي من قاعدة البيانات بنجاح.'
      );
    } finally {
      setIsCheckingSync(false);
    }
  };

  const handleUnlockThemeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setThemeCodeMsg(
        isEn ? 'Sign in with Google first.' : 'سجّل الدخول بحساب Google أولاً.'
      );
      return;
    }
    const clean = themeCodeInput.replace(/\D/g, '');
    if (clean.length !== 10) {
      setThemeCodeMsg(
        isEn ? 'Enter a valid 10-digit code.' : 'أدخل كوداً صحيحاً مكوناً من 10 أرقام.'
      );
      return;
    }
    const res = await onUnlockByCode(clean);
    if (res.ok) {
      setThemeCodeInput('');
      setThemeCodeMsg(
        isEn ? `Unlocked "${res.label}" successfully.` : `تم فتح «${res.label}» بنجاح.`
      );
    } else {
      setThemeCodeMsg(isEn ? 'Incorrect or expired code.' : 'الكود غير صحيح أو انتهت صلاحيته.');
    }
  };

  const handleUnlockIconCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIconCodeMsg(
        isEn ? 'Sign in with Google first.' : 'سجّل الدخول بحساب Google أولاً.'
      );
      return;
    }
    const clean = iconCodeInput.replace(/\D/g, '');
    if (clean.length !== 10) {
      setIconCodeMsg(
        isEn ? 'Enter a valid 10-digit code.' : 'أدخل كوداً صحيحاً مكوناً من 10 أرقام.'
      );
      return;
    }
    const res = await onUnlockByCode(clean);
    if (res.ok) {
      setIconCodeInput('');
      setIconCodeMsg(
        isEn ? `Unlocked "${res.label}" successfully.` : `تم تفعيل «${res.label}» بنجاح.`
      );
    } else {
      setIconCodeMsg(isEn ? 'Incorrect or expired code.' : 'الكود غير صحيح أو انتهت صلاحيته.');
    }
  };

  useEffect(() => {
    if (editingBook || formBook.authorUid || formBook.author.trim() || devUsersList.length === 0) {
      return;
    }
    const defaultOwner =
      (currentUserUid ? devUsersList.find((u) => u.uid === currentUserUid) : undefined) ??
      devUsersList[0];
    if (defaultOwner) {
      setFormBook((prev) =>
        prev.authorUid || prev.author.trim()
          ? prev
          : {
              ...prev,
              authorUid: defaultOwner.uid,
              author: defaultOwner.displayName,
              isAuthorVerified: Boolean(defaultOwner.isVerified),
            }
      );
    }
  }, [editingBook, formBook.authorUid, formBook.author, devUsersList, currentUserUid]);

  const handleStartNewBook = () => {
    setEditingBook(null);
    setPendingPdfBuffer(null);
    setFormCodeError(null);
    setNotifyFollowersOnSave(true);
    setFormBook(createEmptyBook(sections[0] || 'العلوم'));
  };

  const handleEditExistingBook = (book: BookRecord) => {
    setEditingBook(book);
    setPendingPdfBuffer(null);
    setFormCodeError(null);
    setNotifyFollowersOnSave(false);
    const vaultEntry = devCodesVault.find(
      (c) => c.targetType === 'book' && c.targetId === book.id
    );
    setFormBook({
      ...JSON.parse(JSON.stringify(book)),
      authorUid: book.authorUid ?? null,
      isAuthorVerified: Boolean(book.isAuthorVerified),
      isComingSoon: Boolean(book.isComingSoon),
      comingSoonMode: book.comingSoonMode ?? 'open',
      comingSoonReleaseAt:
        book.comingSoonMode === 'datetime'
          ? toLocalDateTimeInputValue(book.comingSoonReleaseAt)
          : book.comingSoonReleaseAt ?? '',
      priceLabel: '',
      rotationHours: book.rotationHours ?? vaultEntry?.rotationHours ?? 24,
      unlockCode: vaultEntry?.rotatingCode ?? book.unlockCode ?? '',
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
  };

  const validateBookPremiumCode = (code: string, isPremium: boolean): string | null => {
    if (!isPremium) return null;
    const clean = code.replace(/\D/g, '');
    // When empty, server generates a unique 10-digit rotating code automatically
    if (clean.length === 0) return null;
    if (clean.length !== 10) {
      return isEn
        ? 'Premium book code must be exactly 10 digits (or leave empty to auto-generate).'
        : 'يجب أن يتكون كود الكتاب البريميوم من 10 أرقام بالضبط (أو اتركه فارغاً للتوليد التلقائي).';
    }
    const duplicateOwner = findDuplicateCodeOwner(
      clean,
      books,
      customThemeCodes,
      editingBook?.id
    );
    if (duplicateOwner) {
      return isEn
        ? `This code is already used by ${duplicateOwner}; choose a different code.`
        : `هذا الكود متشابه مع ${duplicateOwner}، اختر كوداً مختلفاً.`;
    }
    return null;
  };

  const handleBookCodeChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 10);
    setFormBook((prev) => ({ ...prev, unlockCode: clean }));
    if (clean.length === 10) {
      const duplicateOwner = findDuplicateCodeOwner(
        clean,
        books,
        customThemeCodes,
        editingBook?.id
      );
      setFormCodeError(
        duplicateOwner
          ? isEn
            ? `This code is already used by ${duplicateOwner}; choose a different code.`
            : `هذا الكود متشابه مع ${duplicateOwner}، اختر كوداً مختلفاً.`
          : null
      );
    } else {
      setFormCodeError(null);
    }
  };

  const handleGenerateUniqueBookCode = () => {
    const taken = new Set<string>();
    for (const b of books) {
      if (b.id !== editingBook?.id && b.isPremium && b.unlockCode) taken.add(b.unlockCode);
    }
    for (const t of PREMIUM_THEMES) {
      const c = customThemeCodes[t.id] ?? t.unlockCode;
      if (c) taken.add(c);
    }
    for (const ic of PREMIUM_APP_ICONS) {
      const c = customThemeCodes[ic.id] ?? ic.unlockCode;
      if (c) taken.add(c);
    }
    const generated = generateTenDigitCode(taken);
    setFormBook((prev) => ({ ...prev, unlockCode: generated }));
    setFormCodeError(null);
  };

  const handleSaveThemeCodeEdit = async (themeId: string) => {
    const clean = editingThemeCode.replace(/\D/g, '');
    if (clean.length !== 10) {
      setEditingThemeError(
        isEn ? 'Code must be exactly 10 digits.' : 'الكود يجب أن يكون 10 أرقام بالضبط.'
      );
      return;
    }
    const duplicateOwner = findDuplicateCodeOwner(clean, books, customThemeCodes, themeId);
    if (duplicateOwner) {
      setEditingThemeError(
        isEn ? `Code matches ${duplicateOwner}.` : `الكود متشابه مع ${duplicateOwner}.`
      );
      return;
    }
    await onSaveCustomThemeCode(themeId, clean);
    setEditingThemeId(null);
    setEditingThemeError(null);
    showNotice(
      isEn ? 'Premium theme code updated successfully.' : 'تم تحديث كود السمة البريميوم بنجاح.'
    );
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
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isWordFile = lowerName.endsWith('.docx') || lowerName.endsWith('.doc');

    setIsParsingPdf(true);
    try {
      const buffer = await file.arrayBuffer();
      if (isWordFile) {
        const baseTitle = file.name.replace(/\.(docx?|DOCX?)$/, '');
        const { loadWordPages } = await import('../utils/wordUtils');
        const { pageCount, coverDataUrl } = await loadWordPages(buffer, baseTitle);
        const docId = `word-${Date.now()}`;
        setPendingPdfBuffer({ id: docId, buffer, fileName: file.name });

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
        showNotice(
          isEn
            ? `Word document parsed into ${pageCount} book pages with cover prepared.`
            : `تم تحويل ملف Word إلى ${pageCount} صفحة كتاب وتجهيز الغلاف بنجاح.`
        );
      } else {
        const { inspectPdfBuffer } = await import('../utils/pdfUtils');
        const { pageCount, coverDataUrl } = await inspectPdfBuffer(buffer);
        const pdfId = `pdf-${Date.now()}`;
        setPendingPdfBuffer({ id: pdfId, buffer, fileName: file.name });

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
        showNotice(
          isEn
            ? `PDF parsed (${pageCount} pages) and first-page cover prepared.`
            : `تم تحليل ملف PDF بنجاح (${pageCount} صفحة) وتجهيز غلاف الصفحة الأولى.`
        );
      }
    } catch (err) {
      const customMsg = err instanceof Error ? err.message : '';
      showNotice(
        customMsg ||
          (isEn
            ? 'Could not read document; ensure it is a valid PDF or .docx Word file.'
            : 'تعذر قراءة الملف؛ تأكد أنه ملف PDF أو Word (.docx) صالح وغير محمي بكلمة سر.')
      );
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleChapterChange = (idx: number, patch: Partial<Chapter>) => {
    setFormBook((prev) => {
      const nextChapters = [...prev.chapters];
      nextChapters[idx] = { ...nextChapters[idx], ...patch };
      return { ...prev, chapters: nextChapters };
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

  const requestRemoveChapter = (idx: number, chapterTitle: string) => {
    if (formBook.chapters.length <= 1) return;
    setConfirmDialog({
      open: true,
      title: isEn ? 'Confirm Chapter Deletion' : 'تأكيد حذف الفصل',
      message: isEn
        ? `Are you sure you want to delete "${chapterTitle}"? This cannot be undone.`
        : `هل أنت متأكد من حذف «${chapterTitle}»؟ لا يمكن التراجع عن هذا الحذف.`,
      confirmLabel: isEn ? 'Delete Chapter' : 'حذف الفصل',
      onConfirm: () => {
        setFormBook((prev) => {
          const filtered = prev.chapters
            .filter((_, i) => i !== idx)
            .map((ch, i) => ({ ...ch, number: String(i + 1).padStart(2, '0') }));
          return { ...prev, chapters: filtered };
        });
        setConfirmDialog((c) => ({ ...c, open: false }));
      },
    });
  };

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBook.title.trim() || !formBook.author.trim()) return;
    const isComingSoon = Boolean(formBook.isComingSoon);
    const comingSoonMode = formBook.comingSoonMode ?? 'open';
    const comingSoonReleaseAt = formBook.comingSoonReleaseAt?.trim() ?? '';
    const isDocType = formBook.bookType === 'pdf' || formBook.bookType === 'word';
    const hasContent = hasBookContent(formBook, Boolean(pendingPdfBuffer));

    if (
      isComingSoon &&
      (comingSoonMode === 'date' || comingSoonMode === 'datetime') &&
      !comingSoonReleaseAt
    ) {
      showNotice(
        isEn
          ? 'Please pick the scheduled release date/time or choose "Open (no fixed date)".'
          : 'يرجى تحديد تاريخ أو ميعاد النشر المتوقع، أو اختيار «مفتوح بدون ميعاد محدد».'
      );
      return;
    }

    if (
      isComingSoon &&
      (comingSoonMode === 'date' || comingSoonMode === 'datetime') &&
      !hasContent
    ) {
      showNotice(
        isDocType
          ? isEn
            ? 'When setting a scheduled date or time for auto-release, uploading the PDF/Word file is required (or switch to "Open" to post without a PDF for now).'
            : 'عند تحديد ميعاد بالساعات أو الأيام لنزول الكتاب، يجب رفع ملف PDF أو Word أولاً لينزل تلقائياً في موعده (أو اختر «مفتوح» لنشره بدون ملف مؤقتاً).'
          : isEn
            ? 'When setting a scheduled date or time for auto-release, writing at least one chapter is required (or switch to "Open" mode).'
            : 'عند تحديد ميعاد بالساعات أو الأيام لنزول الكتاب، يجب كتابة محتوى فصل واحد على الأقل أولاً (أو اختر «مفتوح» بدون ميعاد).'
      );
      return;
    }

    if (!isComingSoon && !hasContent) {
      showNotice(
        isDocType
          ? isEn
            ? 'Please upload a PDF or Word (.docx) file first before publishing.'
            : 'يرجى رفع ملف PDF أو Word (.docx) أولاً قبل نشر الكتاب.'
          : isEn
            ? 'Please write text in at least one chapter first before publishing.'
            : 'يرجى كتابة نص في فصل واحد على الأقل قبل نشر الكتاب.'
      );
      return;
    }

    const codeError = validateBookPremiumCode(
      formBook.unlockCode ?? '',
      Boolean(formBook.isPremium)
    );
    if (codeError) {
      setFormCodeError(codeError);
      return;
    }

    setIsSavingBook(true);
    try {
      let documentPayload: DocumentUploadPayload | undefined;
      if (pendingPdfBuffer) {
        await savePdfBlob(
          pendingPdfBuffer.id,
          pendingPdfBuffer.buffer,
          pendingPdfBuffer.fileName
        );
        documentPayload = {
          id: pendingPdfBuffer.id,
          fileName: pendingPdfBuffer.fileName,
          mimeType:
            formBook.bookType === 'word'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/pdf',
          dataBase64: arrayBufferToBase64(pendingPdfBuffer.buffer),
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

      const nextCode = formBook.isPremium
        ? (formBook.unlockCode ?? '').replace(/\D/g, '')
        : undefined;

      const isLaunchingNow = Boolean(editingBook?.isComingSoon) && !isComingSoon;
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
        id: editingBook?.id ?? (formBook.id || `book-${Date.now()}`),
        version: editingBook ? editingBook.version + 1 : 1,
        updatedAt: new Date().toISOString().slice(0, 10),
        addedAt: isComingSoon
          ? editingBook?.addedAt
          : editingBook && !editingBook.isComingSoon
            ? editingBook.addedAt
            : new Date().toISOString(),
        isComingSoon,
        comingSoonMode: isComingSoon ? comingSoonMode : undefined,
        comingSoonReleaseAt: submittedReleaseAt,
        pages: hasContent ? formBook.pages : 0,
        readingMinutes: hasContent ? formBook.readingMinutes : 0,
        priceLabel: '',
        discountPercent: submittedDiscountPct,
        discountEndsAt: submittedDiscountEndsAt,
        discountPostReleaseDays: submittedPostReleaseDays,
        rotationHours: formBook.rotationHours ?? 24,
        unlockCode: nextCode,
        chapters: cleanedChapters,
      };

      await onSaveBook(
        nextBook,
        documentPayload,
        !isComingSoon && Boolean(nextBook.authorUid && notifyFollowersOnSave)
      );
      setEditingBook(null);
      setPendingPdfBuffer(null);
      setFormCodeError(null);
      setNotifyFollowersOnSave(true);
      setFormBook(createEmptyBook(sections[0] || 'العلوم'));
      showNotice(
        isLaunchingNow
          ? isEn
            ? `Published "${nextBook.title}"! Notifications sent to everyone waiting for launch.`
            : `تم نشر «${nextBook.title}» رسمياً وإرسال إشعار لكل من طلب التذكير!`
          : isComingSoon
            ? isEn
              ? `Saved "${nextBook.title}" as Coming Soon.`
              : `تم حفظ «${nextBook.title}» ككتاب قريباً (Coming Soon).`
            : editingBook
              ? isEn
                ? `Updated "${nextBook.title}" to version ${nextBook.version} for all users.`
                : `تم تحديث «${nextBook.title}» إلى الإصدار ${nextBook.version} وسيظهر للجميع فوراً.`
              : isEn
                ? `Added "${nextBook.title}" to the live library database.`
                : `تمت إضافة «${nextBook.title}» إلى قاعدة البيانات وسيظهر للجميع تلقائياً.`
      );
    } catch (err) {
      showNotice(
        err instanceof Error && err.message
          ? err.message
          : isEn
            ? 'Could not save book. Please check the fields and try again.'
            : 'تعذر حفظ الكتاب، يرجى مراجعة البيانات والمحاولة مرة أخرى.'
      );
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleExportCatalog = () => {
    const payload: CatalogPayload = {
      catalogVersion: (syncReport?.catalogVersion ?? 2026112002) + 1,
      updatedAt: new Date().toISOString(),
      libraryName: 'مكتبتي maktabty',
      sections,
      sectionTranslations,
      books,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotice(
      isEn ? 'Downloaded publish-ready catalog.json.' : 'تم تنزيل ملف catalog.json الجاهز للنشر.'
    );
  };

  const handleImportCatalogFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as CatalogPayload;
        if (Array.isArray(parsed.books)) {
          await onImportCatalog(parsed);
          showNotice(
            isEn
              ? `Successfully imported ${parsed.books.length} books.`
              : `تم استيراد ${parsed.books.length} كتاب بنجاح.`
          );
        }
      } catch {
        showNotice(
          isEn
            ? 'Failed to read file; check JSON formatting.'
            : 'تعذر قراءة الملف؛ تأكد من صحة تنسيق JSON.'
        );
      }
    };
    reader.readAsText(file);
  };

  const premiumBooksList = books.filter((b) => b.isPremium);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-6">
        <div>
          <p className="text-xs font-medium text-[var(--accent-primary)]">
            {sectionMode === 'developer' ? copy.devSettingsSubtitle : copy.settingsSubtitle}
          </p>
          <h1 className="mt-1 font-editorial text-3xl font-bold text-[var(--text-ink)] sm:text-4xl">
            {sectionMode === 'developer' ? copy.navDeveloperSettings : copy.settingsTitle}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {sectionMode === 'developer' ? copy.devSettingsLead : copy.settingsLead}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {sectionMode === 'settings' && isDeveloperMode && onOpenDeveloperSettings && (
            <button
              type="button"
              onClick={onOpenDeveloperSettings}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--accent-primary)]/45 bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
            >
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.navDeveloperSettings}
            </button>
          )}

          {isDeveloperMode && (
            <button
              type="button"
              onClick={() => {
                onLockDeveloper();
                showNotice(
                  isEn
                    ? 'Exited Developer Mode and returned to Reader Mode.'
                    : 'تم الخروج من وضع المطور والعودة إلى وضع القارئ.'
                );
              }}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.exitDeveloper}
            </button>
          )}

          <button
            type="button"
            onClick={onBackToLibrary}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] transition-colors hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0"
          >
            <ArrowRight className={`h-3.5 w-3.5 ${isEn ? 'rotate-180' : ''}`} aria-hidden="true" />
            {copy.backToLibrary}
          </button>
        </div>
      </div>

      {statusNotice && (
        <div
          role="status"
          className="mt-6 rounded-md border border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] px-4 py-3 text-xs font-medium text-[var(--text-ink)]"
        >
          {statusNotice}
        </div>
      )}

      {sectionMode === 'settings' && (
        <>
      {/* 0. Language Switcher (Arabic / English) */}
      <div className="mt-8 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Languages className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
            <div>
              <h2 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                {copy.languageSectionTitle}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{copy.languageSectionHint}</p>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1"
            role="group"
            aria-label={copy.languageSectionTitle}
          >
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ ...settings, language: 'ar' });
                showNotice('تم تغيير اللغة إلى العربية.');
              }}
              aria-pressed={lang === 'ar'}
              className={`rounded px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                lang === 'ar'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
              }`}
            >
              {copy.langArabic}
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ ...settings, language: 'en' });
                showNotice('Language switched to English.');
              }}
              aria-pressed={lang === 'en'}
              className={`rounded px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                lang === 'en'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
              }`}
            >
              {copy.langEnglish}
            </button>
          </div>
        </div>
      </div>

      {/* 1. Themes Section (Standard + Premium Wallpapers with Gold Hover on Premium) */}
      <div className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
            {isEn ? 'Themes & Backdrops' : 'السمات والخلفيات (Themes)'}
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {isEn
              ? `${THEME_CATALOG.length} themes (${THEME_CATALOG.length - PREMIUM_THEMES.length} standard + ${PREMIUM_THEMES.length} premium)`
              : `${THEME_CATALOG.length} سمات متاحة (${THEME_CATALOG.length - PREMIUM_THEMES.length} قياسية + ${PREMIUM_THEMES.length} بريميوم)`}
          </span>
        </div>

        <form
          onSubmit={handleUnlockThemeCode}
          className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-ink)]">
            <KeyRound className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            {isEn ? 'Unlock Premium Theme (10-digit code):' : 'تفعيل سمة بريميوم بكود 10 أرقام:'}
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={themeCodeInput}
            onChange={(e) => {
              setThemeCodeInput(e.target.value.replace(/\D/g, '').slice(0, 10));
              if (themeCodeMsg) setThemeCodeMsg(null);
            }}
            placeholder={isEn ? '10 digits...' : 'أدخل 10 أرقام...'}
            dir="ltr"
            className="w-44 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-center font-mono-tabular text-xs tracking-widest text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-400"
          >
            {isEn ? 'Unlock Theme' : 'فتح السمة'}
          </button>
          {themeCodeMsg && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {themeCodeMsg}
            </span>
          )}
        </form>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_CATALOG.map((t) => {
            const isActive = settings.themeId === t.id;
            const isLocked = t.isPremium && !unlockedIds.includes(t.id);
            const isGoldenKing = t.id === 'golden-king';
            const tName = getThemeDisplayName(t, lang);
            const tDesc = getThemeDisplayDescription(t, lang);

            return (
              <div
                key={t.id}
                className={`group relative flex flex-col justify-between rounded-lg border p-4 transition-all duration-200 ${
                  isGoldenKing
                    ? isActive
                      ? 'border-[#D4AF37] bg-[#050505] text-[#FAF5E8] shadow-[0_0_0_1px_rgba(212,175,55,0.65)]'
                      : 'border-[#2B2311] bg-[#050505] text-[#FAF5E8] hover:border-[#D4AF37] hover:shadow-[0_0_0_1px_rgba(212,175,55,0.55)]'
                    : t.isPremium
                      ? isActive
                        ? 'border-amber-500 bg-amber-500/[0.08] shadow-[0_0_0_1px_rgba(245,158,11,0.45)]'
                        : 'border-amber-500/30 bg-[var(--bg-surface)] hover:border-amber-500 hover:bg-amber-500/[0.1] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.5)]'
                      : isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-surface)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--accent-primary)]/60 hover:bg-[var(--bg-surface)]'
                }`}
              >
                {isLocked && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/25 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-xl ${
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
                    isLocked
                      ? onRequestThemeUnlock(t.id, tName)
                      : onUpdateSettings({ ...settings, themeId: t.id })
                  }
                  aria-pressed={isActive}
                  className={`flex w-full cursor-pointer items-start justify-between gap-3 ${
                    isEn ? 'text-left' : 'text-right'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {isGoldenKing && (
                        <span
                          aria-hidden="true"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#D4AF37]/60 bg-[#050505] text-[#D4AF37] transition-colors group-hover:border-[#D4AF37]"
                        >
                          <Crown className="h-4 w-4" />
                        </span>
                      )}
                      <p
                        className={`font-editorial text-lg font-bold transition-colors ${
                          isGoldenKing
                            ? 'text-[#FAF5E8] group-hover:text-[#D4AF37]'
                            : t.isPremium
                              ? 'text-[var(--text-ink)] group-hover:text-amber-500'
                              : 'text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]'
                        }`}
                      >
                        {tName}
                      </p>
                      {t.isPremium && (
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
                      )}
                    </div>
                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        isGoldenKing ? 'text-[#B8A878]' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {tDesc}
                    </p>
                  </div>
                  {isLocked ? (
                    <Lock
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isGoldenKing
                          ? 'text-[#B8A878] group-hover:text-[#D4AF37]'
                          : 'text-[var(--text-muted)] group-hover:text-amber-500'
                      }`}
                      aria-label={isEn ? 'Locked' : 'مقفلة'}
                    />
                  ) : isActive ? (
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        isGoldenKing
                          ? 'bg-[#D4AF37] text-[#050505]'
                          : t.isPremium
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  ) : null}
                </button>

                <div
                  className={`mt-4 flex w-full items-center justify-between gap-2 border-t pt-3 ${
                    isGoldenKing ? 'border-[#231D10]' : 'border-[var(--border-hairline)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      isLocked
                        ? onRequestThemeUnlock(t.id, tName)
                        : onUpdateSettings({ ...settings, themeId: t.id })
                    }
                    className="flex items-center gap-2 cursor-pointer"
                    aria-label={tName}
                  >
                    <span
                      className={`h-6 w-12 rounded border ${
                        isGoldenKing ? 'border-[#D4AF37]/40' : 'border-black/15'
                      }`}
                      style={{ background: t.previewBackground }}
                      title={isEn ? 'Background' : 'الخلفية'}
                    />
                    <span
                      className={`h-6 w-6 rounded border ${
                        isGoldenKing ? 'border-[#D4AF37]/30' : 'border-black/10'
                      }`}
                      style={{ backgroundColor: t.surface }}
                      title={isEn ? 'Surface' : 'السطح'}
                    />
                    <span
                      className="h-6 w-6 rounded border border-black/10"
                      style={{ backgroundColor: t.ink }}
                      title={isEn ? 'Text' : 'النص'}
                    />
                    <span
                      className="h-6 w-6 rounded border border-black/10"
                      style={{ backgroundColor: t.accent }}
                      title={isEn ? 'Accent' : 'التمييز'}
                    />
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    {isLocked && (
                      <>
                        <TokenPriceBadge
                          amount={
                            themeAccessMap?.[t.id]?.effectiveTokenPrice ??
                            themeAccessMap?.[t.id]?.tokenPrice ??
                            t.tokenPriceOverride ??
                            economyConfig?.defaultPremiumThemePrice ??
                            60
                          }
                          lang={lang}
                          size="xs"
                        />
                        <button
                          type="button"
                          onClick={() => onRequestThemeUnlock(t.id, tName)}
                          className={`text-[11px] font-medium ${
                            isGoldenKing
                              ? 'text-[#D4AF37]'
                              : 'text-amber-600 dark:text-amber-400 group-hover:text-amber-500'
                          }`}
                        >
                          {isEn ? 'Code / Buy' : 'بالكود أو الشراء'}
                        </button>
                      </>
                    )}
                    {t.isPremium && onGiftTheme && (
                      <button
                        type="button"
                        onClick={() => onGiftTheme(t.id)}
                        title={isEn ? 'Gift to a friend' : 'إهداء لصديق'}
                        aria-label={isEn ? `Gift ${tName}` : `إهداء ${tName}`}
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

      {/* 2. Reading & Local Storage Preferences */}
      <div className="mt-14 border-t border-[var(--border-hairline)] pt-10">
        <h2 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
          {isEn ? 'Reader & Local Storage Preferences' : 'تفضيلات القارئ والتخزين المحلي'}
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reader-font-size"
                className="text-sm font-medium text-[var(--text-ink)]"
              >
                {isEn ? 'Default Reading Font Size' : 'حجم خط القراءة الافتراضي'}
              </label>
              <span className="font-mono-tabular text-xs font-medium text-[var(--accent-primary)]">
                {settings.readerFontSize}px
              </span>
            </div>
            <input
              id="reader-font-size"
              type="range"
              min={16}
              max={26}
              step={1}
              value={settings.readerFontSize}
              onChange={(e) =>
                onUpdateSettings({ ...settings, readerFontSize: Number(e.target.value) })
              }
              className="mt-4 w-full accent-[var(--accent-primary)]"
            />
            <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
              <span>{isEn ? 'Small (16)' : 'صغير (16)'}</span>
              <span>{isEn ? 'Medium (20)' : 'متوسط (20)'}</span>
              <span>{isEn ? 'Large (26)' : 'كبير (26)'}</span>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <p className="text-sm font-medium text-[var(--text-ink)]">
              {isEn ? 'Line Spacing' : 'تباعد الأسطر'}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'relaxed', label: isEn ? 'Relaxed (1.75)' : 'مريح (1.75)' },
                  { id: 'loose', label: isEn ? 'Loose (1.95)' : 'واسع (1.95)' },
                  { id: 'airy', label: isEn ? 'Airy (2.15)' : 'رحب (2.15)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, readerLineHeight: opt.id })}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    settings.readerLineHeight === opt.id
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <p className="text-sm font-medium text-[var(--text-ink)]">
              {isEn ? 'Reading Column Width' : 'عرض عمود القراءة'}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'narrow', label: isEn ? 'Narrow' : 'ضيق' },
                  { id: 'medium', label: isEn ? 'Balanced' : 'متوازن' },
                  { id: 'wide', label: isEn ? 'Wide' : 'عريض' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, readerWidth: opt.id })}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    settings.readerWidth === opt.id
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <p className="text-sm font-medium text-[var(--text-ink)]">
              {isEn ? 'Body Font Family' : 'نوع خط المتن'}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, readerFontFamily: 'sans' })}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  settings.readerFontFamily === 'sans'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]'
                }`}
              >
                {isEn ? 'Modern Sans (IBM Plex)' : 'عربي حديث (IBM Plex)'}
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, readerFontFamily: 'editorial' })}
                className={`rounded-md border px-3 py-2 font-editorial text-sm font-bold transition-colors ${
                  settings.readerFontFamily === 'editorial'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]'
                }`}
              >
                {isEn ? 'Classic Serif (Amiri)' : 'نسخي كلاسيكي (أميري)'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-ink)]">
                {isEn ? 'Auto-Save Reading Progress' : 'الحفظ التلقائي لتقدم القراءة'}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {isEn
                  ? 'Remember current chapter and position offline in IndexedDB'
                  : 'تذكر الفصل ومكان التوقف تلقائياً في IndexedDB'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSaveProgress}
              onChange={(e) =>
                onUpdateSettings({ ...settings, autoSaveProgress: e.target.checked })
              }
              className="h-4 w-4 accent-[var(--accent-primary)]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-ink)]">
                {isEn ? 'Show Reader Top Progress Bar' : 'عرض شريط التقدم أعلى القارئ'}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {isEn
                  ? 'A subtle hairline indicating reading progress inside the book'
                  : 'خط رفيع يوضح نسبة التقدم داخل الكتاب أثناء القراءة'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showProgressHairline}
              onChange={(e) =>
                onUpdateSettings({ ...settings, showProgressHairline: e.target.checked })
              }
              className="h-4 w-4 accent-[var(--accent-primary)]"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleManualSync()}
            disabled={isCheckingSync}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-4 py-2 text-xs font-medium text-[var(--btn-dark-fg)] transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isCheckingSync ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {isEn ? 'Check & Update Books Now' : 'فحص وتحديث الكتب الآن'}
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirmDialog({
                open: true,
                title: isEn ? 'Confirm Clear Reading History' : 'تأكيد مسح سجل القراءة',
                message: isEn
                  ? 'Reading progress and bookmarks stored on this device will be deleted. Continue?'
                  : 'سيتم حذف سجل تقدم القراءة والعلامات المرجعية المحفوظة على هذا الجهاز فقط. هل تريد المتابعة؟',
                confirmLabel: isEn ? 'Clear History' : 'مسح السجل',
                onConfirm: async () => {
                  await onClearProgress();
                  setConfirmDialog((c) => ({ ...c, open: false }));
                  showNotice(
                    isEn
                      ? 'Reading progress and bookmarks cleared from your device.'
                      : 'تم مسح تقدم القراءة والعلامات المرجعية من جهازك.'
                  );
                },
              })
            }
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] transition-colors hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {isEn ? 'Clear Local Reading History' : 'مسح سجل القراءة المحلي'}
          </button>
        </div>
      </div>

      {/* 2.5 External App Icon Customizer & Live Preview (Android, PC & Browser) */}
      {(() => {
        const activeAppIconId: AppIconId =
          (settings.appIconId as AppIconId | undefined) ?? DEFAULT_APP_ICON_ID;
        const activeAppIcon = getAppIconById(activeAppIconId);
        const freeIconsCount = APP_ICON_CATALOG.length - PREMIUM_APP_ICONS.length;

        return (
          <div className="mt-12 border-t border-[var(--border-hairline)] pt-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--accent-primary)]">
                  {isEn ? 'External App Appearance' : 'مظهر التطبيق من بره'}
                </p>
                <h2 className="mt-1 font-editorial text-2xl font-bold text-[var(--text-ink)]">
                  {isEn
                    ? 'Customize External App Icon (Android, PC & Browser)'
                    : 'اختيار وتغيير شكل التطبيق من بره (أندرويد، كمبيوتر، والمتصفح)'}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {isEn
                    ? 'All shapes match the classic browser tab icon—pick from free colorways or unlock luxury VIP gradients with a code or Golden Tokens.'
                    : 'جميع الأيقونات تحافظ على نفس شعار تبويب المتصفح الأصلي مع اختلاف الألوان، وتشمل ألواناً مجانية وأيقونات بريميوم (VIP) فاخرة بالكود أو بالعملات الذهبية.'}
                </p>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {isEn
                  ? `${APP_ICON_CATALOG.length} icons (${freeIconsCount} free + ${PREMIUM_APP_ICONS.length} VIP)`
                  : `${APP_ICON_CATALOG.length} أشكال (${freeIconsCount} مجاني + ${PREMIUM_APP_ICONS.length} VIP)`}
              </span>
            </div>

            {/* Live Previews reflecting selected icon */}
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* Android Home Screen Preview */}
              <div className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--text-ink)]">
                  <span className="inline-flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
                    <span>{isEn ? 'Android Home Screen' : 'شاشة هاتف أندرويد'}</span>
                  </span>
                  <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {isEn ? activeAppIcon.nameEn : activeAppIcon.name}
                  </span>
                </div>

                <div className="my-5 flex items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 p-6 shadow-inner">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-20 w-20 overflow-hidden rounded-[22px] border border-white/15 shadow-lg">
                      <AppIconGraphic iconId={activeAppIconId} maskable />
                    </div>
                    <span className="text-xs font-semibold text-white drop-shadow">مكتبتي</span>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {isEn
                    ? 'Adaptive Android launcher icon preview.'
                    : 'معاينة حية لشكل الأيقونة المختارة على شاشة الأندرويد.'}
                </p>
              </div>

              {/* PC / Windows Desktop Preview */}
              <div className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--text-ink)]">
                  <span className="inline-flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
                    <span>{isEn ? 'PC / Desktop App' : 'الكمبيوتر / سطح المكتب (PC)'}</span>
                  </span>
                  {activeAppIcon.isPremium && (
                    <span className="rounded border border-amber-300/80 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 px-1.5 py-0.5 font-mono-tabular text-[9px] font-extrabold text-stone-950">
                      VIP
                    </span>
                  )}
                </div>

                <div className="my-5 flex items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 p-6 shadow-inner">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/15 shadow-xl">
                      <AppIconGraphic iconId={activeAppIconId} />
                    </div>
                    <span className="rounded bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white">
                      مكتبتي maktabty
                    </span>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {isEn
                    ? 'Desktop shortcut & taskbar icon when installed from Chrome or Edge.'
                    : 'معاينة حية لأيقونة سطح مكتب الكمبيوتر وشريط المهام.'}
                </p>
              </div>

              {/* Browser Favicon & App Icon Preview */}
              <div className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-ink)]">
                  <Eye className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
                  <span>{isEn ? 'Browser Tab Icon (Live)' : 'أيقونة تبويب المتصفح الحالية'}</span>
                </div>

                <div className="my-5 flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-5">
                  <div className="flex w-full max-w-[215px] items-center gap-2 rounded-t-md border border-[var(--border-hairline)] bg-[var(--bg-surface-alt)] px-3 py-2 shadow-sm">
                    <div className="h-5 w-5 shrink-0 overflow-hidden rounded">
                      <AppIconGraphic iconId={activeAppIconId} />
                    </div>
                    <span className="truncate text-[11px] font-semibold text-[var(--text-ink)]">
                      مكتبتي maktabty
                    </span>
                  </div>
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-amber-500/35 shadow-md">
                    <AppIconGraphic iconId={activeAppIconId} />
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {isEn ? activeAppIcon.descriptionEn : activeAppIcon.description}
                </p>
              </div>
            </div>

            {/* Optional 10-digit code unlock bar for VIP icons */}
            <form
              onSubmit={handleUnlockIconCode}
              className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-ink)]">
                <KeyRound className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                {isEn ? 'Activate VIP App Icon (10-digit code):' : 'تفعيل أيقونة بريميوم بكود 10 أرقام:'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={iconCodeInput}
                onChange={(e) => {
                  setIconCodeInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (iconCodeMsg) setIconCodeMsg(null);
                }}
                placeholder={isEn ? '10 digits...' : 'أدخل 10 أرقام...'}
                dir="ltr"
                className="w-44 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-center font-mono-tabular text-xs tracking-widest text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-400"
              >
                {isEn ? 'Unlock Icon' : 'تفعيل الأيقونة'}
              </button>
              {iconCodeMsg && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {iconCodeMsg}
                </span>
              )}
            </form>

            {/* Full 16-Colorway Icon Picker Grid */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {APP_ICON_CATALOG.map((icon) => {
                const access = iconAccessMap?.[icon.id];
                const isUnlocked =
                  !icon.isPremium ||
                  purchasedIds.includes(icon.id) ||
                  unlockedIds.includes(icon.id) ||
                  Boolean(access?.isUnlocked);
                const isLocked = icon.isPremium && !isUnlocked;
                const isActive = activeAppIconId === icon.id;
                const iconName = isEn ? icon.nameEn : icon.name;
                const iconDesc = isEn ? icon.descriptionEn : icon.description;
                const effectivePrice =
                  access?.effectiveTokenPrice ??
                  access?.tokenPrice ??
                  icon.tokenPriceOverride ??
                  economyConfig?.defaultPremiumIconPrice ??
                  50;

                return (
                  <div
                    key={icon.id}
                    className={`group relative flex flex-col justify-between rounded-lg border p-3.5 transition-all duration-200 ${
                      icon.isPremium
                        ? isActive
                          ? 'border-amber-500 bg-amber-500/[0.08] shadow-[0_0_0_1px_rgba(245,158,11,0.5)]'
                          : 'border-amber-500/35 bg-[var(--bg-surface)] hover:border-amber-500 hover:bg-amber-500/[0.08] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.45)]'
                        : isActive
                          ? 'border-[var(--accent-primary)] bg-[var(--bg-surface)] shadow-[0_0_0_1px_var(--accent-primary)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--accent-primary)]/60 hover:bg-[var(--bg-surface)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          onRequestIconUnlock?.(icon.id, iconName);
                        } else {
                          onUpdateSettings({ ...settings, appIconId: icon.id });
                          showNotice(
                            isEn
                              ? `Applied "${iconName}" app icon.`
                              : `تم تغيير أيقونة التطبيق إلى «${iconName}».`
                          );
                        }
                      }}
                      aria-pressed={isActive}
                      className={`flex w-full cursor-pointer flex-col gap-3 ${
                        isEn ? 'text-left' : 'text-right'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-md transition-transform duration-200 group-hover:scale-105">
                          <AppIconGraphic iconId={icon.id} />
                          {isLocked && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-amber-300">
                              <Lock className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {icon.isPremium && (
                            <span
                              aria-label="VIP"
                              className="inline-flex items-center justify-center rounded border border-amber-200/80 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 px-1.5 py-0.5 font-mono-tabular text-[9px] font-extrabold tracking-widest text-stone-950 shadow-sm"
                            >
                              VIP
                            </span>
                          )}
                          {isActive ? (
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                                icon.isPremium
                                  ? 'bg-amber-500 text-stone-950'
                                  : 'bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                              }`}
                            >
                              <Check className="h-3 w-3" aria-hidden="true" />
                            </span>
                          ) : isLocked ? (
                            <TokenPriceBadge amount={effectivePrice} lang={lang} size="xs" />
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <p
                          className={`font-editorial text-base font-bold leading-snug ${
                            icon.isPremium
                              ? 'text-[var(--text-ink)] group-hover:text-amber-500'
                              : 'text-[var(--text-ink)] group-hover:text-[var(--accent-primary)]'
                          }`}
                        >
                          {iconName}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)] line-clamp-2">
                          {iconDesc}
                        </p>
                      </div>
                    </button>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isLocked) {
                            onRequestIconUnlock?.(icon.id, iconName);
                          } else {
                            onUpdateSettings({ ...settings, appIconId: icon.id });
                            showNotice(
                              isEn
                                ? `Applied "${iconName}" app icon.`
                                : `تم تغيير أيقونة التطبيق إلى «${iconName}».`
                            );
                          }
                        }}
                        className={`text-[11px] font-semibold ${
                          icon.isPremium
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[var(--accent-primary)]'
                        }`}
                      >
                        {isLocked
                          ? isEn
                            ? 'Unlock (Code / Buy) →'
                            : 'شراء أو تفعيل بالكود ←'
                          : isActive
                            ? isEn
                              ? 'Active ✓'
                              : 'مختارة حالياً ✓'
                            : isEn
                              ? 'Apply Icon →'
                              : 'اختيار الشكل ←'}
                      </button>
                      {!icon.isPremium && (
                        <span className="text-[10px] font-medium text-[var(--text-muted)]">
                          {isEn ? 'Free' : 'مجاني'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 3. Developer Access Gate (shown at bottom of Settings) */}
      <div className="mt-14 border-t border-[var(--border-hairline)] pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--accent-primary)]">
              {isEn ? 'Permissions & Management' : 'الصلاحيات والإدارة'}
            </p>
            <h2 className="mt-1 font-editorial text-2xl font-bold text-[var(--text-ink)]">
              {copy.navDeveloperSettings}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {isDeveloperMode
                ? isEn
                  ? 'Developer Mode is unlocked. Use the Developer Settings section next to Settings to manage books, codes, and ratings.'
                  : 'تم فتح وضع المطور. يمكنك الانتقال إلى قسم «إعدادات المطور» بجانب الإعدادات لإدارة الكتب والأكواد والتقييمات.'
                : isEn
                  ? 'Enter the developer password to reveal and open the Developer Settings section.'
                  : 'أدخل كلمة مرور المطور لإظهار وفتح قسم «إعدادات المطور» بجانب الإعدادات.'}
            </p>
          </div>
        </div>

        {!isDeveloperMode ? (
          <form
            onSubmit={handlePasswordSubmit}
            className="mt-6 max-w-md rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
          >
            <label
              htmlFor="dev-password"
              className="block text-sm font-medium text-[var(--text-ink)]"
            >
              {isEn ? 'Developer Password' : 'كلمة مرور المطور'}
            </label>
            <div className="mt-3 flex items-center gap-3">
              <input
                id="dev-password"
                type="password"
                inputMode="numeric"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError(false);
                }}
                placeholder={isEn ? 'Enter password...' : 'أدخل كلمة المرور...'}
                className="flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono-tabular text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
              >
                <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                {isEn ? 'Unlock Developer Settings' : 'فتح إعدادات المطور'}
              </button>
            </div>
            {passwordError && (
              <p className="mt-2 text-xs font-medium text-[var(--accent-primary)]">
                {isEn
                  ? 'Incorrect password. Please check and try again.'
                  : 'كلمة المرور غير صحيحة. تأكد وأعد المحاولة.'}
              </p>
            )}
          </form>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] p-5">
            {onOpenDeveloperSettings && (
              <button
                type="button"
                onClick={onOpenDeveloperSettings}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
              >
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                {isEn ? 'Open Developer Settings' : 'الانتقال إلى إعدادات المطور'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onLockDeveloper();
                showNotice(
                  isEn
                    ? 'Exited Developer Mode and hid Developer Settings.'
                    : 'تم الخروج من وضع المطور وإخفاء إعدادات المطور.'
                );
              }}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.exitDeveloper}
            </button>
          </div>
        )}
      </div>
        </>
      )}

      {sectionMode === 'developer' && isDeveloperMode && (
          <div className="mt-8 space-y-10">
            {!isAuthenticated && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-ink)]">
                    {isEn
                      ? 'Sign in with Google to sync Developer changes to Cloud SQL'
                      : 'سجّل الدخول بحساب Google لحفظ تعديلات المطور في قاعدة البيانات السحابية للجميع'}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {isEn
                      ? 'Cloud SQL API writes require an authenticated session.'
                      : 'مطلوب تسجيل الدخول لإرسال الكتب والأكواد وتغييرات الأقسام لقاعدة البيانات.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onSignIn()}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}
                </button>
              </div>
            )}

            {/* Developer Exclusive: Single-Use 10-Digit Premium Codes Vault */}
            <div className="rounded-lg border border-amber-500/45 bg-[var(--bg-surface)] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                    {isEn
                      ? 'Single-Use Premium Codes Vault (10 Digits)'
                      : 'سجل أكواد البريميوم — استخدام واحد (10 أرقام)'}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {isEn
                      ? 'Each 10-digit code works once. As soon as any reader activates a book or theme with its code, a brand-new code is automatically generated so the old code cannot be shared or reused.'
                      : 'كل كود مكون من 10 أرقام يعمل لمرة واحدة فقط؛ بمجرد استخدامه من أي مستخدم، يتجدد الكود تلقائياً بكود جديد حتى لا يُنشر أو يُستخدم مرة أخرى.'}
                  </p>
                </div>

                {isAuthenticated && (
                  <button
                    type="button"
                    disabled={isRotatingAll}
                    onClick={async () => {
                      setIsRotatingAll(true);
                      try {
                        await onRotateAllCodes();
                        showNotice(
                          isEn
                            ? 'All rotating access codes refreshed immediately.'
                            : 'تم تدوير جميع أكواد الوصول الدورية بنجاح.'
                        );
                      } finally {
                        setIsRotatingAll(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <RotateCw
                      className={`h-3.5 w-3.5 ${isRotatingAll ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    {isEn ? 'Rotate All Codes Now' : 'تدوير جميع الأكواد الآن'}
                  </button>
                )}
              </div>

              {(() => {
                const ROTATING_CODES_PREVIEW_LIMIT = 4;
                const visiblePremiumBooks = showAllRotatingCodes
                  ? premiumBooksList
                  : premiumBooksList.slice(0, ROTATING_CODES_PREVIEW_LIMIT);
                const visiblePremiumThemes = showAllRotatingCodes
                  ? PREMIUM_THEMES
                  : PREMIUM_THEMES.slice(0, ROTATING_CODES_PREVIEW_LIMIT);
                const visiblePremiumIcons = showAllRotatingCodes
                  ? PREMIUM_APP_ICONS
                  : PREMIUM_APP_ICONS.slice(0, ROTATING_CODES_PREVIEW_LIMIT);
                const hiddenBooksCount = Math.max(
                  0,
                  premiumBooksList.length - ROTATING_CODES_PREVIEW_LIMIT
                );
                const hiddenThemesCount = Math.max(
                  0,
                  PREMIUM_THEMES.length - ROTATING_CODES_PREVIEW_LIMIT
                );
                const hiddenIconsCount = Math.max(
                  0,
                  PREMIUM_APP_ICONS.length - ROTATING_CODES_PREVIEW_LIMIT
                );
                const hasMoreRotatingCodes =
                  hiddenBooksCount > 0 || hiddenThemesCount > 0 || hiddenIconsCount > 0;
                const hiddenRotatingTotal =
                  hiddenBooksCount + hiddenThemesCount + hiddenIconsCount;

                return (
                  <>
                    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
                      {/* Premium Books Rotating Codes */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {isEn
                              ? `Premium Books Codes (${premiumBooksList.length})`
                              : `أكواد الكتب البريميوم الدورية (${premiumBooksList.length})`}
                          </p>
                          {!showAllRotatingCodes && hiddenBooksCount > 0 && (
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {isEn
                                ? `Showing ${ROTATING_CODES_PREVIEW_LIMIT} of ${premiumBooksList.length}`
                                : `عرض ${ROTATING_CODES_PREVIEW_LIMIT} من ${premiumBooksList.length}`}
                            </span>
                          )}
                        </div>
                        {premiumBooksList.length === 0 ? (
                          <p className="text-xs text-[var(--text-muted)]">
                            {isEn
                              ? 'No premium books yet. Choose "Yes, Premium Book" when adding a book.'
                              : 'لا توجد كتب بريميوم بعد. اختر «نعم، كتاب بريميوم» عند إضافة كتاب.'}
                          </p>
                        ) : (
                          visiblePremiumBooks.map((b) => {
                      const vault = devCodesVault.find(
                        (v) => v.targetType === 'book' && v.targetId === b.id
                      );
                      const activeCode = vault?.rotatingCode || b.unlockCode || '—';

                      return (
                        <div
                          key={b.id}
                          className="space-y-2 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-[var(--text-ink)]">
                                {b.title}
                              </p>
                              <p className="font-mono-tabular text-sm font-bold tracking-wider text-amber-600 dark:text-amber-400">
                                {activeCode}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                {isEn
                                  ? 'Single-use · auto-rotates after use'
                                  : 'استخدام واحد · يتجدد تلقائياً بعد كل استخدام'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isAuthenticated && (
                                <button
                                  type="button"
                                  disabled={rotatingTargetId === b.id}
                                  onClick={async () => {
                                    setRotatingTargetId(b.id);
                                    try {
                                      const res = await onRotateCode('book', b.id);
                                      if (res.ok) {
                                        showNotice(
                                          isEn
                                            ? `Rotated code for "${b.title}".`
                                            : `تم تدوير الكود لكتاب «${b.title}».`
                                        );
                                      }
                                    } finally {
                                      setRotatingTargetId(null);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded border border-amber-500/45 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-stone-950"
                                >
                                  <RotateCw
                                    className={`h-3 w-3 ${rotatingTargetId === b.id ? 'animate-spin' : ''}`}
                                  />
                                  {isEn ? 'Rotate' : 'تدوير'}
                                </button>
                              )}
                              {activeCode !== '—' && (
                                <button
                                  type="button"
                                  onClick={() => void handleCopyCode(b.id, activeCode)}
                                  className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)]"
                                >
                                  {copiedId === b.id ? (
                                    <>
                                      <Check className="h-3 w-3 text-amber-500" />
                                      {isEn ? 'Copied' : 'تم النسخ'}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      {isEn ? 'Copy' : 'نسخ'}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Premium Themes Rotating Codes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {isEn
                        ? `Premium Themes Codes (${PREMIUM_THEMES.length})`
                        : `أكواد السمات والخلفيات البريميوم (${PREMIUM_THEMES.length})`}
                    </p>
                    {!showAllRotatingCodes && hiddenThemesCount > 0 && (
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {isEn
                          ? `Showing ${ROTATING_CODES_PREVIEW_LIMIT} of ${PREMIUM_THEMES.length}`
                          : `عرض ${ROTATING_CODES_PREVIEW_LIMIT} من ${PREMIUM_THEMES.length}`}
                      </span>
                    )}
                  </div>
                  {visiblePremiumThemes.map((t) => {
                    const vault = devCodesVault.find(
                      (v) => v.targetType === 'theme' && v.targetId === t.id
                    );
                    const effectiveCode =
                      vault?.rotatingCode || customThemeCodes[t.id] || t.unlockCode || '';
                    const isEditingThis = editingThemeId === t.id;
                    return (
                      <div
                        key={t.id}
                        className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--text-ink)]">
                              {getThemeDisplayName(t, lang)}
                            </p>
                            {!isEditingThis && (
                              <>
                                <p className="font-mono-tabular text-sm font-bold tracking-wider text-amber-600 dark:text-amber-400">
                                  {effectiveCode}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                                  <Clock className="h-3 w-3" aria-hidden="true" />
                                  {isEn
                                    ? 'Single-use · auto-rotates after use'
                                    : 'استخدام واحد · يتجدد تلقائياً بعد كل استخدام'}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isEditingThis && (
                              <>
                                {isAuthenticated && (
                                  <button
                                    type="button"
                                    disabled={rotatingTargetId === t.id}
                                    onClick={async () => {
                                      setRotatingTargetId(t.id);
                                      try {
                                        const res = await onRotateCode('theme', t.id);
                                        if (res.ok) {
                                          showNotice(
                                            isEn
                                              ? `Rotated code for "${getThemeDisplayName(t, lang)}".`
                                              : `تم تدوير الكود لسمة «${getThemeDisplayName(t, lang)}».`
                                          );
                                        }
                                      } finally {
                                        setRotatingTargetId(null);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 rounded border border-amber-500/45 bg-amber-500/10 px-2 py-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-stone-950"
                                  >
                                    <RotateCw
                                      className={`h-3 w-3 ${rotatingTargetId === t.id ? 'animate-spin' : ''}`}
                                    />
                                    {isEn ? 'Rotate' : 'تدوير'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingThemeId(t.id);
                                    setEditingThemeCode(effectiveCode);
                                    setEditingThemeError(null);
                                  }}
                                  className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)]"
                                >
                                  {isEn ? 'Edit' : 'تغيير'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleCopyCode(t.id, effectiveCode)}
                                  className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)]"
                                >
                                  {copiedId === t.id ? (
                                    <>
                                      <Check className="h-3 w-3 text-amber-500" />
                                      {isEn ? 'Copied' : 'تم النسخ'}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      {isEn ? 'Copy' : 'نسخ'}
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditingThis && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={10}
                                dir="ltr"
                                value={editingThemeCode}
                                onChange={(e) => {
                                  setEditingThemeCode(
                                    e.target.value.replace(/\D/g, '').slice(0, 10)
                                  );
                                  setEditingThemeError(null);
                                }}
                                className="flex-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-center font-mono-tabular text-xs tracking-widest text-[var(--text-ink)]"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (isAuthenticated) {
                                    const res = await onRotateCode('theme', t.id, editingThemeCode);
                                    if (!res.ok) {
                                      setEditingThemeError(
                                        res.error ?? (isEn ? 'Invalid code.' : 'الكود غير صالح.')
                                      );
                                      return;
                                    }
                                    setEditingThemeId(null);
                                    setEditingThemeError(null);
                                    showNotice(
                                      isEn
                                        ? 'Theme rotating code updated.'
                                        : 'تم تحديث كود السمة في قاعدة البيانات.'
                                    );
                                  } else {
                                    await handleSaveThemeCodeEdit(t.id);
                                  }
                                }}
                                className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-stone-950"
                              >
                                {isEn ? 'Save' : 'حفظ'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingThemeId(null);
                                  setEditingThemeError(null);
                                }}
                                className="rounded border border-[var(--border-hairline)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
                              >
                                {isEn ? 'Cancel' : 'إلغاء'}
                              </button>
                            </div>
                            {editingThemeError && (
                              <p className="text-xs font-medium text-amber-500">
                                {editingThemeError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Premium App Icons Rotating Codes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {isEn
                        ? `Premium App Icons Codes (${PREMIUM_APP_ICONS.length})`
                        : `أكواد أيقونات التطبيق البريميوم (${PREMIUM_APP_ICONS.length})`}
                    </p>
                    {!showAllRotatingCodes && hiddenIconsCount > 0 && (
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {isEn
                          ? `Showing ${ROTATING_CODES_PREVIEW_LIMIT} of ${PREMIUM_APP_ICONS.length}`
                          : `عرض ${ROTATING_CODES_PREVIEW_LIMIT} من ${PREMIUM_APP_ICONS.length}`}
                      </span>
                    )}
                  </div>
                  {visiblePremiumIcons.map((ic) => {
                    const vault = devCodesVault.find(
                      (v) => v.targetType === 'icon' && v.targetId === ic.id
                    );
                    const effectiveCode =
                      vault?.rotatingCode || customThemeCodes[ic.id] || ic.unlockCode || '';
                    const isEditingThis = editingThemeId === ic.id;
                    const icLabel = isEn ? ic.nameEn : ic.name;
                    return (
                      <div
                        key={ic.id}
                        className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-amber-500/40">
                              <AppIconGraphic iconId={ic.id} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-[var(--text-ink)]">
                                {icLabel}
                              </p>
                              {!isEditingThis && (
                                <>
                                  <p className="font-mono-tabular text-sm font-bold tracking-wider text-amber-600 dark:text-amber-400">
                                    {effectiveCode}
                                  </p>
                                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                                    <Clock className="h-3 w-3" aria-hidden="true" />
                                    {isEn
                                      ? 'Single-use · auto-rotates after use'
                                      : 'استخدام واحد · يتجدد تلقائياً بعد كل استخدام'}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isEditingThis && (
                              <>
                                {isAuthenticated && (
                                  <button
                                    type="button"
                                    disabled={rotatingTargetId === ic.id}
                                    onClick={async () => {
                                      setRotatingTargetId(ic.id);
                                      try {
                                        const res = await onRotateCode('icon', ic.id);
                                        if (res.ok) {
                                          showNotice(
                                            isEn
                                              ? `Rotated code for "${icLabel}".`
                                              : `تم تدوير الكود لأيقونة «${icLabel}».`
                                          );
                                        }
                                      } finally {
                                        setRotatingTargetId(null);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 rounded border border-amber-500/45 bg-amber-500/10 px-2 py-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-stone-950"
                                  >
                                    <RotateCw
                                      className={`h-3 w-3 ${rotatingTargetId === ic.id ? 'animate-spin' : ''}`}
                                    />
                                    {isEn ? 'Rotate' : 'تدوير'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingThemeId(ic.id);
                                    setEditingThemeCode(effectiveCode);
                                    setEditingThemeError(null);
                                  }}
                                  className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)]"
                                >
                                  {isEn ? 'Edit' : 'تغيير'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleCopyCode(ic.id, effectiveCode)}
                                  className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)]"
                                >
                                  {copiedId === ic.id ? (
                                    <>
                                      <Check className="h-3 w-3 text-amber-500" />
                                      {isEn ? 'Copied' : 'تم النسخ'}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      {isEn ? 'Copy' : 'نسخ'}
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditingThis && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={10}
                                dir="ltr"
                                value={editingThemeCode}
                                onChange={(e) => {
                                  setEditingThemeCode(
                                    e.target.value.replace(/\D/g, '').slice(0, 10)
                                  );
                                  setEditingThemeError(null);
                                }}
                                className="flex-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-center font-mono-tabular text-xs tracking-widest text-[var(--text-ink)]"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (isAuthenticated) {
                                    const res = await onRotateCode('icon', ic.id, editingThemeCode);
                                    if (!res.ok) {
                                      setEditingThemeError(
                                        res.error ?? (isEn ? 'Invalid code.' : 'الكود غير صالح.')
                                      );
                                      return;
                                    }
                                    setEditingThemeId(null);
                                    setEditingThemeError(null);
                                    showNotice(
                                      isEn
                                        ? 'App icon rotating code updated.'
                                        : 'تم تحديث كود الأيقونة في قاعدة البيانات.'
                                    );
                                  } else {
                                    await handleSaveThemeCodeEdit(ic.id);
                                  }
                                }}
                                className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-stone-950"
                              >
                                {isEn ? 'Save' : 'حفظ'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingThemeId(null);
                                  setEditingThemeError(null);
                                }}
                                className="rounded border border-[var(--border-hairline)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
                              >
                                {isEn ? 'Cancel' : 'إلغاء'}
                              </button>
                            </div>
                            {editingThemeError && (
                              <p className="text-xs font-medium text-amber-500">
                                {editingThemeError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasMoreRotatingCodes && (
                <div className="mt-4 flex justify-center border-t border-[var(--border-hairline)] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAllRotatingCodes((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/45 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500 hover:text-stone-950"
                  >
                    {showAllRotatingCodes ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isEn ? 'Show Less' : 'عرض أقل'}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {isEn
                            ? `Show All (${hiddenRotatingTotal} more)`
                            : `عرض الكل (+${hiddenRotatingTotal} إضافي)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
                  </>
                );
              })()}
            </div>

            {/* Developer Exclusive: Golden Rhombus Token Economy Panel */}
            {onUpdateEconomyConfig && onSetItemTokenPrice && onAdjustUserTokens && (
              <DeveloperEconomyPanel
                economyConfig={economyConfig ?? DEFAULT_TOKEN_ECONOMY_CONFIG}
                books={books}
                devUsersList={devUsersList}
                themeAccessMap={themeAccessMap}
                iconAccessMap={iconAccessMap}
                isAuthenticated={isAuthenticated}
                lang={lang}
                onUpdateEconomyConfig={onUpdateEconomyConfig}
                onSetItemTokenPrice={onSetItemTokenPrice}
                onAdjustUserTokens={onAdjustUserTokens}
                onNotify={showNotice}
              />
            )}

            {/* Developer Exclusive: User Accounts & VIP Access Manager */}
            {isAuthenticated && (
              <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-4">
                <div className="border-b border-[var(--border-hairline)] pb-4">
                  <h3 className="flex items-center gap-2 font-editorial text-xl font-bold text-[var(--text-ink)]">
                    <Users className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {isEn
                      ? 'User Accounts & Special VIP Access'
                      : 'إدارة حسابات المستخدمين وصلاحيات VIP الخاصة'}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {isEn
                      ? 'Pick any reader account by name to grant or revoke permanent VIP access for a book or theme.'
                      : 'اختر اسم الحساب مباشرةً لمنحه صلاحية VIP دائمة لأي كتاب أو سمة بريميوم، أو لإلغائها وتوثيق الحساب.'}
                  </p>
                </div>

                {devUsersList.length === 0 ? (
                  <p className="rounded-md border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-5 text-center text-xs text-[var(--text-muted)]">
                    {isEn
                      ? 'No signed-in accounts registered yet.'
                      : 'لا توجد حسابات مسجلة في التطبيق حتى الآن.'}
                  </p>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setGrantError(null);
                      const selectedAccountEmail = grantEmail || devUsersList[0]?.email || '';
                      const selectedAccount = devUsersList.find(
                        (u) => u.email === selectedAccountEmail
                      );
                      const targetVal =
                        grantTarget ||
                        (premiumBooksList[0]
                          ? `book:${premiumBooksList[0].id}`
                          : `theme:${PREMIUM_THEMES[0].id}`);
                      const [tType, tId] = targetVal.split(':') as [
                        'book' | 'theme' | 'icon',
                        string,
                      ];
                      if (!selectedAccountEmail || !tId) return;
                      setIsGranting(true);
                      try {
                        const res = await onGrantPermanentAccess(selectedAccountEmail, tType, tId);
                        if (!res.ok) {
                          setGrantError(
                            res.error ??
                              (isEn
                                ? 'Could not grant VIP access to this account.'
                                : 'تعذّر منح الصلاحية لهذا الحساب.')
                          );
                        } else {
                          const accountLabel =
                            selectedAccount?.displayName || selectedAccountEmail;
                          showNotice(
                            isEn
                              ? `Granted permanent VIP access to ${accountLabel}.`
                              : `تم منح صلاحية VIP الدائمة لحساب «${accountLabel}» بنجاح.`
                          );
                        }
                      } finally {
                        setIsGranting(false);
                      }
                    }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <select
                      aria-label={isEn ? 'Choose account by name' : 'اختر اسم الحساب'}
                      value={grantEmail || devUsersList[0]?.email || ''}
                      onChange={(e) => {
                        setGrantEmail(e.target.value);
                        if (grantError) setGrantError(null);
                      }}
                      className="min-w-[200px] flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                    >
                      {devUsersList.map((u) => (
                        <option key={u.uid} value={u.email}>
                          {u.displayName}
                          {u.isVerified ? (isEn ? ' (Verified)' : ' (موثق ✓)') : ''}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={isEn ? 'Choose VIP item' : 'اختر الكتاب أو السمة أو الأيقونة'}
                      value={
                        grantTarget ||
                        (premiumBooksList[0]
                          ? `book:${premiumBooksList[0].id}`
                          : `theme:${PREMIUM_THEMES[0].id}`)
                      }
                      onChange={(e) => setGrantTarget(e.target.value)}
                      className="min-w-[180px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-ink)]"
                    >
                      {premiumBooksList.map((b) => (
                        <option key={`book:${b.id}`} value={`book:${b.id}`}>
                          {isEn ? `Book: ${b.title}` : `كتاب: ${b.title}`}
                        </option>
                      ))}
                      {PREMIUM_THEMES.map((t) => (
                        <option key={`theme:${t.id}`} value={`theme:${t.id}`}>
                          {isEn
                            ? `Theme: ${getThemeDisplayName(t, lang)}`
                            : `سمة: ${getThemeDisplayName(t, lang)}`}
                        </option>
                      ))}
                      {PREMIUM_APP_ICONS.map((ic) => (
                        <option key={`icon:${ic.id}`} value={`icon:${ic.id}`}>
                          {isEn ? `App Icon: ${ic.nameEn}` : `أيقونة: ${ic.name}`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={isGranting}
                      className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                      {isEn ? 'Grant Permanent Access' : 'منح وصول دائم'}
                    </button>
                  </form>
                )}
                {grantError && <p className="text-xs font-medium text-red-500">{grantError}</p>}

                {devUsersList.length > 0 && (
                  <div className="divide-y divide-[var(--border-hairline)] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
                    {devUsersList.map((u) => (
                      <div key={u.uid} className="space-y-2 p-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[var(--text-ink)]">
                              {u.displayName}
                            </span>
                            {u.isVerified && <OwnerBadge showOwnerText={false} />}
                            <span className="text-[var(--text-muted)]" dir="ltr">
                              ({u.email})
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void onSetUserVerified(u.uid, !u.isVerified)}
                              aria-pressed={u.isVerified}
                              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                u.isVerified
                                  ? 'border-sky-500/60 bg-sky-500/15 text-sky-500 hover:bg-sky-500/25'
                                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-sky-500/50 hover:text-sky-500'
                              }`}
                            >
                              {u.isVerified ? (
                                <>
                                  <Check className="h-3 w-3" aria-hidden="true" />
                                  <span>{isEn ? 'Verified (Remove)' : 'موثق ✓ (إلغاء)'}</span>
                                </>
                              ) : (
                                <span>{isEn ? 'Verify Account' : 'توثيق الحساب'}</span>
                              )}
                            </button>
                            <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono-tabular text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              <TokenIcon className="h-3 w-3" />
                              <span>{u.tokensBalance ?? 0}</span>
                            </span>
                            <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                              {u.purchasedBookIds.length +
                                u.purchasedThemeIds.length +
                                (u.purchasedIconIds?.length ?? 0)}{' '}
                              {isEn ? 'VIP grants' : 'صلاحيات خاصة'}
                            </span>
                          </div>
                        </div>
                        {(u.purchasedBookIds.length > 0 ||
                          u.purchasedThemeIds.length > 0 ||
                          (u.purchasedIconIds?.length ?? 0) > 0) && (
                          <div className="flex flex-wrap gap-1.5">
                            {u.purchasedBookIds.map((bid) => {
                              const bTitle = books.find((b) => b.id === bid)?.title ?? bid;
                              return (
                                <span
                                  key={bid}
                                  className="inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-[var(--text-ink)]"
                                >
                                  {bTitle}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDialog({
                                        open: true,
                                        title: isEn
                                          ? 'Confirm Revoke VIP Access'
                                          : 'تأكيد إزالة صلاحية الـ VIP',
                                        message: isEn
                                          ? `Are you sure you want to remove "${bTitle}" from ${u.displayName || u.email}?`
                                          : `هل أنت متأكد أنك تريد إزالة «${bTitle}» من صلاحيات ${u.displayName || u.email}؟`,
                                        confirmLabel: isEn ? 'Yes, Remove' : 'نعم، إزالة',
                                        onConfirm: async () => {
                                          setConfirmDialog((c) => ({ ...c, open: false }));
                                          await onRevokePermanentAccess(u.uid, 'book', bid);
                                          showNotice(
                                            isEn
                                              ? `Removed "${bTitle}" from ${u.email}.`
                                              : `تمت إزالة «${bTitle}» من صلاحيات ${u.email}.`
                                          );
                                        },
                                      })
                                    }
                                    className="px-0.5 font-bold text-red-500 hover:text-red-400"
                                    aria-label={isEn ? `Revoke ${bTitle}` : `إزالة ${bTitle}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                            {u.purchasedThemeIds.map((tid) => {
                              const themeObj = THEME_CATALOG.find((t) => t.id === tid);
                              const tLabel = themeObj ? getThemeDisplayName(themeObj, lang) : tid;
                              return (
                                <span
                                  key={tid}
                                  className="inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-[var(--text-ink)]"
                                >
                                  {tLabel}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDialog({
                                        open: true,
                                        title: isEn
                                          ? 'Confirm Revoke VIP Access'
                                          : 'تأكيد إزالة صلاحية الـ VIP',
                                        message: isEn
                                          ? `Are you sure you want to remove theme "${tLabel}" from ${u.displayName || u.email}?`
                                          : `هل أنت متأكد أنك تريد إزالة سمة «${tLabel}» من صلاحيات ${u.displayName || u.email}؟`,
                                        confirmLabel: isEn ? 'Yes, Remove' : 'نعم، إزالة',
                                        onConfirm: async () => {
                                          setConfirmDialog((c) => ({ ...c, open: false }));
                                          await onRevokePermanentAccess(u.uid, 'theme', tid);
                                          showNotice(
                                            isEn
                                              ? `Removed "${tLabel}" from ${u.email}.`
                                              : `تمت إزالة سمة «${tLabel}» من صلاحيات ${u.email}.`
                                          );
                                        },
                                      })
                                    }
                                    className="px-0.5 font-bold text-red-500 hover:text-red-400"
                                    aria-label={isEn ? `Revoke ${tLabel}` : `إزالة ${tLabel}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                            {(u.purchasedIconIds ?? []).map((iid) => {
                              const iconObj = getAppIconById(iid);
                              const iLabel = isEn ? iconObj.nameEn : iconObj.name;
                              return (
                                <span
                                  key={iid}
                                  className="inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-[var(--text-ink)]"
                                >
                                  {iLabel}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDialog({
                                        open: true,
                                        title: isEn
                                          ? 'Confirm Revoke VIP Access'
                                          : 'تأكيد إزالة صلاحية الـ VIP',
                                        message: isEn
                                          ? `Are you sure you want to remove app icon "${iLabel}" from ${u.displayName || u.email}?`
                                          : `هل أنت متأكد أنك تريد إزالة أيقونة «${iLabel}» من صلاحيات ${u.displayName || u.email}؟`,
                                        confirmLabel: isEn ? 'Yes, Remove' : 'نعم، إزالة',
                                        onConfirm: async () => {
                                          setConfirmDialog((c) => ({ ...c, open: false }));
                                          await onRevokePermanentAccess(u.uid, 'icon', iid);
                                          showNotice(
                                            isEn
                                              ? `Removed "${iLabel}" from ${u.email}.`
                                              : `تمت إزالة أيقونة «${iLabel}» من صلاحيات ${u.email}.`
                                          );
                                        },
                                      })
                                    }
                                    className="px-0.5 font-bold text-red-500 hover:text-red-400"
                                    aria-label={isEn ? `Revoke ${iLabel}` : `إزالة ${iLabel}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Developer Exclusive: Book Comments & Star Ratings Manager (Auto Average) */}
            <div className="rounded-lg border border-amber-500/45 bg-[var(--bg-surface)] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
                <div>
                  <h3 className="flex items-center gap-2 font-editorial text-xl font-bold text-[var(--text-ink)]">
                    <MessageSquareText className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {copy.devReviewsTitle}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {copy.devReviewsSubtitle}
                  </p>
                </div>

                {selectedReviewBook && (
                  <div className="flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5">
                    <span className="text-[11px] font-medium text-[var(--text-muted)]">
                      {isEn ? 'Auto Average:' : 'المتوسط التلقائي:'}
                    </span>
                    <StarRatingDisplay rating={getBookRating(selectedReviewBook)} lang={lang} compact />
                    <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                      ({selectedReviewBook.reviews?.length ?? 0})
                    </span>
                  </div>
                )}
              </div>

              {books.length === 0 ? (
                <p className="mt-4 text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'Add a book first to manage its comments and ratings.'
                    : 'أضف كتاباً أولاً لتتمكن من إضافة التعليقات والتقييمات له.'}
                </p>
              ) : (
                <div className="mt-5 space-y-6">
                  {/* Book Selector */}
                  <div>
                    <label
                      htmlFor="dev-review-book-select"
                      className="block text-xs font-medium text-[var(--text-muted)]"
                    >
                      {isEn ? 'Select Book to Manage Reviews' : 'اختر الكتاب لإضافة أو تعديل تعليقاته'}
                    </label>
                    <select
                      id="dev-review-book-select"
                      value={selectedReviewBook?.id ?? ''}
                      onChange={(e) => {
                        setSelectedReviewBookId(e.target.value);
                        setEditingReviewId(null);
                        setReviewFormError(null);
                      }}
                      className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm font-medium text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                    >
                      {books.map((b) => {
                        const avg = getBookRating(b);
                        const cnt = b.reviews?.length ?? 0;
                        return (
                          <option key={b.id} value={b.id}>
                            {b.title} — ★ {avg.toFixed(1)} ({cnt}{' '}
                            {isEn ? 'reviews' : 'تعليقات'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedReviewBook && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                      {/* Add New Review Form */}
                      <form
                        onSubmit={handleAddBookReviewSubmit}
                        className="lg:col-span-5 space-y-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4"
                      >
                        <p className="text-sm font-bold text-[var(--text-ink)]">
                          {isEn ? 'Add Reader Comment & Rating' : 'إضافة تعليق وتقييم جديد'}
                        </p>

                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)]">
                            {isEn ? 'Link to Google Account (Optional)' : 'ربط التعليق بحساب Google (اختياري)'}
                          </label>
                          <select
                            value={newReviewerUid}
                            onChange={(e) => {
                              const uid = e.target.value;
                              setNewReviewerUid(uid);
                              const matched = devUsersList.find((u) => u.uid === uid);
                              if (matched) {
                                setNewReviewerName(matched.displayName);
                              }
                              if (reviewFormError) setReviewFormError(null);
                            }}
                            className="mt-1.5 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                          >
                            <option value="">
                              {isEn
                                ? 'Manual Name (Not linked to an account)'
                                : 'اسم يدوي (بدون ربط بحساب)'}
                            </option>
                            {devUsersList.map((u) => (
                              <option key={u.uid} value={u.uid}>
                                {u.displayName} ({u.email}) —{' '}
                                {u.isVerified
                                  ? isEn
                                    ? 'Verified'
                                    : 'موثق ✓'
                                  : isEn
                                    ? 'Unverified'
                                    : 'غير موثق'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)]">
                            {isEn ? 'Reviewer Name *' : 'اسم المعلّق *'}
                            {linkedNewReviewer && (
                              <span className="ms-1.5 text-[10px] text-amber-500">
                                {isEn ? '(Synced with account)' : '(مرتبط باسم الحساب)'}
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            required
                            readOnly={Boolean(linkedNewReviewer)}
                            value={linkedNewReviewer ? linkedNewReviewer.displayName : newReviewerName}
                            onChange={(e) => {
                              if (linkedNewReviewer) return;
                              setNewReviewerName(e.target.value);
                              if (reviewFormError) setReviewFormError(null);
                            }}
                            placeholder={isEn ? 'e.g. Ahmed Mohamed' : 'مثال: أحمد محمد'}
                            className={`mt-1.5 w-full rounded border border-[var(--border-hairline)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-amber-500 focus:outline-none ${
                              linkedNewReviewer
                                ? 'bg-[var(--bg-canvas)] opacity-85 cursor-not-allowed'
                                : 'bg-[var(--bg-surface)]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)]">
                            {isEn ? 'Star Rating (1–5)' : 'التقييم بالنجوم (1 إلى 5)'}
                          </label>
                          <div className="mt-1.5 flex items-center justify-between gap-3 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2">
                            <div className="flex items-center gap-1" dir="ltr">
                              {[1, 2, 3, 4, 5].map((starVal) => {
                                const active = starVal <= newReviewRating;
                                return (
                                  <button
                                    key={starVal}
                                    type="button"
                                    onClick={() => setNewReviewRating(starVal)}
                                    aria-label={`${starVal} ${isEn ? 'stars' : 'نجوم'}`}
                                    className="rounded p-0.5 transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={`h-5 w-5 ${
                                        active
                                          ? 'fill-amber-400 text-amber-500'
                                          : 'fill-transparent text-[var(--text-muted)] opacity-40'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            <span
                              className="font-mono-tabular text-xs font-bold text-amber-500"
                              dir="ltr"
                            >
                              {newReviewRating.toFixed(1)} / 5
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)]">
                            {isEn ? 'Comment *' : 'التعليق *'}
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={newReviewComment}
                            onChange={(e) => {
                              setNewReviewComment(e.target.value);
                              if (reviewFormError) setReviewFormError(null);
                            }}
                            placeholder={
                              isEn
                                ? 'Write the reader comment on this book...'
                                : 'اكتب رأي الشخص أو تعليقه على الكتاب...'
                            }
                            className="mt-1.5 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        {/* Verification & Owner Badges */}
                        {linkedNewReviewer ? (
                          <div className="space-y-2.5">
                            <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-[var(--text-muted)]">
                                  {isEn
                                    ? 'Verification (Auto from account):'
                                    : 'التوثيق (يتبع الحساب تلقائياً):'}
                                </span>
                                {linkedNewReviewer.isVerified ? (
                                  <span className="inline-flex items-center gap-1.5 font-semibold text-sky-500">
                                    <OwnerBadge showVerifiedIcon showOwnerText={false} />
                                    <span>{isEn ? 'Verified Account' : 'موثق'}</span>
                                  </span>
                                ) : (
                                  <span className="font-semibold text-[var(--text-muted)]">
                                    {isEn ? 'Not Verified' : 'غير موثق'}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                {isEn
                                  ? 'Verified status cannot be manually overridden when linked to an account.'
                                  : 'لا يمكن تغيير علامة التوثيق يدوياً عند ربط التعليق بحساب؛ تعتمد على حالة الحساب نفسه.'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setNewReviewIsOwner((prev) => !prev)}
                              aria-pressed={newReviewIsOwner}
                              className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-all ${
                                newReviewIsOwner
                                  ? 'border-amber-400 bg-amber-500/10 text-[var(--text-ink)] shadow-[0_0_16px_-6px_rgba(245,158,11,0.5)]'
                                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-amber-500/50'
                              }`}
                            >
                              <span className="flex items-center gap-2 font-medium">
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                                    newReviewIsOwner
                                      ? 'border-amber-400 bg-amber-500 text-stone-950'
                                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)]'
                                  }`}
                                >
                                  {newReviewIsOwner && (
                                    <Check className="h-3 w-3" aria-hidden="true" />
                                  )}
                                </span>
                                <span>
                                  {isEn ? 'Add (The Owner) badge' : 'إضافة شارة (The Owner)'}
                                </span>
                              </span>
                              <OwnerBadge
                                showVerifiedIcon={Boolean(linkedNewReviewer.isVerified)}
                                showOwnerText
                              />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-[var(--text-muted)]">
                              {isEn ? 'Account Verification Badge (Optional)' : 'شارة التوثيق (اختياري)'}
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setNewReviewBadge((prev) =>
                                    prev === 'verified' ? 'none' : 'verified'
                                  )
                                }
                                aria-pressed={newReviewBadge === 'verified'}
                                className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-all ${
                                  newReviewBadge === 'verified'
                                    ? 'border-sky-500 bg-sky-500/10 text-[var(--text-ink)] shadow-[0_0_14px_-6px_rgba(29,155,240,0.45)]'
                                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-sky-500/50'
                                }`}
                              >
                                <span className="flex items-center gap-2 font-medium">
                                  <span
                                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                                      newReviewBadge === 'verified'
                                        ? 'border-sky-500 bg-sky-500 text-white'
                                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)]'
                                    }`}
                                  >
                                    {newReviewBadge === 'verified' && (
                                      <Check className="h-3 w-3" aria-hidden="true" />
                                    )}
                                  </span>
                                  <span>
                                    {isEn ? 'Verified badge only' : 'علامة التوثيق Verified فقط'}
                                  </span>
                                </span>
                                <OwnerBadge showOwnerText={false} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setNewReviewBadge((prev) => (prev === 'owner' ? 'none' : 'owner'))
                                }
                                aria-pressed={newReviewBadge === 'owner'}
                                className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-all ${
                                  newReviewBadge === 'owner'
                                    ? 'border-amber-400 bg-amber-500/10 text-[var(--text-ink)] shadow-[0_0_16px_-6px_rgba(245,158,11,0.5)]'
                                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-amber-500/50'
                                }`}
                              >
                                <span className="flex items-center gap-2 font-medium">
                                  <span
                                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                                      newReviewBadge === 'owner'
                                        ? 'border-amber-400 bg-amber-500 text-stone-950'
                                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)]'
                                    }`}
                                  >
                                    {newReviewBadge === 'owner' && (
                                      <Check className="h-3 w-3" aria-hidden="true" />
                                    )}
                                  </span>
                                  <span>
                                    {isEn ? 'Verified + (The Owner)' : 'علامة التوثيق مع (The Owner)'}
                                  </span>
                                </span>
                                <OwnerBadge showOwnerText />
                              </button>
                            </div>
                          </div>
                        )}

                        {reviewFormError && (
                          <p role="alert" className="text-xs font-semibold text-red-500">
                            {reviewFormError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {isSubmittingReview
                              ? isEn
                                ? 'Saving...'
                                : 'جاري الحفظ...'
                              : isEn
                                ? 'Add Comment & Recalculate'
                                : 'إضافة التعليق وحساب المتوسط'}
                          </span>
                        </button>
                      </form>

                      {/* Existing Comments List for Selected Book */}
                      <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-[var(--text-ink)]">
                            {isEn
                              ? `Published Comments (${selectedReviewBook.reviews?.length ?? 0})`
                              : `التعليقات المنشورة (${selectedReviewBook.reviews?.length ?? 0})`}
                          </p>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {isEn
                              ? 'Average updates automatically on add/edit/delete'
                              : 'يتحدث المتوسط العام للكتاب تلقائياً مع كل تغيير'}
                          </span>
                        </div>

                        {!selectedReviewBook.reviews || selectedReviewBook.reviews.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                            {copy.bookDetailNoReviews}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedReviewBook.reviews.map((rev) => {
                              const isEditingThis = editingReviewId === rev.id;
                              if (isEditingThis) {
                                return (
                                  <div
                                    key={rev.id}
                                    className="space-y-3 rounded-lg border border-amber-500/50 bg-[var(--bg-canvas)] p-4"
                                  >
                                    <div>
                                      <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                                        {isEn ? 'Link to Google Account' : 'ربط التعليق بحساب Google'}
                                      </label>
                                      <select
                                        value={editReviewerUid}
                                        onChange={(e) => {
                                          const uid = e.target.value;
                                          setEditReviewerUid(uid);
                                          const matched = devUsersList.find((u) => u.uid === uid);
                                          if (matched) {
                                            setEditReviewerName(matched.displayName);
                                          }
                                        }}
                                        className="mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-ink)]"
                                      >
                                        <option value="">
                                          {isEn
                                            ? 'Manual Name (Not linked to an account)'
                                            : 'اسم يدوي (بدون ربط بحساب)'}
                                        </option>
                                        {devUsersList.map((u) => (
                                          <option key={u.uid} value={u.uid}>
                                            {u.displayName} ({u.email}) —{' '}
                                            {u.isVerified
                                              ? isEn
                                                ? 'Verified'
                                                : 'موثق ✓'
                                              : isEn
                                                ? 'Unverified'
                                                : 'غير موثق'}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <input
                                        type="text"
                                        readOnly={Boolean(linkedEditReviewer)}
                                        value={
                                          linkedEditReviewer
                                            ? linkedEditReviewer.displayName
                                            : editReviewerName
                                        }
                                        onChange={(e) => {
                                          if (linkedEditReviewer) return;
                                          setEditReviewerName(e.target.value);
                                        }}
                                        placeholder={isEn ? 'Reviewer name' : 'اسم المعلّق'}
                                        className={`flex-1 rounded border border-[var(--border-hairline)] px-3 py-1.5 text-sm text-[var(--text-ink)] ${
                                          linkedEditReviewer
                                            ? 'bg-[var(--bg-canvas)] opacity-85 cursor-not-allowed'
                                            : 'bg-[var(--bg-surface)]'
                                        }`}
                                      />
                                      <div className="flex items-center gap-1" dir="ltr">
                                        {[1, 2, 3, 4, 5].map((starVal) => (
                                          <button
                                            key={starVal}
                                            type="button"
                                            onClick={() => setEditReviewRating(starVal)}
                                            className="p-0.5"
                                            aria-label={`${starVal} stars`}
                                          >
                                            <Star
                                              className={`h-4 w-4 ${
                                                starVal <= editReviewRating
                                                  ? 'fill-amber-400 text-amber-500'
                                                  : 'fill-transparent text-[var(--text-muted)] opacity-40'
                                              }`}
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <textarea
                                      rows={2}
                                      value={editReviewComment}
                                      onChange={(e) => setEditReviewComment(e.target.value)}
                                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-ink)]"
                                    />

                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      {linkedEditReviewer ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="inline-flex items-center gap-1.5 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                                            {linkedEditReviewer.isVerified ? (
                                              <>
                                                <OwnerBadge showVerifiedIcon showOwnerText={false} />
                                                <span className="text-sky-500 font-medium">
                                                  {isEn ? 'Auto-Verified' : 'توثيق تلقائي من الحساب'}
                                                </span>
                                              </>
                                            ) : (
                                              <span>
                                                {isEn ? 'Unverified (Auto)' : 'غير موثق (تلقائي من الحساب)'}
                                              </span>
                                            )}
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() => setEditReviewIsOwner((prev) => !prev)}
                                            aria-pressed={editReviewIsOwner}
                                            className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 text-xs transition-colors ${
                                              editReviewIsOwner
                                                ? 'border-amber-400 bg-amber-500/10 text-[var(--text-ink)]'
                                                : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                                            }`}
                                          >
                                            <span
                                              className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                                                editReviewIsOwner
                                                  ? 'border-amber-400 bg-amber-500 text-stone-950'
                                                  : 'border-[var(--border-hairline)]'
                                              }`}
                                            >
                                              {editReviewIsOwner && (
                                                <Check className="h-2.5 w-2.5" aria-hidden="true" />
                                              )}
                                            </span>
                                            <OwnerBadge
                                              showVerifiedIcon={Boolean(linkedEditReviewer.isVerified)}
                                              showOwnerText
                                            />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditReviewBadge((prev) =>
                                                prev === 'verified' ? 'none' : 'verified'
                                              )
                                            }
                                            aria-pressed={editReviewBadge === 'verified'}
                                            className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 text-xs transition-colors ${
                                              editReviewBadge === 'verified'
                                                ? 'border-sky-500 bg-sky-500/10 text-[var(--text-ink)]'
                                                : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                                            }`}
                                          >
                                            <span
                                              className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                                                editReviewBadge === 'verified'
                                                  ? 'border-sky-500 bg-sky-500 text-white'
                                                  : 'border-[var(--border-hairline)]'
                                              }`}
                                            >
                                              {editReviewBadge === 'verified' && (
                                                <Check className="h-2.5 w-2.5" aria-hidden="true" />
                                              )}
                                            </span>
                                            <OwnerBadge showOwnerText={false} />
                                            <span>{isEn ? 'Verified' : 'موثق فقط'}</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditReviewBadge((prev) =>
                                                prev === 'owner' ? 'none' : 'owner'
                                              )
                                            }
                                            aria-pressed={editReviewBadge === 'owner'}
                                            className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 text-xs transition-colors ${
                                              editReviewBadge === 'owner'
                                                ? 'border-amber-400 bg-amber-500/10 text-[var(--text-ink)]'
                                                : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                                            }`}
                                          >
                                            <span
                                              className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                                                editReviewBadge === 'owner'
                                                  ? 'border-amber-400 bg-amber-500 text-stone-950'
                                                  : 'border-[var(--border-hairline)]'
                                              }`}
                                            >
                                              {editReviewBadge === 'owner' && (
                                                <Check className="h-2.5 w-2.5" aria-hidden="true" />
                                              )}
                                            </span>
                                            <OwnerBadge showOwnerText />
                                          </button>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingReviewId(null);
                                            setEditReviewerUid('');
                                          }}
                                          className="rounded border border-[var(--border-hairline)] px-3 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-ink)]"
                                        >
                                          {isEn ? 'Cancel' : 'إلغاء'}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isUpdatingReview}
                                          onClick={() => void handleSaveEditedReview(rev.id)}
                                          className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                                        >
                                          {isEn ? 'Save' : 'حفظ التعديل'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              const linkedAccount = rev.reviewerUid
                                ? devUsersList.find((u) => u.uid === rev.reviewerUid) ?? null
                                : null;

                              return (
                                <div
                                  key={rev.id}
                                  className={`rounded-lg border bg-[var(--bg-canvas)] p-4 ${
                                    rev.isOwner
                                      ? 'border-amber-500/50'
                                      : 'border-[var(--border-hairline)]'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                      <span className="text-sm font-bold text-[var(--text-ink)]">
                                        {rev.reviewerName}
                                      </span>
                                      {(rev.isVerified || rev.isOwner) && (
                                        <OwnerBadge
                                          showVerifiedIcon={Boolean(rev.isVerified)}
                                          showOwnerText={Boolean(rev.isOwner)}
                                        />
                                      )}
                                      {rev.reviewerUid && (
                                        <span
                                          dir="ltr"
                                          className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono-tabular text-[10px] text-[var(--text-muted)]"
                                        >
                                          {linkedAccount?.email ?? (isEn ? 'Linked account' : 'حساب مرتبط')}
                                        </span>
                                      )}
                                      <StarRatingDisplay rating={rev.rating} lang={lang} compact />
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingReviewId(rev.id);
                                          setEditReviewerUid(rev.reviewerUid ?? '');
                                          setEditReviewerName(rev.reviewerName);
                                          setEditReviewRating(rev.rating);
                                          setEditReviewComment(rev.comment);
                                          setEditReviewIsOwner(Boolean(rev.isOwner));
                                          setEditReviewBadge(
                                            rev.isOwner
                                              ? 'owner'
                                              : rev.isVerified
                                                ? 'verified'
                                                : 'none'
                                          );
                                        }}
                                        className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-ink)]"
                                        aria-label={isEn ? 'Edit review' : 'تعديل التعليق'}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConfirmDialog({
                                            open: true,
                                            title: isEn ? 'Delete Comment' : 'تأكيد حذف التعليق',
                                            message: isEn
                                              ? `Are you sure you want to delete the comment by "${rev.reviewerName}"? The average rating will be recalculated.`
                                              : `هل أنت متأكد من حذف تعليق «${rev.reviewerName}»؟ سيتم إعادة حساب متوسط التقييم تلقائياً.`,
                                            confirmLabel: isEn ? 'Delete' : 'حذف التعليق',
                                            onConfirm: async () => {
                                              setConfirmDialog((c) => ({ ...c, open: false }));
                                              await onDeleteBookReview(rev.id);
                                              showNotice(
                                                isEn
                                                  ? 'Deleted comment and updated book average rating.'
                                                  : 'تم حذف التعليق وتحديث متوسط النجوم تلقائياً.'
                                              );
                                            },
                                          })
                                        }
                                        className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-red-500"
                                        aria-label={isEn ? 'Delete review' : 'حذف التعليق'}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[var(--text-muted)]">
                                    {rev.comment}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Developer Exclusive: Library Sections Manager (Add / Rename / Delete) */}
            <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
              <div className="border-b border-[var(--border-hairline)] pb-4">
                <h3 className="flex items-center gap-2 font-editorial text-xl font-bold text-[var(--text-ink)]">
                  <FolderTree className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
                  {copy.devSectionsTitle}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {copy.devSectionsSubtitle}
                </p>
              </div>

              <form onSubmit={handleAddSectionSubmit} className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => {
                    setNewSectionName(e.target.value);
                    if (sectionFormError) setSectionFormError(null);
                  }}
                  placeholder={copy.addSectionPlaceholder}
                  className="min-w-[200px] flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={newSectionEnName}
                  onChange={(e) => setNewSectionEnName(e.target.value)}
                  placeholder={copy.addSectionEnPlaceholder}
                  className="min-w-[200px] flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.addSectionBtn}
                </button>
              </form>
              {sectionFormError && (
                <p role="alert" className="mt-2 text-xs font-medium text-red-500">
                  {sectionFormError}
                </p>
              )}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sections.map((sec) => {
                  const countInSec = books.filter((b) => b.category === sec).length;
                  const isEditingThis = editingSectionName === sec;
                  const arDisplay = formatSectionHeading(sec, 'ar', sectionTranslations);
                  const enDisplay = getSectionDisplayName(sec, 'en', sectionTranslations);
                  return (
                    <div
                      key={sec}
                      className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-3"
                    >
                      {!isEditingThis ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                              {isEn ? enDisplay : arDisplay}
                            </p>
                            <p className="truncate text-[11px] text-[var(--text-muted)]">
                              <span dir="ltr">{isEn ? arDisplay : enDisplay}</span>
                              {' · '}
                              <span className="font-mono-tabular">
                                {countInSec === 1
                                  ? copy.oneBookInSection
                                  : `${countInSec} ${copy.booksInSectionSuffix}`}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSectionName(sec);
                                setSectionRenameDraft(sec);
                                setSectionRenameEnDraft(
                                  sectionTranslations[sec] ?? (enDisplay !== sec ? enDisplay : '')
                                );
                                setSectionRenameError(null);
                              }}
                              className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-ink)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                            >
                              <Pencil className="h-3 w-3" aria-hidden="true" />
                              {copy.renameSectionBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDeleteSection(sec, countInSec)}
                              className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:border-red-500 hover:text-red-500"
                              aria-label={`${copy.deleteSectionBtn} ${isEn ? enDisplay : sec}`}
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                              {copy.deleteSectionBtn}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={sectionRenameDraft}
                              onChange={(e) => {
                                setSectionRenameDraft(e.target.value);
                                setSectionRenameError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  void handleSaveSectionRename(sec);
                                }
                              }}
                              className="min-w-[140px] flex-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                            />
                            <input
                              type="text"
                              dir="ltr"
                              value={sectionRenameEnDraft}
                              onChange={(e) => setSectionRenameEnDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  void handleSaveSectionRename(sec);
                                }
                              }}
                              placeholder={copy.renameSectionEnPlaceholder}
                              className="min-w-[140px] flex-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => void handleSaveSectionRename(sec)}
                              className="rounded bg-[var(--accent-primary)] px-3 py-1 text-xs font-semibold text-[var(--accent-fg)]"
                            >
                              {isEn ? 'Save' : 'حفظ'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSectionName(null);
                                setSectionRenameError(null);
                              }}
                              className="rounded border border-[var(--border-hairline)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
                            >
                              {isEn ? 'Cancel' : 'إلغاء'}
                            </button>
                          </div>
                          {sectionRenameError && (
                            <p className="text-xs font-medium text-red-500">{sectionRenameError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Developer Actions Bar + Diagnostics */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
                <button
                  type="button"
                  onClick={handleStartNewBook}
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Add New Book' : 'إضافة كتاب جديد'}
                </button>

                <button
                  type="button"
                  onClick={handleExportCatalog}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Export catalog.json' : 'تصدير catalog.json'}
                </button>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Import catalog.json' : 'استيراد catalog.json'}
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportCatalogFile}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: isEn ? 'Restore Server Catalog' : 'استعادة فهرس الخادم',
                      message: isEn
                        ? 'All original books from the server will be restored and local edits/deletions reset. Continue?'
                        : 'سيتم استرجاع جميع الكتب الأصلية من الخادم وإلغاء عمليات الحذف والتعديلات المحلية. هل تريد المتابعة؟',
                      confirmLabel: isEn ? 'Restore Catalog' : 'استعادة الفهرس',
                      onConfirm: async () => {
                        setConfirmDialog((c) => ({ ...c, open: false }));
                        await handleServerReset();
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Restore from Server' : 'استعادة من الخادم'}
                </button>
              </div>

              <dl className="lg:col-span-5 grid grid-cols-3 gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 text-center">
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    {isEn ? 'Books' : 'الكتب'}
                  </dt>
                  <dd className="mt-1 font-mono-tabular text-lg font-bold text-[var(--text-ink)]">
                    {books.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    {isEn ? 'Catalog Ver.' : 'إصدار الفهرس'}
                  </dt>
                  <dd className="mt-1 font-mono-tabular text-sm font-bold text-[var(--text-ink)]">
                    {syncReport?.catalogVersion || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    {isEn ? 'SW Cache' : 'كاش SW'}
                  </dt>
                  <dd className="mt-1 font-mono-tabular text-lg font-bold text-[var(--text-ink)]">
                    {diagnostics?.cachedEntriesCount ?? 0}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Browser Local Books & Orphan PDF/Word Recovery */}
            <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[var(--text-ink)]">
                    {isEn
                      ? 'Local Browser Storage Scan & Recovery'
                      : 'فحص واستعادة الكتب والملفات المحلية في هذا المتصفح'}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {isEn
                      ? 'Checks this browser’s local IndexedDB for books or uploaded PDF/Word files created before Cloud SQL sync and uploads them permanently to the database.'
                      : 'يفحص ذاكرة المتصفح المحلية (IndexedDB) بحثاً عن أي كتب أو ملفات PDF/Word أضفتها قبل ربط قاعدة البيانات السحابية لرفعها وحفظها للجميع.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!onScanLocalRecoverable) return;
                    const found = await onScanLocalRecoverable();
                    const total = found.unmigratedBooks.length + found.orphanedDocuments.length;
                    setRecoveryScanMessage(
                      total > 0
                        ? isEn
                          ? `Found ${found.unmigratedBooks.length} local book(s) and ${found.orphanedDocuments.length} PDF/Word file(s) ready to restore.`
                          : `تم العثور على ${found.unmigratedBooks.length} كتاب محلي و ${found.orphanedDocuments.length} ملف PDF/Word جاهز للاستعادة.`
                        : isEn
                          ? 'No unmigrated local books or orphaned PDF/Word files found in this browser origin.'
                          : 'لا توجد كتب محلية غير مرفوعة أو ملفات PDF/Word متبقية على هذا الرابط في المتصفح.'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2 text-xs font-medium text-[var(--text-ink)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] whitespace-nowrap"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Scan Browser Storage' : 'فحص ملفات المتصفح المحفوظة'}
                </button>
              </div>

              {recoveryScanMessage && (
                <p className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-ink)]">
                  {recoveryScanMessage}
                </p>
              )}

              {localRecoverable && localRecoverable.unmigratedBooks.length > 0 && (
                <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/[0.06] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--text-ink)]">
                      {isEn
                        ? `${localRecoverable.unmigratedBooks.length} Local Book(s) Found in IndexedDB`
                        : `تم العثور على ${localRecoverable.unmigratedBooks.length} كتاب في ذاكرة المتصفح`}
                    </p>
                    {isAuthenticated && onMigrateLocalBooks && (
                      <button
                        type="button"
                        disabled={isMigratingLocal}
                        onClick={async () => {
                          setIsMigratingLocal(true);
                          try {
                            const count = await onMigrateLocalBooks();
                            setStatusNotice(
                              isEn
                                ? `Uploaded ${count} local book(s) to Cloud SQL.`
                                : `تم رفع ${count} كتاب محلي إلى قاعدة البيانات السحابية بنجاح.`
                            );
                          } finally {
                            setIsMigratingLocal(false);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        {isMigratingLocal
                          ? isEn
                            ? 'Uploading...'
                            : 'جاري الرفع...'
                          : isEn
                            ? 'Upload All to Cloud SQL'
                            : 'رفع جميع الكتب لقاعدة البيانات'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {localRecoverable.unmigratedBooks.map((item) => (
                      <span
                        key={item.book.id}
                        className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs text-[var(--text-ink)]"
                      >
                        {item.book.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {localRecoverable && localRecoverable.orphanedDocuments.length > 0 && (
                <div className="space-y-2 rounded-md border border-[var(--accent-primary)]/40 bg-[var(--bg-canvas)] p-4">
                  <p className="text-xs font-semibold text-[var(--text-ink)]">
                    {isEn
                      ? `${localRecoverable.orphanedDocuments.length} Saved PDF/Word File(s) Found in Browser`
                      : `تم العثور على ${localRecoverable.orphanedDocuments.length} ملف PDF/Word محفوظ في المتصفح`}
                  </p>
                  <div className="space-y-2">
                    {localRecoverable.orphanedDocuments.map((blob) => (
                      <div
                        key={blob.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[var(--text-ink)]">
                            {blob.fileName}
                          </p>
                          <p className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                            {(blob.data.byteLength / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        {isAuthenticated && onRestoreOrphanDocument && (
                          <button
                            type="button"
                            disabled={restoringBlobId === blob.id}
                            onClick={async () => {
                              setRestoringBlobId(blob.id);
                              try {
                                const ok = await onRestoreOrphanDocument(blob);
                                if (ok) {
                                  setStatusNotice(
                                    isEn
                                      ? `Restored "${blob.fileName}" to Cloud SQL.`
                                      : `تمت استعادة «${blob.fileName}» ككتاب في قاعدة البيانات.`
                                  );
                                }
                              } finally {
                                setRestoringBlobId(null);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 rounded bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
                          >
                            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                            {restoringBlobId === blob.id
                              ? isEn
                                ? 'Restoring...'
                                : 'جاري الاستعادة...'
                              : isEn
                                ? 'Restore as Book'
                                : 'استعادة ككتاب في المكتبة'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pending Book Submissions Review Queue */}
            <div className="space-y-4 rounded-lg border border-amber-500/45 bg-[var(--bg-surface)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                      {isEn
                        ? `Pending Book Submissions (${devPendingSubmissions.length})`
                        : `طلبات نشر الكتب بانتظار المراجعة (${devPendingSubmissions.length})`}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isEn
                        ? 'Review books submitted by users from their profiles. Approve to publish live, or decline with an optional reason; the author is notified in both cases.'
                        : 'راجع الكتب التي أرسلها المستخدمون من ملفاتهم الشخصية. وافق لنشر الكتاب للجميع أو ارفضه مع سبب اختياري؛ وسيصل إشعار لصاحب الكتاب في الحالتين.'}
                    </p>
                  </div>
                </div>
              </div>

              {devPendingSubmissions.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'No pending book submissions right now.'
                    : 'لا توجد طلبات نشر كتب بانتظار المراجعة حالياً.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {devPendingSubmissions.map((sub) => {
                    const releaseInfo = formatComingSoonReleaseLabel(sub, lang);
                    const isBusy = reviewingBookId === sub.id;
                    return (
                      <div
                        key={sub.id}
                        className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-start gap-4">
                          {sub.coverUrl ? (
                            <img
                              src={sub.coverUrl}
                              alt={sub.title}
                              referrerPolicy="no-referrer"
                              className="h-24 w-16 shrink-0 rounded border border-[var(--border-hairline)] object-cover"
                            />
                          ) : (
                            <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-500">
                                {isEn ? 'Pending Review' : 'بانتظار المراجعة'}
                              </span>
                              {sub.isPremium && (
                                <>
                                  <span className="rounded bg-amber-500 px-2 py-0.5 font-mono-tabular text-[10px] font-extrabold text-stone-950">
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
                                  <span className="text-[10px] font-semibold text-amber-500">
                                    {typeof sub.tokenPrice === 'number'
                                      ? isEn
                                        ? '(Author Price)'
                                        : '(سعر المؤلف)'
                                      : isEn
                                        ? '(Default Price)'
                                        : '(السعر الافتراضي)'}
                                  </span>
                                </>
                              )}
                              {sub.isComingSoon && (
                                <span className="rounded border border-amber-500/45 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                                  {isEn ? 'Coming Soon' : 'قريباً'}
                                  {releaseInfo ? ` · ${releaseInfo}` : ''}
                                </span>
                              )}
                              <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                                {getSectionDisplayName(sub.category, lang, sectionTranslations)}
                              </span>
                            </div>

                            <h4 className="font-editorial text-lg font-bold text-[var(--text-ink)]">
                              {sub.title}
                            </h4>
                            {sub.subtitle && (
                              <p className="text-xs text-[var(--text-muted)]">{sub.subtitle}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span>{isEn ? 'Submitted by:' : 'مُرسَل من:'}</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-ink)]">
                                <span>{sub.author}</span>
                                {sub.isAuthorVerified && (
                                  <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                                )}
                              </span>
                              <span>·</span>
                              <span>
                                {sub.bookType === 'pdf' || sub.bookType === 'word'
                                  ? `${sub.pdfPageCount ?? sub.pages} ${sub.bookType.toUpperCase()} ${copy.pagesUnit}`
                                  : `${sub.chapters.length} ${copy.chaptersWord} · ${sub.pages} ${copy.pagesUnit}`}
                              </span>
                            </div>

                            {sub.synopsis && (
                              <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                                {sub.synopsis}
                              </p>
                            )}
                          </div>

                          {onPreviewSubmission && (
                            <button
                              type="button"
                              onClick={() => onPreviewSubmission(sub)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-ink)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] shrink-0"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{isEn ? 'Inspect Book' : 'معاينة الكتاب'}</span>
                            </button>
                          )}
                        </div>

                        {onReviewSubmission && (
                          <div className="flex flex-wrap items-center gap-2.5 border-t border-[var(--border-hairline)] pt-3">
                            <input
                              type="text"
                              value={reviewNoteDrafts[sub.id] ?? ''}
                              onChange={(e) =>
                                setReviewNoteDrafts((prev) => ({
                                  ...prev,
                                  [sub.id]: e.target.value,
                                }))
                              }
                              placeholder={
                                isEn
                                  ? 'Optional rejection note for author...'
                                  : 'سبب الرفض أو ملاحظة لصاحب الكتاب (اختياري)...'
                              }
                              className="min-w-[220px] flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setReviewingBookId(sub.id);
                                try {
                                  const res = await onReviewSubmission(sub.id, 'approve');
                                  if (res.ok) {
                                    showNotice(
                                      isEn
                                        ? `Approved & published "${sub.title}". Author notified.`
                                        : `تمت الموافقة ونشر «${sub.title}» وإرسال إشعار لصاحبه.`
                                    );
                                  }
                                } finally {
                                  setReviewingBookId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{isEn ? 'Approve & Publish' : 'موافقة ونشر'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setReviewingBookId(sub.id);
                                try {
                                  const note = reviewNoteDrafts[sub.id]?.trim() || undefined;
                                  const res = await onReviewSubmission(sub.id, 'reject', note);
                                  if (res.ok) {
                                    showNotice(
                                      isEn
                                        ? `Declined "${sub.title}" and notified the author.`
                                        : `تم رفض «${sub.title}» وإرسال إشعار لصاحب الكتاب.`
                                    );
                                  }
                                } finally {
                                  setReviewingBookId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/50 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50 whitespace-nowrap"
                            >
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{isEn ? 'Reject' : 'رفض الطلب'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending Book Price Change Requests Queue */}
            <div className="space-y-4 rounded-lg border border-amber-500/45 bg-[var(--bg-surface)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
                <div className="flex items-center gap-2.5">
                  <TokenIcon className="h-5 w-5" />
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                      {isEn
                        ? `Author Price Change Requests (${devPendingPriceRequests.length})`
                        : `طلبات تعديل أسعار الكتب (${devPendingPriceRequests.length})`}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isEn
                        ? 'Authors of published premium books can propose a new price; approve to apply live or decline with an optional note.'
                        : 'يمكن لأصحاب الكتب البريميوم المنشورة اقتراح سعر جديد؛ وافق لتفعيله فوراً أو ارفض مع سبب اختياري.'}
                    </p>
                  </div>
                </div>
              </div>

              {devPendingPriceRequests.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'No pending book price change requests right now.'
                    : 'لا توجد طلبات تعديل أسعار كتب حالياً.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {devPendingPriceRequests.map((req) => {
                    const isBusy = reviewingPriceBookId === req.bookId;
                    return (
                      <div
                        key={req.bookId}
                        className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center gap-4">
                          {req.coverUrl ? (
                            <img
                              src={req.coverUrl}
                              alt={req.title}
                              referrerPolicy="no-referrer"
                              className="h-16 w-12 shrink-0 rounded border border-[var(--border-hairline)] object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="font-editorial text-base font-bold text-[var(--text-ink)]">
                              {req.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                              <span>{isEn ? 'Author:' : 'صاحب الكتاب:'}</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-ink)]">
                                <span>{req.author}</span>
                                {req.isAuthorVerified && (
                                  <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                                )}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                              <span className="text-[var(--text-muted)]">
                                {isEn ? 'Current:' : 'السعر الحالي:'}
                              </span>
                              <TokenPriceBadge
                                amount={req.effectiveCurrentPrice}
                                lang={lang}
                                size="xs"
                              />
                              <span className="font-bold text-[var(--text-muted)]">→</span>
                              <span className="font-semibold text-amber-500">
                                {isEn ? 'Requested:' : 'السعر المقترح:'}
                              </span>
                              <TokenPriceBadge
                                amount={req.proposedTokenPrice}
                                lang={lang}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        {onReviewPriceRequest && (
                          <div className="flex flex-wrap items-center gap-2.5 border-t border-[var(--border-hairline)] pt-3">
                            <input
                              type="text"
                              value={priceReviewNoteDrafts[req.bookId] ?? ''}
                              onChange={(e) =>
                                setPriceReviewNoteDrafts((prev) => ({
                                  ...prev,
                                  [req.bookId]: e.target.value,
                                }))
                              }
                              placeholder={
                                isEn
                                  ? 'Optional note for author...'
                                  : 'سبب الرفض أو ملاحظة لصاحب الكتاب (اختياري)...'
                              }
                              className="min-w-[200px] flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setReviewingPriceBookId(req.bookId);
                                try {
                                  const res = await onReviewPriceRequest(req.bookId, 'approve');
                                  if (res.ok) {
                                    showNotice(
                                      isEn
                                        ? `Approved new price for "${req.title}".`
                                        : `تمت الموافقة وتفعيل السعر الجديد لكتاب «${req.title}».`
                                    );
                                  }
                                } finally {
                                  setReviewingPriceBookId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{isEn ? 'Approve Price' : 'موافقة وتفعيل السعر'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setReviewingPriceBookId(req.bookId);
                                try {
                                  const note = priceReviewNoteDrafts[req.bookId]?.trim() || undefined;
                                  const res = await onReviewPriceRequest(req.bookId, 'reject', note);
                                  if (res.ok) {
                                    showNotice(
                                      isEn
                                        ? `Declined price change for "${req.title}".`
                                        : `تم رفض طلب تعديل سعر «${req.title}» وإشعار صاحبه.`
                                    );
                                  }
                                } finally {
                                  setReviewingPriceBookId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/50 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50 whitespace-nowrap"
                            >
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{isEn ? 'Reject' : 'رفض'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending Reader Book Reviews Moderation Queue */}
            <div className="space-y-4 rounded-lg border border-amber-500/45 bg-[var(--bg-surface)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
                <div className="flex items-center gap-2.5">
                  <MessageSquareText className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                      {isEn
                        ? `Pending Reader Reviews (${devPendingReviews.length})`
                        : `تقييمات وتعليقات القراء بانتظار الموافقة (${devPendingReviews.length})`}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isEn
                        ? 'Approve a review to publish it publicly on the book page and award author tokens, or decline with a mandatory reason.'
                        : 'وافق على التقييم ليظهر فوراً وسط تقييمات الكتاب وتُصرف مكافأة المؤلف، أو ارفضه مع توضيح سبب الرفض للقارئ.'}
                    </p>
                  </div>
                </div>
              </div>

              {devPendingReviews.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                  {isEn
                    ? 'No pending reader reviews right now.'
                    : 'لا توجد تقييمات قراء بانتظار المراجعة حالياً.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {devPendingReviews.map((rev) => {
                    const isBusy = moderatingReviewId === rev.id;
                    const errMsg = reviewModErrors[rev.id];
                    return (
                      <div
                        key={rev.id}
                        className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-start gap-4">
                          {rev.bookCoverUrl ? (
                            <img
                              src={rev.bookCoverUrl}
                              alt={rev.bookTitle}
                              referrerPolicy="no-referrer"
                              className="h-16 w-12 shrink-0 rounded border border-[var(--border-hairline)] object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-editorial text-base font-bold text-[var(--text-ink)]">
                                {rev.bookTitle}
                              </h4>
                              <StarRatingDisplay rating={rev.rating} lang={lang} compact />
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                              <span>{isEn ? 'Reader:' : 'القارئ:'}</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-ink)]">
                                <span>{rev.reviewerName}</span>
                                {rev.isVerified && (
                                  <OwnerBadge
                                    showVerifiedIcon={Boolean(rev.isVerified)}
                                    showOwnerText={false}
                                  />
                                )}
                              </span>
                            </div>

                            <p className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs leading-relaxed text-[var(--text-ink)]">
                              {rev.comment}
                            </p>
                          </div>
                        </div>

                        {onModerateReview && (
                          <div className="space-y-2 border-t border-[var(--border-hairline)] pt-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <input
                                type="text"
                                value={reviewModNoteDrafts[rev.id] ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setReviewModNoteDrafts((prev) => ({ ...prev, [rev.id]: v }));
                                  if (reviewModErrors[rev.id]) {
                                    setReviewModErrors((prev) => ({ ...prev, [rev.id]: '' }));
                                  }
                                }}
                                placeholder={
                                  isEn
                                    ? 'Required rejection reason (if rejecting)...'
                                    : 'سبب الرفض (مطلوب في حالة الرفض)...'
                                }
                                className="min-w-[200px] flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={async () => {
                                  setModeratingReviewId(rev.id);
                                  setReviewModErrors((prev) => ({ ...prev, [rev.id]: '' }));
                                  try {
                                    const res = await onModerateReview(rev.id, 'approve');
                                    if (res.ok) {
                                      showNotice(
                                        isEn
                                          ? `Approved review on "${rev.bookTitle}".`
                                          : `تمت الموافقة ونشر التقييم على «${rev.bookTitle}».`
                                      );
                                    } else {
                                      setReviewModErrors((prev) => ({
                                        ...prev,
                                        [rev.id]: res.error ?? (isEn ? 'Failed.' : 'تعذّر التنفيذ.'),
                                      }));
                                    }
                                  } finally {
                                    setModeratingReviewId(null);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap"
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{isEn ? 'Approve & Publish' : 'موافقة ونشر'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={async () => {
                                  const reason = (reviewModNoteDrafts[rev.id] ?? '').trim();
                                  if (!reason) {
                                    setReviewModErrors((prev) => ({
                                      ...prev,
                                      [rev.id]: isEn
                                        ? 'Please enter a rejection reason before rejecting.'
                                        : 'يرجى كتابة سبب الرفض أولاً قبل رفض التقييم.',
                                    }));
                                    return;
                                  }
                                  setModeratingReviewId(rev.id);
                                  setReviewModErrors((prev) => ({ ...prev, [rev.id]: '' }));
                                  try {
                                    const res = await onModerateReview(rev.id, 'reject', reason);
                                    if (res.ok) {
                                      showNotice(
                                        isEn
                                          ? `Rejected review on "${rev.bookTitle}" with reason.`
                                          : `تم رفض التقييم على «${rev.bookTitle}» وإرسال السبب للقارئ.`
                                      );
                                    } else {
                                      setReviewModErrors((prev) => ({
                                        ...prev,
                                        [rev.id]: res.error ?? (isEn ? 'Failed.' : 'تعذّر الرفض.'),
                                      }));
                                    }
                                  } finally {
                                    setModeratingReviewId(null);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/50 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50 whitespace-nowrap"
                              >
                                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{isEn ? 'Reject' : 'رفض مع السبب'}</span>
                              </button>
                            </div>
                            {errMsg && (
                              <p role="alert" className="text-xs font-semibold text-rose-500">
                                {errMsg}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* New Feature Broadcast Notification Panel */}
            {onBroadcastFeatureAnnouncement && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!announceTitleAr.trim() || !announceMsgAr.trim()) return;
                  setIsBroadcasting(true);
                  try {
                    const res = await onBroadcastFeatureAnnouncement({
                      titleAr: announceTitleAr.trim(),
                      titleEn: announceTitleEn.trim() || undefined,
                      messageAr: announceMsgAr.trim(),
                      messageEn: announceMsgEn.trim() || undefined,
                      targetView: announceTargetView,
                      targetSection:
                        announceTargetView === 'you' && announceTargetSection.trim()
                          ? announceTargetSection.trim()
                          : null,
                    });
                    if (res.ok) {
                      setAnnounceTitleAr('');
                      setAnnounceTitleEn('');
                      setAnnounceMsgAr('');
                      setAnnounceMsgEn('');
                      showNotice(
                        isEn
                          ? `Feature notification sent to ${res.recipientsCount ?? 0} account(s)!`
                          : `تم إرسال إشعار الميزة الجديدة إلى جميع الحسابات (${res.recipientsCount ?? 0} حساب)!`
                      );
                    }
                  } finally {
                    setIsBroadcasting(false);
                  }
                }}
                className="space-y-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
              >
                <div className="flex items-center gap-2.5 border-b border-[var(--border-hairline)] pb-3">
                  <Megaphone className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                      {isEn
                        ? 'Broadcast New Feature Notification to All Accounts'
                        : 'إرسال إشعار ميزة جديدة لكل الحسابات'}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isEn
                        ? 'Every user account receives this alert and jumps straight to the target feature when tapping the notification.'
                        : 'يصل الإشعار لكل الحسابات فوراً ولأي حساب جديد يسجل لاحقاً، وعند الضغط عليه ينتقل القارئ للميزة مباشرة لتجربتها.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Notification Title (Arabic) *' : 'عنوان الإشعار بالعربية *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={announceTitleAr}
                      onChange={(e) => setAnnounceTitleAr(e.target.value)}
                      placeholder={
                        isEn ? 'e.g. New Feature Added!' : 'مثال: ميزة جديدة أُضيفت للتطبيق!'
                      }
                      className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Notification Title (English, optional)' : 'عنوان الإشعار بالإنجليزية (اختياري)'}
                    </label>
                    <input
                      type="text"
                      value={announceTitleEn}
                      onChange={(e) => setAnnounceTitleEn(e.target.value)}
                      placeholder="New Feature Available!"
                      className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Message (Arabic) *' : 'تفاصيل الميزة بالعربية *'}
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={announceMsgAr}
                      onChange={(e) => setAnnounceMsgAr(e.target.value)}
                      placeholder={
                        isEn
                          ? 'Describe the feature and invite readers to try it...'
                          : 'اشرح الميزة الجديدة واضغط هنا لتجربتها الآن...'
                      }
                      className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Message (English, optional)' : 'تفاصيل الميزة بالإنجليزية (اختياري)'}
                    </label>
                    <textarea
                      rows={2}
                      value={announceMsgEn}
                      onChange={(e) => setAnnounceMsgEn(e.target.value)}
                      placeholder="Tap to jump directly to the new feature and try it out."
                      className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Destination Page When Clicked' : 'الصفحة التي يُفتح عليها الإشعار'}
                    </label>
                    <select
                      value={announceTargetView}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAnnounceTargetView(v);
                        if (v !== 'you') {
                          setAnnounceTargetSection('');
                        } else if (!announceTargetSection) {
                          setAnnounceTargetSection('publish-studio');
                        }
                      }}
                      className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                    >
                      <option value="you">
                        {isEn ? 'Profile & Publish Studio (أنت)' : 'صفحة الملف الشخصي والنشر (أنت)'}
                      </option>
                      <option value="catalog">{isEn ? 'Library Catalog (المكتبة)' : 'فهرس المكتبة'}</option>
                      <option value="premium">{isEn ? 'Premium VIP Vault (بريميوم)' : 'قسم البريميوم VIP'}</option>
                      <option value="reading">{isEn ? 'My Reading (قراءاتي)' : 'صفحة قراءاتي'}</option>
                      <option value="home">{isEn ? 'Home Page (الرئيسية)' : 'الصفحة الرئيسية'}</option>
                      <option value="settings">{isEn ? 'Settings (الإعدادات)' : 'الإعدادات'}</option>
                    </select>
                  </div>

                  {announceTargetView === 'you' && (
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)]">
                        {isEn ? 'Scroll to Section (optional)' : 'القسم المستهدف داخل الصفحة (اختياري)'}
                      </label>
                      <select
                        value={announceTargetSection}
                        onChange={(e) => setAnnounceTargetSection(e.target.value)}
                        className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                      >
                        <option value="publish-studio">
                          {isEn ? 'Publish Your Book Studio' : 'قسم نشر كتاب من حسابك (#publish-studio)'}
                        </option>
                        <option value="">{isEn ? 'Top of Profile Page' : 'أعلى صفحة الملف الشخصي'}</option>
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {isBroadcasting
                      ? isEn
                        ? 'Sending to all accounts...'
                        : 'جاري الإرسال لكل الحسابات...'
                      : isEn
                        ? 'Send Feature Alert to All Accounts'
                        : 'إرسال الإشعار لجميع الحسابات الآن'}
                  </span>
                </button>
              </form>
            )}

            {/* Book Creator / Editor + Existing Books List */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleSubmitBook}
                className="lg:col-span-7 space-y-5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                    {editingBook
                      ? isEn
                        ? `Edit Book: ${editingBook.title}`
                        : `تعديل كتاب: ${editingBook.title}`
                      : isEn
                        ? 'Add New Book (Text, PDF or Word)'
                        : 'إضافة كتاب جديد (نصي أو PDF أو Word)'}
                  </h3>
                  {editingBook && (
                    <button
                      type="button"
                      onClick={handleStartNewBook}
                      className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                    >
                      {isEn ? 'Cancel Edit' : 'إلغاء التعديل'}
                    </button>
                  )}
                </div>

                {/* Publication Status: Publish Now vs Coming Soon (with 3 schedule modes) */}
                <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--text-ink)]">
                      {isEn ? 'Release Status' : 'حالة نشر الكتاب'}
                    </p>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {formBook.isComingSoon
                        ? isEn
                          ? 'Readers see Coming Soon + Notify Me button'
                          : 'يظهر للجميع بعلامة Coming Soon مع زر ذكّرني'
                        : isEn
                          ? 'Published immediately for reading'
                          : 'يُنشر فوراً ويُتاح للقراءة'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormBook((prev) => ({
                          ...prev,
                          isComingSoon: false,
                        }))
                      }
                      className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                        !formBook.isComingSoon
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-ink)]'
                      }`}
                    >
                      {isEn ? 'Publish Now' : 'منشور الآن (متاح للقراءة)'}
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
                        {isEn
                          ? 'Expected Release Schedule:'
                          : 'تحديد ميعاد نزول الكتاب القادم:'}
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
                              ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-semibold'
                              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-ink)]'
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
                              ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-semibold'
                              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-ink)]'
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
                              ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-semibold'
                              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-ink)]'
                          }`}
                        >
                          {isEn ? 'Exact Date & Time' : 'ميعاد معين (تاريخ وساعة)'}
                        </button>
                      </div>

                      {formBook.comingSoonMode === 'date' && (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                            {isEn ? 'Select upcoming release day (or pick quick days):' : 'اختر يوم النشر القادم (أو اختر عدد الأيام):'}
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[1, 3, 7, 14, 30].map((days) => (
                              <button
                                key={days}
                                type="button"
                                onClick={() => {
                                  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                                  const pad = (n: number) => String(n).padStart(2, '0');
                                  const dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                                  setFormBook((prev) => ({
                                    ...prev,
                                    comingSoonReleaseAt: dateVal,
                                  }));
                                }}
                                className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-ink)] hover:border-amber-500 hover:text-amber-500"
                              >
                                {isEn ? `+${days}d` : `بعد ${days} ${days === 1 ? 'يوم' : days <= 10 ? 'أيام' : 'يوماً'}`}
                              </button>
                            ))}
                          </div>
                          <input
                            type="date"
                            dir="ltr"
                            value={(formBook.comingSoonReleaseAt ?? '').slice(0, 10)}
                            onChange={(e) =>
                              setFormBook((prev) => ({
                                ...prev,
                                comingSoonReleaseAt: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {formBook.comingSoonMode === 'datetime' && (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                            {isEn
                              ? 'Select exact scheduled date & time (or pick quick hours):'
                              : 'اختر التاريخ والساعة المحددة للنزول (أو اختر عدد الساعات):'}
                          </label>
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
                                  setFormBook((prev) => ({
                                    ...prev,
                                    comingSoonReleaseAt: dtVal,
                                  }));
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
                              setFormBook((prev) => ({
                                ...prev,
                                comingSoonReleaseAt: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
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
                            ? 'Open mode: Uploading a PDF/Word file or writing chapters is completely optional right now. You can add the PDF later and either publish immediately or keep it Coming Soon as long as you want.'
                            : 'وضع مفتوح: لست مجبراً على رفع ملف PDF أو كتابة فصول الآن! يمكنك تنزيل البطاقة كـ Coming Soon الآن، وعندما ترفع الـ PDF لاحقاً يمكنك نشره فوراً أو إبقاءه في «قريباً» للمدة التي تريدها.'
                          : isEn
                            ? 'Scheduled release: Because you set a specific date/time (days or hours) for automatic publishing, attaching the PDF/Word file or writing at least one chapter is required so it launches automatically on time.'
                            : 'ميعاد محدد (ساعات أو أيام): لأن الكتاب سينزل تلقائياً في الموعد المحدد، يجب رفع ملف PDF/Word أو كتابة فصل واحد على الأقل الآن.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Book Type Switch */}
                <div className="grid grid-cols-2 gap-2 rounded-md bg-[var(--bg-canvas)] p-1 border border-[var(--border-hairline)]">
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
                    <FileText
                      className="mx-auto h-7 w-7 text-[var(--accent-primary)]"
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-xs font-medium text-[var(--text-ink)]">
                      {isParsingPdf
                        ? isEn
                          ? 'Reading document and paginating book sheets...'
                          : 'جاري قراءة الملف وتجهيز صفحات الكتاب...'
                        : pendingPdfBuffer
                          ? isEn
                            ? `Ready (${formBook.bookType === 'word' ? 'Word' : 'PDF'}): ${pendingPdfBuffer.fileName} (${formBook.pdfPageCount} pages)`
                            : `تم تجهيز (${formBook.bookType === 'word' ? 'Word' : 'PDF'}): ${pendingPdfBuffer.fileName} (${formBook.pdfPageCount} صفحة)`
                          : formBook.pdfId
                            ? isEn
                              ? `Saved ${formBook.bookType === 'word' ? 'Word' : 'PDF'} book (${formBook.pdfPageCount} pages)`
                              : `ملف ${formBook.bookType === 'word' ? 'Word' : 'PDF'} محفوظ (${formBook.pdfPageCount} صفحة)`
                            : formBook.isComingSoon && (formBook.comingSoonMode ?? 'open') === 'open'
                              ? isEn
                                ? 'Optional in Open Coming Soon — leave empty for now and upload the PDF/Word anytime later'
                                : 'اختياري في وضع «قريباً — مفتوح» — تقدر تسيبه فاضي دلوقتي وترفع ملف الـ PDF لاحقاً براحتك'
                              : formBook.isComingSoon
                                ? isEn
                                  ? 'Required for scheduled release — upload the PDF or Word file so it publishes automatically on time'
                                  : 'مطلوب للميعاد المحدد — ارفع ملف PDF أو Word لينزل الكتاب تلقائياً في موعده'
                                : isEn
                                  ? 'Upload a PDF or Word (.docx) file to turn its sheets as an animated flipbook'
                                  : 'ارفع ملف PDF أو Word (.docx) للتعامل معه كصفحات كتاب تتقلب بالأنيميشن'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--btn-dark)] px-4 py-2 text-xs font-medium text-[var(--btn-dark-fg)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)]">
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        {pendingPdfBuffer || formBook.pdfId
                          ? isEn
                            ? 'Replace PDF / Word File'
                            : 'تغيير ملف PDF / Word'
                          : isEn
                            ? 'Choose PDF or Word File'
                            : 'اختيار ملف PDF أو Word'}
                        <input
                          type="file"
                          accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.doc"
                          onChange={handleDocumentUpload}
                          className="sr-only"
                        />
                      </label>
                      {(pendingPdfBuffer || formBook.pdfId) && (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingPdfBuffer(null);
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

                    {formBook.isComingSoon && (pendingPdfBuffer || formBook.pdfId) && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-500/35 bg-emerald-500/[0.07] px-3 py-2 text-start text-[11px] text-emerald-700 dark:text-emerald-300">
                        <span>
                          {isEn
                            ? 'File ready! You can publish it now immediately or keep it in Coming Soon as long as you wish.'
                            : 'الملف جاهز! يمكنك الآن نشر الكتاب فوراً أو إبقاءه في «قريباً» (مفتوح أو بميعاد) للمدة التي تريدها.'}
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
                          {isEn ? 'Switch to Publish Now' : 'نشر الآن'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Book Title *' : 'عنوان الكتاب *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formBook.title}
                      onChange={(e) => setFormBook({ ...formBook, title: e.target.value })}
                      placeholder={isEn ? 'e.g. Contemporary Book Craft' : 'مثال: فن الوراقة المعاصر'}
                      className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Book Owner Account (Google Account)' : 'حساب صاحب الكتاب (حساب Google)'}
                    </label>
                    <select
                      value={formBook.authorUid ?? ''}
                      onChange={(e) => {
                        const nextUid = e.target.value || null;
                        const matched = devUsersList.find((u) => u.uid === nextUid);
                        if (matched) {
                          setFormBook({
                            ...formBook,
                            authorUid: matched.uid,
                            author: matched.displayName,
                            isAuthorVerified: Boolean(matched.isVerified),
                          });
                        } else {
                          setFormBook({
                            ...formBook,
                            authorUid: null,
                          });
                        }
                      }}
                      className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                    >
                      <option value="">
                        {isEn
                          ? '— Select Google Account (optional manual name) —'
                          : '— اختر حساب صاحب الكتاب (أو اكتب الاسم يدوياً) —'}
                      </option>
                      {devUsersList.map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName} ({u.email}){u.isVerified ? (isEn ? ' · Verified ✓' : ' · موثق ✓') : ''}
                        </option>
                      ))}
                    </select>

                    <label className="mt-3 block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Author Display Name *' : 'اسم المؤلف / صاحب الكتاب *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formBook.author}
                      onChange={(e) => setFormBook({ ...formBook, author: e.target.value })}
                      placeholder={isEn ? 'e.g. Dr. Layla Abdulrahman' : 'مثال: د. ليلى عبد الرحمن'}
                      className="mt-1.5 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                    {formBook.authorUid && (
                      <div className="mt-1.5 space-y-1.5">
                        <p className="text-[11px] text-[var(--accent-primary)]">
                          {isEn
                            ? 'Linked to Google account — this book appears in their "You" profile with their name and verified badge.'
                            : 'مربوط بحساب جوجل — سيظهر هذا الكتاب في صفحة «أنت» الخاصة بصاحب الحساب وباسمه وعلامة التوثيق الخاصة به.'}
                        </p>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-ink)] select-none">
                          <input
                            type="checkbox"
                            checked={notifyFollowersOnSave}
                            onChange={(e) => setNotifyFollowersOnSave(e.target.checked)}
                            className="h-4 w-4 accent-emerald-500"
                          />
                          <span>
                            {isEn
                              ? "Notify owner's followers of a new release"
                              : 'إرسال إشعار لمتابعي صاحب الكتاب بوجود إصدار جديد'}
                          </span>
                        </label>
                      </div>
                    )}
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-ink)] select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(formBook.isAuthorVerified)}
                        onChange={(e) =>
                          setFormBook({ ...formBook, isAuthorVerified: e.target.checked })
                        }
                        className="h-4 w-4 accent-[#1D9BF0]"
                      />
                      <span>
                        {isEn
                          ? 'Show Verified badge next to author name'
                          : 'إظهار علامة التوثيق (Verified) بجانب اسم المؤلف'}
                      </span>
                      {formBook.isAuthorVerified && (
                        <OwnerBadge showOwnerText={false} iconClassName="h-4 w-4" />
                      )}
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--text-muted)]">
                      {isEn ? 'Subtitle' : 'العنوان الفرعي'}
                    </label>
                    <input
                      type="text"
                      value={formBook.subtitle}
                      onChange={(e) => setFormBook({ ...formBook, subtitle: e.target.value })}
                      placeholder={
                        isEn ? 'Brief tagline shown under the title' : 'وصف مختصر يظهر تحت العنوان'
                      }
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
                      {!sections.includes(formBook.category) && formBook.category && (
                        <option value={formBook.category}>
                          {formatSectionHeading(formBook.category, lang, sectionTranslations)}
                        </option>
                      )}
                      {sections.map((sec) => (
                        <option key={sec} value={sec}>
                          {formatSectionHeading(sec, lang, sectionTranslations)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <SeriesEditorField
                  currentBook={formBook}
                  availableBooks={books.filter(
                    (b) => b.id !== formBook.id && b.reviewStatus !== 'rejected'
                  )}
                  lang={lang}
                  onChange={(patch) => setFormBook((prev) => ({ ...prev, ...patch }))}
                />

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

                {/* Explicit Prompt: Is this book Premium? + Custom 10-Digit Code with Duplicate Validation */}
                <div className="rounded-md border border-amber-500/40 bg-[var(--bg-canvas)] p-4 space-y-3">
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
                          ? 'border-amber-500 bg-amber-500 text-stone-950 font-semibold'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-amber-500 hover:text-amber-500'
                      }`}
                    >
                      {isEn ? 'Yes, Premium Book (Code Locked)' : 'نعم، كتاب بريميوم (مقفل بكود)'}
                    </button>
                  </div>

                  {formBook.isPremium && (
                    <div className="space-y-3 pt-2 border-t border-[var(--border-hairline)]">
                      <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                        {isEn
                          ? 'Single-use code — automatically generates a new 10-digit code after each activation.'
                          : 'كود استخدام واحد — يتجدد تلقائياً بكود جديد فور تفعيله من أي قارئ لمنع المشاركة.'}
                      </p>

                      <label
                        htmlFor="new-book-premium-code"
                        className="block text-xs font-medium text-amber-600 dark:text-amber-400"
                      >
                        {isEn
                          ? 'Active Single-Use Code (10 digits, or leave blank to auto-generate):'
                          : 'كود التفعيل الحالي (10 أرقام، أو اتركه فارغاً للتوليد التلقائي):'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="new-book-premium-code"
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={formBook.unlockCode ?? ''}
                          onChange={(e) => handleBookCodeChange(e.target.value)}
                          placeholder={isEn ? '10 digits...' : '10 أرقام...'}
                          dir="ltr"
                          className={`flex-1 rounded border bg-[var(--bg-surface)] px-3 py-2 text-center font-mono-tabular text-sm tracking-widest text-[var(--text-ink)] focus:outline-none ${
                            formCodeError
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-[var(--border-hairline)] focus:border-amber-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleGenerateUniqueBookCode}
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

                      <div className="border-t border-[var(--border-hairline)] pt-2.5 space-y-2.5">
                        <div>
                          <label
                            htmlFor="new-book-token-price"
                            className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                          >
                            <TokenIcon className="h-3.5 w-3.5" />
                            <span>
                              {isEn
                                ? `Custom Golden Token Price (leave empty for default: ${economyConfig?.defaultPremiumBookPrice ?? 40}):`
                                : `سعر الكتاب بالعملات الذهبية (اتركه فارغاً للسعر الافتراضي: ${economyConfig?.defaultPremiumBookPrice ?? 40}):`}
                            </span>
                          </label>
                          <input
                            id="new-book-token-price"
                            type="number"
                            min={0}
                            max={100000}
                            dir="ltr"
                            value={formBook.tokenPrice ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setFormBook((prev) => ({
                                ...prev,
                                tokenPrice: raw === '' ? null : Math.max(0, Math.floor(Number(raw) || 0)),
                              }));
                            }}
                            placeholder={String(economyConfig?.defaultPremiumBookPrice ?? 40)}
                            className="mt-1.5 w-36 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-center font-mono-tabular text-xs font-bold text-[var(--text-ink)] focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap items-end gap-3 border-t border-[var(--border-hairline)] pt-2.5">
                          <div>
                            <label
                              htmlFor="new-book-discount-percent"
                              className="flex items-center gap-1.5 text-xs font-medium text-rose-500"
                            >
                              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>
                                {isEn ? 'Sale Discount % (1-99, optional):' : 'نسبة خصم السيل % (اختياري):'}
                              </span>
                            </label>
                            <input
                              id="new-book-discount-percent"
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
                              className="mt-1.5 w-28 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-center font-mono-tabular text-xs font-bold text-rose-500 focus:border-rose-500 focus:outline-none"
                            />
                          </div>

                          {typeof formBook.discountPercent === 'number' &&
                            formBook.discountPercent >= 1 && (
                              <>
                                {formBook.isComingSoon && (
                                  <div>
                                    <label
                                      htmlFor="new-book-discount-post-release-days"
                                      className="block text-xs font-medium text-rose-500"
                                    >
                                      {isEn
                                        ? 'Keep Sale After Launch (days):'
                                        : 'يستمر الخصم بعد النشر (أيام):'}
                                    </label>
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                      <input
                                        id="new-book-discount-post-release-days"
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
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFormBook((prev) => ({
                                            ...prev,
                                            discountPostReleaseDays: 2,
                                            discountEndsAt: '',
                                          }))
                                        }
                                        className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-500/20"
                                      >
                                        {isEn ? '2 days' : 'يومان'}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {!(
                                  formBook.isComingSoon &&
                                  typeof formBook.discountPostReleaseDays === 'number' &&
                                  formBook.discountPostReleaseDays >= 1
                                ) && (
                                  <div>
                                    <label
                                      htmlFor="new-book-discount-ends"
                                      className="block text-xs font-medium text-[var(--text-muted)]"
                                    >
                                      {isEn
                                        ? 'Sale End Date/Time (blank = open):'
                                        : 'ميعاد انتهاء السيل (فارغ = مفتوح):'}
                                    </label>
                                    <input
                                      id="new-book-discount-ends"
                                      type="datetime-local"
                                      dir="ltr"
                                      value={formBook.discountEndsAt ?? ''}
                                      onChange={(e) =>
                                        setFormBook((prev) => ({
                                          ...prev,
                                          discountEndsAt: e.target.value,
                                          discountPostReleaseDays: null,
                                        }))
                                      }
                                      className="mt-1.5 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono-tabular text-xs text-[var(--text-ink)] focus:border-rose-500 focus:outline-none"
                                    />
                                  </div>
                                )}
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cover Upload & Live Preview */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)]">
                    {isEn ? 'Book Cover' : 'غلاف الكتاب'}
                  </label>

                  <div className="mt-2 flex flex-wrap items-start gap-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
                    <div className="aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                      {formBook.coverUrl ? (
                        <img
                          src={formBook.coverUrl}
                          alt={formBook.title || (isEn ? 'Cover preview' : 'معاينة غلاف الكتاب')}
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

                    <div className="flex flex-1 flex-col justify-between gap-3 min-w-[200px]">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[var(--text-ink)]">
                          {formBook.coverUrl
                            ? isEn
                              ? 'Cover preview ready'
                              : 'معاينة الغلاف جاهزة أمامك قبل حفظ الكتاب'
                            : isEn
                              ? 'Upload a cover image from your device'
                              : 'ارفع صورة الغلاف من جهازك لمعاينتها قبل إضافة الكتاب'}
                        </p>
                        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                          {isEn
                            ? 'The uploaded image appears right here immediately so you can inspect or change it before saving.'
                            : 'بمجرد اختيار الصورة ستظهر في مكانها فوراً لتراجع شكلها أو تغيرها قبل حفظ الكتاب.'}
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

                {/* Chapters Builder (only for text books) */}
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
                                onClick={() => requestRemoveChapter(idx, ch.title)}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
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

                <label className="flex items-center gap-2 text-xs text-[var(--text-ink)]">
                  <input
                    type="checkbox"
                    checked={Boolean(formBook.featured)}
                    onChange={(e) => setFormBook({ ...formBook, featured: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent-primary)]"
                  />
                  {isEn
                    ? 'Set as Featured Edition on library homepage'
                    : 'تعيين كإصدار مختار في واجهة المكتبة'}
                </label>

                <button
                  type="submit"
                  disabled={isSavingBook || isParsingPdf || Boolean(formCodeError)}
                  className="w-full rounded-md bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {isSavingBook
                    ? isEn
                      ? 'Saving...'
                      : 'جاري الحفظ...'
                    : formBook.isComingSoon
                      ? editingBook
                        ? isEn
                          ? 'Save Coming Soon Changes'
                          : 'حفظ تعديلات كتاب قريباً (Coming Soon)'
                        : isEn
                          ? 'Add as Coming Soon'
                          : 'إضافة ككتاب قريباً (Coming Soon)'
                      : editingBook
                        ? isEn
                          ? 'Save Changes for All Users'
                          : 'حفظ التعديلات للجميع'
                        : isEn
                          ? 'Publish Book to Library'
                          : 'نشر الكتاب في المكتبة للجميع'}
                </button>
              </form>

              {/* Existing Books List */}
              {(() => {
                const publishedList = books.filter(
                  (b) => b.reviewStatus !== 'pending' && b.reviewStatus !== 'rejected'
                );
                const PUBLISHED_BOOKS_PREVIEW_LIMIT = 4;
                const hasMorePublishedBooks = publishedList.length > PUBLISHED_BOOKS_PREVIEW_LIMIT;
                const visiblePublishedBooks = showAllPublishedBooks
                  ? publishedList
                  : publishedList.slice(0, PUBLISHED_BOOKS_PREVIEW_LIMIT);
                const hiddenPublishedCount = Math.max(
                  0,
                  publishedList.length - PUBLISHED_BOOKS_PREVIEW_LIMIT
                );

                return (
                  <div className="lg:col-span-5 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-editorial text-xl font-bold text-[var(--text-ink)]">
                          {isEn
                            ? `Currently Published Books (${publishedList.length})`
                            : `الكتب المنشورة حالياً (${publishedList.length})`}
                        </h3>
                        {hasMorePublishedBooks && !showAllPublishedBooks && (
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {isEn
                              ? `Showing ${PUBLISHED_BOOKS_PREVIEW_LIMIT} of ${publishedList.length}`
                              : `عرض ${PUBLISHED_BOOKS_PREVIEW_LIMIT} من ${publishedList.length}`}
                          </span>
                        )}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-muted)] select-none">
                        <input
                          type="checkbox"
                          checked={notifyFollowersOnAssign}
                          onChange={(e) => setNotifyFollowersOnAssign(e.target.checked)}
                          className="h-3.5 w-3.5 accent-emerald-500"
                        />
                        <span>
                          {isEn
                            ? 'Notify followers when linking a book to an account'
                            : 'إشعار المتابعين بإصدار جديد عند ربط كتاب بحساب'}
                        </span>
                      </label>
                    </div>
                    <div className="divide-y divide-[var(--border-hairline)] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                      {visiblePublishedBooks.map((book) => {
                    const releaseInfo = formatComingSoonReleaseLabel(book, lang);
                    return (
                    <div key={book.id} className="space-y-2.5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate font-editorial text-base font-bold text-[var(--text-ink)]">
                              {book.title}
                            </p>
                            {book.isComingSoon && (
                              <span className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                                <Bell className="h-2.5 w-2.5" aria-hidden="true" />
                                {isEn ? 'Coming Soon' : 'قريباً'}
                                {releaseInfo ? ` · ${releaseInfo}` : ''}
                                {(book.notifySubscribersCount ?? 0) > 0
                                  ? ` (${book.notifySubscribersCount})`
                                  : ''}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
                            <span>{book.author}</span>
                            {book.isAuthorVerified && (
                              <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                            )}
                            <span>{' · '}</span>
                            <span>
                              {book.isComingSoon
                                ? isEn
                                  ? 'Not yet published'
                                  : 'لم يُنشر بعد'
                                : book.bookType === 'pdf' || book.bookType === 'word'
                                  ? isEn
                                    ? `${book.pdfPageCount ?? book.pages} ${book.bookType === 'word' ? 'Word' : 'PDF'} pages`
                                    : `${book.pdfPageCount ?? book.pages} صفحة ${book.bookType === 'word' ? 'Word' : 'PDF'}`
                                  : isEn
                                    ? `${book.chapters.length} chapters`
                                    : `${book.chapters.length} فصول`}
                              {book.isPremium ? (isEn ? ' · VIP' : ' · بريميوم') : ''}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditExistingBook(book)}
                            className="rounded p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-ink)]"
                            aria-label={isEn ? `Edit ${book.title}` : `تعديل ${book.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                title: isEn ? 'Confirm Book Deletion' : 'تأكيد حذف الكتاب',
                                message: isEn
                                  ? `Are you sure you want to permanently delete "${book.title}" from the library?`
                                  : `هل أنت متأكد أنك تريد حذف كتاب «${book.title}» نهائياً من المكتبة؟`,
                                confirmLabel: isEn ? 'Delete Book' : 'حذف الكتاب',
                                onConfirm: async () => {
                                  await onDeleteBook(book.id, book.pdfId);
                                  setConfirmDialog((c) => ({ ...c, open: false }));
                                  showNotice(
                                    isEn ? `Deleted "${book.title}".` : `تم حذف «${book.title}».`
                                  );
                                },
                              })
                            }
                            className="rounded p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--accent-primary)]"
                            aria-label={isEn ? `Delete ${book.title}` : `حذف ${book.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <label
                          htmlFor={`book-section-${book.id}`}
                          className="text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap"
                        >
                          {copy.assignSectionLabel}
                        </label>
                        <select
                          id={`book-section-${book.id}`}
                          value={book.category}
                          onChange={async (e) => {
                            const nextSec = e.target.value;
                            await onAssignBookSection(book.id, nextSec);
                            const secDisplay = getSectionDisplayName(
                              nextSec,
                              lang,
                              sectionTranslations
                            );
                            showNotice(
                              isEn
                                ? `Moved "${book.title}" to "${secDisplay}".`
                                : `تم نقل «${book.title}» إلى قسم «${secDisplay}».`
                            );
                          }}
                          className="flex-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                        >
                          {!sections.includes(book.category) && book.category && (
                            <option value={book.category}>
                              {formatSectionHeading(book.category, lang, sectionTranslations)}
                            </option>
                          )}
                          {sections.map((sec) => (
                            <option key={sec} value={sec}>
                              {formatSectionHeading(sec, lang, sectionTranslations)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            const nextVal = !book.isAuthorVerified;
                            await onToggleBookAuthorVerified(book.id, nextVal);
                            showNotice(
                              isEn
                                ? nextVal
                                  ? `Verified badge enabled for "${book.author}".`
                                  : `Verified badge removed for "${book.author}".`
                                : nextVal
                                  ? `تم تفعيل علامة التوثيق للمؤلف «${book.author}».`
                                  : `تم إزالة علامة التوثيق عن المؤلف «${book.author}».`
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            book.isAuthorVerified
                              ? 'border-[#1D9BF0]/40 bg-[#1D9BF0]/10 text-[#1D9BF0] hover:bg-[#1D9BF0]/20'
                              : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:border-[#1D9BF0]/50 hover:text-[var(--text-ink)]'
                          }`}
                        >
                          {book.isAuthorVerified ? (
                            <>
                              <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
                              <span>{isEn ? 'Verified ✓' : 'موثق ✓'}</span>
                            </>
                          ) : (
                            <span>{isEn ? 'Verify Author' : 'توثيق الكاتب'}</span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`book-owner-${book.id}`}
                          className="text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap"
                        >
                          {isEn ? 'Owner:' : 'صاحب الكتاب:'}
                        </label>
                        <select
                          id={`book-owner-${book.id}`}
                          value={book.authorUid ?? ''}
                          onChange={async (e) => {
                            const nextUid = e.target.value || null;
                            await onAssignBookOwner(book.id, nextUid, notifyFollowersOnAssign);
                            const matched = devUsersList.find((u) => u.uid === nextUid);
                            showNotice(
                              isEn
                                ? matched
                                  ? `Linked "${book.title}" to ${matched.displayName}.`
                                  : `Unlinked owner account from "${book.title}".`
                                : matched
                                  ? `تم ربط «${book.title}» بحساب ${matched.displayName}.`
                                  : `تم إلغاء ربط «${book.title}» بحساب.`
                            );
                          }}
                          className="flex-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
                        >
                          <option value="">
                            {isEn ? '— No Linked Account —' : '— غير مربوط بحساب —'}
                          </option>
                          {devUsersList.map((u) => (
                            <option key={u.uid} value={u.uid}>
                              {u.displayName} ({u.email}){u.isVerified ? ' ✓' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
                </div>
                {hasMorePublishedBooks && (
                  <button
                    type="button"
                    onClick={() => setShowAllPublishedBooks((prev) => !prev)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                  >
                    {showAllPublishedBooks ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isEn ? 'Show Less' : 'عرض أقل'}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {isEn
                            ? `Show All (${hiddenPublishedCount} more books)`
                            : `عرض الكل (+${hiddenPublishedCount} كتب إضافية)`}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
                );
              })()}
            </div>
          </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((c) => ({ ...c, open: false }))}
        lang={lang}
      />
    </section>
  );
};
