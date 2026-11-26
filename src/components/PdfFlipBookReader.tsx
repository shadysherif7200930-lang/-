import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Maximize2,
  Minimize2,
  Square,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { getBookRating } from '../bookRatings';
import {
  getPdfBlob,
  savePdfBlob,
  type BookRecord,
  type ReadingProgress,
} from '../db/booksDb';
import type { AppLanguage } from '../i18n';
import { loadPdfDocument, renderPdfPageToDataUrl } from '../utils/pdfUtils';
import { loadWordPages } from '../utils/wordUtils';
import { RateBookButton, StarRatingDisplay } from './BookRatingBar';

interface PdfFlipBookReaderProps {
  book: BookRecord;
  initialProgress?: ReadingProgress;
  autoSaveProgress: boolean;
  lang?: AppLanguage;
  fetchDocumentBuffer?: (pdfId: string) => Promise<ArrayBuffer | null>;
  onSaveProgress: (progress: ReadingProgress) => void;
  onRateBook?: (book: BookRecord) => void;
  onClose: () => void;
}

interface FlipAnimationState {
  id: number;
  fromPage: number;
  toPage: number;
  direction: 1 | -1;
}

interface RenderedPageEntry {
  url: string;
  tier: number;
}

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 2.8;
const ZOOM_STEP = 0.15;

function getRenderTierForZoom(zoom: number): { tier: number; scale: number } {
  if (zoom > 1.85) return { tier: 3, scale: 4.0 };
  if (zoom > 1.25) return { tier: 2, scale: 3.2 };
  return { tier: 1, scale: 2.4 };
}

