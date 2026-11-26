import React, { useId } from 'react';

interface MaktabtyLogoProps {
  className?: string;
  title?: string;
}

const BOOK_OUTER_COVER_PATH =
  'M 12 24 V 66 C 27 65 40 70 50 80 C 60 70 73 65 88 66 V 24';

const BOOK_PAGES_PATH =
  'M 50 27 C 43 19 32 17 21 17 V 59 C 31 59 41 64 50 74 C 59 64 69 59 79 59 V 17 C 68 17 57 19 50 27 Z';

const CURSOR_PATH =
  'M 60 47 L 66 72 L 71 67 L 78 74 L 83 69 L 76 62 L 83 57 Z';

export const MaktabtyLogo: React.FC<MaktabtyLogoProps> = ({
  className = 'h-7 w-7',
  title,
}) => {
  const rawId = useId();
  const maskId = `maktabty-logo-mask-${rawId.replace(/:/g, '')}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 88"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="100" height="88" fill="white" />
          <path
            d={CURSOR_PATH}
            fill="black"
            stroke="black"
            strokeWidth="7"
            strokeLinejoin="round"
          />
        </mask>
      </defs>

      <g
        mask={`url(#${maskId})`}
        stroke="currentColor"
        strokeWidth="5.2"
        strokeLinecap="butt"
        strokeLinejoin="round"
      >
        <path d={BOOK_OUTER_COVER_PATH} />
        <path d={BOOK_PAGES_PATH} />
        <line x1="50" y1="26" x2="50" y2="74" strokeLinecap="round" />
      </g>

      <path d={CURSOR_PATH} fill="currentColor" />
    </svg>
  );
};
