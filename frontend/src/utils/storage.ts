const TOKEN_KEY = 'kaa_terms_token';

/** localStorage may be unavailable (private mode, blocked storage) — never let it crash the app. */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

const SITE_PREVIEW_KEY = 'kaa_site_preview';

/**
 * Per-tab flag: a teacher opened the public site from the admin panel.
 * sessionStorage keeps it scoped to that tab, so the panel tab keeps its normal redirects.
 */
export const sitePreview = {
  isOn(): boolean {
    try {
      return sessionStorage.getItem(SITE_PREVIEW_KEY) === '1';
    } catch {
      return false;
    }
  },
  enable() {
    try {
      sessionStorage.setItem(SITE_PREVIEW_KEY, '1');
    } catch {
      // ignore
    }
  },
};
