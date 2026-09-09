/**
 * Центральний конфіг проєкту.
 * Значення, що залежать від env, читаються через `astro:env` (схема в astro.config.mjs).
 * Розміри/ціни — тимчасові дефолти з CLAUDE.md, чекаємо список від користувача.
 */
import {
  CURRENCY as CURRENCY_ENV,
  CONTACT_EMAIL as CONTACT_EMAIL_ENV,
  FACEBOOK_URL as FACEBOOK_URL_ENV,
  INSTAGRAM_URL as INSTAGRAM_URL_ENV,
} from 'astro:env/server';

/** Бренд — не перекладається. Локалізовані тексти — у словниках `src/i18n/`. */
export const SITE = {
  title: 'AleksSamArt',
};

/** Соцмережі — з env (FACEBOOK_URL / INSTAGRAM_URL). */
export const SOCIAL_LINKS: { facebook: string; instagram: string } = {
  facebook: FACEBOOK_URL_ENV,
  instagram: INSTAGRAM_URL_ENV,
};

/** Валюта цін. Дефолт USD (умовні одиниці), змінюється через env CURRENCY. */
export const CURRENCY = CURRENCY_ENV;

/** Розміри/ціни для потоку «Замовити»: формат і кількість людей. */
export const ORDER_SIZES = [
  { id: 'A4-1', label: 'A4', people: 1, price: 50 },
  { id: 'A4-2', label: 'A4', people: 2, price: 70 },
  { id: 'A3-1', label: 'A3', people: 1, price: 100 },
  { id: 'A3-2', label: 'A3', people: 2, price: 140 },
] as const;

/** Спеціальний варіант розміру у формі «Замовити»: свій розмір → ціна договірна. */
export const CUSTOM_SIZE_ID = 'custom' as const;

/** Фіксована ціна готових робіт, якщо для роботи немає окремої ціни. */
export const PORTRAIT_PRICE = 160;

/** Форматує ціну (валюта — з env CURRENCY). */
export function formatPrice(price: number): string {
  return `${price} ${CURRENCY}`;
}

/** Ціни готових робіт: назва папки → ціна. */
export const ARTWORK_PRICES: Record<string, number> = {
  'Robbie Williams': 300,
};

/** Email для замовлень (Netlify Forms) — з env CONTACT_EMAIL. */
export const CONTACT_EMAIL = CONTACT_EMAIL_ENV;