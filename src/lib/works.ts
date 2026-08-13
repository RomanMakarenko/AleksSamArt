/**
 * Список робіт для сайту — build-time.
 *
 * Джерело даних — локальні папки `src/assets/works/` (статично, без Google
 * Drive): сканування на build-етапі + оптимізація зображень (`astro:assets`).
 * Кешується на весь build, щоб 10 локалей не сканували папки 10 разів.
 */
import { getLocalWorks, type Work } from './local-works.ts';

export type { Work } from './local-works.ts';

let cached: Work[] | null = null;
let attempted = false;

/** Build-time список робіт для статичного HTML (SEO). Кешується на весь build. */
export async function getWorksForBuild(): Promise<Work[]> {
  if (attempted) return cached ?? [];
  attempted = true;
  try {
    cached = await getLocalWorks();
  } catch (err) {
    console.error('[works] Помилка отримання списку робіт:', (err as Error).message);
    cached = [];
  }
  return cached;
}