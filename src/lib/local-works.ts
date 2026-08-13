/**
 * Локальні роботи — статичний список із папок у проєкті (замість Google Drive).
 *
 * Структура на диску (папка на роботу):
 *
 *   src/assets/works/
 *   └── <назва роботи>/
 *       ├── <name>-1.jpg        # головне фото — «зображення з номером 1»
 *       ├── <name>-2.jpg        # галерея (етапи, ракурси) — в лайтбоксі
 *       └── ...
 *
 * Конвенції:
 *  - **Папка = робота**: назва роботи = назва папки (не перекладається).
 *  - **Головне фото** — файл із числом `1` у кінці назви (`*-1.*`);
 *    якщо такого немає — перше зображення за сортуванням.
 *  - Решта зображень — галерея (етапи, ракурси), показується в лайтбоксі.
 *  - **Порядок робіт у скролі** = порядок додавання; задається списком
 *    `WORKS_ORDER` у `src/config/works-order.ts` (нова робота — у кінець списку).
 *  - **Продана робота** — папка з префіксом `SOLD-` → виключається зі стосу.
 *  - **Замовлення** (робота клієнта) — папка з префіксом `ORDER-` → у стосі,
 *    але з бейджем «Замовлення» (перекладається) та унікальною назвою без префікса.
 *  - Зображення оптимізуються при build (`astro:assets`): WebP, до 2048px.
 *
 * Сканування й оптимізація відбуваються на build-етапі (`import.meta.glob`),
 * тож у HTML потрапляють готові URL оптимізованих файлів. Компоненти
 * (стек карток, лайтбокс, форми) працюють із тим самим форматом `Work`,
 * що й раніше з Drive, тому змін у відображенні немає.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { WORKS_ORDER } from '../config/works-order';

/** Робота для сайту: назва папки + оптимізовані URL зображень. */
export interface Work {
  /** Стабільний ідентифікатор (назва папки). */
  id: string;
  /** Назва роботи = назва папки (без префіксів `SOLD-` / `ORDER-`). */
  name: string;
  /** Робота клієнта (попереднє замовлення): показуємо бейдж «Замовлення». */
  isOrder: boolean;
  /** URL головного фото (оптимізоване на build). */
  mainImage: string | null;
  /** Маленьке прев'ю головного фото — фон-колаж інтро-екрана (легка вага). */
  thumb: string | null;
  /** URL додаткових фото: етапи, ракурси (в лайтбоксі). */
  gallery: string[];
}

/** Префікс папки проданої роботи: `SOLD-Назва` → виключається зі стосу. */
export const SOLD_PREFIX = 'SOLD-';

/** Префікс папки замовлення: `ORDER-Назва` → у стосі, з бейджем «Замовлення». */
export const ORDER_PREFIX = 'ORDER-';

/** Ширина, до якої обмежуємо зображення (повноекран картка + лайтбокс). */
const MAX_WIDTH = 2048;
/** Ширина мініатюри для фону-колажу інтро-екрана (маленька, щоб не тягнути важкі). */
const THUMB_WIDTH = 420;
/** Формат та якість оптимізованих зображень. */
const IMAGE_FORMAT = 'webp' as const;
const IMAGE_QUALITY = 80;

// Всі зображення робіт на build-етапі (Vite glob; `eager` → ImageMetadata).
// Примітка: патерн — відносно модуля (`../assets/...`): Vite не резолвить `../../`.
const imageModules = import.meta.glob<ImageMetadata>(
  '../assets/works/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, import: 'default' },
);

interface WorkFile {
  /** Ім'я файлу (з розширенням). */
  fileName: string;
  /** Метадані зображення для оптимізації. */
  img: ImageMetadata;
}

/** Число в кінці назви файлу (`RobbieWilliams-1.jpg` → 1), або null. */
function trailingNumber(fileName: string): number | null {
  const base = fileName.replace(/\.[^.]+$/, '');
  const match = base.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

/** Природне сортування за назвою (числа всередині назв — як числа: 2 < 10). */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/** Індекс роботи в `WORKS_ORDER` (порядок додавання); не перелічені — після всіх. */
function workOrder(name: string): number {
  const i = WORKS_ORDER.indexOf(name);
  return i === -1 ? WORKS_ORDER.length : i;
}

/** Угруповує зображення по папках робіт (назва роботи = назва папки). */
function groupByWork(): Map<string, WorkFile[]> {
  const groups = new Map<string, WorkFile[]>();
  for (const [path, img] of Object.entries(imageModules)) {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1] ?? '';
    const name = parts.slice(0, -1).join('/').split('/').pop() ?? '';
    const files = groups.get(name) ?? [];
    files.push({ fileName, img });
    groups.set(name, files);
  }
  return groups;
}

/** Оптимізований URL зображення (WebP, до `width` пікселів). */
async function optimize(img: ImageMetadata, width: number): Promise<string> {
  const target = Math.min(img.width, width);
  const { src } = await getImage({ src: img, width: target, format: IMAGE_FORMAT, quality: IMAGE_QUALITY });
  return src;
}

/**
 * Список робіт для сайту: порядок папок за назвою, `SOLD-*` виключені.
 * Головне фото — `*-1.*` (або перше за сортуванням), решта — галерея.
 */
export async function getLocalWorks(): Promise<Work[]> {
  const groups = [...groupByWork().entries()]
    .filter(([name]) => !name.startsWith(SOLD_PREFIX))
    .sort(([a], [b]) => workOrder(a) - workOrder(b) || naturalCompare(a, b));

  const works: Work[] = [];
  for (const [name, files] of groups) {
    const sorted = [...files].sort((a, b) => naturalCompare(a.fileName, b.fileName));
    if (sorted.length === 0) continue;

    const mainIndex = sorted.findIndex((f) => trailingNumber(f.fileName) === 1);
    const main = sorted[mainIndex >= 0 ? mainIndex : 0];
    const gallery = sorted.filter((f) => f !== main);

    // Головне фото — у двох розмірах: повне (картка/лайтбокс) і маленьке
    // прев'ю `thumb` для фону-колажу інтро-екрана.
    const mainImage = await optimize(main.img, MAX_WIDTH);
    const thumb = await optimize(main.img, THUMB_WIDTH);
    const optimizedGallery = await Promise.all(gallery.map((f) => optimize(f.img, MAX_WIDTH)));

    // `ORDER-` у назві папки → це замовлення: префікс прибираємо з назви,
    // прапорець лишаємо — на картці з'явиться бейдж «Замовлення».
    const isOrder = name.startsWith(ORDER_PREFIX);
    const displayName = isOrder ? name.slice(ORDER_PREFIX.length) : name;

    works.push({ id: name, name: displayName, isOrder, mainImage, thumb, gallery: optimizedGallery });
  }
  return works;
}