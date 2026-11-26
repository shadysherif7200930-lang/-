import React from 'react';
import { Loader2 } from 'lucide-react';
import type { AppLanguage } from '../i18n';

interface LazyViewFallbackProps {
  lang?: AppLanguage;
  fullScreen?: boolean;
  compact?: boolean;
}

export const LazyViewFallback: React.FC<LazyViewFallbackProps> = ({
  lang = 'ar',
  fullScreen = false,
  compact = false,
}) => {
  const isEn = lang === 'en';

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--bg-canvas)] px-6 text-[var(--text-muted)]"
      >
        <Loader2 className="h-7 w-7 animate-spin text-[var(--accent-primary)]" aria-hidden="true" />
        <p className="text-xs font-medium">
          {isEn ? 'Loading reading experience...' : 'جاري تحميل واجهة القراءة...'}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-8 flex items-center justify-center gap-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-8 text-xs font-medium text-[var(--text-muted)]"
      >
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" aria-hidden="true" />
        <span>{isEn ? 'Loading section...' : 'جاري تحميل القسم...'}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-6xl px-6 py-14 lg:px-8"
    >
      <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" aria-hidden="true" />
        <p className="text-xs font-medium text-[var(--text-muted)]">
          {isEn ? 'Loading content...' : 'جاري تحميل الصفحة...'}
        </p>
      </div>
    </div>
  );
};
