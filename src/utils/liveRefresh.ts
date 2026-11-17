declare global {
  interface Window {
    startLiveRefresh?: (
      loadFunction: () => void | Promise<unknown>,
      interval?: number
    ) => () => void;
  }
}

export const LIVE_REFRESH_INTERVAL_MS = 5000;

/**
 * Delegates periodic polling to the shared `startLiveRefresh(loadFunction, interval)`
 * defined in `/js/main.js`, returning an unsubscribe cleanup function.
 */
export function subscribeLiveRefresh(
  loadFunction: () => void | Promise<unknown>,
  interval: number = LIVE_REFRESH_INTERVAL_MS
): () => void {
  if (typeof window !== 'undefined' && typeof window.startLiveRefresh === 'function') {
    return window.startLiveRefresh(loadFunction, interval);
  }

  let disposed = false;
  let stopFn: (() => void) | null = null;
  let fallbackTimer: number | null = null;

  const attachOrFallback = () => {
    if (disposed) return;
    if (typeof window !== 'undefined' && typeof window.startLiveRefresh === 'function') {
      stopFn = window.startLiveRefresh(loadFunction, interval);
      return;
    }

    let inFlight = false;
    fallbackTimer = window.setInterval(() => {
      if (disposed || inFlight) return;
      if (document.visibilityState === 'hidden') return;
      inFlight = true;
      Promise.resolve(loadFunction()).finally(() => {
        inFlight = false;
      });
    }, interval);
  };

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachOrFallback, { once: true });
  } else {
    attachOrFallback();
  }

  return () => {
    disposed = true;
    if (typeof document !== 'undefined') {
      document.removeEventListener('DOMContentLoaded', attachOrFallback);
    }
    if (stopFn) {
      stopFn();
      stopFn = null;
    }
    if (fallbackTimer !== null) {
      window.clearInterval(fallbackTimer);
      fallbackTimer = null;
    }
  };
}
