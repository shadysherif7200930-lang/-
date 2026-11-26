import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import './index.css';

declare global {
  interface Window {
    __MAKTABTY_MOUNTED__?: boolean;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AppErrorBoundary>
);

window.__MAKTABTY_MOUNTED__ = true;
