export type Locale = (typeof locales)[number];

export const locales = ['ja', 'en'] as const;
export const defaultLocale: Locale = 'ja';