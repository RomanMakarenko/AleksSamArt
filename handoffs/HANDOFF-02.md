# Хендоф — етап 2: Google Drive + Netlify Function ⚠️

> Наступна сесія починає звідси. Стан: **код Етапу 2 готовий**, реальне підключення Google Drive **відкладено** (помилка «400 malformed» в OAuth); зараз активний **mock-режим** із тестовими фото. Наступний етап — **3 (стек карток GSAP)**, дані вже доступні.

## Статус етапу
⚠️ частково. Критерії приймання, що не залежать від реального Drive, підтверджені (тести 24/24, build, `netlify functions:serve`). Реальна перевірка з Drive — відкладена до налаштування OAuth.

## Що зроблено
- **`src/lib/drive.ts`** — спільна логіка Drive (без залежностей на Astro, бандлиться Netlify окремо):
  - OAuth: refresh token → access token (`oauth2.googleapis.com/token`);
  - список папок кореня (`orderBy=name`, пагінація) → файли в папці;
  - `00-*` = main (fallback: перше зображення), решта = галерея, не-зображення ігноруються;
  - `SOLD-`-фільтр (`isSold`, `cleanWorkName`), природне сортування (`localeCompare` numeric);
  - конкурентність обробки папок (ліміт 8), `DriveError` із `status`;
  - env із `process.env` + підтягування `.env` (Node `loadEnvFile`, не перезаписує оточення).
- **`src/lib/works.ts`** — єдина точка входу:
  - `getWorksForBuild()` — build-time, кеш на build (10 локалей = 1 запит), для SEO-вшивання;
  - `getWorksRuntime()` — без кешу, для Netlify Function;
  - **mock-режим**: якщо Drive не налаштовано → тестові роботи з `src/lib/mock-works.ts` (з попередженням у лог на build).
- **`src/lib/mock-works.ts` + `public/test-works/`** — тимчасові роботи (Ave Maria, Море, Захід сонця) із SVG-плейсхолдерами. Формат = `DriveWork`, перехід на Drive без змін у компонентах.
- **Netlify Function `src/functions/list-works.mjs`** — GET `/.netlify/functions/list-works` → JSON; `Cache-Control: no-store`; CORS; заголовок `x-data-source: drive|mock`. Шлях виявлення підтверджено (`src/functions` + `node_bundler = "esbuild"` у `netlify.toml`).
- **`scripts/setup-google.mjs`** (`npm run setup:google`) — OAuth flow: локальний сервер, відкриття браузера, обмін коду на refresh token, upsert у `.env`. Порт можна перевизначити: `--port N` або `GOOGLE_REDIRECT_URI`.
- **`src/components/Home.astro`** — рендерить роботи з build-time списку (`.works__list`, тимчасово, до Етапу 3).
- **Тести** `scripts/test-drive.mjs` (`npm run test:drive`): 24 перевірки, зокрема повний `listWorks` із мокнутим fetch (OAuth + Drive API), SOLD-фільтр, fallback main, mock-режим.
- Env: у `.env` — `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (ввів користувач). Відсутні `GOOGLE_REFRESH_TOKEN` та `GOOGLE_DRIVE_FOLDER_ID`.

## Як перевірити
- `npm run test:drive` → «✅ 24 перевірок пройдено».
- `npm run build` → 10 сторінок; у `dist/index.html` — `class="works__list"` із тестовими фото (`/test-works/*.svg`); у логу попередження про mock.
- `npx netlify functions:serve` (порт 9999) → `curl localhost:9999/.netlify/functions/list-works` → 200, JSON з 3 робіт, заголовок `x-data-source: mock`; `OPTIONS` → 204.
- `npm run dev` → на сторінці видно тестові роботи (стек карток з'явиться на Етапі 3).
- `npm run setup:google` (коли OAuth налаштують) → відкриває Google, після «Allow» дописує `GOOGLE_REFRESH_TOKEN` у `.env`.

## Ключові рішення та підводні камені
- **Mock замість порожнього списку**: доки Drive не підключено, build і функція повертають тестові роботи — інакше етапи 3–5 неможливо розробляти. **Не деплоїти продакшен із mock-даними.**
- **«400 malformed» у Google OAuth** — це налаштування консолі, не код: майже напевно незавершений **OAuth consent screen** (немає назви застосунку/email підтримки) і/або незареєстрований **redirect URI `http://localhost:8787`**. Кроки фіксу описані в повідомленні сесії. Додатково: статус має бути **Production** (у Testing — refresh token живе 7 днів), акаунт — у Test users, якщо Testing.
- **`src/lib/drive.ts` не імпортує Astro** — функція бандлиться esbuild-ом окремо від Astro; `import ... from './drive.ts'` із явним розширенням `.ts` (потрібно для Node `--experimental-strip-types` у тестах; для Vite/esbuild теж ок).
- **Node type-stripping**: тести запускаються через `node --experimental-strip-types` (Node ≥ 22.6); імпорти між `.ts`-файлами обов'язково з розширенням.
- **Env у build**: `astro:env` не знає про `GOOGLE_*` (вони не в схемі) — `drive.ts` сам підтягує `.env` у `process.env` через `loadEnvFile`.
- **`netlify functions:serve`** на порту 9999, шлях `/.netlify/functions/<name>`; `netlify dev` на 8888 (для повного сайту+функції).
- **`x-data-source: drive|mock`** — заголовок функції, зручно для відладки джерела даних.
- Порти, які перевіряти перед запуском: 4321 (Astro dev), 8787 (setup:google), 9999 (functions:serve).

## Відкриті питання
- **Підключення Drive**: користувач налаштовує OAuth consent screen + redirect URI, потім `npm run setup:google` і `GOOGLE_DRIVE_FOLDER_ID`; після цього перевірити реальний список (`x-data-source: drive`) і оновлення без редеплою.
- **`netlify-cli`** (devDependency, 1290 пакетів) — 9 high-уразливостей у транзитивних залежностях; прийнятно для dev, не запускати `npm audit fix` без потреби.
- Поведінка проданих робіт (приховати vs бейдж) — `SOLD-` зараз виключає зі стосу.
- Метадані робіт (рік, техніка, розмір) — поки лише назва.
- Реальний URL сайту — після деплою (етап 6/7).

## Наступні дії
1. **Етап 3 — головний екран: стек карток (GSAP)**. Дані вже готові: `src/lib/works.ts` (mock зараз, Drive потім), формат `DriveWork` стабільний. Потрібно: WorkCard (main + назва + кнопки «Замовити»/«Купити»), повноекранний скрол ScrollTrigger, бічні точки-індикатор, персистентний футер (FB/IG), стійкість до resize.
2. Пізніше — завершити підключення Drive (кроки вище).