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
  /** Приклад портрета в рамці */
  frameInfo: {
    title: string;
    description: string;
    imageAlt: string;
    linkLabel: string;
    backToGallery: string;
  };
  /** Форма «Замовити»/«Купити» (етап 5) */
  form: {
    orderTitle: string;
    buyTitle: string;
    name: string;
    email: string;
    size: string;
    comment: string;
    /** Підпис «Ціна:» перед значенням ціни у формі. */
    price: string;
    /** Виноска з форматом готової роботи; містить {format}. */
    artworkFormat: string;
    /** Пояснення кількості людей у варіанті розміру; містить {count}. */
    peopleHint: string;
    /** Розшифрування цифр кількості людей під варіантами розміру. */
    peopleLegend: string;
    /** Варіант розміру «Свій розмір» (ціна договірна). */
    customSize: string;
    /** Текст ціни для свого розміру: «ціна договірна». */
    negotiablePrice: string;
    /** Поле «Фото» (потрібне для замовлення та точної ціни). */
    photo: string;
    /** Підказка під полем фото: для замовлення та точної ціни треба додати фото. */
    photoHint: string;
    /** Умови оформлення, терміну виконання та доставки. */
    orderNotes: {
      framing: string;
      timing: string;
      shipping: string;
    };
    submitOrder: string;
    buyWithPrice: string; // містить {price}
    success: string;
    error: string;
    required: string;
    /** Email не відповідає структурі (некоректний формат). */
    emailInvalid: string;
  };
}