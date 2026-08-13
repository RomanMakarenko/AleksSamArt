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

  // Env-змінні, які потрапляють у код із `astro:env`. Google-секрети (`GOOGLE_*`)
  // сюди не потрапляють — вони читаються напряму в Netlify Function (етап 2).
  env: {
    schema: {
      CURRENCY: envField.string({
        context: 'server',
        access: 'public',
        default: 'USD',
        description: 'Валюта цін (умовні одиниці).',
      }),
      FACEBOOK_URL: envField.string({
        context: 'server',
        access: 'public',
        default: '',
        description: 'Посилання на Facebook.',
      }),
      INSTAGRAM_URL: envField.string({
        context: 'server',
        access: 'public',
        default: '',
        description: 'Посилання на Instagram.',
      }),
      CONTACT_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: '',
        description: 'Email, на який приходять замовлення (Netlify Forms).',
      }),
    },
  },
});