import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { UI_COPY, type AppLanguage } from '../i18n';

interface OfflineIndicatorProps {
  lang?: AppLanguage;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang = 'ar' }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--btn-dark)] px-4 py-2 text-xs font-medium text-[var(--btn-dark-fg)] shadow-md"
    >
      <WifiOff className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
      <span>{UI_COPY[lang].offlineNotice}</span>
    </div>
  );
};
