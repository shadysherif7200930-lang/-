import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onIdTokenChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  apiFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onIdTokenChanged(auth, (nextUser) => {
      if (!mounted) return;
      setUser(nextUser);
      setAuthLoading(false);
    });
    void auth
      .authStateReady()
      .then(() => {
        if (!mounted) return;
        setUser(auth.currentUser);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthLoading(false);
      });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      setUser(cred.user);
      setAuthLoading(false);
      return cred.user;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign in with Google.';
      setAuthError(message);
      return null;
    }
  }, []);

  const signOutUser = useCallback(async (): Promise<void> => {
    setAuthError(null);
    await signOut(auth);
    setUser(null);
  }, []);

  const getIdToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    const current = auth.currentUser;
    if (!current) return null;
    try {
      return await current.getIdToken(forceRefresh);
    } catch {
      return null;
    }
  }, []);

  const apiFetch = useCallback(
    async (input: string, init: RequestInit = {}): Promise<Response> => {
      const buildHeaders = (token: string | null) => {
        const headers = new Headers(init.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        if (init.body && !headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
        return headers;
      };

      const token = await getIdToken(false);
      let res = await fetch(input, {
        ...init,
        headers: buildHeaders(token),
      });

      if (res.status === 401 && auth.currentUser) {
        const refreshed = await getIdToken(true);
        if (refreshed && refreshed !== token) {
          res = await fetch(input, {
            ...init,
            headers: buildHeaders(refreshed),
          });
        }
      }

      return res;
    },
    [getIdToken]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        authError,
        signInWithGoogle,
        signOutUser,
        getIdToken,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
