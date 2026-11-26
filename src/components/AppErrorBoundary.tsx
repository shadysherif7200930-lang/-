import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('App render recovery triggered:', error);
  }

  private handleRecover = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // ignore cleanup failures
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isEn =
        typeof document !== 'undefined' &&
        document.documentElement.getAttribute('lang') === 'en';
      return (
        <div
          dir={isEn ? 'ltr' : 'rtl'}
          className="app-canvas-bg flex min-h-screen flex-col items-center justify-center px-6 text-center text-[var(--text-ink)]"
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-7 shadow-sm">
            <h1 className="font-editorial text-2xl font-bold text-[var(--text-ink)]">
              {isEn ? 'Restoring Library View' : 'جاري استعادة عرض المكتبة'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {isEn
                ? 'A temporary browser cache issue occurred after resuming. Tap below to reload cleanly.'
                : 'حدث تعارض مؤقت في الذاكرة المؤقتة بعد إعادة الفتح. اضغط أدناه لإعادة تحميل المكتبة بشكل سليم.'}
            </p>
            <button
              type="button"
              onClick={() => void this.handleRecover()}
              className="mt-5 inline-flex items-center justify-center rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
            >
              {isEn ? 'Reload Library' : 'إعادة فتح المكتبة'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
