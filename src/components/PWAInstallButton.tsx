import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { UI_COPY, type AppLanguage } from '../i18n';

interface PWAInstallButtonProps {
  onBrowseLibrary: () => void;
  lang?: AppLanguage;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onBrowseLibrary,
  lang = 'ar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const copy = UI_COPY[lang];
  const isEn = lang === 'en';

  if (isInstalled) {
    return (
      <button
        type="button"
        onClick={onBrowseLibrary}
        className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-[var(--btn-dark-fg)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
      >
        {copy.browseBooks}
      </button>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        {copy.installLibrary}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-[var(--btn-dark-fg)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.installIOS}
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-6 text-[var(--text-ink)] shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-3">
                <h3 id="ios-install-title" className="font-editorial text-xl font-bold">
                  {isEn ? 'Install on iPhone & iPad' : 'تثبيت المكتبة على iPhone و iPad'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
                  aria-label={isEn ? 'Close' : 'إغلاق'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {isEn ? (
                  <>
                    <li>1. Tap the Share button in Safari.</li>
                    <li>2. Scroll down and select "Add to Home Screen".</li>
                    <li>3. Launch the app offline anytime.</li>
                  </>
                ) : (
                  <>
                    <li>١. اضغط على زر المشاركة (Share) في شريط سفاري.</li>
                    <li>٢. مرّر للأسفل واختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</li>
                    <li>٣. افتح التطبيق ككتاب رقمي مستقل يعمل حتى بدون إنترنت.</li>
                  </>
                )}
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-md bg-[var(--btn-dark)] px-4 py-2 text-sm font-medium text-[var(--btn-dark-fg)] hover:bg-[var(--accent-primary)] transition-colors"
              >
                {isEn ? 'Got it' : 'فهمت'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onBrowseLibrary}
      className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-dark)] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-[var(--btn-dark-fg)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--accent-fg)] whitespace-nowrap shrink-0"
    >
      {copy.browseBooks}
    </button>
  );
};
