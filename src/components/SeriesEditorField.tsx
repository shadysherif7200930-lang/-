import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Layers, Link2, Unlink } from 'lucide-react';
import { formatSeriesPartLabel, type BookRecord } from '../db/booksDb';
import type { AppLanguage } from '../i18n';

interface SeriesEditorFieldProps {
  currentBook: BookRecord;
  availableBooks: BookRecord[];
  lang: AppLanguage;
  onChange: (patch: Partial<BookRecord>) => void;
}

interface OrderedPartEntry {
  bookId: string;
  title: string;
  coverUrl: string;
  isCurrent: boolean;
  defaultPart: number;
}

export const SeriesEditorField: React.FC<SeriesEditorFieldProps> = ({
  currentBook,
  availableBooks,
  lang,
  onChange,
}) => {
  const isEn = lang === 'en';
  const candidateBooks = useMemo(
    () => availableBooks.filter((b) => b.id !== currentBook.id && b.reviewStatus !== 'rejected'),
    [availableBooks, currentBook.id]
  );

  const isLinkedMode = Boolean(currentBook.seriesId || currentBook.linkToBookId);

  const activeSeriesId = useMemo(() => {
    if (currentBook.linkToBookId) {
      const target = candidateBooks.find((b) => b.id === currentBook.linkToBookId);
      if (target) return target.seriesId?.trim() || `series-${target.id}`;
    }
    return currentBook.seriesId?.trim() || null;
  }, [currentBook.linkToBookId, currentBook.seriesId, candidateBooks]);

  const orderedParts = useMemo<OrderedPartEntry[]>(() => {
    if (!isLinkedMode) return [];

    const siblingBooks: BookRecord[] = [];
    if (currentBook.linkToBookId) {
      const target = candidateBooks.find((b) => b.id === currentBook.linkToBookId);
      if (target) {
        if (target.seriesId) {
          siblingBooks.push(
            ...candidateBooks.filter((b) => b.seriesId === target.seriesId)
          );
        } else {
          siblingBooks.push(target);
        }
      }
    } else if (activeSeriesId) {
      siblingBooks.push(...candidateBooks.filter((b) => b.seriesId === activeSeriesId));
    }

    const combinedMap = new Map<string, OrderedPartEntry>();
    for (const sib of siblingBooks) {
      combinedMap.set(sib.id, {
        bookId: sib.id,
        title: sib.title,
        coverUrl: sib.coverUrl,
        isCurrent: false,
        defaultPart: sib.partNumber ?? 1,
      });
    }
    combinedMap.set(currentBook.id, {
      bookId: currentBook.id,
      title:
        currentBook.title.trim() ||
        (isEn ? 'Current Book (This Draft)' : 'الكتاب الحالي (قيد الإعداد)'),
      coverUrl: currentBook.coverUrl,
      isCurrent: true,
      defaultPart: currentBook.partNumber ?? siblingBooks.length + 1,
    });

    const explicitMap = new Map<string, number>();
    if (Array.isArray(currentBook.seriesPartOrder)) {
      for (const entry of currentBook.seriesPartOrder) {
        explicitMap.set(entry.bookId, entry.partNumber);
      }
    }

    const list = Array.from(combinedMap.values());
    list.sort((a, b) => {
      const pa = explicitMap.get(a.bookId) ?? a.defaultPart;
      const pb = explicitMap.get(b.bookId) ?? b.defaultPart;
      if (pa !== pb) return pa - pb;
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? 1 : -1;
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [
    isLinkedMode,
    currentBook.linkToBookId,
    currentBook.id,
    currentBook.title,
    currentBook.coverUrl,
    currentBook.partNumber,
    currentBook.seriesPartOrder,
    activeSeriesId,
    candidateBooks,
    isEn,
  ]);

  const selectedTargetBookId = useMemo(() => {
    if (currentBook.linkToBookId) return currentBook.linkToBookId;
    if (!currentBook.seriesId) return '';
    const firstSibling = candidateBooks
      .filter((b) => b.seriesId === currentBook.seriesId)
      .sort((a, b) => (a.partNumber ?? 999) - (b.partNumber ?? 999))[0];
    return firstSibling?.id ?? '';
  }, [currentBook.linkToBookId, currentBook.seriesId, candidateBooks]);

  const handleEnableStandalone = () => {
    onChange({
      seriesId: null,
      seriesTitle: null,
      partNumber: null,
      linkToBookId: null,
      seriesPartOrder: undefined,
    });
  };

  const handleEnableSeriesMode = () => {
    if (candidateBooks.length === 0) return;
    const defaultTarget =
      candidateBooks.find((b) => b.id === selectedTargetBookId) ?? candidateBooks[0];
    handleSelectTargetBook(defaultTarget.id);
  };

  const handleSelectTargetBook = (targetId: string) => {
    if (!targetId) {
      handleEnableStandalone();
      return;
    }
    const target = candidateBooks.find((b) => b.id === targetId);
    if (!target) return;

    const resolvedSeriesId = target.seriesId?.trim() || `series-${target.id}`;
    const resolvedSeriesTitle = target.seriesTitle?.trim() || target.title;

    const siblings = target.seriesId
      ? candidateBooks
          .filter((b) => b.seriesId === target.seriesId)
          .sort((a, b) => (a.partNumber ?? 1) - (b.partNumber ?? 1))
      : [target];

    const nextOrder = [
      ...siblings.map((b, idx) => ({ bookId: b.id, partNumber: idx + 1 })),
      { bookId: currentBook.id, partNumber: siblings.length + 1 },
    ];

    onChange({
      linkToBookId: target.id,
      seriesId: resolvedSeriesId,
      seriesTitle: resolvedSeriesTitle,
      partNumber: siblings.length + 1,
      seriesPartOrder: nextOrder,
    });
  };

  const handleMovePart = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedParts.length) return;
    const swapped = [...orderedParts];
    const temp = swapped[index];
    swapped[index] = swapped[nextIndex];
    swapped[nextIndex] = temp;

    const nextOrder = swapped.map((item, idx) => ({
      bookId: item.bookId,
      partNumber: idx + 1,
    }));
    const currentPos = nextOrder.find((x) => x.bookId === currentBook.id)?.partNumber ?? null;

    onChange({
      partNumber: currentPos,
      seriesPartOrder: nextOrder,
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
          <p className="text-xs font-semibold text-[var(--text-ink)]">
            {isEn ? 'Book Series & Multi-Part Linking' : 'ربط الكتاب بسلسلة أجزاء (الجزء 1، 2، 3...)'}
          </p>
        </div>
        {isLinkedMode && (
          <button
            type="button"
            onClick={handleEnableStandalone}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-rose-500"
          >
            <Unlink className="h-3 w-3" aria-hidden="true" />
            <span>{isEn ? 'Unlink Series' : 'فصل عن السلسلة'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleEnableStandalone}
          className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
            !isLinkedMode
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-ink)]'
          }`}
        >
          {isEn ? 'Standalone Book' : 'كتاب منفرد (ليس جزءاً من سلسلة)'}
        </button>
        <button
          type="button"
          disabled={candidateBooks.length === 0 && !isLinkedMode}
          onClick={handleEnableSeriesMode}
          className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
            isLinkedMode
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-fg)]'
              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
          }`}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isEn ? 'Link as Part of a Series' : 'ربط بكتاب آخر كجزء من سلسلة'}</span>
        </button>
      </div>

      {candidateBooks.length === 0 && !isLinkedMode && (
        <p className="text-[11px] text-[var(--text-muted)]">
          {isEn
            ? 'Publish or add a first book first, then you can link new parts to it.'
            : 'أضف الكتاب الأول أولاً، وبعدها يمكنك ربط أي كتاب جديد أو قادم به كجزء ثانٍ أو ثالث.'}
        </p>
      )}

      {isLinkedMode && (
        <div className="space-y-4 border-t border-[var(--border-hairline)] pt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                {isEn ? 'Link to Book / Series *' : 'الكتاب المربوط به (الأساسي في السلسلة) *'}
              </label>
              <select
                value={selectedTargetBookId}
                onChange={(e) => handleSelectTargetBook(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
              >
                <option value="">
                  {isEn ? '— Select a book to link —' : '— اختر الكتاب المراد الربط به —'}
                </option>
                {candidateBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                    {b.seriesId && b.partNumber
                      ? ` (${formatSeriesPartLabel(b.partNumber, lang)})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                {isEn ? 'Series Display Name' : 'اسم السلسلة المشترك'}
              </label>
              <input
                type="text"
                value={currentBook.seriesTitle ?? ''}
                onChange={(e) => onChange({ seriesTitle: e.target.value })}
                placeholder={
                  isEn ? 'e.g. The Shadow Chronicles' : 'مثال: ثلاثية النور (أو اسم الجزء الأول)'
                }
                className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-ink)] focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </div>
          </div>

          {orderedParts.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[var(--text-ink)]">
                  {isEn
                    ? `Series Parts Order (${orderedParts.length} parts)`
                    : `ترتيب أجزاء السلسلة (${orderedParts.length} أجزاء)`}
                </p>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {isEn
                    ? 'Use arrows to reorder Part 1, Part 2, Part 3...'
                    : 'استخدم الأسهم لتعديل ترتيب الجزء الأول والثاني والثالث...'}
                </span>
              </div>

              <div className="space-y-1.5">
                {orderedParts.map((part, idx) => (
                  <div
                    key={part.bookId}
                    className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                      part.isCurrent
                        ? 'border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/[0.08]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex shrink-0 items-center rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent-primary)]">
                        {formatSeriesPartLabel(idx + 1, lang)}
                      </span>
                      {part.coverUrl ? (
                        <img
                          src={part.coverUrl}
                          alt={part.title}
                          referrerPolicy="no-referrer"
                          className="h-8 w-6 shrink-0 rounded-sm border border-[var(--border-hairline)] object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-6 shrink-0 items-center justify-center rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-muted)]"
                        >
                          <BookOpen className="h-3 w-3" />
                        </span>
                      )}
                      <span className="truncate text-xs font-semibold text-[var(--text-ink)]">
                        {part.title}
                      </span>
                      {part.isCurrent && (
                        <span className="shrink-0 text-[10px] font-bold text-[var(--accent-primary)]">
                          · {isEn ? 'Current' : 'هذا الكتاب'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePart(idx, -1)}
                        aria-label={isEn ? 'Move part up' : 'تقديم الجزء لأعلى'}
                        className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1 text-[var(--text-ink)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-35"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === orderedParts.length - 1}
                        onClick={() => handleMovePart(idx, 1)}
                        aria-label={isEn ? 'Move part down' : 'تأخير الجزء لأسفل'}
                        className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1 text-[var(--text-ink)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-35"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
