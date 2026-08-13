/**
 * Спільна логіка доступу до Google Drive.
 *
 * Використовується двома шляхами:
 *  - **runtime**: Netlify Function `src/functions/list-works.mjs` (актуальний список);
 *  - **build**: вшивання списку робіт у статичний HTML при `astro build` (SEO) —
 *    через `getWorksForBuild()` у `src/lib/works.ts`.
 *
 * Ніяких залежностей на Astro/googleapis — тільки Node (`process.env`, глобальний `fetch`),
 * щоб Netlify бандлив функцію окремо від Astro.
 *
 * Секрети читаються з оточення:
 * `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`.
 * Локально, якщо змінні відсутні у `process.env`, підвантажується `.env`
 * (не перезаписуючи вже задані значення).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Типи ────────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

/** Робота для сайту: назва = назва папки Drive, зображення — публічні URL. */
export interface DriveWork {
  /** ID папки роботи у Drive (стабільний ідентифікатор). */
  id: string;
  /** Назва роботи = назва папки (без префікса `SOLD-`). */
  name: string;
  /** URL головного фото (файл `00-*`), або перше зображення, якщо `00-` немає. */
  mainImage: string | null;
  /** URL додаткових фото: етапи (`01-*`), ракурси (`02-*`), … */
  gallery: string[];
}

// ─── Константи ───────────────────────────────────────────────────────────

/** Префікс папки проданої роботи: `SOLD-Назва` → виключається зі стосу. */
export const SOLD_PREFIX = 'SOLD-';

/** Префікс головного зображення в папці роботи. */
export const MAIN_FILE_PREFIX = '00-';

/** MIME-тип папки Google Drive. */
const FOLDER_MIME = 'application/vnd.google-apps.folder';

/** Публічна адреса перегляду файлу Drive (для `<img src>` / посилання). */
export function driveImageUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
}

// ─── Конфігурація та env ─────────────────────────────────────────────────

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
}

let dotEnvLoaded = false;

/**
 * Підвантажує локальний `.env` у `process.env`, якщо змінні ще не задані.
 * На Netlify `.env` немає — значення приходять з оточення, тут просто no-op.
 */
function ensureDotEnv(): void {
  if (dotEnvLoaded) return;
  dotEnvLoaded = true;

  // Node ≥ 21.7: вбудований завантажувач .env (не перезаписує задані змінні).
  const loader = (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile;
  if (typeof loader === 'function') {
    try {
      loader();
      return;
    } catch {
      // .env відсутній (наприклад, на Netlify) — не критично.
    }
  }

  // Fallback для старих Node: простий парсер `.env`.
  try {
    const content = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue;
      let value = raw.trim();
      if (value.length >= 2) {
        const quote = value[0];
        if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
          value = value.slice(1, -1);
        }
      }
      process.env[key] = value;
    }
  } catch {
    // немає `.env` — покладаємось на оточення
  }
}

/** Читає Google-конфіг із оточення (з підтягуванням локального `.env`). */
export function getGoogleConfig(): GoogleConfig {
  ensureDotEnv();
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() ?? '',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim() ?? '',
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ?? '',
  };
}

/** Чи задані всі змінні, потрібні для роботи з Drive. */
export function isGoogleConfigured(cfg: GoogleConfig = getGoogleConfig()): boolean {
  return Boolean(cfg.clientId && cfg.clientSecret && cfg.refreshToken && cfg.folderId);
}

// ─── Помилка ─────────────────────────────────────────────────────────────

export class DriveError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DriveError';
    this.status = status;
  }
}

// ─── OAuth ───────────────────────────────────────────────────────────────

/** Обмінює refresh token на короткочасний access token (використовує публічний Google Drive API). */
export async function getAccessToken(cfg: GoogleConfig): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new DriveError(`OAuth token: ${res.status} ${await res.text()}`, res.status);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new DriveError('OAuth token: відповідь без access_token');
  }
  return data.access_token;
}

// ─── Drive Files API ─────────────────────────────────────────────────────

