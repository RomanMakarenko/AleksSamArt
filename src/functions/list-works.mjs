// Netlify Function: актуальний список робіт.
//
// GET /.netlify/functions/list-works → JSON:
//   [{ id, name, mainImage, gallery[] }]
//   - назва роботи = назва папки Drive (порядок папок у корені);
//   - роботи з префіксом `SOLD-` виключені;
//   - `mainImage` — головне фото (`00-*`), `gallery` — решта (етапи, ракурси).
//
// Джерело:
//  - Drive налаштовано → реальний список (заголовок `x-data-source: drive`);
//  - Drive не налаштовано → тестові роботи з `src/lib/mock-works.ts`
//    (заголовок `x-data-source: mock`) — dev-режим, доки не підключено Google.
//
// Зображення публічні — браузер вантажить їх напряму (Drive або localhost),
// функція повертає лише список. Секрети Google — з env оточення Netlify.
import { getWorksRuntime } from '../lib/works.ts';
import { isGoogleConfigured, DriveError } from '../lib/drive.ts';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  // Дані публічні. CORS дозволяє dev-порту Astro (:4321) звертатись до функції
  // на локальному сервері Netlify (:8888) на етапах 3–5.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // Актуальний список: зміни в Drive видно без редеплою.
  'Cache-Control': 'no-store',
};

export default async function handler(req) {
  // Preflight для CORS (GET без кастомних заголовків — простий запит, але хай буде).
  if (req && req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  try {
    const works = await getWorksRuntime();
    const source = isGoogleConfigured() ? 'drive' : 'mock';
    return new Response(JSON.stringify(works), {
      status: 200,
      headers: { ...JSON_HEADERS, 'x-data-source': source },
    });
  } catch (err) {
    console.error('[list-works]', err);
    const message = err instanceof DriveError ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: err instanceof DriveError && err.status ? err.status : 500,
      headers: JSON_HEADERS,
    });
  }
}