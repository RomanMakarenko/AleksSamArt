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

/** Розміри/ціни для потоку «Замовити» (тимчасові дефолти з CLAUDE.md). */
export const ORDER_SIZES = [
  { id: 'A4', label: 'A4', price: 100 },
  { id: 'A3', label: 'A3', price: 200 },
  { id: 'A2', label: 'A2', price: 300 },
] as const;

/** Спеціальний варіант розміру у формі «Замовити»: свій розмір → ціна договірна. */
export const CUSTOM_SIZE_ID = 'custom' as const;

/** Форматує ціну: «100 USD» (валюта — з env CURRENCY). */
export function formatPrice(price: number): string {
  return `${price} ${CURRENCY}`;
}

/** Ціни готових робіт: назва папки → ціна. Поки порожня (заповниться пізніше). */
export const ARTWORK_PRICES: Record<string, number> = {};

/** Email для замовлень (Netlify Forms) — з env CONTACT_EMAIL. */
export const CONTACT_EMAIL = CONTACT_EMAIL_ENV;