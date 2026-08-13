# Хендоф — етап 1: Інтернаціоналізація + конфіг ✅

> Наступна сесія починає звідси. Стан: **етап 1 завершено**, наступний — **етап 2 (Google Drive + Netlify Function)**.

## Статус етапу
✅ Виконано (12.08.2026). Критерії приймання підтверджені: build (10 маршрутів), dev (всі локалі 200), автовибір (юніт-тест 9/9).

## Що зроблено
- **Astro i18n** в `astro.config.mjs`: `defaultLocale: 'uk'`, `routing.prefixDefaultLocale: false` → `uk` на `/`, решта 9 локалей з префіксом (`/en/`, `/de/`, …). 10 статичних маршрутів.
- **Словники** `src/i18n/`: тип `Dictionary` (meta, hero, langSwitcher, footer, work, lightbox, form) + 10 файлів локалей (`uk.ts`, `en.ts`, `de.ts`, `fr.ts`, `es.ts`, `it.ts`, `no.ts`, `pl.ts`, `sv.ts`, `cs.ts`) + `index.ts` (`LOCALES`, `LOCALE_NAMES`, `DICTIONARIES`, `DEFAULT_LOCALE`, `isLocale`). Тексти — тільки в словниках.
- **Маршрути**: `src/pages/index.astro` (uk) + `src/pages/[lang]/index.astro` (`getStaticPaths` для 9 локалей, крім `uk`). Спільна розмітка — `src/components/Home.astro`.
- **Автовибір мови** — inline-скрипт у `<head>` (через `<script is:inline set:html={...}>`): бере `navigator.languages`, на корені `/` і без куки `lang` редиректить на `/xx/`; фолбек `uk`.
- **Перемикач мови** — `src/components/LanguageSwitcher.astro`: лінки через `getRelativeLocaleUrl`, активна — `aria-current="true"`, клік ставить куку `lang`.
- **Env у конфіг**: `CURRENCY`, `FACEBOOK_URL`, `INSTAGRAM_URL`, `CONTACT_EMAIL` читаються через `astro:env` (схема в `astro.config.mjs`). `src/config/site.ts` — джерело істини для розмірів/цін/соцмереж/валюти.
- `BaseLayout` приймає `lang`, ставить `<html lang>` + локалізовану `description`; футер із `footer.rights`.
- `netlify.toml`: redirect `/uk/*` → `/:splat` (301).

## Як перевірити
- `npm run build` → 10 сторінок: `/`, `/en/`, `/de/`, `/fr/`, `/es/`, `/it/`, `/no/`, `/pl/`, `/sv/`, `/cs/`.
- `npm run dev` (потім `astro dev status`; сервер — на :4321):
  - `curl localhost:4321/` → `<html lang="uk">`, український текст.
  - `curl localhost:4321/en/` → `lang="en"`, англійський текст, тощо.
  - Перемикач: на `/` активна `uk` (`aria-current`), лінки `/en/`, `/de/`, … .
- Автовибір: у браузері змінити мову на en та відкрити `/` — має перенаправити на `/en/`. Повторно — ні (кука `lang`).

## Ключові рішення та підводні камені
- **`astro:env` у Astro 7**: публічні змінні — це **іменовані експорти** `import { CURRENCY } from 'astro:env/server'`, а не об'єкт `env` (`env` / `getSecret` — лише для секретів). Через колізію імен імпортуються з суфіксом `_ENV`.
- **`{expr}` у `<script is:inline>` не парситься** компілятором (помилка `Expected ',' or '}'`). Рішення: зібрати JS у рядок у frontmatter і вставити `<script is:inline set:html={detectScript} />`.
- **Автовибір — client-side, не серверний redirect**: Netlify redirects з умовою `Language` ігнорують куку і «перемикали» б користувача назад щоразу на `/`. Client-side скрипт поважає куку й працює локально в dev.
- **`src/pages/[lang]/index.astro`** лежить на рівень глибше — імпорти `../../`, не `../`.
- `astro dev` запускати з кореня проєкту (запуск із `dist/` дає `Missing pages directory: src/pages` + 404). Порт 4321 зайнятий старим сервером — `astro dev stop` перед перезапуском.
- `astro check` не встановлено (інтерактивний prompt пропонує `npm i @astrojs/check typescript`) — не запускати без наміру встановити; додати на етапі 6.

## Відкриті питання
- Розміри/ціни та `ARTWORK_PRICES` — чекаємо список від користувача.
- `astro check`/type-check — додати devDeps на етапі 6.
- Реальний URL сайту (для `site` + sitemap/hreflang) — після деплою (етап 6/7).
- Поведінка проданих робіт (приховати чи бейдж) — рішення (етап 2 зачепить SOLD-фільтр).

## Наступні дії (Етап 2 — Google Drive + Netlify Function)
1. `src/lib/drive.ts`: OAuth (client id/secret + refresh token), список папок кореня → роботи, файли в папці, `00-*` = main, решта = галерея, сортування.
2. SOLD-фільтр: виключити папки з префіксом `SOLD-`.
3. Netlify Function `list-works` (директорія вже налаштована: `[functions] directory = "src/functions"`).
4. `scripts/setup-google.mjs` (OAuth flow → дописує `GOOGLE_REFRESH_TOKEN` у `.env`).
5. Build-time вшивання списку робіт у статику (SEO); локальний тест через `netlify dev`.
6. Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID` (вже в `.env.example`).