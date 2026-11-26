import React from 'react';
import { Star } from 'lucide-react';
import { clampBookRating } from '../bookRatings';
import { UI_COPY, type AppLanguage } from '../i18n';

interface StarRatingDisplayProps {
  rating: number;
  lang?: AppLanguage;
  compact?: boolean;
  mutedClassName?: string;
  valueClassName?: string;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  lang = 'ar',
  compact = false,
  mutedClassName = 'text-[var(--text-muted)]',
  valueClassName = 'text-[var(--text-ink)]',
}) => {
  const normalized = clampBookRating(rating);
  const fullStars = Math.floor(normalized);
  const hasHalfStar = normalized - fullStars >= 0.4;
  const labelText =
    lang === 'en'
      ? `Overall rating ${normalized.toFixed(1)} out of 5`
      : `التقييم العام ${normalized.toFixed(1)} من 5`;

  return (
    <div className="inline-flex items-center gap-1.5" aria-label={labelText} title={labelText}>
      <div className="flex items-center gap-0.5" dir="ltr" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => {
          const isFull = index <= fullStars;
          const isHalf = !isFull && index === fullStars + 1 && hasHalfStar;

          return (
            <span
              key={index}
              className="relative inline-flex h-3.5 w-3.5 items-center justify-center"
            >
              <Star className="h-3.5 w-3.5 fill-transparent stroke-current opacity-30" />
              {(isFull || isHalf) && (
                <span
                  className={`absolute inset-y-0 left-0 overflow-hidden ${
                    isHalf ? 'w-1/2' : 'w-full'
                  }`}
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span
        className={`font-mono-tabular font-semibold ${
          compact ? 'text-xs' : 'text-xs sm:text-sm'
        } ${valueClassName}`}
        dir="ltr"
      >
        {normalized.toFixed(1)}
        <span className={`font-normal ${mutedClassName}`}>/5</span>
      </span>
    </div>
  );
};

interface RateBookButtonProps {
  bookTitle: string;
  lang?: AppLanguage;
  compact?: boolean;
  iconOnly?: boolean;
  size?: 'compact' | 'default' | 'lg';
  className?: string;
  onRate?: () => void;
}

export const RateBookButton: React.FC<RateBookButtonProps> = ({
  bookTitle,
  lang = 'ar',
  compact = false,
  iconOnly = false,
  size,
  className = '',
  onRate,
}) => {
  const copy = UI_COPY[lang];
  const resolvedSize = size ?? (compact ? 'compact' : 'default');
  const sizeClasses = iconOnly
    ? 'h-7 px-2 text-xs font-medium'
    : resolvedSize === 'compact'
      ? 'px-2.5 py-1 text-xs font-medium'
      : resolvedSize === 'lg'
        ? 'px-5 py-3 text-sm font-semibold'
        : 'px-3.5 py-2 text-xs font-medium';
  const accessibleLabel =
    lang === 'en' ? `Rate ${bookTitle}` : `قيّم كتاب ${bookTitle}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRate?.();
      }}
      aria-label={accessibleLabel}
      title={iconOnly ? copy.rateBook : undefined}
      className={`inline-flex items-center ${iconOnly ? 'gap-1' : 'gap-1.5'} rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-ink)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] whitespace-nowrap shrink-0 ${sizeClasses} ${className}`}
    >
      <Star
        className={`${resolvedSize === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-amber-500`}
        aria-hidden="true"
      />
      {!iconOnly && <span>{copy.rateBook}</span>}
    </button>
  );
};

export const OwnerBadge: React.FC<{
  showVerifiedIcon?: boolean;
  showOwnerText?: boolean;
  iconClassName?: string;
  className?: string;
}> = ({
  showVerifiedIcon = true,
  showOwnerText = true,
  iconClassName = 'h-4 w-4',
  className = '',
}) => {
  if (!showVerifiedIcon && !showOwnerText) return null;

  const ariaLabel =
    showVerifiedIcon && showOwnerText
      ? 'Verified (The Owner)'
      : showOwnerText
        ? '(The Owner)'
        : 'Verified Account';

  return (
    <span
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wide shrink-0 ${className}`}
    >
      {showVerifiedIcon && (
        <svg
          viewBox="0 0 24 24"
          className={`${iconClassName} shrink-0`}
          aria-hidden="true"
        >
          <path
            fill="#1D9BF0"
            d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
          />
          <path
            fill="#FFFFFF"
            d="M10.54 16.2L6.8 12.46l1.41-1.42 2.33 2.33 5.25-5.25 1.41 1.42-6.66 6.66z"
          />
        </svg>
      )}
      {showOwnerText && (
        <span dir="ltr" className="inline-flex items-center font-mono-tabular font-extrabold">
          <span aria-hidden="true" className="text-[var(--text-muted)] font-semibold">
            (
          </span>
          <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent dark:from-amber-200 dark:via-yellow-300 dark:to-amber-400">
            The Owner
          </span>
          <span aria-hidden="true" className="text-[var(--text-muted)] font-semibold">
            )
          </span>
        </span>
      )}
    </span>
  );
};
