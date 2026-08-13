/**
 * Тестові роботи для розробки БЕЗ Google Drive.
 *
 * Використовуються, коли Drive не налаштовано (немає GOOGLE_REFRESH_TOKEN /
 * GOOGLE_DRIVE_FOLDER_ID): і build, і Netlify Function повертають цей список,
 * щоб етапи 3–5 (стек карток, лайтбокс, форми) розроблялись без Google.
 *
 * Формат даних — ідентичний `DriveWork` (що приходить із Drive), тому перехід
 * на реальний Drive не потребує змін у жодному компоненті.
 *
 * ⚠️ ТИМЧАСОВО: коли підключите Drive — цей файл можна видалити (або просто
 * заповнити env-змінні, і mock перестане використовуватись).
 *
 * Як замінити на власні тестові фото:
 *   1. Покладіть файли у `public/test-works/`.
 *   2. Оновіть масиви `gallery` нижче (головне фото — `mainImage`).
 */
import type { DriveWork } from './drive.ts';

const MOCK_WORKS: DriveWork[] = [
  {
    id: 'mock-ave-maria',
    name: 'Ave Maria',
    mainImage: '/test-works/ave-maria.svg',
    gallery: ['/test-works/ave-maria-stage.svg', '/test-works/ave-maria-detail.svg'],
  },
  {
    id: 'mock-more',
    name: 'Море',
    mainImage: '/test-works/more.svg',
    gallery: ['/test-works/more-detail.svg'],
  },
  {
    id: 'mock-sunset',
    name: 'Захід сонця',
    mainImage: '/test-works/sunset.svg',
    gallery: [],
  },
];

/** Список тестових робіт (без кешу — це статичні дані). */
export function getMockWorks(): DriveWork[] {
  return MOCK_WORKS;
}