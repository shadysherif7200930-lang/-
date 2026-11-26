export interface SWDiagnostics {
  supported: boolean;
  controllerActive: boolean;
  swVersion: string | null;
  cacheNames: string[];
  cachedEntriesCount: number;
}

let activeRegistration: ServiceWorkerRegistration | null = null;
let reloadGuard = false;
let userRequestedUpdate = false;

export function registerServiceWorker(onCatalogUpdated?: () => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!userRequestedUpdate || reloadGuard) return;
    reloadGuard = true;
    window.location.reload();
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    const payload = event.data;
    if (!payload) return;
    if (payload.type === 'CATALOG_UPDATED' || payload.type === 'SW_ACTIVATED') {
      onCatalogUpdated?.();
    }
  });

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      activeRegistration = registration;

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            installing.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });

      window.setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 60 * 1000);
    } catch {
      // Service Worker registration failed silently in unsupported contexts
    }
  };

  if (document.readyState === 'complete') {
    void register();
  } else {
    window.addEventListener('load', () => {
      void register();
    });
  }
}

export async function checkForServiceWorkerUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = activeRegistration || (await navigator.serviceWorker.getRegistration('/'));
    if (!reg) return false;
    await reg.update();
    if (reg.waiting) {
      userRequestedUpdate = true;
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    }
    if (reg.active) {
      reg.active.postMessage({ type: 'FORCE_CATALOG_REFRESH' });
    }
    return false;
  } catch {
    return false;
  }
}

export async function getServiceWorkerDiagnostics(): Promise<SWDiagnostics> {
  const supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  if (!supported) {
    return {
      supported: false,
      controllerActive: false,
      swVersion: null,
      cacheNames: [],
      cachedEntriesCount: 0,
    };
  }

  let cacheNames: string[] = [];
  let cachedEntriesCount = 0;

  if ('caches' in window) {
    try {
      cacheNames = await caches.keys();
      const counts = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return keys.length;
        })
      );
      cachedEntriesCount = counts.reduce((sum, n) => sum + n, 0);
    } catch {
      cacheNames = [];
    }
  }

  let swVersion: string | null = null;
  const controller = navigator.serviceWorker.controller;
  if (controller) {
    swVersion = await new Promise<string | null>((resolve) => {
      const channel = new MessageChannel();
      const timer = window.setTimeout(() => resolve(null), 500);
      channel.port1.onmessage = (e) => {
        window.clearTimeout(timer);
        resolve(e.data?.version ?? null);
      };
      controller.postMessage({ type: 'GET_SW_INFO' }, [channel.port2]);
    });
  }

  return {
    supported: true,
    controllerActive: Boolean(controller),
    swVersion,
    cacheNames,
    cachedEntriesCount,
  };
}
