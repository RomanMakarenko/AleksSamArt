/**
 * Словник перекладів — єдине місце текстів на сайті.
 * Всі переклади — тут, у розмітці тексту немає.
 * Назви робіт НЕ перекладаються — беруться з назв папок Google Drive.
 */

export interface Dictionary {
  /** Meta/SEO */
  meta: {
    description: string;
    keywords: string;
  };
  /** Головний екран */
  hero: {
    tagline: string;
    subtitle: string;
  };
  /** Екран «Про автора» (текст з text.txt) */
  about: {
    heading: string;
    p1: string;
    p2: string;
    p3: string;
    cta: string;
  };
  /** Перемикач мови */
  langSwitcher: {
    label: string;
  };
  /** Футер */
  footer: {
    rights: string;
  };
  /** Кнопки робіт (етап 3) */
  work: {
    orderButton: string;
    buyButton: string;
    soldBadge: string;
    /** Бейдж «Замовлення» на картці роботи клієнта (префікс `ORDER-` у папці). */
    orderBadge: string;
  };
  /** Точки-індикатор (етап 3) */
  dots: {
    label: string;
  };
  /** Лайтбокс (етап 4) */
  lightbox: {
    close: string;
    prev: string;
    next: string;
    /** aria-label тригера (рамки картки): «відкрити фото: {work}» */
    open: string;
    /** Лічильник фото: «{current} / {total}» */
    counter: string;
  };
  /** Форма «Замовити»/«Купити» (етап 5) */
  form: {
    orderTitle: string;
    buyTitle: string;
    name: string;
    email: string;
    size: string;
    comment: string;
    submitOrder: string;
    buyWithPrice: string; // містить {price}
    success: string;
    error: string;
    required: string;
  };
}