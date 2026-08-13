/**
 * Список робіт для сайту — build і runtime.
 *
 * Джерело даних:
 *  - **Drive налаштовано** (GOOGLE_CLIENT_ID/SECRET + GOOGLE_REFRESH_TOKEN +
 *    GOOGLE_DRIVE_FOLDER_ID) → реальний список із Google Drive;
 *  - **Drive не налаштовано** → тестові роботи з `src/lib/mock-works.ts`
 *    (dev-режим, поки не підключено Google).
 *
 * Обидва шляхи повертають однаковий формат `DriveWork`, тож компоненти
 * (стек карток, лайтбокс, форми) працюють однаково в обох режимах.
 */
import { listWorks, isGoogleConfigured, type DriveWork } from './drive.ts';
import { getMockWorks } from './mock-works.ts';

/** Реальні роботи з Drive, або тестові, якщо Drive не налаштовано. */
async function loadWorks(): Promise<DriveWork[]> {
  if (!isGoogleConfigured()) return getMockWorks();
  return listWorks();
}

// ─── Build-time (кешовано на весь build) ─────────────────────────────────

let cached: DriveWork[] | null = null;
let attempted = false;

/** Build-time список робіт для статичного HTML (SEO). Кешується на весь build (10 локалей). */
export async function getWorksForBuild(): Promise<DriveWork[]> {
  if (attempted) return cached ?? [];
  attempted = true;
  try {
    cached = await loadWorks();
    if (!isGoogleConfigured()) {
      console.warn(
        '[works] Drive не налаштовано — у збірку потрапляють тестові роботи ' +
          '(src/lib/mock-works.ts). Підключіть Drive для реальних даних.',
      );
    }
  } catch (err) {
    console.error('[works] Помилка отримання списку робіт:', (err as Error).message);
    cached = [];
  }
  return cached;
}

// ─── Runtime (без кешу — кожен запит актуальний) ─────────────────────────

/** Runtime-список для Netlify Function `list-works` (актуальний список без редеплою). */
export async function getWorksRuntime(): Promise<DriveWork[]> {
  return loadWorks();
}