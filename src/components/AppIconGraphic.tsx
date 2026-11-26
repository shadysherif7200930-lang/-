import React, { useId } from 'react';
import { getAppIconById, type AppIconGradient, type AppIconId } from '../appIconCatalog';

interface AppIconGraphicProps {
  iconId?: AppIconId | string | null;
  maskable?: boolean;
  className?: string;
}

function GradientDef({ id, grad }: { id: string; grad: AppIconGradient }) {
  if (grad.type === 'radial') {
    return (
      <radialGradient id={id} cx="28%" cy="22%" r="78%">
        <stop offset="0%" stopColor={grad.from} />
        {grad.via && <stop offset="52%" stopColor={grad.via} />}
        <stop offset="100%" stopColor={grad.to} />
      </radialGradient>
    );
  }
  return (
    <linearGradient
      id={id}
      x1={grad.x1 ?? '0%'}
      y1={grad.y1 ?? '0%'}
      x2={grad.x2 ?? '100%'}
      y2={grad.y2 ?? '100%'}
    >
      <stop offset="0%" stopColor={grad.from} />
      {grad.via && <stop offset="50%" stopColor={grad.via} />}
      <stop offset="100%" stopColor={grad.to} />
    </linearGradient>
  );
}

export const AppIconGraphic: React.FC<AppIconGraphicProps> = ({
  iconId,
  maskable = false,
  className = 'h-full w-full',
}) => {
  const uid = useId().replace(/:/g, '');
  const icon = getAppIconById(iconId);

  const maskId = `icon-mask-${uid}`;
  const bgGradId = `icon-bg-${uid}`;
  const bookGradId = `icon-book-${uid}`;
  const cursorGradId = `icon-cursor-${uid}`;

  const bgPaint = icon.bgGradient ? `url(#${bgGradId})` : icon.bgFill;
  const bookPaint = icon.bookGradient ? `url(#${bookGradId})` : icon.bookStroke;
  const cursorPaint = icon.cursorGradient ? `url(#${cursorGradId})` : icon.cursorFill;
  const outerRx = maskable ? 0 : 96;

  const innerArtwork = (
    <>
      <rect
        x="36"
        y="36"
        width="440"
        height="440"
        rx="72"
        stroke={icon.borderStroke}
        strokeOpacity={icon.borderOpacity}
        strokeWidth="4"
      />
      <g transform="translate(56, 80) scale(4)">
        <g
          mask={`url(#${maskId})`}
          stroke={bookPaint}
          strokeWidth="5.2"
          strokeLinecap="butt"
          strokeLinejoin="round"
        >
          <path d="M 12 24 V 66 C 27 65 40 70 50 80 C 60 70 73 65 88 66 V 24" />
          <path d="M 50 27 C 43 19 32 17 21 17 V 59 C 31 59 41 64 50 74 C 59 64 69 59 79 59 V 17 C 68 17 57 19 50 27 Z" />
          <line x1="50" y1="26" x2="50" y2="74" strokeLinecap="round" />
        </g>
        <path
          d="M 60 47 L 66 72 L 71 67 L 78 74 L 83 69 L 76 62 L 83 57 Z"
          fill={cursorPaint}
        />
      </g>
    </>
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="100" height="88" fill="white" />
          <path
            d="M 60 47 L 66 72 L 71 67 L 78 74 L 83 69 L 76 62 L 83 57 Z"
            fill="black"
            stroke="black"
            strokeWidth="7"
            strokeLinejoin="round"
          />
        </mask>
        {icon.bgGradient && <GradientDef id={bgGradId} grad={icon.bgGradient} />}
        {icon.bookGradient && <GradientDef id={bookGradId} grad={icon.bookGradient} />}
        {icon.cursorGradient && <GradientDef id={cursorGradId} grad={icon.cursorGradient} />}
      </defs>
      <rect width="512" height="512" rx={outerRx} fill={bgPaint} />
      {maskable ? (
        <g transform="translate(51.2, 51.2) scale(0.8)">{innerArtwork}</g>
      ) : (
        innerArtwork
      )}
    </svg>
  );
};
