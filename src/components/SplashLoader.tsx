import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { AppLanguage } from '../i18n';
import { MaktabtyLogo } from './MaktabtyLogo';

interface SplashLoaderProps {
  durationMs?: number;
  lang?: AppLanguage;
  onComplete: () => void;
}

const LOADING_STAGES_AR = [
  'تهيئة المكتبة الرقمية وتجهيز الواجهة...',
  'فحص قاعدة البيانات المحلية IndexedDB...',
  'التحقق من تحديثات الكتب عبر Service Worker...',
  'تحميل السمات والخطوط العربية...',
  'تجهيز رفوف الكتب وتقدم القراءة...',
  'اكتمل التجهيز — أهلاً بك',
];

const LOADING_STAGES_EN = [
  'Initializing digital library interface...',
  'Checking local IndexedDB storage...',
  'Checking Service Worker book updates...',
  'Loading themes and editorial typography...',
  'Preparing bookshelves and reading progress...',
  'Ready — Welcome',
];

export const SplashLoader: React.FC<SplashLoaderProps> = ({
  durationMs = 10000,
  lang = 'ar',
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const isEn = lang === 'en';
  const stages = isEn ? LOADING_STAGES_EN : LOADING_STAGES_AR;
  const isGoldenKing =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'golden-king';

  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const start = performance.now();
    let frameId = 0;
    let done = false;
    let finishTimer = 0;

    const complete = () => {
      if (done) return;
      done = true;
      setProgress(100);
      finishTimer = window.setTimeout(() => {
        onCompleteRef.current();
      }, 220);
    };

    const tick = (now: number) => {
      if (done) return;
      const elapsed = now - start;
      const ratio = Math.min(1, elapsed / durationMs);
      const eased =
        ratio < 0.5
          ? 2 * ratio * ratio * 0.45 + ratio * 0.55
          : (1 - Math.pow(-2 * ratio + 2, 2) / 2) * 0.45 + ratio * 0.55;
      const pct = Math.min(100, Math.round(eased * 100));
      setProgress(pct);

      if (ratio < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        complete();
      }
    };

    frameId = requestAnimationFrame(tick);
    const safetyTimer = window.setTimeout(complete, durationMs + 300);
    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(safetyTimer);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, [durationMs]);

  const stageIndex = Math.min(
    stages.length - 1,
    Math.floor((progress / 100) * stages.length)
  );

  return (
    <div
      className="app-canvas-bg fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-[var(--text-ink)]"
      role="status"
      aria-live="polite"
      aria-label={isEn ? 'Loading maktabty' : 'جاري تحميل مكتبتي maktabty'}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 sm:inset-8 rounded-lg border border-[var(--border-hairline)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-md flex-col items-center text-center"
      >
        <div className="relative flex h-24 w-24 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-[var(--accent-primary)]/60"
          />
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className={`flex h-16 w-16 items-center justify-center rounded-full border border-[var(--accent-primary)] shadow-lg ${
              isGoldenKing ? 'bg-[#050505]' : 'bg-[var(--bg-surface)]'
            }`}
          >
            <MaktabtyLogo
              className={`h-8 w-8 ${
                isGoldenKing ? 'text-[#D4AF37]' : 'text-[var(--accent-primary)]'
              }`}
            />
          </motion.div>
        </div>

        <h1 className="mt-7 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 font-editorial text-4xl font-bold tracking-tight text-[var(--text-ink)] sm:text-5xl">
          <span>مكتبتي</span>
          <span
            dir="ltr"
            className="font-mono-tabular text-2xl font-semibold tracking-wider text-[var(--accent-primary)] sm:text-3xl"
          >
            maktabty
          </span>
        </h1>

        <div
          dir="ltr"
          className="mt-4 inline-flex items-center justify-center rounded-lg border-2 border-[var(--accent-primary)] bg-[var(--bg-surface)] px-6 py-2.5 shadow-[0_0_24px_-6px_var(--accent-primary)]"
        >
          <span className="bg-gradient-to-r from-amber-500 via-[var(--accent-primary)] to-amber-600 bg-clip-text font-mono-tabular text-sm font-bold tracking-[0.2em] text-transparent sm:text-base">
            created by Shady
          </span>
        </div>

        <div className="mt-10 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]/90 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-[var(--text-muted)]">
              {stages[stageIndex]}
            </span>
            <span className="font-mono-tabular text-sm font-bold text-[var(--accent-primary)] shrink-0">
              {progress}%
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-alt)]">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>{isEn ? 'Local IndexedDB Storage' : 'تخزين محلي IndexedDB'}</span>
            <span className="font-mono-tabular">
              {Math.max(0, Math.ceil(((100 - progress) / 100) * (durationMs / 1000)))}{' '}
              {isEn ? 's' : 'ث'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
