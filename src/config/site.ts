/**
 * Центральний конфіг проєкту.
 * Значення, що залежать від env, читаються через `astro:env` (схема в
 * `astro.config.mjs`). Регіональні ціни зберігаються статично, а регіон
 * відвідувача визначається клієнтом за локаллю браузера/сторінки.
 */
import {
  CONTACT_EMAIL as CONTACT_EMAIL_ENV,
  FACEBOOK_URL as FACEBOOK_URL_ENV,
  INSTAGRAM_URL as INSTAGRAM_URL_ENV,
} from 'astro:env/server';

/** Бренд — не перекладається. Локалізовані тексти — у словниках `src/i18n/`. */
export const SITE = {
  title: 'Aleks Sam art',
};

/** Соцмережі — з env (FACEBOOK_URL / INSTAGRAM_URL). */
export const SOCIAL_LINKS: { facebook: string; instagram: string } = {
  facebook: FACEBOOK_URL_ENV,
  instagram: INSTAGRAM_URL_ENV,
};

export type PricingRegion = 'ua' | 'international';

export const PRICING_CURRENCIES: Record<PricingRegion, string> = {
  ua: 'UAH',
  international: 'EUR',
};

/** Варіанти індивідуального замовлення. */
export const ORDER_SIZES = [
  { id: 'A4-1', label: 'A4', people: 1 },
  { id: 'A4-2', label: 'A4', people: 2 },
  { id: 'A3-1', label: 'A3', people: 1 },
  { id: 'A3-2', label: 'A3', people: 2 },
] as const;

export type OrderSizeId = (typeof ORDER_SIZES)[number]['id'];

/** Ціни індивідуальних портретів: Україна — гривні, інші країни — євро. */
export const ORDER_PRICES: Record<PricingRegion, Record<OrderSizeId, number>> = {
  ua: {
    'A4-1': 2000,
    'A4-2': 3000,
    'A3-1': 3500,
    'A3-2': 5000,
  },
  international: {
    'A4-1': 80,
    'A4-2': 120,
    'A3-1': 130,
    'A3-2': 180,
  },
};

/** Спеціальний варіант розміру: ціна визначається індивідуально. */
export const CUSTOM_SIZE_ID = 'custom' as const;

/** Ціни готових портретів завжди в євро, незалежно від країни. */
export const ARTWORK_PRICES: Record<string, number> = {
  'Robbie Williams': 100,
  'Drew Barrymore': 70,
  'Dua Lipa': 70,
};

/** Базова ціна готового портрета, якщо окремої ціни немає в мапі. */
export const DEFAULT_ARTWORK_PRICE = 50;
export const ARTWORK_CURRENCY = 'EUR';

export function getOrderPrice(region: PricingRegion, sizeId: string): number | null {
  if (!(sizeId in ORDER_PRICES[region])) return null;
  return ORDER_PRICES[region][sizeId as OrderSizeId];
}

export function getArtworkPrice(workId: string, workName: string): number {
  return ARTWORK_PRICES[workId] ?? ARTWORK_PRICES[workName] ?? DEFAULT_ARTWORK_PRICE;
}

/** Форматує ціну з валютою. */
export function formatPrice(price: number, currency: string): string {
  return `${price} ${currency}`;
}

export type ArtworkFormat = 'A4' | 'A3';

/** Формати готових робіт: за замовчуванням A4, окремі роботи — A3. */
export const ARTWORK_FORMATS: Record<string, ArtworkFormat> = {
  'Drew Barrymore': 'A3',
  'Dua Lipa': 'A3',
};

export function getArtworkFormat(workId: string, workName: string): ArtworkFormat {
  return ARTWORK_FORMATS[workId] ?? ARTWORK_FORMATS[workName] ?? 'A4';
}

/** Email для замовлень (Netlify Forms) — з env CONTACT_EMAIL. */
export const CONTACT_EMAIL = CONTACT_EMAIL_ENV;
