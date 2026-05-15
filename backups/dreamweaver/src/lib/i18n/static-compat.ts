/**
 * Static Export Compatibility Layer for i18n
 *
 * This module provides a fallback implementation of next-intl APIs
 * when running in static export mode (NEXT_STATIC_EXPORT=true).
 *
 * In static mode:
 * - Uses browser-based language detection instead of server-side
 * - Falls back to Chinese (zh-CN) as default locale
 * - Provides mock implementations of next-intl hooks
 */

const isStaticExport = typeof window !== 'undefined' || process.env.NEXT_STATIC_EXPORT === 'true';

export const locales = ['zh-CN', 'en-US'] as const;
export const defaultLocale = 'zh-CN';

interface Messages {
  [key: string]: string | Messages;
}

let cachedMessages: Record<string, Messages> = {};

async function loadMessages(locale: string): Promise<Messages> {
  if (cachedMessages[locale]) {
    return cachedMessages[locale];
  }

  try {
    if (isStaticExport) {
      const messages = await import(`../messages/${locale}.json`);
      cachedMessages[locale] = messages.default;
      return messages.default;
    } else {
      const { getRequestConfig } = await import('./request');
      const config = await getRequestConfig({ locale });
      return config.messages as unknown as Messages;
    }
  } catch (error) {
    console.error(`Failed to load messages for ${locale}:`, error);
    return {};
  }
}

export function getLocaleFromPathname(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return defaultLocale;
}

export function stripLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale === defaultLocale) {
    return pathname;
  }
  return pathname.replace(new RegExp(`^/${locale}(/|$)`), '$1') || '/';
}

export async function getMessages(locale: string) {
  return loadMessages(locale);
}

if (isStaticExport) {
  export function useTranslations() {
    return (key: string) => key;
  }

  export function useLocale() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale');
      if (stored && locales.includes(stored as any)) {
        return stored;
      }
      const browserLang = navigator.language || 'zh-CN';
      return locales.find(l => browserLang.startsWith(l)) || defaultLocale;
    }
    return defaultLocale;
  }
}
