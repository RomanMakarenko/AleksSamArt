# Хендоф — етап 0: Каркас проєкту ✅

> Наступна сесія починає звідси. Стан: **етап 0 завершено**, наступний — **етап 1 (i18n + конфіг)**.

## Статус етапу
✅ Виконано (12.08.2026). Критерії приймання підтверджені: build, dev, структура, netlify.toml, env.

## Що зроблено
- **Скаффолд Astro вручну** (не через `create-astro`): GitHub недоступний із цієї мережі (`Failed to fetch github.com/withastro/astro/.../examples/minimal`), npm-реєстр працює.
  - Створено еквівалент шаблону `minimal`: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `src/styles/global.css`.
- Залежності: `astro@7.2.1`, `gsap@3.15.0` (`npm install`, 292 пакети, 0 уразливостей).
- Структура за CLAUDE.md (із `.gitkeep`): `src/{components,layouts,pages,i18n,config,lib,styles,functions}`, `scripts/`, `public/`.
- `netlify.toml`: build `npm run build`, publish `dist`, `[functions] directory = "src/functions"`.
- `.gitignore` + `.env.example` (усі env-змінні) + `.env` (локальний).
- `src/config/site.ts` — константи: `SITE`, `SOCIAL_LINKS` (порожні), `CURRENCY='USD'`, `ORDER_SIZES` (A2=300/A3=200/A4=100), `ARTWORK_PRICES={}`, `CONTACT_EMAIL=''`.
- `src/layouts/BaseLayout.astro` — `lang="uk"`, meta, title, футер-заглушка; `index.astro` — тимчасова hero-сторінка.
- `src/styles/global.css` — дизайн-токени (кольори, тінь/радіус картки) + мінімальний reset.

## Як перевірити
- `npm run build` → `dist/index.html`, без помилок (~750 мс).
- `npm run dev` → сервер на http://localhost:4321 (HTTP 200). **Примітка:** Astro 7 запускає dev як daemon: `astro dev stop` — зупинити, `astro dev status` — стан.
- `curl http://localhost:4321` → HTML із `<title>AleksSamArt</title>`, `lang="uk"`.

## Ключові рішення та підводні камені
- **Netlify Functions у `src/functions`** (за структурою CLAUDE.md) — підключено через `netlify.toml` `[functions] directory`. Це знімає відкрите питання «шлях виявлення функцій» з плану.
- **GitHub недоступний** із локальної мережі: `npm create astro` падає. Для всього, що тягне з GitHub, — бути готовим до збою; npm-реєстр працює стабільно.
- **EBADENGINE-попередження**: `undici@8.10.0` вимагає Node ≥22.19.0, стоїть 22.16.0. Поки не впливає на build/dev; якщо з'являться помилки fetch — оновити Node.
- Dev-сервер у фоновому режимі може лишитися запущеним після сесії — перевірити `astro dev status`.
- `SITE`, соцмережі, валюта, email — поки **захардкоджені** в `src/config/site.ts`; підключення env — завдання етапів 1–2.

## Відкриті питання
- Реальний URL сайту (потрібен для `site` у `astro.config.mjs` + sitemap/hreflang) — після деплою (етап 6/7).
- Розміри/ціни та мапа цін готових робіт — чекаємо список від користувача.
- Оновити Node до ≥22.19 — бажано.

## Наступні дії (Етап 1 — Інтернаціоналізація + конфіг)
1. Налаштувати i18n-роутинг Astro: `uk` на `/` (без префікса), решта 9 локалей з префіксом (`/en/`, `/de/`, …).
2. Створити словники `src/i18n/` для 10 локалей (текстів мало — простий словник перекладів).
3. Автовибір мови за `Accept-Language` з фолбеком `uk`.
4. У `src/config` підключити env: `CURRENCY`, `FACEBOOK_URL`/`INSTAGRAM_URL`, `CONTACT_EMAIL`.
5. Після завершення — оновити `PLAN.md` (етап 1 → ✅) і створити `handoffs/HANDOFF-01.md`.