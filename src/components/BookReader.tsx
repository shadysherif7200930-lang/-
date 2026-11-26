import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  List,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { getBookRating } from '../bookRatings';
import type { AppSettings, BookRecord, ReadingProgress } from '../db/booksDb';
import { getSectionDisplayName } from '../i18n';
import { OwnerBadge, RateBookButton, StarRatingDisplay } from './BookRatingBar';

type ReaderTheme = 'app' | 'paper' | 'sepia' | 'night';

interface BookReaderProps {
  book: BookRecord;
  appSettings: AppSettings;
  sectionTranslations?: Record<string, string>;
  initialProgress?: ReadingProgress;
  onSaveProgress: (progress: ReadingProgress) => void;
  onRateBook?: (book: BookRecord) => void;
  onClose: () => void;
}

const THEME_STYLES: Record<
  ReaderTheme,
  {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
  }
> = {
  app: {
    bg: 'bg-[var(--bg-canvas)]',
    surface: 'bg-[var(--bg-surface)]',
    text: 'text-[var(--text-ink)]',
    muted: 'text-[var(--text-muted)]',
    border: 'border-[var(--border-hairline)]',
    accent: 'text-[var(--accent-primary)]',
  },
  paper: {
    bg: 'bg-[#FBF9F5]',
    surface: 'bg-[#F3EFE6]',
    text: 'text-[#1C1917]',
    muted: 'text-stone-600',
    border: 'border-stone-200',
    accent: 'text-[#9A3412]',
  },
  sepia: {
    bg: 'bg-[#F3EAD8]',
    surface: 'bg-[#E9DEC8]',
    text: 'text-[#2D2418]',
    muted: 'text-[#6B5B47]',
    border: 'border-[#D9CCB4]',
    accent: 'text-[#8C2D0F]',
  },
  night: {
    bg: 'bg-[#161514]',
    surface: 'bg-[#201E1C]',
    text: 'text-[#E7E5E4]',
    muted: 'text-[#A8A29E]',
    border: 'border-[#2E2B28]',
    accent: 'text-[#FDBA74]',
  },
};

const WIDTH_CLASS: Record<AppSettings['readerWidth'], string> = {
  narrow: 'max-w-xl',
  medium: 'max-w-2xl',
  wide: 'max-w-3xl',
};

const LINE_HEIGHT_CLASS: Record<AppSettings['readerLineHeight'], string> = {
  relaxed: 'leading-[1.8]',
  loose: 'leading-[1.95]',
  airy: 'leading-[2.15]',
};

const MIN_FONT_SIZE = 15;
const MAX_FONT_SIZE = 44;

