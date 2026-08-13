import type { Dictionary } from './dictionary';

export const uk: Dictionary = {
  meta: {
    description:
      'Портфоліо художника AleksSamArt: замовити індивідуальну картину або купити готову роботу.',
  },
  hero: {
    tagline: 'Портфоліо художника AleksSamArt',
    subtitle: 'Індивідуальне замовлення картини або купівля готової роботи.',
  },
  langSwitcher: {
    label: 'Мова',
  },
  footer: {
    rights: 'Всі права захищено',
  },
  work: {
    orderButton: 'Замовити',
    buyButton: 'Купити',
    soldBadge: 'Продано',
  },
  dots: {
    label: 'Навігація по роботах',
  },
  lightbox: {
    close: 'Закрити',
    prev: 'Попереднє фото',
    next: 'Наступне фото',
    open: 'Відкрити фото: {work}',
    counter: '{current} / {total}',
  },
  form: {
    orderTitle: 'Замовити картину',
    buyTitle: 'Купити готову роботу',
    name: "Ім'я",
    email: 'Email',
    size: 'Розмір',
    comment: 'Коментар',
    submitOrder: 'Надіслати замовлення',
    buyWithPrice: 'Купити за {price}',
    success:
      'Дякуємо! Ваше замовлення надіслано. З вами зв’яжуться найближчим часом.',
    error: 'Не вдалося надіслати форму. Спробуйте ще раз.',
    required: "Будь ласка, заповніть обов'язкові поля: ім'я та email.",
  },
};