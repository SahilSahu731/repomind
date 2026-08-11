interface AnalyticsEvent {
  event: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: AnalyticsEvent[];
    __repomind_analytics?: boolean;
  }
}

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  // If using Google Analytics, the site could push to dataLayer here.
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  // mark initialized
  window.__repomind_analytics = true;
}

export function trackPage(path: string) {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event: 'pageview', page: path });
}

export function trackEvent(name: string, props: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event: name, ...props });
}