export const PdfFlipBookReader: React.FC<PdfFlipBookReaderProps> = ({
  book,
  initialProgress,
  autoSaveProgress,
  lang = 'ar',
  fetchDocumentBuffer,
  onSaveProgress,
  onRateBook,
  onClose,
}) => {
  const isEn = lang === 'en';
  const isWordBook = book.bookType === 'word';

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [wordPages, setWordPages] = useState<string[]>([]);
  const [wordIsRtl, setWordIsRtl] = useState<boolean>(!isEn);
  const [totalPages, setTotalPages] = useState<number>(book.pdfPageCount || 1);
  const [currentPage, setCurrentPage] = useState<number>(
    Math.max(1, (initialProgress?.chapterIndex ?? 0) + 1)
  );
  const [isSpread, setIsSpread] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<number[]>(initialProgress?.bookmarks ?? []);
  const [pageImages, setPageImages] = useState<Record<number, RenderedPageEntry>>({});
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flipState, setFlipState] = useState<FlipAnimationState | null>(null);

  const readerRootRef = useRef<HTMLDivElement | null>(null);
  const nativeFullscreenRef = useRef<boolean>(false);
  const renderCacheRef = useRef<Record<string, string>>({});
  const flipTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const { tier: targetTier, scale: targetScale } = getRenderTierForZoom(zoom);

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
    let active = true;
    let loadedDoc: PDFDocumentProxy | null = null;

    const init = async () => {
      setIsLoadingDoc(true);
      setLoadError(null);
      setPdfDoc(null);
      setWordPages([]);
      renderCacheRef.current = {};
      setPageImages({});

      try {
        if (!book.pdfId) {
          throw new Error(
            isEn ? 'Document file not found.' : 'لم يتم العثور على ملف الكتاب.'
          );
        }
        let buffer = await getPdfBlob(book.pdfId);
        if (!buffer && fetchDocumentBuffer) {
          buffer = await fetchDocumentBuffer(book.pdfId);
          if (buffer) {
            await savePdfBlob(book.pdfId, buffer, book.title);
          }
        }
        if (!buffer) {
          throw new Error(
            isEn
              ? 'Document file could not be loaded on this device.'
              : 'تعذر تحميل ملف الكتاب على هذا الجهاز.'
          );
        }

        if (isWordBook) {
          const parsed = await loadWordPages(buffer, book.title);
          if (!active) return;
          setWordPages(parsed.pageHtmls);
          setWordIsRtl(parsed.isRtl);
          setTotalPages(parsed.pageCount);
          setCurrentPage((prev) => Math.min(prev, parsed.pageCount));
        } else {
          loadedDoc = await loadPdfDocument(buffer);
          if (!active) {
            await loadedDoc.cleanup();
            return;
          }
          setPdfDoc(loadedDoc);
          setTotalPages(loadedDoc.numPages);
          setCurrentPage((prev) => Math.min(prev, loadedDoc!.numPages));
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error
              ? err.message
              : isEn
                ? 'Could not open this document.'
                : 'تعذر فتح ملف الكتاب.'
          );
        }
      } finally {
        if (active) setIsLoadingDoc(false);
      }
    };

    void init();

    return () => {
      active = false;
      if (loadedDoc) {
        void loadedDoc.cleanup();
      }
      if (flipTimerRef.current) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, [book.pdfId, book.title, fetchDocumentBuffer, isEn, isWordBook]);

  useEffect(() => {
    if (!pdfDoc || isWordBook) return;
    let cancelled = false;

    const visiblePages: Array<{ pageNum: number; tier: number; scale: number }> = [
      { pageNum: currentPage, tier: targetTier, scale: targetScale },
    ];
    if (isSpread && currentPage + 1 <= totalPages) {
      visiblePages.push({ pageNum: currentPage + 1, tier: targetTier, scale: targetScale });
    }

    const prefetchCandidates = [
      currentPage + 1,
      currentPage + 2,
      currentPage - 1,
      currentPage - 2,
    ].filter((num) => num >= 1 && num <= totalPages);

    const queue = [
      ...visiblePages,
      ...prefetchCandidates.map((pageNum) => ({ pageNum, tier: 1, scale: 2.4 })),
    ];

    const ensure = async () => {
      for (const item of queue) {
        if (cancelled) return;
        const cacheKey = `${item.pageNum}@${item.tier}`;
        const cached = renderCacheRef.current[cacheKey];
        if (cached) {
          setPageImages((prev) => {
            const existing = prev[item.pageNum];
            if (existing && existing.tier >= item.tier && existing.url === cached) {
              return prev;
            }
            return { ...prev, [item.pageNum]: { url: cached, tier: item.tier } };
          });
          continue;
        }

        // For prefetch items, skip if any tier is already rendered
        if (item.tier === 1 && renderCacheRef.current[`${item.pageNum}@2`]) continue;

        try {
          const dataUrl = await renderPdfPageToDataUrl(pdfDoc, item.pageNum, item.scale);
          if (!cancelled) {
            renderCacheRef.current[cacheKey] = dataUrl;
            setPageImages((prev) => {
              const existing = prev[item.pageNum];
              if (existing && existing.tier > item.tier) {
                return prev;
              }
              return { ...prev, [item.pageNum]: { url: dataUrl, tier: item.tier } };
            });
          }
        } catch {
          // ignore transient page render cancellation
        }
      }
    };

    void ensure();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, isWordBook, currentPage, totalPages, isSpread, targetTier, targetScale]);

  useEffect(() => {
    if (!autoSaveProgress) return;
    const timer = window.setTimeout(() => {
      onSaveProgress({
        bookId: book.id,
        chapterIndex: currentPage - 1,
        scrollRatio: currentPage / Math.max(1, totalPages),
        bookmarks,
        lastReadAt: new Date().toISOString(),
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [autoSaveProgress, book.id, currentPage, totalPages, bookmarks, onSaveProgress]);

  const step = isSpread ? 2 : 1;

  const scrollReaderToTop = useCallback(() => {
    if (isFullscreen && readerRootRef.current) {
      if (readerRootRef.current.scrollTop > 80) {
        readerRootRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (window.scrollY > 80) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isFullscreen]);

  const triggerFlipToPage = useCallback(
    (targetPage: number, direction: 1 | -1) => {
      const clamped = Math.min(totalPages, Math.max(1, targetPage));
      if (clamped === currentPage) return;

      if (flipTimerRef.current) {
        window.clearTimeout(flipTimerRef.current);
      }

      const animId = Date.now();
      setFlipState({
        id: animId,
        fromPage: currentPage,
        toPage: clamped,
        direction,
      });
      setCurrentPage(clamped);
      scrollReaderToTop();

      flipTimerRef.current = window.setTimeout(() => {
        setFlipState((curr) => (curr?.id === animId ? null : curr));
      }, 560);
    },
    [currentPage, totalPages, scrollReaderToTop]
  );

  const goNextPage = useCallback(() => {
    if (currentPage >= totalPages) return;
    triggerFlipToPage(currentPage + step, 1);
  }, [currentPage, totalPages, step, triggerFlipToPage]);

  const goPrevPage = useCallback(() => {
    if (currentPage <= 1) return;
    triggerFlipToPage(currentPage - step, -1);
  }, [currentPage, step, triggerFlipToPage]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (isEn) goPrevPage();
        else goNextPage();
      }
      if (e.key === 'ArrowRight') {
        if (isEn) goNextPage();
        else goPrevPage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNextPage, goPrevPage, isEn]);

  const isBookmarked = bookmarks.includes(currentPage);
  const toggleBookmark = () => {
    setBookmarks((prev) =>
      prev.includes(currentPage)
        ? prev.filter((p) => p !== currentPage)
        : [...prev, currentPage]
    );
  };

  const baseSheetVh = isFullscreen ? 82 : 72;
  const pdfTargetVh = Math.round(baseSheetVh * zoom);
  const wordBaseWidth = isFullscreen ? 500 : 440;
  const wordSheetWidthPx = Math.round((isSpread ? Math.min(430, wordBaseWidth) : wordBaseWidth) * zoom);
  const wordFontSizePx = Math.round(15.5 * zoom);

  const renderBookSheetContent = (pageNum: number, side: 'left' | 'right' | 'single') => {
    const gutterGradient =
      side === 'right'
        ? 'inset-y-0 left-0 w-7 bg-gradient-to-r from-black/15 via-black/5 to-transparent'
        : side === 'left'
          ? 'inset-y-0 right-0 w-7 bg-gradient-to-l from-black/15 via-black/5 to-transparent'
          : 'inset-y-0 right-0 w-5 bg-gradient-to-l from-black/12 to-transparent';

    if (isWordBook) {
      const html = wordPages[pageNum - 1];
      return (
        <div
          className="relative flex flex-col justify-between bg-[#FCF9F2] text-stone-900 select-text"
          style={{
            width: zoom <= 1 ? `min(${wordSheetWidthPx}px, 90vw)` : `${wordSheetWidthPx}px`,
            minHeight: isFullscreen ? '72vh' : '64vh',
            boxShadow: 'inset 0 0 28px rgba(120, 90, 50, 0.06)',
          }}
        >
          {/* Subtle running header */}
          <div className="flex items-center justify-between border-b border-stone-300/60 px-6 py-2.5 text-[10px] font-medium text-stone-500">
            <span className="truncate max-w-[70%]">{book.title}</span>
            <span className="font-mono-tabular uppercase tracking-wider">WORD</span>
          </div>

          {/* Word Sheet Content */}
          <div
            dir={wordIsRtl ? 'rtl' : 'ltr'}
            style={{
              fontSize: `${wordFontSizePx}px`,
              lineHeight: zoom >= 1.6 ? 1.9 : 1.8,
              WebkitFontSmoothing: 'antialiased',
            }}
            className="flex-1 px-7 py-5 font-editorial [&_h1]:mb-[0.65em] [&_h1]:text-[1.42em] [&_h1]:font-bold [&_h1]:leading-snug [&_h1]:text-stone-950 [&_h2]:mb-[0.55em] [&_h2]:text-[1.22em] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-stone-900 [&_h3]:mb-[0.45em] [&_h3]:text-[1.08em] [&_h3]:font-bold [&_h3]:leading-snug [&_p]:mb-[0.75em] [&_ul]:mb-[0.75em] [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:mb-[0.75em] [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:mb-[0.25em] [&_blockquote]:my-[0.75em] [&_blockquote]:border-s-2 [&_blockquote]:border-amber-700/50 [&_blockquote]:ps-3 [&_blockquote]:italic [&_blockquote]:text-stone-700 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[0.85em] [&_td]:border [&_td]:border-stone-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-stone-300 [&_th]:bg-stone-200/60 [&_th]:px-2 [&_th]:py-1 [&_img]:mx-auto [&_img]:my-2 [&_img]:max-h-72 [&_img]:rounded-sm [&_img]:object-contain"
            dangerouslySetInnerHTML={{
              __html: html || `<p>${isEn ? 'Loading sheet...' : 'جاري تجهيز الورقة...'}</p>`,
            }}
          />

          {/* Sheet Page Number Footer */}
          <div className="flex items-center justify-center border-t border-stone-300/50 py-2 text-[11px] font-mono-tabular text-stone-500">
            — {pageNum} —
          </div>

          <div aria-hidden="true" className={`pointer-events-none absolute ${gutterGradient}`} />
        </div>
      );
    }

    const renderedEntry = pageImages[pageNum];
    return (
      <div className="relative bg-[#FCF9F2]">
        {renderedEntry ? (
          <img
            src={renderedEntry.url}
            alt={isEn ? `Page ${pageNum} of ${book.title}` : `صفحة ${pageNum} من ${book.title}`}
            style={{
              height: `${pdfTargetVh}vh`,
              width: 'auto',
              maxWidth: zoom <= 1 ? (isSpread ? '45vw' : '92vw') : 'none',
            }}
            className="block object-contain select-none"
            draggable={false}
          />
        ) : (
          <div
            style={{
              height: `${pdfTargetVh}vh`,
              width: `${Math.round((isFullscreen ? 480 : 420) * zoom)}px`,
            }}
            className="flex items-center justify-center bg-[#F6F1E6] text-xs text-stone-500"
          >
            {isEn ? `Rendering page ${pageNum}...` : `جاري رسم الصفحة ${pageNum}...`}
          </div>
        )}
        <div aria-hidden="true" className={`pointer-events-none absolute ${gutterGradient}`} />
      </div>
    );
  };

  const flipDirection = flipState?.direction ?? 1;
  const flipRotateTarget = isEn
    ? flipDirection > 0
      ? -180
      : 180
    : flipDirection > 0
      ? 180
      : -180;
  const flipOrigin = isEn
    ? flipDirection > 0
      ? 'left center'
      : 'right center'
    : flipDirection > 0
      ? 'right center'
      : 'left center';

  return (
    <div
      ref={readerRootRef}
      className={`app-canvas-bg text-[var(--text-ink)] flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen overflow-y-auto'
          : 'min-h-screen'
      }`}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm shrink-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleCloseReader}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-surface)] px-2.5 sm:px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0"
            >
              <ArrowRight className={`h-3.5 w-3.5 ${isEn ? 'rotate-180' : ''}`} aria-hidden="true" />
              {isEn ? 'Library' : 'المكتبة'}
            </button>
            <div className="hidden sm:flex items-center gap-2 truncate">
              <span className="rounded bg-[var(--bg-surface)] px-2 py-0.5 font-mono-tabular text-[10px] font-semibold uppercase text-[var(--accent-primary)]">
                {isWordBook ? 'WORD' : 'PDF'}
              </span>
              <p className="truncate font-editorial text-base font-bold">{book.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSpread((s) => !s)}
              className="hidden md:inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0"
              title={
                isSpread
                  ? isEn
                    ? 'Single page view'
                    : 'عرض صفحة واحدة'
                  : isEn
                    ? 'Two-page book spread'
                    : 'عرض صفحتين ككتاب مفتوح'
              }
            >
              {isSpread ? (
                <>
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Single Page' : 'صفحة واحدة'}
                </>
              ) : (
                <>
                  <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEn ? 'Book Spread' : 'كتاب مفتوح'}
                </>
              )}
            </button>

            <div className="flex items-center gap-0.5 sm:gap-1 rounded-md bg-[var(--bg-surface)] px-1 sm:px-1.5 py-1">
              <button
                type="button"
                disabled={zoom <= MIN_ZOOM}
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
                className="rounded p-1 hover:opacity-75 disabled:opacity-35"
                aria-label={isEn ? 'Zoom out' : 'تصغير الصفحة'}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                title={isEn ? 'Reset zoom to 100%' : 'إعادة الحجم إلى 100%'}
                className="px-1.5 font-mono-tabular text-xs hover:text-[var(--accent-primary)] transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
                className="rounded p-1 hover:opacity-75 disabled:opacity-35"
                aria-label={isEn ? 'Zoom in' : 'تكبير الصفحة'}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleBookmark}
              aria-pressed={isBookmarked}
              className={`inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-surface)] px-2.5 sm:px-3 py-1.5 text-xs font-medium ${
                isBookmarked ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
              } whitespace-nowrap shrink-0`}
            >
              <Bookmark
                className="h-3.5 w-3.5"
                fill={isBookmarked ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span className="hidden lg:inline">
                {isBookmarked ? (isEn ? 'Saved' : 'محفوظة') : isEn ? 'Bookmark' : 'علامة'}
              </span>
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
                  : 'bg-[var(--bg-surface)] text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)]'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
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

        <div className="h-[2px] w-full bg-[var(--bg-surface)]">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-200"
            style={{ width: `${Math.round((currentPage / Math.max(1, totalPages)) * 100)}%` }}
          />
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center px-3 py-5 sm:px-6 sm:py-6">
        {isLoadingDoc ? (
          <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
            <BookOpen className="h-10 w-10 animate-pulse text-[var(--accent-primary)]" />
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {isEn
                ? `Preparing ${isWordBook ? 'Word' : 'PDF'} book sheets...`
                : `جاري تجهيز صفحات كتاب ${isWordBook ? 'Word' : 'PDF'}...`}
            </p>
          </div>
        ) : loadError ? (
          <div className="my-auto max-w-md rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center">
            <p className="font-editorial text-xl font-bold">{book.title}</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{loadError}</p>
            <button
              type="button"
              onClick={handleCloseReader}
              className="mt-5 rounded-md bg-[var(--btn-dark)] px-4 py-2 text-xs font-medium text-[var(--btn-dark-fg)]"
            >
              {isEn ? 'Back to Library' : 'العودة للمكتبة'}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Scrollable horizontal stage + natural top-to-bottom layout flow */}
            <div
              className="w-full overflow-x-auto pb-5 pt-1"
              onTouchStart={(e) => {
                if (e.touches.length === 1 && zoom <= 1.15) {
                  touchStartXRef.current = e.touches[0]?.clientX ?? null;
                } else {
                  touchStartXRef.current = null;
                }
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current === null) return;
                const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
                touchStartXRef.current = null;
                if (Math.abs(delta) < 55) return;
                if (delta > 0) {
                  if (isEn) goPrevPage();
                  else goNextPage();
                } else {
                  if (isEn) goNextPage();
                  else goPrevPage();
                }
              }}
            >
              <div className="mx-auto w-fit px-2" style={{ perspective: '2200px' }}>
                <div className="relative">
                  {/* Stacked paper thickness edges under the open book */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-1.5 inset-x-1.5 h-3 rounded-b-md border-x border-b border-stone-400/50 bg-[#EAE2D0]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-3 inset-x-3 h-3 rounded-b-md border-x border-b border-stone-400/40 bg-[#DFD5C0]"
                  />

                  {/* Underlying Open Book Sheets */}
                  <div className="relative flex items-stretch justify-center rounded-md border border-stone-300 bg-[#FCF9F2] shadow-[0_24px_55px_-14px_rgba(0,0,0,0.45)] overflow-hidden">
                    {isSpread && currentPage + 1 <= totalPages ? (
                      <>
                        <div className="relative">
                          {renderBookSheetContent(currentPage, 'right')}
                        </div>
                        <div className="relative border-s border-stone-300">
                          {renderBookSheetContent(currentPage + 1, 'left')}
                        </div>
                        {/* Center Book Spine Crease */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-gradient-to-r from-black/10 via-black/20 to-black/10 opacity-45"
                        />
                      </>
                    ) : (
                      <div className="relative">
                        {renderBookSheetContent(currentPage, 'single')}
                      </div>
                    )}

                    {/* Clickable Outer Edge Hotspots (subtle width when zoomed) */}
                    <button
                      type="button"
                      onClick={isEn ? goPrevPage : goNextPage}
                      disabled={isEn ? currentPage <= 1 : currentPage >= totalPages}
                      aria-label={isEn ? 'Previous page' : 'الصفحة التالية'}
                      className={`group absolute inset-y-0 left-0 z-10 cursor-pointer bg-gradient-to-r from-black/[0.04] to-transparent opacity-0 transition-opacity hover:opacity-100 disabled:pointer-events-none ${
                        zoom > 1.25 ? 'w-8' : 'w-14'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={isEn ? goNextPage : goPrevPage}
                      disabled={isEn ? currentPage >= totalPages : currentPage <= 1}
                      aria-label={isEn ? 'Next page' : 'الصفحة السابقة'}
                      className={`group absolute inset-y-0 right-0 z-10 cursor-pointer bg-gradient-to-l from-black/[0.04] to-transparent opacity-0 transition-opacity hover:opacity-100 disabled:pointer-events-none ${
                        zoom > 1.25 ? 'w-8' : 'w-14'
                      }`}
                    />
                  </div>

                  {/* 3D Turning Page Leaf Overlay */}
                  {flipState && (
                    <motion.div
                      key={flipState.id}
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: flipRotateTarget }}
                      transition={{
                        duration: 0.56,
                        ease: [0.22, 0.61, 0.36, 1],
                      }}
                      style={{
                        transformStyle: 'preserve-3d',
                        transformOrigin: flipOrigin,
                      }}
                      className={`pointer-events-none absolute inset-y-0 z-20 ${
                        isSpread && currentPage + 1 <= totalPages
                          ? flipOrigin === 'left center'
                            ? 'right-0 w-1/2'
                            : 'left-0 w-1/2'
                          : 'inset-x-0'
                      }`}
                    >
                      {/* Front Face of Turning Sheet */}
                      <div
                        style={{ backfaceVisibility: 'hidden' }}
                        className="h-full w-full overflow-hidden rounded-md border border-stone-300 bg-[#FCF9F2] shadow-2xl"
                      >
                        {renderBookSheetContent(flipState.fromPage, 'single')}
                        <motion.div
                          initial={{ opacity: 0.05 }}
                          animate={{ opacity: 0.38 }}
                          transition={{ duration: 0.28 }}
                          className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/25 via-transparent to-white/25"
                        />
                      </div>

                      {/* Back Face of Turning Sheet */}
                      <div
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                        className="absolute inset-0 overflow-hidden rounded-md border border-stone-300 bg-[#F6F0E2] shadow-2xl"
                      >
                        <div className="flex h-full w-full items-center justify-center opacity-35">
                          {renderBookSheetContent(flipState.toPage, 'single')}
                        </div>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/10" />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Page Flip Controls */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={goPrevPage}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] transition-colors hover:bg-[var(--bg-surface-alt)] disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                <ChevronRight className={`h-4 w-4 ${isEn ? 'rotate-180' : ''}`} aria-hidden="true" />
                {isEn ? 'Previous Page' : 'الصفحة السابقة'}
              </button>

              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{isEn ? 'Page' : 'صفحة'}</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = Math.min(totalPages, Math.max(1, Number(e.target.value) || 1));
                    triggerFlipToPage(val, val >= currentPage ? 1 : -1);
                  }}
                  aria-label={isEn ? 'Page number' : 'رقم الصفحة'}
                  className="w-16 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-center font-mono-tabular text-xs text-[var(--text-ink)]"
                />
                <span className="font-mono-tabular">
                  {isEn ? `of ${totalPages}` : `من ${totalPages}`}
                </span>
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={goNextPage}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-4 py-2 text-xs font-medium text-[var(--btn-dark-fg)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                {isEn ? 'Next Page' : 'تقليب للصفحة التالية'}
                <ChevronLeft className={`h-4 w-4 ${isEn ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 flex w-full max-w-xl flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-[var(--text-muted)]">
                  {isEn ? 'Overall Rating:' : 'التقييم العام:'}
                </span>
                <StarRatingDisplay rating={getBookRating(book)} lang={lang} />
              </div>
              <RateBookButton
                bookTitle={book.title}
                lang={lang}
                compact
                onRate={() => onRateBook?.(book)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
