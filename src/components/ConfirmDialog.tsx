import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { AppLanguage } from '../i18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  lang?: AppLanguage;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  lang = 'ar',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  const isEn = lang === 'en';
  const resolvedConfirm = confirmLabel ?? (isEn ? 'Confirm Delete' : 'تأكيد الحذف');
  const resolvedCancel = cancelLabel ?? (isEn ? 'Cancel' : 'إلغاء');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-6 text-[var(--text-ink)] shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              className="h-5 w-5 shrink-0 text-[var(--accent-primary)]"
              aria-hidden="true"
            />
            <h3 id="confirm-dialog-title" className="font-editorial text-xl font-bold">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            aria-label={isEn ? 'Close' : 'إغلاق'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-alt)] whitespace-nowrap shrink-0"
          >
            {resolvedCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};
