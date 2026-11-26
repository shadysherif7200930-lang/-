import React, { useId } from 'react';
import type { AppLanguage } from '../i18n';

interface TokenIconProps {
  className?: string;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ className = 'h-4 w-4' }) => {
  const uid = useId().replace(/:/g, '');
  const outerGradId = `token-rhombus-outer-${uid}`;
  const innerGradId = `token-rhombus-inner-${uid}`;
  const shineGradId = `token-rhombus-shine-${uid}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`inline-block shrink-0 drop-shadow-[0_1px_3px_rgba(217,119,6,0.45)] ${className}`}
    >
      <defs>
        <linearGradient id={outerGradId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF7CC" />
          <stop offset="32%" stopColor="#FBBF24" />
          <stop offset="70%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id={innerGradId} x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={shineGradId} x1="12" y1="4.5" x2="12" y2="19.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#78350F" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* Outer Golden Rhombus */}
      <polygon
        points="12,1.5 22.5,12 12,22.5 1.5,12"
        fill={`url(#${outerGradId})`}
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Inner Beveled Facet Rhombus */}
      <polygon
        points="12,4.8 19.2,12 12,19.2 4.8,12"
        fill={`url(#${innerGradId})`}
        stroke="#FEF3C7"
        strokeOpacity="0.65"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Top Specular Facet */}
      <polygon
        points="12,4.8 19.2,12 12,12 4.8,12"
        fill={`url(#${shineGradId})`}
      />

      {/* Center Facet Cross Lines & Core Gem */}
      <path
        d="M12 4.8V19.2M4.8 12H19.2"
        stroke="#FFFBEB"
        strokeOpacity="0.45"
        strokeWidth="0.65"
      />
      <polygon
        points="12,9.2 14.8,12 12,14.8 9.2,12"
        fill="#FFFBEB"
        fillOpacity="0.88"
        stroke="#B45309"
        strokeOpacity="0.6"
        strokeWidth="0.6"
      />
    </svg>
  );
};

interface TokenPriceBadgeProps {
  amount: number;
  originalAmount?: number | null;
  discountPercent?: number | null;
  showSaleTag?: boolean;
  lang?: AppLanguage;
  size?: 'xs' | 'sm' | 'md';
  showUnit?: boolean;
  className?: string;
}

export const TokenPriceBadge: React.FC<TokenPriceBadgeProps> = ({
  amount,
  originalAmount,
  discountPercent,
  showSaleTag = true,
  lang = 'ar',
  size = 'sm',
  showUnit = false,
  className = '',
}) => {
  const isEn = lang === 'en';
  const unitLabel = isEn ? (amount === 1 ? 'Token' : 'Tokens') : 'عملة';
  const isOnSale =
    typeof originalAmount === 'number' &&
    Number.isFinite(originalAmount) &&
    originalAmount > amount;

  const sizeStyles =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px] gap-1'
      : size === 'md'
        ? 'px-2.5 py-1 text-xs gap-1.5'
        : 'px-2 py-0.5 text-[11px] gap-1';

  const iconSize = size === 'xs' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <span
      className={`inline-flex items-center rounded border font-mono-tabular font-bold whitespace-nowrap ${
        isOnSale
          ? 'border-rose-500/55 bg-rose-500/10 text-amber-600 dark:text-amber-300'
          : 'border-amber-500/45 bg-amber-500/12 text-amber-600 dark:text-amber-300'
      } ${sizeStyles} ${className}`}
    >
      {isOnSale && showSaleTag && (
        <span className="rounded bg-rose-600 px-1 py-px text-[9px] font-extrabold tracking-wide text-white">
          {isEn
            ? `SALE${discountPercent ? ` -${discountPercent}%` : ''}`
            : `سيل${discountPercent ? ` -${discountPercent}%` : ''}`}
        </span>
      )}
      {isOnSale && (
        <span
          className="relative inline-flex items-center justify-center px-0.5 text-[0.9em] font-semibold text-[var(--text-muted)]"
          aria-label={isEn ? `Original price ${originalAmount}` : `السعر السابق ${originalAmount}`}
        >
          <span>{originalAmount}</span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 h-[1.5px] -rotate-12 bg-rose-500"
          />
        </span>
      )}
      <TokenIcon className={iconSize} />
      <span>{amount}</span>
      {showUnit && <span className="font-sans font-semibold">{unitLabel}</span>}
    </span>
  );
};