export const BookReader: React.FC<BookReaderProps> = ({
  book,
  appSettings,
  sectionTranslations,
  initialProgress,
  onSaveProgress,
  onRateBook,
  onClose,
}) => {
  const [chapterIndex, setChapterIndex] = useState(
    Math.min(initialProgress?.chapterIndex ?? 0, Math.max(0, book.chapters.length - 1))
  );
  const [bookmarks, setBookmarks] = useState<number[]>(initialProgress?.bookmarks ?? []);
  const [fontSize, setFontSize] = useState<number>(appSettings.readerFontSize);
  const [theme, setTheme] = useState<ReaderTheme>('app');
  const [showToc, setShowToc] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const readerRootRef = useRef<HTMLDivElement | null>(null);
  const nativeFullscreenRef = useRef<boolean>(false);

  const chapter = book.chapters[chapterIndex] ?? book.chapters[0];
  const palette = THEME_STYLES[theme];
  const isBookmarked = bookmarks.includes(chapterIndex);
  const lang = appSettings.language ?? 'ar';
  const isEn = lang === 'en';

  useEffect(() => {
    const onFullscreenChange = () => {
      const isNativeActive = Boolean(document.fullscreenElement);
      if (nativeFullscreenRef.current && !isNativeActive) {
        setIsFullscreen(false);
      }
      nativeFullscreenRef.current = isNativeActive;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    if (next) {
      try {
        if (readerRootRef.current?.requestFullscreen && !document.fullscreenElement) {
          await readerRootRef.current.requestFullscreen();
          nativeFullscreenRef.current = true;
        }
      } catch {
        nativeFullscreenRef.current = false;
      }
    } else if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore native fullscreen exit errors
      } finally {
        nativeFullscreenRef.current = false;
      }
    }
  }, [isFullscreen]);

  const handleCloseReader = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isFullscreen && readerRootRef.current) {
      readerRootRef.current.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [chapterIndex, isFullscreen]);

  useEffect(() => {
    const handleScroll = () => {
      if (isFullscreen && readerRootRef.current) {
        const el = readerRootRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, el.scrollTop / maxScroll)) : 1;
        setScrollPercent(Math.round(ratio * 100));
        return;
      }
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 1;
      setScrollPercent(Math.round(ratio * 100));
    };

    handleScroll();
    const rootEl = readerRootRef.current;
    if (isFullscreen && rootEl) {
      rootEl.addEventListener('scroll', handleScroll, { passive: true });
      return () => rootEl.removeEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapterIndex, isFullscreen]);

  useEffect(() => {
    if (!appSettings.autoSaveProgress) return;
    const timer = window.setTimeout(() => {
      onSaveProgress({
        bookId: book.id,
        chapterIndex,
        scrollRatio: scrollPercent / 100,
        bookmarks,
        lastReadAt: new Date().toISOString(),
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    appSettings.autoSaveProgress,
    book.id,
    chapterIndex,
    scrollPercent,
    bookmarks,
    onSaveProgress,
  ]);

  const toggleBookmark = () => {
    setBookmarks((prev) =>
      prev.includes(chapterIndex)
        ? prev.filter((idx) => idx !== chapterIndex)
        : [...prev, chapterIndex]
    );
  };

  const effectiveWidthClass =
    fontSize >= 28 && appSettings.readerWidth !== 'narrow'
      ? 'max-w-4xl'
      : WIDTH_CLASS[appSettings.readerWidth];

  return (
    <div
      ref={readerRootRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen overflow-y-auto'
          : 'min-h-screen'
      } ${palette.bg} ${palette.text} transition-colors duration-200`}
    >
      <header
        className={`sticky top-0 z-30 border-b ${palette.border} ${palette.bg}/95 backdrop-blur-sm`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleCloseReader}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium ${palette.surface} hover:opacity-85 transition-opacity whitespace-nowrap shrink-0`}
            >
              <ArrowRight className={`h-3.5 w-3.5 ${isEn ? 'rotate-180' : ''}`} aria-hidden="true" />
              {isEn ? 'Library' : 'المكتبة'}
            </button>
            <div className="hidden sm:block truncate">
              <p className="truncate font-editorial text-base font-bold">{book.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div
              className={`hidden lg:flex items-center gap-1 rounded-md p-1 ${palette.surface}`}
              role="group"
              aria-label={isEn ? 'Paper style' : 'نمط الورق'}
            >
              {(
                [
                  { id: 'app', label: isEn ? 'App Theme' : 'سمة التطبيق' },
                  { id: 'paper', label: isEn ? 'Paper' : 'ورقي' },
                  { id: 'sepia', label: isEn ? 'Sepia' : 'عتيق' },
                  { id: 'night', label: isEn ? 'Night' : 'ليلي' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    theme === item.id
                      ? 'bg-[var(--btn-dark)] text-[var(--btn-dark-fg)]'
                      : `${palette.muted} hover:opacity-80`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={`flex items-center gap-0.5 sm:gap-1 rounded-md px-1 sm:px-1.5 py-1 ${palette.surface}`}>
              <button
                type="button"
                disabled={fontSize <= MIN_FONT_SIZE}
                onClick={() => setFontSize((s) => Math.max(MIN_FONT_SIZE, s - 2))}
                className="rounded p-1 hover:opacity-75 disabled:opacity-35"
                aria-label={isEn ? 'Decrease font size' : 'تصغير الخط'}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFontSize(appSettings.readerFontSize)}
                title={isEn ? 'Reset font size' : 'إعادة حجم الخط الافتراضي'}
                className="px-1.5 font-mono-tabular text-xs hover:text-[var(--accent-primary)] transition-colors"
              >
                {fontSize}
              </button>
              <button
                type="button"
                disabled={fontSize >= MAX_FONT_SIZE}
                onClick={() => setFontSize((s) => Math.min(MAX_FONT_SIZE, s + 2))}
                className="rounded p-1 hover:opacity-75 disabled:opacity-35"
                aria-label={isEn ? 'Increase font size' : 'تكبير الخط'}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleBookmark}
              aria-pressed={isBookmarked}
              aria-label={
                isBookmarked
                  ? isEn
                    ? 'Remove bookmark'
                    : 'إزالة العلامة المرجعية'
                  : isEn
                    ? 'Save bookmark'
                    : 'حفظ علامة مرجعية'
              }
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium ${palette.surface} ${
                isBookmarked ? palette.accent : palette.muted
              } transition-colors whitespace-nowrap shrink-0`}
            >
              <Bookmark
                className="h-3.5 w-3.5"
                fill={isBookmarked ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span className="hidden lg:inline">
                {isBookmarked ? (isEn ? 'Saved' : 'محفوظ') : isEn ? 'Bookmark' : 'علامة'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowToc(true)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium ${palette.surface} whitespace-nowrap shrink-0`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{isEn ? 'Chapters' : 'الفصول'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                void toggleFullscreen();
              }}
              aria-pressed={isFullscreen}
              title={
                isFullscreen
                  ? isEn
                    ? 'Exit fullscreen'
                    : 'إنهاء ملء الشاشة'
                  : isEn
                    ? 'Fullscreen reading mode'
                    : 'وضع ملء الشاشة'
              }
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isFullscreen
                  ? 'bg-[var(--btn-dark)] text-[var(--btn-dark-fg)]'
                  : `${palette.surface} hover:opacity-85`
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden md:inline">
                {isFullscreen
                  ? isEn
                    ? 'Exit Fullscreen'
                    : 'إنهاء ملء الشاشة'
                  : isEn
                    ? 'Fullscreen'
                    : 'ملء الشاشة'}
              </span>
            </button>
          </div>
        </div>

        {appSettings.showProgressHairline && (
          <div className={`h-[2px] w-full ${palette.surface}`}>
            <div
              className="h-full bg-[var(--accent-primary)] transition-all duration-150"
              style={{
                width: `${Math.round(
                  ((chapterIndex + scrollPercent / 100) / Math.max(1, book.chapters.length)) * 100
                )}%`,
              }}
            />
          </div>
        )}
      </header>

      <main
        className={`mx-auto ${effectiveWidthClass} px-5 py-10 sm:px-8 sm:py-14`}
      >
        <div className={`flex flex-wrap items-center gap-2 text-xs ${palette.muted}`}>
          <span>{getSectionDisplayName(book.category, lang, sectionTranslations)}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {isEn
              ? `Chapter ${chapter.number} of ${String(book.chapters.length).padStart(2, '0')}`
              : `الفصل ${chapter.number} من ${String(book.chapters.length).padStart(2, '0')}`}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <span>{book.author}</span>
            {book.isAuthorVerified && (
              <OwnerBadge showOwnerText={false} iconClassName="h-3.5 w-3.5" />
            )}
          </span>
        </div>

        <h1 className="mt-3 font-editorial text-3xl font-bold leading-snug sm:text-4xl [text-wrap:balance]">
          {chapter.title}
        </h1>

        {chapter.epigraph && (
          <blockquote
            className={`my-8 border-y ${palette.border} py-5 text-center font-editorial text-xl italic leading-relaxed ${palette.muted}`}
          >
            «{chapter.epigraph}»
          </blockquote>
        )}

        <div
          className={`mt-8 space-y-6 antialiased ${
            appSettings.readerFontFamily === 'editorial' ? 'font-editorial' : 'font-sans-arabic'
          } ${LINE_HEIGHT_CLASS[appSettings.readerLineHeight]}`}
          style={{
            fontSize: `${fontSize}px`,
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {chapter.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0 && fontSize <= 24
                  ? 'first-letter:float-right first-letter:ml-3 first-letter:font-editorial first-letter:text-5xl first-letter:font-bold first-letter:leading-none'
                  : ''
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        <nav
          aria-label="التنقل بين الفصول"
          className={`mt-16 flex items-center justify-between gap-4 border-t ${palette.border} pt-8`}
        >
          <button
            type="button"
            disabled={chapterIndex === 0}
            onClick={() => setChapterIndex((idx) => Math.max(0, idx - 1))}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${palette.surface} transition-opacity disabled:opacity-40 whitespace-nowrap shrink-0`}
          >
            <ChevronRight className={`h-4 w-4 ${isEn ? 'rotate-180' : ''}`} aria-hidden="true" />
            {isEn ? 'Previous Chapter' : 'الفصل السابق'}
          </button>

          <span className={`font-mono-tabular text-xs ${palette.muted}`}>
            {chapterIndex + 1} / {book.chapters.length}
          </span>

          <button
            type="button"
            disabled={chapterIndex >= book.chapters.length - 1}
            onClick={() =>
              setChapterIndex((idx) => Math.min(book.chapters.length - 1, idx + 1))
            }
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${palette.surface} transition-opacity disabled:opacity-40 whitespace-nowrap shrink-0`}
          >
            {isEn ? 'Next Chapter' : 'الفصل التالي'}
            <ChevronLeft className={`h-4 w-4 ${isEn ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </nav>

        <div
          className={`mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border ${palette.border} ${palette.surface} px-5 py-4`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs font-medium ${palette.muted}`}>
              {isEn
                ? `Overall rating for "${book.title}":`
                : `التقييم العام لكتاب «${book.title}»:`}
            </span>
            <StarRatingDisplay
              rating={getBookRating(book)}
              lang={lang}
              valueClassName={palette.text}
              mutedClassName={palette.muted}
            />
          </div>
          <RateBookButton
            bookTitle={book.title}
            lang={lang}
            className={`${palette.bg} ${palette.border} ${palette.text}`}
            onRate={() => onRateBook?.(book)}
          />
        </div>
      </main>

      {showToc && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45"
          role="dialog"
          aria-modal="true"
          aria-label={isEn ? 'Table of Contents' : 'فهرس الكتاب'}
        >
          <div className={`flex h-full w-full max-w-sm flex-col ${palette.bg} ${palette.text} p-6 shadow-xl`}>
            <div className={`flex items-center justify-between border-b ${palette.border} pb-4`}>
              <div>
                <p className={`text-xs ${palette.muted}`}>
                  {isEn ? 'Table of Contents' : 'فهرس المحتويات'}
                </p>
                <h2 className="mt-1 font-editorial text-xl font-bold">{book.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowToc(false)}
                className="rounded-md p-1.5 hover:opacity-75"
                aria-label={isEn ? 'Close' : 'إغلاق الفهرس'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
              {book.chapters.map((ch, idx) => {
                const isActive = idx === chapterIndex;
                const hasBookmark = bookmarks.includes(idx);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setChapterIndex(idx);
                      setShowToc(false);
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-md border px-4 py-3 ${
                      isEn ? 'text-left' : 'text-right'
                    } transition-colors ${
                      isActive
                        ? `${palette.surface} border-[var(--accent-primary)]/40`
                        : `${palette.border} hover:${palette.surface}`
                    }`}
                  >
                    <div>
                      <span className={`font-mono-tabular text-xs ${palette.accent}`}>
                        {ch.number}
                      </span>
                      <p className="mt-0.5 text-sm font-medium leading-snug">{ch.title}</p>
                    </div>
                    {hasBookmark && (
                      <Bookmark
                        className={`mt-1 h-3.5 w-3.5 shrink-0 ${palette.accent}`}
                        fill="currentColor"
                        aria-label="محفوظ بعلامة"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