/** GET /drive/v3/files з підтримкою пагінації. */
async function driveList(token: string, params: Record<string, string>): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | null = null;

  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new DriveError(`Drive API: ${res.status} ${await res.text()}`, res.status);
    }
    const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
    if (data.files) files.push(...data.files);
    pageToken = data.nextPageToken ?? null;
  } while (pageToken);

  return files;
}

/** Папки в кореневій папці робіт (порядок — за назвою, як у `orderBy=name`). */
export async function listRootFolders(token: string, rootFolderId: string): Promise<DriveFile[]> {
  return driveList(token, {
    q: `'${rootFolderId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`,
    fields: 'files(id,name,mimeType)',
    orderBy: 'name',
    pageSize: '1000',
  });
}

/** Файли в папці роботи (без вкладених папок). */
export async function listWorkFiles(token: string, workFolderId: string): Promise<DriveFile[]> {
  return driveList(token, {
    q: `'${workFolderId}' in parents and mimeType!='${FOLDER_MIME}' and trashed=false`,
    fields: 'files(id,name,mimeType)',
    orderBy: 'name',
  });
}

// ─── Розбір та фільтри ───────────────────────────────────────────────────

/** Робота продана, якщо назва папки починається з `SOLD-`. */
export function isSold(folderName: string): boolean {
  return folderName.startsWith(SOLD_PREFIX);
}

/** Назва роботи без префікса `SOLD-` (для майбутнього бейджа «Продано»). */
export function cleanWorkName(folderName: string): string {
  return folderName.startsWith(SOLD_PREFIX) ? folderName.slice(SOLD_PREFIX.length) : folderName;
}

/** Чи є файл головним зображенням (префікс `00-`). */
export function isMainFile(fileName: string): boolean {
  return fileName.startsWith(MAIN_FILE_PREFIX);
}

/**
 * Розділяє файли папки на головне фото та галерею.
 * - Головне — файл `00-*`; якщо такого немає, перше зображення за порядком.
 * - Галерея — решта зображень (етапи `01-*`, ракурси `02-*`, …) за порядком назв.
 * - Не-зображення (README тощо) ігноруються.
 */
export function parseWorkFiles(
  files: DriveFile[],
): { mainImage: DriveFile | null; gallery: DriveFile[] } {
  const images = files
    .filter((f) => f.mimeType.startsWith('image/'))
    .sort((a, b) => naturalCompare(a.name, b.name));
  const main = images.find((f) => isMainFile(f.name)) ?? images[0] ?? null;
  return {
    mainImage: main,
    gallery: images.filter((f) => f !== main),
  };
}

/** Природне сортування за назвою (числа всередині назв — як числа: 2 < 10). */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// ─── Оркестрація ─────────────────────────────────────────────────────────

/** Обробка списку папок з обмеженням конкурентності (не спамити Drive API). */
async function mapConcurrent<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

/**
 * Список робіт для сайту: порядок папок у корені (за назвою), `SOLD-*` виключені.
 * Кожна робота: назва папки + URL головного фото та галереї.
 */
export async function listWorks(cfg: GoogleConfig = getGoogleConfig()): Promise<DriveWork[]> {
  if (!isGoogleConfigured(cfg)) {
    throw new DriveError(
      'Google Drive не налаштовано: задайте GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ' +
        'GOOGLE_REFRESH_TOKEN (npm run setup:google) і GOOGLE_DRIVE_FOLDER_ID ' +
        '(див. `.env.example`).',
    );
  }

  const token = await getAccessToken(cfg);
  const folders = (await listRootFolders(token, cfg.folderId)).sort((a, b) =>
    naturalCompare(a.name, b.name),
  );

  const works = await mapConcurrent(folders, 8, async (folder): Promise<DriveWork | null> => {
    if (isSold(folder.name)) return null; // SOLD-фільтр
    const files = await listWorkFiles(token, folder.id);
    const { mainImage, gallery } = parseWorkFiles(files);
    return {
      id: folder.id,
      name: folder.name,
      mainImage: mainImage ? driveImageUrl(mainImage.id) : null,
      gallery: gallery.map((f) => driveImageUrl(f.id)),
    };
  });

  return works.filter((w): w is DriveWork => w !== null);
}