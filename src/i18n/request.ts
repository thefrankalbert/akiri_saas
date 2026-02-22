import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async () => {
  // Priority: cookie > Accept-Language header > default
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;

  let locale: Locale = defaultLocale;

  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  } else {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language') || '';
    const preferred = acceptLanguage.split(',')[0]?.split('-')[0]?.trim();
    if (preferred && locales.includes(preferred as Locale)) {
      locale = preferred as Locale;
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
