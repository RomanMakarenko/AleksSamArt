import { uk } from './uk';
import { en } from './en';
import { de } from './de';
import { fr } from './fr';
import { es } from './es';
import { it } from './it';
import { no } from './no';
import { pl } from './pl';
import { sv } from './sv';
import { cs } from './cs';
import type { Dictionary } from './dictionary';

export type { Dictionary } from './dictionary';

/** Усі підтримувані локалі (порядок — за CLAUDE.md). */
export const LOCALES = ['uk', 'en', 'de', 'fr', 'es', 'it', 'no', 'pl', 'sv', 'cs'] as const;
export type Locale = (typeof LOCALES)[number];

/** Дефолтна локаль — на корені `/` без префікса. */
export const DEFAULT_LOCALE: Locale = 'uk';

/** Людські назви мов для перемикача. */
export const LOCALE_NAMES: Record<Locale, string> = {
  uk: 'Українська',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  no: 'Norsk',
  pl: 'Polski',
  sv: 'Svenska',
  cs: 'Čeština',
};

/** Словники перекладів, по одному на локаль. */
export const DICTIONARIES: Record<Locale, Dictionary> = {
  uk,
  en,
  de,
  fr,
  es,
  it,
  no,
  pl,
  sv,
  cs,
};

/** Достатньо чи підтримується локаль (валідація для getStaticPaths/автовибору). */
export function isLocale(value: string | undefined): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}