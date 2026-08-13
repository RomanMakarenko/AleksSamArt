// @ts-check
import { defineConfig, envField } from 'astro/config';

// TODO(етап 6): заповнити `site` реальним URL після деплою (потрібно для sitemap/hreflang).
export default defineConfig({
  i18n: {
    defaultLocale: 'uk',
    locales: ['uk', 'en', 'de', 'fr', 'es', 'it', 'no', 'pl', 'sv', 'cs'],
    routing: {
      // Дефолтна локаль `uk` — на корені `/`, решта — з префіксом (`/en/`, `/de/`, …).
      prefixDefaultLocale: false,
    },
  },

  // Env-змінні, які потрапляють у код із `astro:env`.
  env: {
    schema: {
      // Примітка: `description` не входить у тип `envField` цієї версії Astro —
      // опис змінних зберігається в `.env.example` (див. `src/config/site.ts`).
      CURRENCY: envField.string({
        context: 'server',
        access: 'public',
        default: 'USD',
      }),
      FACEBOOK_URL: envField.string({
        context: 'server',
        access: 'public',
        default: '',
      }),
      INSTAGRAM_URL: envField.string({
        context: 'server',
        access: 'public',
        default: '',
      }),
      CONTACT_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: '',
      }),
    },
  },
});